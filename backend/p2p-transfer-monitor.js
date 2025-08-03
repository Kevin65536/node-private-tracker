#!/usr/bin/env node

/**
 * P2P传输监控工具
 * 用于分析和监控BitTorrent协议中的piece传输情况
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bncode = require('bncode');

class P2PTransferMonitor {
  constructor() {
    this.activeTorrents = new Map(); // info_hash -> torrent info
    this.pieceProgress = new Map();  // info_hash -> piece status
    this.peerConnections = new Map(); // info_hash -> peer list
    this.transferStats = new Map();   // info_hash -> transfer statistics
  }

  /**
   * 注册要监控的种子
   */
  registerTorrent(torrentFilePath) {
    try {
      const torrentData = fs.readFileSync(torrentFilePath);
      const torrent = bncode.decode(torrentData);
      
      // 计算info_hash
      const infoHash = crypto.createHash('sha1')
        .update(bncode.encode(torrent.info))
        .digest('hex');

      const pieceLength = torrent.info['piece length'];
      const totalLength = torrent.info.length || 
        torrent.info.files?.reduce((sum, file) => sum + file.length, 0);
      const pieceCount = Math.ceil(totalLength / pieceLength);
      
      // 解析pieces哈希
      const piecesBuffer = torrent.info.pieces;
      const pieceHashes = [];
      for (let i = 0; i < piecesBuffer.length; i += 20) {
        pieceHashes.push(piecesBuffer.slice(i, i + 20).toString('hex'));
      }

      const torrentInfo = {
        name: torrent.info.name.toString(),
        infoHash,
        totalLength,
        pieceLength,
        pieceCount,
        pieceHashes,
        announce: torrent.announce?.toString(),
        announceList: torrent['announce-list']?.map(tier => 
          tier.map(url => url.toString())
        )
      };

      this.activeTorrents.set(infoHash, torrentInfo);
      
      // 初始化piece状态 (0=未下载, 1=下载中, 2=已完成)
      const pieceStatus = new Array(pieceCount).fill(0);
      this.pieceProgress.set(infoHash, pieceStatus);
      
      // 初始化传输统计
      this.transferStats.set(infoHash, {
        downloaded: 0,
        uploaded: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        peers: 0,
        seeders: 0,
        leechers: 0,
        completedPieces: 0,
        availability: 0
      });

      console.log(`✅ 已注册种子监控: ${torrentInfo.name}`);
      console.log(`   Info Hash: ${infoHash}`);
      console.log(`   总大小: ${this.formatBytes(totalLength)}`);
      console.log(`   Piece数量: ${pieceCount} (每个${this.formatBytes(pieceLength)})`);
      
      return infoHash;
    } catch (error) {
      console.error(`❌ 注册种子失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 模拟Peer连接和piece传输
   */
  simulatePeerConnection(infoHash, peerId, peerInfo) {
    if (!this.peerConnections.has(infoHash)) {
      this.peerConnections.set(infoHash, new Map());
    }
    
    const peers = this.peerConnections.get(infoHash);
    peers.set(peerId, {
      ...peerInfo,
      connectedAt: new Date(),
      downloadedPieces: new Set(),
      uploadedPieces: new Set(),
      currentDownloading: new Set(),
      downloadSpeed: 0,
      uploadSpeed: 0
    });

    console.log(`🔗 Peer连接: ${peerId} (${peerInfo.ip}:${peerInfo.port})`);
    this.updatePeerStats(infoHash);
  }

  /**
   * 模拟piece下载完成
   */
  completePiece(infoHash, pieceIndex, peerId = null) {
    const pieceStatus = this.pieceProgress.get(infoHash);
    const torrent = this.activeTorrents.get(infoHash);
    
    if (!pieceStatus || !torrent) {
      console.error(`❌ 未知的种子: ${infoHash}`);
      return;
    }

    if (pieceIndex >= pieceStatus.length) {
      console.error(`❌ 无效的piece索引: ${pieceIndex}`);
      return;
    }

    if (pieceStatus[pieceIndex] === 2) {
      console.log(`⚠️  Piece ${pieceIndex} 已经完成`);
      return;
    }

    // 标记为已完成
    pieceStatus[pieceIndex] = 2;
    
    // 更新peer统计
    if (peerId && this.peerConnections.has(infoHash)) {
      const peers = this.peerConnections.get(infoHash);
      const peer = peers.get(peerId);
      if (peer) {
        peer.downloadedPieces.add(pieceIndex);
        peer.currentDownloading.delete(pieceIndex);
      }
    }

    // 计算进度
    const completed = pieceStatus.filter(status => status === 2).length;
    const progress = (completed / pieceStatus.length * 100).toFixed(2);
    
    console.log(`✅ Piece ${pieceIndex} 下载完成 (进度: ${progress}%)`);
    
    // 更新统计
    this.updateTransferStats(infoHash);
    
    // 检查是否完成
    if (completed === pieceStatus.length) {
      console.log(`🎉 种子下载完成: ${torrent.name}`);
      this.onTorrentCompleted(infoHash);
    }
  }

  /**
   * 模拟piece开始下载
   */
  startPieceDownload(infoHash, pieceIndex, peerId) {
    const pieceStatus = this.pieceProgress.get(infoHash);
    
    if (!pieceStatus) {
      console.error(`❌ 未知的种子: ${infoHash}`);
      return;
    }

    if (pieceStatus[pieceIndex] !== 0) {
      console.log(`⚠️  Piece ${pieceIndex} 不可下载 (状态: ${pieceStatus[pieceIndex]})`);
      return;
    }

    pieceStatus[pieceIndex] = 1; // 标记为下载中
    
    // 更新peer状态
    if (this.peerConnections.has(infoHash)) {
      const peers = this.peerConnections.get(infoHash);
      const peer = peers.get(peerId);
      if (peer) {
        peer.currentDownloading.add(pieceIndex);
      }
    }

    console.log(`⬇️  开始下载 Piece ${pieceIndex} (从 ${peerId})`);
  }

  /**
   * 显示种子的详细状态
   */
  showTorrentStatus(infoHash) {
    const torrent = this.activeTorrents.get(infoHash);
    const pieceStatus = this.pieceProgress.get(infoHash);
    const stats = this.transferStats.get(infoHash);
    const peers = this.peerConnections.get(infoHash);

    if (!torrent || !pieceStatus || !stats) {
      console.error(`❌ 种子不存在: ${infoHash}`);
      return;
    }

    console.log(`\n📊 种子状态: ${torrent.name}`);
    console.log(`Info Hash: ${infoHash}`);
    console.log(`总大小: ${this.formatBytes(torrent.totalLength)}`);
    
    // 进度统计
    const completed = pieceStatus.filter(s => s === 2).length;
    const downloading = pieceStatus.filter(s => s === 1).length;
    const pending = pieceStatus.filter(s => s === 0).length;
    const progress = (completed / pieceStatus.length * 100).toFixed(2);
    
    console.log(`\n📈 下载进度:`);
    console.log(`  完成: ${completed}/${pieceStatus.length} pieces (${progress}%)`);
    console.log(`  下载中: ${downloading} pieces`);
    console.log(`  待下载: ${pending} pieces`);
    
    // 传输统计
    console.log(`\n🔄 传输统计:`);
    console.log(`  下载: ${this.formatBytes(stats.downloaded)}`);
    console.log(`  上传: ${this.formatBytes(stats.uploaded)}`);
    console.log(`  下载速度: ${this.formatBytes(stats.downloadSpeed)}/s`);
    console.log(`  上传速度: ${this.formatBytes(stats.uploadSpeed)}/s`);
    
    // Peer信息
    console.log(`\n👥 Peer信息:`);
    console.log(`  连接数: ${peers ? peers.size : 0}`);
    console.log(`  种子: ${stats.seeders}`);
    console.log(`  下载者: ${stats.leechers}`);
    
    // Piece地图 (显示前50个piece的状态)
    console.log(`\n🗺️  Piece地图 (前50个):`);
    const mapSymbols = { 0: '⬜', 1: '🟨', 2: '🟩' };
    const pieceMap = pieceStatus.slice(0, 50)
      .map(status => mapSymbols[status])
      .join('');
    console.log(`  ${pieceMap}`);
    console.log(`  ⬜ 待下载  🟨 下载中  🟩 已完成`);
    
    // 显示当前活跃的peer
    if (peers && peers.size > 0) {
      console.log(`\n🔗 活跃Peer:`);
      peers.forEach((peer, peerId) => {
        const downloading = Array.from(peer.currentDownloading);
        const downloadCount = peer.downloadedPieces.size;
        console.log(`  ${peerId}: ${peer.ip}:${peer.port} (已下载:${downloadCount}, 下载中:[${downloading.join(',')}])`);
      });
    }
  }

  /**
   * 显示所有种子概览
   */
  showOverview() {
    console.log(`\n📋 种子监控概览 (共${this.activeTorrents.size}个种子)`);
    console.log('─'.repeat(80));
    
    this.activeTorrents.forEach((torrent, infoHash) => {
      const pieceStatus = this.pieceProgress.get(infoHash);
      const stats = this.transferStats.get(infoHash);
      const peers = this.peerConnections.get(infoHash);
      
      const completed = pieceStatus.filter(s => s === 2).length;
      const progress = (completed / pieceStatus.length * 100).toFixed(1);
      
      console.log(`${torrent.name}`);
      console.log(`  进度: ${progress}% | Peers: ${peers ? peers.size : 0} | ⬇️ ${this.formatBytes(stats.downloadSpeed)}/s`);
    });
  }

  /**
   * 更新传输统计
   */
  updateTransferStats(infoHash) {
    const torrent = this.activeTorrents.get(infoHash);
    const pieceStatus = this.pieceProgress.get(infoHash);
    const stats = this.transferStats.get(infoHash);
    
    if (!torrent || !pieceStatus || !stats) return;
    
    const completed = pieceStatus.filter(s => s === 2).length;
    stats.completedPieces = completed;
    stats.downloaded = completed * torrent.pieceLength;
    
    // 计算可用性 (简化版)
    stats.availability = (completed / pieceStatus.length).toFixed(3);
  }

  /**
   * 更新peer统计
   */
  updatePeerStats(infoHash) {
    const peers = this.peerConnections.get(infoHash);
    const stats = this.transferStats.get(infoHash);
    
    if (!peers || !stats) return;
    
    stats.peers = peers.size;
    // 这里可以根据实际peer状态计算seeders和leechers
    stats.seeders = Array.from(peers.values()).filter(p => p.downloadedPieces.size > 0).length;
    stats.leechers = peers.size - stats.seeders;
  }

  /**
   * 种子完成回调
   */
  onTorrentCompleted(infoHash) {
    const torrent = this.activeTorrents.get(infoHash);
    const stats = this.transferStats.get(infoHash);
    
    console.log(`\n🎊 种子下载完成!`);
    console.log(`名称: ${torrent.name}`);
    console.log(`大小: ${this.formatBytes(torrent.totalLength)}`);
    console.log(`总下载: ${this.formatBytes(stats.downloaded)}`);
    console.log(`Piece数量: ${torrent.pieceCount}`);
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成测试场景
   */
  runTestScenario() {
    console.log('🧪 开始P2P传输测试场景...\n');
    
    // 创建测试种子文件
    const testTorrentPath = this.createTestTorrent();
    
    // 注册种子
    const infoHash = this.registerTorrent(testTorrentPath);
    if (!infoHash) return;
    
    // 模拟peer连接
    this.simulatePeerConnection(infoHash, 'peer1', { ip: '192.168.1.100', port: 6881 });
    this.simulatePeerConnection(infoHash, 'peer2', { ip: '192.168.1.101', port: 6881 });
    this.simulatePeerConnection(infoHash, 'peer3', { ip: '192.168.1.102', port: 6881 });
    
    // 显示初始状态
    this.showTorrentStatus(infoHash);
    
    // 模拟下载过程
    console.log('\n🔄 开始模拟piece下载...');
    
    const torrent = this.activeTorrents.get(infoHash);
    const totalPieces = torrent.pieceCount;
    
    // 随机下载pieces
    const downloadSequence = Array.from({length: Math.min(10, totalPieces)}, (_, i) => i)
      .sort(() => Math.random() - 0.5); // 随机排序
    
    downloadSequence.forEach((pieceIndex, i) => {
      setTimeout(() => {
        const peerId = ['peer1', 'peer2', 'peer3'][i % 3];
        this.startPieceDownload(infoHash, pieceIndex, peerId);
        
        // 1秒后完成下载
        setTimeout(() => {
          this.completePiece(infoHash, pieceIndex, peerId);
        }, 1000);
      }, i * 500);
    });
    
    // 5秒后显示最终状态
    setTimeout(() => {
      console.log('\n📊 最终状态:');
      this.showTorrentStatus(infoHash);
      this.showOverview();
    }, downloadSequence.length * 500 + 2000);
  }

  /**
   * 创建测试种子文件
   */
  createTestTorrent() {
    const fileName = 'test-video.mp4';
    const fileSize = 1024 * 1024 * 100; // 100MB
    const pieceLength = 32768; // 32KB
    const pieceCount = Math.ceil(fileSize / pieceLength);
    
    // 生成模拟的pieces哈希
    const pieces = [];
    for (let i = 0; i < pieceCount; i++) {
      const hash = crypto.createHash('sha1')
        .update(`piece_${i}_data`)
        .digest();
      pieces.push(hash);
    }
    
    const torrent = {
      announce: Buffer.from('http://172.21.134.69:3001/tracker/announce/test123'),
      info: {
        name: Buffer.from(fileName),
        length: fileSize,
        'piece length': pieceLength,
        pieces: Buffer.concat(pieces)
      }
    };
    
    const torrentPath = path.join(__dirname, 'test-data', 'test-monitor.torrent');
    
    // 确保目录存在
    const dir = path.dirname(torrentPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(torrentPath, bncode.encode(torrent));
    console.log(`📁 创建测试种子: ${torrentPath}`);
    
    return torrentPath;
  }
}

// 命令行接口
if (require.main === module) {
  const monitor = new P2PTransferMonitor();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      monitor.runTestScenario();
      break;
      
    case 'monitor':
      const torrentFile = args[1];
      if (!torrentFile) {
        console.error('用法: node p2p-transfer-monitor.js monitor <torrent文件路径>');
        process.exit(1);
      }
      const infoHash = monitor.registerTorrent(torrentFile);
      if (infoHash) {
        monitor.showTorrentStatus(infoHash);
      }
      break;
      
    default:
      console.log('P2P传输监控工具');
      console.log('');
      console.log('用法:');
      console.log('  node p2p-transfer-monitor.js test          # 运行测试场景');
      console.log('  node p2p-transfer-monitor.js monitor <torrent>  # 监控指定种子');
      console.log('');
      console.log('示例:');
      console.log('  node p2p-transfer-monitor.js test');
      console.log('  node p2p-transfer-monitor.js monitor test-data/sample.torrent');
  }
}

module.exports = P2PTransferMonitor;

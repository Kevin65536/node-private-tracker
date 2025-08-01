const bencode = require('bncode');
const { Peer, Torrent, AnnounceLog, UserStats } = require('../models');
const { validatePasskey } = require('../utils/passkey');

/**
 * Peer 管理器 - 内存存储活跃 peer
 */
class PeerManager {
  constructor() {
    this.peers = new Map(); // key: info_hash, value: Map of peers
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredPeers();
    }, 30000); // 每30秒清理过期 peer
  }

  /**
   * 添加或更新 peer
   */
  addPeer(infoHash, peer) {
    if (!this.peers.has(infoHash)) {
      this.peers.set(infoHash, new Map());
    }
    
    const torrentPeers = this.peers.get(infoHash);
    const peerKey = `${peer.user_id}-${peer.peer_id}`;
    
    torrentPeers.set(peerKey, {
      ...peer,
      last_announce: Date.now()
    });
  }

  /**
   * 移除 peer
   */
  removePeer(infoHash, userId, peerId) {
    if (!this.peers.has(infoHash)) return;
    
    const torrentPeers = this.peers.get(infoHash);
    const peerKey = `${userId}-${peerId}`;
    torrentPeers.delete(peerKey);
    
    if (torrentPeers.size === 0) {
      this.peers.delete(infoHash);
    }
  }

  /**
   * 获取种子的所有 peer
   */
  getPeers(infoHash, excludeUserId = null) {
    if (!this.peers.has(infoHash)) return [];
    
    const torrentPeers = this.peers.get(infoHash);
    const peers = [];
    
    for (const peer of torrentPeers.values()) {
      if (excludeUserId && peer.user_id === excludeUserId) continue;
      peers.push(peer);
    }
    
    return peers;
  }

  /**
   * 获取种子统计信息
   */
  getTorrentStats(infoHash) {
    const peers = this.getPeers(infoHash);
    const seeders = peers.filter(p => p.left === 0).length;
    const leechers = peers.filter(p => p.left > 0).length;
    
    return {
      complete: seeders,
      incomplete: leechers,
      downloaded: 0 // 这个值需要从数据库获取
    };
  }

  /**
   * 清理过期的 peer (超过2分钟未 announce)
   */
  cleanupExpiredPeers() {
    const now = Date.now();
    const timeout = 2 * 60 * 1000; // 2分钟
    
    for (const [infoHash, torrentPeers] of this.peers.entries()) {
      for (const [peerKey, peer] of torrentPeers.entries()) {
        if (now - peer.last_announce > timeout) {
          torrentPeers.delete(peerKey);
        }
      }
      
      if (torrentPeers.size === 0) {
        this.peers.delete(infoHash);
      }
    }
  }

  /**
   * 获取全局统计
   */
  getGlobalStats() {
    let totalPeers = 0;
    let totalTorrents = this.peers.size;
    
    for (const torrentPeers of this.peers.values()) {
      totalPeers += torrentPeers.size;
    }
    
    return {
      torrents: totalTorrents,
      peers: totalPeers
    };
  }
}

// 全局 peer 管理器实例
const peerManager = new PeerManager();

/**
 * 处理 announce 请求
 */
async function handleAnnounce(req, res) {
  const startTime = Date.now();
  
  try {
    // 解析请求参数
    const passkey = req.params.passkey; // 从路由参数获取 passkey
    const {
      info_hash,
      peer_id,
      port,
      uploaded = 0,
      downloaded = 0,
      left = 0,
      event,
      numwant = 50,
      compact = 1,
      no_peer_id = 0,
      key
    } = req.query;

    // 验证必需参数
    if (!passkey || !info_hash || !peer_id || !port) {
      return sendFailureResponse(res, 'Missing required parameters');
    }

    // 验证 passkey
    const user = await validatePasskey(passkey);
    if (!user) {
      return sendFailureResponse(res, 'Invalid passkey');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return sendFailureResponse(res, 'User account is not active');
    }

    // 转换 info_hash 为十六进制
    const infoHashHex = Buffer.from(info_hash, 'binary').toString('hex');

    // 查找种子
    const torrent = await Torrent.findOne({
      where: { info_hash: infoHashHex }
    });

    if (!torrent) {
      return sendFailureResponse(res, 'Torrent not found');
    }

    if (torrent.status !== 'approved') {
      return sendFailureResponse(res, 'Torrent not approved');
    }

    // 获取客户端 IP
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const clientPort = parseInt(port);
    const userAgent = req.get('User-Agent') || '';

    // 创建或更新 peer 记录
    const [peer, created] = await Peer.findOrCreate({
      where: {
        user_id: user.id,
        torrent_id: torrent.id,
        peer_id: peer_id
      },
      defaults: {
        info_hash: infoHashHex,
        ip: clientIp,
        port: clientPort,
        uploaded: parseInt(uploaded),
        downloaded: parseInt(downloaded),
        left: parseInt(left),
        status: event || 'started',
        user_agent: userAgent,
        key: key || null,
        announces: 1
      }
    });

    if (!created) {
      // 计算上传下载增量
      const uploadedDiff = parseInt(uploaded) - peer.uploaded;
      const downloadedDiff = parseInt(downloaded) - peer.downloaded;

      // 更新 peer 记录
      await peer.update({
        ip: clientIp,
        port: clientPort,
        uploaded: parseInt(uploaded),
        downloaded: parseInt(downloaded),
        left: parseInt(left),
        status: event || peer.status,
        last_announce: new Date(),
        announces: peer.announces + 1
      });

      // 更新用户统计
      if (uploadedDiff > 0 || downloadedDiff > 0) {
        await updateUserStats(user.id, uploadedDiff, downloadedDiff);
      }
    }

    // 处理事件
    if (event === 'stopped') {
      // 移除 peer
      peerManager.removePeer(infoHashHex, user.id, peer_id);
    } else {
      // 添加或更新内存中的 peer
      peerManager.addPeer(infoHashHex, {
        user_id: user.id,
        peer_id: peer_id,
        ip: clientIp,
        port: clientPort,
        uploaded: parseInt(uploaded),
        downloaded: parseInt(downloaded),
        left: parseInt(left)
      });
    }

    // 记录 announce 日志
    await AnnounceLog.create({
      user_id: user.id,
      torrent_id: torrent.id,
      info_hash: infoHashHex,
      peer_id: peer_id,
      ip: clientIp,
      port: clientPort,
      uploaded: parseInt(uploaded),
      downloaded: parseInt(downloaded),
      left: parseInt(left),
      event: event || 'update',
      user_agent: userAgent,
      response_time: Date.now() - startTime
    });

    // 获取 peer 列表
    const peers = peerManager.getPeers(infoHashHex, user.id);
    const stats = peerManager.getTorrentStats(infoHashHex);

    // 限制返回的 peer 数量
    const maxPeers = Math.min(parseInt(numwant), 50);
    const returnPeers = peers.slice(0, maxPeers);

    // 构建响应
    const response = {
      interval: 1800, // 30分钟
      'min interval': 900, // 15分钟
      complete: stats.complete,
      incomplete: stats.incomplete,
      downloaded: stats.downloaded
    };

    // 添加 peer 列表
    if (compact === '1') {
      // Compact 格式 - 每个 peer 6字节 (4字节IP + 2字节端口)
      const peerBuffer = Buffer.alloc(returnPeers.length * 6);
      returnPeers.forEach((peer, index) => {
        const ipParts = peer.ip.split('.');
        const offset = index * 6;
        peerBuffer[offset] = parseInt(ipParts[0]);
        peerBuffer[offset + 1] = parseInt(ipParts[1]);
        peerBuffer[offset + 2] = parseInt(ipParts[2]);
        peerBuffer[offset + 3] = parseInt(ipParts[3]);
        peerBuffer.writeUInt16BE(peer.port, offset + 4);
      });
      response.peers = peerBuffer;
    } else {
      // 字典格式
      response.peers = returnPeers.map(peer => ({
        'peer id': peer.peer_id,
        ip: peer.ip,
        port: peer.port
      }));
    }

    // 发送 bencode 响应
    res.setHeader('Content-Type', 'text/plain');
    res.send(bencode.encode(response));

  } catch (error) {
    console.error('Announce 处理错误:', error);
    return sendFailureResponse(res, 'Internal server error');
  }
}

/**
 * 更新用户统计信息
 */
async function updateUserStats(userId, uploadedDiff, downloadedDiff) {
  try {
    const [userStats] = await UserStats.findOrCreate({
      where: { user_id: userId },
      defaults: {
        uploaded: 0,
        downloaded: 0,
        torrents_uploaded: 0,
        torrents_seeding: 0,
        torrents_leeching: 0,
        seedtime: 0,
        leechtime: 0,
        bonus_points: 0,
        invitations: 0
      }
    });

    // 只有当确实有数据变化时才更新
    if (uploadedDiff > 0 || downloadedDiff > 0) {
      await userStats.increment({
        uploaded: uploadedDiff,
        downloaded: downloadedDiff
      });

      // 根据上传下载量计算奖励积分
      const bonusPoints = calculateBonusPoints(uploadedDiff, downloadedDiff);
      if (bonusPoints > 0) {
        await userStats.increment({
          bonus_points: bonusPoints
        });
      }
    }
  } catch (error) {
    console.error('更新用户统计失败:', error);
  }
}

/**
 * 计算奖励积分
 */
function calculateBonusPoints(uploadedDiff, downloadedDiff) {
  // 基础规则：每上传1GB获得1积分，下载不扣分
  const uploadGBs = uploadedDiff / (1024 * 1024 * 1024);
  return Math.floor(uploadGBs * 1);
}

/**
 * 发送失败响应
 */
function sendFailureResponse(res, reason) {
  const response = bencode.encode({
    'failure reason': reason
  });
  
  res.setHeader('Content-Type', 'text/plain');
  res.status(400).send(response);
}

/**
 * 处理 scrape 请求
 */
async function handleScrape(req, res) {
  try {
    // 获取 passkey 并验证
    const passkey = req.params.passkey;
    const { info_hash } = req.query;
    
    if (!passkey) {
      return res.status(400).send('Missing passkey parameter');
    }
    
    if (!info_hash) {
      return res.status(400).send('Missing info_hash parameter');
    }

    // 验证 passkey
    const { validatePasskey } = require('./passkey');
    const user = await validatePasskey(passkey);
    if (!user) {
      return res.status(401).send('Invalid passkey');
    }

    const infoHashes = Array.isArray(info_hash) ? info_hash : [info_hash];
    const files = {};

    for (const hash of infoHashes) {
      const infoHashHex = Buffer.from(hash, 'binary').toString('hex');
      const stats = peerManager.getTorrentStats(infoHashHex);
      
      files[hash] = {
        complete: stats.complete,
        incomplete: stats.incomplete,
        downloaded: stats.downloaded,
        name: '' // 可选
      };
    }

    const response = bencode.encode({ files });
    res.setHeader('Content-Type', 'text/plain');
    res.send(response);

  } catch (error) {
    console.error('Scrape 处理错误:', error);
    res.status(500).send('Internal server error');
  }
}

module.exports = {
  peerManager,
  handleAnnounce,
  handleScrape
};

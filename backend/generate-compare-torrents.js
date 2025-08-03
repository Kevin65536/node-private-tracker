require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bencode = require('bncode');
const { Torrent } = require('./models');

/**
 * 生成两个用户的个性化种子文件并比较info_hash
 */
async function generateAndCompareTorrents() {
  try {
    console.log('🔍 生成并比较admin和507pc1的忍者杀手第一集种子文件...\n');
    
    // 用户信息
    const users = [
      { username: 'admin', passkey: '3c7ac6a8f6f28624698ce65a52f4fe61' },
      { username: '507pc1', passkey: '310ecb2fecb38e32f8be0df29ae2952d' }
    ];
    
    // 查找忍者杀手第一集种子
    const ninja = await Torrent.findOne({
      where: { name: '忍者杀手第一集' }
    });
    
    if (!ninja) {
      console.log('❌ 未找到忍者杀手第一集种子');
      return;
    }
    
    console.log(`📋 原始种子信息:`);
    console.log(`   ID: ${ninja.id}`);
    console.log(`   名称: ${ninja.name}`);
    console.log(`   原始info_hash: ${ninja.info_hash}`);
    console.log(`   文件路径: ${ninja.torrent_file}\n`);
    
    // 读取原始种子文件
    const originalTorrentPath = path.join(__dirname, 'uploads', ninja.torrent_file);
    const torrentData = await fs.readFile(originalTorrentPath);
    const originalTorrent = bencode.decode(torrentData);
    
    console.log(`📋 原始种子详细信息:`);
    console.log(`   announce: ${originalTorrent.announce ? originalTorrent.announce.toString() : '无'}`);
    console.log(`   name: ${originalTorrent.info.name ? originalTorrent.info.name.toString() : '无'}`);
    console.log(`   piece length: ${originalTorrent.info['piece length']}`);
    console.log(`   pieces count: ${originalTorrent.info.pieces ? Math.floor(originalTorrent.info.pieces.length / 20) : 0}`);
    console.log(`   private: ${originalTorrent.info.private || '未设置'}`);
    
    if (originalTorrent.info.files) {
      console.log(`   文件数量: ${originalTorrent.info.files.length}`);
      console.log(`   文件列表:`);
      originalTorrent.info.files.forEach((file, index) => {
        const filePath = file.path.map(p => p.toString()).join('/');
        console.log(`     ${index + 1}. ${filePath} (${file.length} bytes)`);
      });
    } else {
      console.log(`   单文件长度: ${originalTorrent.info.length} bytes`);
    }
    console.log('');
    
    // 为每个用户生成个性化种子
    const results = [];
    
    for (const user of users) {
      console.log(`🔧 为用户 ${user.username} 生成个性化种子...`);
      
      // 复制原始种子对象
      let personalizedTorrent = JSON.parse(JSON.stringify(originalTorrent, (key, value) => {
        if (Buffer.isBuffer(value)) {
          return Array.from(value);
        }
        return value;
      }));
      
      // 将数组转回Buffer
      function restoreBuffers(obj) {
        if (Array.isArray(obj) && obj.every(item => typeof item === 'number' && item >= 0 && item <= 255)) {
          return Buffer.from(obj);
        }
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            obj[key] = restoreBuffers(obj[key]);
          }
        }
        return obj;
      }
      
      personalizedTorrent = restoreBuffers(personalizedTorrent);
      
      // 设置个人announce URL
      const announceUrl = `http://localhost:3001/announce?passkey=${user.passkey}`;
      personalizedTorrent.announce = Buffer.from(announceUrl);
      
      // 确保有announce-list
      if (!personalizedTorrent['announce-list']) {
        personalizedTorrent['announce-list'] = [];
      }
      personalizedTorrent['announce-list'].unshift([personalizedTorrent.announce]);
      
      // 确保是私有种子
      personalizedTorrent.info.private = 1;
      
      // 计算个性化种子的info_hash
      const infoBuffer = bencode.encode(personalizedTorrent.info);
      const infoHash = crypto.createHash('sha1').update(infoBuffer).digest('hex');
      
      // 保存个性化种子文件
      const personalizedData = bencode.encode(personalizedTorrent);
      const outputPath = path.join(__dirname, `忍者杀手第一集_${user.username}.torrent`);
      await fs.writeFile(outputPath, personalizedData);
      
      const result = {
        username: user.username,
        passkey: user.passkey,
        announceUrl: announceUrl,
        infoHash: infoHash,
        torrentFile: outputPath,
        torrentSize: personalizedData.length
      };
      
      results.push(result);
      
      console.log(`   ✅ 生成完成:`);
      console.log(`     文件路径: ${outputPath}`);
      console.log(`     announce URL: ${announceUrl}`);
      console.log(`     info_hash: ${infoHash}`);
      console.log(`     文件大小: ${personalizedData.length} bytes\n`);
    }
    
    // 比较结果
    console.log('🔍 比较分析:\n');
    
    console.log('📊 Info Hash 比较:');
    console.log(`   原始种子: ${ninja.info_hash}`);
    results.forEach(result => {
      console.log(`   ${result.username.padEnd(8)}: ${result.infoHash}`);
    });
    
    console.log('\n🎯 关键发现:');
    
    // 检查info_hash是否相同
    const allHashes = [ninja.info_hash, ...results.map(r => r.infoHash)];
    const uniqueHashes = [...new Set(allHashes)];
    
    if (uniqueHashes.length === 1) {
      console.log('✅ 所有info_hash完全相同 - 这是正常的，因为info部分未被修改');
    } else {
      console.log('⚠️  发现不同的info_hash:');
      uniqueHashes.forEach((hash, index) => {
        console.log(`   变体${index + 1}: ${hash}`);
      });
    }
    
    console.log('\n📋 Announce URL 差异:');
    results.forEach(result => {
      console.log(`   ${result.username}: ${result.announceUrl}`);
    });
    
    console.log('\n💡 说明:');
    console.log('   - info_hash由种子的info部分计算，包含文件信息、分块信息等');
    console.log('   - announce URL只影响tracker通信，不影响info_hash');
    console.log('   - 两个用户下载的种子应该有相同的info_hash但不同的announce URL');
    console.log('   - 这样可以确保文件内容一致，但tracker能区分不同用户');
    
    return results;
    
  } catch (error) {
    console.error('❌ 生成或比较失败:', error);
  }
}

// 运行比较
if (require.main === module) {
  generateAndCompareTorrents();
}

module.exports = { generateAndCompareTorrents };

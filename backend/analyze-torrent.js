require('dotenv').config();
const { Torrent } = require('./models');
const fs = require('fs');

async function analyzeTorrentFile() {
  try {
    const torrent = await Torrent.findByPk(13, {
      attributes: ['id', 'name', 'info_hash', 'torrent_file']
    });
    
    if (!torrent || !torrent.torrent_file) {
      console.log('❌ 种子文件不存在');
      return;
    }
    
    console.log('📋 种子信息:');
    console.log(`   ID: ${torrent.id}`);
    console.log(`   名称: ${torrent.name}`);
    console.log(`   数据库 Info Hash: ${torrent.info_hash}`);
    
    // 检查种子文件是否存在
    const filePath = `./uploads/${torrent.torrent_file}`;
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`   种子文件大小: ${stats.size} 字节`);
      console.log(`   修改时间: ${stats.mtime}`);
      
      // 读取并分析种子文件
      const bencode = require('bncode');
      const torrentData = fs.readFileSync(filePath);
      const decoded = bencode.decode(torrentData);
      
      console.log(`\n📊 种子文件分析:`);
      console.log(`   Announce URL: ${decoded.announce.toString()}`);
      if (decoded['announce-list']) {
        console.log(`   Announce List: ${decoded['announce-list']}`);
      }
      
      // 计算实际的 info_hash
      const crypto = require('crypto');
      const infoBuffer = bencode.encode(decoded.info);
      const actualHash = crypto.createHash('sha1').update(infoBuffer).digest('hex');
      console.log(`   计算出的 Info Hash: ${actualHash}`);
      console.log(`   数据库 Info Hash:    ${torrent.info_hash}`);
      console.log(`   是否匹配: ${actualHash === torrent.info_hash ? '✅' : '❌'}`);
      
      // 显示需要的 info_hash
      console.log(`\n🎯 问题分析:`);
      console.log(`   需要的 Info Hash: 529936d5fc5685f79981fdd060687f32fd75e526`);
      console.log(`   数据库 Info Hash: ${torrent.info_hash}`);
      console.log(`   文件计算 Hash:   ${actualHash}`);
      
    } else {
      console.log('❌ 种子文件不存在于磁盘');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    process.exit(1);
  }
}

analyzeTorrentFile();

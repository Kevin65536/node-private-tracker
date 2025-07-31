const fs = require('fs');
const path = require('path');
const bencode = require('bncode');
const crypto = require('crypto');

async function testTorrentParsing() {
  try {
    const torrentPath = path.join(__dirname, 'test-data', 'test-torrent.torrent');
    console.log('测试种子文件路径:', torrentPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(torrentPath)) {
      throw new Error('种子文件不存在');
    }
    
    console.log('正在读取文件...');
    const data = fs.readFileSync(torrentPath);
    console.log('文件大小:', data.length, '字节');
    
    console.log('正在解析bencode...');
    const torrent = bencode.decode(data);
    console.log('解析成功！');
    
    console.log('种子文件结构:');
    console.log('- announce:', torrent.announce ? torrent.announce.toString() : 'null');
    console.log('- info存在:', !!torrent.info);
    
    if (torrent.info) {
      console.log('- info.name:', torrent.info.name ? torrent.info.name.toString() : 'null');
      console.log('- info.length:', torrent.info.length);
      console.log('- info["piece length"]:', torrent.info['piece length']);
      console.log('- info.pieces长度:', torrent.info.pieces ? torrent.info.pieces.length : 'null');
      
      // 计算info hash
      const infoBuffer = bencode.encode(torrent.info);
      const infoHash = crypto.createHash('sha1').update(infoBuffer).digest('hex');
      console.log('- info hash:', infoHash);
    }
    
  } catch (error) {
    console.error('解析失败:', error.message);
    console.error('错误详情:', error);
  }
}

testTorrentParsing();

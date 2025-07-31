const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bencode = require('bncode');

// 创建测试种子文件
function createTestTorrent() {
  // 创建测试文件目录
  const testDataDir = path.join(__dirname, 'test-data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir);
  }

  // 创建测试文件
  const testFilePath = path.join(testDataDir, 'test-file.txt');
  const testContent = 'This is a test file for PT Site project\nTest torrent file content\n'.repeat(100);
  fs.writeFileSync(testFilePath, testContent);

  const fileStats = fs.statSync(testFilePath);
  const pieceLength = 32768; // 32KB
  const fileLength = fileStats.size;
  
  // 计算文件的SHA1哈希值作为分块哈希
  const fileBuffer = fs.readFileSync(testFilePath);
  const pieces = [];
  
  for (let i = 0; i < fileLength; i += pieceLength) {
    const piece = fileBuffer.slice(i, i + pieceLength);
    const hash = crypto.createHash('sha1').update(piece).digest();
    pieces.push(hash);
  }
  
  const piecesBuffer = Buffer.concat(pieces);

  // 创建种子信息
  const info = {
    name: 'PT-Site-Test-File',
    'piece length': pieceLength,
    pieces: piecesBuffer,
    length: fileLength
  };

  // 创建完整的torrent数据
  const torrentData = {
    announce: 'http://localhost:3001/announce',
    'announce-list': [
      ['http://localhost:3001/announce'],
      ['http://tracker.example.com/announce']
    ],
    comment: 'PT Site Test Torrent File',
    'created by': 'PT Site Torrent Generator',
    'creation date': Math.floor(Date.now() / 1000),
    info: info
  };

  // 编码为bencode格式
  const torrentBuffer = bencode.encode(torrentData);
  
  // 计算info hash
  const infoBuffer = bencode.encode(info);
  const infoHash = crypto.createHash('sha1').update(infoBuffer).digest('hex');
  
  // 保存种子文件
  const torrentPath = path.join(testDataDir, 'test-torrent.torrent');
  fs.writeFileSync(torrentPath, torrentBuffer);

  console.log('测试种子文件已创建:');
  console.log('种子文件路径:', torrentPath);
  console.log('Info Hash:', infoHash);
  console.log('文件大小:', fileLength, '字节');
  console.log('分块大小:', pieceLength, '字节');
  console.log('分块数量:', pieces.length);

  return {
    torrentPath,
    infoHash,
    fileSize: fileLength,
    pieceLength,
    pieceCount: pieces.length
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  try {
    createTestTorrent();
  } catch (error) {
    console.error('创建测试种子失败:', error);
  }
}

module.exports = { createTestTorrent };

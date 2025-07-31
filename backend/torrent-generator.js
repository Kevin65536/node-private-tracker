/**
 * 测试种子文件生成器
 * 用于创建测试用的 .torrent 文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bencode = require('./utils/bencode');

/**
 * 创建测试文件
 */
function createTestFile(filePath, content = 'This is a test file for PT tracker testing.') {
  fs.writeFileSync(filePath, content);
  console.log(`✅ 创建测试文件: ${filePath}`);
}

/**
 * 计算文件的 SHA1 哈希
 */
function calculateSHA1(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(data).digest();
}

/**
 * 生成种子文件
 */
function createTorrentFile(inputFile, outputFile, announceUrl, pieceLength = 32768) {
  if (!fs.existsSync(inputFile)) {
    throw new Error(`输入文件不存在: ${inputFile}`);
  }
  
  const fileStats = fs.statSync(inputFile);
  const fileData = fs.readFileSync(inputFile);
  
  // 计算 pieces
  const pieces = [];
  for (let i = 0; i < fileData.length; i += pieceLength) {
    const piece = fileData.slice(i, i + pieceLength);
    const hash = crypto.createHash('sha1').update(piece).digest();
    pieces.push(hash);
  }
  
  const piecesBuffer = Buffer.concat(pieces);
  
  // 构建种子文件信息
  const torrentInfo = {
    announce: announceUrl,
    comment: 'Test torrent for PT tracker',
    'created by': 'PT Tracker Test Generator',
    'creation date': Math.floor(Date.now() / 1000),
    info: {
      name: path.basename(inputFile),
      length: fileStats.size,
      'piece length': pieceLength,
      pieces: piecesBuffer
    }
  };
  
  // 编码为 bencode 格式
  const encodedTorrent = bencode.encode(torrentInfo);
  
  // 写入文件
  fs.writeFileSync(outputFile, encodedTorrent);
  
  // 计算 info_hash
  const infoEncoded = bencode.encode(torrentInfo.info);
  const infoHash = crypto.createHash('sha1').update(infoEncoded).digest('hex');
  
  console.log(`✅ 创建种子文件: ${outputFile}`);
  console.log(`📋 Info Hash: ${infoHash}`);
  console.log(`📡 Announce URL: ${announceUrl}`);
  
  return {
    torrentFile: outputFile,
    infoHash: infoHash,
    announceUrl: announceUrl
  };
}

/**
 * 为用户创建测试种子
 */
async function createTestTorrentForUser(passkey) {
  const { buildAnnounceUrl } = require('./utils/passkey');
  
  // 创建测试文件
  const testFileName = `test-${Date.now()}.txt`;
  const testFilePath = path.join(__dirname, 'uploads', testFileName);
  
  // 确保 uploads 目录存在
  const uploadsDir = path.dirname(testFilePath);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  createTestFile(testFilePath, `PT Tracker 测试文件
创建时间: ${new Date().toISOString()}
用户 Passkey: ${passkey}
文件大小: ${Math.random() * 1000000 | 0} bytes 的模拟内容

这是一个用于测试 Private Tracker 功能的测试文件。
您可以使用生成的 .torrent 文件在 BitTorrent 客户端中进行测试。`);
  
  // 生成 announce URL
  const announceUrl = buildAnnounceUrl(passkey);
  
  // 创建种子文件
  const torrentFileName = `test-${Date.now()}.torrent`;
  const torrentFilePath = path.join(__dirname, 'uploads', torrentFileName);
  
  const result = createTorrentFile(testFilePath, torrentFilePath, announceUrl);
  
  return {
    ...result,
    testFile: testFilePath,
    testFileName: testFileName,
    torrentFileName: torrentFileName
  };
}

/**
 * 解析种子文件信息
 */
function parseTorrentFile(torrentFilePath) {
  if (!fs.existsSync(torrentFilePath)) {
    throw new Error(`种子文件不存在: ${torrentFilePath}`);
  }
  
  const torrentData = fs.readFileSync(torrentFilePath);
  const decoded = bencode.decodeToObject(torrentData);
  
  // 计算 info_hash
  const torrentRaw = bencode.decode(torrentData);
  const infoEncoded = bencode.encode(torrentRaw.info);
  const infoHash = crypto.createHash('sha1').update(infoEncoded).digest('hex');
  
  console.log('种子文件信息:');
  console.log(`  名称: ${decoded.info.name}`);
  console.log(`  大小: ${decoded.info.length} bytes`);
  console.log(`  Piece 长度: ${decoded.info['piece length']}`);
  console.log(`  Announce URL: ${decoded.announce}`);
  console.log(`  Info Hash: ${infoHash}`);
  console.log(`  创建时间: ${new Date(decoded['creation date'] * 1000).toISOString()}`);
  
  return {
    name: decoded.info.name,
    size: decoded.info.length,
    pieceLength: decoded.info['piece length'],
    announce: decoded.announce,
    infoHash: infoHash,
    creationDate: new Date(decoded['creation date'] * 1000)
  };
}

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
用法:
  node torrent-generator.js <passkey>                    # 创建测试种子
  node torrent-generator.js parse <torrent-file>         # 解析种子文件
  node torrent-generator.js create <file> <output> <url> # 手动创建种子

示例:
  node torrent-generator.js abcd1234567890abcd1234567890abcd
  node torrent-generator.js parse test.torrent
  node torrent-generator.js create test.txt test.torrent http://localhost:3001/announce/passkey
`);
    process.exit(1);
  }
  
  if (args[0] === 'parse') {
    if (args.length < 2) {
      console.error('请提供种子文件路径');
      process.exit(1);
    }
    
    try {
      parseTorrentFile(args[1]);
    } catch (error) {
      console.error('解析种子文件失败:', error.message);
      process.exit(1);
    }
  } else if (args[0] === 'create') {
    if (args.length < 4) {
      console.error('请提供输入文件、输出文件和 announce URL');
      process.exit(1);
    }
    
    try {
      createTorrentFile(args[1], args[2], args[3]);
    } catch (error) {
      console.error('创建种子文件失败:', error.message);
      process.exit(1);
    }
  } else {
    // 默认为创建测试种子
    const passkey = args[0];
    
    createTestTorrentForUser(passkey)
      .then((result) => {
        console.log('\n🎉 测试种子创建成功！');
        console.log(`\n📂 文件位置:`);
        console.log(`  测试文件: ${result.testFile}`);
        console.log(`  种子文件: ${result.torrentFile}`);
        console.log(`\n🔗 使用方法:`);
        console.log(`  1. 在 BitTorrent 客户端中添加: ${result.torrentFile}`);
        console.log(`  2. 检查 Tracker 连接状态`);
        console.log(`  3. 验证统计数据更新`);
      })
      .catch((error) => {
        console.error('创建测试种子失败:', error.message);
        process.exit(1);
      });
  }
}

module.exports = {
  createTestFile,
  createTorrentFile,
  createTestTorrentForUser,
  parseTorrentFile
};

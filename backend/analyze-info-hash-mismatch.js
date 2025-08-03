require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bencode = require('bncode');
const { Torrent } = require('./models');

/**
 * 深度分析info_hash不匹配问题
 */
async function analyzeInfoHashMismatch() {
  try {
    console.log('🔍 深度分析info_hash不匹配问题...\n');
    
    // 查找忍者杀手第一集种子
    const ninja = await Torrent.findOne({
      where: { name: '忍者杀手第一集' }
    });
    
    if (!ninja) {
      console.log('❌ 未找到忍者杀手第一集种子');
      return;
    }
    
    console.log(`📋 数据库种子信息:`);
    console.log(`   存储的info_hash: ${ninja.info_hash}`);
    console.log(`   文件路径: ${ninja.torrent_file}\n`);
    
    // 读取原始种子文件
    const originalTorrentPath = path.join(__dirname, 'uploads', ninja.torrent_file);
    
    let originalExists = false;
    try {
      await fs.access(originalTorrentPath);
      originalExists = true;
    } catch (error) {
      console.log(`❌ 原始种子文件不存在: ${originalTorrentPath}`);
    }
    
    if (originalExists) {
      console.log('📂 分析原始种子文件...');
      const torrentData = await fs.readFile(originalTorrentPath);
      const originalTorrent = bencode.decode(torrentData);
      
      // 直接计算原始文件的info_hash
      const originalInfoBuffer = bencode.encode(originalTorrent.info);
      const originalInfoHash = crypto.createHash('sha1').update(originalInfoBuffer).digest('hex');
      
      console.log(`   文件实际info_hash: ${originalInfoHash}`);
      console.log(`   数据库记录info_hash: ${ninja.info_hash}`);
      console.log(`   是否匹配: ${originalInfoHash === ninja.info_hash ? '✅ 是' : '❌ 否'}\n`);
      
      // 显示原始种子详细信息
      console.log('📋 原始种子文件详细信息:');
      console.log(`   announce: ${originalTorrent.announce ? originalTorrent.announce.toString() : '无'}`);
      console.log(`   name: ${originalTorrent.info.name ? originalTorrent.info.name.toString() : '无'}`);
      console.log(`   private: ${originalTorrent.info.private}`);
      console.log(`   piece length: ${originalTorrent.info['piece length']}`);
      console.log(`   pieces length: ${originalTorrent.info.pieces ? originalTorrent.info.pieces.length : 0}`);
      
      if (originalTorrent.info.files) {
        console.log(`   文件数量: ${originalTorrent.info.files.length}`);
        originalTorrent.info.files.forEach((file, index) => {
          const filePath = file.path.map(p => p.toString()).join('/');
          console.log(`     ${index + 1}. ${filePath} (${file.length} bytes)`);
        });
      } else {
        console.log(`   单文件长度: ${originalTorrent.info.length} bytes`);
      }
      console.log('');
      
      // 分析info部分的详细结构
      console.log('🔍 Info部分详细分析:');
      const infoKeys = Object.keys(originalTorrent.info).sort();
      console.log(`   info字段数量: ${infoKeys.length}`);
      console.log(`   info字段列表: ${infoKeys.join(', ')}`);
      
      // 计算info部分各字段的哈希
      console.log('\n🔢 Info各字段详细信息:');
      for (const key of infoKeys) {
        const value = originalTorrent.info[key];
        const type = Buffer.isBuffer(value) ? 'Buffer' : typeof value;
        const size = Buffer.isBuffer(value) ? value.length : JSON.stringify(value).length;
        console.log(`   ${key}: ${type} (${size} ${Buffer.isBuffer(value) ? 'bytes' : 'chars'})`);
        
        if (key === 'pieces' && Buffer.isBuffer(value)) {
          console.log(`     pieces总长度: ${value.length} bytes`);
          console.log(`     piece数量: ${Math.floor(value.length / 20)}`);
          console.log(`     前20bytes: ${value.slice(0, 20).toString('hex')}`);
        } else if (Buffer.isBuffer(value) && value.length < 100) {
          console.log(`     内容: ${value.toString()}`);
        } else if (!Buffer.isBuffer(value)) {
          console.log(`     值: ${JSON.stringify(value)}`);
        }
      }
      
      // 比较不同编码方式
      console.log('\n🧪 测试不同编码方式:');
      
      // 方式1：直接编码info部分
      const method1Buffer = bencode.encode(originalTorrent.info);
      const method1Hash = crypto.createHash('sha1').update(method1Buffer).digest('hex');
      console.log(`   方式1 (直接编码): ${method1Hash}`);
      
      // 方式2：手动构建info字典并编码
      const infoDict = {};
      for (const key of infoKeys) {
        infoDict[key] = originalTorrent.info[key];
      }
      const method2Buffer = bencode.encode(infoDict);
      const method2Hash = crypto.createHash('sha1').update(method2Buffer).digest('hex');
      console.log(`   方式2 (重构字典): ${method2Hash}`);
      
      // 方式3：检查编码后的字节是否一致
      console.log(`   编码后大小比较: ${method1Buffer.length} vs ${method2Buffer.length}`);
      console.log(`   编码结果是否相同: ${Buffer.compare(method1Buffer, method2Buffer) === 0 ? '✅ 是' : '❌ 否'}`);
      
      if (Buffer.compare(method1Buffer, method2Buffer) !== 0) {
        console.log('\n🔍 编码差异分析:');
        const minLength = Math.min(method1Buffer.length, method2Buffer.length);
        for (let i = 0; i < minLength; i++) {
          if (method1Buffer[i] !== method2Buffer[i]) {
            console.log(`   首个差异位置: ${i}`);
            console.log(`   方式1字节: 0x${method1Buffer[i].toString(16).padStart(2, '0')} (${String.fromCharCode(method1Buffer[i])})`);
            console.log(`   方式2字节: 0x${method2Buffer[i].toString(16).padStart(2, '0')} (${String.fromCharCode(method2Buffer[i])})`);
            break;
          }
        }
      }
      
      // 生成新的种子文件进行验证
      console.log('\n🔧 生成验证用种子文件...');
      const testTorrent = {
        announce: Buffer.from('http://localhost:3001/announce?passkey=test'),
        info: originalTorrent.info
      };
      
      const testTorrentBuffer = bencode.encode(testTorrent);
      const testInfoBuffer = bencode.encode(testTorrent.info);
      const testInfoHash = crypto.createHash('sha1').update(testInfoBuffer).digest('hex');
      
      const testFilePath = path.join(__dirname, '验证用_忍者杀手第一集.torrent');
      await fs.writeFile(testFilePath, testTorrentBuffer);
      
      console.log(`   测试种子文件: ${testFilePath}`);
      console.log(`   测试种子info_hash: ${testInfoHash}`);
      console.log(`   与原始是否匹配: ${testInfoHash === originalInfoHash ? '✅ 是' : '❌ 否'}`);
      console.log(`   与数据库是否匹配: ${testInfoHash === ninja.info_hash ? '✅ 是' : '❌ 否'}`);
      
    }
    
    // 总结分析
    console.log('\n📊 问题总结:');
    console.log('   1. 数据库中存储的info_hash与文件实际计算出的info_hash不匹配');
    console.log('   2. 这可能导致tracker无法正确识别种子');
    console.log('   3. 需要检查种子上传时的info_hash计算逻辑');
    console.log('   4. 建议更新数据库中的info_hash为实际值');
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

// 运行分析
if (require.main === module) {
  analyzeInfoHashMismatch();
}

module.exports = { analyzeInfoHashMismatch };

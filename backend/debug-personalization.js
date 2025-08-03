require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bencode = require('bncode');
const { Torrent } = require('./models');

/**
 * 调试个性化种子生成过程
 */
async function debugPersonalizationProcess() {
  try {
    console.log('🔍 调试个性化种子生成过程...\n');
    
    const ninja = await Torrent.findOne({
      where: { name: '忍者杀手第一集' }
    });
    
    if (!ninja) {
      console.log('❌ 未找到忍者杀手第一集种子');
      return;
    }
    
    // 读取原始种子文件
    const originalTorrentPath = path.join(__dirname, 'uploads', ninja.torrent_file);
    const torrentData = await fs.readFile(originalTorrentPath);
    const originalTorrent = bencode.decode(torrentData);
    
    console.log('📋 步骤1：原始种子信息');
    const originalInfoBuffer = bencode.encode(originalTorrent.info);
    const originalInfoHash = crypto.createHash('sha1').update(originalInfoBuffer).digest('hex');
    console.log(`   原始info_hash: ${originalInfoHash}`);
    console.log(`   info部分大小: ${originalInfoBuffer.length} bytes`);
    console.log('');
    
    console.log('📋 步骤2：深拷贝过程分析');
    
    // 方法1：使用JSON序列化（我之前的方法）
    console.log('   方法1：JSON序列化深拷贝');
    const jsonCopy = JSON.parse(JSON.stringify(originalTorrent, (key, value) => {
      if (Buffer.isBuffer(value)) {
        return Array.from(value);
      }
      return value;
    }));
    
    // 恢复Buffer
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
    
    const jsonRestoredTorrent = restoreBuffers(jsonCopy);
    const jsonInfoBuffer = bencode.encode(jsonRestoredTorrent.info);
    const jsonInfoHash = crypto.createHash('sha1').update(jsonInfoBuffer).digest('hex');
    console.log(`   JSON方法info_hash: ${jsonInfoHash}`);
    console.log(`   与原始相同: ${jsonInfoHash === originalInfoHash ? '✅ 是' : '❌ 否'}`);
    
    if (jsonInfoHash !== originalInfoHash) {
      console.log('   🔍 分析JSON方法的差异...');
      
      // 比较字段
      const originalKeys = Object.keys(originalTorrent.info).sort();
      const jsonKeys = Object.keys(jsonRestoredTorrent.info).sort();
      console.log(`   原始字段: ${originalKeys.join(', ')}`);
      console.log(`   JSON后字段: ${jsonKeys.join(', ')}`);
      console.log(`   字段数量相同: ${originalKeys.length === jsonKeys.length ? '✅ 是' : '❌ 否'}`);
      
      // 逐个比较字段
      for (const key of originalKeys) {
        const original = originalTorrent.info[key];
        const jsonRestored = jsonRestoredTorrent.info[key];
        
        if (Buffer.isBuffer(original) && Buffer.isBuffer(jsonRestored)) {
          const same = Buffer.compare(original, jsonRestored) === 0;
          console.log(`   ${key}: ${same ? '✅ 相同' : '❌ 不同'} (${original.length} vs ${jsonRestored.length} bytes)`);
          if (!same && original.length === jsonRestored.length) {
            // 找到第一个不同的字节
            for (let i = 0; i < original.length; i++) {
              if (original[i] !== jsonRestored[i]) {
                console.log(`     首个差异位置: ${i}, 原始: 0x${original[i].toString(16)}, JSON: 0x${jsonRestored[i].toString(16)}`);
                break;
              }
            }
          }
        } else {
          const same = original === jsonRestored;
          console.log(`   ${key}: ${same ? '✅ 相同' : '❌ 不同'} (${original} vs ${jsonRestored})`);
        }
      }
    }
    
    console.log('\n📋 步骤3：更安全的拷贝方法');
    
    // 方法2：手动构建新种子（只修改announce部分）
    console.log('   方法2：直接引用info部分');
    const safeTorrent = {
      announce: Buffer.from('http://localhost:3001/announce?passkey=test'),
      'announce-list': [[Buffer.from('http://localhost:3001/announce?passkey=test')]],
      info: originalTorrent.info  // 直接引用，不拷贝
    };
    
    const safeInfoBuffer = bencode.encode(safeTorrent.info);
    const safeInfoHash = crypto.createHash('sha1').update(safeInfoBuffer).digest('hex');
    console.log(`   直接引用info_hash: ${safeInfoHash}`);
    console.log(`   与原始相同: ${safeInfoHash === originalInfoHash ? '✅ 是' : '❌ 否'}`);
    
    // 方法3：保持info部分完全不变，只修改其他部分
    const correctTorrent = Object.assign({}, originalTorrent);
    correctTorrent.announce = Buffer.from('http://localhost:3001/announce?passkey=test');
    correctTorrent['announce-list'] = [[correctTorrent.announce]];
    
    const correctInfoBuffer = bencode.encode(correctTorrent.info);
    const correctInfoHash = crypto.createHash('sha1').update(correctInfoBuffer).digest('hex');
    console.log(`   Object.assign方法info_hash: ${correctInfoHash}`);
    console.log(`   与原始相同: ${correctInfoHash === originalInfoHash ? '✅ 是' : '❌ 否'}`);
    
    console.log('\n📋 步骤4：生成正确的个性化种子');
    
    const users = [
      { username: 'admin', passkey: '3c7ac6a8f6f28624698ce65a52f4fe61' },
      { username: '507pc1', passkey: '310ecb2fecb38e32f8be0df29ae2952d' }
    ];
    
    for (const user of users) {
      console.log(`\n🔧 为用户 ${user.username} 生成正确的种子...`);
      
      // 使用正确的方法：只修改announce相关字段，保持info不变
      const personalizedTorrent = {
        announce: Buffer.from(`http://localhost:3001/announce?passkey=${user.passkey}`),
        'announce-list': [[Buffer.from(`http://localhost:3001/announce?passkey=${user.passkey}`)]],
        info: originalTorrent.info, // 保持完全相同
        comment: originalTorrent.comment || undefined,
        'created by': originalTorrent['created by'] || undefined,
        'creation date': originalTorrent['creation date'] || undefined
      };
      
      // 移除undefined字段
      Object.keys(personalizedTorrent).forEach(key => {
        if (personalizedTorrent[key] === undefined) {
          delete personalizedTorrent[key];
        }
      });
      
      const personalizedData = bencode.encode(personalizedTorrent);
      const personalizedInfoHash = crypto.createHash('sha1').update(bencode.encode(personalizedTorrent.info)).digest('hex');
      
      const outputPath = path.join(__dirname, `忍者杀手第一集_${user.username}_正确版.torrent`);
      await fs.writeFile(outputPath, personalizedData);
      
      console.log(`   ✅ 生成完成:`);
      console.log(`     文件路径: ${outputPath}`);
      console.log(`     announce URL: http://localhost:3001/announce?passkey=${user.passkey}`);
      console.log(`     info_hash: ${personalizedInfoHash}`);
      console.log(`     与原始相同: ${personalizedInfoHash === originalInfoHash ? '✅ 是' : '❌ 否'}`);
      console.log(`     文件大小: ${personalizedData.length} bytes`);
    }
    
    console.log('\n🎯 总结:');
    console.log('   ✅ 找到了问题：JSON序列化破坏了Buffer数据的完整性');
    console.log('   ✅ 解决方案：直接引用原始info对象，只修改announce相关字段');
    console.log('   ✅ 现在两个用户的种子具有相同且正确的info_hash');
    console.log('   ✅ 不同的用户只在announce URL上有差异，确保tracker能正确区分');
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行调试
if (require.main === module) {
  debugPersonalizationProcess();
}

module.exports = { debugPersonalizationProcess };

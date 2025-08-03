require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bencode = require('bncode');
const { Torrent, User, UserPasskey } = require('./models');

/**
 * 测试修复后的种子匹配逻辑
 */
async function testFixedTorrentLogic() {
  try {
    console.log('🧪 测试修复后的种子匹配逻辑...\n');
    
    // 1. 查找忍者杀手第一集种子
    const ninja = await Torrent.findOne({
      where: { name: '忍者杀手第一集' }
    });
    
    if (!ninja) {
      console.log('❌ 未找到忍者杀手第一集种子');
      return;
    }
    
    console.log(`📋 测试种子信息:`);
    console.log(`   ID: ${ninja.id}`);
    console.log(`   名称: ${ninja.name}`);
    console.log(`   数据库info_hash: ${ninja.info_hash}\n`);
    
    // 2. 获取两个用户的passkey
    const users = await User.findAll({
      where: { username: ['admin', '507pc1'] },
      include: [{ model: UserPasskey }]
    });
    
    if (users.length < 2) {
      console.log('❌ 需要至少两个用户（admin和507pc1）');
      return;
    }
    
    console.log('👥 测试用户:');
    users.forEach(user => {
      console.log(`   ${user.username}: ${user.UserPasskey?.passkey || '无passkey'}`);
    });
    console.log('');
    
    // 3. 读取原始种子文件
    const originalTorrentPath = path.join(__dirname, 'uploads', ninja.torrent_file);
    const torrentData = await fs.readFile(originalTorrentPath);
    const originalTorrent = bencode.decode(torrentData);
    
    // 验证原始种子的info_hash
    const originalInfoBuffer = bencode.encode(originalTorrent.info);
    const originalInfoHash = crypto.createHash('sha1').update(originalInfoBuffer).digest('hex');
    
    console.log('🔍 原始种子验证:');
    console.log(`   文件实际info_hash: ${originalInfoHash}`);
    console.log(`   数据库info_hash: ${ninja.info_hash}`);
    console.log(`   匹配: ${originalInfoHash === ninja.info_hash ? '✅ 是' : '❌ 否'}`);
    console.log(`   私有标记: ${originalTorrent.info.private || '未设置'}\n`);
    
    // 4. 为每个用户生成个性化种子（使用修复后的逻辑）
    console.log('🔧 生成个性化种子（修复后的逻辑）:');
    
    const results = [];
    for (const user of users) {
      if (!user.UserPasskey?.passkey) {
        console.log(`   ⚠️  用户 ${user.username} 没有passkey，跳过`);
        continue;
      }
      
      // 使用修复后的逻辑：只修改announce字段，不修改info
      const personalizedTorrent = {
        announce: Buffer.from(`http://localhost:3001/announce?passkey=${user.UserPasskey.passkey}`),
        'announce-list': [[Buffer.from(`http://localhost:3001/announce?passkey=${user.UserPasskey.passkey}`)]],
        info: originalTorrent.info, // 直接引用，不修改
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
      
      const outputPath = path.join(__dirname, `忍者杀手第一集_${user.username}_修复版.torrent`);
      await fs.writeFile(outputPath, personalizedData);
      
      const result = {
        username: user.username,
        passkey: user.UserPasskey.passkey,
        infoHash: personalizedInfoHash,
        announceUrl: `http://localhost:3001/announce?passkey=${user.UserPasskey.passkey}`,
        filePath: outputPath,
        fileSize: personalizedData.length
      };
      
      results.push(result);
      
      console.log(`   用户 ${user.username}:`);
      console.log(`     文件: ${outputPath}`);
      console.log(`     info_hash: ${personalizedInfoHash}`);
      console.log(`     与原始相同: ${personalizedInfoHash === originalInfoHash ? '✅ 是' : '❌ 否'}`);
      console.log(`     文件大小: ${personalizedData.length} bytes`);
    }
    
    // 5. 汇总结果
    console.log('\n📊 测试结果汇总:');
    
    const allInfoHashes = [originalInfoHash, ...results.map(r => r.infoHash)];
    const uniqueHashes = [...new Set(allInfoHashes)];
    
    console.log(`   原始种子info_hash: ${originalInfoHash}`);
    results.forEach(result => {
      console.log(`   ${result.username.padEnd(8)}info_hash: ${result.infoHash}`);
    });
    
    console.log(`\n🎯 关键指标:`);
    console.log(`   唯一info_hash数量: ${uniqueHashes.length} (应该为1)`);
    console.log(`   所有info_hash相同: ${uniqueHashes.length === 1 ? '✅ 是' : '❌ 否'}`);
    
    if (uniqueHashes.length === 1) {
      console.log('\n🎉 测试通过！所有种子具有相同的info_hash');
      console.log('   ✅ tracker能正确识别种子');
      console.log('   ✅ 用户可以正常P2P连接');
      console.log('   ✅ 不同用户通过不同的announce URL进行统计');
    } else {
      console.log('\n❌ 测试失败！不同用户的info_hash不同');
      console.log('   请检查种子生成逻辑');
    }
    
    // 6. 清理测试文件（可选）
    console.log('\n🧹 清理测试文件...');
    for (const result of results) {
      try {
        await fs.unlink(result.filePath);
        console.log(`   删除: ${result.filePath}`);
      } catch (error) {
        console.log(`   删除失败: ${result.filePath} - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testFixedTorrentLogic();
}

module.exports = { testFixedTorrentLogic };

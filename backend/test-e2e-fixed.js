require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const bencode = require('bncode');

/**
 * 端到端测试修复后的种子下载流程
 */
async function testEndToEndFlow() {
  try {
    console.log('🚀 端到端测试修复后的种子下载流程...\n');
    
    const BASE_URL = 'http://localhost:3001';
    
    // 测试用户
    const testUsers = [
      { username: 'admin', password: 'admin123456' },
      { username: '507pc1', password: '507pc1CODE' }
    ];
    
    const results = {};
    
    for (const testUser of testUsers) {
      console.log(`🔐 测试用户: ${testUser.username}`);
      
      try {
        // 1. 登录获取token
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          username: testUser.username,
          password: testUser.password
        });
        
        const token = loginResponse.data.token;
        console.log(`   ✅ 登录成功`);
        
        // 2. 获取用户passkey
        const passkeyResponse = await axios.get(`${BASE_URL}/api/users/passkey`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const passkey = passkeyResponse.data.passkey;
        console.log(`   🔑 Passkey: ${passkey}`);
        
        // 3. 获取种子列表
        const torrentsResponse = await axios.get(`${BASE_URL}/api/torrents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const approvedTorrents = torrentsResponse.data.torrents.filter(t => t.status === 'approved');
        
        if (approvedTorrents.length === 0) {
          console.log(`   ⚠️  没有已审核的种子可供测试`);
          continue;
        }
        
        // 找到忍者杀手第一集
        const ninjaKiller = approvedTorrents.find(t => t.name === '忍者杀手第一集');
        
        if (!ninjaKiller) {
          console.log(`   ⚠️  没有找到忍者杀手第一集种子`);
          continue;
        }
        
        console.log(`   📦 测试种子: ${ninjaKiller.name} (ID: ${ninjaKiller.id})`);
        console.log(`   📝 数据库info_hash: ${ninjaKiller.info_hash}`);
        
        // 4. 下载种子文件
        const downloadResponse = await axios.get(`${BASE_URL}/api/torrents/${ninjaKiller.id}/download`, {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'arraybuffer'
        });
        
        console.log(`   ⬇️  下载种子成功，大小: ${downloadResponse.data.byteLength} bytes`);
        
        // 5. 解析下载的种子文件
        const torrentData = Buffer.from(downloadResponse.data);
        const parsedTorrent = bencode.decode(torrentData);
        
        // 计算info_hash
        const infoBuffer = bencode.encode(parsedTorrent.info);
        const calculatedInfoHash = crypto.createHash('sha1').update(infoBuffer).digest('hex');
        
        // 验证announce URL
        const announceUrl = parsedTorrent.announce.toString();
        const expectedAnnounceUrl = `http://172.21.48.71:3001/tracker/announce/${passkey}`;
        
        console.log(`   🔍 解析结果:`);
        console.log(`     计算info_hash: ${calculatedInfoHash}`);
        console.log(`     数据库info_hash: ${ninjaKiller.info_hash}`);
        console.log(`     info_hash匹配: ${calculatedInfoHash === ninjaKiller.info_hash ? '✅ 是' : '❌ 否'}`);
        console.log(`     announce URL: ${announceUrl}`);
        console.log(`     期望announce URL: ${expectedAnnounceUrl}`);
        console.log(`     announce匹配: ${announceUrl === expectedAnnounceUrl ? '✅ 是' : '❌ 否'}`);
        console.log(`     私有标记: ${parsedTorrent.info.private || '未设置'}`);
        
        // 保存结果
        results[testUser.username] = {
          success: true,
          infoHash: calculatedInfoHash,
          announceUrl: announceUrl,
          passkey: passkey,
          infoHashMatches: calculatedInfoHash === ninjaKiller.info_hash,
          announceMatches: announceUrl === expectedAnnounceUrl
        };
        
        console.log(`   ✅ 用户 ${testUser.username} 测试通过\n`);
        
      } catch (error) {
        console.log(`   ❌ 用户 ${testUser.username} 测试失败: ${error.message}\n`);
        results[testUser.username] = {
          success: false,
          error: error.message
        };
      }
    }
    
    // 6. 汇总结果
    console.log('📊 端到端测试结果汇总:\n');
    
    const successfulUsers = Object.keys(results).filter(user => results[user].success);
    
    if (successfulUsers.length === 0) {
      console.log('❌ 所有用户测试都失败了');
      return;
    }
    
    console.log(`✅ 成功测试用户: ${successfulUsers.join(', ')}\n`);
    
    // 验证info_hash一致性
    const infoHashes = successfulUsers.map(user => results[user].infoHash);
    const uniqueInfoHashes = [...new Set(infoHashes)];
    
    console.log('🔍 Info Hash 一致性检查:');
    successfulUsers.forEach(user => {
      console.log(`   ${user.padEnd(8)}: ${results[user].infoHash}`);
    });
    
    console.log(`\n🎯 最终结果:`);
    console.log(`   测试用户数量: ${successfulUsers.length}`);
    console.log(`   唯一info_hash数量: ${uniqueInfoHashes.length}`);
    console.log(`   info_hash一致: ${uniqueInfoHashes.length === 1 ? '✅ 是' : '❌ 否'}`);
    
    // 验证announce URL差异
    const announceUrls = successfulUsers.map(user => results[user].announceUrl);
    const uniqueAnnounceUrls = [...new Set(announceUrls)];
    
    console.log(`   唯一announce URL数量: ${uniqueAnnounceUrls.length}`);
    console.log(`   announce URL不同: ${uniqueAnnounceUrls.length === successfulUsers.length ? '✅ 是' : '❌ 否'}`);
    
    // 最终判断
    const allInfoHashMatches = successfulUsers.every(user => results[user].infoHashMatches);
    const allAnnounceMatches = successfulUsers.every(user => results[user].announceMatches);
    
    if (uniqueInfoHashes.length === 1 && uniqueAnnounceUrls.length === successfulUsers.length && allInfoHashMatches && allAnnounceMatches) {
      console.log('\n🎉 端到端测试完全成功！');
      console.log('   ✅ 所有用户的种子具有相同的info_hash');
      console.log('   ✅ 每个用户有不同的announce URL');
      console.log('   ✅ 所有info_hash与数据库匹配');
      console.log('   ✅ 所有announce URL正确包含用户passkey');
      console.log('\n🚀 系统已准备好进行实际的P2P测试！');
    } else {
      console.log('\n⚠️  测试发现问题：');
      if (uniqueInfoHashes.length !== 1) {
        console.log('   ❌ info_hash不一致');
      }
      if (uniqueAnnounceUrls.length !== successfulUsers.length) {
        console.log('   ❌ announce URL不够多样化');
      }
      if (!allInfoHashMatches) {
        console.log('   ❌ 某些info_hash与数据库不匹配');
      }
      if (!allAnnounceMatches) {
        console.log('   ❌ 某些announce URL不正确');
      }
    }
    
  } catch (error) {
    console.error('❌ 端到端测试失败:', error);
  }
}

// 等待服务器启动后运行测试
setTimeout(() => {
  console.log('⏳ 等待服务器启动...\n');
  testEndToEndFlow();
}, 3000);

module.exports = { testEndToEndFlow };

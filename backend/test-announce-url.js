require('dotenv').config();
const axios = require('axios');
const bencode = require('bncode');

/**
 * 测试用户下载种子时的 announce URL
 */
async function testAnnounceUrl() {
  try {
    console.log('🔍 测试种子下载的 announce URL...\n');
    
    // 1. 登录admin用户
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ admin登录成功');
    
    // 2. 获取passkey
    const passkeyResponse = await axios.get('http://localhost:3001/api/users/passkey', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const passkey = passkeyResponse.data.passkey;
    console.log('🔑 admin passkey:', passkey);
    
    // 3. 获取种子列表
    const torrentsResponse = await axios.get('http://localhost:3001/api/torrents', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const approvedTorrents = torrentsResponse.data.torrents.filter(t => t.status === 'approved');
    
    if (approvedTorrents.length === 0) {
      console.log('❌ 没有可用的已审核种子');
      return;
    }
    
    const testTorrent = approvedTorrents[0];
    console.log(`📦 测试种子: ${testTorrent.name} (ID: ${testTorrent.id})`);
    
    // 4. 下载种子
    const downloadResponse = await axios.get(`http://localhost:3001/api/torrents/${testTorrent.id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` },
      responseType: 'arraybuffer'
    });
    
    console.log('⬇️ 种子下载成功');
    
    // 5. 解析种子文件
    const torrentData = Buffer.from(downloadResponse.data);
    const parsedTorrent = bencode.decode(torrentData);
    
    const announceUrl = parsedTorrent.announce.toString();
    const announceList = parsedTorrent['announce-list'] || [];
    
    console.log('\n📊 种子文件分析:');
    console.log(`announce URL: ${announceUrl}`);
    console.log(`announce-list: ${JSON.stringify(announceList.map(tier => tier.map(url => url.toString())))}`);
    
    // 6. 验证URL格式
    const expectedPattern = /^http:\/\/172\.21\.48\.71:3001\/tracker\/announce\/[a-f0-9]{32}$/;
    const isValidFormat = expectedPattern.test(announceUrl);
    
    console.log('\n🔍 验证结果:');
    console.log(`✅ 包含正确IP (172.21.48.71): ${announceUrl.includes('172.21.48.71')}`);
    console.log(`✅ 包含正确端口 (3001): ${announceUrl.includes(':3001')}`);
    console.log(`✅ 包含用户passkey: ${announceUrl.includes(passkey)}`);
    console.log(`✅ URL格式正确: ${isValidFormat}`);
    console.log(`❌ 不包含localhost: ${!announceUrl.includes('localhost')}`);
    
    if (isValidFormat && !announceUrl.includes('localhost')) {
      console.log('\n🎉 announce URL 配置完全正确！');
    } else {
      console.log('\n⚠️ announce URL 存在问题！');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testAnnounceUrl();

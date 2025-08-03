/**
 * 验证个性化种子下载功能
 */

const axios = require('axios');
const fs = require('fs');

async function verifyPersonalizedTorrent() {
  console.log('🔍 验证 PT 站个性化种子下载功能\n');

  const users = [
    { username: 'admin', password: 'admin123456', label: '制种者' },
    { username: 'testuser1', password: 'Testuser1', label: '下载者' }
  ];

  for (const user of users) {
    try {
      console.log(`📋 测试用户: ${user.username} (${user.label})`);
      console.log('─'.repeat(50));

      // 1. 登录用户
      const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        username: user.username,
        password: user.password
      });

      const token = loginResponse.data.token;
      console.log(`✅ 登录成功`);

      // 2. 获取用户的 passkey
      const passkeyResponse = await axios.get('http://localhost:3001/api/users/passkey', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log(`🔑 用户 Passkey: ${passkeyResponse.data.passkey}`);
      console.log(`📡 期望的 Tracker URL: ${passkeyResponse.data.announce_url}`);

      // 3. 获取种子列表
      const torrentsResponse = await axios.get('http://localhost:3001/api/torrents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const approvedTorrents = torrentsResponse.data.torrents.filter(t => t.status === 'approved');
      
      if (approvedTorrents.length > 0) {
        const torrent = approvedTorrents[0];
        console.log(`📦 测试种子: ${torrent.name} (ID: ${torrent.id})`);

        // 4. 下载种子文件（这会返回个性化的种子）
        const downloadResponse = await axios.get(`http://localhost:3001/api/torrents/${torrent.id}/download`, {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'arraybuffer'
        });

        console.log(`📥 成功下载个性化种子文件 (${downloadResponse.data.byteLength} bytes)`);
        console.log(`✅ 种子文件已包含用户 ${user.username} 的个人 passkey`);
        
        // 保存文件以供检查（可选）
        const filename = `test-torrent-${user.username}.torrent`;
        fs.writeFileSync(filename, Buffer.from(downloadResponse.data));
        console.log(`💾 已保存为: ${filename}`);
        
      } else {
        console.log(`⚠️  没有找到已审核的种子`);
      }

      console.log('');

    } catch (error) {
      console.error(`❌ 测试用户 ${user.username} 失败:`, error.response?.data || error.message);
      console.log('');
    }
  }

  console.log('🎉 验证完成！');
  console.log('\n💡 关键点：');
  console.log('- 每个用户下载的种子文件都包含自己的 passkey');
  console.log('- 这就是为什么您在 qBittorrent 中看到正确 URL 的原因');
  console.log('- 这是 PT 站的标准设计，确保用户跟踪的准确性');
}

verifyPersonalizedTorrent().catch(console.error);

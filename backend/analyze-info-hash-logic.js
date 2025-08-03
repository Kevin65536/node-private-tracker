require('dotenv').config();
const crypto = require('crypto');
const bencode = require('./utils/bencode');
const { buildAnnounceUrl } = require('./utils/passkey');
const fs = require('fs').promises;
const path = require('path');

async function analyzeInfoHashCalculation() {
  try {
    console.log('=== 分析Info Hash计算逻辑 ===\n');
    
    // 模拟不同用户的passkey
    const users = [
      { name: 'admin', passkey: '3c7ac6a8f6f28624698ce65a52f4fe61' },
      { name: 'testuser1', passkey: '9a5c1a8ea23d8b92a21ecca8751f873f' },
      { name: '507pc1', passkey: '310ecb2fecb38e32f8be0df29ae2952d' }
    ];
    
    // 使用用户指定的种子文件进行测试
    const testTorrentFile = '1754215785301-3ea5d355269d2200.torrent';
    const torrentPath = path.join(__dirname, 'uploads', testTorrentFile);
    
    console.log(`📁 使用种子文件: ${testTorrentFile}\n`);
    
    let originalTorrentData;
    try {
      originalTorrentData = await fs.readFile(torrentPath);
      console.log(`✅ 成功读取种子文件，大小: ${originalTorrentData.length} 字节`);
    } catch (error) {
      console.log(`❌ 无法读取种子文件: ${error.message}`);
      console.log('📁 尝试使用模拟数据...');
      // 创建模拟的种子数据
      const mockTorrent = {
        announce: Buffer.from('http://original-tracker.com/announce'),
        info: {
          name: Buffer.from('test-file.txt'),
          length: 1024,
          'piece length': 32768,
          pieces: Buffer.alloc(20, 0) // 模拟pieces
        }
      };
      originalTorrentData = bencode.encode(mockTorrent);
    }
    
    // 解析原始种子
    const originalTorrent = bencode.decode(originalTorrentData);
    const originalInfoBuffer = bencode.encode(originalTorrent.info);
    const originalInfoHash = crypto.createHash('sha1').update(originalInfoBuffer).digest('hex');
    
    console.log('📊 原始种子信息:');
    console.log(`   原始Announce: ${originalTorrent.announce.toString()}`);
    console.log(`   原始Info Hash: ${originalInfoHash}`);
    console.log(`   Info部分键: ${Object.keys(originalTorrent.info).join(', ')}`);
    console.log(`   是否有private标记: ${originalTorrent.info.private ? '是' : '否'}\n`);
    
    // 为每个用户生成修改后的种子
    console.log('🔄 为不同用户生成变体:\n');
    
    users.forEach(user => {
      console.log(`👤 用户: ${user.name}`);
      
      // 复制原始种子
      const userTorrent = JSON.parse(JSON.stringify(originalTorrent));
      
      // 修改announce URL
      const userAnnounceUrl = buildAnnounceUrl(user.passkey);
      userTorrent.announce = Buffer.from(userAnnounceUrl);
      
      // 添加private标记到info部分
      userTorrent.info.private = 1;
      
      // 计算修改后的info hash
      const modifiedInfoBuffer = bencode.encode(userTorrent.info);
      const modifiedInfoHash = crypto.createHash('sha1').update(modifiedInfoBuffer).digest('hex');
      
      console.log(`   Announce URL: ${userAnnounceUrl}`);
      console.log(`   修改后Info Hash: ${modifiedInfoHash}`);
      console.log(`   与原始Hash相同: ${modifiedInfoHash === originalInfoHash ? '是' : '否'}`);
      console.log('');
    });
    
    // 重要解释
    console.log('🔍 关键发现:');
    console.log('1. Info Hash只计算种子文件中"info"部分的内容');
    console.log('2. announce URL在"info"部分之外，不影响Info Hash计算');
    console.log('3. 只有修改"info"部分的内容才会改变Info Hash');
    console.log('4. 添加private=1到info部分会改变Hash，但对所有用户都是相同的修改');
    console.log('5. 因此不同用户的种子文件会产生相同的变体Hash\n');
    
    // 验证Info部分的内容
    console.log('📋 Info部分包含的字段:');
    console.log('   - name: 文件/文件夹名称');
    console.log('   - length 或 files: 文件大小或文件列表');
    console.log('   - piece length: 分块大小');
    console.log('   - pieces: 各分块的Hash值');
    console.log('   - private: 私有种子标记 (我们添加的)');
    console.log('\n📋 Info部分之外的字段:');
    console.log('   - announce: Tracker URL (包含passkey)');
    console.log('   - announce-list: 备用Tracker列表');
    console.log('   - comment: 注释');
    console.log('   - created by: 创建者信息');
    console.log('   - creation date: 创建时间');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

analyzeInfoHashCalculation();

require('dotenv').config();
const { Torrent } = require('./models');

async function checkTorrents() {
  try {
    const torrents = await Torrent.findAll({
      attributes: ['id', 'name', 'info_hash', 'status'],
      order: [['created_at', 'DESC']]
    });
    
    console.log('📋 数据库中的种子:');
    if (torrents.length === 0) {
      console.log('❌ 没有找到种子');
    } else {
      torrents.forEach(t => {
        console.log(`   ID: ${t.id} | Name: ${t.name}`);
        console.log(`   Info Hash: ${t.info_hash}`);
        console.log(`   Status: ${t.status}`);
        console.log('');
      });
    }
    
    console.log('🎯 需要的 Info Hash: 529936d5fc5685f79981fdd060687f32fd75e526');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

checkTorrents();

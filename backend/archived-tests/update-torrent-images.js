const { Client } = require('pg');

async function updateTorrentWithImage() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pt_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 查找第一个种子
    const result = await client.query('SELECT id, name, image_files FROM torrents LIMIT 1');
    
    if (result.rows.length > 0) {
      const torrent = result.rows[0];
      console.log(`找到种子: ID=${torrent.id}, 名称="${torrent.name}"`);
      console.log(`当前图片: ${JSON.stringify(torrent.image_files)}`);
      
      // 更新图片字段
      const imageFiles = ['1753970989559-73f0f934da8200f1.png'];
      await client.query(
        'UPDATE torrents SET image_files = $1 WHERE id = $2',
        [JSON.stringify(imageFiles), torrent.id]
      );
      
      console.log('✅ 图片更新成功!');
      console.log(`🔗 访问种子详情页面: http://localhost:3000/torrents/${torrent.id}`);
    } else {
      console.log('❌ 没有找到种子记录');
    }
    
  } catch (error) {
    console.error('操作失败:', error.message);
  } finally {
    await client.end();
  }
}

updateTorrentWithImage();

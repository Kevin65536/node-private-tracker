const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'pt_database',
  username: 'postgres',
  password: 'Kevin65536',
  logging: false
});

async function checkTorrents() {
  try {
    await sequelize.authenticate();
    
    const result = await sequelize.query('SELECT id, name, status FROM torrents ORDER BY id', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('数据库中的种子列表:');
    result.forEach(torrent => {
      console.log(`ID: ${torrent.id}, 名称: ${torrent.name}, 状态: ${torrent.status}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTorrents();

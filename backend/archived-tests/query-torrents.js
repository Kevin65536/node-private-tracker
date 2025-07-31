require('dotenv').config();
const { Torrent } = require('./models');

(async () => {
  try {
    await require('./models').sequelize.authenticate();
    const torrents = await Torrent.findAll({ 
      attributes: ['id', 'name', 'info_hash'],
      limit: 5 
    });
    
    console.log('Available torrents:');
    torrents.forEach(t => {
      console.log(`ID: ${t.id}`);
      console.log(`Name: ${t.name}`);
      console.log(`Info Hash: ${t.info_hash}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();

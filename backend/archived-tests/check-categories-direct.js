require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkCategories() {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'pt_database',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: process.env.DB_DIALECT || 'postgres',
      logging: false,
    }
  );

  try {
    console.log('🔍 查询分类数据...\n');
    
    const [results] = await sequelize.query('SELECT * FROM categories ORDER BY id');
    
    console.log('当前分类列表:');
    results.forEach(cat => {
      console.log(`ID: ${cat.id}, 名称: ${cat.name}, 描述: ${cat.description}`);
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkCategories();

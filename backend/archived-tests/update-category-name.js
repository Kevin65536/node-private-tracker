require('dotenv').config();
const { Sequelize } = require('sequelize');

async function updateCategoryName() {
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
    console.log('🔄 更新分类名称...\n');
    
    // 查询更新前的状态
    const [beforeResults] = await sequelize.query(
      "SELECT * FROM categories WHERE name = '电视剧'"
    );
    
    if (beforeResults.length > 0) {
      console.log('找到要更新的分类:');
      console.log(`ID: ${beforeResults[0].id}, 名称: ${beforeResults[0].name}, 描述: ${beforeResults[0].description}`);
      
      // 执行更新
      const [updateResult] = await sequelize.query(
        "UPDATE categories SET name = '剧集' WHERE name = '电视剧'"
      );
      
      console.log('✅ 更新成功！');
      
      // 查询更新后的状态
      const [afterResults] = await sequelize.query(
        "SELECT * FROM categories WHERE name = '剧集'"
      );
      
      if (afterResults.length > 0) {
        console.log('更新后的分类:');
        console.log(`ID: ${afterResults[0].id}, 名称: ${afterResults[0].name}, 描述: ${afterResults[0].description}`);
      }
      
    } else {
      console.log('❌ 没有找到名为"电视剧"的分类');
    }
    
    // 显示所有分类
    console.log('\n📂 当前所有分类:');
    const [allResults] = await sequelize.query('SELECT * FROM categories ORDER BY id');
    allResults.forEach(cat => {
      console.log(`ID: ${cat.id}, 名称: ${cat.name}, 描述: ${cat.description}`);
    });
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

updateCategoryName();

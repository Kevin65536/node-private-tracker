require('dotenv').config();
const { Sequelize } = require('sequelize');

// 导入模型
const User = require('./models/User');
const UserStats = require('./models/UserStats');
const Category = require('./models/Category');
const Torrent = require('./models/Torrent');
const Download = require('./models/Download');

async function checkDatabaseStatus() {
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
    console.log('🔍 检查数据库状态...\n');
    
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接正常');
    
    // 检查表是否存在
    const tableNames = ['users', 'user_stats', 'categories', 'torrents', 'downloads'];
    const existingTables = [];
    
    for (const tableName of tableNames) {
      try {
        const [results] = await sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );`
        );
        
        if (results[0].exists) {
          existingTables.push(tableName);
          
          // 获取表的记录数
          const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = countResult[0].count;
          console.log(`✅ 表 '${tableName}' 存在 (${count} 条记录)`);
        } else {
          console.log(`❌ 表 '${tableName}' 不存在`);
        }
      } catch (error) {
        console.log(`❌ 表 '${tableName}' 检查失败: ${error.message}`);
      }
    }
    
    console.log(`\n📊 总结: ${existingTables.length}/${tableNames.length} 个表已创建`);
    
    if (existingTables.length === 0) {
      console.log('\n⚠️  数据库表尚未创建，请运行: npm run init-db');
    } else if (existingTables.length < tableNames.length) {
      console.log('\n⚠️  部分表缺失，建议重新运行: npm run init-db');
    } else {
      console.log('\n🎉 所有数据库表都已正确创建！');
      
      // 检查管理员用户
      try {
        const [adminResult] = await sequelize.query(
          "SELECT * FROM users WHERE role = 'admin' LIMIT 1"
        );
        
        if (adminResult.length > 0) {
          console.log('👤 管理员用户已存在');
        } else {
          console.log('⚠️  尚未创建管理员用户');
        }
      } catch (error) {
        console.log('⚠️  无法检查管理员用户');
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseStatus();

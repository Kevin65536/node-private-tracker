require('dotenv').config();
const { Sequelize } = require('sequelize');

// 数据库连接配置
const sequelize = new Sequelize(
  process.env.DB_NAME || 'pt_database',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false, // 关闭SQL日志
  }
);

async function testConnection() {
  try {
    console.log('🔗 正在测试PostgreSQL数据库连接...');
    
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');
    
    // 获取数据库版本
    const [results] = await sequelize.query('SELECT version()');
    console.log(`📊 PostgreSQL版本: ${results[0].version.split(' ')[1]}`);
    
    // 检查数据库是否存在
    const [databases] = await sequelize.query(
      "SELECT datname FROM pg_database WHERE datname = :dbname",
      { replacements: { dbname: process.env.DB_NAME } }
    );
    
    if (databases.length > 0) {
      console.log(`🗄️  数据库 '${process.env.DB_NAME}' 已存在`);
    } else {
      console.log(`⚠️  数据库 '${process.env.DB_NAME}' 不存在，需要创建`);
    }
    
    console.log('\n📋 连接信息:');
    console.log(`   主机: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   数据库: ${process.env.DB_NAME}`);
    console.log(`   用户: ${process.env.DB_USER}`);
    
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(`   错误类型: ${error.name}`);
    console.error(`   错误信息: ${error.message}`);
    
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('\n🛠️  可能的解决方案:');
      console.error('   1. 确认PostgreSQL服务已启动');
      console.error('   2. 检查端口5432是否正确');
      console.error('   3. 确认防火墙设置');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.error('\n🛠️  可能的解决方案:');
      console.error('   1. 检查用户名和密码');
      console.error('   2. 确认用户权限');
      console.error('   3. 检查pg_hba.conf配置');
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('\n🛠️  可能的解决方案:');
      console.error('   1. 检查数据库是否存在');
      console.error('   2. 确认数据库名称正确');
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行测试
testConnection();

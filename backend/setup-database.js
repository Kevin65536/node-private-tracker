require('dotenv').config();
const { Sequelize } = require('sequelize');

async function setupDatabase() {
  const readline = require('readline');
  const fs = require('fs');
  const path = require('path');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
  }
  
  try {
    console.log('🚀 PostgreSQL数据库设置向导');
    console.log('============================\n');
    
    // 获取数据库连接信息
    const dbHost = await question('数据库主机 (localhost): ') || 'localhost';
    const dbPort = await question('数据库端口 (5432): ') || '5432';
    const dbUser = await question('数据库用户 (postgres): ') || 'postgres';
    const dbPassword = await question('数据库密码: ');
    const dbName = await question('数据库名称 (pt_database): ') || 'pt_database';
    
    console.log('\n🔗 正在测试连接到PostgreSQL服务器...');
    
    // 先连接到postgres数据库（默认数据库）
    const sequelize = new Sequelize('postgres', dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      logging: false,
    });
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL连接成功！');
    
    // 检查目标数据库是否存在
    const [databases] = await sequelize.query(
      "SELECT datname FROM pg_database WHERE datname = :dbname",
      { replacements: { dbname: dbName } }
    );
    
    if (databases.length === 0) {
      console.log(`📦 正在创建数据库 '${dbName}'...`);
      await sequelize.query(`CREATE DATABASE "${dbName}"`);
      console.log('✅ 数据库创建成功！');
    } else {
      console.log(`✅ 数据库 '${dbName}' 已存在`);
    }
    
    await sequelize.close();
    
    // 更新.env文件
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 更新数据库配置
    const dbConfig = {
      DB_NAME: dbName,
      DB_USER: dbUser,
      DB_PASSWORD: dbPassword,
      DB_HOST: dbHost,
      DB_PORT: dbPort,
      DB_DIALECT: 'postgres'
    };
    
    Object.entries(dbConfig).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env文件已更新');
    
    console.log('\n🎉 数据库设置完成！');
    console.log('\n📋 下一步操作:');
    console.log('   1. 运行 npm run test-db 测试连接');
    console.log('   2. 运行 npm run init-db 初始化数据表');
    console.log('   3. 运行 npm run dev:db 启动开发服务器');
    
  } catch (error) {
    console.error('❌ 设置过程中出现错误:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupDatabase();

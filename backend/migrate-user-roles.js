require('dotenv').config();
const { sequelize, User } = require('./models');

// 检查环境变量
function checkEnvironmentVariables() {
  console.log('检查环境变量...');
  
  const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
  const missingVars = [];
  
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      console.log(`  ${varName}: ${varName === 'DB_PASSWORD' ? '***' : value}`);
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ 缺少必要的环境变量:', missingVars.join(', '));
    console.error('请检查 .env 文件是否存在并包含所有必要的配置');
    process.exit(1);
  }
  
  console.log('✅ 环境变量检查通过');
}

async function migrateUserRoles() {
  try {
    // 检查环境变量
    checkEnvironmentVariables();
    
    console.log('\n开始迁移用户角色...');
    
    // 显示数据库连接信息（不显示密码）
    console.log('数据库连接信息:');
    console.log(`  数据库: ${process.env.DB_NAME}`);
    console.log(`  用户: ${process.env.DB_USER}`);
    console.log(`  主机: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`  方言: ${process.env.DB_DIALECT}`);
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 将所有 vip 和 moderator 用户改为普通用户
    const [updatedCount] = await User.update(
      { role: 'user' },
      { 
        where: { 
          role: ['vip', 'moderator'] 
        } 
      }
    );
    
    console.log(`✅ 已将 ${updatedCount} 个VIP/版主用户转换为普通用户`);
    
    // 显示所有用户的角色分布
    const userStats = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });
    
    console.log('\n📊 用户角色分布:');
    userStats.forEach(stat => {
      console.log(`  ${stat.role}: ${stat.count} 人`);
    });
    
    // 修改数据库结构 - 删除旧的角色类型
    console.log('\n🔧 更新数据库结构...');
    
    const dialect = sequelize.getDialect();
    console.log(`当前数据库类型: ${dialect}`);
    
    if (dialect === 'postgres') {
      // PostgreSQL 的枚举类型更新
      await sequelize.query(`
        ALTER TABLE users 
        ALTER COLUMN role TYPE VARCHAR(20)
      `);
      
      await sequelize.query(`
        DROP TYPE IF EXISTS "enum_users_role" CASCADE
      `);
      
      await sequelize.query(`
        CREATE TYPE "enum_users_role" AS ENUM ('user', 'admin')
      `);
      
      await sequelize.query(`
        ALTER TABLE users 
        ALTER COLUMN role TYPE "enum_users_role" 
        USING role::"enum_users_role"
      `);
    } else if (dialect === 'sqlite') {
      // SQLite 不需要特殊的枚举类型处理
      console.log('SQLite 数据库不需要特殊的枚举类型处理');
    }
    
    console.log('✅ 数据库结构更新完成');
    console.log('\n🎉 用户角色迁移完成！');
    console.log('现在系统只有两种用户角色：');
    console.log('  - user: 普通用户（可上传种子）');
    console.log('  - admin: 管理员（可管理系统）');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('数据库连接失败，请检查：');
      console.error('1. 数据库服务是否启动');
      console.error('2. .env 文件中的数据库配置是否正确');
      console.error('3. 数据库用户密码是否正确');
      console.error('4. 网络连接是否正常');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.error('数据库访问被拒绝，请检查用户名和密码');
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('数据库操作错误:', error.message);
    }
    
    console.error('\n完整错误信息:', error);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch (err) {
      console.error('关闭数据库连接时出错:', err.message);
    }
  }
}

// 运行迁移
if (require.main === module) {
  migrateUserRoles();
}

module.exports = migrateUserRoles;

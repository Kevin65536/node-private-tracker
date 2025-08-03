// 清理数据库中的旧IP地址
require('dotenv').config();
const { Sequelize } = require('sequelize');

// 数据库连接
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'pt_database',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Kevin65536',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false
});

const OLD_IP = '172.21.222.169';
const NEW_IP = '172.21.48.71';

async function cleanOldIPs() {
  try {
    console.log('🔍 开始检查和清理旧IP地址...');
    console.log(`🔄 从 ${OLD_IP} 更新到 ${NEW_IP}`);
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 首先检查数据库表结构
    console.log('\n📋 检查数据库表结构...');
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('数据库中的表:', tables.map(t => t.table_name));
    
    // 检查每个可能包含IP的表
    for (const table of tables) {
      const tableName = table.table_name;
      
      // 获取表字段
      const columns = await sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      // 查找可能包含URL或IP的字段
      const urlFields = columns.filter(c => 
        c.column_name.includes('url') || 
        c.column_name.includes('announce') || 
        c.column_name.includes('ip')
      );
      
      if (urlFields.length > 0) {
        console.log(`\n📋 检查表 ${tableName}, 字段: ${urlFields.map(f => f.column_name).join(', ')}`);
        
        for (const field of urlFields) {
          const fieldName = field.column_name;
          
          // 检查是否有旧IP
          const checkQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${fieldName} LIKE '%${OLD_IP}%'`;
          const checkResult = await sequelize.query(checkQuery, { type: Sequelize.QueryTypes.SELECT });
          
          if (checkResult[0].count > 0) {
            console.log(`发现 ${checkResult[0].count} 条包含旧IP的记录在 ${tableName}.${fieldName}`);
            
            // 更新记录
            const updateQuery = `UPDATE ${tableName} SET ${fieldName} = REPLACE(${fieldName}, '${OLD_IP}', '${NEW_IP}') WHERE ${fieldName} LIKE '%${OLD_IP}%'`;
            await sequelize.query(updateQuery);
            console.log(`✅ ${tableName}.${fieldName} 更新完成`);
          }
        }
      }
    }
    
    // 验证更新结果
    console.log('\n🔍 验证更新结果...');
    let totalRemaining = 0;
    
    for (const table of tables) {
      const tableName = table.table_name;
      const columns = await sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      const urlFields = columns.filter(c => 
        c.column_name.includes('url') || 
        c.column_name.includes('announce') || 
        c.column_name.includes('ip')
      );
      
      for (const field of urlFields) {
        const fieldName = field.column_name;
        const checkQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${fieldName} LIKE '%${OLD_IP}%'`;
        const checkResult = await sequelize.query(checkQuery, { type: Sequelize.QueryTypes.SELECT });
        totalRemaining += parseInt(checkResult[0].count);
      }
    }
    
    if (totalRemaining === 0) {
      console.log('🎉 所有旧IP地址已成功清理！');
    } else {
      console.log(`⚠️  仍有 ${totalRemaining} 条记录包含旧IP，请检查`);
    }
    
  } catch (error) {
    console.error('❌ 清理过程出错:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔚 数据库连接已关闭');
  }
}

cleanOldIPs();

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 数据库备份工具
 */
class DatabaseBackup {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'pt_database',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    };
  }

  /**
   * 创建备份
   */
  async createBackup(outputPath = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = path.join(__dirname, `backup_${this.dbConfig.database}_${timestamp}.sql`);
    const backupPath = outputPath || defaultPath;

    console.log('🔄 开始数据库备份...');
    console.log(`📂 备份文件: ${backupPath}`);

    const command = `pg_dump -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} -d ${this.dbConfig.database} -f "${backupPath}"`;

    return new Promise((resolve, reject) => {
      // 设置环境变量避免密码提示
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 备份失败:', error.message);
          reject(error);
          return;
        }

        if (stderr && !stderr.includes('NOTICE')) {
          console.warn('⚠️ 备份警告:', stderr);
        }

        // 检查备份文件是否存在且不为空
        if (fs.existsSync(backupPath)) {
          const stats = fs.statSync(backupPath);
          if (stats.size > 0) {
            console.log('✅ 备份完成');
            console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            resolve(backupPath);
          } else {
            console.error('❌ 备份文件为空');
            reject(new Error('备份文件为空'));
          }
        } else {
          console.error('❌ 备份文件未创建');
          reject(new Error('备份文件未创建'));
        }
      });
    });
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`备份文件不存在: ${backupPath}`);
    }

    console.log('🔄 开始数据库恢复...');
    console.log(`📂 备份文件: ${backupPath}`);

    const command = `psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} -d ${this.dbConfig.database} -f "${backupPath}"`;

    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 恢复失败:', error.message);
          reject(error);
          return;
        }

        if (stderr && !stderr.includes('NOTICE')) {
          console.warn('⚠️ 恢复警告:', stderr);
        }

        console.log('✅ 恢复完成');
        resolve();
      });
    });
  }

  /**
   * 创建数据库
   */
  async createDatabase() {
    console.log('🔄 创建数据库...');
    
    const command = `createdb -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} ${this.dbConfig.database}`;

    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          if (error.message.includes('already exists')) {
            console.log('✅ 数据库已存在');
            resolve();
          } else {
            console.error('❌ 创建数据库失败:', error.message);
            reject(error);
          }
          return;
        }

        console.log('✅ 数据库创建成功');
        resolve();
      });
    });
  }

  /**
   * 检查PostgreSQL连接
   */
  async testConnection() {
    console.log('🔄 测试数据库连接...');
    
    const command = `psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} -d postgres -c "SELECT version();"`;

    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 连接失败:', error.message);
          reject(error);
          return;
        }

        console.log('✅ PostgreSQL连接正常');
        console.log(stdout.split('\n')[2]); // 显示版本信息
        resolve();
      });
    });
  }
}

// 命令行接口
async function main() {
  const backup = new DatabaseBackup();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'backup':
        const backupPath = await backup.createBackup(args[1]);
        console.log(`\n📋 使用说明:`);
        console.log(`在目标服务器上恢复: node backup-db.js restore "${backupPath}"`);
        break;

      case 'restore':
        if (!args[1]) {
          console.error('❌ 请提供备份文件路径');
          process.exit(1);
        }
        await backup.restoreBackup(args[1]);
        break;

      case 'create':
        await backup.createDatabase();
        break;

      case 'test':
        await backup.testConnection();
        break;

      default:
        console.log('📋 数据库备份工具使用说明:');
        console.log('');
        console.log('命令:');
        console.log('  backup [输出路径]     - 创建数据库备份');
        console.log('  restore <备份文件>    - 恢复数据库备份');
        console.log('  create               - 创建数据库');
        console.log('  test                 - 测试数据库连接');
        console.log('');
        console.log('示例:');
        console.log('  node backup-db.js backup');
        console.log('  node backup-db.js backup ./my-backup.sql');
        console.log('  node backup-db.js restore ./backup.sql');
        console.log('  node backup-db.js create');
        console.log('  node backup-db.js test');
        break;
    }
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseBackup;

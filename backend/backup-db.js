require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 改进的数据库备份工具
 * 支持安全的完全重建恢复
 */
class ImprovedDatabaseBackup {
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

        if (fs.existsSync(backupPath)) {
          const stats = fs.statSync(backupPath);
          if (stats.size > 0) {
            console.log('✅ 备份完成');
            console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            
            // 验证并修复备份文件（处理PostgreSQL 17.6的新命令）
            this.validateAndFixBackup(backupPath).then(fixedPath => {
              resolve(fixedPath);
            }).catch(err => {
              console.warn('⚠️ 备份文件修复失败，使用原始文件:', err.message);
              resolve(backupPath);
            });
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
   * 安全的完全重建恢复
   * @param {string} backupPath 备份文件路径
   * @param {boolean} forceRebuild 是否强制重建数据库
   */
  async restoreBackupSafe(backupPath, forceRebuild = false) {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`备份文件不存在: ${backupPath}`);
    }

    console.log('🔄 开始安全数据库恢复...');
    console.log(`📂 备份文件: ${backupPath}`);

    if (forceRebuild) {
      console.log('⚠️  警告: 将完全重建数据库，所有现有数据将被删除！');
      console.log('⏳ 5秒后开始重建...');
      await this.sleep(5000);

      // 删除数据库
      await this.dropDatabase();
      
      // 重新创建数据库
      await this.createDatabase();
    } else {
      // 检查数据库是否存在表
      const hasExistingData = await this.checkExistingData();
      if (hasExistingData) {
        console.log('⚠️  检测到数据库中已有数据');
        console.log('建议使用 --force-rebuild 参数进行完全重建，或使用 --incremental 进行增量恢复');
        throw new Error('数据库中已有数据，请选择恢复策略');
      }
    }

    // 执行恢复
    await this.executeRestore(backupPath);
  }

  /**
   * 增量恢复（保留现有数据，可能产生冲突）
   */
  async restoreBackupIncremental(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`备份文件不存在: ${backupPath}`);
    }

    console.log('🔄 开始增量数据库恢复...');
    console.log('⚠️  注意: 此操作可能产生数据冲突');
    console.log(`📂 备份文件: ${backupPath}`);

    await this.executeRestore(backupPath, true);
  }

  /**
   * 执行恢复操作
   */
  async executeRestore(backupPath, ignoreErrors = false) {
    const command = `psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} -d ${this.dbConfig.database} -f "${backupPath}"`;

    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error && !ignoreErrors) {
          console.error('❌ 恢复失败:', error.message);
          reject(error);
          return;
        }

        // 分析错误类型
        if (stderr) {
          const errorLines = stderr.split('\n').filter(line => line.includes('错误:'));
          const warningLines = stderr.split('\n').filter(line => line.includes('NOTICE'));
          
          console.log(`\n📊 恢复统计:`);
          console.log(`⚠️  错误数量: ${errorLines.length}`);
          console.log(`ℹ️  通知数量: ${warningLines.length}`);

          if (errorLines.length > 0) {
            console.log('\n🔍 错误类型分析:');
            const errorTypes = this.analyzeErrors(stderr);
            Object.entries(errorTypes).forEach(([type, count]) => {
              console.log(`  ${type}: ${count}次`);
            });

            if (!ignoreErrors) {
              console.error('\n❌ 恢复过程中出现错误，建议使用完全重建模式');
              reject(new Error('恢复过程中出现错误'));
              return;
            }
          }
        }

        console.log('✅ 恢复完成');
        
        // 验证恢复结果
        this.verifyRestore().then(isValid => {
          if (isValid) {
            console.log('✅ 数据库验证通过');
          } else {
            console.warn('⚠️  数据库验证失败，建议检查数据完整性');
          }
          resolve();
        }).catch(err => {
          console.warn('⚠️  无法验证数据库状态:', err.message);
          resolve();
        });
      });
    });
  }

  /**
   * 分析错误类型
   */
  analyzeErrors(stderr) {
    const errorTypes = {
      '已经存在': 0,
      '重复键违反': 0,
      '约束冲突': 0,
      '其他错误': 0
    };

    const lines = stderr.split('\n');
    lines.forEach(line => {
      if (line.includes('已经存在')) {
        errorTypes['已经存在']++;
      } else if (line.includes('重复键违反')) {
        errorTypes['重复键违反']++;
      } else if (line.includes('约束')) {
        errorTypes['约束冲突']++;
      } else if (line.includes('错误:')) {
        errorTypes['其他错误']++;
      }
    });

    return errorTypes;
  }

  /**
   * 检查数据库是否有现有数据
   */
  async checkExistingData() {
    const command = `psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} -d ${this.dbConfig.database} -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`;

    return new Promise((resolve) => {
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          resolve(false);
          return;
        }

        const tableCount = parseInt(stdout.split('\n')[2]?.trim() || '0');
        resolve(tableCount > 0);
      });
    });
  }

  /**
   * 验证恢复结果
   */
  async verifyRestore() {
    const command = `psql -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} -d ${this.dbConfig.database} -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"`;

    return new Promise((resolve) => {
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          resolve(false);
          return;
        }

        const tables = stdout.split('\n').slice(2, -3).filter(line => line.trim());
        console.log(`\n📋 恢复的表 (${tables.length}个):`);
        tables.forEach(table => console.log(`  📄 ${table.trim()}`));
        
        resolve(tables.length > 0);
      });
    });
  }

  /**
   * 删除数据库
   */
  async dropDatabase() {
    console.log('🗑️  删除现有数据库...');
    
    const command = `dropdb -h ${this.dbConfig.host} -p ${this.dbConfig.port} -U ${this.dbConfig.username} ${this.dbConfig.database}`;

    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log('ℹ️  数据库不存在，跳过删除');
            resolve();
          } else {
            console.error('❌ 删除数据库失败:', error.message);
            reject(error);
          }
          return;
        }

        console.log('✅ 数据库删除成功');
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
   * 测试连接
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
        console.log(stdout.split('\n')[2]);
        resolve();
      });
    });
  }

  /**
   * 延时函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证并修复备份文件
   * 处理PostgreSQL 17.6中的\restrict和\unrestrict命令
   */
  async validateAndFixBackup(backupPath) {
    console.log('🔍 验证备份文件兼容性...');
    
    try {
      const content = fs.readFileSync(backupPath, 'utf8');
      
      // 检查是否包含不兼容的psql元命令
      const hasRestrictCommands = content.includes('\\restrict') || content.includes('\\unrestrict');
      
      if (hasRestrictCommands) {
        console.log('⚠️ 检测到PostgreSQL 17.6兼容性问题');
        console.log('🔧 正在修复备份文件...');
        
        // 移除\restrict和\unrestrict命令
        const fixedContent = content
          .split('\n')
          .filter(line => !line.match(/^\\(restrict|unrestrict)/))
          .join('\n');
        
        // 创建修复后的文件
        const fixedPath = backupPath.replace('.sql', '_fixed.sql');
        fs.writeFileSync(fixedPath, fixedContent, 'utf8');
        
        const originalStats = fs.statSync(backupPath);
        const fixedStats = fs.statSync(fixedPath);
        
        console.log('✅ 备份文件修复完成');
        console.log(`📊 原始文件: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📊 修复文件: ${(fixedStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📂 修复文件: ${fixedPath}`);
        
        return fixedPath;
      } else {
        console.log('✅ 备份文件兼容性检查通过');
        return backupPath;
      }
    } catch (error) {
      console.warn('⚠️ 备份文件验证失败:', error.message);
      return backupPath;
    }
  }

  /**
   * 修复现有的不兼容备份文件
   */
  async fixIncompatibleBackup(inputPath, outputPath = null) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`备份文件不存在: ${inputPath}`);
    }

    const fixedPath = outputPath || inputPath.replace('.sql', '_fixed.sql');
    
    console.log('🔧 开始修复不兼容的备份文件...');
    console.log(`📂 输入文件: ${inputPath}`);
    console.log(`📂 输出文件: ${fixedPath}`);

    try {
      const content = fs.readFileSync(inputPath, 'utf8');
      
      // 统计需要移除的命令
      const restrictLines = content.split('\n').filter(line => line.match(/^\\restrict/));
      const unrestrictLines = content.split('\n').filter(line => line.match(/^\\unrestrict/));
      
      console.log(`🔍 发现问题命令:`);
      console.log(`  \\restrict: ${restrictLines.length}个`);
      console.log(`  \\unrestrict: ${unrestrictLines.length}个`);
      
      if (restrictLines.length === 0 && unrestrictLines.length === 0) {
        console.log('✅ 备份文件无需修复');
        return inputPath;
      }
      
      // 移除问题命令
      const fixedContent = content
        .split('\n')
        .filter(line => !line.match(/^\\(restrict|unrestrict)/))
        .join('\n');
      
      fs.writeFileSync(fixedPath, fixedContent, 'utf8');
      
      const originalStats = fs.statSync(inputPath);
      const fixedStats = fs.statSync(fixedPath);
      
      console.log('✅ 备份文件修复完成');
      console.log(`📊 原始文件: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📊 修复文件: ${(fixedStats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return fixedPath;
    } catch (error) {
      console.error('❌ 修复失败:', error.message);
      throw error;
    }
  }
}

// 命令行接口
async function main() {
  const backup = new ImprovedDatabaseBackup();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'backup':
        const backupPath = await backup.createBackup(args[1]);
        console.log(`\n📋 使用说明:`);
        console.log(`安全恢复: node backup-db.js restore-safe "${backupPath}" --force-rebuild`);
        console.log(`增量恢复: node backup-db.js restore-incremental "${backupPath}"`);
        break;

      case 'restore-safe':
        if (!args[1]) {
          console.error('❌ 请提供备份文件路径');
          process.exit(1);
        }
        const forceRebuild = args.includes('--force-rebuild');
        await backup.restoreBackupSafe(args[1], forceRebuild);
        break;

      case 'restore-incremental':
        if (!args[1]) {
          console.error('❌ 请提供备份文件路径');
          process.exit(1);
        }
        await backup.restoreBackupIncremental(args[1]);
        break;

      case 'create':
        await backup.createDatabase();
        break;

      case 'test':
        await backup.testConnection();
        break;

      case 'fix':
        if (!args[1]) {
          console.error('❌ 请提供备份文件路径');
          process.exit(1);
        }
        const fixedPath = await backup.fixIncompatibleBackup(args[1], args[2]);
        console.log(`\n📋 修复完成，可以使用以下命令恢复:`);
        console.log(`node backup-db.js restore-safe "${fixedPath}" --force-rebuild`);
        break;

      default:
        console.log('📋 改进的数据库备份工具使用说明:');
        console.log('');
        console.log('命令:');
        console.log('  backup [输出路径]                    - 创建数据库备份');
        console.log('  restore-safe <备份文件> [--force-rebuild] - 安全恢复 (推荐)');
        console.log('  restore-incremental <备份文件>       - 增量恢复 (可能有冲突)');
        console.log('  fix <备份文件> [输出路径]            - 修复不兼容的备份文件');
        console.log('  create                               - 创建数据库');
        console.log('  test                                 - 测试数据库连接');
        console.log('');
        console.log('恢复策略说明:');
        console.log('  🟢 安全恢复: 检查现有数据，避免冲突');
        console.log('  🟡 强制重建: 删除现有数据库，完全重建 (--force-rebuild)');
        console.log('  🔴 增量恢复: 在现有数据上恢复，可能产生冲突');
        console.log('  🔧 修复文件: 移除PostgreSQL 17.6不兼容命令');
        console.log('');
        console.log('示例:');
        console.log('  node backup-db.js backup');
        console.log('  node backup-db.js restore-safe ./backup.sql');
        console.log('  node backup-db.js restore-safe ./backup.sql --force-rebuild');
        console.log('  node backup-db.js restore-incremental ./backup.sql');
        console.log('  node backup-db.js fix ./backup_problematic.sql');
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

module.exports = ImprovedDatabaseBackup;

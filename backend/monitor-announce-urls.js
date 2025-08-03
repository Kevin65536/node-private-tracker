require('dotenv').config();
const { InfoHashVariant } = require('./models');

/**
 * 监控脚本：检查数据库中是否有错误的 announce URL
 * 可以定期运行此脚本来发现配置问题
 */
async function monitorAnnounceUrls() {
  try {
    console.log('🔍 监控数据库中的 Announce URLs...\n');
    
    // 检查当前环境配置
    console.log('📋 环境配置检查:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   ANNOUNCE_URL: ${process.env.ANNOUNCE_URL}`);
    
    // 环境配置验证
    const warnings = [];
    const errors = [];
    
    if (!process.env.ANNOUNCE_URL) {
      warnings.push('ANNOUNCE_URL 环境变量未设置，将使用自动检测');
    } else if (process.env.ANNOUNCE_URL.includes('localhost')) {
      if (process.env.NODE_ENV === 'production') {
        errors.push('生产环境使用了 localhost URL');
      } else {
        warnings.push('开发环境使用 localhost（正常）');
      }
    }
    
    if (process.env.ANNOUNCE_URL && !process.env.ANNOUNCE_URL.startsWith('http')) {
      errors.push('ANNOUNCE_URL 必须以 http:// 或 https:// 开头');
    }
    
    // 显示检查结果
    if (warnings.length > 0) {
      console.log('\n⚠️  警告:');
      warnings.forEach(w => console.log(`   - ${w}`));
    }
    
    if (errors.length > 0) {
      console.log('\n❌ 错误:');
      errors.forEach(e => console.log(`   - ${e}`));
    }
    
    if (warnings.length === 0 && errors.length === 0) {
      console.log('   ✅ 环境配置正确');
    }
    
    // 检查数据库中的URL
    console.log('\n🔍 数据库检查:');
    
    const allVariants = await InfoHashVariant.findAll({
      attributes: ['id', 'announce_url', 'user_passkey', 'created_at']
    });
    
    let localhostCount = 0;
    let invalidCount = 0;
    let correctCount = 0;
    
    for (const variant of allVariants) {
      if (!variant.announce_url) {
        continue;
      }
      
      // 跳过特殊标记（如 "original"）
      if (variant.announce_url === 'original' || variant.announce_url === 'placeholder') {
        continue;
      }
      
      if (variant.announce_url.includes('localhost')) {
        localhostCount++;
        console.log(`   ❌ ID ${variant.id}: 使用 localhost`);
      } else if (!variant.announce_url.startsWith('http')) {
        invalidCount++;
        console.log(`   ❌ ID ${variant.id}: 无效格式 - ${variant.announce_url}`);
      } else {
        correctCount++;
      }
    }
    
    console.log(`\n📊 统计结果:`);
    console.log(`   总记录数: ${allVariants.length}`);
    console.log(`   正确配置: ${correctCount}`);
    console.log(`   localhost问题: ${localhostCount}`);
    console.log(`   其他问题: ${invalidCount}`);
    
    // 总体状态
    if (localhostCount > 0 || invalidCount > 0 || errors.length > 0) {
      console.log('\n🚨 发现问题！建议操作:');
      
      if (errors.length > 0) {
        console.log('   1. 修复 .env 文件中的环境变量配置');
      }
      
      if (localhostCount > 0) {
        console.log('   2. 运行修复脚本: node fix-announce-urls.js');
      }
      
      console.log('   3. 重新启动服务器以确保新配置生效');
      process.exit(1);
    } else {
      console.log('\n✅ 一切正常！');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ 监控失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  monitorAnnounceUrls();
}

module.exports = { monitorAnnounceUrls };

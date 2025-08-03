require('dotenv').config();
const { InfoHashVariant } = require('./models');

/**
 * 清理 InfoHashVariant 表
 * 删除所有变体记录，因为我们已经修复了种子生成逻辑
 */
async function cleanupInfoHashVariants() {
  try {
    console.log('🧹 开始清理 InfoHashVariant 表...\n');
    
    // 查看当前变体数量
    const count = await InfoHashVariant.count();
    console.log(`📊 当前变体记录数量: ${count}`);
    
    if (count === 0) {
      console.log('✅ 没有需要清理的变体记录');
      return;
    }
    
    // 显示一些示例记录
    const sampleVariants = await InfoHashVariant.findAll({
      limit: 5,
      attributes: ['id', 'variant_info_hash', 'user_passkey', 'created_at']
    });
    
    console.log('\n📋 示例变体记录:');
    sampleVariants.forEach((variant, index) => {
      console.log(`   ${index + 1}. ID: ${variant.id}, Hash: ${variant.variant_info_hash}, 创建时间: ${variant.created_at}`);
    });
    
    // 确认删除
    console.log('\n⚠️  准备删除所有 InfoHashVariant 记录...');
    console.log('   原因：已修复种子生成逻辑，info_hash 现在保持一致');
    console.log('   这些变体记录不再需要');
    
    // 删除所有记录
    const deletedCount = await InfoHashVariant.destroy({
      where: {},
      truncate: true // 完全清空表
    });
    
    console.log(`\n✅ 清理完成！删除了 ${deletedCount} 个变体记录`);
    console.log('🎯 现在所有用户下载的种子都将具有相同的 info_hash');
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

// 运行清理
if (require.main === module) {
  cleanupInfoHashVariants();
}

module.exports = { cleanupInfoHashVariants };

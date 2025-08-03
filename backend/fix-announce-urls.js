require('dotenv').config();
const { InfoHashVariant } = require('./models');
const { buildAnnounceUrl } = require('./utils/passkey');

async function fixAnnounceUrls() {
  try {
    console.log('🔧 修复数据库中的 Announce URLs...\n');
    
    console.log('📋 当前环境配置:');
    console.log(`   ANNOUNCE_URL: ${process.env.ANNOUNCE_URL}`);
    console.log(`   正确的基础URL应该是: ${process.env.ANNOUNCE_URL}\n`);
    
    // 查找所有包含 localhost 的记录
    const localhostVariants = await InfoHashVariant.findAll({
      where: {
        announce_url: {
          [require('sequelize').Op.like]: '%localhost%'
        }
      }
    });
    
    console.log(`🔍 找到 ${localhostVariants.length} 个需要修复的记录:\n`);
    
    if (localhostVariants.length === 0) {
      console.log('✅ 没有找到需要修复的记录');
      process.exit(0);
    }
    
    let fixedCount = 0;
    
    for (const variant of localhostVariants) {
      console.log(`🔧 修复记录 ID: ${variant.id}`);
      console.log(`   原始URL: ${variant.announce_url}`);
      
      if (variant.user_passkey) {
        // 使用正确的环境变量重新生成 URL
        const correctUrl = buildAnnounceUrl(variant.user_passkey);
        console.log(`   新URL: ${correctUrl}`);
        
        await variant.update({
          announce_url: correctUrl
        });
        
        fixedCount++;
        console.log(`   ✅ 修复完成\n`);
      } else {
        console.log(`   ⚠️  跳过: 缺少 user_passkey\n`);
      }
    }
    
    console.log(`📊 修复结果:`);
    console.log(`   总共处理: ${localhostVariants.length}个记录`);
    console.log(`   成功修复: ${fixedCount}个记录`);
    console.log(`   跳过: ${localhostVariants.length - fixedCount}个记录`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ 修复完成！所有的 localhost URL 已更新为正确的地址`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}

fixAnnounceUrls();

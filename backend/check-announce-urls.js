require('dotenv').config();
const { InfoHashVariant, Torrent } = require('./models');
const { buildAnnounceUrl } = require('./utils/passkey');

async function checkAnnounceUrls() {
  try {
    console.log('🔍 检查数据库中的 Announce URLs...\n');
    
    // 检查当前环境变量
    console.log('📋 环境变量配置:');
    console.log(`   ANNOUNCE_URL: ${process.env.ANNOUNCE_URL}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    
    // 测试 buildAnnounceUrl 函数
    const testPasskey = 'test123456789012345678901234567890';
    const generatedUrl = buildAnnounceUrl(testPasskey);
    console.log(`   测试生成的URL: ${generatedUrl}\n`);
    
    // 查询所有的 info_hash_variants
    const variants = await InfoHashVariant.findAll({
      include: [{
        model: Torrent,
        as: 'originalTorrent',
        attributes: ['id', 'name']
      }]
    });
    
    console.log(`📊 找到 ${variants.length} 个 info_hash 变体:\n`);
    
    let localhostCount = 0;
    let correctCount = 0;
    
    for (const variant of variants) {
      const isLocalhost = variant.announce_url && variant.announce_url.includes('localhost');
      const isCorrect = variant.announce_url && variant.announce_url.includes('172.21.222.169');
      
      if (isLocalhost) localhostCount++;
      if (isCorrect) correctCount++;
      
      console.log(`${isLocalhost ? '❌' : '✅'} ID: ${variant.id}`);
      console.log(`   原始种子: ${variant.originalTorrent?.name || '未知'}`);
      console.log(`   Info Hash: ${variant.variant_info_hash}`);
      console.log(`   Passkey: ${variant.user_passkey}`);
      console.log(`   Announce URL: ${variant.announce_url}`);
      console.log(`   创建时间: ${variant.created_at}\n`);
    }
    
    console.log('📈 统计结果:');
    console.log(`   包含 localhost 的: ${localhostCount}个`);
    console.log(`   包含正确地址的: ${correctCount}个`);
    console.log(`   总计: ${variants.length}个\n`);
    
    if (localhostCount > 0) {
      console.log('⚠️  发现问题: 有 announce_url 包含 localhost');
      console.log('💡 可能的原因:');
      console.log('   1. 数据是在环境变量未正确设置时创建的');
      console.log('   2. 代码在某些情况下使用了默认的 localhost 值');
      console.log('   3. 历史数据残留');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

checkAnnounceUrls();

require('dotenv').config();
const { getAllIPs, getBestLocalIP, buildDynamicAnnounceUrl, setupAnnounceUrl } = require('./utils/network');

console.log('🌐 网络配置测试\n');

// 1. 显示所有网络接口
console.log('📋 所有网络接口:');
const allIPs = getAllIPs();
allIPs.forEach(ip => {
  const typeIcon = ip.type === 'private' ? '🏠' : 
                  ip.type === 'public' ? '🌐' : '🔄';
  console.log(`   ${typeIcon} ${ip.interface}: ${ip.ip} (${ip.type}${ip.internal ? ', internal' : ''})`);
});

// 2. 获取最佳IP
console.log('\n🎯 推荐的IP地址:');
const bestIP = getBestLocalIP();
console.log(`   IP: ${bestIP.ip}`);
console.log(`   接口: ${bestIP.interface}`);
console.log(`   类型: ${bestIP.type}`);
console.log(`   优先级: ${bestIP.priority}`);

// 3. 构建动态URL
console.log('\n🔗 动态URL构建:');
const dynamicUrl = buildDynamicAnnounceUrl(3001);
console.log(`   URL: ${dynamicUrl.url}`);
console.log(`   来源: ${dynamicUrl.source}`);

// 4. 测试环境变量设置
console.log('\n⚙️  环境变量测试:');
console.log(`   当前 ANNOUNCE_URL: ${process.env.ANNOUNCE_URL}`);

// 备份原始值
const originalUrl = process.env.ANNOUNCE_URL;

// 测试自动设置
const result = setupAnnounceUrl(3001);
console.log(`   设置后 ANNOUNCE_URL: ${process.env.ANNOUNCE_URL}`);

// 恢复原始值
process.env.ANNOUNCE_URL = originalUrl;

console.log('\n✅ 网络配置测试完成');

// 5. 提供手动配置示例
console.log('\n💡 使用建议:');
console.log('   开发环境: 自动检测IP (推荐)');
console.log('   生产环境: 手动设置 ANNOUNCE_URL=https://your-domain.com:3001');
console.log('   本地测试: ANNOUNCE_URL=http://localhost:3001');

if (bestIP.type === 'private') {
  console.log(`\n🏠 检测到局域网环境，建议的配置:`);
  console.log(`   ANNOUNCE_URL=${dynamicUrl.url}`);
  console.log(`   前端可访问: http://${bestIP.ip}:3000`);
}

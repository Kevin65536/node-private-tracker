require('dotenv').config();
const { Peer } = require('./models');

async function suggestTroubleshooting() {
    console.log('🔧 qBittorrent P2P 连接故障排除');
    console.log('='.repeat(60));
    
    console.log('\n📋 当前问题分析:');
    console.log('   ✅ Tracker 连接正常');
    console.log('   ✅ BitTorrent 握手成功'); 
    console.log('   ✅ Peer 发现正常');
    console.log('   ❌ 数据传输失败 (0% 下载进度)');
    
    console.log('\n🔍 可能的原因和解决方案:');
    
    console.log('\n1. 📡 加密设置不匹配');
    console.log('   问题: 两个qBittorrent的加密设置不同');
    console.log('   解决: 在两个设备的qBittorrent中:');
    console.log('   ├─ 设置 -> 连接 -> 协议加密');
    console.log('   ├─ 设置为 "允许" 或 "禁用" (保持一致)');
    console.log('   └─ 不要设置为 "必需"');
    
    console.log('\n2. 🔒 端口转发问题');
    console.log('   问题: 虽然端口可以连接，但数据传输被阻止');
    console.log('   解决: ');
    console.log('   ├─ 检查路由器端口转发设置');
    console.log('   ├─ 尝试使用UPnP自动端口映射');
    console.log('   └─ 在qBittorrent中启用UPnP/NAT-PMP');
    
    console.log('\n3. 🛡️ 防火墙深度检测');
    console.log('   问题: 防火墙允许连接但阻止数据传输');
    console.log('   解决: ');
    console.log('   ├─ 临时完全关闭Windows防火墙测试');
    console.log('   ├─ 添加qBittorrent到防火墙例外');
    console.log('   └─ 检查第三方防火墙软件');
    
    console.log('\n4. 🚀 qBittorrent 连接限制');
    console.log('   问题: 连接数或速度限制');
    console.log('   解决: ');
    console.log('   ├─ 设置 -> 连接 -> 全局最大连接数 (提高到500+)');
    console.log('   ├─ 每个种子最大连接数 (提高到100+)');
    console.log('   └─ 检查速度限制设置');
    
    console.log('\n5. 📁 文件权限问题');
    console.log('   问题: 下载文件夹权限不足');
    console.log('   解决: ');
    console.log('   ├─ 检查下载文件夹是否可写');
    console.log('   ├─ 尝试更换下载位置');
    console.log('   └─ 以管理员权限运行qBittorrent');
    
    console.log('\n🛠️ 建议的测试步骤:');
    console.log('\n   第一步: 加密设置');
    console.log('   ├─ 在admin设备: qBittorrent -> 设置 -> 连接 -> 协议加密 -> "允许"');
    console.log('   └─ 在testuser1设备: 同样设置为 "允许"');
    
    console.log('\n   第二步: 重新开始种子');
    console.log('   ├─ 停止所有种子');
    console.log('   ├─ 重启两个qBittorrent');
    console.log('   └─ 重新开始种子');
    
    console.log('\n   第三步: 网络测试');
    console.log('   ├─ 临时关闭防火墙');
    console.log('   ├─ 在qBittorrent中启用详细日志');
    console.log('   └─ 观察连接日志');
    
    console.log('\n   第四步: 手动添加Peer');
    console.log('   ├─ 在testuser1的qBittorrent中');
    console.log('   ├─ 右键种子 -> 添加Peer -> 172.21.222.169:27633');
    console.log('   └─ 强制连接到admin');
    
    console.log('\n📊 监控命令:');
    console.log('   运行: node check-activity.js');
    console.log('   每隔2分钟检查一次下载进度');
    
    console.log('\n🎯 成功标志:');
    console.log('   ├─ testuser1显示有做种者连接');
    console.log('   ├─ 下载进度开始增加');
    console.log('   └─ 下载完成后自动转为做种状态');
}

suggestTroubleshooting().then(() => {
    process.exit(0);
}).catch(console.error);

# 🚀 PT站双设备P2P测试完整指南

## 🎯 测试目标
在两台设备之间实现真实的 BitTorrent P2P 下载，验证 PT 站的完整功能。

## 📋 测试准备
### 设备信息
- **设备A (Seeder)**: IP `172.21.77.185` - 管理员账户 (admin)
- **设备B (Leecher)**: IP `172.21.222.169` - 测试用户 (testuser1)

### 用户Passkey
- **admin**: `3c7ac6a8f6f28624698ce65a52f4fe61`
- **testuser1**: `9a5c1a8ea23d8b92a21ecca8751f873f`

## 🔧 步骤1: 准备测试文件
在设备A (Seeder) 上：

```bash
# 创建测试文件
mkdir C:\pt-test
cd C:\pt-test
echo "这是PT站测试文件的内容，用于验证P2P下载功能。" > test-content.txt
```

## 🌐 步骤2: 上传种子到PT站
1. 打开浏览器访问: `http://172.21.77.185:3000`
2. 使用 admin 账户登录
3. 进入种子上传页面
4. 上传包含 `test-content.txt` 的种子文件
5. 记录下载得到的种子文件路径

## 📥 步骤3: 设备A配置 (Seeder)
1. 打开 qBittorrent
2. 添加刚刚下载的个性化种子文件
3. 确保文件路径指向 `C:\pt-test\test-content.txt`
4. 开始做种 (Seeding)

## 📤 步骤4: 设备B配置 (Leecher)
1. 访问 `http://172.21.77.185:3000`
2. 使用 testuser1 账户登录
3. 下载同一个种子文件（会自动注入testuser1的passkey）
4. 在设备B上打开 qBittorrent
5. 添加下载的种子文件
6. 选择下载目录
7. 开始下载

## 🔍 步骤5: 监控和验证
运行实时监控脚本查看P2P状态：

```bash
# 在后端目录运行
node -e "
require('dotenv').config();
const { Peer, User, AnnounceLog } = require('./models');

async function monitorP2P() {
  setInterval(async () => {
    console.clear();
    console.log('🔄 PT站 P2P 实时监控 - ' + new Date().toLocaleTimeString());
    console.log('='.repeat(50));
    
    // 检查活跃peers
    const peers = await Peer.findAll({
      include: [{ model: User, attributes: ['username'] }],
      order: [['last_announce', 'DESC']]
    });
    
    console.log('🌐 当前活跃 Peers:');
    if (peers.length === 0) {
      console.log('   ❌ 没有活跃的 Peers');
    } else {
      peers.forEach(peer => {
        const status = peer.left > 0 ? '⬇️ 下载中' : '⬆️ 做种中';
        console.log(\`   \${status} \${peer.User.username}: \${peer.ip}:\${peer.port}\`);
        console.log(\`      上传: \${peer.uploaded} | 下载: \${peer.downloaded} | 剩余: \${peer.left}\`);
        console.log(\`      最后通告: \${peer.last_announce}\`);
      });
    }
    
    // 检查最近的announce
    const recentAnnounces = await AnnounceLog.findAll({
      include: [{ model: User, attributes: ['username'] }],
      order: [['announced_at', 'DESC']],
      limit: 5
    });
    
    console.log('\\n📡 最近 Announce 记录:');
    recentAnnounces.forEach(log => {
      console.log(\`   \${log.User.username}: \${log.event} (\${log.announced_at.toLocaleTimeString()})\`);
    });
    
  }, 5000);
}

monitorP2P();
"
```

## ✅ 成功指标
1. **Tracker 响应**: 两个设备都能成功连接到tracker
2. **Peer 发现**: 设备B能发现设备A作为seeder
3. **数据传输**: 设备B成功从设备A下载文件
4. **统计更新**: 用户上传/下载统计正确更新

## 🐛 故障排除
### 连接问题
- 确保防火墙允许 BitTorrent 端口 (通常6881-6889)
- 检查两设备在同一网络且能互相访问
- 验证 tracker URL 中的 passkey 正确

### Tracker 问题
```bash
# 测试 tracker 连接
curl "http://172.21.77.185:3001/tracker/announce/YOUR_PASSKEY?info_hash=test&peer_id=test&port=6881&uploaded=0&downloaded=0&left=1000"
```

### 数据库检查
```bash
# 检查用户统计
node -e "
require('dotenv').config();
const { UserStats, User } = require('./models');
UserStats.findAll({
  include: [{ model: User, attributes: ['username'] }]
}).then(stats => {
  stats.forEach(s => console.log(\`\${s.User.username}: ⬆️\${s.uploaded} ⬇️\${s.downloaded} 比率:\${s.ratio}\`));
  process.exit();
});
"
```

## 🎉 测试完成
如果所有步骤成功，你就拥有了一个完全功能的 PT 站系统！

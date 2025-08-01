# PT站用户上传下载统计功能测试指南

## 概述

本文档详细说明了PT站用户上传下载数据量统计功能的测试方法和验证步骤。统计系统包括数据收集、计算、展示和管理等多个方面。

## 功能特性

### 1. 用户统计数据
- ✅ 上传总量统计
- ✅ 下载总量统计  
- ✅ 分享率计算
- ✅ 做种时间统计
- ✅ 下载时间统计
- ✅ 积分系统
- ✅ 种子数量统计
- ✅ 活动历史记录

### 2. 实时数据更新
- ✅ Tracker announce 时更新统计
- ✅ 定时任务定期重算统计
- ✅ 手动重新计算功能
- ✅ 奖励积分自动发放

### 3. 排行榜系统
- ✅ 上传排行榜
- ✅ 下载排行榜
- ✅ 分享率排行榜
- ✅ 积分排行榜
- ✅ 做种时间排行榜

### 4. 统计展示
- ✅ 个人统计页面
- ✅ 全站统计概览
- ✅ 管理员统计管理
- ✅ 数据可视化

## 测试环境准备

### 1. 安装依赖

```bash
cd backend
npm install node-cron
```

### 2. 数据库准备

确保数据库中包含以下表：
- `users` - 用户表
- `user_stats` - 用户统计表
- `downloads` - 下载记录表
- `torrents` - 种子表
- `announce_logs` - 公告日志表

### 3. 启动服务

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm start
```

## API 接口测试

### 1. 用户统计 API

#### 获取用户统计信息
```bash
GET /api/stats/user/:userId
Authorization: Bearer <token>
```

**测试步骤：**
1. 登录获取token
2. 请求自己的统计信息
3. 验证返回数据结构和值

**预期响应：**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "status": "active"
  },
  "stats": {
    "uploaded": 5368709120,
    "downloaded": 3221225472,
    "ratio": 1.667,
    "bonus_points": 150.0,
    "seedtime": 604800,
    "leechtime": 43200,
    "torrents": {
      "total": 2,
      "approved": 2,
      "pending": 0,
      "total_size": 10737418240
    },
    "downloads": {
      "total": 5,
      "seeding": 3,
      "downloading": 1,
      "completed": 4
    },
    "recent_activity": [...]
  }
}
```

#### 排行榜 API
```bash
GET /api/stats/leaderboard?type=uploaded&limit=50
Authorization: Bearer <token>
```

**测试类型：**
- `uploaded` - 上传排行
- `downloaded` - 下载排行  
- `ratio` - 分享率排行
- `bonus_points` - 积分排行
- `seedtime` - 做种时间排行

#### 全站统计 API
```bash
GET /api/stats/global
```

**预期响应：**
```json
{
  "general": {
    "total_users": 100,
    "active_users": 85,
    "total_torrents": 500,
    "approved_torrents": 480,
    "pending_torrents": 20
  },
  "traffic": {
    "total_uploaded": 1099511627776,
    "total_downloaded": 549755813888,
    "global_ratio": 2.0
  },
  "content": {
    "total_size": 10995116278000,
    "average_size": 2199023256
  }
}
```

### 2. 管理员统计 API

#### 用户活动历史
```bash
GET /api/stats/user/:userId/activity?days=30&limit=100
Authorization: Bearer <admin_token>
```

#### 重新计算用户统计
```bash
POST /api/stats/user/:userId/recalculate
Authorization: Bearer <admin_token>
```

#### 手动更新用户统计
```bash
POST /api/stats/user/:userId/update
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "uploaded": 10737418240,
  "downloaded": 5368709120,
  "bonus_points": 200
}
```

## 自动化测试

### 1. 运行测试套件

```bash
cd backend
node test-stats.js
```

### 2. 更新所有用户统计

```bash
cd backend
node update-user-stats.js
```

### 3. 测试输出示例

```
🧪 开始统计功能测试套件...

✅ 数据库连接成功

📋 准备测试数据...
✅ 管理员登录成功
✅ 测试用户登录成功
✅ 测试统计数据已创建
✅ 测试数据准备完成

🔍 测试用户统计API...
✅ 获取用户统计成功
📊 统计数据: {
  uploaded: '5.00 GB',
  downloaded: '3.00 GB',
  ratio: '1.67',
  bonus_points: 150
}

🏆 测试排行榜API...
✅ 上传排行榜获取成功
🥇 前3名: [
  { rank: 1, username: 'poweruser', uploaded: '100.00 GB' },
  { rank: 2, username: 'testuser', uploaded: '5.00 GB' },
  { rank: 3, username: 'normaluser', uploaded: '2.50 GB' }
]
✅ 比率排行榜获取成功

🌍 测试全站统计API...
✅ 全站统计获取成功
📈 全站数据: {
  total_users: 50,
  active_users: 45,
  total_torrents: 200,
  total_uploaded: '2.50 TB',
  total_downloaded: '1.25 TB',
  global_ratio: '2.00'
}

👮 测试管理员统计API...
✅ 用户活动历史获取成功
📋 活动记录数: 25
✅ 统计重新计算成功

🧮 测试统计计算功能...
✅ 比率计算测试 1: 1.67
✅ 比率计算测试 2: ∞
✅ 比率计算测试 3: 1.00
✅ 统计计算功能测试完成

🎉 所有测试完成！
```

## 前端组件测试

### 1. 用户统计组件

**测试文件：** `frontend/src/components/UserStats.js`

**测试步骤：**
1. 导入组件到页面
2. 传入用户ID参数
3. 验证数据加载和显示
4. 测试标签页切换
5. 测试响应式布局

**使用示例：**
```jsx
import UserStats from './components/UserStats';

// 显示当前用户统计
<UserStats userId={currentUser.id} isCurrentUser={true} />

// 显示其他用户统计
<UserStats userId={targetUserId} isCurrentUser={false} />
```

### 2. 排行榜组件

**测试文件：** `frontend/src/components/Leaderboard.js`

**测试步骤：**
1. 导入排行榜组件
2. 测试不同排行类型切换
3. 验证数据格式化显示
4. 测试限制数量选择
5. 测试排名图标显示

**使用示例：**
```jsx
import Leaderboard from './components/Leaderboard';

<Leaderboard />
```

## 性能测试

### 1. 大数据量测试

创建大量测试数据：
```bash
# 创建1000个用户的测试数据
cd backend
node -e "
const { createTestUsers } = require('./test-helpers');
createTestUsers(1000).then(() => console.log('完成'));
"
```

### 2. 统计计算性能

测试统计重算时间：
```bash
cd backend
time node update-user-stats.js
```

### 3. API 响应时间

使用 ab 或 wrk 工具测试：
```bash
# 测试排行榜API
ab -n 100 -c 10 http://localhost:3001/api/stats/leaderboard

# 测试全站统计API  
ab -n 100 -c 10 http://localhost:3001/api/stats/global
```

## 定时任务测试

### 1. 统计调度器测试

```bash
cd backend
node -e "
const statsScheduler = require('./utils/statsScheduler');
statsScheduler.start();
console.log('调度器状态:', statsScheduler.getStatus());
setTimeout(() => {
  statsScheduler.manualUpdate().then(() => {
    console.log('手动更新完成');
    statsScheduler.stop();
  });
}, 5000);
"
```

### 2. 验证定时任务

1. **每小时更新活跃统计** - 检查种子做种下载状态
2. **每日凌晨更新统计** - 重新计算所有用户数据  
3. **每周清理日志** - 删除90天前的announce日志

## 数据一致性测试

### 1. 统计数据验证

```sql
-- 验证用户统计总和
SELECT 
  COUNT(*) as user_count,
  SUM(uploaded) as total_uploaded,
  SUM(downloaded) as total_downloaded,
  AVG(CASE WHEN downloaded > 0 THEN uploaded::float/downloaded ELSE 1 END) as avg_ratio
FROM user_stats;

-- 验证下载记录统计
SELECT 
  user_id,
  SUM(uploaded) as record_uploaded,
  SUM(downloaded) as record_downloaded
FROM downloads 
GROUP BY user_id;
```

### 2. 数据同步检查

```bash
cd backend
node -e "
const { validateStatsConsistency } = require('./test-helpers');
validateStatsConsistency().then(result => {
  console.log('数据一致性检查结果:', result);
});
"
```

## 故障排除

### 1. 常见问题

**问题：统计数据不更新**
- 检查tracker是否正常工作
- 验证announce日志是否记录
- 确认统计调度器是否启动

**问题：比率计算错误**  
- 检查除零处理逻辑
- 验证数据类型转换
- 确认数据库字段类型

**问题：排行榜显示异常**
- 检查SQL查询语句
- 验证数据排序逻辑
- 确认权限设置

### 2. 调试工具

**查看调度器状态：**
```bash
curl http://localhost:3001/api/stats/scheduler/status
```

**手动触发统计更新：**
```bash
curl -X POST http://localhost:3001/api/stats/scheduler/trigger \
  -H "Authorization: Bearer <admin_token>"
```

**查看统计日志：**
```bash
tail -f backend/logs/stats.log
```

## 验收标准

### 1. 功能完整性
- ✅ 所有API接口正常响应
- ✅ 前端组件正确显示数据
- ✅ 数据实时更新机制工作
- ✅ 排行榜正确排序

### 2. 性能要求
- ✅ API响应时间 < 500ms
- ✅ 统计更新延迟 < 5分钟
- ✅ 大数据量下系统稳定

### 3. 数据准确性
- ✅ 统计数据与实际记录一致
- ✅ 比率计算精确
- ✅ 排名顺序正确

### 4. 用户体验
- ✅ 界面响应流畅
- ✅ 数据展示清晰
- ✅ 移动端兼容性好

## 总结

本测试指南涵盖了PT站统计功能的各个方面，从API接口到前端组件，从性能测试到数据一致性验证。通过系统性的测试，确保统计功能的稳定性、准确性和用户体验。

建议在生产环境部署前，完成所有测试项目并达到验收标准。定期运行测试套件以确保功能持续正常工作。

# 前端统计功能测试指南

## 测试准备

### 1. 确保后端服务运行
```bash
# 在 backend 目录下
cd backend
npm start
```

### 2. 启动前端开发服务器
```bash
# 在 frontend 目录下  
cd frontend
npm start
```

### 3. 确保有测试数据
```bash
# 在 backend 目录下运行统计数据更新
node -e "require('./utils/statsScheduler').updateAllUserStats()"
```

## 前端组件测试

### 1. 访问统计页面
- 浏览器访问: `http://localhost:3000/stats`
- 登录后应该能看到三个标签页：我的统计、用户排行、全站统计

### 2. 我的统计 (UserStats) 组件测试
#### 功能点：
- [x] 显示当前用户的上传/下载数据
- [x] 显示分享率和积分
- [x] 显示做种时间
- [x] Material-UI 美观界面
- [x] 数据格式化显示 (文件大小、时间)

#### 测试步骤：
1. 点击"我的统计"标签页
2. 检查是否显示以下信息：
   - 上传量 (格式: XX.XX GB)
   - 下载量 (格式: XX.XX GB) 
   - 分享率 (格式: X.XX 或 ∞)
   - 积分 (整数)
   - 做种时间 (格式: XX天 XX小时)
3. 检查加载状态和错误处理
4. 点击刷新按钮测试数据重新加载

### 3. 用户排行 (Leaderboard) 组件测试
#### 功能点：
- [x] 多种排行榜类型切换
- [x] 显示数量选择 (10/25/50/100)
- [x] 排名图标和用户信息
- [x] 管理员标识
- [x] 响应式设计

#### 测试步骤：
1. 点击"用户排行"标签页
2. 测试不同排行榜类型：
   - 上传排行 (CloudUpload 图标)
   - 下载排行 (CloudDownload 图标)
   - 分享率排行 (Share 图标)
   - 积分排行 (Stars 图标)
   - 做种时间排行 (Timer 图标)
3. 测试显示数量选择器
4. 检查排名显示 (前三名有特殊图标)
5. 检查用户角色标识 (管理员有特殊标签)

### 4. 全站统计 (GlobalStats) 组件测试
#### 功能点：
- [x] 总用户数统计
- [x] 种子总数统计
- [x] 总上传/下载量
- [x] 全站分享率
- [x] 活跃用户数
- [x] 详细统计信息

#### 测试步骤：
1. 点击"全站统计"标签页
2. 检查主要统计卡片：
   - 总用户数 (People 图标)
   - 种子总数 (Storage 图标)
   - 总上传量 (CloudUpload 图标)
   - 总下载量 (CloudDownload 图标)
3. 检查分享率和活跃度统计
4. 检查详细统计信息区域
5. 测试刷新按钮功能

## API 接口测试

### 1. 测试用户统计 API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/stats/user
```

### 2. 测试排行榜 API
```bash
# 上传排行
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:5000/api/stats/leaderboard?type=uploaded&limit=10"

# 分享率排行
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:5000/api/stats/leaderboard?type=ratio&limit=10"
```

### 3. 测试全站统计 API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/stats/global
```

## 常见问题排查

### 1. 页面无法加载
- 检查前端服务是否运行 (http://localhost:3000)
- 检查后端服务是否运行 (http://localhost:5000)
- 检查浏览器控制台错误信息

### 2. 统计数据为空
- 运行数据库初始化: `node backend/init-db.js`
- 运行统计更新: `node -e "require('./backend/utils/statsScheduler').updateAllUserStats()"`
- 检查用户是否有上传/下载记录

### 3. API 调用失败
- 检查用户是否已登录
- 检查 JWT token 是否有效
- 检查网络请求 (F12 Network 面板)

### 4. 样式显示异常
- 检查 Material-UI 是否正确安装
- 检查浏览器兼容性
- 清除浏览器缓存

## 性能测试

### 1. 加载时间测试
- 统计页面首次加载时间应 < 2秒
- 切换标签页应 < 500ms
- API 响应时间应 < 1秒

### 2. 数据量测试
- 测试大量用户排行榜 (100+ 用户)
- 测试大数据量格式化 (TB 级别)
- 测试长时间做种时间显示

## 浏览器兼容性

### 支持的浏览器:
- [x] Chrome 80+
- [x] Firefox 75+
- [x] Safari 13+
- [x] Edge 80+

### 移动端测试:
- [x] 响应式设计
- [x] 触摸操作
- [x] 小屏幕适配

## 预期结果

完成测试后，应该能够：
1. 正常访问统计页面并查看三个标签页
2. 查看个人统计数据，包括上传下载比例、积分等
3. 查看不同类型的用户排行榜
4. 查看全站统计信息
5. 所有数据格式化正确，界面美观
6. 响应式设计在不同设备上工作正常

## 错误报告

如果遇到问题，请记录：
1. 浏览器类型和版本
2. 错误信息 (控制台输出)
3. 复现步骤
4. 期望结果 vs 实际结果
5. 网络请求详情 (F12 Network 面板)

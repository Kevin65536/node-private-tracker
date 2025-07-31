# 🔗 前端Tracker集成指南

## 📋 概述

本指南说明如何在前端界面中集成Private Tracker功能，让用户能够管理Passkey和下载个人种子文件。

## 🎯 核心功能需求

### 1. 用户Passkey管理
- 显示用户的个人Passkey
- 提供Passkey重新生成功能
- 显示个人Announce URL
- 安全提醒和使用说明

### 2. 种子下载功能
- 在种子详情页面提供下载按钮
- 下载的种子文件包含用户个人Passkey
- 防止种子文件被分享给其他用户

### 3. Tracker统计展示
- 显示Tracker运行状态
- 展示活跃Peer数量
- 显示系统统计信息

## 🔌 必需的后端API

### 用户Passkey API

```javascript
// 获取用户Profile（包含Passkey）
GET /api/users/profile
Authorization: Bearer JWT_TOKEN

// 重新生成Passkey
POST /api/users/regenerate-passkey
Authorization: Bearer JWT_TOKEN
```

### 种子下载API

```javascript
// 下载包含个人Passkey的种子文件
GET /api/torrents/:id/download?passkey=USER_PASSKEY
Authorization: Bearer JWT_TOKEN
```

### 统计信息API

```javascript
// 获取Tracker统计信息
GET /api/stats

// 检查Tracker健康状态
GET /health
```

## 🎨 前端界面设计

### 1. 用户个人资料页面

**关键组件：**
- Passkey显示区域（只读输入框）
- Announce URL展示
- 重新生成按钮
- 安全警告提示

**主要功能：**
```javascript
const UserProfile = () => {
  const [passkey, setPasskey] = useState('');
  const [announceUrl, setAnnounceUrl] = useState('');

  // 获取用户Passkey
  const fetchUserPasskey = async () => {
    const response = await api.get('/api/users/profile');
    setPasskey(response.data.passkey);
    setAnnounceUrl(\`http://localhost:3001/announce/\${response.data.passkey}\`);
  };

  // 重新生成Passkey
  const regeneratePasskey = async () => {
    const response = await api.post('/api/users/regenerate-passkey');
    setPasskey(response.data.passkey);
    // 更新UI和提示用户
  };
};
```

### 2. 种子详情页面

**关键组件：**
- 种子信息展示
- 下载按钮
- 统计信息（做种者/下载者）
- 安全提示

**下载功能：**
```javascript
const downloadTorrent = async (torrentId, userPasskey) => {
  const response = await api.get(
    \`/api/torrents/\${torrentId}/download?passkey=\${userPasskey}\`,
    { responseType: 'blob' }
  );
  
  // 创建下载链接
  const blob = new Blob([response.data], { type: 'application/x-bittorrent' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = \`\${torrent.name}.torrent\`;
  link.click();
};
```

### 3. Tracker统计页面

**关键指标：**
- Tracker在线状态
- 注册用户数
- 活跃种子数
- 当前Peer连接数
- 今日Announce请求数

**状态监控：**
```javascript
const TrackerStats = () => {
  const [trackerStatus, setTrackerStatus] = useState('unknown');
  
  const checkTrackerHealth = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      setTrackerStatus(response.ok ? 'online' : 'error');
    } catch (error) {
      setTrackerStatus('offline');
    }
  };
  
  // 每30秒检查一次状态
  useEffect(() => {
    const interval = setInterval(checkTrackerHealth, 30000);
    return () => clearInterval(interval);
  }, []);
};
```

## 🔒 安全考虑

### Passkey安全

1. **显示保护**：使用只读输入框显示Passkey
2. **复制功能**：提供一键复制到剪贴板
3. **重新生成**：允许用户主动重新生成Passkey
4. **警告提示**：明确告知不要分享Passkey

### 下载安全

1. **身份验证**：确保只有登录用户能下载
2. **Passkey验证**：验证Passkey属于当前用户
3. **文件修改**：动态修改种子文件中的Announce URL
4. **使用提醒**：提示用户不要分享下载的种子文件

## 📱 UI/UX建议

### 样式指南

```css
/* Passkey显示区域 */
.passkey-display {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

/* 状态指示器 */
.status-indicator.online { color: #28a745; }
.status-indicator.offline { color: #dc3545; }
.status-indicator.error { color: #ffc107; }

/* 下载按钮 */
.download-button {
  background-color: #28a745;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
```

### 用户体验

1. **清晰的视觉反馈**：操作成功/失败的明确提示
2. **加载状态**：网络请求时显示加载指示器
3. **错误处理**：友好的错误信息和解决建议
4. **响应式设计**：适配不同屏幕尺寸

## 🚀 实现步骤

### 阶段1：基础功能（1-2天）
1. 添加用户Profile页面的Passkey显示
2. 实现Passkey重新生成功能
3. 添加基本的安全提示

### 阶段2：下载功能（2-3天）
1. 修改种子详情页面，添加下载按钮
2. 实现种子文件下载功能
3. 添加下载安全验证

### 阶段3：统计监控（1-2天）
1. 创建Tracker统计页面
2. 实现实时状态监控
3. 添加统计图表（可选）

### 阶段4：完善优化（1-2天）
1. 优化UI/UX设计
2. 添加错误处理和边界情况
3. 进行综合测试

## 📋 检查清单

- [ ] 用户可以查看自己的Passkey
- [ ] 用户可以重新生成Passkey
- [ ] 种子详情页面有下载按钮
- [ ] 下载的种子文件包含个人Passkey
- [ ] Tracker统计页面显示实时状态
- [ ] 所有功能都有适当的错误处理
- [ ] UI界面响应式且用户友好
- [ ] 安全提示和使用说明清晰

---

**💡 提示**：建议在开发过程中与后端开发人员密切配合，确保API接口的一致性和安全性。

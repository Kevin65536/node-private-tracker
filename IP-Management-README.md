# PT站动态IP地址管理系统

## 概述

由于网络环境的限制，服务器IP地址可能会频繁变化。本系统提供了一套完整的解决方案，让服务器能够自动上传最新的IP地址到固定的远程位置，客户端则可以自动获取最新地址并更新本地hosts文件。

## 系统组件

### 服务器端文件
- `ip-config.json` - 配置文件
- `upload-ip.js` - IP地址上传脚本
- `setup-ip-upload.bat` - 配置向导
- `start-pt-system.bat` - 已修改的服务器启动脚本

### 客户端文件
- `client-launcher.bat` - 客户端启动器
- `ip-config.json` - 配置文件（与服务器端共享）

## 快速开始

### 1. 服务器端配置

#### 步骤1：运行配置向导
```bash
setup-ip-upload.bat
```

向导将引导您完成以下配置：
- 选择上传方式（GitHub Gist / Gitee Pages / 自定义Webhook / 本地文件）
- 配置相应的认证信息
- 测试配置是否正确

#### 步骤2：启动服务器
```bash
start-pt-system.bat
```

启动脚本现在会自动：
- 检测本机IP地址
- 上传IP信息到配置的远程位置
- 启动所有PT站服务

### 2. 客户端配置

#### 步骤1：获取客户端文件
将以下文件分发给用户：
- `client-launcher.bat`
- `ip-config.json`

#### 步骤2：运行客户端启动器
用户运行 `client-launcher.bat`，启动器会：
- 自动获取最新的服务器IP地址
- 显示所有可用的访问地址
- 提供便捷的访问选项

#### 步骤3：更新hosts文件（可选）
如果以管理员身份运行，启动器还会：
- 自动更新Windows hosts文件
- 允许通过域名访问（默认：pt.lan）
- 刷新DNS缓存

## 配置选项

### 支持的上传方式

#### 1. GitHub Gist（推荐）
- 免费且稳定
- 全球访问速度快
- 提供Raw URL访问

配置要求：
- GitHub Personal Access Token（需要gist权限）
- 创建一个公开或私有的Gist

#### 2. Gitee Pages
- 国内访问速度快
- 支持自定义域名

配置要求：
- Gitee Personal Access Token
- 创建仓库并启用Pages服务

#### 3. 自定义Webhook
- 适合有自己服务器的用户
- 完全自主控制

配置要求：
- 提供接收POST请求的URL
- 可选的认证token

#### 4. 本地文件
- 仅用于测试
- 不适合实际部署

### 配置文件说明

`ip-config.json` 包含以下主要配置：

```json
{
  "upload": {
    "enabled": true,
    "method": "gist",
    "config": {
      "gist": {
        "token": "您的GitHub Token",
        "gistId": "您的Gist ID",
        "filename": "pt-server-ip.json"
      }
    }
  },
  "client": {
    "ipSourceUrl": "https://gist.githubusercontent.com/用户名/GistID/raw/pt-server-ip.json",
    "domain": "pt.lan"
  },
  "server": {
    "name": "PT服务器",
    "ports": {
      "frontend": 3000,
      "backend": 3001,
      "nginx": 80,
      "nginx_ssl": 443
    }
  }
}
```

## 使用场景

### 场景1：服务器管理员
1. 运行 `setup-ip-upload.bat` 完成初始配置
2. 每次启动服务器时运行 `start-pt-system.bat`
3. IP地址会自动上传到配置的远程位置

### 场景2：普通用户
1. 获取管理员分发的客户端文件
2. 运行 `client-launcher.bat`
3. 选择访问方式（浏览器打开、复制地址等）
4. 如需域名访问，以管理员身份运行客户端启动器

### 场景3：IP地址变更
当服务器IP地址变更时：
1. 服务器端重新运行 `start-pt-system.bat`
2. 客户端运行 `client-launcher.bat` 并选择"刷新服务器信息"
3. 系统自动获取最新地址

## 高级功能

### 客户端启动器功能
- 自动检测管理员权限
- 备份和恢复hosts文件
- DNS缓存刷新
- 一键访问常用地址
- 地址复制到剪贴板

### 服务器信息结构
上传的IP信息包含：
```json
{
  "ip": "192.168.1.100",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "server": {
    "name": "PT服务器",
    "description": "LZU PT站点服务器"
  },
  "hostname": "SERVER-PC",
  "platform": "win32",
  "uptime": 3600,
  "urls": {
    "frontend": "http://192.168.1.100:3000",
    "backend": "http://192.168.1.100:3001",
    "nginx": "http://192.168.1.100:80",
    "nginx_ssl": "https://192.168.1.100:443",
    "tracker": "http://192.168.1.100:3001/announce"
  }
}
```

## 故障排除

### 常见问题

1. **IP上传失败**
   - 检查网络连接
   - 验证token和权限
   - 查看错误日志

2. **客户端无法获取IP**
   - 检查ipSourceUrl配置
   - 验证远程文件是否可访问
   - 检查防火墙设置

3. **hosts文件更新失败**
   - 确保以管理员身份运行
   - 检查hosts文件是否被其他程序锁定
   - 验证文件权限

4. **域名无法访问**
   - 刷新DNS缓存：`ipconfig /flushdns`
   - 检查hosts文件内容
   - 尝试重启网络适配器

### 调试技巧

1. **测试IP上传**
   ```bash
   node upload-ip.js
   ```

2. **手动检查配置**
   ```bash
   type ip-config.json
   ```

3. **验证hosts文件**
   ```bash
   type C:\Windows\System32\drivers\etc\hosts
   ```

4. **检查DNS解析**
   ```bash
   nslookup pt.lan
   ping pt.lan
   ```

## 安全注意事项

1. **Token安全**
   - 不要将包含真实token的配置文件上传到公开仓库
   - 定期轮换访问token
   - 使用最小权限原则

2. **访问控制**
   - 考虑使用私有Gist或限制访问的仓库
   - 定期检查访问日志

3. **hosts文件**
   - 启动器会备份原始hosts文件
   - 可以手动恢复：复制 `.backup` 文件

## 自定义和扩展

### 添加新的上传方式
在 `upload-ip.js` 中添加新的上传方法：
```javascript
uploadToCustomService(data) {
    // 实现自定义上传逻辑
}
```

### 修改域名
在 `ip-config.json` 中修改：
```json
{
  "client": {
    "domain": "your-custom-domain.local"
  }
}
```

### 自定义端口
在配置文件中修改端口设置，系统会自动生成相应的URL。

## 技术支持

如果遇到问题，请检查：
1. 所有文件是否在正确位置
2. 配置文件格式是否正确
3. 网络连接是否正常
4. 相关服务是否正在运行

建议在测试环境中先验证配置，确保一切正常后再在生产环境中使用。

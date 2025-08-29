# PT站动态路径配置使用指南

本指南说明如何使用新的动态路径配置功能来解决 pt-site.conf 中的硬编码路径问题。

## 问题背景

之前的版本中，pt-site.conf 配置文件包含硬编码的路径：
```nginx
root C:/Users/qdsxh/Desktop/toys/pt;
alias C:/Users/qdsxh/Desktop/toys/pt/backend/uploads/;
# root C:/Users/qdsxh/Desktop/toys/pt/frontend/build;
```

这些路径在不同的部署环境中需要手动修改，容易出错。

## 解决方案

新版本提供了自动路径配置工具：

### 1. 路径配置脚本

#### Windows环境
- `nginx/configure-paths.bat` - Windows批处理脚本

#### Linux/macOS环境  
- `nginx/configure-paths.sh` - Unix shell脚本

### 2. 主要功能

- **自动检测项目根目录**
- **动态替换配置文件中的硬编码路径**
- **支持开发环境和生产环境配置**
- **配置备份和恢复功能**

## 使用方法

### 基本命令

```bash
# 检测当前路径配置
./nginx/configure-paths.sh detect

# 应用动态路径到开发环境配置
./nginx/configure-paths.sh apply

# 切换到生产环境配置并应用动态路径
./nginx/configure-paths.sh production

# 恢复备份的配置
./nginx/configure-paths.sh restore
```

### 完整部署流程

#### 开发环境部署
```bash
# 1. 克隆项目
git clone <repository>
cd node-private-tracker

# 2. 运行部署脚本（会自动配置路径）
./deploy.sh <目标IP>

# 3. 或者手动配置路径
cd nginx
./configure-paths.sh apply

# 4. 启动服务
cd nginx
manage-nginx-project.bat deploy
manage-nginx-project.bat start
```

#### 生产环境部署
```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 配置生产环境
cd ../nginx
./configure-paths.sh production

# 3. 部署nginx配置
manage-nginx-project.bat production
manage-nginx-project.bat start
```

### Windows环境示例

```batch
REM 检测路径
nginx\configure-paths.bat detect

REM 应用开发环境配置
nginx\configure-paths.bat apply

REM 生产环境部署
cd frontend
npm run build
cd ..\nginx
configure-paths.bat production
manage-nginx-project.bat production
```

## 路径替换规则

### 开发环境
- 源路径模式: `C:/Users/qdsxh/Desktop/toys/pt`
- 替换为: 项目实际根目录

### 生产环境
- 源路径模式: `/path/to/pt`  
- 替换为: 项目实际根目录

## 自动路径映射

配置脚本会自动将以下路径设置为动态路径：

| 原硬编码路径 | 动态路径 | 用途 |
|------------|---------|-----|
| `C:/Users/qdsxh/Desktop/toys/pt` | `{PROJECT_ROOT}` | 项目根目录 |
| `C:/Users/qdsxh/Desktop/toys/pt/frontend/build` | `{PROJECT_ROOT}/frontend/build` | 前端构建文件 |
| `C:/Users/qdsxh/Desktop/toys/pt/backend/uploads` | `{PROJECT_ROOT}/backend/uploads` | 文件上传目录 |

## 配置文件备份

每次应用配置时，脚本会自动备份原配置文件：
- 备份位置: `nginx/pt-site.conf.backup`
- 可使用 `restore` 命令恢复

## 故障排除

### 1. 权限问题
```bash
chmod +x nginx/configure-paths.sh
```

### 2. 路径检测失败
```bash
# 手动检查项目结构
./nginx/configure-paths.sh detect
```

### 3. 配置恢复
```bash
# 恢复备份配置
./nginx/configure-paths.sh restore
```

### 4. 检查替换结果
```bash
# 查看当前配置的路径
grep -n "PROJECT_ROOT" nginx/pt-site.conf
```

## 集成说明

### 与部署脚本集成
- `deploy.sh` 和 `deploy.bat` 已自动集成路径配置
- 部署时会自动调用路径配置脚本

### 与nginx管理脚本集成
- `manage-nginx-project.bat` 的 `deploy` 和 `production` 命令已集成
- 部署前会自动应用动态路径

## 注意事项

1. **首次使用前请备份重要配置**
2. **确保项目结构正确（包含frontend和backend目录）**  
3. **生产环境部署前请先构建前端**
4. **不同操作系统使用对应的脚本**
5. **路径替换是基于文本替换，请确保源路径模式匹配**

## 更新记录

- v1.0: 初始版本，支持基本路径替换
- v1.1: 添加生产环境支持和备份恢复功能
- v1.2: 集成到部署脚本和nginx管理工具
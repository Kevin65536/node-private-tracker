# 归档的测试和开发脚本

本目录包含在开发过程中创建的测试和调试脚本，已从主目录中移动到此处以保持工作区整洁。

## 脚本分类

### API 测试脚本
- `test-admin-api.js` - 管理员API测试
- `test-api-paths.js` - API路径测试
- `test-stats-api.js` - 统计API测试
- `test-system.js` - 系统功能综合测试
- `test-image-setup.js` - 图片设置测试
- `test-torrent-parsing.js` - 种子文件解析测试
- `simple-tracker-test.js` - 简单tracker测试

### 数据库查询脚本
- `check-all-data.js` - 检查所有数据
- `check-categories.js` - 检查分类数据
- `check-categories-direct.js` - 直接检查分类
- `check-image-torrents.js` - 检查种子图片
- `check-specific-torrent.js` - 检查特定种子
- `check-torrent-images.js` - 检查种子图片关联
- `check-torrents.js` - 检查种子数据
- `check-users.js` - 检查用户数据
- `query-torrents.js` - 查询种子

### 测试数据生成脚本
- `create-test-torrent.js` - 创建测试种子
- `create-test-torrent-fixed.js` - 创建测试种子（修复版）
- `add-test-image.js` - 添加测试图片

### 数据库维护脚本
- `add-review-columns.js` - 添加审核字段
- `update-category-name.js` - 更新分类名称
- `update-torrent-images.js` - 更新种子图片

## 使用说明

这些脚本主要用于：
1. 开发过程中的功能测试
2. 数据库状态检查和调试
3. 测试数据的生成和管理
4. 数据库结构的临时修改

**注意**: 这些脚本已不在主工作流程中使用，但保留以备将来参考或调试需要。

## 主要工作脚本

当前在主目录中保留的重要脚本：
- `init-db.js` - 数据库初始化
- `server.js` - 主服务器
- `test-db-connection.js` - 数据库连接测试
- `check-db-status.js` - 数据库状态检查
- `test-tracker.js` - Tracker功能测试
- `setup-database.js` - 数据库设置
- `start-tracker-test.js` - 启动Tracker测试
- `torrent-generator.js` - 种子生成器
- `migrate-user-roles.js` - 用户角色迁移

这些脚本在 `package.json` 的 scripts 中有对应的npm命令。

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// 下载IP管理工具
router.get('/ip-management/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 验证文件名安全性
    if (!['ip-config.json', 'client-launcher.bat'].includes(filename)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    const filePath = path.join(__dirname, '../../IP-management', filename);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 记录下载日志
    console.log(`[工具下载] 用户 ${req.user.username} 下载文件: ${filename}`);
    
    // 设置响应头
    if (filename.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (filename.endsWith('.bat')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // 发送文件
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('下载工具文件失败:', error);
    res.status(500).json({ error: '下载失败' });
  }
});

// 获取工具列表和描述
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const tools = [
      {
        name: 'ip-config.json',
        title: 'IP配置文件',
        description: '客户端自动获取服务器IP地址的配置文件',
        size: 'JSON配置'
      },
      {
        name: 'client-launcher.bat',
        title: '客户端启动器',
        description: 'Windows批处理脚本，自动配置hosts并提供PT站访问入口',
        size: '批处理脚本'
      }
    ];
    
    res.json({ tools });
  } catch (error) {
    console.error('获取工具列表失败:', error);
    res.status(500).json({ error: '获取工具列表失败' });
  }
});

module.exports = router;

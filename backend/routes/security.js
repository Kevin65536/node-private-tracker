const express = require('express');
const { Torrent, User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');
const ImprovedDatabaseBackup = require('../backup-db');

const router = express.Router();

// 检查种子文件完整性
router.get('/check-torrent-files', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('[安全检查] 开始检查种子文件完整性...');
    
    // 获取所有种子记录
    const torrents = await Torrent.findAll({
      attributes: ['id', 'name', 'torrent_file', 'status'],
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'username']
      }]
    });

    const uploadsDir = path.join(__dirname, '../uploads');
    const results = {
      total: torrents.length,
      valid: 0,
      missing: [],
      invalid: []
    };

    for (const torrent of torrents) {
      if (!torrent.torrent_file) {
        results.invalid.push({
          id: torrent.id,
          name: torrent.name,
          uploader: torrent.uploader?.username || '未知',
          issue: '数据库中没有种子文件记录'
        });
        continue;
      }

      const filePath = path.join(uploadsDir, torrent.torrent_file);
      
      try {
        await fs.access(filePath);
        
        // 检查文件大小
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
          results.invalid.push({
            id: torrent.id,
            name: torrent.name,
            uploader: torrent.uploader?.username || '未知',
            issue: '种子文件为空'
          });
        } else {
          results.valid++;
        }
      } catch (error) {
        results.missing.push({
          id: torrent.id,
          name: torrent.name,
          uploader: torrent.uploader?.username || '未知',
          filename: torrent.torrent_file,
          issue: '种子文件不存在'
        });
      }
    }

    console.log(`[安全检查] 种子文件检查完成: ${results.valid}/${results.total} 个文件正常`);

    res.json({
      success: true,
      results: {
        ...results,
        issues: results.missing.length + results.invalid.length
      }
    });

  } catch (error) {
    console.error('[安全检查] 种子文件检查失败:', error);
    res.status(500).json({
      success: false,
      error: '种子文件检查失败',
      details: error.message
    });
  }
});

// 检查图片文件完整性
router.get('/check-image-files', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('[安全检查] 开始检查图片文件完整性...');
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const results = {
      total: 0,
      valid: 0,
      missing: [],
      invalid: []
    };

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    // 1. 检查种子图片文件（从image_files JSON字段）
    const torrentsWithImages = await Torrent.findAll({
      attributes: ['id', 'name', 'image_files'],
      where: {
        image_files: {
          [require('sequelize').Op.ne]: null
        }
      }
    });

    console.log(`[安全检查] 找到 ${torrentsWithImages.length} 个种子可能包含图片`);

    for (const torrent of torrentsWithImages) {
      if (!torrent.image_files || !Array.isArray(torrent.image_files) || torrent.image_files.length === 0) {
        continue;
      }

      for (const imageFile of torrent.image_files) {
        results.total++;
        const filePath = path.join(uploadsDir, imageFile);
        
        try {
          await fs.access(filePath);
          
          // 检查文件大小
          const stats = await fs.stat(filePath);
          if (stats.size === 0) {
            results.invalid.push({
              torrent_id: torrent.id,
              torrent_name: torrent.name,
              filename: imageFile,
              issue: '种子图片文件为空'
            });
          } else {
            results.valid++;
          }
        } catch (error) {
          results.missing.push({
            torrent_id: torrent.id,
            torrent_name: torrent.name,
            filename: imageFile,
            issue: '种子图片文件不存在'
          });
        }
      }
    }

    // 2. 检查种子描述中的图片引用（保留原有逻辑）
    const torrents = await Torrent.findAll({
      attributes: ['id', 'name', 'description'],
      where: {
        description: {
          [require('sequelize').Op.like]: '%uploads/%'
        }
      }
    });

    console.log(`[安全检查] 找到 ${torrents.length} 个种子描述包含uploads引用`);

    for (const torrent of torrents) {
      if (!torrent.description) continue;

      // 使用正则表达式提取图片文件名
      const imageMatches = torrent.description.match(/uploads\/([^"'\s<>]+\.(jpg|jpeg|png|gif|bmp|webp))/gi);
      
      if (imageMatches) {
        for (const match of imageMatches) {
          results.total++;
          const filename = match.replace('uploads/', '');
          const filePath = path.join(uploadsDir, filename);
          
          try {
            await fs.access(filePath);
            
            // 检查文件大小
            const stats = await fs.stat(filePath);
            if (stats.size === 0) {
              results.invalid.push({
                torrent_id: torrent.id,
                torrent_name: torrent.name,
                filename: filename,
                issue: '种子描述中的图片文件为空'
              });
            } else {
              results.valid++;
            }
          } catch (error) {
            results.missing.push({
              torrent_id: torrent.id,
              torrent_name: torrent.name,
              filename: filename,
              issue: '种子描述中的图片文件不存在'
            });
          }
        }
      }
    }

    // 3. 检查用户头像文件
    const usersWithAvatar = await User.findAll({
      attributes: ['id', 'username', 'avatar'],
      where: {
        avatar: {
          [require('sequelize').Op.and]: [
            { [require('sequelize').Op.ne]: null },
            { [require('sequelize').Op.ne]: '' }
          ]
        }
      }
    });

    console.log(`[安全检查] 找到 ${usersWithAvatar.length} 个用户有头像`);

    for (const user of usersWithAvatar) {
      if (!user.avatar) continue;

      results.total++;
      // 用户头像存储在 avatars 子目录中
      const filePath = path.join(uploadsDir, 'avatars', user.avatar);
      
      try {
        await fs.access(filePath);
        
        // 检查文件大小
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
          results.invalid.push({
            user_id: user.id,
            username: user.username,
            filename: user.avatar,
            issue: '用户头像文件为空'
          });
        } else {
          results.valid++;
        }
      } catch (error) {
        results.missing.push({
          user_id: user.id,
          username: user.username,
          filename: user.avatar,
          issue: '用户头像文件不存在'
        });
      }
    }

    console.log(`[安全检查] 图片文件检查完成: ${results.valid}/${results.total} 个文件正常`);

    res.json({
      success: true,
      results: {
        ...results,
        issues: results.missing.length + results.invalid.length
      }
    });

  } catch (error) {
    console.error('[安全检查] 图片文件检查失败:', error);
    res.status(500).json({
      success: false,
      error: '图片文件检查失败',
      details: error.message
    });
  }
});

// 检查孤儿文件
router.get('/check-orphan-files', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('[安全检查] 开始检查孤儿文件...');
    
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // 获取上传目录中的所有文件（包括子目录）
    async function getAllFiles(dir, subPath = '') {
      const files = [];
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          // 递归检查子目录
          const subFiles = await getAllFiles(fullPath, path.join(subPath, item));
          files.push(...subFiles);
        } else if (stats.isFile()) {
          files.push({
            filename: path.join(subPath, item).replace(/\\/g, '/'), // 标准化路径分隔符
            fullPath: fullPath,
            size: stats.size,
            modified: stats.mtime,
            type: path.extname(item).toLowerCase()
          });
        }
      }
      
      return files;
    }
    
    const allFiles = await getAllFiles(uploadsDir);
    
    // 收集数据库中所有的文件记录
    const registeredFiles = new Set();
    
    // 1. 种子文件
    const torrents = await Torrent.findAll({
      attributes: ['torrent_file', 'image_files'],
      where: {
        torrent_file: {
          [require('sequelize').Op.ne]: null
        }
      }
    });

    torrents.forEach(torrent => {
      if (torrent.torrent_file) {
        registeredFiles.add(torrent.torrent_file);
      }
      
      // 2. 种子图片文件
      if (torrent.image_files && Array.isArray(torrent.image_files)) {
        torrent.image_files.forEach(imageFile => {
          registeredFiles.add(imageFile);
        });
      }
    });
    
    // 3. 用户头像文件
    const usersWithAvatar = await User.findAll({
      attributes: ['avatar'],
      where: {
        avatar: {
          [require('sequelize').Op.and]: [
            { [require('sequelize').Op.ne]: null },
            { [require('sequelize').Op.ne]: '' }
          ]
        }
      }
    });
    
    usersWithAvatar.forEach(user => {
      if (user.avatar) {
        // 用户头像在avatars子目录中
        registeredFiles.add(`avatars/${user.avatar}`);
      }
    });
    
    console.log(`[安全检查] 数据库中注册的文件: ${registeredFiles.size} 个`);
    console.log(`[安全检查] 文件系统中的文件: ${allFiles.length} 个`);
    
    const results = {
      total_files: 0, // 将在下面重新计算
      registered_files: registeredFiles.size,
      orphan_files: [],
      total_orphan_size: 0,
      skipped_files: []
    };

    for (const file of allFiles) {
      const relativePath = file.filename;
      
      // 跳过特殊文件
      if (relativePath === '.gitkeep') {
        results.skipped_files.push({
          filename: relativePath,
          reason: '系统文件'
        });
        continue;
      }
      
      // 计入总文件数（排除被跳过的文件）
      results.total_files++;
      
      if (!registeredFiles.has(relativePath)) {
        results.orphan_files.push({
          filename: relativePath,
          size: file.size,
          modified: file.modified,
          type: file.type
        });
        results.total_orphan_size += file.size;
      }
    }

    console.log(`[安全检查] 孤儿文件检查完成: 发现 ${results.orphan_files.length} 个孤儿文件`);

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[安全检查] 孤儿文件检查失败:', error);
    res.status(500).json({
      success: false,
      error: '孤儿文件检查失败',
      details: error.message
    });
  }
});

// 获取备份文件列表
router.get('/backup-list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..');
    const files = await fs.readdir(backupDir);
    
    // 过滤备份文件
    const backupFiles = files.filter(file => 
      file.startsWith('backup_') && file.endsWith('.sql')
    );

    const backups = [];
    
    for (const file of backupFiles) {
      try {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        });
      } catch (error) {
        console.warn(`[备份管理] 无法获取备份文件状态: ${file}`, error.message);
      }
    }

    // 按创建时间倒序排列
    backups.sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({
      success: true,
      backups
    });

  } catch (error) {
    console.error('[备份管理] 获取备份列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取备份列表失败',
      details: error.message
    });
  }
});

// 下载备份文件
router.get('/backup-download/:filename', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 安全检查：确保文件名合法
    if (!filename.match(/^backup_[a-zA-Z0-9_-]+\.sql$/)) {
      return res.status(400).json({
        success: false,
        error: '无效的备份文件名'
      });
    }

    const filePath = path.join(__dirname, '..', filename);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '备份文件不存在'
      });
    }

    // 记录下载日志
    console.log(`[备份管理] 管理员 ${req.user.username} 下载备份文件: ${filename}`);

    // 设置下载响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 发送文件
    res.sendFile(filePath);

  } catch (error) {
    console.error('[备份管理] 下载备份文件失败:', error);
    res.status(500).json({
      success: false,
      error: '下载备份文件失败',
      details: error.message
    });
  }
});

// 创建数据库备份
router.post('/create-backup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(`[备份管理] 管理员 ${req.user.username} 开始创建数据库备份...`);
    
    const backup = new ImprovedDatabaseBackup();
    const backupPath = await backup.createBackup();
    
    // 获取备份文件信息
    const stats = await fs.stat(backupPath);
    const filename = path.basename(backupPath);
    
    console.log(`[备份管理] 备份创建成功: ${filename}`);

    res.json({
      success: true,
      message: '数据库备份创建成功',
      backup: {
        filename,
        size: stats.size,
        created: stats.birthtime,
        path: backupPath
      }
    });

  } catch (error) {
    console.error('[备份管理] 创建备份失败:', error);
    res.status(500).json({
      success: false,
      error: '创建备份失败',
      details: error.message
    });
  }
});

// 清理孤儿文件
router.post('/cleanup-orphan-files', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { filenames } = req.body;
    
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要删除的文件列表'
      });
    }

    console.log(`[安全管理] 管理员 ${req.user.username} 开始清理孤儿文件...`);
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const results = {
      total: filenames.length,
      deleted: 0,
      failed: [],
      total_size_freed: 0
    };

    for (const filename of filenames) {
      try {
        // 安全检查：确保文件名不包含路径遍历
        if (filename.includes('..')) {
          results.failed.push({
            filename,
            error: '文件路径包含非法字符'
          });
          continue;
        }

        // 标准化路径分隔符
        const normalizedPath = filename.replace(/\\/g, '/');
        const filePath = path.join(uploadsDir, normalizedPath);
        
        // 确保文件在uploads目录内
        const resolvedPath = path.resolve(filePath);
        const resolvedUploadsDir = path.resolve(uploadsDir);
        if (!resolvedPath.startsWith(resolvedUploadsDir)) {
          results.failed.push({
            filename,
            error: '文件路径超出允许范围'
          });
          continue;
        }

        const stats = await fs.stat(filePath);
        
        await fs.unlink(filePath);
        results.deleted++;
        results.total_size_freed += stats.size;
        
      } catch (error) {
        results.failed.push({
          filename,
          error: error.message
        });
        console.warn(`[安全管理] 删除文件失败: ${filename}`, error.message);
      }
    }

    console.log(`[安全管理] 孤儿文件清理完成: 删除 ${results.deleted}/${results.total} 个文件`);

    res.json({
      success: true,
      message: '孤儿文件清理完成',
      results
    });

  } catch (error) {
    console.error('[安全管理] 清理孤儿文件失败:', error);
    res.status(500).json({
      success: false,
      error: '清理孤儿文件失败',
      details: error.message
    });
  }
});

module.exports = router;

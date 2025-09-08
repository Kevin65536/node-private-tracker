const express = require('express');
const router = express.Router();
const { Announcement, User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// 获取公告列表（公开接口）
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      type = '',
      include_unpublished = false
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereConditions = {
      is_published: true
    };
    
    // 管理员可以查看未发布的公告
    if (include_unpublished === 'true' && req.user?.role === 'admin') {
      delete whereConditions.is_published;
    }
    
    // 类型筛选
    if (type) {
      whereConditions.type = type;
    }
    
    // 检查是否过期
    whereConditions[Op.or] = [
      { expires_at: null },
      { expires_at: { [Op.gt]: new Date() } }
    ];
    
    // 检查是否需要初始化示例数据
    const totalCount = await Announcement.count();
    if (totalCount === 0) {
      console.log('📝 初始化示例公告...');
      try {
        await Announcement.create({
          title: '欢迎来到LZU PT站',
          content: '欢迎各位加入我们的私人种子站！\n\n请大家遵守站点规则，维护良好的分享环境。如有任何问题，请及时联系管理员。',
          type: 'info',
          is_pinned: true,
          is_published: true,
          author_id: 1, // 假设管理员ID为1
          published_at: new Date()
        });
        console.log('✅ 示例公告创建成功');
      } catch (initError) {
        console.warn('⚠️  创建示例公告失败:', initError.message);
      }
    }
    
    const { count, rows } = await Announcement.findAndCountAll({
      where: whereConditions,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }],
      order: [
        ['is_pinned', 'DESC'],
        ['published_at', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      announcements: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    res.status(500).json({ error: '获取公告列表失败' });
  }
});

// 获取单个公告详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });
    
    if (!announcement) {
      return res.status(404).json({ error: '公告不存在' });
    }
    
    // 检查权限
    if (!announcement.is_published && req.user?.role !== 'admin') {
      return res.status(404).json({ error: '公告不存在' });
    }
    
    // 检查是否过期
    if (announcement.expires_at && new Date() > announcement.expires_at) {
      if (req.user?.role !== 'admin') {
        return res.status(404).json({ error: '公告不存在' });
      }
    }
    
    res.json(announcement);
  } catch (error) {
    console.error('获取公告详情失败:', error);
    res.status(500).json({ error: '获取公告详情失败' });
  }
});

// 创建公告（管理员权限）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      type = 'info',
      is_pinned = false,
      is_published = true,
      expires_at = null
    } = req.body;
    
    // 验证必需字段
    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }
    
    // 验证类型
    const validTypes = ['info', 'warning', 'success', 'error'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '无效的公告类型' });
    }
    
    const announcement = await Announcement.create({
      title,
      content,
      type,
      is_pinned,
      is_published,
      author_id: req.user.id,
      published_at: is_published ? new Date() : null,
      expires_at: expires_at ? new Date(expires_at) : null
    });
    
    // 返回包含作者信息的完整数据
    const fullAnnouncement = await Announcement.findByPk(announcement.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });
    
    res.status(201).json(fullAnnouncement);
  } catch (error) {
    console.error('创建公告失败:', error);
    res.status(500).json({ error: '创建公告失败' });
  }
});

// 更新公告（管理员权限）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      type,
      is_pinned,
      is_published,
      expires_at
    } = req.body;
    
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ error: '公告不存在' });
    }
    
    // 验证类型（如果提供）
    if (type) {
      const validTypes = ['info', 'warning', 'success', 'error'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: '无效的公告类型' });
      }
    }
    
    // 更新字段
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (is_published !== undefined) {
      updateData.is_published = is_published;
      // 如果从未发布变为发布，设置发布时间
      if (is_published && !announcement.published_at) {
        updateData.published_at = new Date();
      }
    }
    if (expires_at !== undefined) {
      updateData.expires_at = expires_at ? new Date(expires_at) : null;
    }
    
    await announcement.update(updateData);
    
    // 返回更新后的完整数据
    const updatedAnnouncement = await Announcement.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });
    
    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('更新公告失败:', error);
    res.status(500).json({ error: '更新公告失败' });
  }
});

// 删除公告（管理员权限）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ error: '公告不存在' });
    }
    
    await announcement.destroy();
    res.json({ message: '公告删除成功' });
  } catch (error) {
    console.error('删除公告失败:', error);
    res.status(500).json({ error: '删除公告失败' });
  }
});

// 批量操作（管理员权限）
router.post('/batch', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action, ids } = req.body;
    
    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '无效的批量操作参数' });
    }
    
    const validActions = ['publish', 'unpublish', 'pin', 'unpin', 'delete'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }
    
    let updateData = {};
    let result;
    
    switch (action) {
      case 'publish':
        updateData = { is_published: true, published_at: new Date() };
        result = await Announcement.update(updateData, { where: { id: ids } });
        break;
      case 'unpublish':
        updateData = { is_published: false };
        result = await Announcement.update(updateData, { where: { id: ids } });
        break;
      case 'pin':
        updateData = { is_pinned: true };
        result = await Announcement.update(updateData, { where: { id: ids } });
        break;
      case 'unpin':
        updateData = { is_pinned: false };
        result = await Announcement.update(updateData, { where: { id: ids } });
        break;
      case 'delete':
        result = await Announcement.destroy({ where: { id: ids } });
        break;
    }
    
    res.json({ 
      message: `批量${action}操作成功`,
      affected: result[0] || result
    });
  } catch (error) {
    console.error('批量操作失败:', error);
    res.status(500).json({ error: '批量操作失败' });
  }
});

module.exports = router;

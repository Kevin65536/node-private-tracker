const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: '访问被拒绝，需要登录'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: '用户不存在'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        error: '账户已被禁用'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: '访问令牌无效'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '访问令牌已过期'
      });
    }
    console.error('认证中间件错误:', error);
    res.status(500).json({
      error: '服务器内部错误'
    });
  }
};

// 角色权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: '需要认证'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: '权限不足'
      });
    }

    next();
  };
};

// 管理员权限检查
const requireAdmin = requireRole(['admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin
};

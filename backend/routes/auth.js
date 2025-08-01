const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, UserStats } = require('../models');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// 注册验证规则
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50字符之间')
    .isAlphanumeric()
    .withMessage('用户名只能包含字母和数字'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度不能少于6位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字')
];

// 登录验证规则
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('请输入用户名或邮箱'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码')
];

// 生成JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 用户注册
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({
          error: '用户名已被使用'
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({
          error: '邮箱已被注册'
        });
      }
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
      invited_by: null,
      registration_ip: req.ip || req.connection.remoteAddress
    });

    // 创建用户统计记录
    await UserStats.create({
      user_id: user.id,
      uploaded: 0,
      downloaded: 0,
      bonus_points: 50.00, // 默认注册积分
      invitations: 0
    });

    // 生成Token
    const token = generateToken(user.id);

    res.status(201).json({
      message: '注册成功',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      error: '注册失败，请稍后重试'
    });
  }
});

// 用户登录
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // 查找用户（支持用户名或邮箱登录）
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        error: '用户名或密码错误'
      });
    }

    // 检查账户状态
    if (user.status !== 'active') {
      return res.status(401).json({
        error: '账户已被禁用，请联系管理员'
      });
    }

    // 验证密码
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    await user.update({
      last_login: new Date()
    });

    // 生成Token
    const token = generateToken(user.id);

    res.json({
      message: '登录成功',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      error: '登录失败，请稍后重试'
    });
  }
});

// 验证Token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: '缺少访问令牌'
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

    res.json({
      valid: true,
      user: user.toJSON()
    });

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
    console.error('Token验证错误:', error);
    res.status(500).json({
      error: '服务器内部错误'
    });
  }
});

module.exports = router;

const crypto = require('crypto');
const { UserPasskey } = require('../models');

/**
 * 生成32位随机 passkey
 */
function generatePasskey() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 为用户创建或获取 passkey
 */
async function getOrCreatePasskey(userId) {
  try {
    let userPasskey = await UserPasskey.findOne({
      where: { user_id: userId }
    });

    if (!userPasskey) {
      const passkey = generatePasskey();
      userPasskey = await UserPasskey.create({
        user_id: userId,
        passkey,
        active: true
      });
    }

    return userPasskey.passkey;
  } catch (error) {
    console.error('创建 passkey 失败:', error);
    throw error;
  }
}

/**
 * 验证 passkey 并返回用户信息
 */
async function validatePasskey(passkey) {
  try {
    const userPasskey = await UserPasskey.findOne({
      where: { 
        passkey,
        active: true
      },
      include: [{
        model: require('../models').User,
        as: 'User',
        attributes: ['id', 'username', 'role', 'status']
      }]
    });

    if (!userPasskey) {
      return null;
    }

    // 更新最后使用时间
    await userPasskey.update({
      last_used: new Date()
    });

    return {
      id: userPasskey.User.id,
      user_id: userPasskey.User.id,
      username: userPasskey.User.username,
      role: userPasskey.User.role,
      status: userPasskey.User.status
    };
  } catch (error) {
    console.error('验证 passkey 失败:', error);
    return null;
  }
}

/**
 * 重新生成用户的 passkey
 */
async function regeneratePasskey(userId) {
  try {
    const userPasskey = await UserPasskey.findOne({
      where: { user_id: userId }
    });

    if (!userPasskey) {
      throw new Error('用户 passkey 不存在');
    }

    const newPasskey = generatePasskey();
    await userPasskey.update({
      passkey: newPasskey
    });

    return newPasskey;
  } catch (error) {
    console.error('重新生成 passkey 失败:', error);
    throw error;
  }
}

/**
 * 构建带 passkey 的 announce URL
 */
function buildAnnounceUrl(passkey, infoHash = null) {
  const baseUrl = process.env.ANNOUNCE_URL || 'http://localhost:3001';
  return `${baseUrl}/tracker/announce/${passkey}`;
}

module.exports = {
  generatePasskey,
  getOrCreatePasskey,
  validatePasskey,
  regeneratePasskey,
  buildAnnounceUrl
};

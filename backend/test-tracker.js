/**
 * Private Tracker 功能测试脚本
 * 用于测试 BitTorrent tracker 的各项功能
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const { sequelize, User, UserPasskey, Torrent, Peer, AnnounceLog } = require('./models');
const { generatePasskey, validatePasskey, buildAnnounceUrl } = require('./utils/passkey');
const bencode = require('./utils/bencode');

const BASE_URL = 'http://localhost:3001';

// 测试颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function success(message) {
  log('✅ ' + message, 'green');
}

function error(message) {
  log('❌ ' + message, 'red');
}

function info(message) {
  log('ℹ️  ' + message, 'blue');
}

function warning(message) {
  log('⚠️  ' + message, 'yellow');
}

// 生成随机 peer_id 和 info_hash
function generatePeerId() {
  return '-PT0001-' + crypto.randomBytes(6).toString('hex');
}

function generateInfoHash() {
  return crypto.randomBytes(20);
}

/**
 * 测试 1: 数据库连接和基础模型
 */
async function testDatabaseConnection() {
  info('测试 1: 数据库连接和基础模型');
  
  try {
    await sequelize.authenticate();
    success('数据库连接成功');
    
    // 检查表是否存在
    const tables = ['users', 'user_passkeys', 'torrents', 'peers', 'announce_logs'];
    for (const table of tables) {
      const result = await sequelize.query(`SELECT to_regclass('${table}') as exists`);
      if (result[0][0].exists) {
        success(`表 ${table} 存在`);
      } else {
        error(`表 ${table} 不存在`);
      }
    }
  } catch (err) {
    error('数据库连接失败: ' + err.message);
    return false;
  }
  
  return true;
}

/**
 * 测试 2: Passkey 生成和验证
 */
async function testPasskeyFunctionality() {
  info('\n测试 2: Passkey 生成和验证');
  
  try {
    // 测试 passkey 生成
    const passkey1 = generatePasskey();
    const passkey2 = generatePasskey();
    
    if (passkey1.length === 32 && passkey2.length === 32 && passkey1 !== passkey2) {
      success('Passkey 生成功能正常');
    } else {
      error('Passkey 生成功能异常');
      return false;
    }
    
    // 测试 passkey 验证
    const user = await User.findOne({ where: { role: 'admin' } });
    if (!user) {
      error('找不到管理员用户');
      return false;
    }
    
    let userPasskey = await UserPasskey.findOne({ where: { user_id: user.id } });
    if (!userPasskey) {
      // 如果没有 passkey，创建一个
      userPasskey = await UserPasskey.create({
        user_id: user.id,
        passkey: generatePasskey(),
        active: true
      });
      info('为管理员用户创建了新的 passkey');
    }
    
    const isValid = await validatePasskey(userPasskey.passkey);
    if (isValid && isValid.user_id === user.id) {
      success('Passkey 验证功能正常');
    } else {
      error('Passkey 验证功能异常');
      return false;
    }
    
    // 测试 announce URL 构建
    const announceUrl = buildAnnounceUrl(userPasskey.passkey, 'test-info-hash');
    if (announceUrl.includes(userPasskey.passkey) && announceUrl.includes('announce')) {
      success('Announce URL 构建功能正常');
    } else {
      error('Announce URL 构建功能异常');
      return false;
    }
    
    return { user, passkey: userPasskey.passkey };
    
  } catch (err) {
    error('Passkey 功能测试失败: ' + err.message);
    return false;
  }
}

/**
 * 测试 3: 健康检查端点
 */
async function testHealthEndpoint() {
  info('\n测试 3: 健康检查端点');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200 && response.data.tracker === 'enabled') {
      success('健康检查端点正常，Tracker 已启用');
      return true;
    } else {
      error('健康检查端点异常');
      return false;
    }
  } catch (err) {
    error('健康检查端点请求失败: ' + err.message);
    return false;
  }
}

/**
 * 测试 4: Announce 端点
 */
async function testAnnounceEndpoint(passkey) {
  info('\n测试 4: Announce 端点');
  
  try {
    const peerId = generatePeerId();
    const infoHash = generateInfoHash();
    const port = 6881;
    
    // 构建 announce 请求参数
    const infoHashEncoded = encodeURIComponent(infoHash.toString('binary'));
    const params = new URLSearchParams({
      info_hash: infoHashEncoded,
      peer_id: peerId,
      port: port.toString(),
      uploaded: '0',
      downloaded: '0',
      left: '1000000',
      event: 'started',
      compact: '1',
      numwant: '50'
    });
    
    const announceUrl = `${BASE_URL}/announce/${passkey}?${params}`;
    
    const response = await axios.get(announceUrl, {
      responseType: 'arraybuffer'
    });
    
    if (response.status === 200) {
      // 解码 bencode 响应
      const decodedResponse = bencode.decodeToObject(Buffer.from(response.data));
      
      if (decodedResponse.interval && typeof decodedResponse.interval === 'number') {
        success('Announce 端点响应正常');
        info(`  - Interval: ${decodedResponse.interval} 秒`);
        info(`  - Complete: ${decodedResponse.complete || 0}`);
        info(`  - Incomplete: ${decodedResponse.incomplete || 0}`);
        
        // 测试第二次 announce (更新状态)
        const updateParams = new URLSearchParams({
          info_hash: infoHashEncoded,
          peer_id: peerId,
          port: port.toString(),
          uploaded: '50000',
          downloaded: '25000',
          left: '975000',
          event: 'update',
          compact: '1'
        });
        
        const updateUrl = `${BASE_URL}/announce/${passkey}?${updateParams}`;
        const updateResponse = await axios.get(updateUrl, {
          responseType: 'arraybuffer'
        });
        
        if (updateResponse.status === 200) {
          success('Announce 更新请求正常');
        }
        
        return { peerId, infoHash };
      } else {
        error('Announce 响应格式异常');
        return false;
      }
    } else {
      error('Announce 端点响应异常');
      return false;
    }
  } catch (err) {
    error('Announce 端点测试失败: ' + err.message);
    return false;
  }
}

/**
 * 测试 5: Scrape 端点
 */
async function testScrapeEndpoint(passkey, infoHash) {
  info('\n测试 5: Scrape 端点');
  
  try {
    const params = new URLSearchParams({
      info_hash: encodeURIComponent(infoHash.toString('binary'))
    });
    
    const scrapeUrl = `${BASE_URL}/scrape/${passkey}?${params}`;
    
    const response = await axios.get(scrapeUrl, {
      responseType: 'arraybuffer'
    });
    
    if (response.status === 200) {
      const decodedResponse = bencode.decodeToObject(Buffer.from(response.data));
      
      if (decodedResponse.files) {
        success('Scrape 端点响应正常');
        const fileStats = Object.values(decodedResponse.files)[0];
        if (fileStats) {
          info(`  - Complete: ${fileStats.complete}`);
          info(`  - Downloaded: ${fileStats.downloaded}`);
          info(`  - Incomplete: ${fileStats.incomplete}`);
        }
        return true;
      } else {
        error('Scrape 响应格式异常');
        return false;
      }
    } else {
      error('Scrape 端点响应异常');
      return false;
    }
  } catch (err) {
    error('Scrape 端点测试失败: ' + err.message);
    return false;
  }
}

/**
 * 测试 6: 统计端点
 */
async function testStatsEndpoint() {
  info('\n测试 6: 统计端点');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/stats`);
    
    if (response.status === 200 && response.data.stats) {
      success('统计端点响应正常');
      const stats = response.data.stats;
      info(`  - 总用户数: ${stats.total_users}`);
      info(`  - 总种子数: ${stats.total_torrents}`);
      info(`  - 已批准种子: ${stats.approved_torrents}`);
      info(`  - Tracker状态: ${stats.tracker_enabled ? '启用' : '禁用'}`);
      return true;
    } else {
      error('统计端点响应异常');
      return false;
    }
  } catch (err) {
    error('统计端点测试失败: ' + err.message);
    return false;
  }
}

/**
 * 测试 7: 数据库记录检查
 */
async function testDatabaseRecords() {
  info('\n测试 7: 数据库记录检查');
  
  try {
    const peerCount = await Peer.count();
    const announceLogCount = await AnnounceLog.count();
    
    info(`数据库中的记录:`);
    info(`  - Peer 记录: ${peerCount}`);
    info(`  - Announce 日志: ${announceLogCount}`);
    
    if (peerCount > 0) {
      success('Peer 记录已创建');
    } else {
      warning('没有找到 Peer 记录');
    }
    
    if (announceLogCount > 0) {
      success('Announce 日志已创建');
    } else {
      warning('没有找到 Announce 日志');
    }
    
    return true;
  } catch (err) {
    error('数据库记录检查失败: ' + err.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  log('🚀 开始 Private Tracker 功能测试\n', 'magenta');
  
  let allTestsPassed = true;
  
  // 测试 1: 数据库连接
  if (!await testDatabaseConnection()) {
    allTestsPassed = false;
  }
  
  // 测试 2: Passkey 功能
  const passkeyResult = await testPasskeyFunctionality();
  if (!passkeyResult) {
    allTestsPassed = false;
  }
  
  // 测试 3: 健康检查
  if (!await testHealthEndpoint()) {
    allTestsPassed = false;
  }
  
  // 测试 4: Announce 端点
  let announceResult = false;
  if (passkeyResult) {
    announceResult = await testAnnounceEndpoint(passkeyResult.passkey);
    if (!announceResult) {
      allTestsPassed = false;
    }
  }
  
  // 测试 5: Scrape 端点
  if (passkeyResult && announceResult) {
    if (!await testScrapeEndpoint(passkeyResult.passkey, announceResult.infoHash)) {
      allTestsPassed = false;
    }
  }
  
  // 测试 6: 统计端点
  if (!await testStatsEndpoint()) {
    allTestsPassed = false;
  }
  
  // 测试 7: 数据库记录
  if (!await testDatabaseRecords()) {
    allTestsPassed = false;
  }
  
  // 测试结果总结
  log('\n' + '='.repeat(50), 'magenta');
  if (allTestsPassed) {
    success('🎉 所有测试通过！Private Tracker 功能正常');
  } else {
    error('❌ 部分测试失败，请检查错误信息');
  }
  log('='.repeat(50), 'magenta');
}

// 运行测试
if (require.main === module) {
  runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      error('测试运行失败: ' + err.message);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testDatabaseConnection,
  testPasskeyFunctionality,
  testAnnounceEndpoint,
  testScrapeEndpoint
};

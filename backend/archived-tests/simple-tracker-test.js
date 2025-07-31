/**
 * 简单的 Private Tracker 端到端测试
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3001';
const PASSKEY = '40b01bbe6ed424ce99cce389c18e603b'; // 管理员的 passkey

// 测试颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
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

async function testTracker() {
  info('开始 Private Tracker 端到端测试');
  
  // 1. 测试健康检查
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    if (healthResponse.data.tracker === 'enabled') {
      success('健康检查通过，Tracker 已启用');
    } else {
      error('Tracker 未启用');
      return;
    }
  } catch (err) {
    error('健康检查失败: ' + err.message);
    return;
  }
  
  // 2. 测试统计端点
  try {
    const statsResponse = await axios.get(`${BASE_URL}/api/stats`);
    success('统计端点正常');
    console.log('  用户数:', statsResponse.data.stats.total_users);
    console.log('  种子数:', statsResponse.data.stats.total_torrents);
  } catch (err) {
    error('统计端点失败: ' + err.message);
  }
  
  // 3. 测试 Announce - 使用不存在的种子（预期失败）
  try {
    const testInfoHash = crypto.randomBytes(20).toString('hex');
    const peerId = '-PT0001-' + crypto.randomBytes(6).toString('hex');
    
    // 将 hex 转换为 binary 字符串并 URL 编码
    const binaryHash = Buffer.from(testInfoHash, 'hex').toString('binary');
    const encodedHash = encodeURIComponent(binaryHash);
    
    const announceUrl = `${BASE_URL}/announce/${PASSKEY}?info_hash=${encodedHash}&peer_id=${peerId}&port=6881&uploaded=0&downloaded=0&left=1000000&event=started&compact=1`;
    
    const announceResponse = await axios.get(announceUrl, {
      responseType: 'arraybuffer',
      validateStatus: () => true // 接受所有状态码
    });
    
    // 解析 bencode 响应
    const responseText = Buffer.from(announceResponse.data).toString();
    
    if (responseText.includes('failure reason')) {
      success('Announce 端点工作正常 (预期的种子不存在错误)');
      
      // 提取错误信息
      const match = responseText.match(/failure reason(\d+):(.+?)e/);
      if (match) {
        const reasonLength = parseInt(match[1]);
        const reason = match[2].substring(0, reasonLength);
        console.log('  错误信息:', reason);
      }
    } else {
      error('Announce 响应格式不正确');
    }
    
  } catch (err) {
    error('Announce 测试失败: ' + err.message);
  }
  
  // 4. 测试 Scrape - 使用不存在的种子（预期空结果）
  try {
    const testInfoHash = crypto.randomBytes(20).toString('hex');
    const binaryHash = Buffer.from(testInfoHash, 'hex').toString('binary');
    const encodedHash = encodeURIComponent(binaryHash);
    
    const scrapeUrl = `${BASE_URL}/scrape/${PASSKEY}?info_hash=${encodedHash}`;
    
    const scrapeResponse = await axios.get(scrapeUrl, {
      responseType: 'arraybuffer',
      validateStatus: () => true
    });
    
    if (scrapeResponse.status === 200) {
      success('Scrape 端点工作正常');
    } else {
      error('Scrape 端点失败，状态码: ' + scrapeResponse.status);
    }
    
  } catch (err) {
    error('Scrape 测试失败: ' + err.message);
  }
  
  // 5. 测试无效 passkey
  try {
    const invalidPasskey = 'invalid_passkey_12345';
    const testInfoHash = crypto.randomBytes(20).toString('hex');
    const binaryHash = Buffer.from(testInfoHash, 'hex').toString('binary');
    const encodedHash = encodeURIComponent(binaryHash);
    
    const url = `${BASE_URL}/announce/${invalidPasskey}?info_hash=${encodedHash}&peer_id=-PT0001-test123456&port=6881&uploaded=0&downloaded=0&left=1000000&event=started&compact=1`;
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      validateStatus: () => true
    });
    
    const responseText = Buffer.from(response.data).toString();
    
    if (responseText.includes('Invalid passkey')) {
      success('Passkey 验证工作正常 (拒绝无效 passkey)');
    } else {
      error('Passkey 验证失败');
    }
    
  } catch (err) {
    error('Passkey 验证测试失败: ' + err.message);
  }
  
  info('测试完成');
}

// 运行测试
testTracker().catch(console.error);

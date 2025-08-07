/**
 * 测试做种状态修复的完整测试脚本
 * 模拟qBittorrent客户端的announce行为来验证修复效果
 */

// 加载环境变量
require('dotenv').config();

const { sequelize, User, Torrent, Download, Peer, UserPasskey } = require('./models');
const { Op } = require('sequelize');
const axios = require('axios');

async function simulateClientAnnounce() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取测试用户和种子
    const testUser = await User.findOne({
      where: { username: 'testuser1' },
      include: [{ model: UserPasskey }]
    });

    if (!testUser || !testUser.UserPasskey) {
      console.log('❌ 没有找到有效的测试用户或passkey');
      return;
    }

    const testTorrent = await Torrent.findOne({
      where: { status: 'approved' }
    });

    if (!testTorrent) {
      console.log('❌ 没有找到有效的测试种子');
      return;
    }

    const passkey = testUser.UserPasskey.passkey;
    const infoHash = testTorrent.info_hash;
    const peerId = '-qB4500-' + Math.random().toString(36).substr(2, 12);
    const port = 6881;

    console.log(`\n🚀 开始模拟客户端announce:`);
    console.log(`用户: ${testUser.username}`);
    console.log(`种子: ${testTorrent.name}`);
    console.log(`Info Hash: ${infoHash}`);
    console.log(`Peer ID: ${peerId}`);

    // 检查修复前的状态
    console.log(`\n📊 修复前的状态:`);
    await checkCurrentStatus(testUser.id, testTorrent.id);

    // 模拟announce序列
    const baseUrl = `http://localhost:3001/tracker/announce/${passkey}`;
    
    // 步骤1: 开始下载 (started事件)
    console.log(`\n1️⃣ 模拟开始下载...`);
    await makeAnnounce(baseUrl, {
      info_hash: Buffer.from(infoHash, 'hex').toString('latin1'),
      peer_id: peerId,
      port: port,
      uploaded: 0,
      downloaded: 0,
      left: 1000000, // 1MB待下载
      event: 'started'
    });

    await checkCurrentStatus(testUser.id, testTorrent.id);

    // 步骤2: 下载进行中 (定期announce)
    console.log(`\n2️⃣ 模拟下载进行中...`);
    await makeAnnounce(baseUrl, {
      info_hash: Buffer.from(infoHash, 'hex').toString('latin1'),
      peer_id: peerId,
      port: port,
      uploaded: 50000,
      downloaded: 500000,
      left: 500000 // 还有500KB待下载
    });

    await checkCurrentStatus(testUser.id, testTorrent.id);

    // 步骤3: 下载完成 (completed事件) - 这是关键测试
    console.log(`\n3️⃣ 模拟下载完成 (completed事件)...`);
    await makeAnnounce(baseUrl, {
      info_hash: Buffer.from(infoHash, 'hex').toString('latin1'),
      peer_id: peerId,
      port: port,
      uploaded: 100000,
      downloaded: 1000000,
      left: 0, // 下载完成
      event: 'completed'
    });

    console.log(`\n🎉 关键测试点: 检查completed事件后的状态`);
    await checkCurrentStatus(testUser.id, testTorrent.id);

    // 步骤4: 做种中 (定期announce)
    console.log(`\n4️⃣ 模拟做种中...`);
    await makeAnnounce(baseUrl, {
      info_hash: Buffer.from(infoHash, 'hex').toString('latin1'),
      peer_id: peerId,
      port: port,
      uploaded: 150000, // 继续上传
      downloaded: 1000000,
      left: 0 // 保持做种状态
    });

    await checkCurrentStatus(testUser.id, testTorrent.id);

    // 步骤5: 停止做种 (stopped事件)
    console.log(`\n5️⃣ 模拟停止做种...`);
    await makeAnnounce(baseUrl, {
      info_hash: Buffer.from(infoHash, 'hex').toString('latin1'),
      peer_id: peerId,
      port: port,
      uploaded: 200000,
      downloaded: 1000000,
      left: 0,
      event: 'stopped'
    });

    await checkCurrentStatus(testUser.id, testTorrent.id);

    // 最终统计
    console.log(`\n📈 最终统计结果:`);
    await showFinalStats(testUser.id);

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await sequelize.close();
  }
}

async function makeAnnounce(baseUrl, params) {
  try {
    const response = await axios.get(baseUrl, {
      params: params,
      timeout: 5000,
      responseType: 'arraybuffer' // 因为响应是bencode格式
    });
    
    if (response.status === 200) {
      console.log(`  ✅ Announce成功 (${response.data.length} bytes)`);
      
      // 可以解析bencode响应查看详细信息
      try {
        const bencode = require('bncode');
        const decoded = bencode.decode(response.data);
        if (decoded.complete !== undefined) {
          console.log(`     做种者: ${decoded.complete}, 下载者: ${decoded.incomplete}`);
        }
      } catch (decodeError) {
        // 忽略解码错误
      }
    } else {
      console.log(`  ⚠️ Announce响应: ${response.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`  ❌ 连接失败 - 服务器可能未启动`);
    } else {
      console.log(`  ❌ Announce失败: ${error.message}`);
    }
  }
}

async function checkCurrentStatus(userId, torrentId) {
  // 检查Download记录
  const download = await Download.findOne({
    where: { user_id: userId, torrent_id: torrentId }
  });

  // 检查Peer记录
  const peer = await Peer.findOne({
    where: { user_id: userId, torrent_id: torrentId },
    order: [['last_announce', 'DESC']]
  });

  console.log(`  📋 状态检查:`);
  
  if (download) {
    console.log(`     Download表: status=${download.status}, left=${download.left}, uploaded=${download.uploaded}, downloaded=${download.downloaded}`);
  } else {
    console.log(`     Download表: 记录不存在`);
  }

  if (peer) {
    console.log(`     Peer表: status=${peer.status}, left=${peer.left}, uploaded=${peer.uploaded}, downloaded=${peer.downloaded}`);
    console.log(`     最后通告: ${peer.last_announce}`);
  } else {
    console.log(`     Peer表: 记录不存在`);
  }
}

async function showFinalStats(userId) {
  const [seedingCount, downloadingCount, stoppedCount] = await Promise.all([
    Download.count({ where: { user_id: userId, status: 'seeding' } }),
    Download.count({ where: { user_id: userId, status: 'downloading' } }),
    Download.count({ where: { user_id: userId, status: 'stopped' } })
  ]);

  console.log(`  做种中: ${seedingCount} 个`);
  console.log(`  下载中: ${downloadingCount} 个`);
  console.log(`  已停止: ${stoppedCount} 个`);

  // 检查活跃peer统计
  const activePeers = await Peer.findAll({
    where: {
      user_id: userId,
      last_announce: {
        [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    },
    attributes: ['left', 'status'],
    raw: true
  });

  const activeSeeders = activePeers.filter(p => parseInt(p.left) === 0).length;
  const activeDownloaders = activePeers.filter(p => parseInt(p.left) > 0).length;

  console.log(`  活跃做种peer: ${activeSeeders} 个`);
  console.log(`  活跃下载peer: ${activeDownloaders} 个`);
}

// 创建一个简化的测试函数，只检查当前状态不需要网络请求
async function checkCurrentStatesOnly() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log(`\n📊 当前Download状态分布:`);
    const statusCounts = await Download.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    statusCounts.forEach(stat => {
      console.log(`  ${stat.status}: ${stat.count} 个`);
    });

    console.log(`\n🔍 检查left=0但status不是seeding的记录:`);
    const inconsistentRecords = await Download.findAll({
      where: {
        left: 0,
        status: { [Op.ne]: 'seeding' }
      },
      include: [
        { model: User, attributes: ['username'] },
        { model: Torrent, attributes: ['name'] }
      ]
    });

    if (inconsistentRecords.length === 0) {
      console.log(`  ✅ 没有发现状态不一致的记录`);
    } else {
      console.log(`  ⚠️  发现 ${inconsistentRecords.length} 个状态不一致的记录:`);
      inconsistentRecords.forEach(record => {
        console.log(`    用户 ${record.User?.username} - 种子 ${record.Torrent?.name}`);
        console.log(`    left: ${record.left}, status: ${record.status}`);
      });
    }

    console.log(`\n🔗 活跃Peer统计 (最近2小时):`);
    const activePeers = await Peer.findAll({
      attributes: [
        'left',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        last_announce: {
          [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      },
      group: ['left'],
      raw: true
    });

    const seedingPeers = activePeers.filter(p => parseInt(p.left) === 0);
    const downloadingPeers = activePeers.filter(p => parseInt(p.left) > 0);

    console.log(`  做种peer (left=0): ${seedingPeers.reduce((sum, p) => sum + parseInt(p.count), 0)} 个`);
    console.log(`  下载peer (left>0): ${downloadingPeers.reduce((sum, p) => sum + parseInt(p.count), 0)} 个`);

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

if (require.main === module) {
  switch (command) {
    case 'simulate':
      console.log('🧪 开始模拟客户端announce测试...');
      simulateClientAnnounce();
      break;
    case 'check':
    default:
      console.log('🔍 检查当前状态...');
      checkCurrentStatesOnly();
      break;
  }
}

module.exports = { 
  simulateClientAnnounce, 
  checkCurrentStatesOnly,
  checkCurrentStatus,
  showFinalStats 
};

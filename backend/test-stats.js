/**
 * 统计功能测试脚本
 * 测试用户上传下载统计的各项功能
 */

// 加载环境变量
require('dotenv').config();

const axios = require('axios');
const { sequelize, User, UserStats, Download, Torrent } = require('./models');

const BASE_URL = 'http://localhost:3001';

// 测试配置
const TEST_CONFIG = {
  adminCredentials: {
    username: 'admin',
    password: 'admin123'
  },
  userCredentials: {
    username: 'testuser',
    password: 'test123'
  }
};

class StatsTestSuite {
  constructor() {
    this.adminToken = null;
    this.userToken = null;
    this.testUserId = null;
  }

  async run() {
    console.log('🧪 开始统计功能测试套件...\n');

    try {
      // 连接数据库
      await sequelize.authenticate();
      console.log('✅ 数据库连接成功\n');

      // 准备测试数据
      await this.setupTestData();

      // 执行测试
      await this.testUserStatsAPI();
      await this.testLeaderboard();
      await this.testGlobalStats();
      await this.testAdminStatsAPI();
      await this.testStatsCalculation();

      console.log('\n🎉 所有测试完成！');

    } catch (error) {
      console.error('❌ 测试失败:', error.message);
    } finally {
      await sequelize.close();
    }
  }

  async setupTestData() {
    console.log('📋 准备测试数据...');

    // 登录管理员
    try {
      const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CONFIG.adminCredentials);
      this.adminToken = adminLogin.data.token;
      console.log('✅ 管理员登录成功');
    } catch (error) {
      console.log('ℹ️  管理员登录失败，可能需要先创建管理员账户');
    }

    // 登录测试用户
    try {
      const userLogin = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CONFIG.userCredentials);
      this.userToken = userLogin.data.token;
      this.testUserId = userLogin.data.user.id;
      console.log('✅ 测试用户登录成功');
    } catch (error) {
      console.log('ℹ️  测试用户登录失败，可能需要先创建测试账户');
    }

    // 创建测试统计数据
    await this.createTestStatsData();
    console.log('✅ 测试数据准备完成\n');
  }

  async createTestStatsData() {
    if (!this.testUserId) return;

    // 创建或更新用户统计
    await UserStats.findOrCreate({
      where: { user_id: this.testUserId },
      defaults: {
        uploaded: 1024 * 1024 * 1024 * 5, // 5GB
        downloaded: 1024 * 1024 * 1024 * 3, // 3GB
        seedtime: 3600 * 24 * 7, // 7天
        leechtime: 3600 * 12, // 12小时
        bonus_points: 150,
        torrents_uploaded: 2,
        torrents_seeding: 3,
        torrents_leeching: 1
      }
    });

    console.log('✅ 测试统计数据已创建');
  }

  async testUserStatsAPI() {
    console.log('🔍 测试用户统计API...');

    if (!this.userToken || !this.testUserId) {
      console.log('⚠️  跳过用户统计API测试（缺少认证）');
      return;
    }

    try {
      // 测试获取用户统计
      const response = await axios.get(
        `${BASE_URL}/api/stats/user/${this.testUserId}`,
        { headers: { Authorization: `Bearer ${this.userToken}` } }
      );

      console.log('✅ 获取用户统计成功');
      console.log('📊 统计数据:', {
        uploaded: `${(response.data.stats.uploaded / (1024**3)).toFixed(2)} GB`,
        downloaded: `${(response.data.stats.downloaded / (1024**3)).toFixed(2)} GB`,
        ratio: response.data.stats.ratio.toFixed(2),
        bonus_points: response.data.stats.bonus_points
      });

    } catch (error) {
      console.error('❌ 用户统计API测试失败:', error.response?.data || error.message);
    }
  }

  async testLeaderboard() {
    console.log('\n🏆 测试排行榜API...');

    try {
      // 测试上传排行榜
      const uploadedBoard = await axios.get(`${BASE_URL}/api/stats/leaderboard?type=uploaded&limit=10`, {
        headers: this.userToken ? { Authorization: `Bearer ${this.userToken}` } : {}
      });

      console.log('✅ 上传排行榜获取成功');
      console.log('🥇 前3名:', uploadedBoard.data.leaderboard.slice(0, 3).map(user => ({
        rank: user.rank,
        username: user.user.username,
        uploaded: `${(user.stats.uploaded / (1024**3)).toFixed(2)} GB`
      })));

      // 测试比率排行榜
      const ratioBoard = await axios.get(`${BASE_URL}/api/stats/leaderboard?type=ratio&limit=5`, {
        headers: this.userToken ? { Authorization: `Bearer ${this.userToken}` } : {}
      });

      console.log('✅ 比率排行榜获取成功');

    } catch (error) {
      console.error('❌ 排行榜API测试失败:', error.response?.data || error.message);
    }
  }

  async testGlobalStats() {
    console.log('\n🌍 测试全站统计API...');

    try {
      const response = await axios.get(`${BASE_URL}/api/stats/global`);

      console.log('✅ 全站统计获取成功');
      console.log('📈 全站数据:', {
        total_users: response.data.general.total_users,
        active_users: response.data.general.active_users,
        total_torrents: response.data.general.total_torrents,
        total_uploaded: `${(response.data.traffic.total_uploaded / (1024**4)).toFixed(2)} TB`,
        total_downloaded: `${(response.data.traffic.total_downloaded / (1024**4)).toFixed(2)} TB`,
        global_ratio: response.data.traffic.global_ratio.toFixed(2)
      });

    } catch (error) {
      console.error('❌ 全站统计API测试失败:', error.response?.data || error.message);
    }
  }

  async testAdminStatsAPI() {
    console.log('\n👮 测试管理员统计API...');

    if (!this.adminToken || !this.testUserId) {
      console.log('⚠️  跳过管理员统计API测试（缺少管理员权限）');
      return;
    }

    try {
      // 测试获取用户活动历史
      const activityResponse = await axios.get(
        `${BASE_URL}/api/stats/user/${this.testUserId}/activity?days=7`,
        { headers: { Authorization: `Bearer ${this.adminToken}` } }
      );

      console.log('✅ 用户活动历史获取成功');
      console.log('📋 活动记录数:', activityResponse.data.activities.length);

      // 测试重新计算统计
      const recalcResponse = await axios.post(
        `${BASE_URL}/api/stats/user/${this.testUserId}/recalculate`,
        {},
        { headers: { Authorization: `Bearer ${this.adminToken}` } }
      );

      console.log('✅ 统计重新计算成功');

    } catch (error) {
      console.error('❌ 管理员统计API测试失败:', error.response?.data || error.message);
    }
  }

  async testStatsCalculation() {
    console.log('\n🧮 测试统计计算功能...');

    try {
      // 测试比率计算
      const testCases = [
        { uploaded: 5 * 1024**3, downloaded: 3 * 1024**3, expected: 5/3 },
        { uploaded: 10 * 1024**3, downloaded: 0, expected: Infinity },
        { uploaded: 0, downloaded: 0, expected: 1 }
      ];

      testCases.forEach((testCase, index) => {
        const ratio = testCase.downloaded > 0 
          ? testCase.uploaded / testCase.downloaded 
          : (testCase.uploaded > 0 ? Infinity : 1);
        
        const passed = (ratio === testCase.expected) || 
                      (isFinite(testCase.expected) && Math.abs(ratio - testCase.expected) < 0.001);
        
        console.log(`${passed ? '✅' : '❌'} 比率计算测试 ${index + 1}: ${ratio.toFixed(2)}`);
      });

      console.log('✅ 统计计算功能测试完成');

    } catch (error) {
      console.error('❌ 统计计算测试失败:', error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  const testSuite = new StatsTestSuite();
  testSuite.run().catch(console.error);
}

module.exports = StatsTestSuite;

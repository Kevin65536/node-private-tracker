require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001/api';

class PTSiteTest {
  constructor() {
    this.adminToken = null;
    this.userToken = null;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, API_BASE);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const response = {
              status: res.statusCode,
              data: body ? JSON.parse(body) : null
            };
            resolve(response);
          } catch (error) {
            reject(new Error(`JSON解析失败: ${body}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async testAPIHealth() {
    await this.log('测试API健康状态...');
    try {
      const response = await this.makeRequest('GET', '/health');
      if (response.status === 200) {
        await this.log('API健康检查通过', 'success');
        await this.log(`数据库状态: ${JSON.stringify(response.data.database.stats)}`);
        return true;
      } else {
        await this.log(`API返回错误状态: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`API健康检查失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testAdminLogin() {
    await this.log('测试管理员登录...');
    try {
      const response = await this.makeRequest('POST', '/auth/login', {
        username: 'admin',
        password: 'admin123456'
      });
      
      if (response.status === 200) {
        this.adminToken = response.data.token;
        await this.log('管理员登录成功', 'success');
        await this.log(`用户角色: ${response.data.user.role}`);
        return true;
      } else {
        await this.log(`管理员登录失败: ${response.data?.error || '未知错误'}`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`管理员登录失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testUserLogin() {
    await this.log('测试普通用户登录...');
    try {
      const response = await this.makeRequest('POST', '/auth/login', {
        username: 'testuser',
        password: 'test123456'
      });
      
      if (response.status === 200) {
        this.userToken = response.data.token;
        await this.log('普通用户登录成功', 'success');
        await this.log(`用户角色: ${response.data.user.role}`);
        return true;
      } else {
        await this.log(`普通用户登录失败: ${response.data?.error || '未知错误'}`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`普通用户登录失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testTokenVerification() {
    await this.log('测试Token验证...');
    try {
      const response = await this.makeRequest('GET', '/auth/verify', null, {
        Authorization: `Bearer ${this.adminToken}`
      });
      
      if (response.status === 200) {
        await this.log('Token验证成功', 'success');
        return true;
      } else {
        await this.log(`Token验证失败: ${response.data?.error || '未知错误'}`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`Token验证失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testCategoriesAPI() {
    await this.log('测试分类API...');
    try {
      const response = await this.makeRequest('GET', '/torrents/categories/list');
      if (response.status === 200) {
        const categories = response.data.categories || response.data;
        await this.log(`获取到 ${categories.length} 个分类`, 'success');
        categories.slice(0, 3).forEach(cat => {
          console.log(`  - ${cat.name}: ${cat.description}`);
        });
        return true;
      } else {
        await this.log(`分类API返回错误状态: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`分类API测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testTorrentsAPI() {
    await this.log('测试种子列表API...');
    try {
      const response = await this.makeRequest('GET', '/torrents');
      if (response.status === 200) {
        const data = response.data;
        await this.log(`当前种子数量: ${data.torrents?.length || 0}`, 'success');
        if (data.pagination) {
          await this.log(`分页信息: 第${data.pagination.current_page}页，共${data.pagination.total_count}条`);
        }
        return true;
      } else {
        await this.log(`种子API返回错误状态: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`种子API测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testStatsAPI() {
    await this.log('测试站点统计API...');
    try {
      const response = await this.makeRequest('GET', '/stats');
      if (response.status === 200) {
        const stats = response.data;
        await this.log('站点统计信息:', 'success');
        console.log(`  - 用户总数: ${stats.users.total} (活跃: ${stats.users.active})`);
        console.log(`  - 种子总数: ${stats.torrents.total}`);
        console.log(`  - 分类总数: ${stats.categories.total}`);
        console.log(`  - 下载总数: ${stats.downloads.total}`);
        return true;
      } else {
        await this.log(`统计API返回错误状态: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`统计API测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testUploadInfo() {
    await this.log('测试上传信息API...');
    try {
      const response = await this.makeRequest('GET', '/upload/info');
      if (response.status === 200) {
        const info = response.data;
        await this.log('上传配置信息:', 'success');
        console.log(`  - 最大文件大小: ${(info.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
        console.log(`  - 允许的文件类型: ${info.allowedTypes.join(', ')}`);
        console.log(`  - Announce URL: ${info.announceUrl}`);
        console.log(`  - 可用分类数: ${info.categories.length}`);
        return true;
      } else {
        await this.log(`上传信息API返回错误状态: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      await this.log(`上传信息API测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    await this.log('开始PT站点功能测试', 'info');
    await this.log('='.repeat(50));
    
    const tests = [
      { name: 'API健康检查', fn: () => this.testAPIHealth() },
      { name: '管理员登录', fn: () => this.testAdminLogin() },
      { name: '普通用户登录', fn: () => this.testUserLogin() },
      { name: 'Token验证', fn: () => this.testTokenVerification() },
      { name: '分类API', fn: () => this.testCategoriesAPI() },
      { name: '种子API', fn: () => this.testTorrentsAPI() },
      { name: '统计API', fn: () => this.testStatsAPI() },
      { name: '上传信息API', fn: () => this.testUploadInfo() }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
      await this.delay(500); // 短暂延迟避免请求过快
      const result = await test.fn();
      if (result) passedTests++;
      await this.log('-'.repeat(30));
    }
    
    await this.log('='.repeat(50));
    await this.log(`测试完成: ${passedTests}/${totalTests} 项通过`, passedTests === totalTests ? 'success' : 'warning');
    
    if (passedTests === totalTests) {
      await this.log('🎉 所有功能测试通过！PT站点已准备好进行开发！', 'success');
      await this.log('');
      await this.log('📋 下一步建议:');
      await this.log('  1. 访问 http://localhost:3000 查看前端应用');
      await this.log('  2. 使用 admin / admin123456 登录管理后台');
      await this.log('  3. 开始开发更多PT站功能（种子上传、下载等）');
      await this.log('  4. 完善用户权限和积分系统');
    } else {
      await this.log('部分测试失败，请检查服务器状态和配置', 'warning');
    }
  }
}

// 运行测试
const tester = new PTSiteTest();
tester.runAllTests().catch(console.error);

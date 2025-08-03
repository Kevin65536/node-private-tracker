import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 直接使用IP地址进行测试
const API_BASE_URL = 'http://172.21.48.71:3001/api';

const DebugPage = () => {
  const [debugInfo, setDebugInfo] = useState({
    envVar: process.env.REACT_APP_API_URL,
    apiUrl: API_BASE_URL,
    statsData: null,
    torrentsData: null,
    loginTest: null,
    errors: []
  });

  useEffect(() => {
    testAllAPIs();
  }, []);

  const testAllAPIs = async () => {
    const errors = [];
    let statsData = null;
    let torrentsData = null;
    let loginTest = null;

    // 测试统计API
    try {
      console.log('测试统计API:', `${API_BASE_URL}/stats`);
      const statsResponse = await axios.get(`${API_BASE_URL}/stats`);
      statsData = statsResponse.data;
    } catch (error) {
      errors.push(`统计API错误: ${error.message}`);
    }

    // 测试种子API
    try {
      console.log('测试种子API:', `${API_BASE_URL}/torrents`);
      const torrentsResponse = await axios.get(`${API_BASE_URL}/torrents`);
      torrentsData = torrentsResponse.data;
    } catch (error) {
      errors.push(`种子API错误: ${error.message}`);
    }

    // 测试登录API
    try {
      console.log('测试登录API:', `${API_BASE_URL}/auth/login`);
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: 'admin',
        password: 'admin123456'
      });
      loginTest = {
        success: true,
        user: loginResponse.data.user?.username,
        hasToken: !!loginResponse.data.token
      };
    } catch (error) {
      loginTest = {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }

    setDebugInfo(prev => ({
      ...prev,
      statsData,
      torrentsData,
      loginTest,
      errors
    }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 PT站前端API调试页面</h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', margin: '10px 0' }}>
        <h2>📊 环境信息</h2>
        <p><strong>环境变量 REACT_APP_API_URL:</strong> {debugInfo.envVar || '未设置'}</p>
        <p><strong>使用的API URL:</strong> {debugInfo.apiUrl}</p>
        <p><strong>当前时间:</strong> {new Date().toLocaleString()}</p>
      </div>

      <div style={{ backgroundColor: '#e8f5e8', padding: '15px', margin: '10px 0' }}>
        <h2>📈 统计数据测试</h2>
        {debugInfo.statsData ? (
          <div>
            <p>✅ <strong>统计API成功！</strong></p>
            <p>总用户数: {debugInfo.statsData.stats?.total_users}</p>
            <p>总种子数: {debugInfo.statsData.stats?.total_torrents}</p>
            <p>审核通过: {debugInfo.statsData.stats?.approved_torrents}</p>
            <p>上传流量: {(debugInfo.statsData.traffic?.totalUploaded / 1024 / 1024 / 1024).toFixed(2)} GB</p>
          </div>
        ) : (
          <p>❌ 统计数据加载中或失败</p>
        )}
      </div>

      <div style={{ backgroundColor: '#e8f5e8', padding: '15px', margin: '10px 0' }}>
        <h2>📂 种子数据测试</h2>
        {debugInfo.torrentsData ? (
          <div>
            <p>✅ <strong>种子API成功！</strong></p>
            <p>种子数量: {debugInfo.torrentsData.torrents?.length}</p>
            <p>总数: {debugInfo.torrentsData.total}</p>
            {debugInfo.torrentsData.torrents?.slice(0, 3).map((torrent, index) => (
              <p key={index}>- {torrent.title}</p>
            ))}
          </div>
        ) : (
          <p>❌ 种子数据加载中或失败</p>
        )}
      </div>

      <div style={{ backgroundColor: '#e8f5e8', padding: '15px', margin: '10px 0' }}>
        <h2>🔐 登录测试</h2>
        {debugInfo.loginTest ? (
          <div>
            {debugInfo.loginTest.success ? (
              <div>
                <p>✅ <strong>登录成功！</strong></p>
                <p>用户: {debugInfo.loginTest.user}</p>
                <p>Token: {debugInfo.loginTest.hasToken ? '已获取' : '未获取'}</p>
              </div>
            ) : (
              <div>
                <p>❌ <strong>登录失败</strong></p>
                <p>错误: {debugInfo.loginTest.error}</p>
              </div>
            )}
          </div>
        ) : (
          <p>🔄 登录测试中...</p>
        )}
      </div>

      {debugInfo.errors.length > 0 && (
        <div style={{ backgroundColor: '#ffe8e8', padding: '15px', margin: '10px 0' }}>
          <h2>❌ 错误信息</h2>
          {debugInfo.errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={testAllAPIs} style={{ padding: '10px 20px', fontSize: '16px' }}>
          🔄 重新测试所有API
        </button>
      </div>
    </div>
  );
};

export default DebugPage;

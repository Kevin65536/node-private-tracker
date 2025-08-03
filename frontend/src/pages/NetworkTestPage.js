import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const NetworkTestPage = () => {
  const [testResults, setTestResults] = useState({
    apiUrl: '',
    hostname: '',
    healthCheck: null,
    registerTest: null,
    loginTest: null
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    const apiUrl = process.env.REACT_APP_API_URL || `http://${hostname}:3001/api`;
    
    setTestResults(prev => ({
      ...prev,
      hostname,
      apiUrl
    }));
    
    // 测试健康检查
    testHealthCheck(apiUrl);
  }, []);

  const testHealthCheck = async (apiUrl) => {
    try {
      const response = await fetch(apiUrl.replace('/api', '') + '/api/health');
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        healthCheck: { success: true, data }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        healthCheck: { success: false, error: error.message }
      }));
    }
  };

  const testRegister = async () => {
    try {
      const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test123456'
      };
      
      const response = await authAPI.register(testUser);
      setTestResults(prev => ({
        ...prev,
        registerTest: { success: true, data: response.data }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        registerTest: { 
          success: false, 
          error: error.response?.data?.error || error.message 
        }
      }));
    }
  };

  const testLogin = async () => {
    try {
      const response = await authAPI.login({
        username: 'testuser',
        password: 'test123456'
      });
      setTestResults(prev => ({
        ...prev,
        loginTest: { success: true, data: response.data }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        loginTest: { 
          success: false, 
          error: error.response?.data?.error || error.message 
        }
      }));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">网络连接测试</h1>
        
        <div className="space-y-4">
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">基础信息</h3>
            <p><strong>当前主机名:</strong> {testResults.hostname}</p>
            <p><strong>API地址:</strong> {testResults.apiUrl}</p>
          </div>

          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">健康检查测试</h3>
            {testResults.healthCheck === null ? (
              <p className="text-yellow-600">测试中...</p>
            ) : testResults.healthCheck.success ? (
              <div className="text-green-600">
                <p>✅ 健康检查成功</p>
                <pre className="bg-gray-100 p-2 text-sm mt-2 rounded">
                  {JSON.stringify(testResults.healthCheck.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-red-600">
                <p>❌ 健康检查失败</p>
                <p>错误: {testResults.healthCheck.error}</p>
              </div>
            )}
          </div>

          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">注册测试</h3>
            <button
              onClick={testRegister}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-2"
            >
              测试注册
            </button>
            {testResults.registerTest && (
              <div className={testResults.registerTest.success ? 'text-green-600' : 'text-red-600'}>
                {testResults.registerTest.success ? (
                  <div>
                    <p>✅ 注册测试成功</p>
                    <pre className="bg-gray-100 p-2 text-sm mt-2 rounded">
                      {JSON.stringify(testResults.registerTest.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p>❌ 注册测试失败</p>
                    <p>错误: {testResults.registerTest.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">登录测试</h3>
            <button
              onClick={testLogin}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-2"
            >
              测试登录
            </button>
            {testResults.loginTest && (
              <div className={testResults.loginTest.success ? 'text-green-600' : 'text-red-600'}>
                {testResults.loginTest.success ? (
                  <div>
                    <p>✅ 登录测试成功</p>
                    <pre className="bg-gray-100 p-2 text-sm mt-2 rounded">
                      {JSON.stringify(testResults.loginTest.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p>❌ 登录测试失败</p>
                    <p>错误: {testResults.loginTest.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTestPage;

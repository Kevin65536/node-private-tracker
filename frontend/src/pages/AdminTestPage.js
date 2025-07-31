import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AdminTestPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = [];

    // 测试1: 检查认证状态
    results.push({
      test: '用户认证状态',
      result: isAuthenticated ? '✅ 已认证' : '❌ 未认证',
      details: user ? `用户: ${user.username}, 角色: ${user.role}` : '无用户信息'
    });

    // 测试2: 检查localStorage
    const token = localStorage.getItem('authToken');
    results.push({
      test: 'localStorage token',
      result: token ? '✅ 存在' : '❌ 不存在',
      details: token ? `Token: ${token.substring(0, 50)}...` : '无token'
    });

    // 测试3: 测试API连接
    try {
      const healthResponse = await api.get('/health');
      results.push({
        test: 'API健康检查',
        result: '✅ 连接正常',
        details: healthResponse.data.message
      });
    } catch (error) {
      results.push({
        test: 'API健康检查',
        result: '❌ 连接失败',
        details: error.message
      });
    }

    // 测试4: 测试认证验证
    if (token) {
      try {
        const verifyResponse = await api.get('/auth/verify');
        results.push({
          test: 'Token验证',
          result: '✅ 有效',
          details: `验证用户: ${verifyResponse.data.user?.username}`
        });
      } catch (error) {
        results.push({
          test: 'Token验证',
          result: '❌ 无效',
          details: error.response?.data?.error || error.message
        });
      }
    }

    // 测试5: 测试管理员API
    if (user && user.role === 'admin') {
      try {
        const torrentsResponse = await api.get('/admin/torrents?status=pending');
        results.push({
          test: '管理员API',
          result: '✅ 可访问',
          details: `找到 ${torrentsResponse.data.torrents?.length || 0} 个待审核种子`
        });
      } catch (error) {
        results.push({
          test: '管理员API',
          result: '❌ 访问失败',
          details: error.response?.data?.error || error.message
        });
      }
    } else {
      results.push({
        test: '管理员API',
        result: '⏭️ 跳过',
        details: '用户角色不足'
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, [user]);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        管理员功能测试
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={runTests} 
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          重新测试
        </Button>
      </Box>

      {testResults.map((result, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">
            {result.test}: {result.result}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {result.details}
          </Typography>
        </Paper>
      ))}
    </Container>
  );
};

export default AdminTestPage;

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Button } from '@mui/material';

const ImageTestPage = () => {
  const [serverStatus, setServerStatus] = useState('检测中...');
  
  // 测试不同的图片URL构建方式
  const getServerBaseUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    return apiUrl.replace('/api', '');
  };
  
  const testImageFile = '1753970989559-73f0f934da8200f1.png';
  const imageUrl = `${getServerBaseUrl()}/uploads/${testImageFile}`;
  
  // 测试服务器连接
  useEffect(() => {
    const testServerConnection = async () => {
      try {
        const response = await fetch(getServerBaseUrl() + '/api/torrents');
        if (response.ok) {
          setServerStatus('服务器连接正常');
        } else {
          setServerStatus(`服务器响应错误: ${response.status}`);
        }
      } catch (error) {
        setServerStatus(`服务器连接失败: ${error.message}`);
      }
    };
    
    testServerConnection();
  }, []);
  
  const testImageUrl = async () => {
    try {
      const response = await fetch(imageUrl);
      alert(`图片URL测试结果: ${response.status} ${response.statusText}`);
    } catch (error) {
      alert(`图片URL访问失败: ${error.message}`);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        图片URL测试页面
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            环境变量信息
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            REACT_APP_API_URL: {process.env.REACT_APP_API_URL || '未设置'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            计算的服务器基础URL: {getServerBaseUrl()}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            完整图片URL: {imageUrl}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            服务器状态: {serverStatus}
          </Typography>
          <Button variant="outlined" onClick={testImageUrl} sx={{ mt: 2 }}>
            测试图片URL访问
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            测试图片显示
          </Typography>
          <Box
            component="img"
            src={imageUrl}
            alt="测试图片"
            onLoad={() => {
              console.log('图片加载成功');
              alert('图片加载成功!');
            }}
            onError={(e) => {
              console.error('图片加载失败:', e.target.src);
              alert('图片加载失败: ' + e.target.src);
            }}
            sx={{
              width: '100%',
              maxWidth: 400,
              height: 200,
              objectFit: 'cover',
              border: '1px solid #ddd'
            }}
          />
        </CardContent>
      </Card>
    </Container>
  );
};

export default ImageTestPage;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  Share,
  Stars,
} from '@mui/icons-material';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserStats = ({ userId, isCurrentUser = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [userId, isAuthenticated]);

  const fetchUserStats = async () => {
    if (!isAuthenticated) {
      setError('请先登录查看统计信息');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('获取用户统计信息...');
      
      // 同时获取用户统计信息和用户资料
      const [statsResponse, profileResponse] = await Promise.all([
        userAPI.getStats(),
        userAPI.getProfile()
      ]);
      
      console.log('用户统计API响应:', statsResponse.data);
      console.log('用户资料API响应:', profileResponse.data);
      
      // 合并统计数据和用户信息
      const statsData = statsResponse.data?.stats || {};
      const userData = profileResponse.data?.user || {};
      
      // 根据用户角色映射用户等级
      const getUserLevel = (role) => {
        switch (role) {
          case 'admin':
            return '管理员';
          case 'user':
            return '普通用户';
          default:
            return '新用户';
        }
      };
      
      const combinedStats = {
        ...statsData,
        user_level: getUserLevel(userData.role),
        registration_date: userData.created_at || userData.createdAt,
        last_active: userData.last_login || new Date().toISOString()
      };
      
      setStats(combinedStats);
      
    } catch (err) {
      console.error('获取用户统计失败:', err);
      
      // API失败时显示模拟数据
      const mockStats = {
        uploaded: 0,
        downloaded: 0,
        ratio: 0,
        bonus_points: 50,
        seedtime: 0,
        leechtime: 0,
        torrents_uploaded: 0,
        downloads: 0,
        last_active: new Date().toISOString(),
        user_level: user?.role === 'admin' ? '管理员' : '普通用户',
        registration_date: user?.created_at || user?.createdAt || new Date().toISOString()
      };
      
      setStats(mockStats);
      setError(`API连接失败，显示演示数据: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 格式化字节数
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化比率
  const formatRatio = (ratio) => {
    if (!ratio || ratio === 0) return '0.00';
    if (ratio === Infinity) return '∞';
    return parseFloat(ratio).toFixed(2);
  };

  // 获取比率颜色
  const getRatioColor = (ratio) => {
    if (!ratio || ratio < 0.5) return 'error';
    if (ratio < 1) return 'warning';
    return 'success';
  };

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          请先登录查看个人统计信息
        </Typography>
        <Button variant="contained" href="/login" sx={{ mt: 2 }}>
          前往登录
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // 如果没有stats数据，显示暂无数据
  if (!stats) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <Typography variant="h6" color="text.secondary">
          暂无统计数据
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        我的统计
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <CloudUpload color="primary" />
                <Typography variant="h4" color="primary">
                  {formatBytes(stats?.uploaded || 0)}
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                总上传量
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <CloudDownload color="secondary" />
                <Typography variant="h4" color="secondary">
                  {formatBytes(stats?.downloaded || 0)}
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                总下载量
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Share color="success" />
                <Box>
                  <Typography variant="h4" color="success">
                    {formatRatio(stats?.ratio || 0)}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={(stats?.ratio || 0) >= 1 ? '优秀' : '需改善'} 
                    color={getRatioColor(stats?.ratio || 0)}
                  />
                </Box>
              </Box>
              <Typography variant="h6" gutterBottom>
                分享率
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Stars color="warning" />
                <Typography variant="h4" color="warning">
                  {Math.floor(parseFloat(stats?.bonus_points) || 0)}
                </Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                积分
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          详细信息
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  活动统计
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="上传种子数" 
                      secondary={stats?.torrents_uploaded || 0} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="下载次数" 
                      secondary={stats?.downloads || 0} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="最后活动时间" 
                      secondary={stats?.last_active ? new Date(stats.last_active).toLocaleString() : '暂无记录'} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  用户信息
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="用户等级" 
                      secondary={stats?.user_level || '普通用户'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="注册时间" 
                      secondary={stats?.registration_date ? new Date(stats.registration_date).toLocaleDateString() : '未知'} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default UserStats;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Paper,
  Container,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  People,
  Storage,
  Timeline,
  Refresh,
  TrendingUp,
  Speed
} from '@mui/icons-material';
import api from '../services/api';

const GlobalStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('开始获取统计数据...');
      
      // 使用基础的stats API
      const response = await api.get('/stats');
      
      console.log('统计API响应:', response.data);
      
      // 转换后端数据格式到前端期望的格式
      const backendData = response.data;
      const transformedStats = {
        totalUsers: backendData.stats?.total_users || 0,
        activeUsers: backendData.stats?.active_users || 0,
        totalTorrents: backendData.stats?.total_torrents || 0,
        approvedTorrents: backendData.stats?.approved_torrents || 0,
        totalUploaded: backendData.traffic?.totalUploaded || 0,
        totalDownloaded: backendData.traffic?.totalDownloaded || 0,
        globalRatio: backendData.traffic?.totalDownloaded > 0 
          ? backendData.traffic.totalUploaded / backendData.traffic.totalDownloaded 
          : null,
        avgRatio: 1.0, // 默认值，后续可以从后端计算
        avgUploaded: backendData.stats?.total_users > 0 
          ? (backendData.traffic?.totalUploaded || 0) / backendData.stats.total_users 
          : 0,
        avgDownloaded: backendData.stats?.total_users > 0 
          ? (backendData.traffic?.totalDownloaded || 0) / backendData.stats.total_users 
          : 0,
        todayNewUsers: 0, // 暂时默认为0，后续可以从后端获取
        todayNewTorrents: 0, // 暂时默认为0，后续可以从后端获取
        lastUpdated: new Date().toISOString()
      };
      
      console.log('转换后的统计数据:', transformedStats);
      setStats(transformedStats);
    } catch (error) {
      console.error('获取全站统计失败:', error);
      setError(error.response?.data?.error || error.message || '获取统计信息失败');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <CardContent>
          <Typography color="error" align="center">
            {error}
          </Typography>
          <Box display="flex" justifyContent="center" mt={2}>
            <Button variant="contained" onClick={fetchGlobalStats}>
              重试
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <CardContent>
          <Typography align="center" color="text.secondary">
            暂无统计数据
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
          <Typography variant="h4" component="div" color={`${color}.main`} fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            全站统计
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchGlobalStats}
            startIcon={<Refresh />}
          >
            刷新数据
          </Button>
        </Box>

        {/* 主要统计数据 */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="总用户数"
              value={formatNumber(stats.totalUsers)}
              icon={<People sx={{ fontSize: 40 }} />}
              color="primary"
              subtitle="注册用户总数"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="种子总数"
              value={formatNumber(stats.totalTorrents)}
              icon={<Storage sx={{ fontSize: 40 }} />}
              color="secondary"
              subtitle="平台种子总数"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="总上传量"
              value={formatSize(stats.totalUploaded)}
              icon={<CloudUpload sx={{ fontSize: 40 }} />}
              color="success"
              subtitle="全站累计上传"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="总下载量"
              value={formatSize(stats.totalDownloaded)}
              icon={<CloudDownload sx={{ fontSize: 40 }} />}
              color="warning"
              subtitle="全站累计下载"
            />
          </Grid>
        </Grid>

        {/* 分享率和活跃度统计 */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                  全站分享率
                </Typography>
                <Typography variant="h3" color="primary" gutterBottom>
                  {stats.globalRatio ? stats.globalRatio.toFixed(2) : '∞'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  全站总上传量 / 总下载量
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                  活跃用户
                </Typography>
                <Typography variant="h3" color="secondary" gutterBottom>
                  {formatNumber(stats.activeUsers)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  过去7天内活跃的用户数
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 详细统计 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom mb={3}>
              详细统计信息
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box mb={2}>
                  <Typography variant="body1" gutterBottom>
                    平均分享率: <strong>{stats.avgRatio ? stats.avgRatio.toFixed(2) : 'N/A'}</strong>
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((stats.avgRatio || 0) * 50, 100)} 
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body1" gutterBottom>
                    用户平均上传: <strong>{formatSize(stats.avgUploaded)}</strong>
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body1" gutterBottom>
                    用户平均下载: <strong>{formatSize(stats.avgDownloaded)}</strong>
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box mb={2}>
                  <Typography variant="body1" gutterBottom>
                    今日新增用户: <strong>{stats.todayNewUsers || 0}</strong>
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body1" gutterBottom>
                    今日新增种子: <strong>{stats.todayNewTorrents || 0}</strong>
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body1" gutterBottom>
                    最后更新时间: <strong>{new Date(stats.lastUpdated).toLocaleString()}</strong>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 数据更新提示 */}
        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            统计数据每小时自动更新一次，点击刷新按钮可手动获取最新数据
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default GlobalStats;

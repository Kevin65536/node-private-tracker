import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  CloudDownload,
  CloudUpload,
  People,
  Category,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { torrentAPI, apiUtils } from '../services/api';
import api from '../services/api';
import { formatFileSize, formatNumber } from '../utils/formatters';
import AnnouncementsList from '../components/AnnouncementsList';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [recentTorrents, setRecentTorrents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalTorrents: 0,
    totalUsers: 0,
    totalUploaded: 0,
    totalDownloaded: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取最新种子
        const torrentsResponse = await torrentAPI.getTorrents({
          limit: 6,  // 减少显示数量从10到6
          sort: 'created_at',
          order: 'DESC'
        });
        setRecentTorrents(torrentsResponse.data.torrents);

        // 获取分类列表
        const categoriesResponse = await torrentAPI.getCategories();
        setCategories(categoriesResponse.data.categories);

        // 获取真实的站点统计数据
        const statsResponse = await api.get('/stats');
        const statsData = statsResponse.data;
        
        setStats({
          totalTorrents: statsData.stats.approved_torrents || 0,
          totalUsers: statsData.stats.total_users || 0,
          totalUploaded: statsData.traffic.totalUploaded > 0 ? 
            formatFileSize(statsData.traffic.totalUploaded) : '暂无数据',
          totalDownloaded: statsData.traffic.totalDownloaded > 0 ? 
            formatFileSize(statsData.traffic.totalDownloaded) : '暂无数据',
        });
      } catch (error) {
        console.error('获取首页数据失败:', error);
        // 如果获取失败，使用默认值
        setStats({
          totalTorrents: 0,
          totalUsers: 0,
          totalUploaded: '暂无数据',
          totalDownloaded: '暂无数据',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ icon, title, value, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Box sx={{ color: `${color}.main`, mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 欢迎消息 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          欢迎来到LZU PT站
        </Typography>
        
        {!isAuthenticated && (
          <Alert severity="info" sx={{ mt: 2 }}>
            请先 <Button onClick={() => navigate('/login')}>登录</Button> 或 
            <Button onClick={() => navigate('/register')}>注册</Button> 以访问更多功能
          </Alert>
        )}

        {isAuthenticated && (
          <Alert severity="success" sx={{ mt: 2 }}>
            欢迎回来，{user?.username}！
          </Alert>
        )}
      </Box>

      {/* 统计数据 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CloudDownload fontSize="large" />}
            title="种子数量"
            value={stats.totalTorrents}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<People fontSize="large" />}
            title="注册用户"
            value={stats.totalUsers}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CloudUpload fontSize="large" />}
            title="总上传量"
            value={stats.totalUploaded}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CloudDownload fontSize="large" />}
            title="总下载量"
            value={stats.totalDownloaded}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* 站点公告 - 使用新的公告组件 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          📢 站点公告
        </Typography>
        <AnnouncementsList limit={3} />
      </Box>

      <Grid container spacing={3}>
        {/* 最新种子 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                最新种子
              </Typography>
              {loading ? (
                <Typography>加载中...</Typography>
              ) : recentTorrents.length > 0 ? (
                <List dense>
                  {recentTorrents.map((torrent, index) => (
                    <React.Fragment key={torrent.id}>
                      <ListItem
                        button
                        onClick={() => navigate(`/torrents/${torrent.id}`)}
                        sx={{ py: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500 }}>
                              {torrent.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {torrent.uploader?.username} | {apiUtils.formatFileSize(torrent.size)} | {apiUtils.formatDate(torrent.created_at)}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Chip 
                                  label={`🟢 ${torrent.real_time_stats?.seeders || torrent.seeders || 0}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                                <Chip 
                                  label={`🔴 ${torrent.real_time_stats?.leechers || torrent.leechers || 0}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentTorrents.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  暂无种子数据
                </Typography>
              )}
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/torrents')}
                >
                  查看全部种子
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 分类和快捷操作 */}
        <Grid item xs={12} md={4}>
          {/* 分类列表 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
                分类浏览
              </Typography>
              <Grid container spacing={1}>
                {categories.map((category) => (
                  <Grid item key={category.id}>
                    <Chip
                      label={`${category.icon || '📁'} ${category.name}`}
                      variant="outlined"
                      clickable
                      onClick={() => navigate(`/torrents?category=${category.id}`)}
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          {isAuthenticated && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  快捷操作
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => navigate('/upload')}
                    fullWidth
                  >
                    上传种子
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/profile')}
                    fullWidth
                  >
                    个人中心
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/stats')}
                    fullWidth
                  >
                    统计信息
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;

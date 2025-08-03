import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Container,
  Chip,
  Button,
  Divider
} from '@mui/material';
import {
  EmojiEvents,
  CloudUpload,
  CloudDownload,
  Share,
  Stars,
  Timer,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import api from '../services/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState('uploaded');
  const [limit, setLimit] = useState(50);

  const leaderboardTypes = [
    { key: 'uploaded', name: '上传排行', icon: <CloudUpload /> },
    { key: 'downloaded', name: '下载排行', icon: <CloudDownload /> },
    { key: 'ratio', name: '分享率排行', icon: <Share /> },
    { key: 'bonus_points', name: '积分排行', icon: <Stars /> },
    { key: 'seedtime', name: '做种时间排行', icon: <Timer /> }
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [activeType, limit]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`获取排行榜数据: type=${activeType}, limit=${limit}`);
      
      // 尝试调用真实的排行榜API
      const response = await api.get(`/stats/leaderboard?type=${activeType}&limit=${limit}`);
      
      console.log('排行榜API响应:', response.data);
      
      if (response.data && response.data.leaderboard) {
        setLeaderboard(response.data.leaderboard);
      } else {
        throw new Error('无效的API响应格式');
      }
      
    } catch (error) {
      console.error('获取排行榜失败:', error);
      
      // 如果API失败，显示模拟数据以便测试
      console.log('使用模拟数据');
      const mockData = [
        {
          rank: 1,
          user: {
            id: 1,
            username: '演示用户1',
            role: 'user'
          },
          stats: {
            uploaded: 1024 * 1024 * 1024 * 5, // 5GB
            downloaded: 1024 * 1024 * 1024 * 2, // 2GB
            ratio: 2.5,
            bonus_points: 1250,
            seedtime: 86400 * 7 // 7天
          }
        },
        {
          rank: 2,
          user: {
            id: 2,
            username: '演示用户2',
            role: 'user'
          },
          stats: {
            uploaded: 1024 * 1024 * 1024 * 3, // 3GB
            downloaded: 1024 * 1024 * 1024 * 1, // 1GB
            ratio: 3.0,
            bonus_points: 890,
            seedtime: 86400 * 5 // 5天
          }
        },
        {
          rank: 3,
          user: {
            id: 3,
            username: '演示用户3',
            role: 'admin'
          },
          stats: {
            uploaded: 1024 * 1024 * 1024 * 2, // 2GB
            downloaded: 1024 * 1024 * 1024 * 1, // 1GB
            ratio: 2.0,
            bonus_points: 650,
            seedtime: 86400 * 3 // 3天
          }
        }
      ];
      
      setLeaderboard(mockData);
      setError(`API连接失败，显示演示数据: ${error.message}`);
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

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0 小时';
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) {
      return `${days}天 ${hours % 24}小时`;
    }
    return `${hours}小时`;
  };

  const formatValue = (stats, type) => {
    if (!stats) return 'N/A';
    
    switch (type) {
      case 'uploaded':
        return formatSize(stats.uploaded || 0);
      case 'downloaded':
        return formatSize(stats.downloaded || 0);
      case 'ratio':
        const ratio = parseFloat(stats.ratio);
        if (isNaN(ratio) || ratio === 0) {
          return stats.uploaded > 0 ? '∞' : '0.00';
        }
        return ratio.toFixed(2);
      case 'seedtime':
        return formatTime(stats.seedtime || 0);
      case 'bonus_points':
        const bonusPoints = parseFloat(stats.bonus_points);
        return isNaN(bonusPoints) ? '0' : Math.floor(bonusPoints).toString();
      default:
        return 'N/A';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <EmojiEvents sx={{ color: '#FFD700' }} />;
      case 2:
        return <EmojiEvents sx={{ color: '#C0C0C0' }} />;
      case 3:
        return <EmojiEvents sx={{ color: '#CD7F32' }} />;
      default:
        return null;
    }
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
            <Button variant="contained" onClick={fetchLeaderboard}>
              重试
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          用户排行榜
        </Typography>

        {/* 排行榜类型选择 */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeType}
            onChange={(e, newValue) => setActiveType(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {leaderboardTypes.map((type) => (
              <Tab
                key={type.key}
                value={type.key}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {type.icon}
                    {type.name}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* 显示数量选择 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            显示数量:
          </Typography>
          <FormControl size="small">
            <Select
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 排行榜列表 */}
        {leaderboard.length === 0 ? (
          <Card>
            <CardContent>
              <Typography align="center" color="text.secondary">
                暂无排行榜数据
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <List>
              {leaderboard.map((item, index) => {
                const user = item.user || item; // 支持两种数据格式
                const stats = item.stats || item; // 支持两种数据格式
                
                return (
                  <React.Fragment key={user.id || user.user_id}>
                    <ListItem>
                      <ListItemIcon>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: index < 3 ? 'primary.main' : 'grey.300',
                            color: index < 3 ? 'white' : 'text.primary',
                            fontSize: '1.1rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {getRankIcon(index + 1) || (index + 1)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h6" component="span">
                              {user.username}
                            </Typography>
                            <Chip
                              label={user.role === 'admin' ? '管理员' : '用户'}
                              size="small"
                              color={user.role === 'admin' ? 'error' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Typography variant="body1" color="primary" fontWeight="bold">
                              {formatValue(stats, activeType)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activeType === 'uploaded' && `下载: ${formatSize(stats.downloaded || 0)} | 分享率: ${stats.ratio ? parseFloat(stats.ratio).toFixed(2) : '∞'}`}
                              {activeType === 'downloaded' && `上传: ${formatSize(stats.uploaded || 0)} | 分享率: ${stats.ratio ? parseFloat(stats.ratio).toFixed(2) : '∞'}`}
                              {activeType === 'ratio' && `上传: ${formatSize(stats.uploaded || 0)} | 下载: ${formatSize(stats.downloaded || 0)}`}
                              {activeType === 'bonus_points' && `分享率: ${stats.ratio ? parseFloat(stats.ratio).toFixed(2) : '∞'} | 做种时间: ${formatTime(stats.seedtime || 0)}`}
                              {activeType === 'seedtime' && `积分: ${isNaN(parseFloat(stats.bonus_points)) ? '0' : Math.floor(parseFloat(stats.bonus_points))} | 分享率: ${stats.ratio ? parseFloat(stats.ratio).toFixed(2) : '∞'}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < leaderboard.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Card>
        )}

        {/* 刷新按钮 */}
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            variant="outlined"
            onClick={fetchLeaderboard}
            startIcon={<Refresh />}
          >
            刷新排行榜
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Leaderboard;

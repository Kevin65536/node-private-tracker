import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  Share,
  Stars,
  Timer,
  Folder,
  TrendingUp,
  Assessment,
} from '@mui/icons-material';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-stats-tabpanel-${index}`}
      aria-labelledby={`user-stats-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserStats = ({ userId, isCurrentUser = false }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/stats/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.error || '获取统计信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatRatio = (ratio) => {
    if (ratio === Infinity) return '∞';
    return ratio.toFixed(3);
  };

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}天 ${hours}小时`;
    if (hours > 0) return `${hours}小时 ${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const getRatioColor = (ratio) => {
    if (ratio >= 2) return 'success';
    if (ratio >= 1) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        无统计数据
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isCurrentUser ? '我的统计' : `${stats.user.username} 的统计`}
      </Typography>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 2 }}
      >
        <Tab label="概览" icon={<Assessment />} iconPosition="start" />
        <Tab label="种子" icon={<Folder />} iconPosition="start" />
        <Tab label="活动" icon={<TrendingUp />} iconPosition="start" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CloudUpload color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    上传量
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {formatBytes(stats.stats.uploaded)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CloudDownload color="secondary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    下载量
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {formatBytes(stats.stats.downloaded)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Share color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    分享率
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                    {formatRatio(stats.stats.ratio)}
                  </Typography>
                  <Chip 
                    label={stats.stats.ratio >= 1 ? '优秀' : '需改善'} 
                    color={getRatioColor(stats.stats.ratio)}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Stars color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    积分
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stats.stats.bonus_points}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Timer color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    做种时间
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {formatTime(stats.stats.seedtime)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Timer color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" gutterBottom>
                    下载时间
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {formatTime(stats.stats.leechtime)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  上传的种子
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="总数" 
                      secondary={stats.stats.torrents?.total || 0} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="已审核" 
                      secondary={stats.stats.torrents?.approved || 0} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="待审核" 
                      secondary={stats.stats.torrents?.pending || 0} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="总大小" 
                      secondary={formatBytes(stats.stats.torrents?.total_size || 0)} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  下载状态
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="总数" 
                      secondary={stats.stats.downloads?.total || 0} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="正在做种" 
                      secondary={stats.stats.downloads?.seeding || 0} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="正在下载" 
                      secondary={stats.stats.downloads?.downloading || 0} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="已完成" 
                      secondary={stats.stats.downloads?.completed || 0} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最近30天活动
            </Typography>
            {stats.stats.recent_activity && stats.stats.recent_activity.length > 0 ? (
              <List>
                {stats.stats.recent_activity.map((day, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={new Date(day.date).toLocaleDateString()}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              公告: {day.announces} | 
                              上传: {formatBytes(day.daily_uploaded || 0)} | 
                              下载: {formatBytes(day.daily_downloaded || 0)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < stats.stats.recent_activity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                最近30天无活动记录
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default UserStats;

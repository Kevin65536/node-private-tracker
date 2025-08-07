import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Person,
  Email,
  Schedule,
  CloudUpload,
  CloudDownload,
  Share,
  Stars,
  Timeline,
  Assessment,
  History,
  Refresh,
  TrendingUp,
  Storage,
  PhotoCamera,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { getApiBaseUrl } from '../utils/networkConfig';
import CustomAvatar from '../components/CustomAvatar';

const UserProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [recentTorrents, setRecentTorrents] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // 头像上传相关状态
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行获取用户信息、统计数据和最近活动
      const [profileResponse, statsResponse] = await Promise.all([
        api.get('/users/profile'),
        api.get('/users/stats')
      ]);

      setUserProfile(profileResponse.data.user);
      setUserStats(statsResponse.data.stats);

      // 尝试获取最近的种子活动
      try {
        const torrentsResponse = await api.get('/torrents?limit=5&uploader=' + user.id);
        setRecentTorrents(torrentsResponse.data.torrents || []);
      } catch (torrentsError) {
        console.log('获取最近种子活动失败:', torrentsError);
        setRecentTorrents([]);
      }

    } catch (error) {
      console.error('获取用户资料失败:', error);
      setError(error.response?.data?.error || '获取用户资料失败');
      
      // 显示模拟数据以便测试
      setUserProfile({
        username: user?.username || '演示用户',
        email: user?.email || 'demo@example.com',
        role: user?.role || 'user',
        status: 'active',
        created_at: user?.created_at || new Date().toISOString(),
        last_login: new Date().toISOString()
      });
      
      setUserStats({
        uploaded: 1024 * 1024 * 1024 * 5, // 5GB
        downloaded: 1024 * 1024 * 1024 * 2, // 2GB
        ratio: 2.5,
        bonus_points: 1250,
        torrents_uploaded: 8,
        downloads: 15,
        last_active: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'moderator': return 'warning';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'moderator': return '版主';
      default: return '用户';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'banned': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return '正常';
      case 'inactive': return '停用';
      case 'banned': return '封禁';
      default: return '未知';
    }
  };

  const calculateRatio = (uploaded, downloaded) => {
    if (!downloaded || downloaded === 0) {
      return uploaded > 0 ? '∞' : '0.00';
    }
    return (uploaded / downloaded).toFixed(2);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 获取头像URL
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    
    // 使用与API相同的基础URL配置
    const apiBaseUrl = getApiBaseUrl();
    const serverBaseUrl = apiBaseUrl.replace('/api', '');
    // 添加时间戳避免缓存问题
    const avatarUrl = `${serverBaseUrl}/uploads/avatars/${avatar}?t=${Date.now()}`;
    
    // 添加调试日志
    console.log('构建头像URL:', {
      avatar,
      apiBaseUrl,
      serverBaseUrl,
      avatarUrl
    });
    
    return avatarUrl;
  };

  // 打开头像上传对话框
  const handleAvatarDialogOpen = () => {
    setAvatarDialogOpen(true);
    setAvatarPreview(null);
  };

  // 关闭头像上传对话框
  const handleAvatarDialogClose = () => {
    setAvatarDialogOpen(false);
    setAvatarPreview(null);
  };

  // 处理文件选择
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setSnackbarMessage('请选择图片文件');
        setSnackbarOpen(true);
        return;
      }

      // 验证文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setSnackbarMessage('文件大小不能超过5MB');
        setSnackbarOpen(true);
        return;
      }

      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 上传头像
  const handleAvatarUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      setSnackbarMessage('请选择要上传的文件');
      setSnackbarOpen(true);
      return;
    }

    try {
      setAvatarUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 更新用户资料
      setUserProfile(prev => ({
        ...prev,
        avatar: response.data.avatar
      }));

      // 更新AuthContext中的用户信息
      updateUser({
        ...user,
        avatar: response.data.avatar
      });

      setSnackbarMessage('头像上传成功');
      setSnackbarOpen(true);
      handleAvatarDialogClose();
      
    } catch (error) {
      console.error('头像上传失败:', error);
      setSnackbarMessage(error.response?.data?.error || '头像上传失败');
      setSnackbarOpen(true);
    } finally {
      setAvatarUploading(false);
    }
  };

  // 删除头像
  const handleAvatarDelete = async () => {
    if (!window.confirm('确定要删除头像吗？')) {
      return;
    }

    try {
      await api.delete('/users/avatar');
      
      // 更新用户资料
      setUserProfile(prev => ({
        ...prev,
        avatar: null
      }));

      // 更新AuthContext中的用户信息
      updateUser({
        ...user,
        avatar: null
      });

      setSnackbarMessage('头像删除成功');
      setSnackbarOpen(true);
      
    } catch (error) {
      console.error('头像删除失败:', error);
      setSnackbarMessage(error.response?.data?.error || '头像删除失败');
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 用户基本信息卡片 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box position="relative" sx={{ mb: 2 }}>
                  <CustomAvatar 
                    sx={{ width: 120, height: 120, fontSize: '3rem' }}
                    src={userProfile?.avatar ? getAvatarUrl(userProfile.avatar) : undefined}
                  >
                    {userProfile?.username?.charAt(0).toUpperCase()}
                  </CustomAvatar>
                  
                  {/* 头像编辑按钮 */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      gap: 0.5
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                      onClick={handleAvatarDialogOpen}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    {userProfile?.avatar && (
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                        onClick={handleAvatarDelete}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                
                <Typography variant="h5" gutterBottom>
                  {userProfile?.username}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
                  <Chip
                    label={getRoleLabel(userProfile?.role)}
                    color={getRoleColor(userProfile?.role)}
                    size="small"
                  />
                  <Chip
                    label={getStatusLabel(userProfile?.status)}
                    color={getStatusColor(userProfile?.status)}
                    size="small"
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        邮箱地址
                      </Typography>
                      <Typography variant="body1">
                        {userProfile?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        注册时间
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(userProfile?.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <History sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        最后登录
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(userProfile?.last_login)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Timeline sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        最后活动
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(userStats?.last_active)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 统计信息区域 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 上传统计 */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CloudUpload color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    总上传量
                  </Typography>
                  <Typography variant="h6">
                    {formatFileSize(userStats?.uploaded)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 下载统计 */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CloudDownload color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    总下载量
                  </Typography>
                  <Typography variant="h6">
                    {formatFileSize(userStats?.downloaded)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 分享率 */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Share color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    分享率
                  </Typography>
                  <Typography variant="h6">
                    {calculateRatio(userStats?.uploaded, userStats?.downloaded)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 积分 */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Stars color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    积分余额
                  </Typography>
                  <Typography variant="h6">
                    {Math.floor(userStats?.bonus_points || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 详细统计信息 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1 }} />
              详细统计
            </Typography>
            <IconButton onClick={fetchUserProfile} size="small">
              <Refresh />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText
                    primary="上传种子数"
                    secondary={userStats?.torrents_uploaded || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Storage />
                  </ListItemIcon>
                  <ListItemText
                    primary="下载记录数"
                    secondary={userStats?.downloads || 0}
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              {/* 分享率进度条 */}
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  分享率健康度
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((userStats?.ratio || 0) * 50, 100)}
                  color={userStats?.ratio >= 1 ? 'success' : userStats?.ratio >= 0.5 ? 'warning' : 'error'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {userStats?.ratio >= 1 ? '健康' : userStats?.ratio >= 0.5 ? '一般' : '需要改善'}
                </Typography>
              </Box>

              {/* 积分等级 */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  用户等级
                </Typography>
                <Chip
                  label={userStats?.bonus_points >= 1000 ? '高级用户' : userStats?.bonus_points >= 500 ? '中级用户' : '新手用户'}
                  color={userStats?.bonus_points >= 1000 ? 'success' : userStats?.bonus_points >= 500 ? 'warning' : 'default'}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 最近活动标签页 */}
      {recentTorrents.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <History sx={{ mr: 1 }} />
              最近活动
            </Typography>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="最近上传" />
            </Tabs>

            {activeTab === 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>种子名称</TableCell>
                      <TableCell>大小</TableCell>
                      <TableCell>上传时间</TableCell>
                      <TableCell>状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTorrents.map((torrent) => (
                      <TableRow key={torrent.id}>
                        <TableCell>{torrent.name}</TableCell>
                        <TableCell>{formatFileSize(torrent.size)}</TableCell>
                        <TableCell>{formatDate(torrent.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            label={torrent.status === 'approved' ? '已审核' : '审核中'}
                            color={torrent.status === 'approved' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {recentTorrents.length === 0 && (
              <Typography color="text.secondary" align="center" py={2}>
                暂无最近活动记录
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* 头像上传对话框 */}
      <Dialog open={avatarDialogOpen} onClose={handleAvatarDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>更换头像</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {/* 当前头像预览 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                当前头像
              </Typography>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                src={userProfile?.avatar ? getAvatarUrl(userProfile.avatar) : undefined}
                imgProps={{
                  crossOrigin: 'anonymous'
                }}
              >
                {!userProfile?.avatar && userProfile?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </Box>

            {/* 新头像预览 */}
            {avatarPreview && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  新头像预览
                </Typography>
                <Avatar
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                  src={avatarPreview}
                />
              </Box>
            )}

            {/* 文件选择 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 2 }}
            >
              选择图片
            </Button>

            <Typography variant="body2" color="text.secondary">
              支持 JPG、PNG、GIF 格式，文件大小不超过 5MB
            </Typography>
            
            {/* 调试信息 */}
            {userProfile?.avatar && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" display="block">
                  调试信息:
                </Typography>
                <Typography variant="caption" display="block">
                  头像文件名: {userProfile.avatar}
                </Typography>
                <Typography variant="caption" display="block">
                  构建的URL: {getAvatarUrl(userProfile.avatar)}
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => window.open(getAvatarUrl(userProfile.avatar), '_blank')}
                  sx={{ mt: 1 }}
                >
                  在新窗口中测试图片
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAvatarDialogClose}>取消</Button>
          <Button
            onClick={handleAvatarUpload}
            variant="contained"
            disabled={!avatarPreview || avatarUploading}
          >
            {avatarUploading ? <CircularProgress size={20} /> : '上传'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default UserProfilePage;

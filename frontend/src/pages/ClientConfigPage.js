import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ContentCopy,
  Refresh,
  Download,
  Settings,
  Code,
  Computer,
  Security
} from '@mui/icons-material';
import { authService } from '../services/authService';
import api from '../services/api';

const ClientConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [passkeyData, setPasskeyData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [tools, setTools] = useState([]);
  const [showPasskey, setShowPasskey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行获取所有数据
      const [profileResponse, passkeyResponse, toolsResponse] = await Promise.all([
        authService.getUserProfile(),
        authService.getUserPasskey(),
        api.get('/tools/list')
      ]);

      setUserProfile(profileResponse.data.user);
      setPasskeyData(passkeyResponse.data);
      setTools(toolsResponse.data.tools);
    } catch (error) {
      console.error('获取数据失败:', error);
      setError('获取数据失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePasskey = async () => {
    if (!window.confirm('确定要重新生成 Passkey 吗？重新生成后需要更新所有 BT 客户端配置。')) {
      return;
    }

    try {
      setRegenerating(true);
      setError(null);
      
      const response = await authService.regeneratePasskey();
      setPasskeyData(response.data);
      showSnackbar('Passkey 重新生成成功！', 'success');
    } catch (error) {
      console.error('重新生成 Passkey 失败:', error);
      setError('重新生成 Passkey 失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar(`${label} 已复制到剪贴板`, 'success');
    } catch (err) {
      showSnackbar('复制失败，请手动选择并复制', 'error');
    }
  };

  const downloadTool = async (toolName) => {
    try {
      const response = await api.get(`/tools/ip-management/${toolName}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', toolName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar(`${toolName} 下载成功`, 'success');
    } catch (error) {
      console.error('下载失败:', error);
      showSnackbar('下载失败: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
      <Typography variant="h4" gutterBottom sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Settings sx={{ mr: 2 }} />
        客户端配置
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 基本信息 */}
        {userProfile && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Security sx={{ mr: 1 }} />
                  基本信息
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">用户名</Typography>
                    <Typography variant="body1">{userProfile.username}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">邮箱</Typography>
                    <Typography variant="body1">{userProfile.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">角色</Typography>
                    <Chip 
                      label={userProfile.role === 'admin' ? '管理员' : '用户'} 
                      color={userProfile.role === 'admin' ? 'error' : 'primary'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">状态</Typography>
                    <Chip 
                      label={userProfile.status === 'active' ? '正常' : userProfile.status} 
                      color="success"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Passkey 管理 */}
        {passkeyData && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Code sx={{ mr: 1 }} />
                  Passkey 管理
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  制作和下载种子时使用的个人密钥，请妥善保管。
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Your Passkey"
                    fullWidth
                    type={showPasskey ? "text" : "password"}
                    value={passkeyData.passkey}
                    InputProps={{
                      readOnly: true,
                      style: { fontFamily: 'monospace' },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPasskey(!showPasskey)} edge="end">
                            {showPasskey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                          <IconButton 
                            onClick={() => copyToClipboard(passkeyData.passkey, 'Passkey')} 
                            edge="end"
                          >
                            <ContentCopy />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Tracker Announce URL"
                    fullWidth
                    value={passkeyData.announce_url}
                    InputProps={{
                      readOnly: true,
                      style: { fontFamily: 'monospace', fontSize: '0.875rem' },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={() => copyToClipboard(passkeyData.announce_url, 'Tracker URL')} 
                            edge="end"
                          >
                            <ContentCopy />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleRegeneratePasskey}
                  disabled={regenerating}
                  startIcon={regenerating ? <CircularProgress size={16} /> : <Refresh />}
                  fullWidth
                >
                  {regenerating ? '重新生成中...' : '重新生成 Passkey'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 客户端工具下载 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Computer sx={{ mr: 1 }} />
                客户端启动器
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                下载一键启动器，无需任何配置即可自动连接到PT站。
              </Typography>

              <List disablePadding>
                {tools.map((tool, index) => (
                  <React.Fragment key={tool.name}>
                    <ListItem
                      sx={{ 
                        px: 0, 
                        py: 2,
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' }
                      }}
                    >
                      <ListItemIcon>
                        <Download color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={tool.title}
                        secondary={tool.description}
                        sx={{ mr: { sm: 2 }, mb: { xs: 1, sm: 0 } }}
                      />
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => downloadTool(tool.name)}
                        startIcon={<Download />}
                        sx={{ minWidth: 140 }}
                      >
                        立即下载
                      </Button>
                    </ListItem>
                    {index < tools.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {tools.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                  暂无可用工具
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 使用说明 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📖 使用说明
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Passkey 配置</Typography>
                  <Typography variant="body2" color="text.secondary">
                    • 在制作种子时，将 Tracker URL 添加到种子文件<br/>
                    • 确保勾选"私有种子"选项<br/>
                    • 不要与他人分享您的 Passkey
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>客户端启动器</Typography>
                  <Typography variant="body2" color="text.secondary">
                    • 下载后直接双击运行，无需任何配置<br/>
                    • 自动获取最新的服务器IP地址，绕过CDN缓存<br/>
                    • 以管理员身份运行可自动更新hosts文件<br/>
                    • 支持一键打开各种服务入口
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>
                    🚀 启动器功能
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • 自动检测管理员权限<br/>
                    • 智能绕过GitHub CDN缓存<br/>
                    • 一键刷新服务器信息<br/>
                    • 便捷的浏览器快捷方式
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: 'warning.main' }}>
                    ⚠️ 注意事项
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • 首次运行建议右键"以管理员身份运行"<br/>
                    • 如果无法自动更新hosts，请手动配置<br/>
                    • 启动器会自动获取最新IP，无需手动更新
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClientConfigPage;

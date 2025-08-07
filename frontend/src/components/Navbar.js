import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp,
  CloudUpload,
  Settings,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../utils/networkConfig';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return '管理员';
      default:
        return '用户';
    }
  };

  // 获取头像URL
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    
    const apiBaseUrl = getApiBaseUrl();
    const serverBaseUrl = apiBaseUrl.replace('/api', '');
    return `${serverBaseUrl}/uploads/avatars/${avatar}?t=${Date.now()}`;
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#1976d2' }}>
      <Toolbar>
        {/* Logo和站点标题 */}
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          🎓 LZU PT站
        </Typography>

        {/* 导航链接 */}
        <Box sx={{ flexGrow: 1, ml: 4, display: { xs: 'none', md: 'flex' } }}>
          <Button color="inherit" onClick={() => navigate('/')}>
            首页
          </Button>
          <Button color="inherit" onClick={() => navigate('/torrents')}>
            种子列表
          </Button>
          {isAuthenticated && (
            <>
              <Button color="inherit" onClick={() => navigate('/upload')}>
                上传种子
              </Button>
              <Button color="inherit" onClick={() => navigate('/stats')}>
                统计信息
              </Button>
            </>
          )}
        </Box>

        {/* 用户菜单 */}
        <Box sx={{ flexGrow: 0 }}>
          {isAuthenticated ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={getRoleLabel(user?.role)}
                  color={getRoleColor(user?.role)}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <IconButton
                  size="large"
                  aria-label="user menu"
                  aria-controls="user-menu"
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  color="inherit"
                >
                  <Avatar 
                    sx={{ width: 32, height: 32 }}
                    src={user?.avatar ? getAvatarUrl(user.avatar) : undefined}
                    imgProps={{
                      crossOrigin: 'anonymous',
                      onError: (e) => {
                        console.error('导航栏头像加载失败:', e.target.src);
                      }
                    }}
                  >
                    {!user?.avatar && user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Box>
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2">
                    {user?.username}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                  <AccountCircle sx={{ mr: 1 }} />
                  个人资料
                </MenuItem>
                <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
                  <Settings sx={{ mr: 1 }} />
                  用户设置
                </MenuItem>
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <MenuItem onClick={() => { navigate('/admin'); handleMenuClose(); }}>
                    <Settings sx={{ mr: 1 }} />
                    管理后台
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} />
                  退出登录
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box>
              <Button color="inherit" onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                注册
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

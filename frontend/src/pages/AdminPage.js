import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  Reviews,
  People,
  Settings,
  BarChart,
  Security,
  CloudUpload,
  Download,
  Category,
  NetworkCheck,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from '../components/UserManagement';
import TorrentManagement from '../components/TorrentManagement';
import PeerMonitoring from '../components/PeerMonitoring';
import AnnounceStats from '../components/AnnounceStats';
import SecurityManagement from '../components/SecurityManagement';
import api from '../services/api';
import { formatNumber } from '../utils/formatters';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState('overview');
  const [stats, setStats] = useState({
    pendingTorrents: 0,
    activeUsers: 0,
    totalTorrents: 0,
  });
  const [loading, setLoading] = useState(true);

  // 获取管理后台统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats');
        const statsData = response.data;
        
        setStats({
          pendingTorrents: statsData.stats.pending_torrents || 0,
          activeUsers: statsData.stats.total_users || 0, // 使用总用户数
          totalTorrents: statsData.stats.approved_torrents || 0,
        });
      } catch (error) {
        console.error('获取管理后台统计数据失败:', error);
        // 使用默认值
        setStats({
          pendingTorrents: 0,
          activeUsers: 0,
          totalTorrents: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  // 权限检查
  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            访问被拒绝
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            您没有权限访问管理后台
          </Typography>
        </Paper>
      </Container>
    );
  }

  // 根据用户角色过滤菜单项
  const getMenuItems = () => {
    const allMenuItems = [
      { id: 'overview', label: '概览', icon: <BarChart /> },
      { id: 'torrent-review', label: '种子管理', icon: <Reviews /> },
      { id: 'user-management', label: '用户管理', icon: <People /> },
      { id: 'peer-monitoring', label: 'Peer监控', icon: <NetworkCheck /> },
      { id: 'announce-stats', label: '通告统计', icon: <BarChart /> },
      { id: 'system-settings', label: '系统设置', icon: <Settings /> },
      { id: 'security', label: '安全管理', icon: <Security /> },
    ];

    // 管理员可以访问所有功能
    return allMenuItems;
  };

  const menuItems = getMenuItems();

  const getQuickActions = () => {
    const allQuickActions = [
      {
        title: '种子管理',
        description: '审核、管理和监控种子文件',
        icon: <Reviews />,
        action: () => setSelectedSection('torrent-review'),
        color: 'primary',
      },
      {
        title: '用户管理',
        description: '管理用户账户和权限',
        icon: <People />,
        action: () => setSelectedSection('user-management'),
        color: 'secondary',
      },
      {
        title: '通告统计',
        description: '查看系统监控和统计数据',
        icon: <BarChart />,
        action: () => setSelectedSection('announce-stats'),
        color: 'info',
      },
      {
        title: '系统设置',
        description: '配置系统参数',
        icon: <Settings />,
        action: () => setSelectedSection('system-settings'),
        color: 'warning',
      },
    ];

    return allQuickActions;
  };

  const quickActions = getQuickActions();

  const renderOverview = () => (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        管理后台概览
      </Typography>
      
      {/* 管理员的快捷操作卡片 */}
      {quickActions.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}
                onClick={action.action}
              >
                <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                  <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                    {React.cloneElement(action.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                  <Button size="small" color={action.color}>
                    进入管理
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          系统状态
        </Typography>
        {loading ? (
          <Typography>加载中...</Typography>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    待审核种子
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.pendingTorrents)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    总用户数
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.activeUsers)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    总种子数
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.totalTorrents)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );

  const renderContent = () => {
    switch (selectedSection) {
      case 'overview':
        return renderOverview();
      case 'torrent-review':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
              种子管理
            </Typography>
            <TorrentManagement />
          </Box>
        );
      case 'user-management':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
              用户管理
            </Typography>
            <UserManagement />
          </Box>
        );
      case 'peer-monitoring':
        return (
          <Box>
            <PeerMonitoring />
          </Box>
        );
      case 'announce-stats':
        return (
          <Box>
            <AnnounceStats />
          </Box>
        );
      case 'system-settings':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
              系统设置
            </Typography>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                系统设置功能正在开发中...
              </Typography>
            </Paper>
          </Box>
        );
      case 'security':
        return (
          <Box>
            <SecurityManagement />
          </Box>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        管理后台
      </Typography>
      
      <Grid container spacing={3}>
        {/* 侧边栏菜单 */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              管理菜单
            </Typography>
            <List>
              {menuItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItemButton
                    selected={selectedSection === item.id}
                    onClick={() => setSelectedSection(item.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                  {index < menuItems.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 主内容区域 */}
        <Grid item xs={12} md={9}>
          {renderContent()}
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminPage;

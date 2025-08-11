import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit,
  Block,
  CheckCircle,
  Person,
  AdminPanelSettings,
  Search,
  Refresh,
} from '@mui/icons-material';
import { userAPI } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 获取用户列表
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userAPI.getUsers({
        page,
        limit: pagination.per_page,
        search: searchTerm,
      });
      
      console.log('Users data received:', response.data);
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || {
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        per_page: 20,
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setError(error.response?.data?.error || '获取用户列表失败，请稍后重试');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 状态标签颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'banned':
        return 'error';
      default:
        return 'default';
    }
  };

  // 状态标签文本
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '正常';
      case 'inactive':
        return '停用';
      case 'banned':
        return '封禁';
      default:
        return '未知';
    }
  };

  // 角色标签
  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'user':
        return '用户';
      default:
        return '未知';
    }
  };

  // 安全的数字格式化
  const safeNumberFormat = (value, decimals = 2) => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
  };

  // 格式化文件大小 - 使用更安全的实现
  const formatFileSize = (bytes) => {
    // 统一转换为数字类型
    const numBytes = parseInt(bytes) || 0;
    if (numBytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(1024));
    return `${(numBytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 格式化比率
  const formatRatio = (uploaded, downloaded) => {
    const up = Number(uploaded) || 0;
    const down = Number(downloaded) || 0;
    if (down === 0) {
      return up > 0 ? '∞' : '0.00';
    }
    return (up / down).toFixed(2);
  };

  // 打开编辑对话框
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setEditDialogOpen(true);
  };

  // 更新用户状态
  const handleUpdateStatus = async () => {
    try {
      setError('');
      
      await userAPI.updateUserStatus(selectedUser.id, newStatus);
      
      setSuccess('用户状态更新成功');
      setEditDialogOpen(false);
      setSelectedUser(null);
      
      // 刷新用户列表
      fetchUsers(pagination.current_page);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      setError(error.response?.data?.error || '更新用户状态失败');
    }
  };

  // 分页处理
  const handlePageChange = (event, newPage) => {
    fetchUsers(newPage + 1);
  };

  // 搜索处理
  const handleSearch = () => {
    fetchUsers(1);
  };

  // 刷新列表
  const handleRefresh = () => {
    setSearchTerm('');
    fetchUsers(1);
  };

  // 统计信息
  const getStats = () => {
    if (!Array.isArray(users) || users.length === 0) {
      return { activeUsers: 0, bannedUsers: 0, adminUsers: 0 };
    }
    
    const activeUsers = users.filter(user => user.status === 'active').length;
    const bannedUsers = users.filter(user => user.status === 'banned').length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    
    return { activeUsers, bannedUsers, adminUsers };
  };

  const stats = getStats();

  return (
    <Box>
      {/* 错误和成功提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    总用户数
                  </Typography>
                  <Typography variant="h5">
                    {pagination.total_count}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    正常用户
                  </Typography>
                  <Typography variant="h5">
                    {stats.activeUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Block color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    封禁用户
                  </Typography>
                  <Typography variant="h5">
                    {stats.bannedUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminPanelSettings color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    管理员
                  </Typography>
                  <Typography variant="h5">
                    {stats.adminUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 操作栏 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="搜索用户"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
        </Box>
      </Paper>

      {/* 用户表格 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>用户名</TableCell>
              <TableCell>邮箱</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>上传量</TableCell>
              <TableCell>下载量</TableCell>
              <TableCell>比率</TableCell>
              <TableCell>积分</TableCell>
              <TableCell>注册时间</TableCell>
              <TableCell>最后登录</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  暂无用户数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id || Math.random()} hover>
                  <TableCell>{user.id || 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {user.username || 'N/A'}
                      {user.role === 'admin' && (
                        <AdminPanelSettings color="warning" sx={{ ml: 1, fontSize: 16 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleText(user.role)}
                      color={user.role === 'admin' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(user.status)}
                      color={getStatusColor(user.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.UserStat ? formatFileSize(user.UserStat.uploaded) : '0 B'}
                  </TableCell>
                  <TableCell>
                    {user.UserStat ? formatFileSize(user.UserStat.downloaded) : '0 B'}
                  </TableCell>
                  <TableCell>
                    {user.UserStat 
                      ? formatRatio(user.UserStat.uploaded, user.UserStat.downloaded)
                      : '0.00'
                    }
                  </TableCell>
                  <TableCell>
                    {user.UserStat 
                      ? safeNumberFormat(user.UserStat.bonus_points)
                      : '0.00'
                    }
                  </TableCell>
                  <TableCell>
                    {user.created_at 
                      ? new Date(user.created_at).toLocaleDateString('zh-CN')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString('zh-CN')
                      : '从未登录'
                    }
                  </TableCell>
                  <TableCell>
                    <Tooltip title="编辑用户">
                      <IconButton 
                        onClick={() => handleEditUser(user)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* 分页 */}
        <TablePagination
          component="div"
          count={pagination.total_count}
          page={pagination.current_page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.per_page}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} 共 ${count} 条`
          }
          labelRowsPerPage="每页显示:"
        />
      </TableContainer>

      {/* 编辑用户对话框 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>编辑用户状态</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                用户：{selectedUser.username} ({selectedUser.email})
              </Typography>
              <FormControl fullWidth>
                <InputLabel>状态</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="状态"
                >
                  <MenuItem value="active">正常</MenuItem>
                  <MenuItem value="inactive">停用</MenuItem>
                  <MenuItem value="banned">封禁</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  • 正常：用户可以正常使用所有功能
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 停用：用户无法登录系统
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 封禁：用户被永久禁止使用系统
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={!newStatus || newStatus === selectedUser?.status}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

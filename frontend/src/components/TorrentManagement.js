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
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  Storage as SizeIcon,
  Delete as DeleteIcon,
  Refresh,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TorrentManagement = () => {
  const navigate = useNavigate();
  const [torrents, setTorrents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [globalStats, setGlobalStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20,
  });
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    torrent: null,
    action: null,
    reason: ''
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    torrent: null,
    reason: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 获取种子列表
  const fetchTorrents = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const status = ['pending', 'approved', 'rejected'][currentTab];
      const response = await api.get(`/admin/torrents`, {
        params: {
          status,
          page,
          limit: pagination.items_per_page,
        }
      });
      
      console.log('Torrents data received:', response.data);
      setTorrents(response.data.torrents || []);
      setPagination(response.data.pagination || {
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        items_per_page: 20,
      });
    } catch (error) {
      console.error('获取种子列表失败:', error);
      setError(error.response?.data?.error || '获取种子列表失败，请稍后重试');
      setTorrents([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取全局统计信息
  const fetchGlobalStats = async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        api.get('/admin/torrents', { params: { status: 'pending', page: 1, limit: 1 } }),
        api.get('/admin/torrents', { params: { status: 'approved', page: 1, limit: 1 } }),
        api.get('/admin/torrents', { params: { status: 'rejected', page: 1, limit: 1 } })
      ]);

      setGlobalStats({
        pendingCount: pendingRes.data.pagination?.total_items || 0,
        approvedCount: approvedRes.data.pagination?.total_items || 0,
        rejectedCount: rejectedRes.data.pagination?.total_items || 0
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchTorrents();
  }, [currentTab]);

  // 组件初始化时获取统计信息
  useEffect(() => {
    fetchGlobalStats();
  }, []);

  // 状态标签颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // 状态标签文本
  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '已通过';
      case 'pending': return '待审核';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
    const numBytes = Number(bytes);
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(1024));
    return `${(numBytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return 'Invalid Date';
    }
  };

  // 打开审核对话框
  const handleReview = (torrent, action) => {
    setReviewDialog({
      open: true,
      torrent,
      action,
      reason: ''
    });
  };

  // 确认审核
  const confirmReview = async () => {
    try {
      setError('');
      const { torrent, action, reason } = reviewDialog;
      
      await api.post(`/admin/torrents/${torrent.id}/review`, {
        action,
        reason
      });
      
      setSuccess(`种子${action === 'approve' ? '通过' : '拒绝'}审核成功`);
      setReviewDialog({ open: false, torrent: null, action: null, reason: '' });
      
      // 刷新列表和统计信息
      fetchTorrents(pagination.current_page);
      fetchGlobalStats();
    } catch (error) {
      console.error('审核失败:', error);
      setError(error.response?.data?.error || '审核操作失败');
    }
  };

  // 打开删除对话框
  const handleDelete = (torrent) => {
    setDeleteDialog({
      open: true,
      torrent,
      reason: ''
    });
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      setError('');
      const { torrent, reason } = deleteDialog;
      
      await api.delete(`/admin/torrents/${torrent.id}`, {
        data: { reason }
      });
      
      setSuccess('种子删除成功');
      setDeleteDialog({ open: false, torrent: null, reason: '' });
      
      // 刷新列表和统计信息
      fetchTorrents(pagination.current_page);
      fetchGlobalStats();
    } catch (error) {
      console.error('删除失败:', error);
      setError(error.response?.data?.error || '删除操作失败');
    }
  };

  // 下载种子文件
  const downloadTorrent = async (torrentId, fileName) => {
    try {
      const response = await api.get(`/admin/torrents/${torrentId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}.torrent`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      setError(error.response?.data?.error || '下载失败');
    }
  };

  // 查看详情
  const handleViewDetail = (torrentId) => {
    navigate(`/torrents/${torrentId}`);
  };

  // 分页处理
  const handlePageChange = (event, newPage) => {
    fetchTorrents(newPage + 1);
  };

  // 刷新列表
  const handleRefresh = () => {
    fetchTorrents(1);
    fetchGlobalStats();
  };

  // 标签变更处理
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

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
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    待审核种子
                  </Typography>
                  <Typography variant="h5">
                    {globalStats.pendingCount}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ApproveIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    已通过种子
                  </Typography>
                  <Typography variant="h5">
                    {globalStats.approvedCount}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RejectIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    已拒绝种子
                  </Typography>
                  <Typography variant="h5">
                    {globalStats.rejectedCount}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 操作栏 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
          >
            <Tab label="待审核" />
            <Tab label="已通过" />
            <Tab label="已拒绝" />
          </Tabs>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
        </Box>
      </Paper>

      {/* 种子表格 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>种子名称</TableCell>
              <TableCell>分类</TableCell>
              <TableCell>上传者</TableCell>
              <TableCell>大小</TableCell>
              <TableCell>上传时间</TableCell>
              <TableCell>状态</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : torrents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    暂无{getStatusText(['pending', 'approved', 'rejected'][currentTab])}的种子
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              torrents.map((torrent) => (
                <TableRow key={torrent.id || Math.random()} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {torrent.name || 'N/A'}
                      </Typography>
                      {torrent.description && (
                        <Typography variant="caption" color="text.secondary">
                          {torrent.description.substring(0, 100)}
                          {torrent.description.length > 100 ? '...' : ''}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={torrent.Category?.name || '未分类'} 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">
                        {torrent.uploader?.username || '未知'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SizeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">
                        {formatFileSize(torrent.size)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">
                        {formatDate(torrent.created_at)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(torrent.status)}
                      color={getStatusColor(torrent.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="查看详情">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetail(torrent.id)}
                          color="info"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="下载种子">
                        <IconButton
                          size="small"
                          onClick={() => downloadTorrent(torrent.id, torrent.name)}
                          color="primary"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>

                      {torrent.status === 'pending' && (
                        <>
                          <Tooltip title="通过审核">
                            <IconButton
                              size="small"
                              onClick={() => handleReview(torrent, 'approve')}
                              color="success"
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="拒绝审核">
                            <IconButton
                              size="small"
                              onClick={() => handleReview(torrent, 'reject')}
                              color="error"
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip title="删除种子">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(torrent)}
                          color="error"
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'error.light',
                              color: 'white'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* 分页 */}
        {!loading && (
          <TablePagination
            component="div"
            count={pagination.total_items}
            page={pagination.current_page - 1}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.items_per_page}
            rowsPerPageOptions={[20]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} 共 ${count} 条`
            }
            labelRowsPerPage="每页显示:"
          />
        )}
      </TableContainer>

      {/* 审核对话框 */}
      <Dialog 
        open={reviewDialog.open} 
        onClose={() => setReviewDialog({ ...reviewDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewDialog.action === 'approve' ? '通过审核' : '拒绝审核'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            种子名称: {reviewDialog.torrent?.name}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label={reviewDialog.action === 'approve' ? '审核备注 (可选)' : '拒绝原因'}
            value={reviewDialog.reason}
            onChange={(e) => setReviewDialog({ ...reviewDialog, reason: e.target.value })}
            required={reviewDialog.action === 'reject'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ ...reviewDialog, open: false })}>
            取消
          </Button>
          <Button 
            onClick={confirmReview}
            variant="contained"
            color={reviewDialog.action === 'approve' ? 'success' : 'error'}
            disabled={reviewDialog.action === 'reject' && !reviewDialog.reason.trim()}
          >
            确认{reviewDialog.action === 'approve' ? '通过' : '拒绝'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          删除种子确认
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>警告：</strong>此操作将永久删除种子文件和所有相关数据，无法恢复！
            </Typography>
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            确定要删除以下种子吗？
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
            种子名称: {deleteDialog.torrent?.name}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="删除原因 (必填)"
            value={deleteDialog.reason}
            onChange={(e) => setDeleteDialog({ ...deleteDialog, reason: e.target.value })}
            required
            helperText="请说明删除此种子的原因，此信息将被记录在日志中"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>
            取消
          </Button>
          <Button 
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={!deleteDialog.reason.trim()}
            startIcon={<DeleteIcon />}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TorrentManagement;

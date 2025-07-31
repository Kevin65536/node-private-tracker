import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  Storage as SizeIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AdminReviewPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [torrents, setTorrents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
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

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setError('您没有权限访问此页面');
      return;
    }
    fetchTorrents();
  }, [user, currentTab]);

  const fetchTorrents = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = ['pending', 'approved', 'rejected'][currentTab];
      
      const response = await api.get(`/admin/torrents?status=${status}`);
      
      // 检查第一个种子的时间数据（用于调试）
      if (response.data.torrents.length > 0) {
        const firstTorrent = response.data.torrents[0];
        console.log('种子时间数据检查:', {
          name: firstTorrent.name,
          created_at: firstTorrent.created_at,
          type: typeof firstTorrent.created_at,
          formatted: new Date(firstTorrent.created_at).toLocaleString('zh-CN')
        });
      }
      
      setTorrents(response.data.torrents);
    } catch (error) {
      console.error('获取种子列表失败:', error);
      setError(error.response?.data?.error || '获取种子列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (torrent, action) => {
    setReviewDialog({
      open: true,
      torrent,
      action,
      reason: ''
    });
  };

  const confirmReview = async () => {
    try {
      const { torrent, action, reason } = reviewDialog;
      
      await api.post(`/admin/torrents/${torrent.id}/review`, {
        action,
        reason
      });

      setReviewDialog({ open: false, torrent: null, action: null, reason: '' });
      fetchTorrents();
      
      alert(`种子${action === 'approve' ? '通过' : '拒绝'}审核成功`);
    } catch (error) {
      console.error('审核失败:', error);
      alert(error.response?.data?.error || '审核操作失败');
    }
  };

  const handleDelete = (torrent) => {
    setDeleteDialog({
      open: true,
      torrent,
      reason: ''
    });
  };

  const confirmDelete = async () => {
    try {
      const { torrent, reason } = deleteDialog;
      
      await api.delete(`/admin/torrents/${torrent.id}`, {
        data: { reason }
      });

      setDeleteDialog({ open: false, torrent: null, reason: '' });
      fetchTorrents();
      
      alert('种子删除成功');
    } catch (error) {
      console.error('删除失败:', error);
      alert(error.response?.data?.error || '删除操作失败');
    }
  };

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
      alert(error.response?.data?.error || '下载失败');
    }
  };

  const handleViewDetail = (torrentId) => {
    navigate(`/torrents/${torrentId}`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // 尝试解析日期，支持多种格式
      let date;
      if (typeof dateString === 'string') {
        // 如果是字符串，直接解析
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        // 如果已经是Date对象
        date = dateString;
      } else {
        // 其他情况，尝试转换
        date = new Date(dateString);
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('无效的日期:', dateString);
        return 'Invalid Date';
      }
      
      // 返回本地化的日期时间字符串
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('日期格式化错误:', error, '原始值:', dateString);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '已通过';
      case 'pending': return '待审核';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">您没有权限访问此页面</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        种子审核管理
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="待审核" />
            <Tab label="已通过" />
            <Tab label="已拒绝" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                  {torrents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">
                          暂无{getStatusText(['pending', 'approved', 'rejected'][currentTab])}的种子
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    torrents.map((torrent) => (
                      <TableRow key={torrent.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {torrent.name}
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

                            {/* 删除按钮 - 只有管理员可以看到 */}
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
            </TableContainer>
          )}
        </CardContent>
      </Card>

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
    </Container>
  );
};

export default AdminReviewPage;

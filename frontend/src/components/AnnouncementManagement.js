import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Pagination,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PushPin,
  MoreVert,
  Publish,
  Unpublished,
  Archive
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from 'date-fns/locale';
import api from '../services/api';
import { formatDate } from '../utils/formatters';

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0
  });
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    is_pinned: false,
    is_published: true,
    expires_at: null
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/announcements?page=${page}&limit=10&include_unpublished=true`);
      setAnnouncements(response.data.announcements);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('获取公告失败:', error);
      setError('获取公告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        is_pinned: announcement.is_pinned,
        is_published: announcement.is_published,
        expires_at: announcement.expires_at ? new Date(announcement.expires_at) : null
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        type: 'info',
        is_pinned: false,
        is_published: true,
        expires_at: null
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAnnouncement(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        setError('标题和内容不能为空');
        return;
      }

      const submitData = {
        ...formData,
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : null
      };

      if (editingAnnouncement) {
        await api.put(`/announcements/${editingAnnouncement.id}`, submitData);
        setSuccess('公告更新成功');
      } else {
        await api.post('/announcements', submitData);
        setSuccess('公告创建成功');
      }

      handleCloseDialog();
      fetchAnnouncements(pagination.current_page);
    } catch (error) {
      console.error('保存公告失败:', error);
      setError(error.response?.data?.error || '保存公告失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除此公告吗？')) return;

    try {
      await api.delete(`/announcements/${id}`);
      setSuccess('公告删除成功');
      fetchAnnouncements(pagination.current_page);
    } catch (error) {
      console.error('删除公告失败:', error);
      setError('删除公告失败');
    }
  };

  const handleBatchAction = async (action) => {
    if (selectedIds.length === 0) {
      setError('请选择要操作的公告');
      return;
    }

    try {
      await api.post('/announcements/batch', {
        action,
        ids: selectedIds
      });
      
      setSuccess(`批量${action}操作成功`);
      setSelectedIds([]);
      fetchAnnouncements(pagination.current_page);
    } catch (error) {
      console.error('批量操作失败:', error);
      setError('批量操作失败');
    }
    
    setAnchorEl(null);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(announcements.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'info': return '信息';
      case 'warning': return '警告';
      case 'success': return '成功';
      case 'error': return '错误';
      default: return type;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
      <Box>
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

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                公告管理
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedIds.length > 0 && (
                  <>
                    <Button
                      variant="outlined"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      startIcon={<MoreVert />}
                    >
                      批量操作 ({selectedIds.length})
                    </Button>
                    
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={() => setAnchorEl(null)}
                    >
                      <MenuItem onClick={() => handleBatchAction('publish')}>
                        <ListItemIcon><Publish /></ListItemIcon>
                        <ListItemText>发布</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleBatchAction('unpublish')}>
                        <ListItemIcon><Unpublished /></ListItemIcon>
                        <ListItemText>取消发布</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleBatchAction('pin')}>
                        <ListItemIcon><PushPin /></ListItemIcon>
                        <ListItemText>置顶</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleBatchAction('unpin')}>
                        <ListItemIcon><Archive /></ListItemIcon>
                        <ListItemText>取消置顶</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleBatchAction('delete')}>
                        <ListItemIcon><Delete /></ListItemIcon>
                        <ListItemText>删除</ListItemText>
                      </MenuItem>
                    </Menu>
                  </>
                )}
                
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                >
                  新建公告
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedIds.length > 0 && selectedIds.length < announcements.length}
                        checked={announcements.length > 0 && selectedIds.length === announcements.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>标题</TableCell>
                    <TableCell>类型</TableCell>
                    <TableCell>作者</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>发布时间</TableCell>
                    <TableCell>过期时间</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(announcement.id)}
                          onChange={() => handleSelectOne(announcement.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {announcement.is_pinned && (
                            <PushPin color="primary" fontSize="small" />
                          )}
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {announcement.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getTypeLabel(announcement.type)} 
                          size="small" 
                          color={getTypeColor(announcement.type)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {announcement.author?.username || '未知'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {announcement.is_published ? (
                            <Chip label="已发布" size="small" color="success" variant="outlined" />
                          ) : (
                            <Chip label="未发布" size="small" color="default" variant="outlined" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {announcement.published_at ? formatDate(announcement.published_at) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {announcement.expires_at ? formatDate(announcement.expires_at) : '永久'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="编辑">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(announcement)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="删除">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDelete(announcement.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {pagination.total_pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.total_pages}
                  page={pagination.current_page}
                  onChange={(event, page) => fetchAnnouncements(page)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 新建/编辑对话框 */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingAnnouncement ? '编辑公告' : '新建公告'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="公告标题"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />

              <TextField
                fullWidth
                label="公告内容"
                multiline
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                required
              />

              <FormControl fullWidth>
                <InputLabel>公告类型</InputLabel>
                <Select
                  value={formData.type}
                  label="公告类型"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="info">信息</MenuItem>
                  <MenuItem value="warning">警告</MenuItem>
                  <MenuItem value="success">成功</MenuItem>
                  <MenuItem value="error">错误</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                    />
                  }
                  label="置顶显示"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_published}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    />
                  }
                  label="立即发布"
                />
              </Box>

              <DateTimePicker
                label="过期时间（可选）"
                value={formData.expires_at}
                onChange={(newValue) => setFormData(prev => ({ ...prev, expires_at: newValue }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disablePast
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              取消
            </Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingAnnouncement ? '更新' : '创建'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AnnouncementManagement;

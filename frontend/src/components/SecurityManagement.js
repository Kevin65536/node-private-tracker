import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Error,
  Warning,
  Storage,
  CloudDownload,
  Delete,
  Refresh,
  ExpandMore,
  GetApp,
  Info
} from '@mui/icons-material';
import api from '../services/api';
import { formatFileSize, formatDate } from '../utils/formatters';

const SecurityManagement = () => {
  // 状态管理
  const [torrentCheckResult, setTorrentCheckResult] = useState(null);
  const [imageCheckResult, setImageCheckResult] = useState(null);
  const [orphanFilesResult, setOrphanFilesResult] = useState(null);
  const [backupList, setBackupList] = useState([]);
  const [loading, setLoading] = useState({
    torrentCheck: false,
    imageCheck: false,
    orphanCheck: false,
    backupList: false,
    createBackup: false,
    cleanup: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // 对话框状态
  const [cleanupDialog, setCleanupDialog] = useState(false);
  const [selectedOrphanFiles, setSelectedOrphanFiles] = useState([]);

  // 加载备份列表
  useEffect(() => {
    loadBackupList();
  }, []);

  const loadBackupList = async () => {
    setLoading(prev => ({ ...prev, backupList: true }));
    try {
      const response = await api.get('/admin/security/backup-list');
      if (response.data.success) {
        setBackupList(response.data.backups);
      } else {
        setError(response.data.error || '获取备份列表失败');
      }
    } catch (error) {
      console.error('获取备份列表失败:', error);
      setError('获取备份列表失败');
    } finally {
      setLoading(prev => ({ ...prev, backupList: false }));
    }
  };

  // 检查种子文件完整性
  const checkTorrentFiles = async () => {
    setLoading(prev => ({ ...prev, torrentCheck: true }));
    setError(null);
    try {
      const response = await api.get('/admin/security/check-torrent-files');
      if (response.data.success) {
        setTorrentCheckResult(response.data.results);
        setSuccess('种子文件检查完成');
      } else {
        setError(response.data.error || '种子文件检查失败');
      }
    } catch (error) {
      console.error('种子文件检查失败:', error);
      setError('种子文件检查失败');
    } finally {
      setLoading(prev => ({ ...prev, torrentCheck: false }));
    }
  };

  // 检查图片文件完整性
  const checkImageFiles = async () => {
    setLoading(prev => ({ ...prev, imageCheck: true }));
    setError(null);
    try {
      const response = await api.get('/admin/security/check-image-files');
      if (response.data.success) {
        setImageCheckResult(response.data.results);
        setSuccess('图片文件检查完成');
      } else {
        setError(response.data.error || '图片文件检查失败');
      }
    } catch (error) {
      console.error('图片文件检查失败:', error);
      setError('图片文件检查失败');
    } finally {
      setLoading(prev => ({ ...prev, imageCheck: false }));
    }
  };

  // 检查孤儿文件
  const checkOrphanFiles = async () => {
    setLoading(prev => ({ ...prev, orphanCheck: true }));
    setError(null);
    try {
      const response = await api.get('/admin/security/check-orphan-files');
      if (response.data.success) {
        setOrphanFilesResult(response.data.results);
        setSuccess('孤儿文件检查完成');
      } else {
        setError(response.data.error || '孤儿文件检查失败');
      }
    } catch (error) {
      console.error('孤儿文件检查失败:', error);
      setError('孤儿文件检查失败');
    } finally {
      setLoading(prev => ({ ...prev, orphanCheck: false }));
    }
  };

  // 创建备份
  const createBackup = async () => {
    setLoading(prev => ({ ...prev, createBackup: true }));
    setError(null);
    try {
      const response = await api.post('/admin/security/create-backup');
      if (response.data.success) {
        setSuccess('数据库备份创建成功');
        loadBackupList(); // 重新加载备份列表
      } else {
        setError(response.data.error || '创建备份失败');
      }
    } catch (error) {
      console.error('创建备份失败:', error);
      setError('创建备份失败');
    } finally {
      setLoading(prev => ({ ...prev, createBackup: false }));
    }
  };

  // 下载备份文件
  const downloadBackup = async (filename) => {
    try {
      const response = await api.get(`/admin/security/backup-download/${filename}`, {
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`备份文件 ${filename} 下载成功`);
    } catch (error) {
      console.error('下载备份失败:', error);
      setError('下载备份文件失败');
    }
  };

  // 清理孤儿文件
  const cleanupOrphanFiles = async () => {
    if (selectedOrphanFiles.length === 0) {
      setError('请先选择要清理的文件');
      return;
    }

    setLoading(prev => ({ ...prev, cleanup: true }));
    setError(null);
    try {
      const response = await api.post('/admin/security/cleanup-orphan-files', {
        filenames: selectedOrphanFiles
      });
      
      if (response.data.success) {
        setSuccess(`清理完成: 删除了 ${response.data.results.deleted} 个文件`);
        setCleanupDialog(false);
        setSelectedOrphanFiles([]);
        // 重新检查孤儿文件
        checkOrphanFiles();
      } else {
        setError(response.data.error || '清理失败');
      }
    } catch (error) {
      console.error('清理孤儿文件失败:', error);
      setError('清理孤儿文件失败');
    } finally {
      setLoading(prev => ({ ...prev, cleanup: false }));
    }
  };

  // 渲染检查结果卡片
  const renderCheckCard = (title, icon, result, onCheck, isLoading, onRefresh) => {
    const hasIssues = result && (result.missing?.length > 0 || result.invalid?.length > 0 || result.orphan_files?.length > 0);
    const statusColor = result ? (hasIssues ? 'warning' : 'success') : 'default';
    const statusIcon = result ? (hasIssues ? <Warning /> : <CheckCircle />) : <Info />;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon}
            <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
              {title}
            </Typography>
            {result && (
              <Chip
                icon={statusIcon}
                label={hasIssues ? '发现问题' : '检查正常'}
                color={statusColor}
                size="small"
              />
            )}
          </Box>

          {isLoading && <LinearProgress sx={{ mb: 2 }} />}

          {result && (
            <Box>
              {/* 总体统计 */}
              {result.total !== undefined && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  总计: {result.total} 项 | 正常: {result.valid || (result.total - (result.issues || 0))} 项
                  {result.issues > 0 && ` | 问题: ${result.issues} 项`}
                </Typography>
              )}

              {/* 种子文件特殊显示 */}
              {result.missing && result.invalid && (
                <Box sx={{ mt: 2 }}>
                  {result.missing.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography color="error">
                          丢失的种子文件 ({result.missing.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {result.missing.map((item, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={item.name}
                                secondary={`上传者: ${item.uploader} | 文件: ${item.filename}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {result.invalid.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography color="warning.main">
                          无效的种子文件 ({result.invalid.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {result.invalid.map((item, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={item.name}
                                secondary={`上传者: ${item.uploader} | 问题: ${item.issue}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}

              {/* 孤儿文件特殊显示 */}
              {result.orphan_files && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    发现 {result.orphan_files.length} 个孤儿文件，
                    总大小: {formatFileSize(result.total_orphan_size)}
                  </Typography>
                  
                  {result.orphan_files.length > 0 && (
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<Delete />}
                      onClick={() => setCleanupDialog(true)}
                      sx={{ mt: 1 }}
                    >
                      清理孤儿文件
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            onClick={onCheck}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : <Security />}
          >
            {isLoading ? '检查中...' : '开始检查'}
          </Button>
          {result && onRefresh && (
            <Button
              variant="outlined"
              onClick={onRefresh}
              startIcon={<Refresh />}
            >
              刷新
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        安全管理
      </Typography>

      {/* 错误和成功提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 数据完整性检查 */}
        <Grid item xs={12} lg={8}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            🔍 数据完整性检查
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {renderCheckCard(
                '种子文件检查',
                <Storage color="primary" />,
                torrentCheckResult,
                checkTorrentFiles,
                loading.torrentCheck,
                () => setTorrentCheckResult(null)
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              {renderCheckCard(
                '图片文件检查',
                <Security color="secondary" />,
                imageCheckResult,
                checkImageFiles,
                loading.imageCheck,
                () => setImageCheckResult(null)
              )}
            </Grid>
            
            <Grid item xs={12}>
              {renderCheckCard(
                '孤儿文件检查',
                <Warning color="warning" />,
                orphanFilesResult,
                checkOrphanFiles,
                loading.orphanCheck,
                () => setOrphanFilesResult(null)
              )}
            </Grid>
          </Grid>
        </Grid>

        {/* 数据备份管理 */}
        <Grid item xs={12} lg={4}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            💾 数据备份管理
          </Typography>
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudDownload color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  备份文件管理
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={createBackup}
                disabled={loading.createBackup}
                startIcon={loading.createBackup ? <CircularProgress size={16} /> : <Storage />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {loading.createBackup ? '创建中...' : '创建新备份'}
              </Button>

              <Button
                variant="outlined"
                onClick={loadBackupList}
                disabled={loading.backupList}
                startIcon={<Refresh />}
                fullWidth
                sx={{ mb: 2 }}
              >
                刷新列表
              </Button>

              {loading.backupList ? (
                <LinearProgress />
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>文件名</TableCell>
                        <TableCell align="right">大小</TableCell>
                        <TableCell align="center">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backupList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            暂无备份文件
                          </TableCell>
                        </TableRow>
                      ) : (
                        backupList.map((backup) => (
                          <TableRow key={backup.filename}>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {backup.filename}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(backup.created)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatFileSize(backup.size)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="下载备份文件">
                                <IconButton
                                  size="small"
                                  onClick={() => downloadBackup(backup.filename)}
                                >
                                  <GetApp />
                                </IconButton>
                              </Tooltip>
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
        </Grid>
      </Grid>

      {/* 孤儿文件清理对话框 */}
      <Dialog
        open={cleanupDialog}
        onClose={() => setCleanupDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>清理孤儿文件</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            选择要删除的孤儿文件。请谨慎操作，删除后无法恢复。
          </DialogContentText>
          
          {orphanFilesResult && (
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedOrphanFiles.length === orphanFilesResult.orphan_files.length}
                    indeterminate={
                      selectedOrphanFiles.length > 0 && 
                      selectedOrphanFiles.length < orphanFilesResult.orphan_files.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrphanFiles(orphanFilesResult.orphan_files.map(f => f.filename));
                      } else {
                        setSelectedOrphanFiles([]);
                      }
                    }}
                  />
                }
                label="全选"
              />
              
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">选择</TableCell>
                      <TableCell>文件名</TableCell>
                      <TableCell align="right">大小</TableCell>
                      <TableCell>类型</TableCell>
                      <TableCell>修改时间</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orphanFilesResult.orphan_files.map((file) => (
                      <TableRow key={file.filename}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedOrphanFiles.includes(file.filename)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrphanFiles(prev => [...prev, file.filename]);
                              } else {
                                setSelectedOrphanFiles(prev => 
                                  prev.filter(f => f !== file.filename)
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {file.filename}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell>
                          <Chip label={file.type || 'unknown'} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatDate(file.modified)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                已选择 {selectedOrphanFiles.length} 个文件，
                总大小约: {formatFileSize(
                  orphanFilesResult.orphan_files
                    .filter(f => selectedOrphanFiles.includes(f.filename))
                    .reduce((sum, f) => sum + f.size, 0)
                )}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialog(false)}>
            取消
          </Button>
          <Button
            onClick={cleanupOrphanFiles}
            color="warning"
            variant="contained"
            disabled={loading.cleanup || selectedOrphanFiles.length === 0}
            startIcon={loading.cleanup ? <CircularProgress size={16} /> : <Delete />}
          >
            {loading.cleanup ? '删除中...' : `删除选中文件 (${selectedOrphanFiles.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityManagement;

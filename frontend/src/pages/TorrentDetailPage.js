import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  Download as DownloadIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  Storage as StorageIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// 工具函数 - 移到组件外部
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
    case 'approved': return '已审核';
    case 'pending': return '审核中';
    case 'rejected': return '已拒绝';
    default: return status;
  }
};

// 图片组件，支持懒加载和错误处理
const TorrentImage = React.memo(({ imageFile, index, onClick }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // 获取服务器基础URL（不包含/api路径）
  const getServerBaseUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    return apiUrl.replace('/api', '');
  };
  
  const imageUrl = `${getServerBaseUrl()}/uploads/${imageFile}`;
  
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    console.log('图片加载成功:', imageUrl);
  }, [imageUrl]);
  
  const handleImageError = useCallback((e) => {
    setImageLoading(false);
    setImageError(true);
    console.error('图片加载失败:', imageUrl, e);
    console.error('错误详情:', e.target.naturalWidth, e.target.naturalHeight);
    
    // 尝试直接访问图片URL进行调试
    fetch(imageUrl)
      .then(response => {
        console.log('图片URL测试结果:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          url: response.url
        });
        return response.blob();
      })
      .then(blob => {
        console.log('图片数据:', {
          size: blob.size,
          type: blob.type
        });
      })
      .catch(error => {
        console.error('图片URL fetch失败:', error);
      });
  }, [imageUrl]);
  
  // 组件加载时就开始测试URL
  useEffect(() => {
    console.log('TorrentImage组件加载, URL:', imageUrl);
    
    // 立即测试URL可访问性
    fetch(imageUrl, { mode: 'no-cors' })
      .then(() => {
        console.log('no-cors模式下URL可访问:', imageUrl);
      })
      .catch(error => {
        console.error('no-cors模式下URL访问失败:', error);
      });
  }, [imageUrl]);
  
  return (
    <Card variant="outlined">
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {imageLoading && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={200} 
            animation="wave"
          />
        )}
        
        {imageError ? (
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              backgroundColor: 'grey.100'
            }}
          >
            <BrokenImageIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="caption">图片加载失败</Typography>
            <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', px: 1 }}>
              URL: {imageUrl}
            </Typography>
          </Box>
        ) : (
          <Box
            component="img"
            src={imageUrl}
            alt={`种子图片 ${index + 1}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            crossOrigin="anonymous"
            sx={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              cursor: 'pointer',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)'
              },
              display: imageLoading ? 'none' : 'block'
            }}
            onClick={() => !imageError && onClick(imageUrl)}
          />
        )}
      </Box>
      <CardContent sx={{ p: 1 }}>
        <Typography variant="caption" color="text.secondary">
          图片 {index + 1}
        </Typography>
      </CardContent>
    </Card>
  );
});

TorrentImage.displayName = 'TorrentImage';

const TorrentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [torrent, setTorrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const fetchTorrentDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/torrents/${id}`);
      setTorrent(response.data.torrent);
    } catch (error) {
      console.error('获取种子详情失败:', error);
      setError(error.response?.data?.error || '获取种子详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTorrentDetail();
  }, [fetchTorrentDetail]);

  const handleImageClick = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  }, []);

  const handleCloseImageDialog = useCallback(() => {
    setImageDialogOpen(false);
    setSelectedImage('');
  }, []);

  // 使用 useMemo 优化计算
  const formattedTorrent = useMemo(() => {
    if (!torrent) return null;
    
    return {
      ...torrent,
      formattedSize: formatFileSize(torrent.size),
      formattedDate: formatDate(torrent.created_at),
      statusText: getStatusText(torrent.status),
      statusColor: getStatusColor(torrent.status)
    };
  }, [torrent]);

  const downloadStats = useMemo(() => {
    if (!torrent?.download_stats) return null;
    
    return {
      seeding: torrent.download_stats.seeding || 0,
      downloading: torrent.download_stats.downloading || 0,
      completed: torrent.download_stats.completed || 0
    };
  }, [torrent?.download_stats]);

  const handleDownload = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    try {
      setDownloading(true);
      const response = await api.get(`/torrents/${id}/download`, {
        responseType: 'blob'
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
                            link.setAttribute('download', `${formattedTorrent.name}.torrent`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // 刷新数据以更新下载统计
      fetchTorrentDetail();
    } catch (error) {
      console.error('下载失败:', error);
      alert(error.response?.data?.error || '下载失败');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          返回
        </Button>
      </Container>
    );
  }

  if (!torrent || !formattedTorrent) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 种子基本信息 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                  {formattedTorrent.name}
                </Typography>
                <Chip 
                  label={formattedTorrent.statusText}
                  color={formattedTorrent.statusColor}
                  size="small"
                />
              </Box>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {formattedTorrent.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        分类
                      </Typography>
                      <Typography variant="body1">
                        {formattedTorrent.Category?.name || '未分类'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        上传者
                      </Typography>
                      <Typography variant="body1">
                        {formattedTorrent.uploader?.username || '未知'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StorageIcon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        大小
                      </Typography>
                      <Typography variant="body1">
                        {formattedTorrent.formattedSize}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DateIcon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        上传时间
                      </Typography>
                      <Typography variant="body1">
                        {formattedTorrent.formattedDate}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleDownload}
                  disabled={!user || downloading}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {downloading ? '下载中...' : '下载种子'}
                </Button>

                {!user && (
                  <Typography variant="body2" color="text.secondary">
                    请先登录后下载
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* 统计信息 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon sx={{ mr: 1 }} />
                下载统计
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>下载次数</TableCell>
                      <TableCell align="right">{formattedTorrent.download_count}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>做种中</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={downloadStats?.seeding || 0} 
                          color="success" 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>下载中</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={downloadStats?.downloading || 0} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>已完成</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={downloadStats?.completed || 0} 
                          color="info" 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 种子信息 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon sx={{ mr: 1 }} />
                种子信息
              </Typography>
              
              {formattedTorrent.file_info ? (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Info Hash</TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.8rem',
                            wordBreak: 'break-all'
                          }}
                        >
                          {formattedTorrent.info_hash}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>文件数量</TableCell>
                        <TableCell align="right">
                          {formattedTorrent.file_info.files?.length || 1}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>分块大小</TableCell>
                        <TableCell align="right">
                          {formatFileSize(formattedTorrent.file_info.piece_length)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>分块数量</TableCell>
                        <TableCell align="right">
                          {formattedTorrent.file_info.piece_count}
                        </TableCell>
                      </TableRow>
                      {formattedTorrent.file_info.created_by && (
                        <TableRow>
                          <TableCell>创建者</TableCell>
                          <TableCell align="right">
                            {formattedTorrent.file_info.created_by}
                          </TableCell>
                        </TableRow>
                      )}
                      {formattedTorrent.file_info.creation_date && (
                        <TableRow>
                          <TableCell>创建时间</TableCell>
                          <TableCell align="right">
                            {formatDate(formattedTorrent.file_info.creation_date)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  无法读取种子文件信息
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 种子图片 */}
        {formattedTorrent.image_files && formattedTorrent.image_files.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ mr: 1 }} />
                  种子图片 ({formattedTorrent.image_files.length} 张)
                </Typography>
                
                <Grid container spacing={2}>
                  {formattedTorrent.image_files.map((imageFile, index) => (
                    <Grid item xs={12} sm={6} md={4} key={`${imageFile}-${index}`}>
                      <TorrentImage
                        imageFile={imageFile}
                        index={index}
                        onClick={handleImageClick}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 文件列表 */}
        {formattedTorrent.file_info?.files && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FolderIcon sx={{ mr: 1 }} />
                  文件列表 ({formattedTorrent.file_info.files.length} 个文件)
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>文件名</TableCell>
                        <TableCell align="right">大小</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formattedTorrent.file_info.files.map((file, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FileIcon sx={{ mr: 1, fontSize: 16 }} />
                              {file.path}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatFileSize(file.length)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button onClick={() => navigate(-1)}>
          返回
        </Button>
      </Box>

      {/* 图片预览对话框 */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleCloseImageDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">图片预览</Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseImageDialog}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="种子图片预览"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
          <Box 
            sx={{
              display: 'none',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'text.secondary'
            }}
          >
            <BrokenImageIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>图片加载失败</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default TorrentDetailPage;

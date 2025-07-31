import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Pagination,
  Grid,
  Card,
  CardContent,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Download,
  Search,
  Info,
  CloudDownload,
  Person,
  Category,
  Schedule,
  Storage,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { torrentAPI, apiUtils } from '../services/api';

const TorrentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [torrents, setTorrents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20
  });

  // 搜索和过滤参数
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'created_at',
    order: 'DESC',
    page: 1
  });

  const [error, setError] = useState('');

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await torrentAPI.getCategories();
        setCategories(response.data.categories);
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };

    fetchCategories();
  }, []);

  // 获取种子列表
  useEffect(() => {
    fetchTorrents();
  }, [filters]);

  const fetchTorrents = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: filters.page,
        search: filters.search,
        category: filters.category,
        sort: filters.sort,
        order: filters.order
      };

      const response = await torrentAPI.getTorrents(params);
      setTorrents(response.data.torrents);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('获取种子列表失败:', error);
      setError('获取种子列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? value : 1
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // 搜索会通过useEffect自动触发
  };

  const handleDownload = async (torrentId, torrentName) => {
    if (!user) {
      setError('请先登录再下载种子');
      return;
    }

    try {
      const response = await torrentAPI.downloadTorrent(torrentId);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${torrentName}.torrent`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      setError('下载失败: ' + (error.response?.data?.error || '请稍后重试'));
    }
  };

  const handleViewDetails = (torrentId) => {
    navigate(`/torrents/${torrentId}`);
  };

  const getSeedLeechColor = (seeders, leechers) => {
    const ratio = seeders / (leechers + 1);
    if (ratio >= 2) return 'success';
    if (ratio >= 1) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          种子列表
        </Typography>
        <Typography variant="body1" color="text.secondary">
          浏览和下载站点中的种子资源
        </Typography>
      </Box>

      {/* 搜索和过滤 */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="搜索种子"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="输入种子名称..."
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>分类</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="分类"
                  sx={{
                    '& .MuiSelect-select': {
                      textOverflow: 'unset',
                      overflow: 'visible', 
                      whiteSpace: 'nowrap',
                      minWidth: '80px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        minWidth: 150,
                      },
                    },
                  }}
                >
                  <MenuItem 
                    value=""
                    sx={{ 
                      minHeight: 40,
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      padding: '8px 16px'
                    }}
                  >
                    全部分类
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem 
                      key={category.id} 
                      value={category.id}
                      sx={{ 
                        minHeight: 40,
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        padding: '8px 16px'
                      }}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>排序</InputLabel>
                <Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  label="排序"
                >
                  <MenuItem value="created_at">上传时间</MenuItem>
                  <MenuItem value="seeders">种子数</MenuItem>
                  <MenuItem value="leechers">下载数</MenuItem>
                  <MenuItem value="completed">完成数</MenuItem>
                  <MenuItem value="size">文件大小</MenuItem>
                  <MenuItem value="name">名称</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>顺序</InputLabel>
                <Select
                  value={filters.order}
                  onChange={(e) => handleFilterChange('order', e.target.value)}
                  label="顺序"
                >
                  <MenuItem value="DESC">降序</MenuItem>
                  <MenuItem value="ASC">升序</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<Search />}
                disabled={loading}
              >
                搜索
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 统计信息 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Storage sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">{pagination.total_count}</Typography>
              <Typography variant="body2" color="text.secondary">
                总种子数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 种子列表表格 */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>种子信息</TableCell>
              <TableCell align="center">分类</TableCell>
              <TableCell align="center">大小</TableCell>
              <TableCell align="center">状态</TableCell>
              <TableCell align="center">上传者</TableCell>
              <TableCell align="center">上传时间</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography>加载中...</Typography>
                </TableCell>
              </TableRow>
            ) : torrents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    暂无种子数据
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              torrents.map((torrent) => (
                <TableRow key={torrent.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {torrent.name}
                      </Typography>
                      {torrent.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {torrent.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={torrent.Category?.name || '未知'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Typography variant="body2">
                      {apiUtils.formatFileSize(torrent.size)}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={`↑${torrent.seeders}`}
                          size="small"
                          color={getSeedLeechColor(torrent.seeders, torrent.leechers)}
                          variant="filled"
                        />
                        <Chip
                          label={`↓${torrent.leechers}`}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        完成: {torrent.completed}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Person sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">
                        {torrent.uploader?.username || '未知'}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Schedule sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">
                        {apiUtils.formatDate(torrent.created_at)}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="查看详情">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(torrent.id)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={user ? "下载种子" : "请先登录"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(torrent.id, torrent.name)}
                            color="success"
                            disabled={!user}
                          >
                            <CloudDownload />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 分页 */}
      {pagination.total_pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.total_pages}
            page={filters.page}
            onChange={(e, page) => handleFilterChange('page', page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* 上传按钮 */}
      {user && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CloudDownload />}
            onClick={() => navigate('/upload')}
            sx={{ borderRadius: 8 }}
          >
            上传种子
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default TorrentsPage;

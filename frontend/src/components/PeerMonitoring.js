import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Divider,
  Stack,
} from '@mui/material';
import {
  Refresh,
  CloudUpload,
  CloudDownload,
  Person,
  Schedule,
  Info,
  ExpandMore,
  NetworkCheck,
  Speed,
  FilterList,
  Clear,
  Search,
} from '@mui/icons-material';
import api from '../services/api';
import { formatBytes, formatDuration } from '../utils/formatters';

const PeerMonitoring = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [peers, setPeers] = useState([]);
  const [announces, setAnnounces] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [announcePage, setAnnouncePage] = useState(0);
  const [announceRowsPerPage, setAnnounceRowsPerPage] = useState(10);

  // 新增筛选状态
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    // Peer筛选
    peer_user_id: '',
    peer_username: '',
    peer_status: '',
    // Announce筛选
    announce_user_id: '',
    announce_username: '',
    announce_event: '',
    announce_torrent_id: '',
    // Stats筛选
    stats_user_id: '',
    stats_status: '',
  });

  // 防抖状态 - 用于延迟API请求
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(fetchData, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  // 防抖处理 - 延迟500ms后更新debouncedFilters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // 500ms防抖延迟

    return () => clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, announcePage, announceRowsPerPage, debouncedFilters]); // 使用debouncedFilters而不是filters

  const buildQueryParams = (baseParams = {}) => {
    const params = new URLSearchParams();
    
    // 添加基础参数
    Object.entries(baseParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    return params.toString();
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始获取peer数据...');
      
      // 构建请求参数 - 使用debouncedFilters而不是filters
      const peerParams = buildQueryParams({
        page: page + 1,
        limit: rowsPerPage,
        user_id: debouncedFilters.peer_user_id,
        username: debouncedFilters.peer_username,
        status: debouncedFilters.peer_status,
      });

      const statsParams = buildQueryParams({
        user_id: debouncedFilters.stats_user_id,
        status: debouncedFilters.stats_status,
      });

      const announceParams = buildQueryParams({
        page: announcePage + 1,
        limit: announceRowsPerPage,
        user_id: debouncedFilters.announce_user_id,
        username: debouncedFilters.announce_username,
        event: debouncedFilters.announce_event,
        torrent_id: debouncedFilters.announce_torrent_id,
      });
      
      const [peersResponse, statsResponse, announcesResponse] = await Promise.all([
        api.get(`/admin/peers/active?${peerParams}`),
        api.get(`/admin/peers/stats?${statsParams}`),
        api.get(`/admin/announces/recent?${announceParams}`)
      ]);

      console.log('API响应数据:', {
        peers: peersResponse.data,
        stats: statsResponse.data,
        announces: announcesResponse.data
      });

      // 处理peers数据
      setPeers(peersResponse.data.peers || []);
      
      // 处理stats数据
      const statsData = statsResponse.data;
      setStats({
        active_peers: peersResponse.data.pagination?.total_items || 0,
        seeders: statsData.summary?.total_seeders || 0,
        leechers: statsData.summary?.total_leechers || 0,
        active_users: statsData.summary?.active_users || 0,
        active_torrents: statsData.summary?.total_torrents || 0,
        total_peers: statsData.summary?.total_peers || 0,
        status_breakdown: statsData.status_breakdown || []
      });
      
      // 处理announces数据
      setAnnounces(announcesResponse.data.announces || []);
      
    } catch (error) {
      console.error('获取peer数据失败:', error);
      console.error('错误详情:', error.response?.data);
      
      let errorMessage = '获取数据失败，请重试';
      if (error.response?.status === 401) {
        errorMessage = '认证失败，请重新登录';
      } else if (error.response?.status === 403) {
        errorMessage = '权限不足，需要管理员权限';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAnnounceChangePage = (event, newPage) => {
    setAnnouncePage(newPage);
  };

  const handleAnnounceChangeRowsPerPage = (event) => {
    setAnnounceRowsPerPage(parseInt(event.target.value, 10));
    setAnnouncePage(0);
  };

  // 筛选相关方法
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    // 重置页码
    if (filterType.startsWith('peer_')) {
      setPage(0);
    } else if (filterType.startsWith('announce_')) {
      setAnnouncePage(0);
    }
  };

  const clearFilters = () => {
    setFilters({
      peer_user_id: '',
      peer_username: '',
      peer_status: '',
      announce_user_id: '',
      announce_username: '',
      announce_event: '',
      announce_torrent_id: '',
      stats_user_id: '',
      stats_status: '',
    });
    setPage(0);
    setAnnouncePage(0);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'started': return 'primary';
      case 'completed': return 'success';
      case 'stopped': return 'default';
      default: return 'secondary';
    }
  };

  const getEventColor = (event) => {
    switch (event) {
      case 'started': return 'primary';
      case 'completed': return 'success';
      case 'stopped': return 'error';
      case 'update': return 'info';
      default: return 'default';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  // 渲染筛选控件
  const renderFilters = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">筛选条件</Typography>
        <Box>
          <Button
            startIcon={<Clear />}
            onClick={clearFilters}
            disabled={!hasActiveFilters()}
            size="small"
            sx={{ mr: 1 }}
          >
            清空筛选
          </Button>
          <Button
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'contained' : 'outlined'}
            size="small"
          >
            {showFilters ? '隐藏筛选' : '显示筛选'}
          </Button>
        </Box>
      </Box>
      
      <Collapse in={showFilters}>
        <Grid container spacing={3}>
          {/* Peer筛选 */}
          {activeTab === 0 && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  活跃Peer筛选
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="用户ID"
                  value={filters.peer_user_id}
                  onChange={(e) => handleFilterChange('peer_user_id', e.target.value)}
                  placeholder="输入用户ID"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="用户名"
                  value={filters.peer_username}
                  onChange={(e) => handleFilterChange('peer_username', e.target.value)}
                  placeholder="输入用户名（支持模糊搜索）"
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>状态</InputLabel>
                  <Select
                    value={filters.peer_status}
                    label="状态"
                    onChange={(e) => handleFilterChange('peer_status', e.target.value)}
                  >
                    <MenuItem value="">所有状态</MenuItem>
                    <MenuItem value="started">已开始</MenuItem>
                    <MenuItem value="downloading">下载中</MenuItem>
                    <MenuItem value="seeding">做种中</MenuItem>
                    <MenuItem value="stopped">已停止</MenuItem>
                    <MenuItem value="completed">已完成</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {/* Announce筛选 */}
          {activeTab === 1 && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  通告记录筛选
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="用户ID"
                  value={filters.announce_user_id}
                  onChange={(e) => handleFilterChange('announce_user_id', e.target.value)}
                  placeholder="输入用户ID"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="用户名"
                  value={filters.announce_username}
                  onChange={(e) => handleFilterChange('announce_username', e.target.value)}
                  placeholder="输入用户名"
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>事件类型</InputLabel>
                  <Select
                    value={filters.announce_event}
                    label="事件类型"
                    onChange={(e) => handleFilterChange('announce_event', e.target.value)}
                  >
                    <MenuItem value="">所有事件</MenuItem>
                    <MenuItem value="started">开始</MenuItem>
                    <MenuItem value="stopped">停止</MenuItem>
                    <MenuItem value="completed">完成</MenuItem>
                    <MenuItem value="update">更新</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="种子ID"
                  value={filters.announce_torrent_id}
                  onChange={(e) => handleFilterChange('announce_torrent_id', e.target.value)}
                  placeholder="输入种子ID"
                />
              </Grid>
            </>
          )}

          {/* 统计筛选 */}
          {activeTab === 2 && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  统计数据筛选
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="用户ID"
                  value={filters.stats_user_id}
                  onChange={(e) => handleFilterChange('stats_user_id', e.target.value)}
                  placeholder="输入用户ID"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>状态</InputLabel>
                  <Select
                    value={filters.stats_status}
                    label="状态"
                    onChange={(e) => handleFilterChange('stats_status', e.target.value)}
                  >
                    <MenuItem value="">所有状态</MenuItem>
                    <MenuItem value="started">已开始</MenuItem>
                    <MenuItem value="downloading">下载中</MenuItem>
                    <MenuItem value="seeding">做种中</MenuItem>
                    <MenuItem value="stopped">已停止</MenuItem>
                    <MenuItem value="completed">已完成</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>

        {hasActiveFilters() && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              当前筛选条件:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                const getFilterLabel = (filterKey) => {
                  const labels = {
                    peer_user_id: 'Peer用户ID',
                    peer_username: 'Peer用户名',
                    peer_status: 'Peer状态',
                    announce_user_id: '通告用户ID',
                    announce_username: '通告用户名',
                    announce_event: '通告事件',
                    announce_torrent_id: '通告种子ID',
                    stats_user_id: '统计用户ID',
                    stats_status: '统计状态',
                  };
                  return labels[filterKey] || filterKey;
                };

                return (
                  <Chip
                    key={key}
                    label={`${getFilterLabel(key)}: ${value}`}
                    size="small"
                    onDelete={() => handleFilterChange(key, '')}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Collapse>
    </Paper>
  );

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NetworkCheck sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  活跃Peer
                </Typography>
                <Typography variant="h4">
                  {stats.active_peers || 0}
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
              <CloudUpload sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  做种者
                </Typography>
                <Typography variant="h4">
                  {stats.seeders || 0}
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
              <CloudDownload sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  下载者
                </Typography>
                <Typography variant="h4">
                  {stats.leechers || 0}
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
              <Person sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  活跃用户
                </Typography>
                <Typography variant="h4">
                  {stats.active_users || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPeerTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>用户</TableCell>
            <TableCell>种子</TableCell>
            <TableCell>IP地址</TableCell>
            <TableCell>状态</TableCell>
            <TableCell>类型</TableCell>
            <TableCell>上传量</TableCell>
            <TableCell>下载量</TableCell>
            <TableCell>剩余</TableCell>
            <TableCell>最后通告</TableCell>
            <TableCell>客户端</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {peers.map((peer) => (
            <TableRow key={peer.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: 12 }}>
                    {peer.user.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <Typography variant="body2">
                    {peer.user.username}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Tooltip title={peer.torrent.name}>
                  <Typography variant="body2" sx={{ 
                    maxWidth: 200, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' 
                  }}>
                    {peer.torrent.name}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {peer.ip}:{peer.port}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  size="small" 
                  label={peer.status} 
                  color={getStatusColor(peer.status)}
                />
              </TableCell>
              <TableCell>
                <Chip 
                  size="small" 
                  label={peer.is_seeder ? '做种' : '下载'} 
                  color={peer.is_seeder ? 'success' : 'warning'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="success.main">
                  {formatBytes(peer.uploaded)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="warning.main">
                  {formatBytes(peer.downloaded)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatBytes(peer.left)}
                </Typography>
                {peer.torrent.size > 0 && (
                  <LinearProgress 
                    variant="determinate" 
                    value={(1 - peer.left / peer.torrent.size) * 100}
                    sx={{ mt: 0.5, height: 4 }}
                  />
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatTimeAgo(peer.last_announce)}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title={peer.user_agent}>
                  <Box sx={{ width: 220 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: 12,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {peer.user_agent || '-'}
                    </Typography>
                  </Box>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={stats.active_peers || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="每页显示"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 条`}
      />
    </TableContainer>
  );

  const renderAnnounceTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>时间</TableCell>
            <TableCell>用户</TableCell>
            <TableCell>种子</TableCell>
            <TableCell>IP地址</TableCell>
            <TableCell>事件</TableCell>
            <TableCell>上传量</TableCell>
            <TableCell>下载量</TableCell>
            <TableCell>剩余</TableCell>
            <TableCell>响应时间</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {announces.map((announce) => (
            <TableRow key={announce.id} hover>
              <TableCell>
                <Typography variant="body2">
                  {new Date(announce.timestamp).toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {announce.user.username}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title={announce.torrent.name}>
                  <Typography variant="body2" sx={{ 
                    maxWidth: 200, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' 
                  }}>
                    {announce.torrent.name}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {announce.ip}{announce.port ? `:${announce.port}` : ''}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  size="small" 
                  label={announce.event || 'update'} 
                  color={getEventColor(announce.event)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="success.main">
                  {formatBytes(announce.uploaded)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="warning.main">
                  {formatBytes(announce.downloaded)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatBytes(announce.left)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {announce.response_time ? `${announce.response_time}ms` : '-'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={1000} // 使用一个较大的数字，因为我们不知道总数
        rowsPerPage={announceRowsPerPage}
        page={announcePage}
        onPageChange={handleAnnounceChangePage}
        onRowsPerPageChange={handleAnnounceChangeRowsPerPage}
        labelRowsPerPage="每页显示"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} 条记录`}
      />
    </TableContainer>
  );

  if (loading && peers.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Peer实时监控
        </Typography>
        <Box>
          <IconButton onClick={fetchData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renderStatsCards()}

      {renderFilters()}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>{`活跃Peer (${stats.active_peers || 0})`}</span>
                {(filters.peer_user_id || filters.peer_username || filters.peer_status) && (
                  <Chip size="small" label="已筛选" color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>最近通告</span>
                {(filters.announce_user_id || filters.announce_username || filters.announce_event || filters.announce_torrent_id) && (
                  <Chip size="small" label="已筛选" color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>详细统计</span>
                {(filters.stats_user_id || filters.stats_status) && (
                  <Chip size="small" label="已筛选" color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
            } 
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderPeerTable()}
          {activeTab === 1 && renderAnnounceTable()}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">状态分布</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {stats.status_breakdown && stats.status_breakdown.length > 0 ? (
                      stats.status_breakdown.map((status) => {
                        const getStatusText = (statusValue) => {
                          switch(statusValue) {
                            case 'started': return '已开始';
                            case 'downloading': return '下载中';
                            case 'seeding': return '做种中';
                            case 'stopped': return '已停止';
                            case 'completed': return '已完成';
                            default: return statusValue;
                          }
                        };

                        const getStatusChipColor = (statusValue) => {
                          switch(statusValue) {
                            case 'started': return 'primary';
                            case 'downloading': return 'warning';
                            case 'seeding': return 'success';
                            case 'stopped': return 'default';
                            case 'completed': return 'info';
                            default: return 'secondary';
                          }
                        };

                        return (
                          <Box key={status.status} sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip 
                                size="small" 
                                label={getStatusText(status.status)}
                                color={getStatusChipColor(status.status)}
                                sx={{ mr: 2, minWidth: 80 }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                ({status.status})
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {status.count}
                            </Typography>
                          </Box>
                        );
                      })
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        暂无状态统计数据
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>系统信息</Typography>
                    <Typography variant="body2">
                      活跃种子数: {stats.active_torrents || 0}
                    </Typography>
                    <Typography variant="body2">
                      总Peer记录: {stats.total_peers || 0}
                    </Typography>
                    <Typography variant="body2">
                      活跃用户数: {stats.active_users || 0}
                    </Typography>
                    {(filters.stats_user_id || filters.stats_status) && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" color="primary">
                          注意: 当前显示的是筛选后的统计数据
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PeerMonitoring;

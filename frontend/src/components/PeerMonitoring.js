import React, { useState, useEffect } from 'react';
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

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(fetchData, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, announcePage, announceRowsPerPage]);

  const testAPI = async () => {
    try {
      console.log('测试API连接...');
      
      // 测试基础连接
      const healthResponse = await api.get('/health');
      console.log('健康检查响应:', healthResponse.data);
      
      // 测试认证状态
      const authResponse = await api.get('/auth/verify');
      console.log('认证状态:', authResponse.data);
      
      // 测试admin权限
      try {
        const adminResponse = await api.get('/admin/peers/stats');
        console.log('Admin API响应:', adminResponse.data);
      } catch (adminError) {
        console.error('Admin API错误:', adminError.response?.status, adminError.response?.data);
      }
      
    } catch (error) {
      console.error('API测试失败:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始获取peer数据...');
      
      const [peersResponse, statsResponse, announcesResponse] = await Promise.all([
        api.get(`/admin/peers/active?page=${page + 1}&limit=${rowsPerPage}`),
        api.get('/admin/peers/stats'),
        api.get(`/admin/announces/recent?page=${announcePage + 1}&limit=${announceRowsPerPage}`)
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
          <Button 
            onClick={testAPI} 
            variant="outlined" 
            sx={{ mr: 1 }}
            size="small"
          >
            测试API
          </Button>
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

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`活跃Peer (${stats.active_peers || 0})`} />
          <Tab label="最近通告" />
          <Tab label="详细统计" />
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

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assessment,
  Timeline,
  Schedule,
  People,
  CloudQueue,
  Refresh,
  TrendingUp,
  Event,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { formatNumber } from '../utils/formatters';

const AnnounceStats = () => {
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    hours: 24,
    user_id: '',
    event: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.append(key, value);
      }
    });
    return params.toString();
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = buildQueryParams();
      const response = await api.get(`/admin/announces/stats?${queryParams}`);
      setStats(response.data);
    } catch (error) {
      console.error('获取通告统计失败:', error);
      setError(error.response?.data?.error || '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      hours: 24,
      user_id: '',
      event: '',
    });
  };

  const hasActiveFilters = () => {
    return filters.user_id !== '' || filters.event !== '' || filters.hours !== 24;
  };

  // 图表颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getEventColor = (event) => {
    const colors = {
      started: '#2196F3',
      stopped: '#F44336', 
      completed: '#4CAF50',
      update: '#FF9800',
    };
    return colors[event] || '#9E9E9E';
  };

  const renderSummaryCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  总通告数
                </Typography>
                <Typography variant="h4">
                  {formatNumber(stats.summary?.total_announces || 0)}
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
              <People sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  活跃用户
                </Typography>
                <Typography variant="h4">
                  {formatNumber(stats.summary?.active_users || 0)}
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
              <CloudQueue sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  活跃种子
                </Typography>
                <Typography variant="h4">
                  {formatNumber(stats.summary?.active_torrents || 0)}
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
              <Schedule sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  时间窗口
                </Typography>
                <Typography variant="h4">
                  {stats.summary?.time_window_hours || 0}h
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFilters = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        筛选条件
      </Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>时间窗口</InputLabel>
            <Select
              value={filters.hours}
              label="时间窗口"
              onChange={(e) => handleFilterChange('hours', e.target.value)}
            >
              <MenuItem value={1}>最近1小时</MenuItem>
              <MenuItem value={6}>最近6小时</MenuItem>
              <MenuItem value={12}>最近12小时</MenuItem>
              <MenuItem value={24}>最近24小时</MenuItem>
              <MenuItem value={48}>最近48小时</MenuItem>
              <MenuItem value={168}>最近7天</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="用户ID"
            value={filters.user_id}
            onChange={(e) => handleFilterChange('user_id', e.target.value)}
            placeholder="输入用户ID"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>事件类型</InputLabel>
            <Select
              value={filters.event}
              label="事件类型"
              onChange={(e) => handleFilterChange('event', e.target.value)}
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              disabled={!hasActiveFilters()}
              size="small"
            >
              清空筛选
            </Button>
            <Tooltip title="刷新数据">
              <IconButton onClick={fetchStats} disabled={loading} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
      
      {hasActiveFilters() && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            当前筛选条件:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.hours !== 24 && (
              <Chip 
                label={`时间: ${filters.hours}小时`} 
                size="small" 
                color="primary"
                variant="outlined"
              />
            )}
            {filters.user_id && (
              <Chip 
                label={`用户ID: ${filters.user_id}`} 
                size="small" 
                color="primary"
                variant="outlined"
                onDelete={() => handleFilterChange('user_id', '')}
              />
            )}
            {filters.event && (
              <Chip 
                label={`事件: ${filters.event}`} 
                size="small" 
                color="primary"
                variant="outlined"
                onDelete={() => handleFilterChange('event', '')}
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );

  const renderEventBreakdown = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          事件类型分布
        </Typography>
        {stats.event_breakdown && stats.event_breakdown.length > 0 ? (
          <Box>
            <Box sx={{ height: 200, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.event_breakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ event, count }) => `${event}: ${count}`}
                  >
                    {stats.event_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getEventColor(entry.event)} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <List dense>
              {stats.event_breakdown.map((item) => (
                <ListItem key={item.event}>
                  <ListItemIcon>
                    <Event sx={{ color: getEventColor(item.event) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${item.event || 'update'} 事件`}
                    secondary={`${formatNumber(item.count)} 次`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            暂无事件统计数据
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderHourlyChart = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          按小时统计
        </Typography>
        {stats.hourly_stats && stats.hourly_stats.length > 0 ? (
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.hourly_stats.map(item => ({
                  ...item,
                  hour: new Date(item.hour).toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="通告数量"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            暂无按小时统计数据
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading && !stats.summary) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>加载统计数据中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          通告统计分析
        </Typography>
        <Chip 
          icon={<TrendingUp />}
          label="实时统计" 
          color="primary" 
          variant="outlined" 
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renderFilters()}

      {renderSummaryCards()}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderEventBreakdown()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderHourlyChart()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnnounceStats;

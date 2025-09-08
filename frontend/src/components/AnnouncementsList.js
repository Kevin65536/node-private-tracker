import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Pagination
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  PushPin,
  AccessTime,
  Person
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../services/api';
import { formatDate } from '../utils/formatters';

const ExpandButton = styled(IconButton)(({ theme }) => ({
  transform: 'rotate(0deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const ExpandedButton = styled(ExpandButton)(({ theme }) => ({
  transform: 'rotate(180deg)',
}));

const AnnouncementCard = ({ announcement, onExpand, isExpanded }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info': return '💡';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: announcement.is_pinned ? '2px solid' : '1px solid',
        borderColor: announcement.is_pinned ? 'primary.main' : 'divider',
        backgroundColor: announcement.is_pinned ? 'action.hover' : 'background.paper'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {announcement.is_pinned && (
                <PushPin color="primary" fontSize="small" />
              )}
              <Typography variant="h6" component="div">
                {getTypeIcon(announcement.type)} {announcement.title}
              </Typography>
              <Chip 
                label={announcement.type.toUpperCase()} 
                size="small" 
                color={getTypeColor(announcement.type)}
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {announcement.author?.username || '未知作者'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(announcement.published_at || announcement.created_at)}
                </Typography>
              </Box>
              
              {announcement.expires_at && (
                <Typography variant="caption" color="warning.main">
                  过期时间: {formatDate(announcement.expires_at)}
                </Typography>
              )}
            </Box>
          </Box>
          
          <ExpandButton
            onClick={() => onExpand(announcement.id)}
            aria-expanded={isExpanded}
            sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <ExpandMore />
          </ExpandButton>
        </Box>
        
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}
            >
              {announcement.content}
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const AnnouncementsList = ({ limit = 5, showPagination = false }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0
  });

  const fetchAnnouncements = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/announcements?page=${page}&limit=${limit}`);
      setAnnouncements(response.data.announcements);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('获取公告失败:', error);
      setError('获取公告失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [limit]);

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePageChange = (event, page) => {
    fetchAnnouncements(page);
    setExpandedId(null); // 重置展开状态
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            暂无公告
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          onExpand={handleExpand}
          isExpanded={expandedId === announcement.id}
        />
      ))}
      
      {showPagination && pagination.total_pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.total_pages}
            page={pagination.current_page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default AnnouncementsList;

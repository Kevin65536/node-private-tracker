import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Storage,
  Assessment,
  EmojiEvents,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import UserStats from '../components/UserStats';
import Leaderboard from '../components/Leaderboard';
import GlobalStats from '../components/GlobalStats';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StatsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user, isAuthenticated } = useAuth();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          请先登录以查看统计信息
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Assessment sx={{ mr: 1 }} />
        统计信息
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="我的统计"
            icon={<People />}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab
            label="排行榜"
            icon={<EmojiEvents />}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab
            label="全站统计"
            icon={<Assessment />}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <UserStats userId={user?.id} isCurrentUser={true} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Leaderboard />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <GlobalStats />
      </TabPanel>
    </Container>
  );
};

export default StatsPage;

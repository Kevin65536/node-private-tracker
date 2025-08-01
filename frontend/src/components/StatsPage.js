import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Container,
  Paper
} from '@mui/material';
import {
  Analytics,
  Leaderboard as LeaderboardIcon,
  Public
} from '@mui/icons-material';
import UserStats from './UserStats';
import Leaderboard from './Leaderboard';
import GlobalStats from './GlobalStats';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const StatsPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ px: 2 }}
          >
            <Tab
              icon={<Analytics />}
              label="我的统计"
              iconPosition="start"
            />
            <Tab
              icon={<LeaderboardIcon />}
              label="用户排行"
              iconPosition="start"
            />
            <Tab
              icon={<Public />}
              label="全站统计"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UserStats />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Leaderboard />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <GlobalStats />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default StatsPage;

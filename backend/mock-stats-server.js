const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 测试API
app.get('/test', (req, res) => {
  res.json({ message: 'Test API working' });
});

// 模拟全站统计API
app.get('/api/stats/global', (req, res) => {
  const mockStats = {
    general: {
      total_users: 6,
      active_users: 4,
      total_torrents: 7,
      approved_torrents: 6,
      pending_torrents: 1,
      total_categories: 8
    },
    traffic: {
      total_uploaded: 0,
      total_downloaded: 0,
      global_ratio: 1,
      users_with_stats: 3
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('返回模拟全站统计');
  res.json(mockStats);
});

// 模拟排行榜API
app.get('/api/stats/leaderboard', (req, res) => {
  const { type = 'uploaded', limit = 50 } = req.query;
  
  const mockLeaderboard = [
    {
      rank: 1,
      user: { id: 1, username: '测试用户1', role: 'admin' },
      stats: { uploaded: 5368709120, downloaded: 2147483648, ratio: 2.5, bonus_points: 250, seedtime: 86400 }
    },
    {
      rank: 2,
      user: { id: 2, username: '测试用户2', role: 'user' },
      stats: { uploaded: 3221225472, downloaded: 1073741824, ratio: 3.0, bonus_points: 180, seedtime: 43200 }
    },
    {
      rank: 3,
      user: { id: 3, username: '测试用户3', role: 'user' },
      stats: { uploaded: 2147483648, downloaded: 1073741824, ratio: 2.0, bonus_points: 120, seedtime: 21600 }
    }
  ];
  
  console.log(`返回模拟排行榜: type=${type}, limit=${limit}`);
  res.json({
    type,
    leaderboard: mockLeaderboard
  });
});

const port = 3003;
app.listen(port, () => {
  console.log(`🚀 模拟统计服务器运行在 http://localhost:${port}`);
  console.log(`📊 测试全站统计: http://localhost:${port}/api/stats/global`);
  console.log(`🏆 测试排行榜: http://localhost:${port}/api/stats/leaderboard`);
});

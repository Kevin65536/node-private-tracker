const express = require('express');
const { handleAnnounce, handleScrape, peerManager } = require('../utils/tracker');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * BitTorrent Announce 端点
 * 这是 Private Tracker 的核心功能
 */
router.get('/announce/:passkey', handleAnnounce);

/**
 * BitTorrent Scrape 端点
 * 用于获取种子统计信息
 */
router.get('/scrape/:passkey', handleScrape);

/**
 * Tracker 统计信息端点 (需要认证)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = peerManager.getGlobalStats();
    
    res.json({
      tracker_stats: {
        active_torrents: stats.torrents,
        active_peers: stats.peers,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('获取 tracker 统计失败:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

/**
 * 获取种子的实时 peer 信息 (管理员功能)
 */
router.get('/torrents/:infoHash/peers', authenticateToken, async (req, res) => {
  try {
    // 检查权限
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    const { infoHash } = req.params;
    const peers = peerManager.getPeers(infoHash);
    const stats = peerManager.getTorrentStats(infoHash);

    res.json({
      torrent: {
        info_hash: infoHash,
        stats,
        peers: peers.map(peer => ({
          user_id: peer.user_id,
          peer_id: peer.peer_id,
          ip: peer.ip,
          port: peer.port,
          uploaded: peer.uploaded,
          downloaded: peer.downloaded,
          left: peer.left,
          last_announce: new Date(peer.last_announce)
        }))
      }
    });
  } catch (error) {
    console.error('获取 peer 信息失败:', error);
    res.status(500).json({ error: '获取 peer 信息失败' });
  }
});

module.exports = router;

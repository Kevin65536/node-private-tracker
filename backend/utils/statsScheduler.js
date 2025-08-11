const cron = require('node-cron');
const { Sequelize } = require('sequelize');
const { 
  User, 
  UserStats, 
  Download, 
  Torrent, 
  AnnounceLog,
  PointsLog 
} = require('../models');
const pointsConfig = require('../config/points');

/**
 * 统计任务调度器
 * 负责定期更新用户统计数据和清理过期数据
 */
class StatsScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * 启动所有定时任务
   */
  start() {
    if (this.isRunning) {
      console.log('统计调度器已在运行');
      return;
    }

    console.log('启动统计调度器...');

    // 每小时更新活跃种子统计
    this.jobs.set('updateActiveStats', cron.schedule('0 * * * *', async () => {
      await this.updateActiveStats();
    }, { scheduled: false }));

    // 每天凌晨2点更新用户统计 - 暂时禁用以防止数据覆盖
    // TODO: 修复Download表数据逻辑后再启用
    // this.jobs.set('updateUserStats', cron.schedule('0 2 * * *', async () => {
    //   await this.updateAllUserStats();
    // }, { scheduled: false }));

    // 每周清理旧的announce日志
    this.jobs.set('cleanupLogs', cron.schedule('0 3 * * 0', async () => {
      await this.cleanupOldLogs();
    }, { scheduled: false }));

    // 启动所有任务
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`✅ 已启动任务: ${name}`);
    });

    this.isRunning = true;
    console.log('统计调度器启动完成');
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    if (!this.isRunning) {
      console.log('统计调度器未运行');
      return;
    }

    console.log('停止统计调度器...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️  已停止任务: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('统计调度器已停止');
  }

  /**
   * 更新活跃种子统计
   */
  async updateActiveStats() {
    try {
      console.log('开始更新活跃种子统计...');
      const startTime = Date.now();

      // 更新所有用户的活跃种子统计
      const users = await User.findAll({
        where: { status: 'active' },
        attributes: ['id']
      });

      for (const user of users) {
        await this.updateUserActiveStats(user.id);
      }

      // 做种/下载时长累加与时长积分发放
      await this.awardSeedingTimeAndPoints();

      const duration = Date.now() - startTime;
      console.log(`✅ 活跃种子统计更新完成，耗时: ${duration}ms`);

    } catch (error) {
      console.error('更新活跃种子统计失败:', error);
    }
  }

  /**
   * 更新单个用户的活跃种子统计
   */
  async updateUserActiveStats(userId) {
    try {
      // 获取用户正在做种和下载的种子数量
      const [seedingCount, leechingCount] = await Promise.all([
        Download.count({
          where: {
            user_id: userId,
            status: 'seeding',
            left: 0
          }
        }),
        Download.count({
          where: {
            user_id: userId,
            status: 'downloading',
            left: { [Sequelize.Op.gt]: 0 }
          }
        })
      ]);

      // 更新用户统计
      const [userStats] = await UserStats.findOrCreate({
        where: { user_id: userId },
        defaults: {
          torrents_seeding: 0,
          torrents_leeching: 0
        }
      });

      await userStats.update({
        torrents_seeding: seedingCount,
        torrents_leeching: leechingCount
      });

    } catch (error) {
      console.error(`更新用户 ${userId} 活跃统计失败:`, error);
    }
  }

  /**
   * 更新所有用户统计
   */
  async updateAllUserStats() {
    try {
      console.log('开始更新所有用户统计...');
      const startTime = Date.now();

      const users = await User.findAll({
        attributes: ['id']
      });

      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          await this.recalculateUserStats(user.id);
          successCount++;
        } catch (error) {
          console.error(`更新用户 ${user.id} 统计失败:`, error);
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ 用户统计更新完成，成功: ${successCount}，失败: ${errorCount}，耗时: ${duration}ms`);

    } catch (error) {
      console.error('批量更新用户统计失败:', error);
    }
  }

  /**
   * 重新计算用户统计数据
   */
  async recalculateUserStats(userId) {
    try {
      // 从下载记录计算上传下载总量
      const downloadStats = await Download.findAll({
        where: { user_id: userId },
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
          [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded']
        ],
        raw: true
      });

      // 计算用户上传的种子数量
      const uploadedTorrents = await Torrent.count({
        where: { uploader_id: userId }
      });

      // 计算当前活跃种子数量
      const [seedingCount, leechingCount] = await Promise.all([
        Download.count({
          where: {
            user_id: userId,
            status: 'seeding'
          }
        }),
        Download.count({
          where: {
            user_id: userId,
            status: 'downloading'
          }
        })
      ]);

      const totalUploaded = parseInt(downloadStats[0]?.total_uploaded) || 0;
      const totalDownloaded = parseInt(downloadStats[0]?.total_downloaded) || 0;

      // 更新或创建用户统计
      const [userStats] = await UserStats.findOrCreate({
        where: { user_id: userId },
        defaults: {
          uploaded: 0,
          downloaded: 0,
          torrents_uploaded: 0,
          torrents_seeding: 0,
          torrents_leeching: 0
        }
      });

      await userStats.update({
        uploaded: totalUploaded,
        downloaded: totalDownloaded,
        torrents_uploaded: uploadedTorrents,
        torrents_seeding: seedingCount,
        torrents_leeching: leechingCount
      });

    } catch (error) {
      console.error(`重新计算用户 ${userId} 统计失败:`, error);
      throw error;
    }
  }

  /**
   * 清理旧的announce日志
   */
  async cleanupOldLogs() {
    try {
      console.log('开始清理旧的announce日志...');
      const startTime = Date.now();

      // 删除90天前的日志
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const deleteCount = await AnnounceLog.destroy({
        where: {
          created_at: {
            [Sequelize.Op.lt]: ninetyDaysAgo
          }
        }
      });

      const duration = Date.now() - startTime;
      console.log(`✅ 清理announce日志完成，删除 ${deleteCount} 条记录，耗时: ${duration}ms`);

    } catch (error) {
      console.error('清理announce日志失败:', error);
    }
  }

  /**
   * 做种/下载时长累加并按小时发放做种积分
   */
  async awardSeedingTimeAndPoints() {
    const { seeding } = pointsConfig;
    const step = seeding.timeStepSeconds || 3600;

    try {
      // 选取在 considerActiveWithinHours 内有 announce 的 Download 记录
      const activeSince = new Date(Date.now() - (seeding.considerActiveWithinHours || 2) * 3600 * 1000);
      const downloads = await Download.findAll({
        where: {
          last_announce: { [Sequelize.Op.gte]: activeSince },
          status: ['seeding', 'downloading']
        },
        include: [{ model: Torrent, attributes: ['id', 'size', 'seeders', 'created_at'] }]
      });

      // 按用户聚合积分增量
      const userPointDelta = new Map();
      const detailedLogs = []; // 每条记录对应一个做种条目（用于写日志）

      for (const d of downloads) {
        const userId = d.user_id;
        const isSeeding = d.status === 'seeding' || Number(d.left) === 0;
        const isLeeching = !isSeeding;

        // 累加时长
        const [stats] = await UserStats.findOrCreate({
          where: { user_id: userId },
          defaults: { uploaded: 0, downloaded: 0, bonus_points: 0, seedtime: 0, leechtime: 0, torrents_uploaded: 0, torrents_seeding: 0, torrents_leeching: 0, invitations: 0 }
        });

        if (isSeeding) {
          await stats.increment({ seedtime: step });
        } else {
          await stats.increment({ leechtime: step });
        }

        // 仅做种时长产生积分
        if (isSeeding) {
          const sizeGiB = Math.max(0, (parseFloat(d.Torrent?.size) || 0) / (1024 * 1024 * 1024));
          const seeders = Math.max(0, parseInt(d.Torrent?.seeders || 0));
          const createdAt = d.Torrent?.created_at || d.Torrent?.createdAt;
          const isNew = createdAt ? (Date.now() - new Date(createdAt).getTime()) < (seeding.newTorrentWindowHours || 72) * 3600 * 1000 : false;

          let perHour = (seeding.basePerHour || 0) 
            + (seeding.sizeSqrtK || 0) * Math.sqrt(sizeGiB)
            + (seeding.scarcityK || 0) / Math.sqrt(seeders + 1);

          if (isNew) perHour += (seeding.newTorrentBonus || 0);

          let tierExtra = 0;
          if (Array.isArray(seeding.scarcityTiers) && seeding.scarcityTiers.length > 0) {
            for (const tier of seeding.scarcityTiers) {
              if (typeof tier.maxSeeders === 'number' && seeders <= tier.maxSeeders) {
                tierExtra = Math.max(tierExtra, parseFloat(tier.bonusPerHour) || 0);
              }
            }
            perHour += tierExtra;
          }

          // 向下保留两位小数
          perHour = Math.floor(perHour * 100) / 100;

          if (perHour > 0) {
            const prev = userPointDelta.get(userId) || 0;
            userPointDelta.set(userId, prev + perHour);
            detailedLogs.push({ userId, delta: perHour, context: { torrent_id: d.torrent_id, sizeGiB, seeders, isNew, stepSeconds: step, tierExtra } });
          }
        }
      }

      // 批量更新用户积分
      for (const [userId, delta] of userPointDelta.entries()) {
        const stats = await UserStats.findOne({ where: { user_id: userId } });
        if (!stats) continue;
        const current = parseFloat(stats.bonus_points) || 0;
        const next = Math.max(0, Math.round((current + delta) * 100) / 100);
        await stats.update({ bonus_points: next });

        // 写入该用户的汇总积分日志（一次记录，包含所有做种项目的总和）
        const userLogs = detailedLogs.filter(x => x.userId === userId);
        const contextSummary = {
          totalTorrents: userLogs.length,
          totalDelta: delta,
          stepSeconds: step,
          details: userLogs.map(item => ({
            torrent_id: item.context.torrent_id,
            sizeGiB: item.context.sizeGiB,
            seeders: item.context.seeders,
            isNew: item.context.isNew,
            delta: item.delta
          }))
        };

        try {
          await PointsLog.create({
            user_id: userId,
            change: Math.round(delta * 100) / 100,
            reason: 'seeding_hourly',
            balance_after: next,
            context: contextSummary
          });
        } catch (logErr) {
          console.error('写入时长积分日志失败:', logErr);
        }

        console.log(`⏫ 做种时长奖励：用户 ${userId} +${delta.toFixed(2)} BP（累计=${next.toFixed(2)}）`);
      }

    } catch (err) {
      console.error('做种时长与积分发放失败:', err);
    }
  }

  /**
   * 手动触发所有统计更新
   */
  async manualUpdate() {
    console.log('手动触发统计更新...');
    
    await Promise.all([
      this.updateActiveStats(),
      this.updateAllUserStats()
    ]);
    
    console.log('手动统计更新完成');
  }

  /**
   * 获取调度器状态
   */
  getStatus() {
    return {
      running: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      next_runs: Array.from(this.jobs.entries()).map(([name, job]) => ({
        name,
        next_run: job.nextDates().toString()
      }))
    };
  }
}

// 导出单例实例
const statsScheduler = new StatsScheduler();

module.exports = statsScheduler;

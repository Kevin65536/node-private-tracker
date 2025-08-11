// 全站积分与奖励参数配置（可随时调整）
module.exports = {
  // 流量即时积分（tracker announce 增量结算）
  traffic: {
    // 每上传 1GB 获得的积分
    uploadPerGB: 1.0,
    // 每下载 1GB 扣除的积分（适度降低下载惩罚，保护新人）
    downloadPenaltyPerGB: 0.5
  },

  // 做种时长积分（按小时结算）
  seeding: {
    // 基础 BP/小时（每个正在做种的种子）
    basePerHour: 0.2,
    // 体积项系数：k1 * sqrt(sizeGiB)
    sizeSqrtK: 0.15,
    // 稀缺项系数：k2 / sqrt(seeders + 1)
    scarcityK: 0.6,
    // 新种额外加成（在新种窗口内）
    newTorrentBonus: 0.5,
    // 新种窗口（小时），用于冷启动激励
    newTorrentWindowHours: 72,
    // 认为“活跃”的 announce 时间窗口（小时），超过则暂不计时/积分
    considerActiveWithinHours: 2,
    // 结算步长（秒），与调度频率一致（每小时）
    timeStepSeconds: 3600,
    // 稀缺分层加成（按小时，叠加在上式基础上）
    // 当实时做种数 <= 对应 maxSeeders 时，附加 bonusPerHour
    scarcityTiers: [
      { maxSeeders: 0, bonusPerHour: 0.8 },
      { maxSeeders: 1, bonusPerHour: 0.6 },
      { maxSeeders: 2, bonusPerHour: 0.4 },
      { maxSeeders: 5, bonusPerHour: 0.2 }
    ]
  },

  // 审核/新种一次性奖励
  approval: {
    // 审核通过固定奖励
    fixedBonus: 10,
    // 体积奖励系数：sizeBonus = min(maxSizeBonus, sizeLog2Factor * log2(sizeGiB + 1))
    sizeLog2Factor: 0.5,
    maxSizeBonus: 5
  }
};

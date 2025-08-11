# PT站积分规则说明

本文档描述当前站点的积分（Bonus Points）计算与发放规则，以及相关参数配置位置，便于后续调整与透明化展示。

## 参数配置文件

- 位置：`backend/config/points.js`
- 分类：
  - traffic（流量类）
  - seeding（做种时长类）
  - approval（审核通过奖励）

示例（实际请以代码为准）：

```js
module.exports = {
  traffic: {
    uploadPerGB: 1.0,
    downloadPenaltyPerGB: 0.5
  },
  seeding: {
    basePerHour: 0.5,
    sizeSqrtK: 0.2,
    scarcityK: 0.3,
    newTorrentBonus: 0.2,
    newTorrentWindowHours: 48,
    considerActiveWithinHours: 12,
    timeStepSeconds: 3600,
    scarcityTiers: [
      { maxSeeders: 0, extra: 0.8 },
      { maxSeeders: 1, extra: 0.6 },
      { maxSeeders: 2, extra: 0.4 },
      { maxSeeders: 5, extra: 0.2 }
    ]
  },
  approval: {
    fixedBonus: 2.0,
    sizeLog2Factor: 0.5,
    maxSizeBonus: 5.0
  }
};
```

## 变动记录（PointsLog）

- 模型：`backend/models/PointsLog.js`
- 表名：`points_log`
- 字段：
  - user_id: 用户
  - change: 本次积分变动值（正负皆可，保留两位小数）
  - reason: 变动原因（'traffic' | 'seeding_hourly' | 'approval_bonus' | 'admin_adjust' 等）
  - balance_after: 变动后的积分余额
  - context: JSON 上下文信息（如 torrent_id、sizeGiB、seeders、stepSeconds、rates 等）
- 记录点：
  - 流量类（announce 时）在 `backend/utils/tracker.js` 中写入 reason='traffic'
  - 做种时长类（调度器）在 `backend/utils/statsScheduler.js` 中写入 reason='seeding_hourly'
  - 审核奖励在 `backend/routes/admin.js` 中写入 reason='approval_bonus'

## 规则细则

### 1. 流量类（traffic）

- 触发时机：Tracker announce 更新上传/下载时
- 计算：
  - 上传积分：上传增量(GB) × uploadPerGB
  - 下载扣分：下载增量(GB) × downloadPenaltyPerGB（通常为负向影响）
- 日志：reason='traffic'，context 包含 uploadedDiff、downloadedDiff、rates

### 2. 做种时长类（seeding_hourly）

- 触发时机：调度器每小时扫描活跃 Peer 并累计做种/吸血时长
- 基本积分：basePerHour × (stepSeconds / 3600)
- 体积加成：sizeSqrtK × sqrt(sizeGiB) × (stepSeconds / 3600)
- 稀缺加成（连续函数）：scarcityK × (1 / sqrt(seeders + 1)) × (stepSeconds / 3600)
- 稀缺分段加成（离散阶梯）：根据 seeding.scarcityTiers，按当前做种数落入的区间叠加 extra × (stepSeconds / 3600)
- 新种加成：种子创建时间距今小于 newTorrentWindowHours 时，额外 + newTorrentBonus × (stepSeconds / 3600)
- 聚合：对同一用户在本次周期内来自多个种子的积分，汇总后一次性记入 `UserStats.bonus_points`。
- 日志：每个种子会记录一条 reason='seeding_hourly' 的日志，包含 sizeGiB、seeders、isNew、stepSeconds、tierExtra 等上下文。

### 3. 审核奖励（approval）

- 触发时机：管理员审核通过单个或批量种子
- 计算公式：
  - totalBonus = fixedBonus + min(maxSizeBonus, sizeLog2Factor × log2(sizeGiB + 1))
  - 结果保留两位小数
- 日志：reason='approval_bonus'，context 包含 torrent_id、sizeGiB

## 前端展示

- 用户个人页 `frontend/src/pages/UserProfilePage.js`：
  - 积分余额展示：来自 `/users/stats` 接口的 `bonus_points`
  - 积分日志：通过新接口 `GET /api/users/points-log?page=&limit=&reason=` 拉取，表格展示时间、变动、类型、说明、余额

## 调参建议

- 根据站点活跃度，优先调整 seeding.basePerHour 和 scarcityTiers，确保稀缺资源有明显激励
- 适度提高 approval.fixedBonus 鼓励自发发种；log2 体积项限制大体积种子的边际收益
- traffic.downloadPenaltyPerGB 可設定为 0.3~0.7 以平衡下载带来的积分消耗

## 安全与校验

- 所有写入积分的入口均记录 PointsLog，便于审计
- 管理员可后续增加 admin 调整接口（reason='admin_adjust'）对异常积分做人工纠正

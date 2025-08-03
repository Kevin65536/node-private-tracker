// 测试数据格式化函数
function formatValue(stats, type) {
  if (!stats) return 'N/A';
  
  switch (type) {
    case 'uploaded':
      return formatSize(stats.uploaded || 0);
    case 'downloaded':
      return formatSize(stats.downloaded || 0);
    case 'ratio':
      const ratio = parseFloat(stats.ratio);
      if (isNaN(ratio) || ratio === 0) {
        return stats.uploaded > 0 ? '∞' : '0.00';
      }
      return ratio.toFixed(2);
    case 'seedtime':
      return formatTime(stats.seedtime || 0);
    case 'bonus_points':
      const bonusPoints = parseFloat(stats.bonus_points);
      return isNaN(bonusPoints) ? '0' : Math.floor(bonusPoints).toString();
    default:
      return 'N/A';
  }
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds) {
  if (!seconds || seconds === 0) return '0 小时';
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days}天 ${hours % 24}小时`;
  }
  return `${hours}小时`;
}

// 测试数据
const testData = [
  {
    stats: {
      uploaded: 5368709120, // 5GB
      downloaded: 2147483648, // 2GB
      ratio: 2.5,
      bonus_points: "1250.50", // 字符串类型
      seedtime: 604800 // 7天
    }
  },
  {
    stats: {
      uploaded: 0,
      downloaded: 0,
      ratio: null,
      bonus_points: null,
      seedtime: 0
    }
  },
  {
    stats: {
      uploaded: 1073741824, // 1GB
      downloaded: 0,
      ratio: Infinity,
      bonus_points: 890,
      seedtime: 432000 // 5天
    }
  }
];

// 测试所有类型
const types = ['uploaded', 'downloaded', 'ratio', 'bonus_points', 'seedtime'];

console.log('测试格式化函数...\n');

testData.forEach((item, index) => {
  console.log(`=== 测试数据 ${index + 1} ===`);
  console.log('原始数据:', item.stats);
  
  types.forEach(type => {
    try {
      const result = formatValue(item.stats, type);
      console.log(`${type}: ${result}`);
    } catch (error) {
      console.error(`${type} 格式化失败:`, error.message);
    }
  });
  
  console.log('');
});

console.log('测试完成！');

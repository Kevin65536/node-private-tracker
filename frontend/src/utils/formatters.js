// 格式化工具函数

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} - 格式化后的字符串
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化字节大小（别名）
 * @param {number|string} bytes - 字节数
 * @returns {string} - 格式化后的字符串
 */
export const formatBytes = (bytes) => {
  const numBytes = parseInt(bytes) || 0;
  if (numBytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化时间长度
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化后的时间字符串
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0秒';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);
  
  return parts.join(' ');
};

/**
 * 格式化日期
 * @param {string|Date} dateString - 日期字符串或日期对象
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    let date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.warn('无效的日期:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('日期格式化错误:', error, '原始值:', dateString);
    return 'Invalid Date';
  }
};

/**
 * 格式化相对时间
 * @param {string|Date} dateString - 日期字符串或日期对象
 * @returns {string} - 相对时间字符串
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    
    return formatDate(dateString);
  } catch (error) {
    return formatDate(dateString);
  }
};

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num - 数字
 * @returns {string} - 格式化后的数字字符串
 */
export const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('zh-CN');
};

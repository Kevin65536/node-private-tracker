import axios from 'axios';
import { getApiBaseUrl, testApiConnection, showNetworkConfig } from '../utils/networkConfig';

// 获取API基础URL
const API_BASE_URL = getApiBaseUrl();

// 在开发环境下显示网络配置信息
if (process.env.NODE_ENV === 'development') {
  showNetworkConfig();
}

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('发送API请求:', config.method?.toUpperCase(), config.url, '完整URL:', API_BASE_URL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理通用错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: (userData) => api.post('/auth/register', userData),
  
  // 用户登录
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 验证token
  verify: () => api.get('/auth/verify'),
};

// 用户相关API
export const userAPI = {
  // 获取用户资料
  getProfile: () => api.get('/users/profile'),
  
  // 更新用户资料
  updateProfile: (userData) => api.put('/users/profile', userData),
  
  // 获取用户统计
  getStats: () => api.get('/users/stats'),
  
  // 获取用户passkey
  getPasskey: () => api.get('/users/passkey'),
  
  // 重新生成passkey
  regeneratePasskey: () => api.post('/users/passkey/regenerate'),
  
  // 获取用户列表（管理员）
  getUsers: (params) => api.get('/users', { params }),
  
  // 更新用户状态（管理员）
  updateUserStatus: (userId, status) => api.patch(`/users/${userId}/status`, { status }),
};

// 种子相关API
export const torrentAPI = {
  // 获取种子列表
  getTorrents: (params) => api.get('/torrents', { params }),
  
  // 获取种子详情
  getTorrent: (id) => api.get(`/torrents/${id}`),
  
  // 上传种子
  uploadTorrent: (formData, onProgress) => api.post('/torrents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  }),
  
  // 下载种子文件
  downloadTorrent: (id) => api.get(`/torrents/${id}/download`, {
    responseType: 'blob',
  }),
  
  // 获取上传配置信息
  getUploadInfo: () => api.get('/upload/info'),
  
  // 获取分类列表
  getCategories: () => api.get('/torrents/categories/list'),
};

// 通用API工具
export const apiUtils = {
  // 上传文件的通用方法
  uploadFile: (endpoint, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  },
  
  // 格式化文件大小
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // 格式化比率
  formatRatio: (uploaded, downloaded) => {
    if (downloaded === 0) {
      return uploaded > 0 ? '∞' : '1.00';
    }
    return (uploaded / downloaded).toFixed(2);
  },
  
  // 格式化日期
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  },
};

export default api;

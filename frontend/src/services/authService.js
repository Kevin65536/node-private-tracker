import { authAPI, userAPI } from './api';

export const authService = {
  // 登录
  login: (credentials) => authAPI.login(credentials),
  
  // 注册
  register: (userData) => authAPI.register(userData),
  
  // 验证token
  verify: () => authAPI.verify(),
  
  // 获取用户资料
  getUserProfile: () => userAPI.getProfile(),
  
  // 更新用户资料
  updateUserProfile: (userData) => userAPI.updateProfile(userData),
  
  // 获取用户统计
  getUserStats: () => userAPI.getStats(),
  
  // 获取用户passkey
  getUserPasskey: () => userAPI.getPasskey(),
  
  // 重新生成passkey
  regeneratePasskey: () => userAPI.regeneratePasskey(),
  
  // 登出
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  
  // 检查是否已登录
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
  
  // 获取当前用户信息
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // 保存用户信息
  saveUser: (user, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export default authService;

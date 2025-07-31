import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // 验证token是否有效
          const response = await authAPI.verify();
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token无效，清除本地存储
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 登录函数
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user: userData, token } = response.data;

      // 保存到本地存储
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // 更新状态
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error || '登录失败';
      return { success: false, error: message };
    }
  };

  // 注册函数
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user: newUser, token } = response.data;

      // 保存到本地存储
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(newUser));

      // 更新状态
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.error || '注册失败';
      return { success: false, error: message };
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // 更新用户信息
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // 检查用户权限
  const hasRole = (role) => {
    if (!user) return false;
    if (role === 'admin') return user.role === 'admin';
    return true; // 普通用户默认有基本权限
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

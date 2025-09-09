import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ContentCopy,
  Refresh,
  Download,
  Settings,
  Code,
  Computer,
  Security
} from '@mui/icons-material';
import { authService } from '../services/authService';
import api from '../services/api';

const ClientConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [passkeyData, setPasskeyData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [tools, setTools] = useState([]);
  const [showPasskey, setShowPasskey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行获取所有数据
      const [profileResponse, passkeyResponse, toolsResponse] = await Promise.all([
        authService.getUserProfile(),
        authService.getUserPasskey(),
        api.get('/tools/list')
      ]);

      setUserProfile(profileResponse.data.user);
      setPasskeyData(passkeyResponse.data);
      setTools(toolsResponse.data.tools);
    } catch (error) {
      console.error('获取数据失败:', error);
      setError('获取数据失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePasskey = async () => {
    if (!window.confirm('确定要重新生成 Passkey 吗？重新生成后需要更新所有 BT 客户端配置。')) {
      return;
    }

    try {
      setRegenerating(true);
      setError(null);
      
      const response = await authService.regeneratePasskey();
      setPasskeyData(response.data);
      showSnackbar('Passkey 重新生成成功！', 'success');
    } catch (error) {
      console.error('重新生成 Passkey 失败:', error);
      setError('重新生成 Passkey 失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar(`${label} 已复制到剪贴板`, 'success');
    } catch (err) {
      showSnackbar('复制失败，请手动选择并复制', 'error');
    }
  };

  const downloadTool = async (toolName) => {
    try {
      const response = await api.get(`/tools/ip-management/${toolName}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', toolName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar(`${toolName} 下载成功`, 'success');
    } catch (error) {
      console.error('下载失败:', error);
      showSnackbar('下载失败: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <div className="user-settings-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>加载用户设置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-settings-page">
      <div className="container">
        <h1>用户设置</h1>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {success}
          </div>
        )}

        {/* 用户基本信息 */}
        {userProfile && (
          <div className="settings-section">
            <h2>基本信息</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>用户名:</label>
                <span>{userProfile.username}</span>
              </div>
              <div className="info-item">
                <label>邮箱:</label>
                <span>{userProfile.email}</span>
              </div>
              <div className="info-item">
                <label>角色:</label>
                <span className={`role ${userProfile.role}`}>
                  {userProfile.role === 'admin' ? '管理员' : '用户'}
                </span>
              </div>
              <div className="info-item">
                <label>状态:</label>
                <span className={`status ${userProfile.status}`}>
                  {userProfile.status === 'active' ? '正常' : userProfile.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Passkey 管理 */}
        {passkeyData && (
          <div className="settings-section passkey-section">
            <h2>🔑 Passkey 管理</h2>
            <div className="passkey-info">
              <p className="description">
                Passkey 是您在 PT 站制作和下载种子时使用的个人密钥。请妥善保管，不要与他人分享。
              </p>

              <div className="passkey-container">
                <div className="passkey-field">
                  <label>Your Passkey:</label>
                  <div className="passkey-input-group">
                    <input
                      type={showPasskey ? "text" : "password"}
                      value={passkeyData.passkey}
                      readOnly
                      className="passkey-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasskey(!showPasskey)}
                      className="btn btn-toggle"
                      title={showPasskey ? "隐藏" : "显示"}
                    >
                      {showPasskey ? "👁️" : "👁️‍🗨️"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(passkeyData.passkey, 'Passkey')}
                      className="btn btn-copy"
                      title="复制 Passkey"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="announce-url-field">
                  <label>Tracker Announce URL:</label>
                  <div className="announce-input-group">
                    <input
                      type="text"
                      value={passkeyData.announce_url}
                      readOnly
                      className="announce-input"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(passkeyData.announce_url, 'Tracker URL')}
                      className="btn btn-copy"
                      title="复制 Tracker URL"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="passkey-actions">
                  <button
                    type="button"
                    onClick={handleRegeneratePasskey}
                    disabled={regenerating}
                    className="btn btn-danger"
                  >
                    {regenerating ? '重新生成中...' : '🔄 重新生成 Passkey'}
                  </button>
                </div>
              </div>
            </div>

            {/* 使用说明 */}
            <div className="usage-instructions">
              <h3>📋 种子制作指南</h3>
              <div className="instructions-grid">
                <div className="instruction-card">
                  <h4>1. 在 qBittorrent 中制作种子</h4>
                  <ul>
                    <li>选择要分享的文件或文件夹</li>
                    <li>在 "Tracker URL" 字段填入上述 URL</li>
                    <li>⚠️ <strong>必须勾选"私有种子"选项</strong></li>
                    <li>建议勾选"完成后开始做种"</li>
                  </ul>
                </div>
                <div className="instruction-card">
                  <h4>2. 上传种子到 PT 站</h4>
                  <ul>
                    <li>种子制作完成后获得 .torrent 文件</li>
                    <li>通过网站上传页面上传种子</li>
                    <li>填写种子描述和分类信息</li>
                    <li>等待管理员审核通过</li>
                  </ul>
                </div>
                <div className="instruction-card">
                  <h4>3. 开始做种和下载</h4>
                  <ul>
                    <li>保持 qBittorrent 运行以提供做种</li>
                    <li>下载他人种子时也使用相同配置</li>
                    <li>维持良好的上传下载比例</li>
                    <li>积极参与社区分享</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 安全提醒 */}
            <div className="security-notice">
              <h3>🔒 安全提醒</h3>
              <div className="notice-content">
                <ul>
                  <li><strong>请勿分享您的 Passkey:</strong> 这是您的个人身份标识</li>
                  <li><strong>定期检查活动:</strong> 在统计页面查看您的下载活动</li>
                  <li><strong>发现异常立即重新生成:</strong> 如果怀疑 Passkey 泄露</li>
                  <li><strong>备份种子文件:</strong> 重新生成 Passkey 后需要重新配置客户端</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettingsPage;

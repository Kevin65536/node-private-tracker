import React, { useState, useEffect } from 'react';
import { testApiConnection, getApiBaseUrl, showNetworkConfig } from '../utils/networkConfig';

/**
 * API连接状态组件
 * 显示当前API连接状态和网络信息
 */
const ApiConnectionStatus = ({ showDetails = false }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'checking', // checking, connected, error
    apiUrl: '',
    lastCheck: null,
    error: null,
    responseTime: null
  });

  const checkConnection = async () => {
    const apiUrl = getApiBaseUrl();
    setConnectionStatus(prev => ({ 
      ...prev, 
      status: 'checking', 
      apiUrl,
      error: null 
    }));

    const startTime = Date.now();
    const result = await testApiConnection(apiUrl);
    const responseTime = Date.now() - startTime;

    setConnectionStatus({
      status: result.success ? 'connected' : 'error',
      apiUrl,
      lastCheck: new Date(),
      error: result.success ? null : result.error,
      responseTime: result.success ? responseTime : null
    });
  };

  useEffect(() => {
    checkConnection();
    // 每30秒检查一次连接状态
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'checking':
        return '🔄';
      case 'connected':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus.status) {
      case 'checking':
        return '检测中...';
      case 'connected':
        return '已连接';
      case 'error':
        return '连接失败';
      default:
        return '未知状态';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'checking':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  if (!showDetails) {
    // 简单模式：只显示状态图标
    return (
      <span 
        title={`API状态: ${getStatusText()} - ${connectionStatus.apiUrl}`}
        style={{ color: getStatusColor(), cursor: 'help' }}
      >
        {getStatusIcon()}
      </span>
    );
  }

  // 详细模式：显示完整信息
  return (
    <div style={{ 
      padding: '12px', 
      border: '1px solid #ddd', 
      borderRadius: '4px',
      backgroundColor: '#f8f9fa',
      fontSize: '14px'
    }}>
      <div style={{ marginBottom: '8px' }}>
        <strong>API连接状态:</strong>
        <span style={{ marginLeft: '8px', color: getStatusColor() }}>
          {getStatusIcon()} {getStatusText()}
        </span>
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        <strong>API地址:</strong> 
        <code style={{ marginLeft: '8px', backgroundColor: '#e9ecef', padding: '2px 4px' }}>
          {connectionStatus.apiUrl}
        </code>
      </div>
      
      {connectionStatus.responseTime && (
        <div style={{ marginBottom: '4px' }}>
          <strong>响应时间:</strong> {connectionStatus.responseTime}ms
        </div>
      )}
      
      {connectionStatus.lastCheck && (
        <div style={{ marginBottom: '4px' }}>
          <strong>最后检查:</strong> {connectionStatus.lastCheck.toLocaleTimeString()}
        </div>
      )}
      
      {connectionStatus.error && (
        <div style={{ color: '#dc3545', marginTop: '8px' }}>
          <strong>错误信息:</strong> {connectionStatus.error}
        </div>
      )}
      
      <div style={{ marginTop: '8px' }}>
        <button 
          onClick={checkConnection}
          disabled={connectionStatus.status === 'checking'}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: connectionStatus.status === 'checking' ? 'not-allowed' : 'pointer'
          }}
        >
          {connectionStatus.status === 'checking' ? '检测中...' : '重新检测'}
        </button>
        
        <button 
          onClick={() => showNetworkConfig()}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
        >
          查看网络配置
        </button>
      </div>
    </div>
  );
};

export default ApiConnectionStatus;

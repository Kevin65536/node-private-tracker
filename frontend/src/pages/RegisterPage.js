import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    invitationCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // 清除该字段的错误
    if (fieldErrors[e.target.name]) {
      setFieldErrors({
        ...fieldErrors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    // 用户名验证
    if (!formData.username) {
      errors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      errors.username = '用户名至少3个字符';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      errors.username = '用户名只能包含字母和数字';
    }

    // 邮箱验证
    if (!formData.email) {
      errors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    // 密码验证
    if (!formData.password) {
      errors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      errors.password = '密码至少6个字符';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = '密码必须包含大小写字母和数字';
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // 客户端验证
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);
      
      if (result.success) {
        navigate('/');
      } else {
        if (result.error?.includes('details')) {
          // 服务器验证错误
          const serverErrors = {};
          result.error.details?.forEach(detail => {
            serverErrors[detail.param] = detail.msg;
          });
          setFieldErrors(serverErrors);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" gutterBottom>
              🎓 LZU PT站
            </Typography>
            <Typography variant="h5" color="text.secondary">
              用户注册
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="用户名"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="邮箱地址"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="密码"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="确认密码"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
            />
            
            <TextField
              margin="normal"
              fullWidth
              name="invitationCode"
              label="邀请码（可选）"
              id="invitationCode"
              value={formData.invitationCode}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.invitationCode}
              helperText={fieldErrors.invitationCode || "如果您有邀请码，请输入以获得更多权限"}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '注册'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                {"已有账户？点击登录"}
              </Link>
            </Box>
          </Box>

          {/* 注册说明 */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              注册说明：
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 用户名只能包含字母和数字，长度3-50字符
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 密码必须包含大小写字母和数字，至少6位
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 注册后需要遵守站点规则，维护良好的分享环境
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;

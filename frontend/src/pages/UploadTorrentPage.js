import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { CloudUpload, Info, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { torrentAPI } from '../services/api';

const UploadTorrentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState([]);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    tags: []
  });

  // 文件状态
  const [files, setFiles] = useState({
    torrent: null,
    images: []
  });

  const [currentTag, setCurrentTag] = useState('');

  // 获取上传信息和分类
  useEffect(() => {
    const fetchUploadInfo = async () => {
      try {
        const response = await torrentAPI.getUploadInfo();
        setUploadInfo(response.data);
        setCategories(response.data.categories);
      } catch (error) {
        console.error('获取上传信息失败:', error);
        setError('获取上传信息失败');
      }
    };

    fetchUploadInfo();
  }, []);

  // 检查用户权限
  useEffect(() => {
    // 移除权限检查，所有登录用户都可以上传种子
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    
    if (name === 'torrent') {
      setFiles(prev => ({
        ...prev,
        torrent: selectedFiles[0]
      }));
    } else if (name === 'images') {
      setFiles(prev => ({
        ...prev,
        images: Array.from(selectedFiles)
      }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(currentTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, currentTag.trim()]
        }));
      }
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('请输入种子名称');
      return false;
    }
    if (!formData.category_id) {
      setError('请选择分类');
      return false;
    }
    if (!files.torrent) {
      setError('请选择种子文件');
      return false;
    }
    if (!files.torrent.name.endsWith('.torrent')) {
      setError('请选择正确的.torrent文件');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category_id', formData.category_id);
      submitData.append('tags', JSON.stringify(formData.tags));
      submitData.append('torrent', files.torrent);
      
      files.images.forEach((image, index) => {
        submitData.append('images', image);
      });

      const response = await torrentAPI.uploadTorrent(submitData, (progress) => {
        setUploadProgress(progress);
      });

      setSuccess('种子上传成功！等待管理员审核。');
      setUploadProgress(100);
      
      // 重置表单
      setFormData({
        name: '',
        description: '',
        category_id: '',
        tags: []
      });
      setFiles({
        torrent: null,
        images: []
      });
      
      // 清除文件输入
      document.getElementById('torrent-file').value = '';
      document.getElementById('image-files').value = '';

    } catch (error) {
      console.error('上传失败:', error);
      setError(error.response?.data?.error || '上传失败，请稍后重试');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">请先登录后再上传种子</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            上传种子
          </Typography>
          <Typography variant="body1" color="text.secondary">
            分享你的资源，为PT社区贡献力量
          </Typography>
        </Box>

        {/* 上传规则说明 */}
        {uploadInfo && (
          <Card sx={{ mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Info sx={{ mr: 1 }} />
                <Typography variant="h6">上传规则</Typography>
              </Box>
              <Typography variant="body2">
                • 最大文件大小: {(uploadInfo.maxFileSize / 1024 / 1024).toFixed(1)}MB<br/>
                • 允许的文件类型: {uploadInfo.allowedTypes.join(', ')}<br/>
                • 上传的种子需要管理员审核后才能公开<br/>
                • 请确保上传的内容符合站点规则
              </Typography>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* 基本信息 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                基本信息
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="种子名称"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="请输入种子的显示名称"
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel>分类</InputLabel>
                <Select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  label="分类"
                  sx={{
                    '& .MuiSelect-select': {
                      textOverflow: 'unset',
                      overflow: 'visible',
                      whiteSpace: 'nowrap',
                      minWidth: '120px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        minWidth: 200,
                      },
                    },
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem 
                      key={category.id} 
                      value={category.id}
                      sx={{ 
                        minHeight: 40,
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        padding: '8px 16px'
                      }}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              {/* 占位空间 */}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="种子描述"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                disabled={loading}
                placeholder="详细描述种子内容、来源等信息..."
              />
            </Grid>

            {/* 标签 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="标签"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleAddTag}
                disabled={loading}
                placeholder="输入标签后按回车添加"
                helperText="为种子添加标签，便于搜索和分类"
              />
              <Box sx={{ mt: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{ mr: 1, mb: 1 }}
                    disabled={loading}
                  />
                ))}
              </Box>
            </Grid>

            {/* 文件上传 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                文件上传
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  种子文件 *
                </Typography>
                <input
                  id="torrent-file"
                  type="file"
                  name="torrent"
                  accept=".torrent"
                  onChange={handleFileChange}
                  disabled={loading}
                  style={{ width: '100%' }}
                />
                {files.torrent && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    已选择: {files.torrent.name}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  截图/图片 (可选)
                </Typography>
                <input
                  id="image-files"
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading}
                  style={{ width: '100%' }}
                />
                {files.images.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    已选择 {files.images.length} 个文件
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* 上传进度 */}
            {loading && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    上传进度: {uploadProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              </Grid>
            )}

            {/* 提交按钮 */}
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<CloudUpload />}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? '上传中...' : '上传种子'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default UploadTorrentPage;

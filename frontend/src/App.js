import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TorrentsPage from './pages/TorrentsPage';
import TorrentDetailPage from './pages/TorrentDetailPage';
import UploadTorrentPage from './pages/UploadTorrentPage';
import AdminReviewPage from './pages/AdminReviewPage';
import AdminTestPage from './pages/AdminTestPage';
import AdminPage from './pages/AdminPage';
import ImageTestPage from './pages/ImageTestPage';
import NetworkTestPage from './pages/NetworkTestPage';
import StatsPage from './components/StatsPage';
import UserSettingsPage from './pages/UserSettingsPage';

// 创建Material-UI主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", "Microsoft YaHei", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/torrents" element={<TorrentsPage />} />
                <Route path="/torrents/:id" element={<TorrentDetailPage />} />
                <Route path="/upload" element={<UploadTorrentPage />} />
                <Route path="/admin/review" element={<AdminReviewPage />} />
                <Route path="/admin/test" element={<AdminTestPage />} />
                <Route path="/test/images" element={<ImageTestPage />} />
                <Route path="/test/network" element={<NetworkTestPage />} />
                {/* TODO: 添加更多路由 */}
                <Route path="/dashboard" element={<div>个人中心 - 开发中</div>} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/profile" element={<div>个人资料 - 开发中</div>} />
                <Route path="/settings" element={<UserSettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

// 测试前端认证状态的简单脚本
console.log('当前用户token:', localStorage.getItem('authToken'));
console.log('当前用户信息:', localStorage.getItem('user'));

// 如果有token，尝试验证
const token = localStorage.getItem('authToken');
if (token) {
  fetch('http://localhost:3001/api/auth/verify', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('验证结果:', data);
  })
  .catch(error => {
    console.error('验证失败:', error);
  });
} else {
  console.log('没有找到认证token');
}

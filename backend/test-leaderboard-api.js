async function testLeaderboardAPI() {
  try {
    // 使用有效的token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc1NDU2MzQ0OCwiZXhwIjoxNzU1MTY4MjQ4fQ.GKNi3gDg9OOSku_oc9NXXB3o8TgnmY_Y5Ux1ycL4ZzM';
    
    const response = await fetch('http://localhost:3001/api/stats/leaderboard?type=uploaded&limit=3', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('排行榜API响应:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('API请求失败:', response.status, response.statusText);
      const error = await response.text();
      console.error('错误详情:', error);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

testLeaderboardAPI();

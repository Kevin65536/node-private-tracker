// 验证环境变量更新
console.log('=== 验证React环境变量 ===');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('当前工作目录:', process.cwd());

// 读取.env文件内容
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n.env文件内容:');
  console.log(envContent);
} catch (error) {
  console.log('无法读取.env文件:', error.message);
}

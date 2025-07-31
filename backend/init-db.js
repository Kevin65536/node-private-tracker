require('dotenv').config();
const { sequelize, User, UserStats, Category, Torrent, Download, UserPasskey, Peer, AnnounceLog } = require('./models');
const { generatePasskey } = require('./utils/passkey');

async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化数据库...\n');
    
    // 测试数据库连接
    console.log('🔗 正在连接数据库...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');
    
    // 同步所有模型（创建表）
    console.log('📊 正在创建数据库表...');
    await sequelize.sync({ force: false }); // force: false 表示不会删除已存在的表
    console.log('✅ 数据库表创建完成！');
    
    // 检查是否已有管理员用户
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      console.log('👤 正在创建默认管理员用户...');
      
      // 创建默认管理员用户
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@pt.local',
        password: 'admin123456', // 生产环境中请更改此密码
        role: 'admin',
        status: 'active'
      });
      
      // 为管理员创建统计记录
      await UserStats.create({
        user_id: adminUser.id,
        downloaded: 0,
        uploaded: 0,
        ratio: 0,
        points: 1000 // 给管理员1000积分
      });
      
      // 为管理员创建 passkey
      await UserPasskey.create({
        user_id: adminUser.id,
        passkey: generatePasskey(),
        active: true
      });
      
      console.log('✅ 默认管理员用户创建成功！');
      console.log('   用户名: admin');
      console.log('   密码: admin123456');
      console.log('   ⚠️  请及时修改默认密码！');
    } else {
      console.log('✅ 管理员用户已存在');
    }
    
    // 检查是否已有分类数据
    const categoryCount = await Category.count();
    
    if (categoryCount === 0) {
      console.log('📂 正在创建默认分类...');
      
      const defaultCategories = [
        { name: '电影', description: '各类电影资源' },
        { name: '剧集', description: '电视剧、综艺节目' },
        { name: '音乐', description: '音乐专辑、单曲' },
        { name: '软件', description: '应用程序、工具软件' },
        { name: '游戏', description: 'PC游戏、手机游戏' },
        { name: '图书', description: '电子书、有声读物' },
        { name: '学习资料', description: '教程、课程、学术资料' },
        { name: '其他', description: '其他类型资源' }
      ];
      
      await Category.bulkCreate(defaultCategories);
      console.log('✅ 默认分类创建完成！');
    } else {
      console.log('✅ 分类数据已存在');
    }
    
    // 创建测试用户（如果不存在）
    const testUserExists = await User.findOne({ where: { username: 'testuser' } });
    
    if (!testUserExists) {
      console.log('👥 正在创建测试用户...');
      
      const testUser = await User.create({
        username: 'testuser',
        email: 'test@pt.local',
        password: 'test123456',
        role: 'user',
        status: 'active'
      });
      
      // 为测试用户创建统计记录
      await UserStats.create({
        user_id: testUser.id,
        downloaded: 0,
        uploaded: 0,
        ratio: 0,
        points: 100 // 给测试用户100积分
      });
      
      // 为测试用户创建 passkey
      await UserPasskey.create({
        user_id: testUser.id,
        passkey: generatePasskey(),
        active: true
      });
      
      console.log('✅ 测试用户创建成功！');
      console.log('   用户名: testuser');
      console.log('   密码: test123456');
    } else {
      console.log('✅ 测试用户已存在');
    }
    
    // 显示数据库状态
    console.log('\n📊 数据库状态:');
    const userCount = await User.count();
    const categoryCountFinal = await Category.count();
    const torrentCount = await Torrent.count();
    const passkeyCount = await UserPasskey.count();
    
    console.log(`   用户数量: ${userCount}`);
    console.log(`   分类数量: ${categoryCountFinal}`);
    console.log(`   种子数量: ${torrentCount}`);
    console.log(`   Passkey数量: ${passkeyCount}`);
    
    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 下一步操作:');
    console.log('   1. 运行 npm run dev:db 启动开发服务器');
    console.log('   2. 访问 http://localhost:3001 查看API状态');
    console.log('   3. 使用管理员账户登录前端应用');
    console.log('   4. 📡 Tracker 服务已启用！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    console.error('\n🛠️  可能的解决方案:');
    console.error('   1. 确认PostgreSQL服务正在运行');
    console.error('   2. 检查数据库连接配置');
    console.error('   3. 确认数据库权限设置');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行初始化
initializeDatabase();

require('dotenv').config();
const { User, UserPasskey } = require('./models');
const { generatePasskey } = require('./utils/passkey');

async function ensureAdminPasskey() {
    try {
        console.log('🔧 检查admin用户passkey...');
        
        // 查找admin用户
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (!admin) {
            console.log('❌ 未找到admin用户');
            return;
        }
        
        console.log(`✅ 找到admin用户 (ID: ${admin.id})`);
        
        // 检查是否已有passkey
        let passkey = await UserPasskey.findOne({ where: { user_id: admin.id } });
        
        if (!passkey) {
            console.log('🔑 为admin用户生成新的passkey...');
            const newPasskey = generatePasskey();
            
            passkey = await UserPasskey.create({
                user_id: admin.id,
                passkey: newPasskey
            });
            
            console.log(`✅ Admin passkey已生成: ${newPasskey}`);
        } else {
            console.log(`✅ Admin已有passkey: ${passkey.passkey}`);
        }
        
        // 生成正确的announce URL
        const announceUrl = `http://localhost:3001/announce?passkey=${passkey.passkey}`;
        console.log(`📡 Admin的announce URL: ${announceUrl}`);
        
        console.log('\n🔄 请在admin的qBittorrent中：');
        console.log('1. 停止当前种子');
        console.log('2. 删除种子（保留文件）');
        console.log('3. 重新从前端下载种子文件');
        console.log('4. 重新添加种子到qBittorrent');
        
    } catch (error) {
        console.error('处理失败:', error);
    }
}

ensureAdminPasskey().then(() => {
    process.exit(0);
}).catch(console.error);

// 模拟qBittorrent P2P通信测试
const net = require('net');

async function simulateP2PHandshake() {
    console.log('🤝 模拟 BitTorrent P2P 握手');
    console.log('='.repeat(50));
    
    const seederIP = '172.21.222.169';
    const seederPort = 27633;
    const infoHash = '529936d5fc5685f79981fdd060687f32fd75e528'; // 使用实际的info_hash
    
    console.log(`\n📡 尝试连接到做种者: ${seederIP}:${seederPort}`);
    console.log(`🔍 Info Hash: ${infoHash}`);
    
    try {
        const result = await attemptBitTorrentHandshake(seederIP, seederPort, infoHash);
        if (result.success) {
            console.log('✅ BitTorrent 握手成功!');
            console.log(`   对方 Peer ID: ${result.peerId}`);
            console.log(`   协议版本: ${result.protocol}`);
        } else {
            console.log('❌ BitTorrent 握手失败');
            console.log(`   错误: ${result.error}`);
        }
    } catch (error) {
        console.log('❌ 连接失败:', error.message);
    }
    
    console.log('\n💡 如果握手失败，可能的原因:');
    console.log('   1. qBittorrent拒绝了连接请求');
    console.log('   2. Info Hash不匹配');
    console.log('   3. 客户端配置了连接限制');
    console.log('   4. DHT/PEX设置问题');
    
    console.log('\n🔧 建议检查:');
    console.log('   1. qBittorrent设置 -> 连接 -> 启用协议加密');
    console.log('   2. qBittorrent设置 -> 连接 -> 允许传入连接');
    console.log('   3. 检查是否启用了IP过滤');
    console.log('   4. 确认种子文件的Info Hash是否正确');
}

function attemptBitTorrentHandshake(host, port, infoHashHex, timeout = 10000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let result = { success: false };
        
        socket.setTimeout(timeout);
        
        // BitTorrent 握手协议
        const protocolName = 'BitTorrent protocol';
        const protocolLength = Buffer.from([protocolName.length]);
        const protocol = Buffer.from(protocolName);
        const reserved = Buffer.alloc(8); // 8 bytes reserved
        const infoHash = Buffer.from(infoHashHex, 'hex');
        const peerId = Buffer.from('-PT0001-123456789012'); // 模拟peer ID
        
        const handshake = Buffer.concat([
            protocolLength,
            protocol,
            reserved,
            infoHash,
            peerId
        ]);
        
        socket.on('connect', () => {
            console.log('   🔗 TCP连接建立，发送BitTorrent握手...');
            socket.write(handshake);
        });
        
        socket.on('data', (data) => {
            console.log(`   📥 收到响应: ${data.length} 字节`);
            
            if (data.length >= 68) { // 最小握手响应长度
                const responseProtocolLength = data[0];
                const responseProtocol = data.slice(1, 1 + responseProtocolLength).toString();
                const responsePeerId = data.slice(-20).toString();
                
                result = {
                    success: true,
                    protocol: responseProtocol,
                    peerId: responsePeerId
                };
            }
            
            socket.destroy();
            resolve(result);
        });
        
        socket.on('timeout', () => {
            result.error = '握手超时';
            socket.destroy();
            resolve(result);
        });
        
        socket.on('error', (error) => {
            result.error = error.message;
            resolve(result);
        });
        
        socket.on('close', () => {
            if (!result.success && !result.error) {
                result.error = '连接被对方关闭';
            }
            resolve(result);
        });
        
        socket.connect(port, host);
    });
}

simulateP2PHandshake().then(() => {
    process.exit(0);
}).catch(console.error);

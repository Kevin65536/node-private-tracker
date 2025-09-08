const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class IPDetector {
    constructor() {
        this.projectRoot = path.dirname(__filename);
    }

    // 获取本机IP地址
    detectIP() {
        return new Promise((resolve, reject) => {
            exec('ipconfig', (error, stdout) => {
                if (error) {
                    reject(error);
                    return;
                }

                const lines = stdout.split('\n');
                let targetIP = null;

                // 优先查找172.21网段
                for (const line of lines) {
                    if (line.includes('IPv4') && line.includes('172.21')) {
                        const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
                        if (match) {
                            targetIP = match[1];
                            break;
                        }
                    }
                }

                // 如果没找到172.21网段，查找其他内网IP
                if (!targetIP) {
                    for (const line of lines) {
                        if (line.includes('IPv4') && !line.includes('127.0.0.1')) {
                            const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
                            if (match) {
                                const ip = match[1];
                                // 检查是否为内网IP
                                if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
                                    ip.startsWith('172.')) {
                                    targetIP = ip;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (targetIP) {
                    resolve(targetIP);
                } else {
                    reject(new Error('无法获取有效的IP地址'));
                }
            });
        });
    }

    // 更新nginx配置中的所有IP地址
    updateNginxConfig(ip) {
        return new Promise((resolve, reject) => {
            try {
                const nginxConfigPath = path.join(this.projectRoot, 'nginx', 'nginx.conf');
                
                if (!fs.existsSync(nginxConfigPath)) {
                    reject(new Error('nginx.conf 文件不存在'));
                    return;
                }

                let content = fs.readFileSync(nginxConfigPath, 'utf8');
                
                // 更新所有IP地址相关的配置
                const updates = [
                    // HTTP服务器中的server_name
                    { pattern: /server_name\s+[\d.]+;/g, replacement: `server_name ${ip};` },
                    // HTTPS重定向中的IP地址
                    { pattern: /return 301 https:\/\/[\d.]+\$/g, replacement: `return 301 https://${ip}$` },
                    // HTTPS服务器中的server_name（包含pt.lan和IP）
                    { pattern: /server_name pt\.lan \*\.local [\d.]+;/g, replacement: `server_name pt.lan *.local ${ip};` },
                    // 其他可能的IP引用
                    { pattern: /https:\/\/[\d.]+/g, replacement: `https://${ip}` }
                ];

                let hasChanges = false;
                updates.forEach(update => {
                    const oldContent = content;
                    content = content.replace(update.pattern, update.replacement);
                    if (content !== oldContent) {
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    fs.writeFileSync(nginxConfigPath, content);
                    resolve({
                        success: true,
                        message: `nginx.conf 已更新，新IP地址: ${ip}`,
                        updatedFile: nginxConfigPath
                    });
                } else {
                    resolve({
                        success: true,
                        message: `nginx.conf 无需更新，当前IP: ${ip}`,
                        updatedFile: nginxConfigPath
                    });
                }

            } catch (error) {
                reject(new Error(`更新nginx.conf失败: ${error.message}`));
            }
        });
    }

    // 主要方法：检测IP并更新配置
    async updateConfigs() {
        try {
            console.log('正在检测本机IP地址...');
            const ip = await this.detectIP();
            console.log(`✓ 检测到IP地址: ${ip}`);

            console.log('正在更新nginx配置...');
            const nginxResult = await this.updateNginxConfig(ip);
            console.log(`✓ ${nginxResult.message}`);

            return {
                success: true,
                ip: ip,
                results: {
                    nginx: nginxResult
                }
            };

        } catch (error) {
            console.error('✗ IP检测或配置更新失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    console.log('=================================');
    console.log('IP地址检测和配置更新工具');
    console.log('=================================');
    
    const detector = new IPDetector();
    detector.updateConfigs().then(result => {
        if (result.success) {
            console.log('\n✅ IP地址检测和配置更新完成！');
            console.log(`当前IP地址: ${result.ip}`);
        } else {
            console.log('\n❌ 操作失败！');
            console.log(`错误: ${result.error}`);
        }
    });
}

module.exports = IPDetector;

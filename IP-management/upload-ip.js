const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const os = require('os');
const { exec } = require('child_process');

class IPUploader {
    constructor() {
        this.configPath = path.join(__dirname, 'upload-config.json');
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const configContent = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            console.error('错误：无法加载配置文件 upload-config.json');
            console.error('请确保配置文件存在并格式正确');
            process.exit(1);
        }
    }

    // 获取本机IP地址
    getLocalIP() {
        return new Promise((resolve, reject) => {
            // 尝试获取指定网段的IP
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

    // 创建IP信息数据
    createIPData(ip) {
        return {
            ip: ip,
            timestamp: new Date().toISOString(),
            server: this.config.server,
            hostname: os.hostname(),
            platform: os.platform(),
            uptime: os.uptime(),
            urls: {
                frontend: `http://${ip}:${this.config.server.ports.frontend}`,
                backend: `http://${ip}:${this.config.server.ports.backend}`,
                nginx: `http://${ip}:${this.config.server.ports.nginx}`,
                nginx_ssl: `https://${ip}:${this.config.server.ports.nginx_ssl}`,
                tracker: `http://${ip}:${this.config.server.ports.backend}/announce`
            }
        };
    }

    // 上传到GitHub Gist
    uploadToGist(data) {
        return new Promise((resolve, reject) => {
            const gistConfig = this.config.upload.config.gist;
            
            if (!gistConfig.token || gistConfig.token === 'YOUR_GITHUB_TOKEN_HERE') {
                reject(new Error('请在 ip-config.json 中配置有效的 GitHub token'));
                return;
            }

            if (!gistConfig.gistId || gistConfig.gistId === 'YOUR_GIST_ID_HERE') {
                reject(new Error('请在 ip-config.json 中配置有效的 Gist ID'));
                return;
            }

            const postData = JSON.stringify({
                files: {
                    [gistConfig.filename]: {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            });

            const options = {
                hostname: 'api.github.com',
                port: 443,
                path: `/gists/${gistConfig.gistId}`,
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${gistConfig.token}`,
                    'User-Agent': 'PT-Server-IP-Updater',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const response = JSON.parse(responseData);
                            const rawUrl = response.files[gistConfig.filename].raw_url;
                            resolve({
                                success: true,
                                url: rawUrl,
                                message: 'IP地址已成功上传到 GitHub Gist'
                            });
                        } catch (error) {
                            reject(new Error('解析响应失败: ' + error.message));
                        }
                    } else {
                        reject(new Error(`GitHub API 错误: ${res.statusCode} - ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error('上传失败: ' + error.message));
            });

            req.write(postData);
            req.end();
        });
    }

    // 上传到Gitee Pages
    uploadToGitee(data) {
        return new Promise((resolve, reject) => {
            const giteeConfig = this.config.upload.config.gitee;
            
            if (!giteeConfig.token || giteeConfig.token === 'YOUR_GITEE_TOKEN_HERE') {
                reject(new Error('请在 ip-config.json 中配置有效的 Gitee token'));
                return;
            }

            const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
            
            const postData = JSON.stringify({
                message: `Update server IP to ${data.ip}`,
                content: content,
                branch: giteeConfig.branch || 'main'
            });

            const options = {
                hostname: 'gitee.com',
                port: 443,
                path: `/api/v5/repos/${giteeConfig.owner}/${giteeConfig.repo}/contents/${giteeConfig.path}`,
                method: 'PUT',
                headers: {
                    'Authorization': `token ${giteeConfig.token}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        const pagesUrl = `https://${giteeConfig.owner}.gitee.io/${giteeConfig.repo}/${giteeConfig.path}`;
                        resolve({
                            success: true,
                            url: pagesUrl,
                            message: 'IP地址已成功上传到 Gitee Pages'
                        });
                    } else {
                        reject(new Error(`Gitee API 错误: ${res.statusCode} - ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error('上传失败: ' + error.message));
            });

            req.write(postData);
            req.end();
        });
    }

    // 上传到自定义Webhook
    uploadToWebhook(data) {
        return new Promise((resolve, reject) => {
            const webhookConfig = this.config.upload.config.webhook;
            
            if (!webhookConfig.url || webhookConfig.url === 'https://your-webhook-url.com/ip') {
                reject(new Error('请在 ip-config.json 中配置有效的 webhook URL'));
                return;
            }

            const postData = JSON.stringify(data);
            const url = new URL(webhookConfig.url);
            const isHttps = url.protocol === 'https:';

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    ...webhookConfig.headers
                }
            };

            const client = isHttps ? https : http;
            const req = client.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            success: true,
                            url: webhookConfig.url,
                            message: 'IP地址已成功上传到自定义webhook'
                        });
                    } else {
                        reject(new Error(`Webhook 错误: ${res.statusCode} - ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error('上传失败: ' + error.message));
            });

            req.write(postData);
            req.end();
        });
    }

    // 保存到本地文件（用于测试）
    saveToFile(data) {
        return new Promise((resolve, reject) => {
            try {
                const filePath = path.join(__dirname, 'server-ip.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                resolve({
                    success: true,
                    url: filePath,
                    message: 'IP地址已保存到本地文件'
                });
            } catch (error) {
                reject(new Error('保存文件失败: ' + error.message));
            }
        });
    }

    // 主要上传方法
    async uploadIP() {
        try {
            console.log('正在获取本机IP地址...');
            const ip = await this.getLocalIP();
            console.log(`检测到IP地址: ${ip}`);

            const data = this.createIPData(ip);
            console.log('创建IP数据完成');

            if (!this.config.upload.enabled) {
                console.log('IP上传功能已禁用');
                return { success: false, message: 'IP上传功能已禁用' };
            }

            console.log(`使用上传方式: ${this.config.upload.method}`);

            let result;
            switch (this.config.upload.method) {
                case 'gist':
                    result = await this.uploadToGist(data);
                    break;
                case 'gitee':
                    result = await this.uploadToGitee(data);
                    break;
                case 'webhook':
                    result = await this.uploadToWebhook(data);
                    break;
                case 'file':
                    result = await this.saveToFile(data);
                    break;
                default:
                    throw new Error(`不支持的上传方式: ${this.config.upload.method}`);
            }

            console.log('✓ ' + result.message);
            if (result.url) {
                console.log(`访问地址: ${result.url}`);
            }

            return result;

        } catch (error) {
            console.error('✗ IP上传失败:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    console.log('=================================');
    console.log('PT服务器IP地址上传工具');
    console.log('=================================');
    
    const uploader = new IPUploader();
    uploader.uploadIP().then(result => {
        if (result.success) {
            console.log('\n✅ IP地址上传成功！');
            process.exit(0);
        } else {
            console.log('\n❌ IP地址上传失败！');
            process.exit(1);
        }
    }).catch(error => {
        console.error('\n❌ 发生错误:', error.message);
        process.exit(1);
    });
}

module.exports = IPUploader;

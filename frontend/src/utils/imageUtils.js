/**
 * 图片资源工具函数
 * 用于统一处理图片URL的构建逻辑
 */

import { getNetworkInfo } from './networkConfig';

/**
 * 获取图片资源的完整URL
 * @param {string} imagePath - 图片文件名或相对路径
 * @returns {string} 完整的图片URL
 */
export function getImageUrl(imagePath) {
  if (!imagePath) {
    return '';
  }
  
  // 检查是否通过nginx代理访问
  const networkInfo = getNetworkInfo();
  const currentPort = window.location.port;
  const isNginxPort = !currentPort || currentPort === '80' || currentPort === '443';
  
  if (isNginxPort) {
    // 通过nginx代理访问，使用相对路径
    const url = `/uploads/${imagePath}`;
    return url;
  } else {
    // 直接访问前端开发服务器，需要指向后端服务器
    const baseUrl = `http://${window.location.hostname}:3001`;
    const url = `${baseUrl}/uploads/${imagePath}`;
    return url;
  }
}

/**
 * 测试图片URL的可访问性
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<boolean>} 是否可访问
 */
export async function testImageUrl(imageUrl) {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const accessible = response.ok;
    return accessible;
  } catch (error) {
    return false;
  }
}

/**
 * 预加载图片
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<HTMLImageElement>} 加载完成的图片元素
 */
export function preloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = imageUrl;
  });
}

/**
 * 获取图片的缩略图URL（如果有的话）
 * @param {string} imagePath - 原图路径
 * @returns {string} 缩略图URL
 */
export function getThumbnailUrl(imagePath) {
  if (!imagePath) {
    return '';
  }
  
  // 检查是否有缩略图版本（例如：image.jpg -> image_thumb.jpg）
  const parts = imagePath.split('.');
  if (parts.length >= 2) {
    const extension = parts.pop();
    const basename = parts.join('.');
    const thumbnailPath = `${basename}_thumb.${extension}`;
    return getImageUrl(thumbnailPath);
  }
  
  // 没有缩略图，返回原图
  return getImageUrl(imagePath);
}

export default {
  getImageUrl,
  testImageUrl,
  preloadImage,
  getThumbnailUrl
};

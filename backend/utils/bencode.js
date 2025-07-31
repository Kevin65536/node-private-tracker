/**
 * Bencode 编码解码工具
 * BitTorrent 协议使用的数据序列化格式
 */

/**
 * 对数据进行 bencode 编码
 * @param {any} data - 要编码的数据
 * @returns {Buffer} - 编码后的 Buffer
 */
function encode(data) {
  if (typeof data === 'string') {
    return encodeString(data);
  } else if (typeof data === 'number' && Number.isInteger(data)) {
    return encodeInteger(data);
  } else if (Array.isArray(data)) {
    return encodeList(data);
  } else if (typeof data === 'object' && data !== null) {
    return encodeDictionary(data);
  } else if (Buffer.isBuffer(data)) {
    return encodeBuffer(data);
  } else {
    throw new Error(`Unsupported data type: ${typeof data}`);
  }
}

/**
 * 编码字符串
 */
function encodeString(str) {
  const buffer = Buffer.from(str, 'utf8');
  return Buffer.concat([
    Buffer.from(buffer.length + ':', 'ascii'),
    buffer
  ]);
}

/**
 * 编码 Buffer
 */
function encodeBuffer(buffer) {
  return Buffer.concat([
    Buffer.from(buffer.length + ':', 'ascii'),
    buffer
  ]);
}

/**
 * 编码整数
 */
function encodeInteger(num) {
  return Buffer.from(`i${num}e`, 'ascii');
}

/**
 * 编码列表
 */
function encodeList(list) {
  const encoded = list.map(item => encode(item));
  return Buffer.concat([
    Buffer.from('l', 'ascii'),
    ...encoded,
    Buffer.from('e', 'ascii')
  ]);
}

/**
 * 编码字典
 */
function encodeDictionary(dict) {
  const keys = Object.keys(dict).sort(); // 按字典序排序
  const encoded = [];
  
  for (const key of keys) {
    encoded.push(encode(key));
    encoded.push(encode(dict[key]));
  }
  
  return Buffer.concat([
    Buffer.from('d', 'ascii'),
    ...encoded,
    Buffer.from('e', 'ascii')
  ]);
}

/**
 * 解码 bencode 数据
 * @param {Buffer} buffer - 要解码的 Buffer
 * @returns {any} - 解码后的数据
 */
function decode(buffer) {
  const result = decodeNext(buffer, 0);
  return result.value;
}

/**
 * 解码下一个值
 */
function decodeNext(buffer, offset) {
  const firstByte = buffer[offset];
  
  if (firstByte >= 48 && firstByte <= 57) { // 0-9, 字符串
    return decodeString(buffer, offset);
  } else if (firstByte === 105) { // 'i', 整数
    return decodeInteger(buffer, offset);
  } else if (firstByte === 108) { // 'l', 列表
    return decodeList(buffer, offset);
  } else if (firstByte === 100) { // 'd', 字典
    return decodeDictionary(buffer, offset);
  } else {
    throw new Error(`Invalid bencode data at offset ${offset}`);
  }
}

/**
 * 解码字符串
 */
function decodeString(buffer, offset) {
  let colonIndex = offset;
  while (buffer[colonIndex] !== 58) { // ':'
    colonIndex++;
    if (colonIndex >= buffer.length) {
      throw new Error('Invalid string length');
    }
  }
  
  const length = parseInt(buffer.slice(offset, colonIndex).toString('ascii'));
  const start = colonIndex + 1;
  const end = start + length;
  
  if (end > buffer.length) {
    throw new Error('String length exceeds buffer');
  }
  
  return {
    value: buffer.slice(start, end),
    offset: end
  };
}

/**
 * 解码整数
 */
function decodeInteger(buffer, offset) {
  let endIndex = offset + 1;
  while (buffer[endIndex] !== 101) { // 'e'
    endIndex++;
    if (endIndex >= buffer.length) {
      throw new Error('Invalid integer format');
    }
  }
  
  const numStr = buffer.slice(offset + 1, endIndex).toString('ascii');
  const value = parseInt(numStr);
  
  if (isNaN(value)) {
    throw new Error('Invalid integer value');
  }
  
  return {
    value,
    offset: endIndex + 1
  };
}

/**
 * 解码列表
 */
function decodeList(buffer, offset) {
  const list = [];
  let currentOffset = offset + 1; // 跳过 'l'
  
  while (buffer[currentOffset] !== 101) { // 'e'
    const result = decodeNext(buffer, currentOffset);
    list.push(result.value);
    currentOffset = result.offset;
    
    if (currentOffset >= buffer.length) {
      throw new Error('Unterminated list');
    }
  }
  
  return {
    value: list,
    offset: currentOffset + 1
  };
}

/**
 * 解码字典
 */
function decodeDictionary(buffer, offset) {
  const dict = {};
  let currentOffset = offset + 1; // 跳过 'd'
  
  while (buffer[currentOffset] !== 101) { // 'e'
    // 解码键
    const keyResult = decodeNext(buffer, currentOffset);
    const key = keyResult.value.toString('utf8');
    currentOffset = keyResult.offset;
    
    // 解码值
    const valueResult = decodeNext(buffer, currentOffset);
    dict[key] = valueResult.value;
    currentOffset = valueResult.offset;
    
    if (currentOffset >= buffer.length) {
      throw new Error('Unterminated dictionary');
    }
  }
  
  return {
    value: dict,
    offset: currentOffset + 1
  };
}

/**
 * 将解码结果转换为 JavaScript 对象（Buffer 转字符串）
 */
function decodeToObject(buffer) {
  const decoded = decode(buffer);
  return convertBuffersToStrings(decoded);
}

/**
 * 递归转换 Buffer 为字符串
 */
function convertBuffersToStrings(obj) {
  if (Buffer.isBuffer(obj)) {
    return obj.toString('utf8');
  } else if (Array.isArray(obj)) {
    return obj.map(convertBuffersToStrings);
  } else if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertBuffersToStrings(value);
    }
    return result;
  }
  return obj;
}

module.exports = {
  encode,
  decode,
  decodeToObject
};

import { SerializedValue, SerializationConfig } from './types';

// 默认配置
const DEFAULT_CONFIG: Required<SerializationConfig> = {
  maxDepth: 3,
  maxStringLength: 1000,
  maxArrayLength: 100,
};

/**
 * 序列化任意值为可传输的格式
 */
export function serialize(
  value: any,
  config: SerializationConfig = {}
): SerializedValue {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const seen = new WeakSet();
  
  return serializeValue(value, finalConfig, seen, 0);
}

/**
 * 内部递归序列化函数
 */
function serializeValue(
  value: any,
  config: Required<SerializationConfig>,
  seen: WeakSet<object>,
  depth: number
): SerializedValue {
  // 处理 null
  if (value === null) {
    return { type: 'null', value: null };
  }
  
  // 处理 undefined
  if (value === undefined) {
    return { type: 'undefined', value: undefined };
  }
  
  // 处理基础类型
  const type = typeof value;
  
  if (type === 'string') {
    return serializeString(value, config);
  }
  
  if (type === 'number') {
    return { type: 'number', value: value };
  }
  
  if (type === 'boolean') {
    return { type: 'boolean', value: value };
  }
  
  if (type === 'function') {
    return serializeFunction(value);
  }
  
  // 处理 Error 对象
  if (value instanceof Error) {
    return serializeError(value);
  }
  
  // 处理对象和数组（需要循环引用检测）
  if (type === 'object') {
    // 循环引用检测
    if (seen.has(value)) {
      return { type: 'string', value: '[Circular]' };
    }
    
    // 深度限制检查
    if (depth >= config.maxDepth) {
      return { type: 'string', value: '[Max Depth Reached]' };
    }
    
    // 标记为已访问
    seen.add(value);
    
    // 处理数组
    if (Array.isArray(value)) {
      return serializeArray(value, config, seen, depth);
    }
    
    // 处理普通对象
    return serializeObject(value, config, seen, depth);
  }
  
  // 其他类型转为字符串
  return { type: 'string', value: String(value) };
}

/**
 * 序列化字符串（带截断，优化性能）
 */
function serializeString(
  value: string,
  config: Required<SerializationConfig>
): SerializedValue {
  // 快速路径：短字符串直接返回
  if (value.length <= config.maxStringLength) {
    return { type: 'string', value };
  }
  
  // 使用 slice 而不是 substring（性能更好）
  const truncated = value.slice(0, config.maxStringLength);
  return {
    type: 'string',
    value: truncated + `... [truncated, total length: ${value.length}]`,
  };
}

/**
 * 序列化函数
 */
function serializeFunction(fn: Function): SerializedValue {
  const fnStr = fn.toString();
  // 如果函数定义太长，只保留函数签名
  if (fnStr.length > 100) {
    const match = fnStr.match(/^(function\s*\w*\s*\([^)]*\)|[^=]+=>)/);
    if (match) {
      return { type: 'function', value: match[1] + ' {...}' };
    }
  }
  return { type: 'function', value: fnStr };
}

/**
 * 序列化 Error 对象
 */
function serializeError(error: Error): SerializedValue {
  return {
    type: 'error',
    message: error.message,
    stack: error.stack,
  };
}

/**
 * 序列化数组（带长度限制）
 */
function serializeArray(
  arr: any[],
  config: Required<SerializationConfig>,
  seen: WeakSet<object>,
  depth: number
): SerializedValue {
  const length = arr.length;
  const limit = Math.min(length, config.maxArrayLength);
  const serializedItems: SerializedValue[] = [];
  
  for (let i = 0; i < limit; i++) {
    serializedItems.push(serializeValue(arr[i], config, seen, depth + 1));
  }
  
  let preview = `Array(${length})`;
  if (length > config.maxArrayLength) {
    preview += ` [showing first ${config.maxArrayLength} items]`;
  }
  
  return {
    type: 'array',
    value: serializedItems,
    preview,
  };
}

/**
 * 序列化对象（优化：限制属性数量）
 */
function serializeObject(
  obj: any,
  config: Required<SerializationConfig>,
  seen: WeakSet<object>,
  depth: number
): SerializedValue {
  const serializedObj: Record<string, SerializedValue> = {};
  const keys = Object.keys(obj);
  
  // 限制序列化的属性数量，避免大对象导致性能问题
  const maxKeys = 50;
  const keysToSerialize = keys.slice(0, maxKeys);
  
  for (const key of keysToSerialize) {
    try {
      serializedObj[key] = serializeValue(obj[key], config, seen, depth + 1);
    } catch (error) {
      // 如果访问属性失败（如 getter 抛出异常），记录错误
      serializedObj[key] = {
        type: 'string',
        value: '[Error accessing property]',
      };
    }
  }
  
  const previewKeys = keys.slice(0, 3).join(', ');
  const preview = keys.length > maxKeys 
    ? `Object {${previewKeys}... [${keys.length} keys, showing first ${maxKeys}]}`
    : `Object {${previewKeys}${keys.length > 3 ? '...' : ''}}`;
  
  return {
    type: 'object',
    value: serializedObj,
    preview,
  };
}

/**
 * 序列化多个参数
 */
export function serializeArgs(
  args: any[],
  config: SerializationConfig = {}
): SerializedValue[] {
  return args.map(arg => serialize(arg, config));
}

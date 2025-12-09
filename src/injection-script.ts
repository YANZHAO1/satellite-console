import { LogEntry, LogLevel, SerializedValue } from './types';
import { serializeArgs } from './serializer';

// 广播频道名称
const CHANNEL_NAME = 'satellite-console-channel';

// 原始 console 方法的引用
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

// 页面标识符
let pageId: string;

// BroadcastChannel 实例
let channel: BroadcastChannel | null = null;

/**
 * 生成页面标识符（基于 URL + 时间戳）
 */
function generatePageId(): string {
  const url = window.location.href;
  const timestamp = Date.now();
  return `${url}_${timestamp}`;
}

/**
 * 检查浏览器兼容性
 */
function checkBrowserCompatibility(): { compatible: boolean; message?: string } {
  // 检查 BroadcastChannel API
  if (typeof BroadcastChannel === 'undefined') {
    return {
      compatible: false,
      message: 'BroadcastChannel API is not supported. Please use Chrome 54+, Firefox 38+, or Safari 15.4+',
    };
  }
  
  // 检查其他必需的 API
  if (typeof WeakSet === 'undefined') {
    return {
      compatible: false,
      message: 'WeakSet is not supported. Please upgrade your browser.',
    };
  }
  
  return { compatible: true };
}

/**
 * 初始化 BroadcastChannel
 */
function initChannel(): void {
  try {
    // 检查浏览器兼容性
    const compatibility = checkBrowserCompatibility();
    if (!compatibility.compatible) {
      console.warn(`[Satellite Console] ${compatibility.message}`);
      return;
    }
    
    channel = new BroadcastChannel(CHANNEL_NAME);
    
  } catch (error) {
    console.warn('[Satellite Console] Failed to initialize BroadcastChannel:', error);
    channel = null;
  }
}

// 性能优化：缓存 URL 和时间戳计数器
let cachedUrl = '';
let logCounter = 0;

/**
 * 发送日志到卫星窗口（优化版：减少重复计算）
 */
function sendLog(level: LogLevel, args: any[]): void {
  // 如果 channel 不可用，直接返回（降级）
  if (!channel) {
    return;
  }
  
  try {
    // 处理空日志的边界情况
    if (!args || args.length === 0) {
      args = [''];
    }
    
    // 序列化参数
    const serializedArgs: SerializedValue[] = serializeArgs(args);
    
    // 验证序列化结果
    if (!serializedArgs || serializedArgs.length === 0) {
      serializedArgs.push({ type: 'string', value: '[Serialization failed]' });
    }
    
    // 缓存 URL，避免每次都访问 window.location
    if (!cachedUrl || cachedUrl !== window.location.href) {
      cachedUrl = window.location.href;
    }
    
    // 使用计数器而不是 Math.random()，性能更好
    logCounter = (logCounter + 1) % 1000000;
    
    // 构造日志条目
    const logEntry: LogEntry = {
      id: `${pageId}_${Date.now()}_${logCounter}`,
      level,
      timestamp: Date.now(),
      pageId,
      pageUrl: cachedUrl,
      args: serializedArgs,
    };
    
    // 发送消息
    channel.postMessage({
      type: 'log',
      payload: logEntry,
      sender: pageId,
    });
  } catch (error) {
    // 捕获错误，避免影响业务代码
    // 静默失败，不尝试发送错误占位符（减少开销）
  }
}

/**
 * 重写 console 方法
 */
function overrideConsole(): void {
  // 重写 console.log
  console.log = function(...args: any[]): void {
    try {
      // 调用原始方法，保持原有功能
      originalConsole.log.apply(console, args);
      
      // 发送到卫星窗口
      sendLog('log', args);
    } catch (error) {
      // 如果出错，至少保证原始功能可用
      originalConsole.log.apply(console, args);
    }
  };
  
  // 重写 console.warn
  console.warn = function(...args: any[]): void {
    try {
      // 调用原始方法，保持原有功能
      originalConsole.warn.apply(console, args);
      
      // 发送到卫星窗口
      sendLog('warn', args);
    } catch (error) {
      // 如果出错，至少保证原始功能可用
      originalConsole.warn.apply(console, args);
    }
  };
  
  // 重写 console.error
  console.error = function(...args: any[]): void {
    try {
      // 调用原始方法，保持原有功能
      originalConsole.error.apply(console, args);
      
      // 发送到卫星窗口
      sendLog('error', args);
    } catch (error) {
      // 如果出错，至少保证原始功能可用
      originalConsole.error.apply(console, args);
    }
  };
}

/**
 * 初始化注入脚本
 */
export function init(customPageId?: string): void {
  try {
    // 生成或使用自定义页面标识符
    pageId = customPageId || generatePageId();
    
    // 初始化 BroadcastChannel
    initChannel();
    
    // 重写 console 方法
    overrideConsole();
  } catch (error) {
    // 初始化失败时，确保不影响业务代码
    console.error('[Satellite Console] Initialization failed:', error);
  }
}

/**
 * 获取原始 console 方法（用于测试）
 */
export function getOriginalConsole() {
  return originalConsole;
}

/**
 * 获取当前页面 ID（用于测试）
 */
export function getPageId(): string {
  return pageId;
}

/**
 * 获取 channel 实例（用于测试）
 */
export function getChannel(): BroadcastChannel | null {
  return channel;
}

// 自动初始化（如果作为独立脚本加载）
if (typeof window !== 'undefined') {
  // 延迟初始化，确保页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
}

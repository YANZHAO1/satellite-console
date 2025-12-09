/**
 * 卫星控制台启动器
 * 提供简单的 API 供开发者在业务页面中启动卫星控制台
 */

import { init as initInjectionScript } from './injection-script';

// 启动选项接口
export interface LaunchOptions {
  // 卫星窗口的宽度
  width?: number;
  
  // 卫星窗口的高度
  height?: number;
  
  // 自定义页面标识
  pageId?: string;
  
  // 是否自动注入（默认 true）
  autoInject?: boolean;
  
  // 卫星窗口的 URL（默认使用相对路径）
  satelliteUrl?: string;
}

// 默认配置
const DEFAULT_OPTIONS: Required<LaunchOptions> = {
  width: 800,
  height: 600,
  pageId: '',
  autoInject: true,
  satelliteUrl: './dist/satellite-window.html',
};

// 卫星窗口引用
let satelliteWindow: Window | null = null;

// 窗口关闭检查定时器
let windowCheckInterval: number | null = null;

/**
 * 计算窗口位置（居中显示）
 */
function calculateWindowPosition(width: number, height: number): { left: number; top: number } {
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  const left = Math.max(0, (screenWidth - width) / 2);
  const top = Math.max(0, (screenHeight - height) / 2);
  
  return { left, top };
}

/**
 * 生成 window.open 的特性字符串
 */
function generateWindowFeatures(options: Required<LaunchOptions>): string {
  const { width, height } = options;
  const { left, top } = calculateWindowPosition(width, height);
  
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'menubar=no',
    'toolbar=no',
    'location=no',
    'status=no',
    'resizable=yes',
    'scrollbars=yes',
  ];
  
  return features.join(',');
}

/**
 * 开始监控卫星窗口状态
 */
function startWindowMonitoring(): void {
  // 清除已存在的定时器
  if (windowCheckInterval !== null) {
    clearInterval(windowCheckInterval);
  }
  
  // 每秒检查一次窗口是否被关闭
  windowCheckInterval = window.setInterval(() => {
    if (satelliteWindow && satelliteWindow.closed) {
      satelliteWindow = null;
      stopWindowMonitoring();
    }
  }, 1000);
}

/**
 * 停止监控卫星窗口状态
 */
function stopWindowMonitoring(): void {
  if (windowCheckInterval !== null) {
    clearInterval(windowCheckInterval);
    windowCheckInterval = null;
  }
}

/**
 * 检查卫星窗口是否已打开
 */
export function isWindowOpen(): boolean {
  return satelliteWindow !== null && !satelliteWindow.closed;
}

/**
 * 仅注入脚本（卫星窗口已打开）
 */
export function injectOnly(pageId?: string): void {
  try {
    initInjectionScript(pageId);
  } catch (error) {
    console.error('[Satellite Console] Failed to inject script:', error);
  }
}

/**
 * 检查浏览器兼容性
 */
function checkBrowserCompatibility(): { compatible: boolean; message?: string } {
  // 检查 window.open
  if (typeof window.open !== 'function') {
    return {
      compatible: false,
      message: 'window.open is not supported',
    };
  }
  
  // 检查 BroadcastChannel
  if (typeof BroadcastChannel === 'undefined') {
    return {
      compatible: false,
      message: 'BroadcastChannel is not supported. Please use Chrome 54+, Firefox 38+, or Safari 15.4+',
    };
  }
  
  return { compatible: true };
}

/**
 * 打开卫星窗口并注入脚本
 */
export function launch(options?: LaunchOptions): void {
  try {
    // 检查浏览器兼容性
    const compatibility = checkBrowserCompatibility();
    if (!compatibility.compatible) {
      console.error(`[Satellite Console] ${compatibility.message}`);
      alert(`Satellite Console: ${compatibility.message}`);
      return;
    }
    
    // 合并配置
    const config: Required<LaunchOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    
    // 如果窗口已打开，聚焦到该窗口
    if (isWindowOpen() && satelliteWindow) {
      try {
        satelliteWindow.focus();
      } catch (error) {
        console.warn('[Satellite Console] Failed to focus window:', error);
        // 窗口可能已关闭，重置引用
        satelliteWindow = null;
      }
      
      // 如果需要注入脚本
      if (config.autoInject) {
        injectOnly(config.pageId);
      }
      
      return;
    }
    
    // 生成窗口特性字符串
    const features = generateWindowFeatures(config);
    
    // 打开卫星窗口
    satelliteWindow = window.open(
      config.satelliteUrl,
      'SatelliteConsole',
      features
    );
    
    // 检查窗口是否成功打开
    if (!satelliteWindow) {
      const errorMsg = 'Failed to open satellite window. Please check if popups are blocked.';
      console.error(`[Satellite Console] ${errorMsg}`);
      alert(`Satellite Console: ${errorMsg}`);
      return;
    }
    
    // 开始监控窗口状态
    startWindowMonitoring();
    
    // 如果需要自动注入脚本
    if (config.autoInject) {
      injectOnly(config.pageId);
    }
    
  } catch (error) {
    console.error('[Satellite Console] Failed to launch:', error);
    alert(`Satellite Console: Failed to launch. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 关闭卫星窗口
 */
export function close(): void {
  if (isWindowOpen() && satelliteWindow) {
    satelliteWindow.close();
    satelliteWindow = null;
  }
  
  stopWindowMonitoring();
}

/**
 * 获取卫星窗口引用（用于测试）
 */
export function getSatelliteWindow(): Window | null {
  return satelliteWindow;
}

// 导出全局 API
if (typeof window !== 'undefined') {
  (window as any).SatelliteConsole = {
    launch,
    injectOnly,
    isWindowOpen,
    close,
  };
}

import { LogEntry, FilterOptions, SerializedValue } from './types';
import { LogStore } from './log-store';
import { LogFilter } from './log-filter';
import { VirtualScroller } from './virtual-scroller';

/**
 * 卫星窗口应用类
 * 负责接收日志、管理状态、渲染界面
 */
class SatelliteApp {
  private channel: BroadcastChannel | null = null;
  private logStore: LogStore;
  private logFilter: LogFilter;
  private virtualScroller: VirtualScroller | null = null;
  private currentFilters: FilterOptions = {};
  private autoScroll: boolean = true;
  
  // 性能优化：防抖和节流
  private searchDebounceTimer: number | null = null;
  private renderThrottleTimer: number | null = null;
  private lastRenderTime: number = 0;
  private readonly SEARCH_DEBOUNCE_MS = 300;
  private readonly RENDER_THROTTLE_MS = 16; // ~60fps
  
  // DOM 元素引用
  private logContainer: HTMLElement;
  private logList: HTMLElement;
  private emptyState: HTMLElement;
  private loadingState: HTMLElement;
  private clearBtn: HTMLElement;
  private searchInput: HTMLInputElement;
  private sourceFilter: HTMLSelectElement;
  private clearFiltersBtn: HTMLElement;
  private logStats: HTMLElement;
  private statInfo: HTMLElement;
  private statWarn: HTMLElement;
  private statError: HTMLElement;
  private newLogIndicator: HTMLElement;
  
  // 日志统计
  private logCounts = { log: 0, warn: 0, error: 0 };
  private newLogIndicatorTimer: number | null = null;

  constructor() {
    this.logStore = new LogStore({ maxLogs: 10000 });
    this.logFilter = new LogFilter();
    
    // 获取 DOM 元素
    this.logContainer = document.getElementById('log-container')!;
    this.logList = document.getElementById('log-list')!;
    this.emptyState = document.getElementById('empty-state')!;
    this.loadingState = document.getElementById('loading-state')!;
    this.clearBtn = document.getElementById('clear-btn')!;
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.sourceFilter = document.getElementById('source-filter') as HTMLSelectElement;
    this.clearFiltersBtn = document.getElementById('clear-filters-btn')!;
    this.logStats = document.getElementById('log-stats')!;
    this.statInfo = document.getElementById('stat-info')!;
    this.statWarn = document.getElementById('stat-warn')!;
    this.statError = document.getElementById('stat-error')!;
    this.newLogIndicator = document.getElementById('new-log-indicator')!
  }

  /**
   * 初始化应用
   */
  init(): void {
    try {
      // 检查浏览器兼容性
      const compatibility = this.checkBrowserCompatibility();
      if (!compatibility.compatible) {
        this.showError(compatibility.message || '浏览器不兼容');
        return;
      }
      
      // 初始化 BroadcastChannel
      this.initBroadcastChannel();
      
      // 初始化虚拟滚动器
      this.initVirtualScroller();
      
      // 绑定事件监听器
      this.bindEventListeners();
      
      // 隐藏加载状态，显示空状态
      this.showEmptyState();
      
      console.log('Satellite Console initialized');
    } catch (error) {
      console.error('Failed to initialize Satellite Console:', error);
      this.showError('初始化失败，请刷新页面重试');
    }
  }

  /**
   * 检查浏览器兼容性
   */
  private checkBrowserCompatibility(): { compatible: boolean; message?: string } {
    // 检查 BroadcastChannel API
    if (typeof BroadcastChannel === 'undefined') {
      return {
        compatible: false,
        message: 'BroadcastChannel API 不支持。请使用 Chrome 54+、Firefox 38+ 或 Safari 15.4+',
      };
    }
    
    // 检查其他必需的 API
    if (typeof WeakSet === 'undefined') {
      return {
        compatible: false,
        message: 'WeakSet 不支持。请升级您的浏览器。',
      };
    }
    
    if (typeof requestAnimationFrame === 'undefined') {
      return {
        compatible: false,
        message: 'requestAnimationFrame 不支持。请升级您的浏览器。',
      };
    }
    
    return { compatible: true };
  }

  /**
   * 初始化虚拟滚动器（优化参数）
   */
  private initVirtualScroller(): void {
    // 使用 log-list 作为虚拟滚动器的目标容器
    // 但滚动容器仍然是 log-container
    this.virtualScroller = new VirtualScroller({
      container: this.logContainer,
      viewport: this.logList, // 使用 log-list 作为视口
      itemHeight: 60, // 估计的单条日志高度
      bufferSize: 5, // 减小缓冲区，降低内存占用
      renderItem: (log) => this.renderLogEntry(log)
    });
  }

  /**
   * 初始化 BroadcastChannel
   */
  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      throw new Error('BroadcastChannel is not supported in this browser');
    }

    try {
      this.channel = new BroadcastChannel('satellite-console-channel');
      
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      
      // Note: BroadcastChannel doesn't have onerror in the standard API
      // Errors will be caught in handleMessage instead
      
    } catch (error) {
      console.error('Failed to create BroadcastChannel:', error);
      throw new Error('无法创建 BroadcastChannel 连接');
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: any): void {
    try {
      // 验证消息格式
      if (!data || typeof data !== 'object') {
        console.warn('Invalid message format:', data);
        return;
      }
      
      // 解析日志条目
      if (data.type === 'log' && data.payload) {
        const logEntry = data.payload as LogEntry;
        
        // 验证日志条目的必需字段
        if (!this.validateLogEntry(logEntry)) {
          console.warn('Invalid log entry:', logEntry);
          return;
        }
        
        this.receiveLog(logEntry);
      }
    } catch (error) {
      console.error('Failed to parse log message:', error);
      // 不影响后续消息的接收
    }
  }

  /**
   * 验证日志条目的有效性
   */
  private validateLogEntry(entry: any): entry is LogEntry {
    return (
      entry &&
      typeof entry === 'object' &&
      typeof entry.id === 'string' &&
      typeof entry.level === 'string' &&
      ['log', 'warn', 'error'].includes(entry.level) &&
      typeof entry.timestamp === 'number' &&
      typeof entry.pageId === 'string' &&
      typeof entry.pageUrl === 'string' &&
      Array.isArray(entry.args)
    );
  }

  /**
   * 接收日志条目
   */
  private receiveLog(logEntry: LogEntry): void {
    // 添加到存储
    this.logStore.addLog(logEntry);
    
    // 更新统计信息
    this.updateLogStats(logEntry.level);
    
    // 显示新日志提示
    this.showNewLogIndicator();
    
    // 更新来源筛选器选项
    this.updateSourceFilter();
    
    // 重新渲染日志列表
    this.renderLogs();
    
    // 自动滚动到最新日志（最新日志在顶部，所以滚动到顶部）
    if (this.autoScroll) {
      this.scrollToTop();
    }
  }
  
  /**
   * 更新日志统计信息
   */
  private updateLogStats(level: string): void {
    if (level === 'log') {
      this.logCounts.log++;
    } else if (level === 'warn') {
      this.logCounts.warn++;
    } else if (level === 'error') {
      this.logCounts.error++;
    }
    
    // 更新显示
    this.statInfo.textContent = String(this.logCounts.log);
    this.statWarn.textContent = String(this.logCounts.warn);
    this.statError.textContent = String(this.logCounts.error);
    
    // 显示统计区域
    this.logStats.style.display = 'flex';
  }
  
  /**
   * 显示新日志提示
   */
  private showNewLogIndicator(): void {
    // 清除之前的定时器
    if (this.newLogIndicatorTimer !== null) {
      clearTimeout(this.newLogIndicatorTimer);
    }
    
    // 显示提示
    this.newLogIndicator.classList.add('show');
    
    // 2秒后自动隐藏
    this.newLogIndicatorTimer = window.setTimeout(() => {
      this.newLogIndicator.classList.remove('show');
      this.newLogIndicatorTimer = null;
    }, 2000);
  }

  /**
   * 绑定事件监听器
   */
  private bindEventListeners(): void {
    // 清空按钮
    this.clearBtn.addEventListener('click', () => {
      this.clearLogs();
    });

    // 搜索框（添加防抖优化）
    this.searchInput.addEventListener('input', () => {
      // 清除之前的防抖定时器
      if (this.searchDebounceTimer !== null) {
        clearTimeout(this.searchDebounceTimer);
      }
      
      // 设置新的防抖定时器
      this.searchDebounceTimer = window.setTimeout(() => {
        this.currentFilters.searchText = this.searchInput.value.trim() || undefined;
        this.updateClearFiltersButton();
        this.renderLogs();
        this.searchDebounceTimer = null;
      }, this.SEARCH_DEBOUNCE_MS);
    });

    // 来源筛选器
    this.sourceFilter.addEventListener('change', () => {
      this.currentFilters.pageId = this.sourceFilter.value || undefined;
      this.updateClearFiltersButton();
      this.renderLogs();
    });

    // 清除筛选条件按钮
    this.clearFiltersBtn.addEventListener('click', () => {
      this.clearFilters();
    });

    // 监听滚动事件，判断是否需要自动滚动（使用 passive 优化）
    this.logContainer.addEventListener('scroll', () => {
      const { scrollTop } = this.logContainer;
      // 如果用户滚动到接近顶部（50px 以内），启用自动滚动
      // 因为最新日志在顶部，所以检查是否在顶部附近
      this.autoScroll = scrollTop < 50;
    }, { passive: true });
    
    // 监听窗口关闭事件，清理资源
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  /**
   * 清理资源，防止内存泄漏
   */
  private cleanup(): void {
    // 清除定时器
    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
    
    if (this.renderThrottleTimer !== null) {
      clearTimeout(this.renderThrottleTimer);
      this.renderThrottleTimer = null;
    }
    
    if (this.newLogIndicatorTimer !== null) {
      clearTimeout(this.newLogIndicatorTimer);
      this.newLogIndicatorTimer = null;
    }
    
    // 销毁虚拟滚动器
    if (this.virtualScroller) {
      this.virtualScroller.destroy();
      this.virtualScroller = null;
    }
    
    // 关闭 BroadcastChannel
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    
    // 清空日志存储
    this.logStore.clear();
  }

  /**
   * 清空日志
   */
  private clearLogs(): void {
    this.logStore.clear();
    
    // 重置统计信息
    this.logCounts = { log: 0, warn: 0, error: 0 };
    this.statInfo.textContent = '0';
    this.statWarn.textContent = '0';
    this.statError.textContent = '0';
    this.logStats.style.display = 'none';
    
    this.renderLogs();
  }

  /**
   * 清除筛选条件
   */
  private clearFilters(): void {
    // 重置搜索框
    this.searchInput.value = '';
    
    // 重置来源筛选器
    this.sourceFilter.value = '';
    
    // 清空当前筛选条件
    this.currentFilters = {};
    
    // 更新清除筛选按钮的可见性
    this.updateClearFiltersButton();
    
    // 重新渲染日志
    this.renderLogs();
  }

  /**
   * 更新清除筛选条件按钮的可见性
   * 当有任何筛选条件时显示按钮
   */
  private updateClearFiltersButton(): void {
    const hasFilters = !!(this.currentFilters.searchText || this.currentFilters.pageId);
    this.clearFiltersBtn.style.display = hasFilters ? 'block' : 'none';
  }

  /**
   * 更新来源筛选器选项
   */
  private updateSourceFilter(): void {
    const sources = this.logStore.getPageSources();
    const currentValue = this.sourceFilter.value;
    
    // 清空现有选项（保留"所有来源"）
    this.sourceFilter.innerHTML = '<option value="">所有来源</option>';
    
    // 添加所有来源页面
    sources.forEach(source => {
      const option = document.createElement('option');
      option.value = source;
      option.textContent = source;
      this.sourceFilter.appendChild(option);
    });
    
    // 恢复之前的选择
    if (currentValue && sources.includes(currentValue)) {
      this.sourceFilter.value = currentValue;
    }
  }

  /**
   * 渲染日志列表（带节流优化）
   */
  private renderLogs(): void {
    const now = Date.now();
    const timeSinceLastRender = now - this.lastRenderTime;
    
    // 如果距离上次渲染时间太短，使用节流
    if (timeSinceLastRender < this.RENDER_THROTTLE_MS && this.renderThrottleTimer === null) {
      this.renderThrottleTimer = window.setTimeout(() => {
        this.doRenderLogs();
        this.renderThrottleTimer = null;
      }, this.RENDER_THROTTLE_MS - timeSinceLastRender);
      return;
    }
    
    this.doRenderLogs();
  }
  
  /**
   * 实际执行渲染的方法
   */
  private doRenderLogs(): void {
    this.lastRenderTime = Date.now();
    
    const allLogs = this.logStore.getAllLogs();
    
    // 如果没有日志，显示空状态
    if (allLogs.length === 0) {
      this.showEmptyState();
      return;
    }
    
    // 应用过滤器
    const filteredLogs = this.logFilter.getFilteredLogs(allLogs, this.currentFilters);
    
    // 反转数组，让最新的日志显示在最上面
    const reversedLogs = [...filteredLogs].reverse();
    
    // 显示日志列表
    this.showLogList();
    
    // 使用虚拟滚动器渲染日志
    if (this.virtualScroller) {
      this.virtualScroller.setItems(reversedLogs);
    }
  }

  /**
   * 渲染单条日志条目（带错误边界，优化 DOM 操作）
   */
  private renderLogEntry(log: LogEntry): HTMLElement {
    try {
      const entry = document.createElement('div');
      entry.className = `log-entry log-level-${log.level} log-entry-new`;
      entry.dataset.logId = log.id;
      
      // 动画结束后移除 new class，避免重复触发动画
      entry.addEventListener('animationend', () => {
        entry.classList.remove('log-entry-new');
      }, { once: true });
      
      // 日志级别图标
      const icon = document.createElement('div');
      icon.className = `log-icon icon-${log.level}`;
      icon.textContent = this.getLogIcon(log.level);
      
      // 日志元数据和内容
      const meta = document.createElement('div');
      meta.className = 'log-meta';
      
      // 日志头部（时间戳和来源）
      const header = document.createElement('div');
      header.className = 'log-header';
      
      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = this.formatTimestamp(log.timestamp);
      
      const source = document.createElement('span');
      source.className = 'log-source';
      const sanitizedUrl = this.sanitizeUrl(log.pageUrl);
      source.textContent = sanitizedUrl;
      source.title = log.pageUrl;
      
      // 日志内容
      const content = document.createElement('div');
      content.className = 'log-content';
      
      // 渲染日志参数
      const contentText = this.renderLogArgs(log.args);
      content.textContent = contentText;
      
      // 如果内容较长或包含对象/数组，添加展开/折叠功能
      if (this.isExpandable(log.args)) {
        content.classList.add('expandable', 'collapsed');
        content.addEventListener('click', () => {
          content.classList.toggle('collapsed');
        }, { passive: true }); // 使用 passive 优化滚动性能
      }
      
      // 批量添加子元素，减少重排
      header.appendChild(timestamp);
      header.appendChild(source);
      meta.appendChild(header);
      meta.appendChild(content);
      entry.appendChild(icon);
      entry.appendChild(meta);
      
      return entry;
    } catch (error) {
      console.error('Failed to render log entry:', error, log);
      // 返回错误占位符
      return this.renderErrorPlaceholder(log.id);
    }
  }

  /**
   * 渲染错误占位符
   */
  private renderErrorPlaceholder(logId: string): HTMLElement {
    const entry = document.createElement('div');
    entry.className = 'log-entry log-level-error';
    entry.dataset.logId = logId;
    
    const content = document.createElement('div');
    content.className = 'log-content';
    content.textContent = '[渲染失败：日志格式错误]';
    entry.appendChild(content);
    
    return entry;
  }

  /**
   * 清理 URL（防止 XSS）
   */
  private sanitizeUrl(url: string): string {
    try {
      // 移除潜在的危险字符
      return url.replace(/[<>'"]/g, '');
    } catch {
      return '[Invalid URL]';
    }
  }

  /**
   * 获取日志级别图标
   */
  private getLogIcon(level: string): string {
    switch (level) {
      case 'log':
        return 'ℹ️';
      case 'warn':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '•';
    }
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 渲染日志参数
   */
  private renderLogArgs(args: SerializedValue[]): string {
    try {
      // 处理空参数的边界情况
      if (!args || args.length === 0) {
        return '';
      }
      
      return args.map(arg => this.renderSerializedValue(arg)).join(' ');
    } catch (error) {
      console.error('Failed to render log args:', error);
      return '[渲染失败]';
    }
  }

  /**
   * 渲染序列化值
   */
  private renderSerializedValue(value: SerializedValue, depth: number = 0): string {
    try {
      // 防止过深的嵌套导致栈溢出
      if (depth > 10) {
        return '[Max depth exceeded]';
      }
      
      const indent = '  '.repeat(depth);
      
      // 处理 null 或 undefined 的 value
      if (!value || typeof value !== 'object') {
        return String(value);
      }
      
      switch (value.type) {
        case 'string':
          // 处理超长字符串
          if (value.value && value.value.length > 10000) {
            return value.value.substring(0, 10000) + '... [truncated]';
          }
          return value.value || '';
        
        case 'number':
        case 'boolean':
          return String(value.value);
        
        case 'null':
          return 'null';
        
        case 'undefined':
          return 'undefined';
        
        case 'function':
          return value.value || '[Function]';
        
        case 'error':
          return value.stack || value.message || '[Error]';
        
        case 'object':
          if (!value.value || typeof value.value !== 'object') {
            return '{}';
          }
          if (Object.keys(value.value).length === 0) {
            return '{}';
          }
          const objEntries = Object.entries(value.value)
            .map(([key, val]) => `${indent}  ${key}: ${this.renderSerializedValue(val, depth + 1)}`)
            .join('\n');
          return `{\n${objEntries}\n${indent}}`;
        
        case 'array':
          if (!Array.isArray(value.value)) {
            return '[]';
          }
          if (value.value.length === 0) {
            return '[]';
          }
          const arrEntries = value.value
            .map((val, idx) => `${indent}  ${idx}: ${this.renderSerializedValue(val, depth + 1)}`)
            .join('\n');
          return `[\n${arrEntries}\n${indent}]`;
        
        default:
          return String(value);
      }
    } catch (error) {
      console.error('Failed to render serialized value:', error);
      return '[渲染错误]';
    }
  }

  /**
   * 判断日志内容是否可展开
   */
  private isExpandable(args: SerializedValue[]): boolean {
    return args.some(arg => {
      if (arg.type === 'object' || arg.type === 'array') {
        return true;
      }
      if (arg.type === 'string' && arg.value.length > 200) {
        return true;
      }
      if (arg.type === 'error' && arg.stack) {
        return true;
      }
      return false;
    });
  }

  /**
   * 自动滚动到顶部（最新日志在顶部）
   */
  private scrollToTop(): void {
    if (this.virtualScroller) {
      this.virtualScroller.scrollToTop('auto');
    } else {
      requestAnimationFrame(() => {
        this.logContainer.scrollTop = 0;
      });
    }
  }
  
  /**
   * 自动滚动到底部（保留此方法以防需要）
   */
  private scrollToBottom(): void {
    if (this.virtualScroller) {
      this.virtualScroller.scrollToBottom('auto');
    } else {
      requestAnimationFrame(() => {
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
      });
    }
  }

  /**
   * 显示空状态
   */
  private showEmptyState(): void {
    this.loadingState.style.display = 'none';
    this.logList.style.display = 'none';
    this.emptyState.style.display = 'flex';
  }

  /**
   * 显示日志列表
   */
  private showLogList(): void {
    this.loadingState.style.display = 'none';
    this.emptyState.style.display = 'none';
    this.logList.style.display = 'block';
    
    // 确保虚拟滚动器的视口可见
    if (this.virtualScroller) {
      this.logList.style.position = 'relative';
      this.logList.style.height = '100%';
    }
  }

  /**
   * 显示错误信息
   */
  private showError(message: string): void {
    this.loadingState.style.display = 'none';
    this.emptyState.style.display = 'flex';
    this.emptyState.querySelector('.empty-state-title')!.textContent = '初始化失败';
    this.emptyState.querySelector('.empty-state-description')!.textContent = message;
  }
}

// 初始化应用
const app = new SatelliteApp();
app.init();

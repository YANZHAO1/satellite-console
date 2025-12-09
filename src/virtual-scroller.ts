import { LogEntry } from './types';

/**
 * 虚拟滚动配置选项
 */
export interface VirtualScrollerOptions {
  // 容器元素（滚动容器）
  container: HTMLElement;
  // 视口元素（可选，如果不提供则自动创建）
  viewport?: HTMLElement;
  // 单条日志的估计高度（像素）
  itemHeight: number;
  // 缓冲区大小（在可见区域上下额外渲染的项目数）
  bufferSize?: number;
  // 渲染函数
  renderItem: (item: LogEntry) => HTMLElement;
}

/**
 * 虚拟滚动器类
 * 只渲染可见区域的日志条目，优化大量日志场景下的性能
 */
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private bufferSize: number;
  private renderItem: (item: LogEntry) => HTMLElement;
  
  private items: LogEntry[] = [];
  private viewport: HTMLElement;
  private content: HTMLElement;
  
  private visibleStart: number = 0;
  private visibleEnd: number = 0;
  
  private scrollRAF: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastScrollTop: number = 0;
  private scrollThreshold: number = 10; // 滚动阈值，减少不必要的重渲染

  constructor(options: VirtualScrollerOptions) {
    this.container = options.container;
    this.itemHeight = options.itemHeight;
    this.bufferSize = options.bufferSize || 5;
    this.renderItem = options.renderItem;
    
    // 如果提供了自定义视口，使用它；否则创建新的
    if (options.viewport) {
      this.viewport = options.viewport;
      // 确保视口有正确的样式
      this.viewport.style.position = 'relative';
      this.viewport.style.width = '100%';
      this.viewport.style.height = '100%';
    } else {
      this.viewport = this.createViewport();
    }
    
    this.content = this.createContent();
    
    this.initializeDOM();
    this.bindScrollListener();
  }

  /**
   * 创建视口元素
   */
  private createViewport(): HTMLElement {
    const viewport = document.createElement('div');
    viewport.style.position = 'relative';
    viewport.style.overflow = 'hidden';
    viewport.style.width = '100%';
    viewport.style.height = '100%';
    return viewport;
  }

  /**
   * 创建内容容器
   */
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.style.position = 'absolute';
    content.style.top = '0';
    content.style.left = '0';
    content.style.width = '100%';
    content.style.willChange = 'transform';
    return content;
  }

  /**
   * 初始化 DOM 结构
   */
  private initializeDOM(): void {
    this.viewport.appendChild(this.content);
    // 只有在视口不是容器的子元素时才添加
    if (this.viewport.parentNode !== this.container) {
      this.container.appendChild(this.viewport);
    }
  }

  /**
   * 绑定滚动事件监听器
   */
  private bindScrollListener(): void {
    this.container.addEventListener('scroll', () => {
      this.handleScroll();
    });
  }

  /**
   * 处理滚动事件（使用 requestAnimationFrame 优化，带滚动阈值）
   */
  private handleScroll(): void {
    if (this.scrollRAF !== null) {
      return;
    }

    this.scrollRAF = requestAnimationFrame(() => {
      const currentScrollTop = this.container.scrollTop;
      const scrollDelta = Math.abs(currentScrollTop - this.lastScrollTop);
      
      // 只有滚动距离超过阈值时才重新渲染，减少不必要的 DOM 操作
      if (scrollDelta > this.scrollThreshold) {
        this.updateVisibleRange();
        this.render();
        this.lastScrollTop = currentScrollTop;
      }
      
      this.scrollRAF = null;
    });
  }

  /**
   * 更新可见范围
   */
  private updateVisibleRange(): void {
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;
    
    // 计算可见区域的起始和结束索引
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.ceil((scrollTop + viewportHeight) / this.itemHeight);
    
    // 添加缓冲区
    this.visibleStart = Math.max(0, start - this.bufferSize);
    this.visibleEnd = Math.min(this.items.length, end + this.bufferSize);
  }

  /**
   * 获取可见范围
   */
  public getVisibleRange(): { start: number; end: number } {
    return {
      start: this.visibleStart,
      end: this.visibleEnd
    };
  }

  /**
   * 设置数据项
   */
  public setItems(items: LogEntry[]): void {
    this.items = items;
    this.updateVisibleRange();
    this.render();
  }

  /**
   * 渲染可见项（优化版：使用 DocumentFragment 减少重排）
   */
  private render(): void {
    // 设置视口总高度
    const totalHeight = this.items.length * this.itemHeight;
    this.viewport.style.height = `${totalHeight}px`;
    
    // 清空内容容器
    this.content.innerHTML = '';
    
    // 如果没有项目，直接返回
    if (this.items.length === 0) {
      return;
    }
    
    // 计算内容容器的偏移量
    const offsetY = this.visibleStart * this.itemHeight;
    this.content.style.transform = `translateY(${offsetY}px)`;
    
    // 使用 DocumentFragment 批量添加元素，减少重排次数
    const fragment = document.createDocumentFragment();
    
    // 渲染可见范围内的项目
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      if (i >= this.items.length) break;
      
      const item = this.items[i];
      const element = this.renderItem(item);
      
      // 不设置固定高度，让元素根据内容自适应
      // element.style.minHeight = `${this.itemHeight}px`;
      
      fragment.appendChild(element);
    }
    
    // 一次性添加所有元素
    this.content.appendChild(fragment);
  }

  /**
   * 滚动到指定索引
   */
  public scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
    const targetScrollTop = index * this.itemHeight;
    this.container.scrollTo({
      top: targetScrollTop,
      behavior
    });
  }

  /**
   * 滚动到底部
   */
  public scrollToBottom(behavior: ScrollBehavior = 'auto'): void {
    const maxScrollTop = this.items.length * this.itemHeight - this.container.clientHeight;
    this.container.scrollTo({
      top: Math.max(0, maxScrollTop),
      behavior
    });
  }

  /**
   * 滚动到顶部
   */
  public scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    this.container.scrollTo({
      top: 0,
      behavior
    });
  }

  /**
   * 获取当前项目数量
   */
  public getItemCount(): number {
    return this.items.length;
  }

  /**
   * 刷新渲染（当项目高度可能改变时调用）
   */
  public refresh(): void {
    this.updateVisibleRange();
    this.render();
  }

  /**
   * 销毁虚拟滚动器（清理所有资源）
   */
  public destroy(): void {
    if (this.scrollRAF !== null) {
      cancelAnimationFrame(this.scrollRAF);
      this.scrollRAF = null;
    }
    
    // 断开 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // 清空内容，释放内存
    this.content.innerHTML = '';
    this.items = [];
    
    // 确保视口存在且是容器的子元素
    if (this.viewport && this.viewport.parentNode === this.container) {
      this.container.removeChild(this.viewport);
    }
  }
}

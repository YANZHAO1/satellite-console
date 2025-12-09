import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VirtualScroller } from './virtual-scroller';
import { LogEntry } from './types';

describe('VirtualScroller', () => {
  let container: HTMLElement;
  let mockRenderItem: (item: LogEntry) => HTMLElement;
  let scroller: VirtualScroller;

  beforeEach(() => {
    // 创建容器元素
    container = document.createElement('div');
    container.style.height = '500px';
    container.style.overflow = 'auto';
    document.body.appendChild(container);

    // 模拟渲染函数
    mockRenderItem = vi.fn((item: LogEntry) => {
      const element = document.createElement('div');
      element.textContent = item.id;
      element.className = 'log-entry';
      return element;
    });

    // 创建虚拟滚动器
    scroller = new VirtualScroller({
      container,
      itemHeight: 50,
      bufferSize: 5,
      renderItem: mockRenderItem
    });
  });

  afterEach(() => {
    scroller.destroy();
    document.body.removeChild(container);
  });

  it('应该正确初始化虚拟滚动器', () => {
    expect(scroller).toBeDefined();
    expect(scroller.getItemCount()).toBe(0);
  });

  it('应该正确设置数据项', () => {
    const items = createMockLogs(100);
    scroller.setItems(items);
    
    expect(scroller.getItemCount()).toBe(100);
  });

  it('应该只渲染可见范围内的项目', () => {
    const items = createMockLogs(100);
    scroller.setItems(items);
    
    // 获取可见范围
    const range = scroller.getVisibleRange();
    
    // 验证可见范围合理（应该小于总数）
    expect(range.end - range.start).toBeLessThan(100);
    expect(range.start).toBeGreaterThanOrEqual(0);
    expect(range.end).toBeLessThanOrEqual(100);
  });

  it('应该在滚动时更新可见范围', () => {
    const items = createMockLogs(100);
    scroller.setItems(items);
    
    const initialRange = scroller.getVisibleRange();
    
    // 模拟滚动
    container.scrollTop = 1000;
    container.dispatchEvent(new Event('scroll'));
    
    // 等待 requestAnimationFrame
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        const newRange = scroller.getVisibleRange();
        
        // 验证范围已更新
        expect(newRange.start).toBeGreaterThan(initialRange.start);
        resolve();
      });
    });
  });

  it('应该支持滚动到指定索引', () => {
    const items = createMockLogs(100);
    scroller.setItems(items);
    
    // Mock scrollTo if not available
    if (!container.scrollTo) {
      container.scrollTo = (options: any) => {
        container.scrollTop = options.top;
      };
    }
    
    scroller.scrollToIndex(50);
    
    // 验证滚动位置
    expect(container.scrollTop).toBe(50 * 50); // index * itemHeight
  });

  it('应该支持滚动到底部', () => {
    const items = createMockLogs(100);
    scroller.setItems(items);
    
    // Mock scrollTo if not available
    if (!container.scrollTo) {
      container.scrollTo = (options: any) => {
        container.scrollTop = options.top;
      };
    }
    
    scroller.scrollToBottom();
    
    // 验证滚动到底部
    const maxScroll = 100 * 50 - container.clientHeight;
    expect(container.scrollTop).toBeGreaterThanOrEqual(maxScroll - 1);
  });

  it('应该支持滚动到顶部', () => {
    const items = createMockLogs(100);
    scroller.setItems(items);
    
    // Mock scrollTo if not available
    if (!container.scrollTo) {
      container.scrollTo = (options: any) => {
        container.scrollTop = options.top;
      };
    }
    
    // 先滚动到底部
    scroller.scrollToBottom();
    
    // 再滚动到顶部
    scroller.scrollToTop();
    
    expect(container.scrollTop).toBe(0);
  });

  it('应该正确处理空数据', () => {
    scroller.setItems([]);
    
    expect(scroller.getItemCount()).toBe(0);
    const range = scroller.getVisibleRange();
    expect(range.start).toBe(0);
    expect(range.end).toBe(0);
  });

  it('应该在销毁时清理资源', () => {
    const items = createMockLogs(10);
    scroller.setItems(items);
    
    // 验证视口已创建
    const viewportBefore = container.children.length;
    expect(viewportBefore).toBeGreaterThan(0);
    
    // 销毁滚动器
    scroller.destroy();
    
    // 验证视口已移除
    const viewportAfter = container.children.length;
    expect(viewportAfter).toBe(0);
  });
});

/**
 * 创建模拟日志数据
 */
function createMockLogs(count: number): LogEntry[] {
  const logs: LogEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    logs.push({
      id: `log-${i}`,
      level: 'log',
      timestamp: Date.now() + i,
      pageId: 'test-page',
      pageUrl: 'http://localhost:3000',
      args: [
        { type: 'string', value: `Log message ${i}` }
      ]
    });
  }
  
  return logs;
}

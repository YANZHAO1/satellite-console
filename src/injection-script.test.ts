import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { init, getPageId, getChannel } from './injection-script';

describe('injection-script', () => {
  // 保存原始 console 方法
  const realConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  
  // Mock BroadcastChannel
  let mockChannel: any;
  let postedMessages: any[] = [];
  
  beforeEach(() => {
    // 重置 console
    console.log = realConsole.log;
    console.warn = realConsole.warn;
    console.error = realConsole.error;
    
    // 重置消息记录
    postedMessages = [];
    
    // Mock BroadcastChannel
    mockChannel = {
      postMessage: vi.fn((message) => {
        postedMessages.push(message);
      }),
      close: vi.fn(),
    };
    
    // @ts-ignore - Mock global BroadcastChannel as a class
    global.BroadcastChannel = class {
      constructor() {
        return mockChannel;
      }
    };
    
    // Mock window object for tests
    // @ts-ignore
    global.window = {
      location: {
        href: 'http://localhost:3000/test',
      } as Location,
    };
    
    // Mock document for auto-initialization check
    // @ts-ignore
    global.document = {
      readyState: 'complete',
    };
  });
  
  afterEach(() => {
    // 恢复原始 console
    console.log = realConsole.log;
    console.warn = realConsole.warn;
    console.error = realConsole.error;
    
    // Clean up global mocks
    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.document;
  });
  
  describe('初始化', () => {
    it('应该生成页面标识符', () => {
      init();
      const pageId = getPageId();
      
      expect(pageId).toBeDefined();
      expect(typeof pageId).toBe('string');
      expect(pageId.length).toBeGreaterThan(0);
    });
    
    it('应该接受自定义页面标识符', () => {
      const customId = 'custom-page-id';
      init(customId);
      
      expect(getPageId()).toBe(customId);
    });
    
    it('应该初始化 BroadcastChannel', () => {
      init();
      
      expect(getChannel()).toBe(mockChannel);
    });
  });
  
  describe('console 方法重写', () => {
    it('应该保留 console.log 的原始功能', () => {
      init();
      
      // 验证 console 方法被重写了
      expect(console.log).not.toBe(realConsole.log);
      
      // 调用不应该抛出错误
      expect(() => console.log('test message', 123)).not.toThrow();
    });
    
    it('应该保留 console.warn 的原始功能', () => {
      init();
      
      // 验证 console 方法被重写了
      expect(console.warn).not.toBe(realConsole.warn);
      
      // 调用不应该抛出错误
      expect(() => console.warn('warning message')).not.toThrow();
    });
    
    it('应该保留 console.error 的原始功能', () => {
      init();
      
      // 验证 console 方法被重写了
      expect(console.error).not.toBe(realConsole.error);
      
      // 调用不应该抛出错误
      expect(() => console.error('error message')).not.toThrow();
    });
  });
  
  describe('消息发送', () => {
    it('应该通过 BroadcastChannel 发送 log 消息', () => {
      init();
      console.log('test message');
      
      expect(postedMessages.length).toBe(1);
      expect(postedMessages[0].type).toBe('log');
      expect(postedMessages[0].payload.level).toBe('log');
      expect(postedMessages[0].payload.args[0].value).toBe('test message');
    });
    
    it('应该通过 BroadcastChannel 发送 warn 消息', () => {
      init();
      console.warn('warning');
      
      expect(postedMessages.length).toBe(1);
      expect(postedMessages[0].type).toBe('log');
      expect(postedMessages[0].payload.level).toBe('warn');
    });
    
    it('应该通过 BroadcastChannel 发送 error 消息', () => {
      init();
      console.error('error');
      
      expect(postedMessages.length).toBe(1);
      expect(postedMessages[0].type).toBe('log');
      expect(postedMessages[0].payload.level).toBe('error');
    });
    
    it('应该在消息中包含页面信息', () => {
      const customId = 'test-page';
      init(customId);
      console.log('test');
      
      const message = postedMessages[0];
      expect(message.payload.pageId).toBe(customId);
      expect(message.payload.pageUrl).toBeDefined();
      expect(message.payload.timestamp).toBeDefined();
      expect(message.payload.id).toBeDefined();
    });
    
    it('应该序列化多个参数', () => {
      init();
      console.log('message', 123, true, { key: 'value' });
      
      const args = postedMessages[0].payload.args;
      expect(args.length).toBe(4);
      expect(args[0].value).toBe('message');
      expect(args[1].value).toBe(123);
      expect(args[2].value).toBe(true);
      expect(args[3].type).toBe('object');
    });
  });
  
  describe('错误处理', () => {
    it('应该在 BroadcastChannel 不可用时降级', () => {
      // @ts-ignore - 模拟 BroadcastChannel 不可用
      global.BroadcastChannel = undefined;
      
      // 不应该抛出错误
      expect(() => init()).not.toThrow();
      
      // 原始功能应该仍然可用
      expect(() => console.log('test')).not.toThrow();
    });
    
    it('应该在消息发送失败时不影响原始功能', () => {
      // Mock postMessage 抛出错误
      mockChannel.postMessage = vi.fn(() => {
        throw new Error('Send failed');
      });
      
      init();
      
      // 不应该抛出错误
      expect(() => console.log('test')).not.toThrow();
    });
    
    it('应该在序列化失败时不影响原始功能', () => {
      init();
      
      // 创建一个会导致序列化问题的对象
      const circular: any = {};
      circular.self = circular;
      
      // 不应该抛出错误（序列化器会处理循环引用）
      expect(() => console.log(circular)).not.toThrow();
    });
  });
  
  describe('降级逻辑', () => {
    it('应该在 BroadcastChannel 初始化失败时继续工作', () => {
      // Mock BroadcastChannel 构造函数抛出错误
      // @ts-ignore
      global.BroadcastChannel = class {
        constructor() {
          throw new Error('Initialization failed');
        }
      };
      
      // 不应该抛出错误
      expect(() => init()).not.toThrow();
      
      // 原始功能应该仍然可用
      expect(() => console.log('test')).not.toThrow();
      
      // 不应该有消息发送（因为 channel 为 null）
      expect(getChannel()).toBeNull();
    });
  });

  describe('边界情况', () => {
    it('应该处理空日志', () => {
      init();
      
      // 不应该抛出错误
      expect(() => console.log()).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
      expect(postedMessages[0].payload.args.length).toBeGreaterThan(0);
    });
    
    it('应该处理超长字符串', () => {
      init();
      const longString = 'a'.repeat(100000);
      
      // 不应该抛出错误
      expect(() => console.log(longString)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
    });
    
    it('应该处理特殊字符', () => {
      init();
      const specialChars = '<script>alert("xss")</script>\n\t\r\0';
      
      // 不应该抛出错误
      expect(() => console.log(specialChars)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
      expect(postedMessages[0].payload.args[0].value).toBe(specialChars);
    });
    
    it('应该处理 null 和 undefined', () => {
      init();
      
      // 不应该抛出错误
      expect(() => console.log(null, undefined)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
      expect(postedMessages[0].payload.args[0].type).toBe('null');
      expect(postedMessages[0].payload.args[1].type).toBe('undefined');
    });
    
    it('应该处理大型对象', () => {
      init();
      const largeObject: any = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }
      
      // 不应该抛出错误
      expect(() => console.log(largeObject)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
    });
    
    it('应该处理深度嵌套的对象', () => {
      init();
      let deepObject: any = { value: 'end' };
      for (let i = 0; i < 20; i++) {
        deepObject = { nested: deepObject };
      }
      
      // 不应该抛出错误
      expect(() => console.log(deepObject)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
    });
    
    it('应该处理包含 Error 对象的日志', () => {
      init();
      const error = new Error('Test error');
      
      // 不应该抛出错误
      expect(() => console.error(error)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
      expect(postedMessages[0].payload.args[0].type).toBe('error');
    });
    
    it('应该处理包含函数的日志', () => {
      init();
      const func = function testFunc() { return 42; };
      
      // 不应该抛出错误
      expect(() => console.log(func)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
      expect(postedMessages[0].payload.args[0].type).toBe('function');
    });
    
    it('应该处理包含 Symbol 的对象', () => {
      init();
      const obj = { [Symbol('test')]: 'value', normal: 'data' };
      
      // 不应该抛出错误
      expect(() => console.log(obj)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
    });
    
    it('应该处理包含 Date 对象的日志', () => {
      init();
      const date = new Date();
      
      // 不应该抛出错误
      expect(() => console.log(date)).not.toThrow();
      
      // 应该发送消息
      expect(postedMessages.length).toBe(1);
    });
  });
});

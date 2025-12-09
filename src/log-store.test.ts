import { describe, it, expect, beforeEach } from 'vitest';
import { LogStore } from './log-store';
import { LogEntry } from './types';

describe('LogStore', () => {
  let store: LogStore;

  beforeEach(() => {
    store = new LogStore();
  });

  describe('日志添加和检索', () => {
    it('应该能够添加日志并检索', () => {
      const log: LogEntry = {
        id: '1',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'test message' }],
      };

      store.addLog(log);
      const logs = store.getAllLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(log);
    });

    it('应该能够添加多条日志', () => {
      const log1: LogEntry = {
        id: '1',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 1' }],
      };

      const log2: LogEntry = {
        id: '2',
        level: 'warn',
        timestamp: Date.now(),
        pageId: 'page-2',
        pageUrl: 'http://example.com/page2',
        args: [{ type: 'string', value: 'message 2' }],
      };

      store.addLog(log1);
      store.addLog(log2);
      const logs = store.getAllLogs();

      expect(logs).toHaveLength(2);
      expect(logs[0]).toEqual(log1);
      expect(logs[1]).toEqual(log2);
    });

    it('getAllLogs 应该返回日志的副本', () => {
      const log: LogEntry = {
        id: '1',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'test' }],
      };

      store.addLog(log);
      const logs1 = store.getAllLogs();
      const logs2 = store.getAllLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });
  });

  describe('FIFO 策略', () => {
    it('当超过最大数量时应该删除最旧的日志', () => {
      const smallStore = new LogStore({ maxLogs: 3 });

      const log1: LogEntry = {
        id: '1',
        level: 'log',
        timestamp: 1,
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 1' }],
      };

      const log2: LogEntry = {
        id: '2',
        level: 'log',
        timestamp: 2,
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 2' }],
      };

      const log3: LogEntry = {
        id: '3',
        level: 'log',
        timestamp: 3,
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 3' }],
      };

      const log4: LogEntry = {
        id: '4',
        level: 'log',
        timestamp: 4,
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 4' }],
      };

      smallStore.addLog(log1);
      smallStore.addLog(log2);
      smallStore.addLog(log3);
      expect(smallStore.getLogCount()).toBe(3);

      // 添加第4条日志，应该删除第1条
      smallStore.addLog(log4);
      const logs = smallStore.getAllLogs();

      expect(logs).toHaveLength(3);
      expect(logs[0]).toEqual(log2);
      expect(logs[1]).toEqual(log3);
      expect(logs[2]).toEqual(log4);
    });

    it('应该持续应用 FIFO 策略', () => {
      const smallStore = new LogStore({ maxLogs: 2 });

      for (let i = 1; i <= 5; i++) {
        const log: LogEntry = {
          id: `${i}`,
          level: 'log',
          timestamp: i,
          pageId: 'page-1',
          pageUrl: 'http://example.com',
          args: [{ type: 'string', value: `message ${i}` }],
        };
        smallStore.addLog(log);
      }

      const logs = smallStore.getAllLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].id).toBe('4');
      expect(logs[1].id).toBe('5');
    });
  });

  describe('清空功能', () => {
    it('应该能够清空所有日志', () => {
      const log1: LogEntry = {
        id: '1',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 1' }],
      };

      const log2: LogEntry = {
        id: '2',
        level: 'warn',
        timestamp: Date.now(),
        pageId: 'page-2',
        pageUrl: 'http://example.com/page2',
        args: [{ type: 'string', value: 'message 2' }],
      };

      store.addLog(log1);
      store.addLog(log2);
      expect(store.getLogCount()).toBe(2);

      store.clear();
      expect(store.getLogCount()).toBe(0);
      expect(store.getAllLogs()).toHaveLength(0);
    });

    it('清空后应该能够继续添加日志', () => {
      const log1: LogEntry = {
        id: '1',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 1' }],
      };

      store.addLog(log1);
      store.clear();

      const log2: LogEntry = {
        id: '2',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 2' }],
      };

      store.addLog(log2);
      const logs = store.getAllLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(log2);
    });
  });

  describe('getPageSources', () => {
    it('应该返回所有唯一的来源页面', () => {
      const log1: LogEntry = {
        id: '1',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 1' }],
      };

      const log2: LogEntry = {
        id: '2',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-2',
        pageUrl: 'http://example.com/page2',
        args: [{ type: 'string', value: 'message 2' }],
      };

      const log3: LogEntry = {
        id: '3',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message 3' }],
      };

      store.addLog(log1);
      store.addLog(log2);
      store.addLog(log3);

      const sources = store.getPageSources();
      expect(sources).toHaveLength(2);
      expect(sources).toContain('page-1');
      expect(sources).toContain('page-2');
    });

    it('空存储应该返回空数组', () => {
      const sources = store.getPageSources();
      expect(sources).toHaveLength(0);
    });

    it('单个页面应该返回一个来源', () => {
      const log: LogEntry = {
        id: '1',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'string', value: 'message' }],
      };

      store.addLog(log);
      const sources = store.getPageSources();

      expect(sources).toHaveLength(1);
      expect(sources[0]).toBe('page-1');
    });
  });
});

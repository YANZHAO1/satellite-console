import { describe, it, expect, beforeEach } from 'vitest';
import { LogFilter } from './log-filter';
import { LogEntry, LogLevel } from './types';

describe('LogFilter', () => {
  let filter: LogFilter;
  let testLogs: LogEntry[];

  beforeEach(() => {
    filter = new LogFilter();
    
    // 创建测试日志数据
    testLogs = [
      {
        id: '1',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com/page1',
        args: [
          { type: 'string', value: 'Hello World' }
        ]
      },
      {
        id: '2',
        level: 'warn',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com/page1',
        args: [
          { type: 'string', value: 'Warning message' }
        ]
      },
      {
        id: '3',
        level: 'error',
        timestamp: Date.now(),
        pageId: 'page-2',
        pageUrl: 'http://example.com/page2',
        args: [
          { type: 'string', value: 'Error occurred' }
        ]
      },
      {
        id: '4',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-2',
        pageUrl: 'http://example.com/page2',
        args: [
          { type: 'number', value: 42 },
          { type: 'string', value: 'test data' }
        ]
      },
      {
        id: '5',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-3',
        pageUrl: 'http://example.com/page3',
        args: [
          { 
            type: 'object', 
            value: {
              name: { type: 'string', value: 'John' },
              age: { type: 'number', value: 30 }
            },
            preview: '{name: "John", age: 30}'
          }
        ]
      }
    ];
  });

  describe('搜索文本过滤', () => {
    it('应该根据字符串内容过滤日志', () => {
      const result = filter.getFilteredLogs(testLogs, { searchText: 'Hello' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('应该不区分大小写进行搜索', () => {
      const result = filter.getFilteredLogs(testLogs, { searchText: 'hello' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('应该搜索数字类型的内容', () => {
      const result = filter.getFilteredLogs(testLogs, { searchText: '42' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });

    it('应该搜索对象内部的值', () => {
      const result = filter.getFilteredLogs(testLogs, { searchText: 'John' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('5');
    });

    it('应该在多个参数中搜索', () => {
      const result = filter.getFilteredLogs(testLogs, { searchText: 'test' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });

    it('搜索不到时应该返回空数组', () => {
      const result = filter.getFilteredLogs(testLogs, { searchText: 'nonexistent' });
      expect(result).toHaveLength(0);
    });
  });

  describe('来源页面过滤', () => {
    it('应该根据 pageId 过滤日志', () => {
      const result = filter.getFilteredLogs(testLogs, { pageId: 'page-1' });
      expect(result).toHaveLength(2);
      expect(result.every(log => log.pageId === 'page-1')).toBe(true);
    });

    it('应该正确过滤不同的页面', () => {
      const result = filter.getFilteredLogs(testLogs, { pageId: 'page-2' });
      expect(result).toHaveLength(2);
      expect(result.every(log => log.pageId === 'page-2')).toBe(true);
    });

    it('过滤不存在的页面应该返回空数组', () => {
      const result = filter.getFilteredLogs(testLogs, { pageId: 'page-999' });
      expect(result).toHaveLength(0);
    });
  });

  describe('日志级别过滤', () => {
    it('应该根据单个日志级别过滤', () => {
      const result = filter.getFilteredLogs(testLogs, { levels: ['error'] });
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('error');
    });

    it('应该根据多个日志级别过滤', () => {
      const result = filter.getFilteredLogs(testLogs, { levels: ['warn', 'error'] });
      expect(result).toHaveLength(2);
      expect(result.every(log => log.level === 'warn' || log.level === 'error')).toBe(true);
    });

    it('应该过滤所有 log 级别的日志', () => {
      const result = filter.getFilteredLogs(testLogs, { levels: ['log'] });
      expect(result).toHaveLength(3);
      expect(result.every(log => log.level === 'log')).toBe(true);
    });
  });

  describe('组合过滤', () => {
    it('应该同时应用搜索和来源过滤', () => {
      const result = filter.getFilteredLogs(testLogs, {
        searchText: 'message',
        pageId: 'page-1'
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('应该同时应用来源和级别过滤', () => {
      const result = filter.getFilteredLogs(testLogs, {
        pageId: 'page-1',
        levels: ['log']
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('应该同时应用所有三种过滤条件', () => {
      const result = filter.getFilteredLogs(testLogs, {
        searchText: 'Error',
        pageId: 'page-2',
        levels: ['error']
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('组合过滤无匹配时应该返回空数组', () => {
      const result = filter.getFilteredLogs(testLogs, {
        searchText: 'Hello',
        pageId: 'page-2'
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('边界情况', () => {
    it('没有过滤条件时应该返回所有日志', () => {
      const result = filter.getFilteredLogs(testLogs, {});
      expect(result).toHaveLength(testLogs.length);
    });

    it('应该处理空日志数组', () => {
      const result = filter.getFilteredLogs([], { searchText: 'test' });
      expect(result).toHaveLength(0);
    });

    it('应该处理空字符串搜索', () => {
      const result = filter.getFilteredLogs(testLogs, { searchText: '' });
      expect(result).toHaveLength(testLogs.length);
    });

    it('应该处理空级别数组', () => {
      const result = filter.getFilteredLogs(testLogs, { levels: [] });
      expect(result).toHaveLength(testLogs.length);
    });
  });

  describe('复杂数据类型搜索', () => {
    it('应该搜索数组内容', () => {
      const logsWithArray: LogEntry[] = [{
        id: '6',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{
          type: 'array',
          value: [
            { type: 'string', value: 'apple' },
            { type: 'string', value: 'banana' }
          ],
          preview: '["apple", "banana"]'
        }]
      }];

      const result = filter.getFilteredLogs(logsWithArray, { searchText: 'banana' });
      expect(result).toHaveLength(1);
    });

    it('应该搜索错误消息', () => {
      const logsWithError: LogEntry[] = [{
        id: '7',
        level: 'error',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{
          type: 'error',
          message: 'TypeError: Cannot read property',
          stack: 'at line 10'
        }]
      }];

      const result = filter.getFilteredLogs(logsWithError, { searchText: 'TypeError' });
      expect(result).toHaveLength(1);
    });

    it('应该搜索布尔值', () => {
      const logsWithBoolean: LogEntry[] = [{
        id: '8',
        level: 'log',
        timestamp: Date.now(),
        pageId: 'page-1',
        pageUrl: 'http://example.com',
        args: [{ type: 'boolean', value: true }]
      }];

      const result = filter.getFilteredLogs(logsWithBoolean, { searchText: 'true' });
      expect(result).toHaveLength(1);
    });
  });
});

import { LogEntry } from './types';

/**
 * 日志存储配置
 */
export interface LogStoreConfig {
  maxLogs?: number;
}

/**
 * 日志存储类
 * 负责管理日志条目的存储、检索和过滤
 */
export class LogStore {
  private logs: LogEntry[] = [];
  private maxLogs: number;

  constructor(config: LogStoreConfig = {}) {
    this.maxLogs = config.maxLogs ?? 10000;
  }

  /**
   * 添加日志条目
   * 如果超过最大数量，使用 FIFO 策略删除最旧的日志
   */
  addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // FIFO 策略：如果超过最大数量，删除最旧的日志
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * 获取所有日志
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取所有唯一的来源页面标识
   */
  getPageSources(): string[] {
    const sources = new Set<string>();
    for (const log of this.logs) {
      sources.add(log.pageId);
    }
    return Array.from(sources);
  }

  /**
   * 清空所有日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 获取当前日志数量
   */
  getLogCount(): number {
    return this.logs.length;
  }
}

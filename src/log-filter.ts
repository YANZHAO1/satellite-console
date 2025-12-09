import { LogEntry, LogLevel, SerializedValue, FilterOptions } from './types';

/**
 * 日志过滤类
 * 负责根据不同条件过滤日志条目
 */
export class LogFilter {
  /**
   * 获取过滤后的日志数组
   */
  getFilteredLogs(logs: LogEntry[], filters: FilterOptions): LogEntry[] {
    let filtered = logs;

    // 应用来源页面过滤
    if (filters.pageId) {
      filtered = this.filterByPageId(filtered, filters.pageId);
    }

    // 应用日志级别过滤
    if (filters.levels && filters.levels.length > 0) {
      filtered = this.filterByLevels(filtered, filters.levels);
    }

    // 应用搜索文本过滤
    if (filters.searchText) {
      filtered = this.filterBySearchText(filtered, filters.searchText);
    }

    return filtered;
  }

  /**
   * 按来源页面过滤
   */
  private filterByPageId(logs: LogEntry[], pageId: string): LogEntry[] {
    return logs.filter(log => log.pageId === pageId);
  }

  /**
   * 按日志级别过滤
   */
  private filterByLevels(logs: LogEntry[], levels: LogLevel[]): LogEntry[] {
    return logs.filter(log => levels.includes(log.level));
  }

  /**
   * 按搜索文本过滤
   * 对日志内容进行文本匹配
   */
  private filterBySearchText(logs: LogEntry[], searchText: string): LogEntry[] {
    const lowerSearchText = searchText.toLowerCase();
    return logs.filter(log => {
      // 搜索日志参数中的内容
      return log.args.some(arg => this.matchesSearchText(arg, lowerSearchText));
    });
  }

  /**
   * 检查序列化值是否匹配搜索文本
   */
  private matchesSearchText(value: SerializedValue, searchText: string): boolean {
    switch (value.type) {
      case 'string':
        return value.value.toLowerCase().includes(searchText);
      
      case 'number':
        return value.value.toString().includes(searchText);
      
      case 'boolean':
        return value.value.toString().toLowerCase().includes(searchText);
      
      case 'null':
        return 'null'.includes(searchText);
      
      case 'undefined':
        return 'undefined'.includes(searchText);
      
      case 'function':
        return value.value.toLowerCase().includes(searchText);
      
      case 'error':
        return value.message.toLowerCase().includes(searchText) ||
               (value.stack?.toLowerCase().includes(searchText) ?? false);
      
      case 'object':
        // 搜索对象的预览字符串和所有值
        if (value.preview.toLowerCase().includes(searchText)) {
          return true;
        }
        return Object.values(value.value).some(v => this.matchesSearchText(v, searchText));
      
      case 'array':
        // 搜索数组的预览字符串和所有元素
        if (value.preview.toLowerCase().includes(searchText)) {
          return true;
        }
        return value.value.some(v => this.matchesSearchText(v, searchText));
      
      default:
        return false;
    }
  }
}

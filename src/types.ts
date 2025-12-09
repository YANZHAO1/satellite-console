// 共享类型定义

// 序列化值类型
export type SerializedValue = 
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'undefined'; value: undefined }
  | { type: 'object'; value: Record<string, SerializedValue>; preview: string }
  | { type: 'array'; value: SerializedValue[]; preview: string }
  | { type: 'function'; value: string }
  | { type: 'error'; message: string; stack?: string };

// 日志级别
export type LogLevel = 'log' | 'warn' | 'error';

// 日志条目
export interface LogEntry {
  id: string;
  level: LogLevel;
  timestamp: number;
  pageId: string;
  pageUrl: string;
  args: SerializedValue[];
}

// 序列化配置
export interface SerializationConfig {
  maxDepth?: number;
  maxStringLength?: number;
  maxArrayLength?: number;
}

// 过滤选项
export interface FilterOptions {
  searchText?: string;
  pageId?: string;
  levels?: LogLevel[];
}

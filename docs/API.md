# API 文档

本文档详细说明 Satellite Console 的所有 API 接口和配置选项。

## 目录

- [全局 API](#全局-api)
- [配置选项](#配置选项)
- [类型定义](#类型定义)
- [事件和回调](#事件和回调)
- [最佳实践](#最佳实践)

## 全局 API

Satellite Console 通过全局对象 `SatelliteConsole` 提供 API。

### SatelliteConsole.launch(options?)

启动卫星控制台，打开卫星窗口并注入日志拦截脚本。

**类型签名：**

```typescript
function launch(options?: LaunchOptions): void
```

**参数：**

- `options` (可选) - 启动配置对象，详见 [LaunchOptions](#launchoptions)

**行为：**

1. 如果卫星窗口已打开，则聚焦到该窗口
2. 如果窗口未打开，则创建新的卫星窗口
3. 根据 `autoInject` 选项决定是否注入日志拦截脚本
4. 开始监控窗口状态（每秒检查一次）

**示例：**

```javascript
// 使用默认配置
SatelliteConsole.launch();

// 自定义窗口大小
SatelliteConsole.launch({
  width: 1200,
  height: 800
});

// 自定义页面标识
SatelliteConsole.launch({
  pageId: 'homepage',
  width: 900,
  height: 700
});

// 只打开窗口，不注入脚本
SatelliteConsole.launch({
  autoInject: false
});

// 自定义卫星窗口 URL
SatelliteConsole.launch({
  satelliteUrl: 'https://example.com/satellite-window.html'
});
```

**注意事项：**

- 如果浏览器阻止弹出窗口，需要用户手动允许
- 卫星窗口和业务页面必须同源才能通信
- 多次调用 `launch()` 不会创建多个窗口

---

### SatelliteConsole.injectOnly(pageId?)

仅注入日志拦截脚本，不打开新窗口。适用于多页面场景中的第二个及后续页面。

**类型签名：**

```typescript
function injectOnly(pageId?: string): void
```

**参数：**

- `pageId` (可选) - 自定义页面标识符，用于在卫星窗口中区分不同页面

**行为：**

1. 重写 `console.log`、`console.warn`、`console.error` 方法
2. 保留原始 console 方法的功能
3. 初始化 BroadcastChannel 连接
4. 开始拦截并转发日志

**示例：**

```javascript
// 使用默认页面标识（基于 URL + 时间戳）
SatelliteConsole.injectOnly();

// 使用自定义页面标识
SatelliteConsole.injectOnly('user-management-page');
SatelliteConsole.injectOnly('order-management-page');
SatelliteConsole.injectOnly('analytics-dashboard');
```

**最佳实践：**

在多页面应用中：
- 第一个页面使用 `launch()` 打开卫星窗口
- 其他页面使用 `injectOnly()` 只注入脚本

```javascript
// page1.html
if (!SatelliteConsole.isWindowOpen()) {
  SatelliteConsole.launch({ pageId: 'page1' });
} else {
  SatelliteConsole.injectOnly('page1');
}

// page2.html, page3.html, etc.
SatelliteConsole.injectOnly('page2');
```

---

### SatelliteConsole.isWindowOpen()

检查卫星窗口是否已打开。

**类型签名：**

```typescript
function isWindowOpen(): boolean
```

**返回值：**

- `true` - 卫星窗口已打开且未关闭
- `false` - 卫星窗口未打开或已关闭

**示例：**

```javascript
// 检查窗口状态
if (SatelliteConsole.isWindowOpen()) {
  console.log('卫星窗口已打开');
  SatelliteConsole.injectOnly();
} else {
  console.log('卫星窗口未打开');
  SatelliteConsole.launch();
}

// 条件启动
function ensureSatelliteWindow() {
  if (!SatelliteConsole.isWindowOpen()) {
    SatelliteConsole.launch();
  }
}

// 在用户操作时检查
button.addEventListener('click', () => {
  if (!SatelliteConsole.isWindowOpen()) {
    alert('请先打开卫星窗口');
    return;
  }
  // 执行操作...
});
```

**注意事项：**

- 窗口状态每秒自动检查一次
- 如果用户手动关闭窗口，状态会在 1 秒内更新

---

### SatelliteConsole.close()

关闭卫星窗口并停止监控。

**类型签名：**

```typescript
function close(): void
```

**行为：**

1. 关闭卫星窗口
2. 清除窗口引用
3. 停止窗口状态监控定时器

**示例：**

```javascript
// 关闭卫星窗口
SatelliteConsole.close();

// 在页面卸载时关闭
window.addEventListener('beforeunload', () => {
  SatelliteConsole.close();
});

// 提供关闭按钮
document.getElementById('closeBtn').addEventListener('click', () => {
  SatelliteConsole.close();
  console.log('卫星窗口已关闭');
});
```

**注意事项：**

- 关闭窗口后，业务页面的 console 方法仍然正常工作
- 可以随时调用 `launch()` 重新打开窗口

---

## 配置选项

### LaunchOptions

启动配置选项接口。

**类型定义：**

```typescript
interface LaunchOptions {
  width?: number;
  height?: number;
  pageId?: string;
  autoInject?: boolean;
  satelliteUrl?: string;
}
```

**属性说明：**

#### width

- **类型：** `number`
- **默认值：** `800`
- **说明：** 卫星窗口的宽度（像素）
- **范围：** 建议 600-1920

**示例：**

```javascript
SatelliteConsole.launch({ width: 1200 });
```

#### height

- **类型：** `number`
- **默认值：** `600`
- **说明：** 卫星窗口的高度（像素）
- **范围：** 建议 400-1080

**示例：**

```javascript
SatelliteConsole.launch({ height: 900 });
```

#### pageId

- **类型：** `string`
- **默认值：** `''` (自动生成)
- **说明：** 自定义页面标识符，用于在卫星窗口中区分不同页面
- **格式：** 建议使用短横线分隔的小写字母，如 `user-management`

**示例：**

```javascript
SatelliteConsole.launch({ pageId: 'homepage' });
SatelliteConsole.launch({ pageId: 'user-profile' });
SatelliteConsole.launch({ pageId: 'checkout-page' });
```

**自动生成规则：**

如果不提供 `pageId`，系统会自动生成，格式为：`{url}-{timestamp}`

#### autoInject

- **类型：** `boolean`
- **默认值：** `true`
- **说明：** 是否自动注入日志拦截脚本

**示例：**

```javascript
// 只打开窗口，不注入脚本
SatelliteConsole.launch({ autoInject: false });

// 稍后手动注入
setTimeout(() => {
  SatelliteConsole.injectOnly('my-page');
}, 1000);
```

#### satelliteUrl

- **类型：** `string`
- **默认值：** `'./dist/satellite-window.html'`
- **说明：** 卫星窗口的 URL 路径（相对或绝对路径）

**示例：**

```javascript
// 使用相对路径
SatelliteConsole.launch({
  satelliteUrl: './satellite-window.html'
});

// 使用绝对路径
SatelliteConsole.launch({
  satelliteUrl: 'https://example.com/tools/satellite-window.html'
});

// 使用 CDN
SatelliteConsole.launch({
  satelliteUrl: 'https://unpkg.com/satellite-console/dist/satellite-window.html'
});
```

---

## 类型定义

### LogEntry

日志条目接口，表示一条完整的日志记录。

```typescript
interface LogEntry {
  id: string;              // 唯一标识符
  level: LogLevel;         // 日志级别
  timestamp: number;       // 时间戳（毫秒）
  pageId: string;          // 来源页面标识
  pageUrl: string;         // 来源页面 URL
  args: SerializedValue[]; // 序列化后的日志参数
}
```

### LogLevel

日志级别类型。

```typescript
type LogLevel = 'log' | 'warn' | 'error';
```

### SerializedValue

序列化值类型，用于安全传输复杂对象。

```typescript
type SerializedValue = 
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'undefined'; value: undefined }
  | { type: 'object'; value: Record<string, SerializedValue>; preview: string }
  | { type: 'array'; value: SerializedValue[]; preview: string }
  | { type: 'function'; value: string }
  | { type: 'error'; message: string; stack?: string };
```

### FilterOptions

过滤选项接口，用于卫星窗口的日志过滤。

```typescript
interface FilterOptions {
  searchText?: string;     // 搜索关键词
  pageId?: string;         // 来源页面筛选
  levels?: LogLevel[];     // 日志级别筛选
}
```

---

## 事件和回调

当前版本不提供事件回调机制，但你可以通过以下方式监控状态：

### 监控窗口状态

```javascript
// 定期检查窗口状态
const checkInterval = setInterval(() => {
  if (!SatelliteConsole.isWindowOpen()) {
    console.log('卫星窗口已关闭');
    clearInterval(checkInterval);
  }
}, 1000);
```

### 监控日志发送

```javascript
// 重写 console 方法以添加自定义逻辑
const originalLog = console.log;
console.log = function(...args) {
  // 自定义逻辑
  onLogSent('log', args);
  
  // 调用原始方法（Satellite Console 会拦截）
  originalLog.apply(console, args);
};

function onLogSent(level, args) {
  // 处理日志发送事件
  console.info(`[Monitor] ${level} log sent:`, args);
}
```

---

## 最佳实践

### 1. 环境隔离

只在开发环境启用 Satellite Console：

```javascript
// 使用环境变量
if (process.env.NODE_ENV === 'development') {
  SatelliteConsole.launch();
}

// 使用条件判断
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1') {
  SatelliteConsole.launch();
}

// 使用特定参数
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true') {
  SatelliteConsole.launch();
}
```

### 2. 多页面应用

在多页面应用中，使用统一的初始化逻辑：

```javascript
// common.js - 所有页面共享
function initSatelliteConsole(pageId) {
  if (!SatelliteConsole.isWindowOpen()) {
    // 第一个页面打开窗口
    SatelliteConsole.launch({
      pageId: pageId,
      width: 1000,
      height: 700
    });
  } else {
    // 后续页面只注入脚本
    SatelliteConsole.injectOnly(pageId);
  }
}

// page1.html
initSatelliteConsole('page1-users');

// page2.html
initSatelliteConsole('page2-orders');
```

### 3. 错误处理

添加错误处理以提高健壮性：

```javascript
try {
  SatelliteConsole.launch();
} catch (error) {
  console.error('Failed to launch Satellite Console:', error);
  // 降级到普通 console
}

// 检查 BroadcastChannel 支持
if (!('BroadcastChannel' in window)) {
  console.warn('BroadcastChannel not supported, Satellite Console disabled');
} else {
  SatelliteConsole.launch();
}
```

### 4. 性能优化

避免在生产环境引入不必要的开销：

```javascript
// 动态加载
function loadSatelliteConsole() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/path/to/launcher.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 仅在需要时加载
if (process.env.NODE_ENV === 'development') {
  loadSatelliteConsole().then(() => {
    SatelliteConsole.launch();
  });
}
```

### 5. 自定义页面标识

使用有意义的页面标识，便于在卫星窗口中识别：

```javascript
// 不推荐：使用默认标识
SatelliteConsole.injectOnly();

// 推荐：使用描述性标识
SatelliteConsole.injectOnly('user-profile-page');
SatelliteConsole.injectOnly('checkout-step-1');
SatelliteConsole.injectOnly('admin-dashboard');

// 动态生成标识
const pageId = `${document.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
SatelliteConsole.injectOnly(pageId);
```

### 6. 窗口大小适配

根据屏幕尺寸调整窗口大小：

```javascript
const screenWidth = window.screen.width;
const screenHeight = window.screen.height;

SatelliteConsole.launch({
  width: Math.min(1200, screenWidth * 0.8),
  height: Math.min(900, screenHeight * 0.8)
});
```

### 7. 日志分类

使用前缀或标签对日志进行分类：

```javascript
// 使用前缀
console.log('[API]', 'Fetching user data...');
console.log('[UI]', 'Rendering component...');
console.log('[Auth]', 'User logged in');

// 使用对象标签
console.log({ module: 'API', action: 'fetch' }, 'User data:', userData);
console.warn({ module: 'Validation', field: 'email' }, 'Invalid format');
console.error({ module: 'Payment', code: 'E001' }, 'Transaction failed');
```

然后在卫星窗口中使用搜索功能过滤特定模块的日志。

---

## 限制和注意事项

### 1. 同源策略

卫星窗口和业务页面必须同源（相同协议、域名、端口），否则无法通信。

### 2. BroadcastChannel 限制

- 仅支持同源页面间通信
- 不支持跨域通信
- 不支持 Service Worker 中的通信

### 3. 日志大小限制

为避免性能问题，序列化有以下限制：
- 最大递归深度：3 层
- 字符串最大长度：1000 字符
- 数组最大长度：100 个元素

超出限制的内容会被截断。

### 4. 浏览器兼容性

不支持 Internet Explorer 和旧版本的 Safari（< 15.4）。

### 5. 弹窗拦截

浏览器可能会阻止 `window.open()` 创建的弹窗，需要用户手动允许。

---

## 故障排除

### 问题：卫星窗口没有打开

**可能原因：**
- 浏览器阻止了弹出窗口

**解决方案：**
1. 检查地址栏右侧的弹窗拦截图标
2. 点击允许弹出窗口
3. 重新调用 `SatelliteConsole.launch()`

### 问题：日志没有显示

**可能原因：**
- 卫星窗口未打开
- BroadcastChannel 不支持
- 跨域问题

**解决方案：**
1. 使用 `SatelliteConsole.isWindowOpen()` 检查窗口状态
2. 检查浏览器控制台是否有错误信息
3. 确认浏览器支持 BroadcastChannel
4. 确认业务页面和卫星窗口同源

### 问题：日志显示不完整

**可能原因：**
- 对象过于复杂，被截断

**解决方案：**
- 点击日志条目展开查看详细内容
- 对于超大对象，考虑分步记录

---

## 更新日志

### v1.0.0 (2024-12-08)

- ✨ 初始版本发布
- 🚀 支持多页面日志聚合
- 🔍 支持日志搜索和过滤
- ⚡ 虚拟滚动优化
- 📦 轻量级注入脚本（< 10KB）

---

**如有问题或建议，欢迎提交 Issue！**

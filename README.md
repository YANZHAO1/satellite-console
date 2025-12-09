# 🛰️ Satellite Console

> 浏览器端实时日志聚合工具，专为多页面应用（MPA）和微前端应用调试而设计

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## ✨ 功能特性

- 🚀 **统一日志视图** - 在独立窗口中查看所有页面的控制台日志，告别标签页切换
- 🔍 **强大的过滤功能** - 支持日志搜索和按来源页面筛选
- 🎨 **视觉区分** - 不同日志级别（log、warn、error）的清晰视觉区分
- 📦 **轻量级** - 注入脚本压缩后小于 10KB，对业务代码影响最小
- 🔄 **实时传输** - 基于 BroadcastChannel API，无需服务器，实时同步
- 💾 **详细展示** - 支持展开查看复杂对象、数组和错误堆栈
- ⚡ **高性能** - 虚拟滚动技术，轻松处理数千条日志
- 🛡️ **安全可靠** - 完善的错误处理，不影响业务代码运行
- 🎯 **性能优化** - 防抖、节流、GPU 加速，确保流畅体验

## 📦 安装

### 方式 1：通过 npm 安装（推荐）

```bash
npm install satellite-console --save-dev
```

然后在你的项目中引入：

```javascript
// ES Module
import 'satellite-console';

// 或者使用 CommonJS
require('satellite-console');
```

### 方式 2：本地部署（推荐用于传统项目）

下载以下文件到你的项目静态资源目录：
- `dist/launcher.min.js`
- `dist/satellite-window.html`
- `dist/satellite-app.min.js`

```
your-project/
├── static/
│   └── satellite-console/
│       ├── launcher.min.js
│       ├── satellite-window.html
│       └── satellite-app.min.js
└── index.html
```

然后在 HTML 中引入：

```html
<script src="/static/satellite-console/launcher.min.js"></script>
<script>
  // 会自动使用同目录的 satellite-window.html
  SatelliteConsole.launch();
</script>
```

### 方式 3：CDN + 本地文件（混合方式）

⚠️ **注意：** 由于同源策略限制，需要将 `satellite-window.html` 和 `satellite-app.min.js` 部署到你的服务器上。

1. 下载以下文件到你的项目：
   - `dist/satellite-window.html`
   - `dist/satellite-app.min.js`

2. 将它们放在同一目录下（例如 `/public/`）

3. 使用 CDN 加载 launcher，但指定本地的 satellite-window.html：

```html
<!-- 从 CDN 加载 launcher -->
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
<script>
  // 指定本地的 satellite-window.html
  SatelliteConsole.launch({
    satelliteUrl: '/satellite-window.html'
  });
</script>
```

**文件结构示例：**

```
your-project/
├── public/
│   ├── satellite-window.html      ← 必需
│   └── satellite-app.min.js       ← 必需（被 satellite-window.html 引用）
└── index.html
```

## 🚀 快速开始

### 基础使用（本地部署）

在你的应用入口文件中添加以下代码：

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- 你的应用内容 -->
  
  <!-- 引入本地的 Satellite Console -->
  <script src="/static/satellite-console/launcher.min.js"></script>
  <script>
    // 启动卫星控制台（自动使用同目录的 satellite-window.html）
    SatelliteConsole.launch();
    
    // 现在你可以正常使用 console
    console.log('Hello, Satellite Console!');
    console.warn('This is a warning');
    console.error('This is an error');
  </script>
</body>
</html>
```

### 使用 CDN（需要本地部署 satellite-window.html）

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- 你的应用内容 -->
  
  <!-- 从 CDN 加载 launcher -->
  <script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
  <script>
    // 指定本地的 satellite-window.html
    SatelliteConsole.launch({
      satelliteUrl: '/satellite-window.html'
    });
    
    // 现在你可以正常使用 console
    console.log('Hello, Satellite Console!');
    console.warn('This is a warning');
    console.error('This is an error');
  </script>
</body>
</html>
```

### ES Module 方式

```javascript
import { launch } from 'satellite-console';

// 仅在开发环境启动
if (process.env.NODE_ENV === 'development') {
  launch({
    width: 900,
    height: 700
  });
}

// 正常使用 console
console.log('Application started');
```

### 多页面应用场景

在第一个页面启动卫星窗口：

```javascript
// page1.html
SatelliteConsole.launch({
  width: 1000,
  height: 700
});
```

在其他页面只注入脚本：

```javascript
// page2.html, page3.html, etc.
SatelliteConsole.injectOnly('page2-custom-id');
```

## 📖 API 文档

### SatelliteConsole.launch(options?)

启动卫星控制台，打开卫星窗口并注入日志拦截脚本。

**参数：**

- `options` (可选) - 启动配置对象

**配置选项：**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | `number` | `800` | 卫星窗口的宽度（像素） |
| `height` | `number` | `600` | 卫星窗口的高度（像素） |
| `pageId` | `string` | `''` | 自定义页面标识符，用于区分不同页面 |
| `autoInject` | `boolean` | `true` | 是否自动注入日志拦截脚本 |
| `satelliteUrl` | `string` | `'./dist/satellite-window.html'` | 卫星窗口的 URL 路径 |

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
```

### SatelliteConsole.injectOnly(pageId?)

仅注入日志拦截脚本，不打开新窗口。适用于多页面场景中的第二个及后续页面。

**参数：**

- `pageId` (可选) - 自定义页面标识符

**示例：**

```javascript
// 使用默认页面标识
SatelliteConsole.injectOnly();

// 使用自定义页面标识
SatelliteConsole.injectOnly('user-management-page');
```

### SatelliteConsole.isWindowOpen()

检查卫星窗口是否已打开。

**返回值：**

- `boolean` - 窗口打开返回 `true`，否则返回 `false`

**示例：**

```javascript
if (SatelliteConsole.isWindowOpen()) {
  console.log('卫星窗口已打开');
  SatelliteConsole.injectOnly();
} else {
  console.log('卫星窗口未打开');
  SatelliteConsole.launch();
}
```

### SatelliteConsole.close()

关闭卫星窗口。

**示例：**

```javascript
// 关闭卫星窗口
SatelliteConsole.close();
```

## 🎯 使用场景

### 1. 多页面应用（MPA）调试

在传统的多页面应用中，每个页面都有独立的控制台。使用 Satellite Console，你可以在一个窗口中查看所有页面的日志。

```javascript
// 在主页面启动
SatelliteConsole.launch();

// 在其他页面注入
SatelliteConsole.injectOnly('page-name');
```

### 2. 微前端应用调试

在微前端架构中，多个子应用可能同时运行。Satellite Console 可以聚合所有子应用的日志。

```javascript
// 在主应用中启动
SatelliteConsole.launch({
  pageId: 'main-app'
});

// 在子应用中注入
SatelliteConsole.injectOnly('sub-app-1');
SatelliteConsole.injectOnly('sub-app-2');
```

### 3. 开发环境专用

只在开发环境启用 Satellite Console：

```javascript
if (process.env.NODE_ENV === 'development') {
  SatelliteConsole.launch();
}
```

### 4. 书签工具（Bookmarklet）

创建一个书签，随时启动 Satellite Console：

```javascript
javascript:(function(){
  var script = document.createElement('script');
  script.src = 'https://unpkg.com/satellite-console/dist/launcher.min.js';
  script.onload = function() { SatelliteConsole.launch(); };
  document.head.appendChild(script);
})();
```

## 🎨 卫星窗口功能

### 日志过滤

- **搜索框**：输入关键词实时过滤日志内容
- **来源筛选器**：按页面来源筛选日志
- **清空按钮**：清除所有历史日志

### 日志展示

- **时间戳**：每条日志显示精确的时间戳
- **日志级别**：通过颜色区分 log（蓝色）、warn（黄色）、error（红色）
- **来源标识**：显示日志来自哪个页面
- **对象展开**：点击对象和数组可以展开查看详细内容

### 性能优化

- **虚拟滚动**：只渲染可见区域的日志，支持数千条日志流畅滚动
- **日志限制**：默认最多存储 10,000 条日志，超出后自动删除最旧的日志

## 🔧 高级配置

### 自定义序列化配置

虽然当前版本不直接暴露序列化配置，但你可以通过修改源码来调整：

```typescript
// src/serializer.ts
const DEFAULT_CONFIG = {
  maxDepth: 3,           // 最大递归深度
  maxStringLength: 1000, // 字符串最大长度
  maxArrayLength: 100    // 数组最大长度
};
```

### 自定义 BroadcastChannel 名称

默认使用 `satellite-console-channel`，可以在源码中修改：

```typescript
// src/injection-script.ts
const CHANNEL_NAME = 'satellite-console-channel';
```

## ⚠️ 重要：同源策略限制

**Satellite Console 使用 BroadcastChannel API 进行通信，受浏览器同源策略限制。**

### 什么是同源策略？

业务页面和卫星窗口必须在**相同的域名、协议和端口**下才能通信。

### ✅ 可以工作的场景

```javascript
// 场景 1：通过 npm 安装，构建工具会打包到同一域名
import { launch } from 'satellite-console';
launch();

// 场景 2：本地部署所有文件
<script src="./dist/launcher.min.js"></script>
<script>
  SatelliteConsole.launch(); // 自动使用 ./dist/satellite-window.html
</script>

// 场景 3：CDN + 本地 satellite-window.html
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
<script>
  SatelliteConsole.launch({
    satelliteUrl: '/satellite-window.html' // 部署在你的服务器上
  });
</script>
```

### ❌ 不能工作的场景

```javascript
// ❌ 错误：业务页面在 localhost，卫星窗口在 CDN
// 业务页面：http://localhost:8080
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
<script>
  SatelliteConsole.launch({
    satelliteUrl: 'https://unpkg.com/satellite-console/dist/satellite-window.html'
  });
  // 窗口能打开，但无法接收日志（跨域）
</script>
```

### 📦 推荐的部署方式

#### 方式 1：NPM 包（最推荐）

```bash
npm install satellite-console
```

```javascript
import { launch } from 'satellite-console';
launch(); // 构建工具会处理所有文件
```

#### 方式 2：本地部署全部文件

1. 下载 `dist/` 目录的以下文件：
   - `launcher.min.js`
   - `satellite-window.html`
   - `satellite-app.min.js`

2. 放到你的项目静态资源目录（保持在同一目录下）

3. 引入本地文件

```html
<script src="/static/satellite-console/launcher.min.js"></script>
<script>
  SatelliteConsole.launch(); // 自动使用同目录的 satellite-window.html
</script>
```

**文件结构：**

```
your-project/
├── static/
│   └── satellite-console/
│       ├── launcher.min.js
│       ├── satellite-window.html
│       └── satellite-app.min.js      ← 被 satellite-window.html 引用
└── index.html
```

#### 方式 3：CDN + 本地文件

⚠️ **重要：** 需要同时下载 `satellite-window.html` 和 `satellite-app.min.js` 两个文件。

1. 从 npm 包或 GitHub 下载：
   - `dist/satellite-window.html`
   - `dist/satellite-app.min.js`

2. 将它们放在同一目录下（如 `/public/`）

3. 使用 CDN 加载 launcher，但指定本地的 satellite-window.html

```html
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
<script>
  SatelliteConsole.launch({
    satelliteUrl: '/satellite-window.html' // 使用本地文件
  });
</script>
```

**文件结构：**

```
your-project/
├── public/
│   ├── satellite-window.html
│   └── satellite-app.min.js         ← 必需，被 satellite-window.html 引用
└── index.html
```

### 🔍 如何判断是否跨域？

打开浏览器控制台，如果看到类似错误，说明遇到了跨域问题：

```
业务页面：http://localhost:8080
卫星窗口：https://unpkg.com/...
结果：无法通信（不同域名）
```

**解决方法：** 确保业务页面和 satellite-window.html 在同一个域名下。

## 🌐 浏览器兼容性

Satellite Console 依赖 BroadcastChannel API，支持以下浏览器：

| 浏览器 | 最低版本 | 说明 |
|--------|----------|------|
| Chrome | 54+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| Firefox | 38+ | ✅ 完全支持 |
| Safari | 15.4+ | ✅ 完全支持 |
| Opera | 41+ | ✅ 完全支持 |

**不支持的浏览器：**
- Internet Explorer（所有版本）
- Safari < 15.4

**兼容性检测：**

```javascript
if ('BroadcastChannel' in window) {
  SatelliteConsole.launch();
} else {
  console.warn('当前浏览器不支持 BroadcastChannel API');
}
```

## 📝 示例

项目包含完整的示例代码，位于 `examples/` 目录：

- **basic.html** - 基础功能演示
- **multi-page/** - 多页面场景演示
  - page1.html - 用户管理页面
  - page2.html - 订单管理页面
  - page3.html - 数据分析页面

查看 [examples/README.md](./examples/README.md) 了解详细使用说明。

## 🛠️ 开发

### 环境要求

- Node.js 16+
- npm 7+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

监听文件变化，自动重新构建。

### 构建生产版本

```bash
npm run build
```

生成压缩后的文件到 `dist/` 目录。

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch
```

### 清理构建文件

```bash
npm run clean
```

## 📂 项目结构

```
satellite-console/
├── src/                          # 源代码
│   ├── injection-script.ts       # 注入脚本（拦截 console）
│   ├── launcher.ts               # 启动器（API 入口）
│   ├── satellite-app.ts          # 卫星窗口应用逻辑
│   ├── satellite-window.html     # 卫星窗口 HTML
│   ├── log-store.ts              # 日志存储模块
│   ├── log-filter.ts             # 日志过滤模块
│   ├── serializer.ts             # 日志序列化模块
│   ├── virtual-scroller.ts       # 虚拟滚动模块
│   └── types.ts                  # TypeScript 类型定义
├── dist/                         # 构建输出
│   ├── injection-script.min.js   # 注入脚本（压缩）
│   ├── launcher.min.js           # 启动器（压缩）
│   ├── satellite-app.min.js      # 卫星窗口逻辑（压缩）
│   └── satellite-window.html     # 卫星窗口页面
├── examples/                     # 示例代码
│   ├── basic.html                # 基础示例
│   ├── multi-page/               # 多页面示例
│   └── README.md                 # 示例说明
├── package.json
├── tsconfig.json
├── rollup.config.js
└── README.md
```

## ❓ 常见问题

### Q: 卫星窗口打开了，但看不到日志？

A: **这是最常见的问题，通常是跨域导致的。** 检查：

1. **业务页面和卫星窗口是否同源？**
   - 业务页面：`http://localhost:8080`
   - 卫星窗口：`https://unpkg.com/...` ❌ 不同源，无法通信
   - 解决：使用本地部署或 npm 包方式

2. 打开浏览器控制台，查看是否有错误信息

3. 确认浏览器支持 BroadcastChannel API（Chrome 54+, Firefox 38+, Safari 15.4+）

**推荐解决方案：**

```bash
# 方案 1：使用 npm 包（最简单）
npm install satellite-console
```

```javascript
// 方案 2：下载以下文件到本地（必须在同一目录）
// - satellite-window.html
// - satellite-app.min.js
// 然后指定本地路径
SatelliteConsole.launch({
  satelliteUrl: '/satellite-window.html'
});
```

**注意：** `satellite-window.html` 会加载同目录下的 `satellite-app.min.js`，所以这两个文件必须放在一起。

### Q: 卫星窗口没有打开？

A: 检查浏览器是否阻止了弹出窗口。在地址栏右侧查看弹窗拦截图标，点击允许后重试。

### Q: 如何在多页面应用中使用？

A: 在第一个页面使用 `launch()` 打开卫星窗口，在其他页面使用 `injectOnly()` 只注入脚本。

```javascript
// page1.html - 主页面
SatelliteConsole.launch();

// page2.html, page3.html - 其他页面
SatelliteConsole.injectOnly('page2');
```

### Q: 可以从 CDN 直接使用吗？

A: 可以，但需要将 `satellite-window.html` 和 `satellite-app.min.js` 部署到本地：

```html
<!-- ✅ 可以：launcher 从 CDN，satellite-window.html 和 satellite-app.min.js 从本地 -->
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
<script>
  SatelliteConsole.launch({
    satelliteUrl: '/satellite-window.html' // 本地文件
  });
</script>
```

**必需的本地文件：**
```
your-project/
├── public/
│   ├── satellite-window.html      ← 必需
│   └── satellite-app.min.js       ← 必需（被 satellite-window.html 引用）
└── index.html
```

```html
<!-- ❌ 不行：全部从 CDN（跨域问题） -->
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
<script>
  SatelliteConsole.launch({
    satelliteUrl: 'https://unpkg.com/satellite-console/dist/satellite-window.html'
  });
  // 窗口能打开，但无法接收日志（跨域）
</script>
```

### Q: 会影响生产环境吗？

A: 建议只在开发环境使用。可以通过环境变量控制：

```javascript
if (process.env.NODE_ENV === 'development') {
  SatelliteConsole.launch();
}
```

### Q: 支持移动端浏览器吗？

A: 移动端浏览器对 BroadcastChannel 的支持有限，建议在桌面浏览器中使用。

### Q: 如何自定义卫星窗口的样式？

A: 可以修改 `src/satellite-window.html` 中的 CSS 样式，然后重新构建。

## 📚 文档

- [API 文档](docs/API.md) - 完整的 API 参考
- [错误处理](docs/ERROR_HANDLING.md) - 错误处理和降级策略
- [性能优化](docs/PERFORMANCE.md) - 性能优化措施和最佳实践

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

Satellite Console 的设计灵感来自于后端日志聚合工具（如 ELK），旨在为前端开发者提供类似的调试体验。

---

**Happy Debugging! 🐛✨**

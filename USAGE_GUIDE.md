# Satellite Console 使用指南

## 🎯 在其他项目中使用 Satellite Console

本指南详细说明如何在你的项目中集成和使用 Satellite Console。

---

## 📋 前置要求

### 重要：同源策略限制

Satellite Console 使用 **BroadcastChannel API** 进行通信，受浏览器**同源策略**限制。

**简单来说：** 业务页面和卫星窗口必须在同一个域名下才能通信。

```
✅ 可以通信：
- 业务页面：http://localhost:8080/index.html
- 卫星窗口：http://localhost:8080/satellite-window.html

❌ 无法通信：
- 业务页面：http://localhost:8080/index.html
- 卫星窗口：https://unpkg.com/satellite-console/dist/satellite-window.html
```

---

## 🚀 使用方式

### 方式 1：NPM 包（最推荐）⭐

适用于使用 Webpack、Vite、Rollup 等构建工具的项目。

#### 1. 安装

```bash
npm install satellite-console --save-dev
```

#### 2. 在项目入口引入

```javascript
// main.js 或 index.js
import { launch } from 'satellite-console';

// 仅在开发环境启用
if (process.env.NODE_ENV === 'development') {
  launch({
    width: 1000,
    height: 700
  });
}

// 正常使用 console
console.log('Hello World');
console.warn('Warning message');
console.error('Error message');
```

#### 3. 构建项目

```bash
npm run build
# 或
npm run dev
```

构建工具会自动将 Satellite Console 打包到你的项目中，所有文件都在同一域名下，没有跨域问题。

---

### 方式 2：本地部署（适合传统项目）

适用于不使用构建工具的传统 HTML 项目。

#### 1. 下载文件

从 npm 包或 GitHub 下载以下文件到你的项目：

```
your-project/
├── static/
│   └── satellite-console/
│       ├── launcher.min.js
│       └── satellite-window.html
└── index.html
```

你可以通过以下方式获取文件：

```bash
# 方式 A：通过 npm 下载
npm install satellite-console
# 然后复制 node_modules/satellite-console/dist/ 目录

# 方式 B：从 GitHub 下载
# https://github.com/YANZHAO1/satellite-console/tree/main/dist
```

#### 2. 在 HTML 中引入

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1>My Application</h1>
  
  <!-- 引入本地的 Satellite Console -->
  <script src="/static/satellite-console/launcher.min.js"></script>
  <script>
    // 启动卫星控制台
    // 会自动使用同目录的 satellite-window.html
    SatelliteConsole.launch();
    
    // 正常使用 console
    console.log('Application started');
  </script>
</body>
</html>
```

---

### 方式 3：CDN + 本地 satellite-window.html（混合方式）

适用于想使用 CDN 加速，但又需要避免跨域问题的场景。

#### 1. 下载 satellite-window.html

只需要下载 `satellite-window.html` 文件到你的项目：

```
your-project/
├── public/
│   └── satellite-window.html
└── index.html
```

#### 2. 使用 CDN 加载 launcher，指定本地 satellite-window.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1>My Application</h1>
  
  <!-- 从 CDN 加载 launcher -->
  <script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
  <script>
    // 启动卫星控制台，指定本地的 satellite-window.html
    SatelliteConsole.launch({
      satelliteUrl: '/satellite-window.html' // 使用本地文件
    });
    
    // 正常使用 console
    console.log('Application started');
  </script>
</body>
</html>
```

---

## 🔧 多页面应用场景

### 场景说明

在多页面应用（MPA）中，你可能有多个 HTML 页面：

```
your-app/
├── page1.html  (用户管理)
├── page2.html  (订单管理)
└── page3.html  (数据分析)
```

你希望在一个卫星窗口中查看所有页面的日志。

### 实现方式

#### 第一个页面：启动卫星窗口

```html
<!-- page1.html -->
<script src="/static/satellite-console/launcher.min.js"></script>
<script>
  // 启动卫星窗口
  SatelliteConsole.launch({
    pageId: 'user-management',
    width: 1200,
    height: 800
  });
  
  console.log('用户管理页面加载完成');
</script>
```

#### 其他页面：只注入脚本

```html
<!-- page2.html -->
<script src="/static/satellite-console/launcher.min.js"></script>
<script>
  // 只注入脚本，不打开新窗口
  SatelliteConsole.injectOnly('order-management');
  
  console.log('订单管理页面加载完成');
</script>
```

```html
<!-- page3.html -->
<script src="/static/satellite-console/launcher.min.js"></script>
<script>
  // 只注入脚本，不打开新窗口
  SatelliteConsole.injectOnly('data-analysis');
  
  console.log('数据分析页面加载完成');
</script>
```

### 智能检测（推荐）

更好的方式是检测卫星窗口是否已打开：

```javascript
// 在所有页面使用相同的代码
if (SatelliteConsole.isWindowOpen()) {
  // 窗口已打开，只注入脚本
  SatelliteConsole.injectOnly('page-name');
} else {
  // 窗口未打开，启动卫星窗口
  SatelliteConsole.launch({
    pageId: 'page-name'
  });
}
```

---

## 🎨 配置选项

### launch(options)

```javascript
SatelliteConsole.launch({
  width: 1000,           // 窗口宽度（默认 800）
  height: 700,           // 窗口高度（默认 600）
  pageId: 'my-page',     // 页面标识（默认自动生成）
  autoInject: true,      // 是否自动注入脚本（默认 true）
  satelliteUrl: '/path'  // 卫星窗口 URL（默认 './dist/satellite-window.html'）
});
```

### injectOnly(pageId)

```javascript
// 使用默认页面标识
SatelliteConsole.injectOnly();

// 使用自定义页面标识
SatelliteConsole.injectOnly('custom-page-id');
```

---

## 🐛 故障排查

### 问题 1：窗口打开了，但看不到日志

**原因：** 跨域问题，业务页面和卫星窗口不在同一域名下。

**解决方案：**

1. 检查卫星窗口的 URL（在浏览器地址栏查看）
2. 确保它和业务页面在同一域名下
3. 使用本地部署方式（方式 2）或 npm 包方式（方式 1）

**示例：**

```javascript
// ❌ 错误：跨域
// 业务页面：http://localhost:8080
// 卫星窗口：https://unpkg.com/...

// ✅ 正确：同域
// 业务页面：http://localhost:8080
// 卫星窗口：http://localhost:8080/satellite-window.html
SatelliteConsole.launch({
  satelliteUrl: '/satellite-window.html'
});
```

### 问题 2：窗口没有打开

**原因：** 浏览器阻止了弹出窗口。

**解决方案：**

1. 查看浏览器地址栏右侧是否有弹窗拦截图标
2. 点击允许弹出窗口
3. 刷新页面重试

### 问题 3：浏览器不支持

**原因：** 浏览器版本太旧，不支持 BroadcastChannel API。

**解决方案：**

升级浏览器到以下版本：
- Chrome 54+
- Firefox 38+
- Safari 15.4+
- Edge 79+

---

## 📝 完整示例

### 示例 1：Vue 项目

```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import { launch } from 'satellite-console';

// 开发环境启用 Satellite Console
if (import.meta.env.DEV) {
  launch({
    width: 1200,
    height: 800,
    pageId: 'vue-app'
  });
}

createApp(App).mount('#app');
```

### 示例 2：React 项目

```javascript
// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { launch } from 'satellite-console';

// 开发环境启用 Satellite Console
if (process.env.NODE_ENV === 'development') {
  launch({
    width: 1200,
    height: 800,
    pageId: 'react-app'
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### 示例 3：传统 HTML 项目

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1>Welcome</h1>
  
  <script src="/static/satellite-console/launcher.min.js"></script>
  <script>
    // 启动卫星控制台
    SatelliteConsole.launch();
    
    // 你的业务代码
    console.log('Page loaded');
    
    document.querySelector('h1').addEventListener('click', () => {
      console.log('Title clicked');
    });
  </script>
</body>
</html>
```

---

## 💡 最佳实践

### 1. 只在开发环境使用

```javascript
if (process.env.NODE_ENV === 'development') {
  SatelliteConsole.launch();
}
```

### 2. 使用有意义的 pageId

```javascript
// ❌ 不好
SatelliteConsole.launch({ pageId: 'page1' });

// ✅ 好
SatelliteConsole.launch({ pageId: 'user-management' });
```

### 3. 多页面应用使用智能检测

```javascript
if (SatelliteConsole.isWindowOpen()) {
  SatelliteConsole.injectOnly('page-name');
} else {
  SatelliteConsole.launch({ pageId: 'page-name' });
}
```

### 4. 自定义窗口大小

```javascript
// 根据你的屏幕大小调整
SatelliteConsole.launch({
  width: 1400,
  height: 900
});
```

---

## 🔗 相关链接

- [GitHub 仓库](https://github.com/YANZHAO1/satellite-console)
- [NPM 包](https://www.npmjs.com/package/satellite-console)
- [API 文档](docs/API.md)
- [示例代码](examples/)

---

## ❓ 还有问题？

如果遇到问题，请：

1. 查看 [常见问题](README.md#❓-常见问题)
2. 查看 [故障排查文档](TROUBLESHOOTING.md)
3. 提交 [GitHub Issue](https://github.com/YANZHAO1/satellite-console/issues)

---

**Happy Debugging! 🐛✨**

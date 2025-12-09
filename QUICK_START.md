# 🚀 快速开始指南

## 5 分钟上手 Satellite Console

### 步骤 1: 安装

选择以下任一方式：

#### 方式 A: npm 安装（推荐）

```bash
npm install satellite-console --save-dev
```

#### 方式 B: CDN 引入

```html
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
```

### 步骤 2: 在页面中引入

#### 如果使用 npm：

```javascript
// 在你的入口文件（如 main.js）中
import 'satellite-console';
```

#### 如果使用 CDN：

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1>我的应用</h1>
  
  <!-- 在页面底部引入 -->
  <script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
</body>
</html>
```

### 步骤 3: 打开 Satellite Console

在浏览器控制台中运行：

```javascript
window.openSatelliteConsole();
```

或者在页面中添加一个按钮：

```html
<button onclick="window.openSatelliteConsole()">
  🛰️ 打开 Satellite Console
</button>
```

### 步骤 4: 开始使用

现在你可以在任何页面中使用 `console.log()`、`console.warn()` 或 `console.error()`，所有日志都会显示在 Satellite Console 窗口中！

```javascript
console.log('这是一条普通日志');
console.warn('这是一条警告');
console.error('这是一条错误');

// 支持复杂对象
console.log('用户数据:', { 
  name: '张三', 
  age: 25, 
  hobbies: ['编程', '阅读'] 
});
```

## 常见使用场景

### 场景 1: 多页面应用调试

```html
<!-- page1.html -->
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
<script>
  console.log('页面 1 加载完成');
</script>

<!-- page2.html -->
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
<script>
  console.log('页面 2 加载完成');
</script>
```

打开 Satellite Console 后，可以同时看到两个页面的日志！

### 场景 2: 微前端应用

```javascript
// 主应用
import 'satellite-console';

// 子应用 A
console.log('[子应用A] 初始化完成');

// 子应用 B
console.log('[子应用B] 初始化完成');
```

所有子应用的日志都会聚合到一个窗口中。

### 场景 3: 开发环境专用

```javascript
// 只在开发环境引入
if (process.env.NODE_ENV === 'development') {
  import('satellite-console');
}
```

## 高级功能

### 搜索日志

在 Satellite Console 的搜索框中输入关键词，实时过滤日志。

### 按来源筛选

使用来源下拉菜单，只查看特定页面的日志。

### 清空日志

点击"清空"按钮，清除所有日志。

### 展开对象

点击复杂对象的日志条目，展开查看详细内容。

## 浏览器兼容性

- ✅ Chrome 54+
- ✅ Firefox 38+
- ✅ Safari 15.4+
- ✅ Edge 79+

## 故障排除

### 问题 1: 日志没有显示

**解决方案：**
1. 确保所有页面都引入了 Satellite Console
2. 检查浏览器控制台是否有错误
3. 确认浏览器支持 BroadcastChannel API

### 问题 2: 无法打开 Satellite Console 窗口

**解决方案：**
1. 检查浏览器是否阻止了弹窗
2. 尝试手动允许弹窗
3. 使用 `window.openSatelliteConsole()` 手动打开

### 问题 3: 性能问题

**解决方案：**
1. 定期清空日志
2. 使用搜索和筛选功能减少显示的日志数量
3. 避免在循环中大量输出日志

## 下一步

- 📖 阅读完整的 [README.md](./README.md)
- 📚 查看 [API 文档](./docs/API.md)
- ⚡ 了解 [性能优化](./docs/PERFORMANCE.md)
- 🐛 查看 [错误处理](./docs/ERROR_HANDLING.md)

## 需要帮助？

- 🐛 [提交 Issue](https://github.com/yourusername/satellite-console/issues)
- 💬 [讨论区](https://github.com/yourusername/satellite-console/discussions)
- 📧 联系作者

---

**享受调试的乐趣！** 🎉

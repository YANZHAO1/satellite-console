# 错误处理和边界情况文档

本文档描述了 Satellite Console 中实现的错误处理策略和边界情况处理。

## 浏览器兼容性检测

### 支持的浏览器

- Chrome/Edge: 54+
- Firefox: 38+
- Safari: 15.4+

### 兼容性检查

系统在初始化时会检查以下 API 的可用性：

1. **BroadcastChannel API** - 用于跨页面通信
2. **WeakSet** - 用于循环引用检测
3. **requestAnimationFrame** - 用于性能优化

如果浏览器不支持这些 API，系统会：
- 显示友好的错误提示
- 提供浏览器升级建议
- 阻止进一步初始化以避免运行时错误

## 注入脚本错误处理

### 1. BroadcastChannel 不可用

**场景**: 浏览器不支持 BroadcastChannel 或初始化失败

**处理策略**:
- 降级到仅使用原始 console 方法
- 不发送消息到卫星窗口
- 不影响业务代码的正常运行
- 在控制台输出警告信息

```typescript
// 示例
if (typeof BroadcastChannel === 'undefined') {
  console.warn('[Satellite Console] BroadcastChannel is not supported');
  return; // 降级处理
}
```

### 2. 消息发送失败

**场景**: postMessage 调用失败

**处理策略**:
- 捕获异常，避免影响业务代码
- 尝试发送错误占位符消息
- 完全静默失败（不输出错误到控制台）

### 3. 序列化失败

**场景**: 日志参数无法序列化

**处理策略**:
- 使用错误占位符替代
- 发送 `[Serialization failed]` 消息
- 保持原始 console 功能正常

### 4. 空日志处理

**场景**: `console.log()` 不带参数调用

**处理策略**:
- 自动添加空字符串作为参数
- 正常发送消息到卫星窗口

## 卫星窗口错误处理

### 1. 消息验证

**验证的字段**:
- `type`: 必须是 'log'
- `payload`: 必须存在
- `payload.id`: 必须是字符串
- `payload.level`: 必须是 'log', 'warn', 或 'error'
- `payload.timestamp`: 必须是数字
- `payload.pageId`: 必须是字符串
- `payload.pageUrl`: 必须是字符串
- `payload.args`: 必须是数组

**处理策略**:
- 拒绝无效消息
- 在控制台输出警告
- 不影响后续消息的接收

### 2. 消息解析失败

**场景**: 接收到的消息格式错误

**处理策略**:
- 捕获异常
- 记录错误日志
- 跳过该消息
- 继续处理后续消息

### 3. 渲染异常

**场景**: 日志条目渲染失败

**处理策略**:
- 使用错误边界捕获异常
- 显示错误占位符 `[渲染失败：日志格式错误]`
- 不影响其他日志的渲染

### 4. BroadcastChannel 连接失败

**场景**: 无法创建 BroadcastChannel 连接

**处理策略**:
- 显示错误提示界面
- 提供刷新页面的建议
- 阻止进一步操作

## 边界情况处理

### 1. 空日志

```javascript
console.log(); // 无参数
```

**处理**: 自动添加空字符串，正常发送

### 2. 超长字符串

```javascript
console.log('a'.repeat(100000)); // 10万字符
```

**处理**: 
- 在渲染时截断到 10,000 字符
- 添加 `... [truncated]` 标记
- 避免 DOM 性能问题

### 3. 特殊字符和 XSS 尝试

```javascript
console.log('<script>alert("xss")</script>');
```

**处理**:
- URL 清理：移除 `<>'"` 等危险字符
- 使用 `textContent` 而非 `innerHTML`
- 防止 XSS 攻击

### 4. 循环引用

```javascript
const obj = {};
obj.self = obj;
console.log(obj);
```

**处理**:
- 使用 WeakSet 检测循环引用
- 替换为 `[Circular]` 标记
- 避免无限递归

### 5. 深度嵌套对象

```javascript
let deep = { value: 'end' };
for (let i = 0; i < 20; i++) {
  deep = { nested: deep };
}
console.log(deep);
```

**处理**:
- 限制序列化深度为 3 层
- 超过深度显示 `[Max depth exceeded]`
- 渲染时限制深度为 10 层

### 6. 大型对象

```javascript
const large = {};
for (let i = 0; i < 1000; i++) {
  large[`key${i}`] = `value${i}`;
}
console.log(large);
```

**处理**:
- 正常序列化和传输
- 使用虚拟滚动优化渲染
- 限制最大日志存储数量（10,000 条）

### 7. 大型数组

```javascript
console.log(new Array(10000).fill('item'));
```

**处理**:
- 序列化时限制为前 100 个元素
- 添加 `... [truncated]` 标记

### 8. null 和 undefined

```javascript
console.log(null, undefined);
```

**处理**: 正确序列化和显示为 'null' 和 'undefined'

### 9. Error 对象

```javascript
console.error(new Error('Test error'));
```

**处理**:
- 提取 message 和 stack
- 完整显示堆栈信息
- 支持展开/折叠

### 10. 函数

```javascript
console.log(function test() { return 42; });
```

**处理**:
- 转换为字符串表示
- 显示函数名称

### 11. Symbol

```javascript
console.log({ [Symbol('test')]: 'value' });
```

**处理**:
- Symbol 键会被 JSON 序列化忽略
- 只显示普通属性

### 12. Date 对象

```javascript
console.log(new Date());
```

**处理**: 转换为 ISO 字符串格式

### 13. Unicode 和 Emoji

```javascript
console.log('你好世界 🎉🚀💻');
```

**处理**: 完整支持，正确显示

## 性能边界

### 1. 快速连续日志

**场景**: 短时间内产生大量日志

**处理**:
- 使用虚拟滚动只渲染可见区域
- 限制最大存储数量（FIFO 策略）
- 使用 requestAnimationFrame 优化滚动

### 2. 大量日志过滤

**场景**: 对 10,000+ 条日志进行过滤

**处理**:
- 高效的过滤算法
- 虚拟滚动减少 DOM 节点
- 防抖搜索输入

## 内存管理

### 日志存储限制

- **默认最大**: 10,000 条日志
- **策略**: FIFO（先进先出）
- **清理**: 超出限制时自动删除最旧的日志

### 防止内存泄漏

- 使用 WeakSet 追踪对象引用
- 及时清理事件监听器
- 限制序列化深度和长度

## 错误恢复

### 1. 渲染失败恢复

如果单条日志渲染失败：
- 显示错误占位符
- 继续渲染其他日志
- 不影响整体功能

### 2. 连接失败恢复

如果 BroadcastChannel 连接失败：
- 显示错误提示
- 提供刷新建议
- 可以手动重新初始化

## 测试覆盖

所有错误处理和边界情况都有对应的单元测试：

- `src/injection-script.test.ts` - 注入脚本测试
- `src/satellite-app.test.ts` - 卫星窗口测试
- `src/serializer.test.ts` - 序列化测试

运行测试：

```bash
npm test
```

## 最佳实践

### 对于开发者

1. **始终使用 try-catch**: 所有可能失败的操作都应该包裹在 try-catch 中
2. **降级策略**: 确保核心功能（原始 console）始终可用
3. **用户友好**: 提供清晰的错误提示和解决建议
4. **静默失败**: 调试工具不应该干扰业务代码

### 对于用户

1. **使用现代浏览器**: 确保浏览器版本满足最低要求
2. **检查弹窗拦截**: 允许网站打开弹窗窗口
3. **刷新重试**: 遇到连接问题时尝试刷新页面
4. **报告问题**: 遇到未处理的错误时提供详细信息

## 未来改进

1. **离线支持**: 使用 Service Worker 缓存日志
2. **错误上报**: 自动收集和上报错误信息
3. **性能监控**: 添加性能指标收集
4. **更好的降级**: 在不支持的浏览器中提供替代方案

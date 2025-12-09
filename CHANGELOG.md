# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-09

### Added
- 🎉 首次发布
- 🚀 统一日志视图，在独立窗口中查看所有页面的控制台日志
- 🔍 强大的过滤功能，支持日志搜索和按来源页面筛选
- 🎨 不同日志级别（log、warn、error）的清晰视觉区分
- 📦 轻量级设计，注入脚本压缩后小于 10KB
- 🔄 基于 BroadcastChannel API 的实时日志传输
- 💾 支持展开查看复杂对象、数组和错误堆栈
- ⚡ 虚拟滚动技术，轻松处理数千条日志
- 🛡️ 完善的错误处理机制
- 🎯 性能优化：防抖、节流、GPU 加速

### Features
- **动态效果**
  - 日志条目淡入滑动动画
  - 悬停时的交互反馈
  - 警告日志持续发光效果
  - 错误日志脉冲效果和图标抖动
  - 工具栏滑入动画
  - 按钮涟漪波纹效果

- **实时统计**
  - 显示信息、警告、错误日志数量
  - 颜色标识不同日志级别
  - 新日志到达提示

- **用户体验**
  - 最新日志显示在顶部
  - 自动滚动到最新日志
  - 日志条目高度自适应内容
  - 底部留白设计
  - 响应式布局，支持移动端

- **搜索和筛选**
  - 实时搜索日志内容
  - 按来源页面筛选
  - 清除筛选条件按钮
  - 聚焦时的发光边框效果

### Technical
- TypeScript 5.3
- Rollup 打包
- Vitest 单元测试
- Playwright E2E 测试
- 虚拟滚动优化
- CSS Containment 优化
- GPU 加速动画

### Documentation
- 完整的 README 文档
- API 文档
- 性能优化指南
- 错误处理文档
- 发布指南
- 动态效果说明

## [1.0.1] - 2024-12-09

### Changed
- 📝 更新 README.md 文档，明确说明 CDN 使用方式
- 📝 添加 USAGE_GUIDE.md 完整使用指南
- 📝 改进文档说明，强调同源策略限制和文件依赖关系

### Documentation
- 明确说明使用 CDN 时需要本地部署 `satellite-window.html` 和 `satellite-app.min.js`
- 添加详细的文件结构示例
- 更新常见问题解答，增加跨域问题的详细说明
- 新增 USAGE_GUIDE.md，提供各种使用场景的完整示例

## [Unreleased]

### Planned
- [ ] 支持自定义主题颜色
- [ ] 日志导出功能
- [ ] 日志高亮搜索结果
- [ ] 性能监控面板
- [ ] 更多日志级别支持
- [ ] 日志过滤动画
- [ ] 浏览器扩展版本

---

[1.0.0]: https://github.com/yourusername/satellite-console/releases/tag/v1.0.0

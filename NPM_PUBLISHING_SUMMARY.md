# 📦 npm 发布总结

## 已完成的准备工作

### ✅ 1. 配置文件

- **package.json** - 已更新，包含：
  - ✅ 正确的 `name`、`version`、`description`
  - ✅ `main`、`module`、`types` 入口点
  - ✅ `exports` 字段，支持多种导入方式
  - ✅ `files` 字段，控制发布内容
  - ✅ `repository`、`bugs`、`homepage` 链接
  - ✅ `keywords` 关键词
  - ✅ `prepublishOnly` 脚本

- **.npmignore** - 已创建，排除不必要的文件

- **LICENSE** - MIT 许可证

### ✅ 2. 文档

- **README.md** - 已更新安装说明
- **CHANGELOG.md** - 版本变更记录
- **PUBLISHING.md** - 详细的发布指南
- **QUICK_START.md** - 快速开始指南
- **NPM_PUBLISHING_SUMMARY.md** - 本文档

### ✅ 3. 发布脚本

- **scripts/publish.sh** - Linux/Mac 发布脚本
- **scripts/publish.ps1** - Windows PowerShell 发布脚本
- **scripts/pre-publish-check.js** - 发布前检查脚本

### ✅ 4. npm 脚本命令

```json
{
  "check:publish": "检查发布准备情况",
  "publish:patch": "发布补丁版本",
  "publish:minor": "发布次要版本",
  "publish:major": "发布主要版本"
}
```

## 🚀 发布步骤

### 首次发布

#### 1. 更新 package.json 中的信息

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "url": "https://github.com/yourusername/satellite-console.git"
  }
}
```

#### 2. 检查包名是否可用

```bash
npm view satellite-console
```

如果显示 404，说明包名可用。如果已被占用，需要更改包名：

```json
{
  "name": "@yourusername/satellite-console"
}
```

#### 3. 登录 npm

```bash
npm login
```

输入用户名、密码和邮箱。

#### 4. 运行发布前检查

```bash
npm run check:publish
```

确保所有检查通过。

#### 5. 发布

```bash
# 方式 1: 使用 npm 脚本（推荐）
npm run publish:patch

# 方式 2: 手动发布
npm version patch
npm publish

# 如果使用作用域包名
npm publish --access public
```

### 后续版本发布

```bash
# 补丁版本（bug 修复）: 1.0.0 -> 1.0.1
npm run publish:patch

# 次要版本（新功能）: 1.0.0 -> 1.1.0
npm run publish:minor

# 主要版本（破坏性更改）: 1.0.0 -> 2.0.0
npm run publish:major
```

## 📝 发布检查清单

在发布前，确认以下事项：

- [ ] 所有测试通过 (`npm test`)
- [ ] 代码已构建 (`npm run build`)
- [ ] 更新了 CHANGELOG.md
- [ ] 更新了版本号
- [ ] 提交了所有更改
- [ ] 填写了正确的 author 信息
- [ ] 填写了正确的 repository 信息
- [ ] 已登录 npm (`npm whoami`)
- [ ] 包名可用或已确认使用作用域包名

## 🌐 发布后的访问方式

### 通过 npm 安装

```bash
npm install satellite-console
```

### 通过 unpkg.com CDN

```html
<!-- 最新版本 -->
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>

<!-- 指定版本 -->
<script src="https://unpkg.com/satellite-console@1.0.0/dist/launcher.min.js"></script>

<!-- 其他文件 -->
<script src="https://unpkg.com/satellite-console/dist/injection-script.min.js"></script>
<script src="https://unpkg.com/satellite-console/dist/satellite-app.min.js"></script>
```

### 通过 jsdelivr CDN

```html
<script src="https://cdn.jsdelivr.net/npm/satellite-console/dist/launcher.min.js"></script>
```

## 📊 发布后的监控

### npm 包页面

```
https://www.npmjs.com/package/satellite-console
```

### 下载统计

```
https://npm-stat.com/charts.html?package=satellite-console
```

### unpkg.com 浏览

```
https://unpkg.com/browse/satellite-console/
```

## 🔄 版本管理策略

### 语义化版本规范

- **主版本号（Major）**: 不兼容的 API 修改
  - 例如：删除或重命名公共 API
  - 更改默认行为

- **次版本号（Minor）**: 向下兼容的功能性新增
  - 例如：添加新功能
  - 添加新的可选参数

- **修订号（Patch）**: 向下兼容的问题修正
  - 例如：修复 bug
  - 性能优化
  - 文档更新

### 版本示例

```
1.0.0 -> 1.0.1  (修复 bug)
1.0.1 -> 1.1.0  (添加新功能)
1.1.0 -> 2.0.0  (破坏性更改)
```

## 🛠️ 常见问题

### Q1: 如何撤销发布？

```bash
# 撤销特定版本（72小时内）
npm unpublish satellite-console@1.0.0

# 撤销整个包（慎用！）
npm unpublish satellite-console --force
```

### Q2: 如何发布 beta 版本？

```bash
npm version prerelease --preid=beta
npm publish --tag beta

# 安装 beta 版本
npm install satellite-console@beta
```

### Q3: 如何更新已发布的包信息？

```bash
# 更新 README
npm publish

# 更新其他元数据
# 修改 package.json 后重新发布新版本
```

### Q4: unpkg.com 没有更新？

unpkg.com 有缓存，可能需要几分钟。可以使用：

```
https://unpkg.com/satellite-console@latest/dist/launcher.min.js
```

强制获取最新版本。

## 📚 相关资源

- [npm 官方文档](https://docs.npmjs.com/)
- [unpkg.com](https://unpkg.com/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [package.json 字段说明](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)

## 🎉 下一步

发布成功后：

1. ✅ 在 GitHub 上创建 Release
2. ✅ 更新项目文档
3. ✅ 在社交媒体分享
4. ✅ 收集用户反馈
5. ✅ 持续改进

---

**祝发布顺利！** 🚀

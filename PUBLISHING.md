# 📦 发布到 npm 指南

本文档说明如何将 Satellite Console 发布到 npm，使其可以通过 unpkg.com CDN 访问。

## 前置准备

### 1. 注册 npm 账号

如果还没有 npm 账号，请访问 [npmjs.com](https://www.npmjs.com/) 注册。

### 2. 登录 npm

在项目根目录运行：

```bash
npm login
```

输入你的 npm 用户名、密码和邮箱。

### 3. 验证登录状态

```bash
npm whoami
```

应该显示你的 npm 用户名。

## 发布前检查

### 1. 更新 package.json

确保以下字段已正确填写：

```json
{
  "name": "satellite-console",
  "version": "1.0.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/satellite-console.git"
  }
}
```

**重要提示：**
- `name`: 如果 `satellite-console` 已被占用，需要使用其他名称，如 `@yourusername/satellite-console`
- `version`: 遵循语义化版本规范（Semantic Versioning）
- `author`: 填写你的真实信息
- `repository`: 填写你的 GitHub 仓库地址

### 2. 检查包名是否可用

```bash
npm view satellite-console
```

如果显示 404，说明包名可用。如果已存在，需要更改包名。

### 3. 构建项目

```bash
npm run build
```

确保构建成功，生成 `dist/` 目录。

### 4. 测试打包内容

查看将要发布的文件：

```bash
npm pack --dry-run
```

这会显示将要包含在 npm 包中的所有文件。

## 发布步骤

### 1. 首次发布

```bash
npm publish
```

如果使用作用域包名（如 `@yourusername/satellite-console`），需要：

```bash
npm publish --access public
```

### 2. 发布新版本

每次发布新版本前，需要更新版本号：

```bash
# 补丁版本（bug 修复）：1.0.0 -> 1.0.1
npm version patch

# 次要版本（新功能）：1.0.0 -> 1.1.0
npm version minor

# 主要版本（破坏性更改）：1.0.0 -> 2.0.0
npm version major
```

然后发布：

```bash
npm publish
```

### 3. 推送到 Git

```bash
git push
git push --tags
```

## 使用发布的包

### 通过 npm 安装

```bash
npm install satellite-console
```

### 通过 unpkg.com CDN 使用

发布成功后，可以通过以下 URL 访问：

```html
<!-- Launcher -->
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>

<!-- Injection Script -->
<script src="https://unpkg.com/satellite-console/dist/injection-script.min.js"></script>

<!-- Satellite App -->
<script src="https://unpkg.com/satellite-console/dist/satellite-app.min.js"></script>
```

指定版本：

```html
<script src="https://unpkg.com/satellite-console@1.0.0/dist/launcher.min.js"></script>
```

### 在 Node.js 项目中使用

```javascript
// ES Module
import { openSatelliteConsole } from 'satellite-console';

// CommonJS
const { openSatelliteConsole } = require('satellite-console');
```

## 版本管理

### 语义化版本规范

- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

### 版本标签

```bash
# 发布 beta 版本
npm version prerelease --preid=beta
npm publish --tag beta

# 发布 alpha 版本
npm version prerelease --preid=alpha
npm publish --tag alpha

# 安装 beta 版本
npm install satellite-console@beta
```

## 撤销发布

**注意：** npm 只允许在发布后 72 小时内撤销。

```bash
# 撤销特定版本
npm unpublish satellite-console@1.0.0

# 撤销整个包（慎用！）
npm unpublish satellite-console --force
```

## 更新 README

发布后，更新 README.md 中的安装说明：

```markdown
## 安装

### 通过 npm

\`\`\`bash
npm install satellite-console
\`\`\`

### 通过 CDN

\`\`\`html
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>
\`\`\`
```

## 常见问题

### 1. 包名已被占用

使用作用域包名：

```json
{
  "name": "@yourusername/satellite-console"
}
```

### 2. 发布失败：需要 2FA

如果你的 npm 账号启用了双因素认证：

```bash
npm publish --otp=123456
```

其中 `123456` 是你的 2FA 验证码。

### 3. 文件太大

检查 `.npmignore` 文件，确保不包含不必要的文件。

### 4. 更新 unpkg.com 缓存

unpkg.com 有缓存，可能需要几分钟才能看到最新版本。可以使用：

```
https://unpkg.com/satellite-console@latest/dist/launcher.min.js
```

## 自动化发布

### 使用 GitHub Actions

创建 `.github/workflows/publish.yml`：

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

在 GitHub 仓库设置中添加 `NPM_TOKEN` secret。

## 检查清单

发布前确认：

- [ ] 更新了版本号
- [ ] 运行了所有测试
- [ ] 构建成功
- [ ] 更新了 CHANGELOG.md
- [ ] 更新了 README.md
- [ ] 提交了所有更改
- [ ] 创建了 Git 标签
- [ ] 填写了正确的 author 和 repository 信息

## 相关链接

- [npm 文档](https://docs.npmjs.com/)
- [unpkg.com](https://unpkg.com/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [npm 发布最佳实践](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

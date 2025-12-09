# 📖 分步发布指南

## 从零开始发布到 GitHub 和 npm

### 🎯 目标

1. ✅ 将代码提交到 GitHub
2. ✅ 发布到 npm
3. ✅ 通过 unpkg.com CDN 访问

---

## 方式一：使用自动化脚本（推荐）

### 运行脚本

```powershell
.\scripts\init-and-publish.ps1
```

脚本会自动完成以下步骤：
1. 初始化 Git 仓库
2. 创建 .gitignore
3. 更新 package.json
4. 提交代码
5. 推送到 GitHub
6. 检查 npm 登录
7. 检查包名
8. 运行测试和构建
9. 发布到 npm

---

## 方式二：手动操作（详细步骤）

### 第一步：初始化 Git 仓库

```powershell
# 初始化 Git
git init

# 创建 .gitignore（如果不存在）
# 内容见下方
```

**.gitignore 内容：**

```
# 依赖
node_modules/
package-lock.json

# 构建产物
dist/

# 测试
coverage/
playwright-report/
test-results/

# 环境变量
.env
.env.local

# 编辑器
.vscode/
.idea/
.DS_Store

# 日志
*.log
```

### 第二步：更新 package.json

编辑 `package.json`，更新以下字段：

```json
{
  "author": "你的名字 <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/你的用户名/satellite-console.git"
  },
  "bugs": {
    "url": "https://github.com/你的用户名/satellite-console/issues"
  },
  "homepage": "https://github.com/你的用户名/satellite-console#readme"
}
```

### 第三步：提交代码到本地仓库

```powershell
# 添加所有文件
git add .

# 创建初始提交
git commit -m "chore: initial commit - prepare for npm publishing"
```

### 第四步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写信息：
   - **Repository name**: `satellite-console`
   - **Description**: `浏览器端实时日志聚合工具`
   - **Public** (选择公开)
   - **不要勾选** "Initialize this repository with a README"
3. 点击 **Create repository**

### 第五步：推送代码到 GitHub

```powershell
# 添加远程仓库（替换 yourusername）
git remote add origin https://github.com/yourusername/satellite-console.git

# 重命名分支为 main
git branch -M main

# 推送代码
git push -u origin main
```

### 第六步：登录 npm

```powershell
# 检查是否已登录
npm whoami

# 如果未登录，执行登录
npm login
```

输入你的 npm 用户名、密码和邮箱。

### 第七步：检查包名是否可用

```powershell
npm view satellite-console
```

**如果显示 404**：包名可用，继续下一步

**如果包名已被占用**：需要更改包名

选项 A：使用作用域包名（推荐）

```json
{
  "name": "@yourusername/satellite-console"
}
```

选项 B：使用其他包名

```json
{
  "name": "my-satellite-console"
}
```

### 第八步：运行测试和构建

```powershell
# 运行测试
npm test

# 构建项目
npm run build
```

确保测试通过且构建成功。

### 第九步：发布到 npm

```powershell
# 如果是普通包名
npm publish

# 如果是作用域包名（@username/package）
npm publish --access public
```

### 第十步：验证发布

```powershell
# 查看包信息
npm view satellite-console

# 或者访问
# https://www.npmjs.com/package/satellite-console
```

---

## ✅ 发布成功！

### 使用方式

#### 通过 npm 安装

```bash
npm install satellite-console
```

#### 通过 CDN 引入

```html
<!-- unpkg.com -->
<script src="https://unpkg.com/satellite-console/dist/launcher.min.js"></script>

<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/satellite-console/dist/launcher.min.js"></script>
```

---

## 🔄 后续版本发布

### 修复 bug（补丁版本）

```powershell
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "fix: 修复某个问题"

# 3. 更新版本号并发布
npm version patch
npm publish

# 4. 推送到 GitHub
git push
git push --tags
```

### 添加新功能（次要版本）

```powershell
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "feat: 添加新功能"

# 3. 更新版本号并发布
npm version minor
npm publish

# 4. 推送到 GitHub
git push
git push --tags
```

### 破坏性更改（主要版本）

```powershell
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "feat!: 重大更新"

# 3. 更新版本号并发布
npm version major
npm publish

# 4. 推送到 GitHub
git push
git push --tags
```

---

## 📝 发布检查清单

在发布前确认：

- [ ] 代码已提交到 GitHub
- [ ] package.json 中的信息已更新
- [ ] 所有测试通过
- [ ] 项目构建成功
- [ ] 已登录 npm
- [ ] 包名可用或已使用作用域包名
- [ ] CHANGELOG.md 已更新
- [ ] README.md 已更新

---

## 🆘 常见问题

### Q1: Git 推送失败

**错误**: `fatal: unable to access 'https://github.com/...'`

**解决**:
1. 检查网络连接
2. 检查 GitHub 用户名和仓库名是否正确
3. 确认 GitHub 仓库已创建

### Q2: npm 发布失败 - 需要登录

**错误**: `npm ERR! need auth`

**解决**:
```powershell
npm login
```

### Q3: npm 发布失败 - 包名已存在

**错误**: `npm ERR! 403 Forbidden`

**解决**:
使用作用域包名：
```json
{
  "name": "@yourusername/satellite-console"
}
```

然后发布：
```powershell
npm publish --access public
```

### Q4: 如何撤销发布？

```powershell
# 撤销特定版本（72小时内）
npm unpublish satellite-console@1.0.0

# 撤销整个包（慎用！）
npm unpublish satellite-console --force
```

---

## 🎉 完成！

恭喜你成功发布了第一个 npm 包！

### 下一步

1. 在 GitHub 上创建 Release
2. 添加 README badges
3. 编写使用文档
4. 分享你的项目

---

## 📚 相关资源

- [npm 官方文档](https://docs.npmjs.com/)
- [GitHub 文档](https://docs.github.com/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [unpkg.com](https://unpkg.com/)

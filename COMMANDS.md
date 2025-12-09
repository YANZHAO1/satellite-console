# 🚀 快速命令参考

## Git 命令

### 初始化和提交

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建提交
git commit -m "chore: initial commit"

# 查看状态
git status

# 查看提交历史
git log --oneline
```

### 推送到 GitHub

```bash
# 添加远程仓库（首次）
git remote add origin https://github.com/yourusername/satellite-console.git

# 重命名分支为 main
git branch -M main

# 推送代码
git push -u origin main

# 后续推送
git push

# 推送标签
git push --tags
```

### 日常开发

```bash
# 拉取最新代码
git pull

# 创建新分支
git checkout -b feature/new-feature

# 切换分支
git checkout main

# 合并分支
git merge feature/new-feature

# 删除分支
git branch -d feature/new-feature
```

---

## npm 命令

### 账号管理

```bash
# 登录 npm
npm login

# 查看当前用户
npm whoami

# 登出
npm logout
```

### 包管理

```bash
# 安装依赖
npm install

# 安装开发依赖
npm install --save-dev package-name

# 更新依赖
npm update

# 查看过时的包
npm outdated
```

### 版本管理

```bash
# 查看当前版本
npm version

# 补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 次要版本 (1.0.0 -> 1.1.0)
npm version minor

# 主要版本 (1.0.0 -> 2.0.0)
npm version major

# 预发布版本
npm version prerelease --preid=beta
```

### 发布

```bash
# 发布包
npm publish

# 发布作用域包（公开）
npm publish --access public

# 发布 beta 版本
npm publish --tag beta

# 查看包信息
npm view satellite-console

# 撤销发布（72小时内）
npm unpublish satellite-console@1.0.0
```

---

## 项目命令

### 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建项目
npm run build

# 开发环境构建
npm run build:dev

# 清理构建产物
npm run clean
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# E2E 测试
npm run test:e2e

# E2E 测试（UI 模式）
npm run test:e2e:ui

# E2E 测试（显示浏览器）
npm run test:e2e:headed
```

### 发布

```bash
# 发布前检查
npm run check:publish

# 发布补丁版本
npm run publish:patch

# 发布次要版本
npm run publish:minor

# 发布主要版本
npm run publish:major
```

---

## 完整发布流程

### 首次发布

```bash
# 1. 初始化 Git
git init
git add .
git commit -m "chore: initial commit"

# 2. 推送到 GitHub
git remote add origin https://github.com/yourusername/satellite-console.git
git branch -M main
git push -u origin main

# 3. 登录 npm
npm login

# 4. 检查包名
npm view satellite-console

# 5. 运行测试
npm test

# 6. 构建项目
npm run build

# 7. 发布
npm publish
# 或者（如果是作用域包）
npm publish --access public
```

### 后续版本发布

```bash
# 1. 修改代码并提交
git add .
git commit -m "feat: add new feature"

# 2. 运行测试
npm test

# 3. 构建项目
npm run build

# 4. 更新版本并发布
npm version patch  # 或 minor / major
npm publish

# 5. 推送到 GitHub
git push
git push --tags
```

---

## 使用自动化脚本

### Windows (PowerShell)

```powershell
# 完整流程（初始化 + 发布）
.\scripts\init-and-publish.ps1

# 仅发布新版本
.\scripts\publish.ps1 patch
.\scripts\publish.ps1 minor
.\scripts\publish.ps1 major
```

### Linux/Mac (Bash)

```bash
# 完整流程（初始化 + 发布）
chmod +x scripts/init-and-publish.sh
./scripts/init-and-publish.sh

# 仅发布新版本
chmod +x scripts/publish.sh
./scripts/publish.sh patch
./scripts/publish.sh minor
./scripts/publish.sh major
```

---

## 常用组合命令

### 快速提交并推送

```bash
git add . && git commit -m "update" && git push
```

### 测试、构建、发布

```bash
npm test && npm run build && npm publish
```

### 更新版本并推送

```bash
npm version patch && git push && git push --tags
```

### 完整发布流程（一行命令）

```bash
npm test && npm run build && npm version patch && npm publish && git push && git push --tags
```

---

## 查看信息

### Git 信息

```bash
# 查看远程仓库
git remote -v

# 查看分支
git branch -a

# 查看标签
git tag

# 查看最近的提交
git log -5 --oneline
```

### npm 信息

```bash
# 查看包信息
npm view satellite-console

# 查看包的所有版本
npm view satellite-console versions

# 查看包的最新版本
npm view satellite-console version

# 查看本地包信息
npm ls
```

### 项目信息

```bash
# 查看 package.json 版本
node -p "require('./package.json').version"

# 查看 package.json 名称
node -p "require('./package.json').name"
```

---

## 故障排除

### 清理缓存

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 并重新安装
rm -rf node_modules
npm install
```

### 重置 Git

```bash
# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃更改）
git reset --hard HEAD~1

# 放弃所有本地更改
git reset --hard origin/main
```

### 修复发布问题

```bash
# 如果发布失败，检查登录状态
npm whoami

# 重新登录
npm logout
npm login

# 检查包名是否可用
npm view your-package-name
```

---

## 快捷别名（可选）

在 PowerShell 配置文件中添加：

```powershell
# 编辑配置文件
notepad $PROFILE

# 添加别名
function gp { git push }
function gc { git commit -m $args }
function ga { git add . }
function gs { git status }
function nb { npm run build }
function nt { npm test }
function np { npm publish }
```

---

## 📚 更多资源

- [Git 文档](https://git-scm.com/doc)
- [npm 文档](https://docs.npmjs.com/)
- [GitHub 文档](https://docs.github.com/)

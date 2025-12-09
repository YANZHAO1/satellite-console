# Satellite Console 发布脚本 (PowerShell)
# 使用方法: .\scripts\publish.ps1 [patch|minor|major]

param(
    [ValidateSet('patch', 'minor', 'major')]
    [string]$VersionType = 'patch'
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 开始发布流程..." -ForegroundColor Green

# 1. 检查是否有未提交的更改
$gitStatus = git status -s
if ($gitStatus) {
    Write-Host "错误: 有未提交的更改，请先提交或暂存" -ForegroundColor Red
    git status -s
    exit 1
}

# 2. 检查是否在主分支
$currentBranch = git branch --show-current
if ($currentBranch -ne "main" -and $currentBranch -ne "master") {
    Write-Host "警告: 当前不在主分支 (当前: $currentBranch)" -ForegroundColor Yellow
    $continue = Read-Host "是否继续? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# 3. 拉取最新代码
Write-Host "📥 拉取最新代码..." -ForegroundColor Green
git pull origin $currentBranch

# 4. 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Green
npm ci

# 5. 运行测试
Write-Host "🧪 运行测试..." -ForegroundColor Green
npm test

# 6. 构建项目
Write-Host "🔨 构建项目..." -ForegroundColor Green
npm run build

# 7. 检查构建产物
if (-not (Test-Path "dist/launcher.min.js")) {
    Write-Host "错误: 构建失败，找不到 dist/launcher.min.js" -ForegroundColor Red
    exit 1
}

# 8. 更新版本号
Write-Host "📝 更新版本号 ($VersionType)..." -ForegroundColor Green
npm version $VersionType -m "chore: release v%s"

# 获取新版本号
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$newVersion = $packageJson.version
Write-Host "✨ 新版本: v$newVersion" -ForegroundColor Green

# 9. 推送到 Git
Write-Host "📤 推送到 Git..." -ForegroundColor Green
git push origin $currentBranch
git push origin --tags

# 10. 发布到 npm
Write-Host "📦 发布到 npm..." -ForegroundColor Green
npm publish

# 11. 完成
Write-Host "✅ 发布成功！" -ForegroundColor Green
Write-Host "📦 包名: satellite-console@$newVersion" -ForegroundColor Green
Write-Host "🌐 CDN: https://unpkg.com/satellite-console@$newVersion/dist/launcher.min.js" -ForegroundColor Green
Write-Host "📚 npm: https://www.npmjs.com/package/satellite-console" -ForegroundColor Green

# 12. 创建 GitHub Release（可选）
$createRelease = Read-Host "是否创建 GitHub Release? (y/N)"
if ($createRelease -eq "y" -or $createRelease -eq "Y") {
    Write-Host "🎉 请手动在 GitHub 上创建 Release" -ForegroundColor Green
    Write-Host "   标签: v$newVersion" -ForegroundColor Green
    Write-Host "   标题: Release v$newVersion" -ForegroundColor Green
    Write-Host "   内容: 参考 CHANGELOG.md" -ForegroundColor Green
}

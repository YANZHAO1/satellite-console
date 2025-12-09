#!/bin/bash

# Satellite Console 发布脚本
# 使用方法: ./scripts/publish.sh [patch|minor|major]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}错误: 版本类型必须是 patch, minor 或 major${NC}"
  exit 1
fi

echo -e "${GREEN}🚀 开始发布流程...${NC}"

# 1. 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}错误: 有未提交的更改，请先提交或暂存${NC}"
  git status -s
  exit 1
fi

# 2. 检查是否在主分支
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo -e "${YELLOW}警告: 当前不在主分支 (当前: $CURRENT_BRANCH)${NC}"
  read -p "是否继续? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 3. 拉取最新代码
echo -e "${GREEN}📥 拉取最新代码...${NC}"
git pull origin $CURRENT_BRANCH

# 4. 安装依赖
echo -e "${GREEN}📦 安装依赖...${NC}"
npm ci

# 5. 运行测试
echo -e "${GREEN}🧪 运行测试...${NC}"
npm test

# 6. 构建项目
echo -e "${GREEN}🔨 构建项目...${NC}"
npm run build

# 7. 检查构建产物
if [[ ! -f "dist/launcher.min.js" ]]; then
  echo -e "${RED}错误: 构建失败，找不到 dist/launcher.min.js${NC}"
  exit 1
fi

# 8. 更新版本号
echo -e "${GREEN}📝 更新版本号 ($VERSION_TYPE)...${NC}"
npm version $VERSION_TYPE -m "chore: release v%s"

# 获取新版本号
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✨ 新版本: v$NEW_VERSION${NC}"

# 9. 推送到 Git
echo -e "${GREEN}📤 推送到 Git...${NC}"
git push origin $CURRENT_BRANCH
git push origin --tags

# 10. 发布到 npm
echo -e "${GREEN}📦 发布到 npm...${NC}"
npm publish

# 11. 完成
echo -e "${GREEN}✅ 发布成功！${NC}"
echo -e "${GREEN}📦 包名: satellite-console@$NEW_VERSION${NC}"
echo -e "${GREEN}🌐 CDN: https://unpkg.com/satellite-console@$NEW_VERSION/dist/launcher.min.js${NC}"
echo -e "${GREEN}📚 npm: https://www.npmjs.com/package/satellite-console${NC}"

# 12. 创建 GitHub Release（可选）
read -p "是否创建 GitHub Release? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${GREEN}🎉 请手动在 GitHub 上创建 Release${NC}"
  echo -e "${GREEN}   标签: v$NEW_VERSION${NC}"
  echo -e "${GREEN}   标题: Release v$NEW_VERSION${NC}"
  echo -e "${GREEN}   内容: 参考 CHANGELOG.md${NC}"
fi

#!/usr/bin/env node

/**
 * 发布前检查脚本
 * 确保所有必要的文件和配置都正确
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let hasErrors = false;
let hasWarnings = false;

function error(message) {
  console.error(`${RED}❌ ${message}${RESET}`);
  hasErrors = true;
}

function warning(message) {
  console.warn(`${YELLOW}⚠️  ${message}${RESET}`);
  hasWarnings = true;
}

function success(message) {
  console.log(`${GREEN}✅ ${message}${RESET}`);
}

function checkFileExists(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  if (!exists) {
    if (required) {
      error(`缺少必需文件: ${filePath}`);
    } else {
      warning(`建议添加文件: ${filePath}`);
    }
  } else {
    success(`文件存在: ${filePath}`);
  }
  return exists;
}

function checkPackageJson() {
  console.log('\n📦 检查 package.json...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!checkFileExists(packagePath)) {
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // 检查必需字段
  const requiredFields = ['name', 'version', 'description', 'main', 'license'];
  requiredFields.forEach(field => {
    if (!pkg[field]) {
      error(`package.json 缺少字段: ${field}`);
    } else {
      success(`package.json 包含字段: ${field}`);
    }
  });
  
  // 检查推荐字段
  const recommendedFields = ['author', 'repository', 'keywords', 'homepage'];
  recommendedFields.forEach(field => {
    if (!pkg[field]) {
      warning(`package.json 建议添加字段: ${field}`);
    } else {
      success(`package.json 包含字段: ${field}`);
    }
  });
  
  // 检查 files 字段
  if (!pkg.files || pkg.files.length === 0) {
    warning('package.json 建议添加 files 字段以控制发布内容');
  } else {
    success(`package.json 包含 files 字段 (${pkg.files.length} 项)`);
  }
  
  // 检查 scripts
  if (!pkg.scripts || !pkg.scripts.prepublishOnly) {
    warning('建议添加 prepublishOnly 脚本以在发布前自动构建');
  }
}

function checkDistFiles() {
  console.log('\n🔨 检查构建产物...');
  
  const distFiles = [
    'dist/launcher.min.js',
    'dist/injection-script.min.js',
    'dist/satellite-app.min.js'
  ];
  
  distFiles.forEach(file => {
    checkFileExists(file);
  });
}

function checkDocumentation() {
  console.log('\n📚 检查文档...');
  
  checkFileExists('README.md');
  checkFileExists('LICENSE');
  checkFileExists('CHANGELOG.md', false);
}

function checkGitStatus() {
  console.log('\n🔍 检查 Git 状态...');
  
  const { execSync } = require('child_process');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      warning('有未提交的更改');
      console.log(status);
    } else {
      success('没有未提交的更改');
    }
  } catch (err) {
    warning('无法检查 Git 状态');
  }
}

function checkNpmLogin() {
  console.log('\n👤 检查 npm 登录状态...');
  
  const { execSync } = require('child_process');
  
  try {
    const username = execSync('npm whoami', { encoding: 'utf8' }).trim();
    success(`已登录 npm，用户名: ${username}`);
  } catch (err) {
    error('未登录 npm，请运行: npm login');
  }
}

function main() {
  console.log('🚀 开始发布前检查...\n');
  
  checkPackageJson();
  checkDistFiles();
  checkDocumentation();
  checkGitStatus();
  checkNpmLogin();
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log(`\n${RED}❌ 检查失败，请修复错误后再发布${RESET}`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`\n${YELLOW}⚠️  检查通过，但有警告${RESET}`);
    console.log(`${YELLOW}建议修复警告后再发布${RESET}`);
  } else {
    console.log(`\n${GREEN}✅ 所有检查通过，可以发布！${RESET}`);
  }
}

main();

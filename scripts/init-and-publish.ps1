# Satellite Console - Initialize Git and Publish to npm
# Usage: .\scripts\init-and-publish.ps1

param(
    [string]$GitHubUsername = "",
    [string]$RepoName = "satellite-console"
)

$ErrorActionPreference = "Stop"

Write-Host "Satellite Console - Git Init and npm Publish" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Check parameters
if ([string]::IsNullOrEmpty($GitHubUsername)) {
    $GitHubUsername = Read-Host "Enter your GitHub username"
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  GitHub Username: $GitHubUsername" -ForegroundColor White
Write-Host "  Repository Name: $RepoName" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Confirm? (y/N)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Cancelled" -ForegroundColor Red
    exit 0
}

# Step 1: Initialize Git
Write-Host ""
Write-Host "Step 1: Initialize Git Repository" -ForegroundColor Green
Write-Host ("-" * 60)

if (Test-Path ".git") {
    Write-Host "Git repository already exists" -ForegroundColor Yellow
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor White
    git init
    Write-Host "Git repository initialized" -ForegroundColor Green
}

# Step 2: Add all files
Write-Host ""
Write-Host "Step 2: Add files to Git" -ForegroundColor Green
Write-Host ("-" * 60)

Write-Host "Adding all files..." -ForegroundColor White
git add .

Write-Host "Creating initial commit..." -ForegroundColor White
git commit -m "chore: initial commit - prepare for npm publishing"

Write-Host "Code committed to local repository" -ForegroundColor Green

# Step 3: Update package.json
Write-Host ""
Write-Host "Step 3: Update package.json" -ForegroundColor Green
Write-Host ("-" * 60)

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.repository.url = "https://github.com/$GitHubUsername/$RepoName.git"
$packageJson.bugs.url = "https://github.com/$GitHubUsername/$RepoName/issues"
$packageJson.homepage = "https://github.com/$GitHubUsername/$RepoName#readme"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8

Write-Host "package.json updated" -ForegroundColor Green
Write-Host "  Repository: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor White

# Step 4: Create GitHub repository
Write-Host ""
Write-Host "Step 4: Create GitHub Repository" -ForegroundColor Green
Write-Host ("-" * 60)

Write-Host "Please follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Visit: https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: $RepoName" -ForegroundColor White
Write-Host "3. Description: Browser-side real-time log aggregation tool" -ForegroundColor White
Write-Host "4. Select Public" -ForegroundColor White
Write-Host "5. Do NOT check Initialize this repository with a README" -ForegroundColor White
Write-Host "6. Click Create repository" -ForegroundColor White
Write-Host ""

$created = Read-Host "GitHub repository created? (y/N)"
if ($created -ne "y" -and $created -ne "Y") {
    Write-Host "Please create GitHub repository first" -ForegroundColor Red
    exit 1
}

# Step 5: Push to GitHub
Write-Host ""
Write-Host "Step 5: Push to GitHub" -ForegroundColor Green
Write-Host ("-" * 60)

Write-Host "Setting remote repository..." -ForegroundColor White
git remote add origin "https://github.com/$GitHubUsername/$RepoName.git"

Write-Host "Renaming branch to main..." -ForegroundColor White
git branch -M main

Write-Host "Pushing code..." -ForegroundColor White
git push -u origin main

Write-Host "Code pushed to GitHub" -ForegroundColor Green

# Step 6: Check npm login
Write-Host ""
Write-Host "Step 6: Check npm Login" -ForegroundColor Green
Write-Host ("-" * 60)

try {
    $npmUser = npm whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Logged in to npm as: $npmUser" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "Not logged in to npm" -ForegroundColor Yellow
    Write-Host "Please login to npm..." -ForegroundColor White
    npm login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm login failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "npm login successful" -ForegroundColor Green
}

# Step 7: Check package name
Write-Host ""
Write-Host "Step 7: Check Package Name" -ForegroundColor Green
Write-Host ("-" * 60)

$packageName = $packageJson.name
Write-Host "Checking package name: $packageName" -ForegroundColor White

$checkResult = npm view $packageName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Package name $packageName is already taken" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Suggested scoped package name: @$GitHubUsername/$RepoName" -ForegroundColor White
    
    $useScoped = Read-Host "Use scoped package name? (y/N)"
    if ($useScoped -eq "y" -or $useScoped -eq "Y") {
        $packageJson.name = "@$GitHubUsername/$RepoName"
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8
        
        Write-Host "Updated package name to: @$GitHubUsername/$RepoName" -ForegroundColor Green
        
        git add package.json
        git commit -m "chore: update package name to scoped"
        git push
    } else {
        Write-Host "Please manually update the name field in package.json" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Package name is available" -ForegroundColor Green
}

# Step 8: Run tests and build
Write-Host ""
Write-Host "Step 8: Run Tests and Build" -ForegroundColor Green
Write-Host ("-" * 60)

Write-Host "Running tests..." -ForegroundColor White
npm test

if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed" -ForegroundColor Red
    exit 1
}
Write-Host "Tests passed" -ForegroundColor Green

Write-Host "Building project..." -ForegroundColor White
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Build successful" -ForegroundColor Green

# Step 9: Publish to npm
Write-Host ""
Write-Host "Step 9: Publish to npm" -ForegroundColor Green
Write-Host ("-" * 60)

Write-Host "Ready to publish..." -ForegroundColor White
Write-Host ""
Write-Host "Package name: $($packageJson.name)" -ForegroundColor White
Write-Host "Version: $($packageJson.version)" -ForegroundColor White
Write-Host ""

$publish = Read-Host "Confirm publish? (y/N)"
if ($publish -ne "y" -and $publish -ne "Y") {
    Write-Host "Publish cancelled" -ForegroundColor Yellow
    exit 0
}

if ($packageJson.name -like "@*") {
    Write-Host "Publishing scoped package (public access)..." -ForegroundColor White
    npm publish --access public
} else {
    Write-Host "Publishing package..." -ForegroundColor White
    npm publish
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Publish failed" -ForegroundColor Red
    exit 1
}

# Success!
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "Publish Successful!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

$finalPackageName = $packageJson.name
$finalVersion = $packageJson.version

Write-Host "Package Info:" -ForegroundColor Yellow
Write-Host "  Name: $finalPackageName" -ForegroundColor White
Write-Host "  Version: $finalVersion" -ForegroundColor White
Write-Host ""

Write-Host "Links:" -ForegroundColor Yellow
Write-Host "  GitHub: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor White
Write-Host "  npm: https://www.npmjs.com/package/$finalPackageName" -ForegroundColor White
Write-Host "  unpkg: https://unpkg.com/$finalPackageName@$finalVersion/dist/launcher.min.js" -ForegroundColor White
Write-Host ""

Write-Host "Install:" -ForegroundColor Yellow
Write-Host "  npm install $finalPackageName" -ForegroundColor White
Write-Host ""

Write-Host "CDN:" -ForegroundColor Yellow
Write-Host "  <script src=`"https://unpkg.com/$finalPackageName/dist/launcher.min.js`"></script>" -ForegroundColor White
Write-Host ""

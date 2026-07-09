$ErrorActionPreference = "Stop"

Write-Host "=== Winner Backend o'rnatish ===" -ForegroundColor Cyan
Set-Location $PSScriptRoot

# OneDrive node_modules muammosini oldini olish
if ($PSScriptRoot -match "OneDrive") {
    Write-Host "DIQQAT: Loyiha OneDrive ichida. node_modules bilan muammo bo'lishi mumkin." -ForegroundColor Yellow
    Write-Host "Tavsiya: loyihani C:\projects\winner-site ga ko'chiring." -ForegroundColor Yellow
}

# Eski node_modules ni tozalash
if (Test-Path "node_modules") {
    Write-Host "Eski node_modules o'chirilmoqda..." -ForegroundColor Yellow
    cmd /c "rmdir /s /q node_modules" 2>$null
    Start-Sleep -Seconds 2
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

Write-Host "Paketlar yuklanmoqda (5-10 daqiqa kuting)..." -ForegroundColor Green
npm install --no-audit --no-fund --loglevel=verbose

if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install xato! Quyidagilarni tekshiring:" -ForegroundColor Red
    Write-Host "  1. Internet ulanishi"
    Write-Host "  2. VPN o'chirib qayta urinib ko'ring"
    Write-Host "  3. Loyihani OneDrive dan tashqariga ko'chiring"
    exit 1
}

Write-Host "Build qilinmoqda..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build xato!" -ForegroundColor Red
    exit 1
}

Write-Host "=== Tayyor! Ishga tushirish: npm run start:dev ===" -ForegroundColor Green

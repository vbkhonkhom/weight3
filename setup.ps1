# WTH Fitness App Setup Script (PowerShell)
# สคริปต์สำหรับติดตั้งและเซ็ตอัพแอปบน Windows

Write-Host "🏃‍♀️ WTH Fitness App - Setup Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# ตรวจสอบ Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js ไม่ได้ติดตั้ง กรุณาติดตั้งก่อน" -ForegroundColor Red
    Write-Host "💡 ดาวน์โหลดได้ที่: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# ตรวจสอบ npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm ไม่ได้ติดตั้ง" -ForegroundColor Red
    exit 1
}

# ติดตั้ง dependencies
Write-Host ""
Write-Host "📦 กำลังติดตั้ง dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ติดตั้ง dependencies สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "❌ ติดตั้ง dependencies ไม่สำเร็จ" -ForegroundColor Red
    exit 1
}

# สร้างไฟล์ .env.local หากยังไม่มี
if (-not (Test-Path ".env.local")) {
    Write-Host ""
    Write-Host "📝 สร้างไฟล์ .env.local..." -ForegroundColor Yellow
    
    $envContent = @"
# WTH Fitness App Environment Variables
# Google Apps Script Configuration
NEXT_PUBLIC_GAS_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
NEXT_PUBLIC_GAS_API_KEY=your-api-key-here
NEXT_PUBLIC_USE_MOCKS=true

# สำหรับ development ให้เปลี่ยนเป็น false เมื่อพร้อมใช้งาน Apps Script จริง
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ สร้างไฟล์ .env.local แล้ว" -ForegroundColor Green
    Write-Host "⚠️  กรุณาแก้ไข URL และ API Key ในไฟล์ .env.local" -ForegroundColor Yellow
} else {
    Write-Host "✅ ไฟล์ .env.local มีอยู่แล้ว" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 การติดตั้งเสร็จสิ้น!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 ขั้นตอนต่อไป:" -ForegroundColor Cyan
Write-Host "1. แก้ไขไฟล์ .env.local ให้มี Apps Script URL และ API Key ที่ถูกต้อง"
Write-Host "2. รัน 'npm run dev' เพื่อเริ่มเซิร์ฟเวอร์ development"
Write-Host "3. เปิดเบราว์เซอร์ไปที่ http://localhost:3000"
Write-Host ""
Write-Host "📚 อ่านคู่มือเพิ่มเติมได้ที่: docs/user-guide.md" -ForegroundColor Blue
Write-Host "🔗 Google Sheets ตัวอย่าง: https://docs.google.com/spreadsheets/d/1AZ3_0g6bGya0sa2Ij1zKJZXNl3uS5P1etYL3csKt-HY/edit" -ForegroundColor Blue
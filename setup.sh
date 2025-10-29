#!/bin/bash

# WTH Fitness App Setup Script
# สคริปต์สำหรับติดตั้งและเซ็ตอัพแอป

echo "🏃‍♀️ WTH Fitness App - Setup Script"
echo "=================================="

# ตรวจสอบ Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ไม่ได้ติดตั้ง กรุณาติดตั้งก่อน"
    echo "💡 ดาวน์โหลดได้ที่: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# ตรวจสอบ npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm ไม่ได้ติดตั้ง"
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# ติดตั้ง dependencies
echo ""
echo "📦 กำลังติดตั้ง dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ ติดตั้ง dependencies สำเร็จ"
else
    echo "❌ ติดตั้ง dependencies ไม่สำเร็จ"
    exit 1
fi

# สร้างไฟล์ .env.local หากยังไม่มี
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 สร้างไฟล์ .env.local..."
    cat > .env.local << EOL
# WTH Fitness App Environment Variables
# Google Apps Script Configuration
NEXT_PUBLIC_GAS_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
NEXT_PUBLIC_GAS_API_KEY=your-api-key-here
NEXT_PUBLIC_USE_MOCKS=true

# สำหรับ development ให้เปลี่ยนเป็น false เมื่อพร้อมใช้งาน Apps Script จริง
EOL
    echo "✅ สร้างไฟล์ .env.local แล้ว"
    echo "⚠️  กรุณาแก้ไข URL และ API Key ในไฟล์ .env.local"
else
    echo "✅ ไฟล์ .env.local มีอยู่แล้ว"
fi

echo ""
echo "🎉 การติดตั้งเสร็จสิ้น!"
echo ""
echo "📋 ขั้นตอนต่อไป:"
echo "1. แก้ไขไฟล์ .env.local ให้มี Apps Script URL และ API Key ที่ถูกต้อง"
echo "2. รัน 'npm run dev' เพื่อเริ่มเซิร์ฟเวอร์ development"
echo "3. เปิดเบราว์เซอร์ไปที่ http://localhost:3000"
echo ""
echo "📚 อ่านคู่มือเพิ่มเติมได้ที่: docs/user-guide.md"
echo "🔗 Google Sheets ตัวอย่าง: https://docs.google.com/spreadsheets/d/1AZ3_0g6bGya0sa2Ij1zKJZXNl3uS5P1etYL3csKt-HY/edit"
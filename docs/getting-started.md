# 🚀 เริ่มต้นใช้งาน WTH Fitness App

## 📋 สารบัญ

- [ข้อกำหนดเบื้องต้น](#ข้อกำหนดเบื้องต้น)
- [ขั้นตอนที่ 1: เตรียม Google Sheets](#ขั้นตอนที่-1-เตรียม-google-sheets)
- [ขั้นตอนที่ 2: Deploy Apps Script](#ขั้นตอนที่-2-deploy-apps-script)
- [ขั้นตอนที่ 3: ติดตั้งและรัน Frontend](#ขั้นตอนที่-3-ติดตั้งและรัน-frontend)
- [ขั้นตอนที่ 4: สร้างบัญชี Admin](#ขั้นตอนที่-4-สร้างบัญชี-admin)
- [ทดสอบระบบ](#ทดสอบระบบ)

---

## ข้อกำหนดเบื้องต้น

### สิ่งที่ต้องมี:
- ✅ บัญชี Google (Gmail)
- ✅ Node.js 18+ ([ดาวน์โหลด](https://nodejs.org/))
- ✅ Git ([ดาวน์โหลด](https://git-scm.com/))
- ✅ Text Editor (แนะนำ [VS Code](https://code.visualstudio.com/))

### ตรวจสอบการติดตั้ง:
```bash
node --version  # ต้องได้ v18 ขึ้นไป
npm --version   # ต้องได้ v9 ขึ้นไป
git --version   # ตรวจสอบว่าติดตั้งแล้ว
```

---

## ขั้นตอนที่ 1: เตรียม Google Sheets

### 1.1 สร้าง Google Sheets ใหม่
1. ไปที่ [Google Sheets](https://sheets.google.com/)
2. คลิก **"+ Blank"** สร้างไฟล์ใหม่
3. ตั้งชื่อ: **"WTH Fitness Database"**

### 1.2 สร้าง Sheets ทั้งหมด
คลิกที่ **+** ด้านล่างซ้ายเพื่อเพิ่ม sheet ตามนี้:
- `Users`
- `Classes`
- `TestResults`
- `Standards`
- `BodyMeasurements`
- `SportTypes` (ใหม่)
- `FitnessCriteria` (ใหม่)

### 1.3 คัดลอก Sheet ID
ดู URL ของ Google Sheets:
```
https://docs.google.com/spreadsheets/d/1a2B3c4D5e6F7g8H9i0J/edit
                                        ^^^^^^^^^^^^^^^^^^^^
                                        นี่คือ SHEET_ID
```
**บันทึก Sheet ID นี้ไว้** จะใช้ในขั้นตอนถัดไป

---

## ขั้นตอนที่ 2: Deploy Apps Script

### 2.1 เปิด Apps Script Editor
1. ใน Google Sheets ของคุณ คลิก **Extensions → Apps Script**
2. จะเปิดหน้า editor ใหม่

### 2.2 วาง Code
1. ลบโค้ดเดิมทั้งหมดออก
2. เปิดไฟล์ `apps-script/main.gs` จากโปรเจกต์นี้
3. คัดลอกโค้ดทั้งหมดไปวางใน Apps Script Editor

### 2.3 ตั้งค่า Script Properties
1. คลิก **⚙️ Project Settings** (ด้านซ้าย)
2. เลื่อนลงมาที่ **Script Properties**
3. คลิก **Add script property**
4. เพิ่ม:
   - **Property**: `SHEET_ID`
   - **Value**: ใส่ Sheet ID ที่คัดลอกไว้

### 2.4 รันฟังก์ชัน Setup
1. กลับไปที่ Editor
2. เลือกฟังก์ชัน `setupApplication` จากด dropdown ด้านบน
3. คลิก **Run** (▶️)
4. อนุญาตให้เข้าถึงข้อมูล (ครั้งแรกจะขออนุญาต)
5. รอจนเห็น "Execution completed"

### 2.5 Deploy เป็น Web App
1. คลิก **Deploy → New deployment**
2. คลิก **⚙️ Select type → Web app**
3. ตั้งค่า:
   - **Description**: WTH Fitness API
   - **Execute as**: Me (อีเมลของคุณ)
   - **Who has access**: Anyone
4. คลิก **Deploy**
5. **คัดลอก Web app URL** (ตัวอย่าง: `https://script.google.com/macros/s/ABC.../exec`)

### 2.6 สร้าง API Key
1. คลิก **⚙️ Project Settings**
2. ที่ **Script Properties** เพิ่ม:
   - **Property**: `API_KEY`
   - **Value**: สุ่มคีย์ยาวๆ เช่น `wth_fitness_2024_secure_key_xyz`

---

## ขั้นตอนที่ 3: ติดตั้งและรัน Frontend

### 3.1 Clone โปรเจกต์
```bash
git clone https://github.com/Hakuma17/WTHFitnessApp.git
cd WTHFitnessApp
```

### 3.2 ติดตั้ง Dependencies
```bash
npm install
```

### 3.3 ตั้งค่า Environment Variables
1. สร้างไฟล์ `.env.local` ในโฟลเดอร์หลัก:
```bash
# Windows
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

2. แก้ไขไฟล์ `.env.local`:
```env
# Google Apps Script
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
NEXT_PUBLIC_GAS_API_KEY=wth_fitness_2024_secure_key_xyz

# Mock Mode (ใช้สำหรับทดสอบ)
NEXT_PUBLIC_USE_MOCKS=false

# Session (สุ่มคีย์ยาวๆ)
SESSION_SECRET=your-super-secret-key-change-this-in-production
```

**แทนที่:**
- `YOUR_DEPLOYMENT_ID` ด้วย ID จาก Web app URL
- `wth_fitness_2024_secure_key_xyz` ด้วย API Key ที่สร้างไว้
- `your-super-secret-key...` ด้วยคีย์ที่สุ่มเอง

### 3.4 รัน Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่: **http://localhost:3000**

---

## ขั้นตอนที่ 4: สร้างบัญชี Admin

### ทางเลือก 1: ใช้บัญชีที่สร้างไว้แล้ว
Apps Script สร้างบัญชี admin ไว้ให้แล้ว:
- **Email**: `admin@wth.ac.th`
- **Password**: `WTH456`

### ทางเลือก 2: สร้างบัญชีใหม่
1. ไปที่หน้า Register
2. กรอกข้อมูล:
   - ชื่อ-นามสกุล
   - อีเมล
   - เพศ
   - วันเกิด
   - เลือกบทบาท: **Instructor**
3. คลิก Register
4. ตรวจสอบใน Google Sheets → Users sheet

---

## ทดสอบระบบ

### ✅ Checklist การทดสอบ:

#### Backend (Apps Script)
- [ ] เปิด Google Sheets เห็น headers ทุก sheet
- [ ] มี Users sheet มีข้อมูล admin
- [ ] Web App URL เปิดได้ (ไม่ error)

#### Frontend
- [ ] หน้า Login แสดงขึ้นมา
- [ ] Login ด้วย admin สำเร็จ
- [ ] เห็นหน้า Dashboard
- [ ] สลับ Dark/Light Mode ได้
- [ ] เปิดเมนู "จัดการชั้นเรียน" ได้

### ทดสอบสร้างข้อมูล:
1. **สร้างชั้นเรียน**:
   - ไปที่ "จัดการชั้นเรียน"
   - คลิก "เพิ่มชั้นเรียน"
   - ตั้งชื่อ: "PE-101"

2. **เพิ่มนักเรียน**:
   - คลิกที่ชั้นเรียนที่สร้าง
   - คลิก "นำเข้านักเรียน"
   - ใส่อีเมลทดสอบ

3. **บันทึกผลทดสอบ**:
   - Login ด้วยบัญชีนักเรียน
   - ไปที่ "บันทึกผลทดสอบ"
   - เลือก BMI และใส่ข้อมูล

---

## 🎉 เสร็จสิ้น!

ระบบพร้อมใช้งานแล้ว! ขั้นตอนถัดไป:

- 📖 อ่าน [คู่มืออาจารย์](instructor-guide.md) เพื่อเรียนรู้การจัดการชั้นเรียน
- 📖 อ่าน [คู่มือนักเรียน](student-guide.md) เพื่อสอนนักเรียนใช้งาน
- 🚀 ดู [การ Deploy Production](deployment.md) เพื่อเปิดให้ใช้งานจริง

---

## ❓ แก้ปัญหาเบื้องต้น

### ปัญหา: Login ไม่ได้
- ตรวจสอบว่า `NEXT_PUBLIC_USE_MOCKS=false`
- ตรวจสอบ Apps Script Web App URL ถูกต้อง
- ลอง Login ด้วย Mock Mode (`NEXT_PUBLIC_USE_MOCKS=true`)

### ปัญหา: "Unauthorized" Error
- ตรวจสอบ API Key ใน `.env.local` และ Script Properties ตรงกัน
- Redeploy Apps Script อีกครั้ง

### ปัญหา: ข้อมูลไม่บันทึก
- เปิด Google Sheets ดูว่ามี sheet ครบทุกตัว
- เช็ค Apps Script Logs: View → Execution Log
- ดู Browser Console (F12) มี error อะไร

---

**มีคำถามเพิ่มเติม?** ดู [FAQ](faq.md) หรือสร้าง Issue ใน GitHub

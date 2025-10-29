# การตั้งค่า Admin เริ่มต้น

## ขั้นตอนการตั้งค่า Google Apps Script

### 1. Copy ไฟล์ main.gs ไปยัง Apps Script Editor
- เปิด [Google Apps Script](https://script.google.com)
- สร้าง New Project
- Copy เนื้อหาจากไฟล์ `apps-script/main.gs` ไปใส่

### 2. สร้าง Google Spreadsheet
- สร้าง Google Spreadsheet ใหม่
- Copy Spreadsheet ID จาก URL
- ใส่ ID ใน CONFIG.SHEET_ID ใน main.gs

### 3. ตั้งค่า Script Properties (ไม่บังคับ)
- ไปที่ Project Settings > Script Properties
- เพิ่ม properties ต่อไปนี้:
  - `API_KEY`: กำหนดรหัส API (ถ้าต้องการ)
  - `PASSWORD_PEPPER`: สตริงสำหรับเข้ารหัสรหัสผ่าน

### 4. รัน Initial Setup
```javascript
// ใน Apps Script Editor ให้รันคำสั่งเหล่านี้ตามลำดับ:

// 1. ตั้งค่าหัวตารางและสร้าง Admin
setupApplication();
```

### 5. Deploy Web App
- ไปที่ Deploy > New Deployment
- Type: Web app
- Execute as: Me
- Who has access: Anyone
- Copy Web App URL ไปใส่ใน `.env.local`

## ข้อมูล Admin เริ่มต้น

- **ชื่อผู้ใช้**: Admin123
- **อีเมล**: admin@wth.ac.th
- **รหัสผ่าน**: WTH456
- **บทบาท**: ครูผู้สอน (instructor)

## คุณสมบัติระบบ

### สำหรับนักเรียน
- ✅ ต้องยืนยัน OTP ผ่านอีเมลก่อนสมัครสมาชิก
- ✅ ต้องกรอกรหัสชั้นเรียนเพื่อเข้าร่วม
- ✅ สามารถบันทึกผลการทดสอบทางกายภาพ

### สำหรับครูผู้สอน
- ✅ สามารถสร้างชั้นเรียนและได้รับลิงก์เชิญ
- ✅ สามารถดูรายชื่อนักเรียนและผลการทดสอบ
- ✅ ไม่ต้องยืนยัน OTP (สำหรับ admin)

### ระบบ OTP
- ✅ ส่ง OTP 6 หลักผ่านอีเมล
- ✅ OTP หมดอายุใน 10 นาที  
- ✅ ต้องยืนยันก่อนสมัครสมาชิก (สำหรับนักเรียน)

## การแก้ไขปัญหา

### หากมี Error "Failed to fetch"
1. ตรวจสอบ URL ใน `.env.local` ว่าถูกต้อง
2. ตรวจสอบ Web App deployment settings
3. ตรวจสอบ API_KEY ในกรณีที่ตั้งค่าไว้

### หากไม่สามารถส่งอีเมล OTP
1. ตรวจสอบ Gmail API permissions
2. รัน Apps Script ด้วย account ที่มีสิทธิ์ส่งอีเมล
3. ตรวจสอบอีเมลผู้รับว่าถูกต้อง

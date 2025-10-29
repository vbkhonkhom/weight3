# การตั้งค่า Google Apps Script

## ขั้นตอนการติดตั้ง

### 1. สร้าง Google Sheets
1. ไปที่ [Google Sheets](https://sheets.google.com)
2. สร้างสเปรดชีทใหม่ชื่อ "WTH Fitness Database"
3. สร้างแผ่นงาน 4 แผ่น:
   - **Users** - ข้อมูลผู้ใช้
   - **Classes** - ข้อมูลชั้นเรียน
   - **TestResults** - ผลการทดสอบ
   - **Standards** - เกณฑ์มาตรฐาน

### 2. ตั้งค่าหัวตาราง

#### แผ่น Users
```
A1: id
B1: username
C1: password
D1: fullName
E1: birthDate
F1: gender
G1: studentId
H1: classId
I1: role
J1: createdAt
```

#### แผ่น Classes
```
A1: id
B1: name
C1: description
D1: createdAt
```

#### แผ่น TestResults
```
A1: id
B1: userId
C1: testType
D1: result
E1: evaluation
F1: testDate
G1: createdAt
```

#### แผ่น Standards
```
A1: id
B1: gender
C1: ageMin
D1: ageMax
E1: testType
F1: excellent
G1: good
H1: fair
I1: poor
```

### 3. ติดตั้ง Apps Script
1. ในสเปรดชีท ไปที่ Extensions > Apps Script
2. ลบโค้ดเดิมออก
3. คัดลอกโค้ดจาก `apps-script/main.gs` ไปวาง
4. บันทึกโปรเจค

### 4. ตั้งค่า Script Properties
1. ในโปรเจค Apps Script ไปที่ Project Settings (⚙️)
2. เลื่อนลงหา "Script Properties"
3. เพิ่ม Properties ดังนี้:

```
Key: API_KEY
Value: 194962269b518ccc319fce2c3fc8389466845ff31fb91a39749561a43919b58d

Key: PASSWORD_PEPPER
Value: 7ca0568a3670aa26f0aa32a8b6e116f4981d7110145c3ac384c491f48bfd448f
```

### 5. Deploy Web App
1. คลิก "Deploy" > "New deployment"
2. เลือก Type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. คลิก "Deploy"
6. คัดลอก URL ที่ได้

### 6. อัปเดต .env.local
แก้ไขไฟล์ `.env.local` ใส่ URL ที่ได้จากขั้นตอนที่ 5:
```env
NEXT_PUBLIC_GAS_BASE_URL=YOUR_DEPLOYED_WEB_APP_URL_HERE
```

### 7. เพิ่มข้อมูลตัวอย่าง

#### ข้อมูลชั้นเรียน (Classes)
```
1 | ม.4/1 | ชั้นมัธยมศึกษาปีที่ 4 ห้อง 1 | 2024-01-15
2 | ม.4/2 | ชั้นมัธยมศึกษาปีที่ 4 ห้อง 2 | 2024-01-15
3 | ม.5/1 | ชั้นมัธยมศึกษาปีที่ 5 ห้อง 1 | 2024-01-15
```

#### เกณฑ์มาตรฐาน (Standards) - วิ่ง 50 เมตร
```
1 | หญิง | 15 | 16 | วิ่ง50เมตร | ≤7.5 | 7.6-8.5 | 8.6-9.5 | >9.5
2 | ชาย | 15 | 16 | วิ่ง50เมตร | ≤6.8 | 6.9-7.8 | 7.9-8.8 | >8.8
3 | หญิง | 17 | 18 | วิ่ง50เมตร | ≤7.3 | 7.4-8.3 | 8.4-9.3 | >9.3
4 | ชาย | 17 | 18 | วิ่ง50เมตร | ≤6.6 | 6.7-7.6 | 7.7-8.6 | >8.6
```

## การใช้งาน

### การสร้างบัญชี
1. เปิดแอปพลิเคชัน
2. คลิก "สร้างบัญชีใหม่"
3. กรอกข้อมูลครบถ้วน
4. เลือกชั้นเรียนที่ถูกต้อง

### การบันทึกผลการทดสอบ
1. เข้าสู่ระบบ
2. ไปที่หน้า Dashboard
3. คลิก "บันทึกผลทดสอบ"
4. เลือกประเภทการทดสอบและกรอกผล

### การดูสถิติ
1. ไปที่หน้า Dashboard
2. ดูกราฟและตารางผลการทดสอบ
3. เปรียบเทียบกับเกณฑ์มาตรฐาน

## Troubleshooting

### ปัญหาที่พบบ่อย
1. **ไม่สามารถเชื่อมต่อ API**: ตรวจสอบ URL และ API Key
2. **ข้อมูลไม่อัปเดต**: ตรวจสอบสิทธิ์การเข้าถึงสเปรดชีท
3. **การประเมินผิดพลาด**: ตรวจสอบข้อมูลเกณฑ์มาตรฐาน

### การ Debug
1. เปิด Browser DevTools (F12)
2. ดูข้อความ error ใน Console
3. ตรวจสอบ Network tab สำหรับ API calls
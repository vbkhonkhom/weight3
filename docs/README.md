# 📚 Documentation

> เอกสารประกอบการใช้งาน WTH Fitness App

---

## 🗂️ รายการเอกสาร

### 🚀 สำหรับผู้ใช้ทั่วไป (ไม่มีความรู้ทางคอมพิวเตอร์)
1. **[quick-start-for-non-tech.md](./quick-start-for-non-tech.md)** ⭐ เริ่มต้นที่นี่!
   - คู่มือเริ่มต้นใช้งาน Google Sheets UI
   - อธิบายทีละขั้นตอนแบบละเอียด
   - ไม่ต้องเขียนโค้ดเลย ใช้แค่เมนูคลิก
   - **แนะนำสำหรับ**: Admin, ครู, ผู้ดูแลระบบที่ไม่มีพื้นฐาน IT

2. **[google-sheets-ui-guide.md](./google-sheets-ui-guide.md)**
   - คู่มือการใช้งานเมนู 🏋️ WTH Fitness
   - วิธีใช้แต่ละฟีเจอร์
   - ตัวอย่างการใช้งานจริง
   - Tips & Best Practices

3. **[google-sheets-ui-mockup.md](./google-sheets-ui-mockup.md)**
   - ภาพประกอบหน้าจอแต่ละฟีเจอร์
   - Flow Chart การทำงาน
   - ตัวอย่าง Dialog และ Alert
   - **ดูภาพก่อน → เข้าใจง่ายขึ้น**

---

### 👨‍💻 สำหรับนักพัฒนา (Developers)
4. **[setup.md](./setup.md)**
   - คู่มือติดตั้งโปรเจค
   - ตั้งค่า Environment
   - Install Dependencies
   - **สำหรับ**: Developer ที่จะพัฒนาต่อ

5. **[architecture.md](./architecture.md)**
   - สถาปัตยกรรมของระบบ
   - Database Schema
   - API Structure
   - Component Architecture

6. **[gas-setup.md](./gas-setup.md)**
   - การติดตั้ง Google Apps Script
   - Deploy Web App
   - Authentication Setup
   - **สำหรับ**: Backend Developer

---

### 📖 คู่มือการใช้งาน
7. **[user-guide.md](./user-guide.md)** และ **[user-guide/README.md](./user-guide/README.md)**
   - คู่มือผู้ใช้งานฉบับสมบูรณ์
   - สำหรับนักเรียน/นักศึกษา
   - สำหรับครู/อาจารย์
   - วิธีใช้งานแต่ละหน้า

8. **[sample-users.md](./sample-users.md)**
   - ข้อมูล User ทดสอบ
   - Username/Password สำหรับ Demo
   - ข้อมูล Class ตัวอย่าง

---

## 🎯 ฉันควรอ่านเอกสารไหนก่อน?

### ถ้าคุณเป็น...

#### 👤 Admin/ผู้ดูแลระบบ (ไม่เขียนโค้ด)
```
1. quick-start-for-non-tech.md  ← เริ่มที่นี่!
2. google-sheets-ui-guide.md    ← ศึกษาฟีเจอร์
3. google-sheets-ui-mockup.md   ← ดูภาพประกอบ
```

#### 👨‍🏫 ครู/อาจารย์ผู้ใช้งาน
```
1. user-guide.md                ← คู่มือผู้ใช้
2. google-sheets-ui-guide.md    ← ดูว่าจัดการข้อมูลยังไง
```

#### 🎓 นักเรียน/นักศึกษา
```
1. user-guide.md                ← คู่มือผู้ใช้
2. sample-users.md              ← ข้อมูล Login ทดสอบ
```

#### 👨‍💻 Developer (Frontend)
```
1. setup.md                     ← ติดตั้งโปรเจค
2. architecture.md              ← เข้าใจสถาปัตยกรรม
3. user-guide.md                ← รู้ว่า User ใช้งานยังไง
```

#### 🔧 Developer (Backend/Apps Script)
```
1. gas-setup.md                 ← ตั้งค่า Google Apps Script
2. architecture.md              ← เข้าใจ API Structure
3. google-sheets-ui-guide.md    ← ดูว่า UI เรียก API ยังไง
```

---

## 🆕 สิ่งใหม่ในเวอร์ชัน 2.0

### ✨ Google Sheets UI (เพิ่มใหม่!)
- เมนู **🏋️ WTH Fitness** ใน Google Sheets
- จัดการข้อมูลผ่าน UI (ไม่ต้องเข้า Apps Script)
- ตรวจสอบการใช้พื้นที่ (Storage Statistics)
- Archive/Cleanup/Delete ข้อมูลเก่า
- **เหมาะสำหรับ**: ผู้ใช้ที่ไม่เขียนโค้ด

### 📊 Storage Management
- ดูสถิติการใช้พื้นที่แบบ Real-time
- Archive ข้อมูลเก่าไปเก็บ Sheet แยก
- ลบข้อมูลซ้ำ (Duplicate Cleanup)
- ลบข้อมูลเก่าแบบปลอดภัย (Keep Latest N per User)

### 🎨 Toast Notification System
- แจ้งเตือนแบบสวยงาม
- 5 รูปแบบ: success, error, warning, info, loading
- แสดงที่มุมขวาบน ไม่บังเนื้อหา

### 🔒 Session Management
- Session คงอยู่หลัง Refresh
- รองรับทั้ง Student และ Instructor
- ไม่ต้อง Login ใหม่ทุกครั้ง

---

## 📁 โครงสร้างเอกสาร

```
docs/
├── README.md                        ← คุณอยู่ที่นี่
├── quick-start-for-non-tech.md     ← 🌟 เริ่มต้นที่นี่ (สำหรับคนไม่เขียนโค้ด)
├── google-sheets-ui-guide.md       ← คู่มือใช้งาน UI
├── google-sheets-ui-mockup.md      ← ภาพประกอบ
├── setup.md                        ← ติดตั้งโปรเจค
├── architecture.md                 ← สถาปัตยกรรม
├── gas-setup.md                    ← Google Apps Script
├── user-guide.md                   ← คู่มือผู้ใช้
├── sample-users.md                 ← ข้อมูลทดสอบ
└── user-guide/
    └── README.md                   ← คู่มือผู้ใช้ (ฉบับย่อ)
```

---

## 🔄 วงจรการใช้งาน

```
┌─────────────────────────────────────────────────────────┐
│                   ผู้ใช้ทั่วไป                          │
│                                                         │
│  1. อ่าน quick-start-for-non-tech.md                    │
│  2. ติดตั้งตามขั้นตอน                                   │
│  3. ใช้งานผ่านเมนู 🏋️ WTH Fitness                      │
│  4. ดู google-sheets-ui-guide.md เมื่อมีคำถาม          │
│  5. ดู google-sheets-ui-mockup.md เมื่อไม่เข้าใจ       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    นักพัฒนา                             │
│                                                         │
│  1. อ่าน setup.md + architecture.md                     │
│  2. อ่าน gas-setup.md (ถ้าทำ Backend)                   │
│  3. ดู user-guide.md (เข้าใจ User Perspective)          │
│  4. พัฒนาต่อ                                            │
│  5. อัปเดตเอกสารเมื่อมีการเปลี่ยนแปลง                   │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 คำแนะนำการใช้เอกสาร

### ✅ ควรทำ
- อ่านเอกสารตามลำดับที่แนะนำ
- ลองทำตามขั้นตอนจริง
- บันทึกปัญหาที่เจอ
- ถามเมื่อไม่เข้าใจ

### ❌ ไม่ควรทำ
- ข้ามขั้นตอนสำคัญ
- ไม่อ่านคำเตือน (⚠️)
- ทำตาม Tutorial เก่า (ใช้เอกสารนี้เป็นหลัก)

---

## 🎯 Checklist การใช้งาน

### สำหรับ Admin/ผู้ดูแลระบบ
- [ ] อ่าน [quick-start-for-non-tech.md](./quick-start-for-non-tech.md)
- [ ] ติดตั้งโค้ด Apps Script
- [ ] ตั้งค่า API Key
- [ ] Deploy Web App
- [ ] ทดสอบเมนู 🏋️ WTH Fitness
- [ ] รัน "ตั้งค่าทั้งหมดพร้อมกัน"
- [ ] สร้าง Admin User
- [ ] ทดสอบ Login
- [ ] ตั้งค่า Next.js (.env.local)

### สำหรับ Developer
- [ ] อ่าน [setup.md](./setup.md)
- [ ] Clone Repository
- [ ] Install Dependencies
- [ ] ตั้งค่า Environment Variables
- [ ] อ่าน [architecture.md](./architecture.md)
- [ ] ทำความเข้าใจ Code Structure
- [ ] Run Development Server
- [ ] ทดสอบ API Endpoints

---

**🏋️ WTH Fitness App - Documentation Hub**

*เวอร์ชัน 2.0 - อัปเดต: ตุลาคม 2025*

---

## 🌟 เอกสารแนะนำ

### 📌 Top 3 เอกสารที่คุณต้องอ่าน:

1. **[quick-start-for-non-tech.md](./quick-start-for-non-tech.md)** ⭐⭐⭐
   - สำหรับผู้ใช้ทั่วไป
   - เริ่มต้นใช้งานใน 15 นาที
   - ไม่ต้องเขียนโค้ด

2. **[google-sheets-ui-guide.md](./google-sheets-ui-guide.md)** ⭐⭐
   - คู่มือฟีเจอร์ครบถ้วน
   - Best Practices
   - Troubleshooting

3. **[setup.md](./setup.md)** ⭐ (สำหรับ Developer)
   - ติดตั้งและพัฒนาต่อ
   - Configuration
   - Development Guidelines

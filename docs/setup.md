# Setup Guide – WTH Fitness App

> สรุปขั้นตอนเชื่อมต่อ Next.js ↔ Google Apps Script ↔ Google Sheets  
> ใช้ร่วมกับเอกสาร `docs/architecture.md`

## 1. เตรียม Google Sheet

1. ทำสำเนาไฟล์ตัวอย่างหรือสร้างชีตใหม่ จากลิงก์ต้นฉบับ  
   <https://docs.google.com/spreadsheets/d/1AZ3_0g6bGya0sa2Ij1zKJZXNl3uS5P1etYL3csKt-HY/edit?usp=sharing>
2. สร้างแท็บ 4 ชีต พร้อมหัวคอลัมน์ (แถวที่ 1) ดังนี้

### `Users`

| id | role | full_name | email | password_hash | gender | birthdate | class_id | created_at | updated_at |

### `Classes`

| id | instructor_id | class_name | class_code | created_at |

### `TestResults`

| id | user_id | test_type | recorded_at | value | derived_value | evaluation | notes |

### `Standards`

หัวคอลัมน์จะถูกเติมอัตโนมัติเมื่อรันฟังก์ชัน `initializeStandards()` ใน Apps Script

> สำคัญ: ชีตต้องเปิดสิทธิ์ให้บัญชี Google ของคุณ (หรือ Service Account ถ้ามี) อ่าน/เขียนได้

## 2. ตั้งค่า Google Apps Script

1. ใน Google Sheet ไปที่ `Extensions > Apps Script`
2. ลบโค้ดเดิม แล้วคัดลอกไฟล์ [`apps-script/main.gs`](../apps-script/main.gs) ไปวาง
3. ใน Apps Script เลือก `Project Settings` แล้วตั้งค่า Script Properties:

   | Key              | Value อธิบาย                                |
   |------------------|----------------------------------------------|
   | `SHEET_ID`       | Spreadsheet ID (ส่วนระหว่าง `/d/` และ `/edit`) |
   | `API_KEY`        | สตริงลับสำหรับตรวจสอบคำขอจาก Next.js      |
   | `PASSWORD_PEPPER`| สตริงสุ่มยาว ๆ สำหรับผสมใน SHA-256 pass hash |

4. กด `Save` แล้วไปที่เมนู `Run` > `Run function` > `initializeStandards`  
   อนุญาตสิทธิ์ → ระบบจะเติมข้อมูลเกณฑ์มาตรฐานลงในชีต `Standards`

## 3. Deploy เป็น Web App

1. คลิก `Deploy` > `New deployment`
2. เลือก `Web app`, ตั้งค่า:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
3. กด Deploy → บันทึก URL ที่แสดง (ใช้เป็น `NEXT_PUBLIC_GAS_BASE_URL`)

> หากแก้ไขโค้ด Apps Script ในอนาคต อย่าลืมกด `Deploy > Manage deployments > Edit` เพื่ออัปเดตเวอร์ชัน

## 4. ตั้งค่า Environment Variables

บนเครื่อง (สร้าง `.env.local`) หรือใน Vercel ให้กำหนดค่า

```env
NEXT_PUBLIC_GAS_BASE_URL="https://script.google.com/macros/s/XXXXX/exec"
NEXT_PUBLIC_GAS_API_KEY="ค่าเดียวกับ API_KEY ใน Script Properties"
# ปิด mock เมื่อพร้อมเชื่อมต่อจริง
NEXT_PUBLIC_USE_MOCKS=false
```

> เมื่อยังไม่กำหนด `NEXT_PUBLIC_GAS_BASE_URL` ระบบจะ fallback เป็นโหมด mock เพื่อใช้งานได้ทันที

## 5. ตรวจสอบการเชื่อมต่อ

1. รัน `npm run dev` แล้วเปิด <http://localhost:3000>
2. ลงทะเบียนผู้ใช้ใหม่ (นักเรียนต้องใช้ `Class Code` จากชีต `Classes`)
3. บันทึกผลการทดสอบ → ตรวจดูว่าแถวใหม่ปรากฏในชีต `TestResults`

## 6. บทบาทและฟังก์ชันที่รองรับ

| Action               | Student | Instructor | Notes |
|----------------------|---------|------------|-------|
| Register / Login     | ✅       | ✅          | API `register`, `login` |
| Join class by code   | ✅       | —          | ตรวจสอบรหัสจากชีต `Classes` |
| Create class         | —       | ✅          | API `createClass`, สร้าง `class_code` 6 หลัก |
| Record fitness test  | ✅       | ✅ (สามารถขยายให้บันทึกแทนนักเรียนได้) | ประเมินตามชีต `Standards` |
| View dashboard       | ✅       | ✅          | Student → ผลของตนเอง, Instructor → สรุปชั้นเรียน |

## 7. เคล็ดลับเพิ่มเติม

- หากต้องการรีเซ็ตข้อมูลเกณฑ์มาตรฐาน ให้เคลียร์ชีต `Standards` แล้วรัน `initializeStandards()` ใหม่
- สามารถตั้งค่าลิมิตการเรียก API เพิ่มเติมใน Apps Script ผ่าน `CacheService` ได้
- อย่าลืมซ่อนชีต `Users` และ `TestResults` หรือเซ็ตสิทธิ์ให้เฉพาะครูผู้สอนเห็น เพื่อปกป้องข้อมูลส่วนตัว

เรียบร้อย!  ระบบ Next.js จะเชื่อมต่อกับ Google Sheets ผ่าน Apps Script ได้เต็มรูปแบบ

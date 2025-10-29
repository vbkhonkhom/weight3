# 🔌 API Reference - WTH Fitness App

> เอกสารอ้างอิง API สำหรับระบบ WTH Fitness App

---

## 📋 สารบัญ

1. [ภาพรวม API](#ภาพรวม-api)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Class Management](#class-management)
5. [Test Results](#test-results)
6. [Standards Management](#standards-management)
7. [Sport Types Management](#sport-types-management)
8. [Fitness Criteria Management](#fitness-criteria-management)
9. [Error Codes](#error-codes)

---

## ภาพรวม API

### Base URL
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

### Request Format
```http
POST /exec?action={ACTION_NAME}
Content-Type: application/json
Authorization: Bearer {API_KEY}

{
  "token": "user_session_token",
  "...additional_params"
}
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

---

## Authentication

### 1. Send OTP
ส่งรหัส OTP ไปยังอีเมล

**Endpoint:** `POST /exec?action=sendOTP`

**Request:**
```json
{
  "email": "user@school.ac.th"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to email",
  "otpToken": "temp_token_xyz123"
}
```

---

### 2. Verify OTP
ยืนยันรหัส OTP

**Endpoint:** `POST /exec?action=verifyOTP`

**Request:**
```json
{
  "otpToken": "temp_token_xyz123",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true
}
```

---

### 3. Register
ลงทะเบียนผู้ใช้ใหม่

**Endpoint:** `POST /exec?action=register`

**Request:**
```json
{
  "otpToken": "temp_token_xyz123",
  "role": "student",
  "full_name": "สมชาย ใจดี",
  "email": "somchai@school.ac.th",
  "password": "secure_password",
  "gender": "ชาย",
  "birthdate": "2010-05-15",
  "class_id": "class123",
  "sport_type": "ฟุตบอล",
  "position": "กองกลาง"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "user123",
    "email": "somchai@school.ac.th",
    "role": "student"
  }
}
```

---

### 4. Login
เข้าสู่ระบบ

**Endpoint:** `POST /exec?action=login`

**Request:**
```json
{
  "email": "somchai@school.ac.th",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "session_token_abc456",
  "user": {
    "id": "user123",
    "email": "somchai@school.ac.th",
    "full_name": "สมชาย ใจดี",
    "role": "student",
    "gender": "ชาย",
    "birthdate": "2010-05-15",
    "class_id": "class123",
    "sport_type": "ฟุตบอล",
    "position": "กองกลาง"
  }
}
```

---

### 5. Change Password
เปลี่ยนรหัสผ่าน

**Endpoint:** `POST /exec?action=changePassword`

**Request:**
```json
{
  "token": "session_token_abc456",
  "oldPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## User Management

### 1. Get My Profile
ดึงข้อมูลโปรไฟล์ตัวเอง

**Endpoint:** `POST /exec?action=getMyProfile`

**Request:**
```json
{
  "token": "session_token_abc456"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "somchai@school.ac.th",
    "full_name": "สมชาย ใจดี",
    "role": "student",
    "gender": "ชาย",
    "birthdate": "2010-05-15",
    "class_id": "class123",
    "sport_type": "ฟุตบอล",
    "position": "กองกลาง",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### 2. List Users
ดึงรายชื่อผู้ใช้ทั้งหมด (อาจารย์เท่านั้น)

**Endpoint:** `POST /exec?action=listUsers`

**Request:**
```json
{
  "token": "instructor_token"
}
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user123",
      "full_name": "สมชาย ใจดี",
      "email": "somchai@school.ac.th",
      "role": "student",
      "class_id": "class123"
    }
  ]
}
```

---

## Class Management

### 1. Create Class
สร้างชั้นเรียนใหม่ (อาจารย์เท่านั้น)

**Endpoint:** `POST /exec?action=createClass`

**Request:**
```json
{
  "token": "instructor_token",
  "class_name": "PE-101",
  "class_code": "PE101-2024"
}
```

**Response:**
```json
{
  "success": true,
  "class": {
    "id": "class123",
    "class_name": "PE-101",
    "class_code": "PE101-2024",
    "instructor_id": "instructor001",
    "created_at": "2024-10-22T10:00:00Z"
  }
}
```

---

### 2. List Classes
ดึงรายการชั้นเรียน

**Endpoint:** `POST /exec?action=listClasses`

**Request:**
```json
{
  "token": "session_token"
}
```

**Response:**
```json
{
  "success": true,
  "classes": [
    {
      "id": "class123",
      "class_name": "PE-101",
      "class_code": "PE101-2024",
      "instructor_id": "instructor001",
      "student_count": 24
    }
  ]
}
```

---

### 3. Get Class Roster
ดึงรายชื่อนักเรียนในชั้น

**Endpoint:** `POST /exec?action=getClassRoster`

**Request:**
```json
{
  "token": "instructor_token",
  "class_id": "class123"
}
```

**Response:**
```json
{
  "success": true,
  "roster": [
    {
      "studentId": "user123",
      "fullName": "สมชาย ใจดี",
      "email": "somchai@school.ac.th",
      "gender": "ชาย",
      "birthdate": "2010-05-15",
      "latestBMI": 22.5,
      "latestBMIEval": "ปกติ"
    }
  ]
}
```

---

## Test Results

### 1. Add Test Result
บันทึกผลการทดสอบ

**Endpoint:** `POST /exec?action=addTestResult`

**Request:**
```json
{
  "token": "session_token",
  "test_type": "BMI",
  "value": 22.5,
  "derived_value": null,
  "evaluation": "ปกติ",
  "notes": "ทดสอบหลังออกกำลังกาย"
}
```

**Response:**
```json
{
  "success": true,
  "testResult": {
    "id": "test001",
    "user_id": "user123",
    "test_type": "BMI",
    "value": 22.5,
    "evaluation": "ปกติ",
    "recorded_at": "2024-10-22T14:30:00Z"
  }
}
```

---

### 2. Get Test Results
ดึงผลการทดสอบ

**Endpoint:** `POST /exec?action=getTestResults`

**Request:**
```json
{
  "token": "session_token",
  "user_id": "user123",
  "test_type": "BMI"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "test001",
      "test_type": "BMI",
      "value": 22.5,
      "evaluation": "ปกติ",
      "recorded_at": "2024-10-22T14:30:00Z",
      "notes": "ทดสอบหลังออกกำลังกาย"
    }
  ]
}
```

---

### 3. Get Latest Test Result
ดึงผลการทดสอบล่าสุด

**Endpoint:** `POST /exec?action=getLatestTestResult`

**Request:**
```json
{
  "token": "session_token",
  "test_type": "BMI"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "id": "test001",
    "test_type": "BMI",
    "value": 22.5,
    "evaluation": "ปกติ",
    "recorded_at": "2024-10-22T14:30:00Z"
  }
}
```

---

## Standards Management

### 1. Get Standards
ดึงเกณฑ์มาตรฐาน

**Endpoint:** `POST /exec?action=getStandards`

**Request:**
```json
{
  "token": "session_token"
}
```

**Response:**
```json
{
  "success": true,
  "standards": [
    {
      "id": "std001",
      "test_type": "BMI",
      "gender": "ชาย",
      "age_min": 18,
      "age_max": 25,
      "category": "ปกติ",
      "min_value": 18.5,
      "max_value": 22.9,
      "comparison": "between"
    }
  ]
}
```

---

## Sport Types Management

### 1. Get Sport Types
ดึงประเภทกีฬาทั้งหมด

**Endpoint:** `POST /exec?action=getSportTypes`

**Request:**
```json
{
  "token": "instructor_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sport001",
      "name": "ฟุตบอล",
      "positions": ["กองหน้า", "กองกลาง", "กองหลัง", "ผู้รักษาประตู"],
      "created_at": "2024-10-22T10:00:00Z"
    }
  ]
}
```

---

### 2. Add Sport Type
เพิ่มประเภทกีฬาใหม่ (อาจารย์เท่านั้น)

**Endpoint:** `POST /exec?action=addSportType`

**Request:**
```json
{
  "token": "instructor_token",
  "name": "ฟุตบอล",
  "positions": ["กองหน้า", "กองกลาง", "กองหลัง", "ผู้รักษาประตู"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sport001",
    "name": "ฟุตบอล",
    "positions": ["กองหน้า", "กองกลาง", "กองหลัง", "ผู้รักษาประตู"],
    "created_at": "2024-10-22T10:00:00Z"
  }
}
```

---

### 3. Update Sport Type
แก้ไขประเภทกีฬา (อาจารย์เท่านั้น)

**Endpoint:** `POST /exec?action=updateSportType`

**Request:**
```json
{
  "token": "instructor_token",
  "id": "sport001",
  "name": "ฟุตบอล (แก้ไข)",
  "positions": ["กองหน้า", "กองกลาง", "กองหลัง", "ผู้รักษาประตู", "ปีก"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sport001",
    "name": "ฟุตบอล (แก้ไข)",
    "positions": ["กองหน้า", "กองกลาง", "กองหลัง", "ผู้รักษาประตู", "ปีก"],
    "created_at": "2024-10-22T10:00:00Z"
  }
}
```

---

### 4. Delete Sport Type
ลบประเภทกีฬา (อาจารย์เท่านั้น)

**Endpoint:** `POST /exec?action=deleteSportType`

**Request:**
```json
{
  "token": "instructor_token",
  "id": "sport001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sport type deleted"
}
```

---

## Fitness Criteria Management

### 1. Get Fitness Criteria
ดึงเกณฑ์สมรรถภาพทั้งหมด

**Endpoint:** `POST /exec?action=getFitnessCriteria`

**Request:**
```json
{
  "token": "instructor_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "criteria001",
      "sportType": "ฟุตบอล",
      "gender": "male",
      "ageMin": 18,
      "ageMax": 25,
      "testType": "VO2 Max",
      "excellent": "> 55",
      "good": "50-55",
      "fair": "45-50",
      "poor": "< 45",
      "unit": "ml/kg/min",
      "createdAt": "2024-10-22T10:00:00Z"
    }
  ]
}
```

---

### 2. Add Fitness Criteria
เพิ่มเกณฑ์สมรรถภาพใหม่ (อาจารย์เท่านั้น)

**Endpoint:** `POST /exec?action=addFitnessCriteria`

**Request:**
```json
{
  "token": "instructor_token",
  "sportType": "ฟุตบอล",
  "gender": "male",
  "ageMin": 18,
  "ageMax": 25,
  "testType": "VO2 Max",
  "excellent": "> 55",
  "good": "50-55",
  "fair": "45-50",
  "poor": "< 45",
  "unit": "ml/kg/min"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "criteria001",
    "sportType": "ฟุตบอล",
    "gender": "male",
    "ageMin": 18,
    "ageMax": 25,
    "testType": "VO2 Max",
    "excellent": "> 55",
    "good": "50-55",
    "fair": "45-50",
    "poor": "< 45",
    "unit": "ml/kg/min",
    "createdAt": "2024-10-22T10:00:00Z"
  }
}
```

---

### 3. Update Fitness Criteria
แก้ไขเกณฑ์สมรรถภาพ (อาจารย์เท่านั้น)

**Endpoint:** `POST /exec?action=updateFitnessCriteria`

**Request:**
```json
{
  "token": "instructor_token",
  "id": "criteria001",
  "excellent": "> 60",
  "good": "55-60"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "criteria001",
    "sportType": "ฟุตบอล",
    "gender": "male",
    "ageMin": 18,
    "ageMax": 25,
    "testType": "VO2 Max",
    "excellent": "> 60",
    "good": "55-60",
    "fair": "45-50",
    "poor": "< 45",
    "unit": "ml/kg/min",
    "createdAt": "2024-10-22T10:00:00Z"
  }
}
```

---

### 4. Delete Fitness Criteria
ลบเกณฑ์สมรรถภาพ (อาจารย์เท่านั้น)

**Endpoint:** `POST /exec?action=deleteFitnessCriteria`

**Request:**
```json
{
  "token": "instructor_token",
  "id": "criteria001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fitness criteria deleted"
}
```

---

## Error Codes

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - ข้อมูลไม่ครบหรือไม่ถูกต้อง |
| 401 | Unauthorized - ไม่มีสิทธิ์เข้าถึง |
| 404 | Not Found - ไม่พบข้อมูล |
| 500 | Internal Server Error - ข้อผิดพลาดจากเซิร์ฟเวอร์ |

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
| Code | Message | Description |
|------|---------|-------------|
| `MISSING_PARAMS` | Missing required parameters | พารามิเตอร์ที่จำเป็นขาดหายไป |
| `INVALID_TOKEN` | Invalid session token | Token ไม่ถูกต้องหรือหมดอายุ |
| `UNAUTHORIZED` | Unauthorized access | ไม่มีสิทธิ์เข้าถึง |
| `USER_NOT_FOUND` | User not found | ไม่พบผู้ใช้ |
| `INVALID_CREDENTIALS` | Invalid email or password | อีเมลหรือรหัสผ่านไม่ถูกต้อง |
| `DUPLICATE_EMAIL` | Email already exists | อีเมลนี้ถูกใช้งานแล้ว |
| `CLASS_NOT_FOUND` | Class not found | ไม่พบชั้นเรียน |
| `INVALID_OTP` | Invalid OTP code | รหัส OTP ไม่ถูกต้อง |

---

## 📝 ตัวอย่างการใช้งาน

### JavaScript/TypeScript (Frontend)
```typescript
async function loginUser(email: string, password: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GAS_API_URL}?action=login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GAS_API_KEY}`
      },
      body: JSON.stringify({ email, password })
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.token);
    return data.user;
  } else {
    throw new Error(data.error);
  }
}
```

### cURL (Testing)
```bash
curl -X POST \
  'https://script.google.com/macros/s/YOUR_ID/exec?action=login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{
    "email": "test@school.ac.th",
    "password": "password123"
  }'
```

---

## 🔒 Security Notes

1. **API Key:** ต้องส่งใน Authorization header ทุกครั้ง
2. **Session Token:** ใช้สำหรับ authenticated endpoints
3. **HTTPS Only:** ใช้ HTTPS เท่านั้น
4. **Rate Limiting:** มีการจำกัดจำนวนคำขอต่อนาที
5. **CORS:** ตั้งค่า allowed origins ใน Apps Script

---

## 📚 เอกสารเพิ่มเติม

- [Getting Started](getting-started.md)
- [Instructor Guide](instructor-guide.md)
- [Development Guide](development.md)

---

**Last Updated:** October 22, 2025

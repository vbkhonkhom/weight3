# 🚀 คู่มือการ Setup และพัฒนาต่อ - WTH Fitness App

> คู่มือฉบับสมบูรณ์สำหรับการโคลนโปรเจค ติดตั้ง และเริ่มพัฒนาต่อ

---

## 📋 สารบัญ

1. [ข้อกำหนดเบื้องต้น](#ข้อกำหนดเบื้องต้น)
2. [การโคลนโปรเจค](#การโคลนโปรเจค)
3. [ติดตั้ง Dependencies](#ติดตั้ง-dependencies)
4. [ตั้งค่า Environment Variables](#ตั้งค่า-environment-variables)
5. [ตั้งค่า Google Apps Script Backend](#ตั้งค่า-google-apps-script-backend)
6. [รันโปรเจคในเครื่อง](#รันโปรเจคในเครื่อง)
7. [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
8. [การพัฒนาต่อ](#การพัฒนาต่อ)
9. [การ Deploy](#การ-deploy)
10. [แก้ไขปัญหา](#แก้ไขปัญหา)

---

## 📦 ข้อกำหนดเบื้องต้น

ก่อนเริ่มต้น ตรวจสอบว่าคุณมีสิ่งเหล่านี้ติดตั้งแล้ว:

### 1. Node.js และ npm
```bash
# ตรวจสอบเวอร์ชัน
node --version  # ควรเป็น v18 หรือสูงกว่า
npm --version   # ควรเป็น v8 หรือสูงกว่า
```

**ติดตั้ง Node.js:**
- ดาวน์โหลดจาก: https://nodejs.org/
- แนะนำเวอร์ชัน LTS (Long Term Support)

### 2. Git
```bash
# ตรวจสอบเวอร์ชัน
git --version
```

**ติดตั้ง Git:**
- Windows: https://git-scm.com/download/win
- Mac: `brew install git`
- Linux: `sudo apt-get install git`

### 3. Code Editor
- **Visual Studio Code** (แนะนำ): https://code.visualstudio.com/
- Extensions ที่แนะนำ:
  - ESLint
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### 4. บัญชี Google
- สำหรับตั้งค่า Google Apps Script และ Google Sheets

---

## 📂 การโคลนโปรเจค

### วิธีที่ 1: Clone ผ่าน HTTPS
```bash
git clone https://github.com/Hakuma17/WTHFitnessApp.git
cd WTHFitnessApp
```

### วิธีที่ 2: Clone ผ่าน SSH (ต้องตั้งค่า SSH key ก่อน)
```bash
git clone git@github.com:Hakuma17/WTHFitnessApp.git
cd WTHFitnessApp
```

### วิธีที่ 3: ดาวน์โหลด ZIP
1. ไปที่ https://github.com/Hakuma17/WTHFitnessApp
2. คลิก "Code" → "Download ZIP"
3. แตกไฟล์และเปิด Terminal ในโฟลเดอร์โปรเจค

---

## 📦 ติดตั้ง Dependencies

```bash
# ติดตั้ง packages ทั้งหมด
npm install

# หรือใช้ yarn (ถ้ามี)
yarn install

# หรือใช้ pnpm (ถ้ามี)
pnpm install
```

**Dependencies หลักๆ ที่จะติดตั้ง:**
- **Next.js 15.5.4** - React Framework
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS v4** - Styling
- **SWR** - Data Fetching
- **date-fns** - Date Utilities
- **Recharts** - Charts (ถ้าต้องการกราฟ)
- **Lucide React** - Icons
- **jsPDF** - PDF Export

---

## ⚙️ ตั้งค่า Environment Variables

### 1. สร้างไฟล์ `.env.local`

```bash
# สร้างไฟล์ใหม่
touch .env.local
```

หรือคัดลอกจาก template:
```bash
cp .env.example .env.local
```

### 2. แก้ไขไฟล์ `.env.local`

```env
# Google Apps Script Configuration
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
NEXT_PUBLIC_GAS_API_KEY=your-secret-api-key-here

# Optional: Development Settings
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=WTH Fitness App
```

**วิธีหาค่าเหล่านี้:**
- `NEXT_PUBLIC_GAS_URL`: จะได้จากการ Deploy Google Apps Script (ดูหัวข้อถัดไป)
- `NEXT_PUBLIC_GAS_API_KEY`: กำหนดเองในไฟล์ Apps Script (`main.gs`)

---

## 🔧 ตั้งค่า Google Apps Script Backend

### ขั้นตอนที่ 1: สร้าง Google Spreadsheet

1. ไปที่ https://sheets.google.com
2. สร้าง Spreadsheet ใหม่
3. ตั้งชื่อว่า "WTH Fitness Database" (หรือชื่ออื่นตามต้องการ)

### ขั้นตอนที่ 2: เปิด Apps Script Editor

1. ใน Google Sheets คลิก **Extensions** → **Apps Script**
2. ลบโค้ดเริ่มต้นออก

### ขั้นตอนที่ 3: Copy โค้ด Backend

1. เปิดไฟล์ `apps-script/main.gs` ในโปรเจค
2. Copy โค้ดทั้งหมด
3. Paste ใน Apps Script Editor

### ขั้นตอนที่ 4: ตั้งค่า API Key

ในไฟล์ `main.gs` ให้แก้ไขบรรทัดนี้:

```javascript
// หาบรรทัดนี้ และเปลี่ยน API_KEY
const API_KEY = "your-secret-api-key-here"; // เปลี่ยนให้ตรงกับ .env.local
```

### ขั้นตอนที่ 5: Deploy

1. คลิก **Deploy** → **New deployment**
2. เลือก type: **Web app**
3. ตั้งค่า:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. คลิก **Deploy**
5. **Copy URL** ที่ได้ → นำไปใส่ใน `.env.local` ที่ `NEXT_PUBLIC_GAS_URL`

### ขั้นตอนที่ 6: รัน First-time Setup

ใน Apps Script Editor:

1. เลือกฟังก์ชัน `runFirstTimeSetupAll` จาก dropdown
2. คลิก **Run**
3. อนุญาตสิทธิ์ที่ขอ
4. รอจนเสร็จ (ประมาณ 10-30 วินาที)

**สิ่งที่จะเกิดขึ้น:**
- สร้าง Sheets: Users, Classes, TestResults, Standards, BodyMeasurements
- สร้างบัญชี Admin เริ่มต้น: `admin@wth.ac.th` / `WTH456`
- เติมข้อมูลเกณฑ์มาตรฐาน

---

## 🚀 รันโปรเจคในเครื่อง

### Development Mode

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่: **http://localhost:3000**

### Production Build

```bash
# Build
npm run build

# Start production server
npm start
```

### เข้าสู่ระบบครั้งแรก

**บัญชี Admin (ครู):**
- Email: `admin@wth.ac.th`
- Password: `WTH456`

**หรือสร้างบัญชีใหม่:**
1. คลิก "ลงทะเบียน"
2. กรอกข้อมูล
3. เลือก Role: Student / Instructor / Athlete

---

## 📁 โครงสร้างโปรเจค

```
WTHFitnessApp/
├── apps-script/           # Google Apps Script Backend
│   └── main.gs           # ไฟล์ Backend หลัก
├── docs/                 # เอกสารทั้งหมด
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── architecture.md
│   └── ...
├── public/               # Static assets
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── dashboard/   # หน้า Dashboard
│   │   ├── tests/       # หน้าบันทึกผลการทดสอบ
│   │   ├── standards/   # หน้าดูเกณฑ์
│   │   ├── instructor/  # หน้าสำหรับครู
│   │   └── api/         # API Routes (proxy to GAS)
│   ├── components/      # React Components
│   │   ├── ui/         # UI Components พื้นฐาน
│   │   ├── forms/      # Forms
│   │   ├── layout/     # Layout Components
│   │   └── instructor/ # Components สำหรับครู
│   ├── lib/            # Utilities & Helpers
│   │   ├── api.ts      # API Client
│   │   ├── auth.ts     # Authentication
│   │   ├── types.ts    # TypeScript Types
│   │   └── utils.ts    # Utilities
│   └── providers/      # React Context Providers
├── .env.local          # Environment Variables (สร้างเอง)
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript Config
├── tailwind.config.ts  # Tailwind Config
└── next.config.ts      # Next.js Config
```

---

## 💻 การพัฒนาต่อ

### 1. เพิ่มหน้าใหม่

```bash
# สร้างไฟล์ใน src/app/
src/app/new-page/page.tsx
```

```tsx
export default function NewPage() {
  return (
    <div className="p-6">
      <h1>หน้าใหม่</h1>
    </div>
  );
}
```

### 2. เพิ่ม Component ใหม่

```bash
src/components/my-component.tsx
```

```tsx
export function MyComponent() {
  return <div>Component ใหม่</div>;
}
```

### 3. เพิ่ม API Endpoint ใหม่ (ใน Google Apps Script)

แก้ไขไฟล์ `apps-script/main.gs`:

```javascript
function handleRequest(method, e) {
  const action = e?.parameter?.action;
  
  switch (action) {
    case "myNewEndpoint":
      return respond(requireAuth(token, null, (user) => myNewFunction(user)));
    // ... existing cases
  }
}

function myNewFunction(user) {
  // Your logic here
  return { success: true, data: [] };
}
```

### 4. เรียกใช้ API ใหม่ (ใน Frontend)

แก้ไขไฟล์ `src/lib/api.ts`:

```typescript
export const api = {
  // ... existing methods
  
  async myNewEndpoint(token: string) {
    const params = new URLSearchParams({ 
      action: "myNewEndpoint",
      token 
    });
    const res = await fetch(`${GAS_URL}?${params}`);
    return res.json();
  }
};
```

### 5. ใช้ใน Component

```tsx
import { api } from "@/lib/api";
import { useSession } from "@/providers/session-provider";

export function MyComponent() {
  const { session } = useSession();
  
  const handleClick = async () => {
    const result = await api.myNewEndpoint(session.token);
    console.log(result);
  };
  
  return <button onClick={handleClick}>คลิก</button>;
}
```

---

## 🌐 การ Deploy

### Deploy Frontend (Next.js) บน Vercel

1. **Push โค้ดขึ้น GitHub:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy บน Vercel:**
   - ไปที่ https://vercel.com
   - คลิก "New Project"
   - Import repository จาก GitHub
   - ตั้งค่า Environment Variables:
     - `NEXT_PUBLIC_GAS_URL`
     - `NEXT_PUBLIC_GAS_API_KEY`
   - คลิก "Deploy"

3. **Domain:**
   - จะได้ URL แบบ: `https://your-app.vercel.app`

### Deploy Backend (Google Apps Script)

Backend ใช้ Google Apps Script ซึ่ง deploy แล้วในขั้นตอนการ setup

**Update Backend:**
1. แก้ไขไฟล์ `apps-script/main.gs`
2. Copy โค้ดใหม่ไป Paste ใน Apps Script Editor
3. Save
4. Deploy → Manage deployments → Edit → Deploy

---

## 🔍 แก้ไขปัญหา

### ปัญหา: ติดตั้ง Dependencies ไม่สำเร็จ

```bash
# ลบ node_modules และ lock files
rm -rf node_modules package-lock.json

# ติดตั้งใหม่
npm install
```

### ปัญหา: Next.js ไม่เจอ Environment Variables

- ตรวจสอบว่าชื่อไฟล์คือ `.env.local` (ไม่ใช่ `.env`)
- ตรวจสอบว่าตัวแปรขึ้นต้นด้วย `NEXT_PUBLIC_`
- Restart dev server หลังแก้ไข env

### ปัญหา: CORS Error เมื่อเรียก API

ใน `apps-script/main.gs`:

```javascript
function addCorsHeaders(output) {
  return output
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
```

### ปัญหา: Google Apps Script ไม่ทำงาน

1. ตรวจสอบ API Key ใน `.env.local` และ `main.gs`
2. ตรวจสอบ URL ใน `.env.local`
3. ดู Logs ใน Apps Script: View → Executions

### ปัญหา: Build ไม่ผ่าน

```bash
# ตรวจสอบ TypeScript errors
npm run lint

# Build ดู error
npm run build
```

---

## 📚 เอกสารเพิ่มเติม

- **[API Reference](docs/api-reference.md)** - รายละเอียด API ทั้งหมด
- **[Architecture](docs/architecture.md)** - สถาปัตยกรรมระบบ
- **[User Guides](docs/user-guide/)** - คู่มือผู้ใช้งาน
- **[Development Guide](docs/development.md)** - คู่มือพัฒนาละเอียด

---

## 🤝 การมีส่วนร่วม

1. Fork โปรเจค
2. สร้าง Branch ใหม่: `git checkout -b feature/my-feature`
3. Commit การเปลี่ยนแปลง: `git commit -m "Add some feature"`
4. Push ขึ้น Branch: `git push origin feature/my-feature`
5. เปิด Pull Request

---

## 📞 ติดต่อ & Support

- **GitHub Issues:** https://github.com/Hakuma17/WTHFitnessApp/issues
- **Email:** (ใส่อีเมลของคุณ)

---

## 📄 License

MIT License - ดูไฟล์ [LICENSE](LICENSE) สำหรับรายละเอียด

---

## ✅ Checklist สำหรับ Setup

- [ ] ติดตั้ง Node.js และ Git แล้ว
- [ ] โคลนโปรเจคแล้ว
- [ ] รัน `npm install` แล้ว
- [ ] สร้าง Google Spreadsheet แล้ว
- [ ] Deploy Google Apps Script แล้ว
- [ ] สร้างไฟล์ `.env.local` และใส่ค่าแล้ว
- [ ] รัน `npm run dev` สำเร็จ
- [ ] เข้าสู่ระบบด้วยบัญชี Admin ได้แล้ว
- [ ] ทดสอบฟีเจอร์หลักๆ แล้ว

**เสร็จสิ้น! พร้อมพัฒนาต่อ 🎉**

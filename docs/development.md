# 🛠️ Development Guide - WTH Fitness App

> คู่มือสำหรับนักพัฒนาที่ต้องการพัฒนาหรือปรับแต่งระบบ

---

## 📋 สารบัญ

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Development Setup](#development-setup)
5. [Code Standards](#code-standards)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Contributing](#contributing)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────┐
│            Client Browser                    │
│  ┌────────────────────────────────────────┐ │
│  │  Next.js Frontend (React)              │ │
│  │  - Pages (App Router)                  │ │
│  │  - Components (UI)                     │ │
│  │  - State Management (SWR + Context)    │ │
│  └────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ HTTP/HTTPS
                   ▼
┌─────────────────────────────────────────────┐
│      Google Apps Script Backend             │
│  ┌────────────────────────────────────────┐ │
│  │  RESTful API Endpoints                 │ │
│  │  - Authentication                      │ │
│  │  - CRUD Operations                     │ │
│  │  - Business Logic                      │ │
│  └────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         Google Sheets Database              │
│  - Users                                    │
│  - Classes                                  │
│  - TestResults                              │
│  - Standards                                │
│  - BodyMeasurements                         │
│  - SportTypes                               │
│  - FitnessCriteria                          │
└─────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Frontend Component → API Call
                                      ↓
                              Apps Script Endpoint
                                      ↓
                              Validate & Process
                                      ↓
                              Google Sheets CRUD
                                      ↓
                              Response → Update UI
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15.5.4 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.x
- **State Management:** 
  - SWR (Server State)
  - React Context (Global State)
- **Form Handling:** React Hook Form + Zod
- **Icons:** Lucide React
- **Date Handling:** date-fns

### Backend
- **Platform:** Google Apps Script
- **Language:** JavaScript (ES5/ES6)
- **Database:** Google Sheets
- **Authentication:** Custom JWT-like tokens

### Development Tools
- **Package Manager:** npm
- **Linting:** ESLint
- **Formatting:** Prettier (via ESLint)
- **Testing:** Vitest
- **Version Control:** Git

---

## Project Structure

```
WTHFitnessApp/
├── apps-script/
│   └── main.gs                    # Backend API code
├── docs/                          # Documentation
│   ├── getting-started.md
│   ├── instructor-guide.md
│   ├── student-guide.md
│   ├── athlete-guide.md
│   ├── api-reference.md
│   └── ...
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js pages (App Router)
│   │   ├── page.tsx              # Home/Login
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── api/                  # API routes
│   │   ├── classes/              # Classes pages
│   │   ├── dashboard/            # Dashboard
│   │   ├── tests/                # Test recording pages
│   │   │   ├── bmi/
│   │   │   ├── body-measurements/
│   │   │   ├── endurance/
│   │   │   ├── flexibility/
│   │   │   └── strength/
│   │   ├── instructor/           # Instructor pages
│   │   │   ├── manage-sports/
│   │   │   └── manage-criteria/
│   │   └── ...
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── forms/                # Form components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── instructor/           # Instructor components
│   │   └── layout/               # Layout components
│   ├── lib/                      # Utilities & helpers
│   │   ├── api.ts               # API client
│   │   ├── auth.ts              # Auth utilities
│   │   ├── types.ts             # TypeScript types
│   │   ├── utils.ts             # General utilities
│   │   ├── constants.ts         # Constants
│   │   └── __tests__/           # Unit tests
│   └── providers/                # Context providers
│       ├── session-provider.tsx
│       ├── theme-provider.tsx
│       └── loading-provider.tsx
├── .env.local                    # Environment variables
├── .env.example                  # Example env file
├── .gitignore
├── eslint.config.mjs            # ESLint config
├── next.config.ts               # Next.js config
├── package.json
├── postcss.config.mjs           # PostCSS config
├── README.md
├── tailwind.config.ts           # Tailwind config
├── tsconfig.json                # TypeScript config
└── vitest.config.ts             # Vitest config
```

---

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git
- VS Code (recommended)
- Google Account

### Initial Setup

1. **Clone Repository**
```bash
git clone https://github.com/Hakuma17/WTHFitnessApp.git
cd WTHFitnessApp
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/YOUR_ID/exec
NEXT_PUBLIC_GAS_API_KEY=your_api_key
NEXT_PUBLIC_USE_MOCKS=true  # Use mock data for development
SESSION_SECRET=your_secret_key
```

4. **Run Development Server**
```bash
npm run dev
```

Open http://localhost:3000

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI
```

---

## Code Standards

### TypeScript Guidelines

**1. Use Interfaces for Objects**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: "student" | "instructor" | "athlete";
}

// ❌ Avoid
type User = {
  id: string;
  email: string;
  role: string;
};
```

**2. Explicit Return Types**
```typescript
// ✅ Good
function getUser(id: string): User | null {
  return users.find(u => u.id === id) || null;
}

// ❌ Avoid
function getUser(id: string) {
  return users.find(u => u.id === id) || null;
}
```

**3. Use Type Guards**
```typescript
function isStudent(user: User): user is Student {
  return user.role === "student";
}
```

### React Guidelines

**1. Use Functional Components**
```typescript
// ✅ Good
export function MyComponent({ name }: { name: string }) {
  return <div>{name}</div>;
}

// ❌ Avoid class components
```

**2. Props Interface**
```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ children, onClick, variant = "primary" }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

**3. Use Client/Server Components Appropriately**
```typescript
// Client Component (interactive)
"use client";
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// Server Component (default)
export function UserList() {
  // No useState, useEffect
  return <div>...</div>;
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile`, `TestForm` |
| Functions | camelCase | `getUserData`, `calculateBMI` |
| Variables | camelCase | `userName`, `testResults` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| Interfaces | PascalCase | `UserData`, `TestResult` |
| Types | PascalCase | `Role`, `TestType` |
| Files (components) | kebab-case | `user-profile.tsx` |
| Files (utils) | kebab-case | `date-utils.ts` |

### File Organization

**Component File Structure:**
```typescript
// imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// types
interface MyComponentProps {
  title: string;
}

// component
export function MyComponent({ title }: MyComponentProps) {
  // hooks
  const [state, setState] = useState();

  // handlers
  const handleClick = () => {};

  // render
  return <div>...</div>;
}
```

---

## Testing

### Unit Tests

**Location:** `src/lib/__tests__/`

**Example:**
```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateAge } from '../utils';

describe('calculateAge', () => {
  it('should calculate age correctly', () => {
    const birthdate = '2000-01-01';
    const age = calculateAge(birthdate);
    expect(age).toBeGreaterThan(20);
  });
});
```

**Run Tests:**
```bash
npm run test
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
```

### Integration Tests

**Test API Endpoints:**
```typescript
// Test with mock mode
NEXT_PUBLIC_USE_MOCKS=true npm run dev

// Test against real backend
NEXT_PUBLIC_USE_MOCKS=false npm run dev
```

### Manual Testing Checklist

- [ ] Login/Register flows
- [ ] Dashboard displays correctly
- [ ] Test result recording
- [ ] Class management (instructor)
- [ ] Sport types management
- [ ] Fitness criteria management
- [ ] Dark/Light theme toggle
- [ ] Mobile responsive
- [ ] Error handling

---

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import GitHub repository
- Configure environment variables
- Deploy

3. **Environment Variables (Vercel)**
```
NEXT_PUBLIC_GAS_API_URL=...
NEXT_PUBLIC_GAS_API_KEY=...
NEXT_PUBLIC_USE_MOCKS=false
SESSION_SECRET=...
```

### Manual Build

```bash
npm run build
npm run start
```

### Apps Script Deployment

1. Open Apps Script Editor
2. Click **Deploy → New deployment**
3. Select **Web app**
4. Configure:
   - Execute as: Me
   - Who has access: Anyone
5. Deploy and copy URL
6. Update `NEXT_PUBLIC_GAS_API_URL` in `.env.local`

---

## Contributing

### Branch Strategy

```
main          → Production-ready code
develop       → Development branch
feature/*     → New features
fix/*         → Bug fixes
docs/*        → Documentation updates
```

### Workflow

1. **Create Feature Branch**
```bash
git checkout -b feature/add-export-feature
```

2. **Make Changes**
```bash
# Write code
git add .
git commit -m "feat: add export to CSV"
```

3. **Push and Create PR**
```bash
git push origin feature/add-export-feature
```

4. **Code Review**
5. **Merge to main**

### Commit Message Convention

```
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting, missing semicolons
refactor: code restructuring
test: adding tests
chore: updating build tasks
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] All tests pass
- [ ] No console errors

## Screenshots (if applicable)
```

---

## Common Development Tasks

### Adding a New Page

1. **Create page file:**
```typescript
// src/app/my-page/page.tsx
"use client";

import { AppShell } from "@/components/layout/app-shell";

export default function MyPage() {
  return (
    <AppShell title="My Page">
      <div>Content here</div>
    </AppShell>
  );
}
```

2. **Add to navigation:**
```typescript
// src/components/layout/app-shell.tsx
const BASE_NAV = {
  instructor: [
    { href: "/my-page", label: "My Page", icon: Icon },
  ],
};
```

### Adding a New API Endpoint

1. **Apps Script (backend):**
```javascript
// apps-script/main.gs
case "myNewAction":
  return respond(requireAuth(token, "instructor", () => myNewFunction(payload)));

function myNewFunction(payload) {
  const { param } = payload;
  // Your logic here
  return { success: true, data: result };
}
```

2. **Frontend API Client:**
```typescript
// src/lib/api.ts
export async function callMyNewAction(token: string, param: string) {
  return fetcher('/api/gas', {
    method: 'POST',
    body: JSON.stringify({ action: 'myNewAction', token, param }),
  });
}
```

### Adding a New Component

```typescript
// src/components/ui/my-component.tsx
import { cn } from "@/lib/utils";

interface MyComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function MyComponent({ className, children }: MyComponentProps) {
  return (
    <div className={cn("base-classes", className)}>
      {children}
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

**1. Port 3000 already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
PORT=3001 npm run dev
```

**2. Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**3. TypeScript errors:**
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**4. Build errors:**
```bash
# Check ESLint
npm run lint

# Fix auto-fixable issues
npx eslint . --fix
```

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [SWR Docs](https://swr.vercel.app/)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Postman](https://www.postman.com/) - API testing

---

## Contact

- **GitHub Issues:** [Create Issue](https://github.com/Hakuma17/WTHFitnessApp/issues)
- **Email:** support@wth-fitness.app

---

**Happy Coding! 🚀**

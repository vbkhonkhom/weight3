import {
  type ApiResponse,
  type BodyMeasurementPhase,
  type BodyMeasurementResponse,
  type BodyMeasurementValueMap,
  type BodyMeasurements,
  type ClassStudentsResponse,
  type InstructorDashboardPayload,
  type ChangePasswordPayload,
  type ChangePasswordResponse,
  type ImportStudentPayload,
  type ImportStudentsRequest,
  type ImportStudentsResponse,
  type RequestPasswordResetPayload,
  type RequestPasswordResetResponse,
  type ResetPasswordPayload,
  type ResetPasswordResponse,
  type SessionPayload,
  type StudentDashboardPayload,
  type StandardPayload,
  type StandardRow,
  type StandardAudience,
  type TestResult,
  type TestType,
  type User,
} from "./types";
import { clearSession } from "./auth";

// Global handler for token expiry
let tokenExpiredHandler: (() => void) | null = null;

export function setTokenExpiredHandler(handler: () => void) {
  tokenExpiredHandler = handler;
}

export function clearTokenExpiredHandler() {
  tokenExpiredHandler = null;
}

const BASE_URL = (process.env.NEXT_PUBLIC_GAS_BASE_URL ?? "").trim();
const API_KEY = process.env.NEXT_PUBLIC_GAS_API_KEY ?? "";

interface FetchArgs {
  action: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  token?: string;
  query?: Record<string, string | number | undefined>;
}

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

const withAction = (action: string) => {
  const params = new URLSearchParams();
  params.set("action", action);
  return params;
};

async function callApi<T>(args: FetchArgs): Promise<T> {
  const { action, method = "GET", body, token, query } = args;

  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_GAS_BASE_URL is not configured");
  }

  const params = withAction(action);
  if (API_KEY) params.set("key", API_KEY);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
  }

  if (token && method === "GET") {
    params.set("token", token);
  }

  const url = `/api/gas?${params.toString()}`;

  // ส่ง token + body เฉพาะ POST
  const requestBody =
    method === "POST"
      ? {
          ...body,
          ...(token ? { token } : {}),
        }
      : undefined;

  // หลีกเลี่ยง CORS preflight: GET ไม่ใส่ header เลย, POST ใช้ text/plain
  const headers: Record<string, string> = {};
  if (method === "POST") {
    headers["Content-Type"] = "text/plain;charset=utf-8";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: requestBody ? JSON.stringify(requestBody) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    const bodyText = await res.text();

    let message = "ไม่สามารถเรียกใช้งานบริการได้ กรุณาลองใหม่อีกครั้ง";

    if (res.status === 429) {
      message =
        "ระบบ Google Sheets ถูกจำกัดการใช้งานชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่";
    } else if (res.status === 401 || res.status === 403) {
      message = "หมดเวลาการเข้าสู่ระบบหรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่";
    } else if (res.status >= 500) {
      message = "บริการภายนอกไม่ตอบสนอง กรุณาลองใหม่อีกครั้งภายหลัง";
    } else if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(bodyText) as { error?: string; message?: string };
        message = parsed.error || parsed.message || message;
      } catch {
        // Ignore JSON parse errors and fall back to the default handling below.
      }
    } else if (bodyText) {
      const trimmed = bodyText.trim();
      if (trimmed && !trimmed.startsWith("<")) {
        message = trimmed.length > 300 ? `${trimmed.slice(0, 297)}...` : trimmed;
      }
    }

    // จัดการกรณี token หมดอายุ/ไม่มีสิทธิ์: แสดง dialog และ clear session
    if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
      try {
        clearSession();
        // ใช้ global handler แทน redirect ทันที
        if (tokenExpiredHandler) {
          tokenExpiredHandler();
        } else {
          // Fallback: redirect ถ้าไม่มี handler
          const currentPath = window.location.pathname;
          if (currentPath !== "/" && !sessionStorage.getItem("wth.auth.redirecting")) {
            sessionStorage.setItem("wth.auth.redirecting", "1");
            window.location.assign("/");
            setTimeout(() => {
              try {
                sessionStorage.removeItem("wth.auth.redirecting");
              } catch {}
            }, 100);
          }
        }
      } catch {
        // no-op
      }
    }
    throw new ApiError(message, res.status);
  }

  // ตรวจสอบว่า response เป็น JSON จริงหรือไม่
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const bodyText = await res.text();
    
    // ถ้าเป็น HTML (เช่น Google login page)
    if (bodyText.trim().startsWith("<!DOCTYPE") || bodyText.trim().startsWith("<html")) {
      // Token หมดอายุหรือ session ไม่ถูกต้อง
      if (typeof window !== "undefined") {
        try {
          clearSession();
          if (tokenExpiredHandler) {
            tokenExpiredHandler();
          } else {
            const currentPath = window.location.pathname;
            if (currentPath !== "/" && !sessionStorage.getItem("wth.auth.redirecting")) {
              sessionStorage.setItem("wth.auth.redirecting", "1");
              window.location.assign("/");
              setTimeout(() => {
                try {
                  sessionStorage.removeItem("wth.auth.redirecting");
                } catch {}
              }, 100);
            }
          }
        } catch {
          // no-op
        }
      }
      throw new ApiError("หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่", 401);
    }
    
    throw new ApiError("เซิร์ฟเวอร์ตอบกลับข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
  }

  let rawPayload: ApiResponse<T> & Record<string, unknown>;
  
  try {
    rawPayload = (await res.json()) as ApiResponse<T> & Record<string, unknown>;
  } catch (jsonError) {
    console.error("JSON parse error:", jsonError);
    throw new ApiError("ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
  }

  if (!rawPayload.success) {
    throw new ApiError(rawPayload.error ?? "Unknown API error");
  }

  if (rawPayload.data !== undefined && rawPayload.data !== null) {
    return rawPayload.data;
  }

  const fallbackKeys = Object.keys(rawPayload).filter((key) =>
    key !== "success" && key !== "data" && key !== "error"
  );

  if (fallbackKeys.length > 0) {
    const fallback: Record<string, unknown> = {};
    fallbackKeys.forEach((key) => {
      fallback[key] = rawPayload[key];
    });
    return fallback as T;
  }

  return undefined as T;
}

export const api = {
  async ping() {
    return callApi<{ message: string }>({ action: "ping" });
  },

  async sendOTP(email: string) {
    return callApi<{ message: string }>({
      action: "sendOTP",
      method: "POST",
      body: { email },
    });
  },

  async verifyOTP(email: string, otp: string) {
    return callApi<{ message: string }>({
      action: "verifyOTP",
      method: "POST",
      body: { email, otp },
    });
  },

  async register(input: {
    role: User["role"];
    fullName: string;
    email: string;
    password: string;
    gender: User["gender"];
    birthdate: string;
    age?: number;
    classCode?: string;
    otpVerified?: boolean;
  }) {
    const genderThai = input.gender === "male" ? "ชาย" : "หญิง";
    return callApi<SessionPayload>({
      action: "register",
      method: "POST",
      body: {
        ...input,
        gender: genderThai,
      },
    });
  },

  async login(input: { email: string; password: string }) {
    return callApi<SessionPayload>({
      action: "login",
      method: "POST",
      body: input,
    });
  },

  async getStudentDashboard(token: string) {
    return callApi<StudentDashboardPayload>({
      action: "studentDashboard",
      token,
    });
  },

  async getInstructorDashboard(token: string, classId?: string) {
    return callApi<InstructorDashboardPayload>({
      action: "instructorDashboard",
      token,
      query: classId ? { classId } : undefined,
    });
  },

  async createClass(token: string, className: string) {
    return callApi<{ classId: string; classCode: string; rosterSheetName?: string }>({
      action: "createClass",
      method: "POST",
      token,
      body: { className },
    });
  },

  async joinClass(token: string, classCode: string) {
    return callApi<{ classId: string }>({
      action: "joinClass",
      method: "POST",
      token,
      body: { classCode },
    });
  },

  async recordTest(
    token: string,
    payload: {
      testType: TestType;
      value: number;
      weightKg?: number;
      heightM?: number;
      notes?: string;
    },
  ) {
    return callApi<{ result: TestResult; results: TestResult[] }>({
      action: "recordTest",
      method: "POST",
      token,
      body: payload,
    });
  },

  async getBodyMeasurements(token: string) {
    return callApi<BodyMeasurementResponse>({
      action: "getBodyMeasurements",
      token,
    });
  },

  async getUserBodyMeasurements(token: string, userId: string) {
    return callApi<BodyMeasurementResponse>({
      action: "getUserBodyMeasurements",
      token,
      query: { userId },
    });
  },

  async getTestResults(token: string) {
    return callApi<TestResult[]>({
      action: "getTestResults", 
      token,
    });
  },

  async recordBodyMeasurements(
    token: string,
    phase: BodyMeasurementPhase,
    measurements: BodyMeasurementValueMap,
  ) {
    return callApi<BodyMeasurementResponse>({
      action: "recordBodyMeasurements",
      method: "POST",
      token,
      body: { phase, measurements },
    });
  },

  async getClassStudents(token: string, classId: string) {
    return callApi<ClassStudentsResponse>({
      action: "getClassStudents",
      token,
      query: { classId },
    });
  },

  async createStandard(token: string, standardData: StandardPayload) {
    return callApi<{ id: string; success: boolean }>({
      action: "createStandard",
      method: "POST",
      token,
      body: standardData as unknown as Record<string, unknown>,
    });
  },

  async updateStandard(token: string, standardData: StandardPayload & { id: string }) {
    return callApi<{ success: boolean }>({
      action: "updateStandard",
      method: "POST",
      token,
      body: standardData as unknown as Record<string, unknown>,
    });
  },

  async deleteStandard(token: string, standardId: string) {
    return callApi<{ success: boolean }>({
      action: "deleteStandard",
      method: "POST",
      token,
      query: { standardId },
    });
  },

  async importStudents(token: string, data: ImportStudentsRequest) {
    return callApi<ImportStudentsResponse>({
      action: "importStudents",
      method: "POST",
      token,
      body: data as unknown as Record<string, unknown>,
    });
  },

  async changePassword(token: string, data: ChangePasswordPayload) {
    return callApi<ChangePasswordResponse>({
      action: "changePassword",
      method: "POST",
      token,
      body: { ...data },
    });
  },

  // Password Reset
  async requestPasswordReset(data: RequestPasswordResetPayload) {
    return callApi<RequestPasswordResetResponse>({
      action: "requestPasswordReset",
      method: "POST",
      body: { ...data },
    });
  },

  async resetPassword(data: ResetPasswordPayload) {
    return callApi<ResetPasswordResponse>({
      action: "resetPassword",
      method: "POST",
      body: { ...data },
    });
  },

  async changeUserRole(token: string, data: {
    userId: string;
    newRole: "student" | "athlete";
  }) {
    return callApi<{ message: string; user: User }>({
      action: "changeUserRole",
      method: "POST",
      token,
      body: data,
    });
  },

  async createStudentRosterSheet(
    token: string,
    data: { classId: string; className: string; classCode: string },
  ) {
    return callApi<{
      spreadsheetId: string;
      spreadsheetUrl: string;
      name: string;
    }>({
      action: "createRosterTemplate",
      method: "POST",
      token,
      body: data,
    });
  },

  async listStandards(token?: string, audience?: StandardAudience) {
    return callApi<StandardRow[]>({
      action: "standards",
      token,
      query: audience ? { audience } : undefined,
    });
  },

  // Helper method for easier API calls
  async post<T>(action: string, body: Record<string, unknown>, token?: string): Promise<T> {
    return callApi<T>({
      action,
      method: "POST",
      body,
      token,
    });
  },

  async get<T>(action: string, query?: Record<string, string | number>, token?: string): Promise<T> {
    return callApi<T>({
      action,
      method: "GET",
      query,
      token,
    });
  },

  // Student Management
  async updateStudent(token: string, data: {
    studentId: string;
    fullName?: string;
    email?: string;
    gender?: "male" | "female";
    birthdate?: string;
  }) {
    return callApi<{ message: string }>({
      action: "updateStudent",
      method: "POST",
      token,
      body: data,
    });
  },

  async deleteStudent(token: string, studentId: string) {
    return callApi<{ message: string }>({
      action: "deleteStudent",
      method: "POST",
      token,
      body: { studentId },
    });
  },

  async addStudent(token: string, data: {
    classId: string;
    fullName: string;
    email: string;
    gender: "male" | "female";
    birthdate: string;
  }) {
    return callApi<{ message: string; studentId: string; tempPassword: string }>({
      action: "addStudent",
      method: "POST",
      token,
      body: data,
    });
  },

  // Test Result Management
  async deleteTestResult(token: string, resultId: string) {
    return callApi<{ message: string }>({
      action: "deleteTestResult",
      method: "POST",
      token,
      body: { resultId },
    });
  },

  async updateTestResult(token: string, data: {
    resultId: string;
    value?: number;
    derivedValue?: number;
    evaluation?: string;
    notes?: string;
  }) {
    return callApi<{ message: string }>({
      action: "updateTestResult",
      method: "POST",
      token,
      body: data,
    });
  },

  // Class Management
  async deleteClass(token: string, classId: string) {
    return callApi<{ message: string }>({
      action: "deleteClass",
      method: "POST",
      token,
      body: { classId },
    });
  },

  // Data Archive & Cleanup (เมื่อชีทเต็ม)
  async archiveOldData(token: string, options?: {
    beforeDate?: string; // วันที่ก่อนหน้านี้จะถูก archive
    sheetNames?: string[]; // ชื่อชีทที่ต้องการ archive เช่น ["TestResults", "BodyMeasurements"]
  }) {
    return callApi<{ 
      success: boolean; 
      archivedCount: number;
      archiveSheetName: string;
      message: string;
    }>({
      action: "archiveOldData",
      method: "POST",
      token,
      body: options || {},
    });
  },

  async cleanupDuplicates(token: string, sheetName: string) {
    return callApi<{ 
      success: boolean; 
      removedCount: number;
      message: string;
    }>({
      action: "cleanupDuplicates",
      method: "POST",
      token,
      body: { sheetName },
    });
  },

  async getSheetStats(token: string) {
    return callApi<{
      sheets: Array<{
        name: string;
        rowCount: number;
        columnCount: number;
        cellCount: number;
        percentFull: number;
      }>;
      totalCells: number;
      maxCells: number;
      warningThreshold: boolean; // true ถ้าใกล้เต็ม (>80%)
    }>({
      action: "getSheetStats",
      token,
    });
  },

  async deleteOldRecords(token: string, options: {
    sheetName: string;
    beforeDate: string; // ISO date string
    keepLatestPerUser?: number; // เก็บผลล่าสุดต่อ user กี่รายการ
  }) {
    return callApi<{ 
      success: boolean; 
      deletedCount: number;
      message: string;
    }>({
      action: "deleteOldRecords",
      method: "POST",
      token,
      body: options,
    });
  },
};

/**
 * Mock helpers allow local development without a live Apps Script backend.
 * The mocks are intentionally lightweight and only cover the UI happy paths.
 */
const mockState = {
  user: null as SessionPayload["user"] | null,
  token: "mock-token",
  results: [] as TestResult[],
  historyByTest: {} as Record<TestType, TestResult[]>,
  standards: [] as StandardRow[],
  bodyMeasurements: { before: null, after: null } as BodyMeasurementResponse,
  seededEmail: undefined as string | undefined,
};

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function createMockResult(
  userId: string,
  suffix: string,
  testType: TestType,
  daysAgo: number,
  value: number,
  derivedValue: number | undefined,
  evaluation: string,
  notes?: string,
): TestResult {
  return {
    id: `${testType}_${suffix}`,
    userId,
    testType,
    recordedAt: daysAgoIso(daysAgo),
    value,
    derivedValue,
    evaluation,
    notes,
  };
}

function seedMockDataForUser(user: User) {
  if (mockState.seededEmail === user.email) {
    return;
  }

  const history: Record<TestType, TestResult[]> = {
    bmi: [
      createMockResult(user.id, "after", "bmi", 5, 21.4, 21.4, "สมส่วน", "หลังเรียน"),
      createMockResult(user.id, "before", "bmi", 45, 23.1, 23.1, "สมส่วน", "ก่อนเรียน"),
    ],
    sit_and_reach: [
      createMockResult(user.id, "after", "sit_and_reach", 6, 30, 30, "ดีมาก", "หลังเรียน"),
      createMockResult(user.id, "before", "sit_and_reach", 46, 24, 24, "ดี", "ก่อนเรียน"),
    ],
    hand_grip: [
      createMockResult(user.id, "after", "hand_grip", 7, 36, 0.65, "ดี", "หลังเรียน"),
      createMockResult(user.id, "before", "hand_grip", 47, 32, 0.56, "ปานกลาง", "ก่อนเรียน"),
    ],
    chair_stand: [
      createMockResult(user.id, "after", "chair_stand", 8, 44, undefined, "ดีมาก", "หลังเรียน"),
      createMockResult(user.id, "before", "chair_stand", 48, 38, undefined, "ดี", "ก่อนเรียน"),
    ],
    step_up: [
      createMockResult(user.id, "after", "step_up", 9, 88, undefined, "ดี", "หลังเรียน"),
      createMockResult(user.id, "before", "step_up", 49, 72, undefined, "ปานกลาง", "ก่อนเรียน"),
    ],
  };

  mockState.historyByTest = history;
  mockState.results = Object.values(history)
    .map((values) => values[0])
    .sort(
      (a, b) =>
        new Date(b.recordedAt ?? "").getTime() -
        new Date(a.recordedAt ?? "").getTime(),
    );

  mockState.standards = [
    {
      id: "std_bmi_fit",
      testType: "bmi",
      gender: "male",
      ageMin: 15,
      ageMax: 20,
      category: "สมส่วน",
      minValue: 18.5,
      maxValue: 23,
      comparison: "range",
    },
    {
      id: "std_bmi_over",
      testType: "bmi",
      gender: "male",
      ageMin: 15,
      ageMax: 20,
      category: "ท้วม",
      minValue: 23,
      maxValue: 27,
      comparison: "range",
    },
    {
      id: "std_sit_reach_good",
      testType: "sit_and_reach",
      gender: "male",
      ageMin: 15,
      ageMax: 20,
      category: "ดีมาก",
      minValue: 28,
      maxValue: null,
      comparison: "range",
    },
    {
      id: "std_sit_reach_mid",
      testType: "sit_and_reach",
      gender: "male",
      ageMin: 15,
      ageMax: 20,
      category: "ปานกลาง",
      minValue: 20,
      maxValue: 27.9,
      comparison: "range",
    },
    {
      id: "std_hand_grip_good",
      testType: "hand_grip",
      gender: "male",
      ageMin: 15,
      ageMax: 20,
      category: "ดี",
      minValue: 0.6,
      maxValue: null,
      comparison: "range",
    },
    {
      id: "std_hand_grip_mid",
      testType: "hand_grip",
      gender: "male",
      ageMin: 15,
      ageMax: 20,
      category: "ปานกลาง",
      minValue: 0.5,
      maxValue: 0.59,
      comparison: "range",
    },
    {
      id: "std_chair_stand_good",
      testType: "chair_stand",
      gender: "male",
      ageMin: 15,
      ageMax: 20,
      category: "ดี",
      minValue: 40,
      maxValue: null,
      comparison: "range",
    },
    {
      id: "std_step_up_good",
      testType: "step_up",
      gender: "male",
      ageMin: 15,
      ageMax: 20,
      category: "ดี",
      minValue: 80,
      maxValue: null,
      comparison: "range",
    },
  ];

  // Athlete-specific stricter sample standards
  mockState.standards.push(
    {
      id: "ath_bmi_excellent",
      testType: "bmi",
      gender: "male",
      ageMin: 15,
      ageMax: 25,
      category: "ดีเยี่ยม",
      minValue: 20,
      maxValue: 23,
      comparison: "range",
      audience: "athlete",
    },
    {
      id: "ath_bmi_good",
      testType: "bmi",
      gender: "male",
      ageMin: 15,
      ageMax: 25,
      category: "ดี",
      minValue: 23.1,
      maxValue: 25,
      comparison: "range",
      audience: "athlete",
    },
    {
      id: "ath_sit_reach_ex",
      testType: "sit_and_reach",
      gender: "male",
      ageMin: 15,
      ageMax: 25,
      category: "ดีเยี่ยม",
      minValue: 25,
      maxValue: null,
      comparison: "threshold",
      audience: "athlete",
    },
  );

  mockState.bodyMeasurements = {
    before: {
      phase: "before",
      recordedAt: daysAgoIso(50),
      muscularStrength: 62,
      muscularEndurance: 28,
      flexibility: 24,
      bmi: 23,
      cardioRespiratoryEndurance: 70,
      weight: 68,
      height: 172,
      pulse: 78,
      neck: 35,
      shoulderLeft: 47,
      shoulderRight: 48,
      upperArmLeft: 26,
      upperArmRight: 26,
      wristLeft: 15,
      wristRight: 15,
      chest: 92,
      abdomen: 84,
      waist: 82,
      hip: 96,
      thighLeft: 55,
      thighRight: 55,
      calfLeft: 37,
      calfRight: 37,
      ankleLeft: 24,
      ankleRight: 24,
      notes: "บันทึกก่อนเริ่มโปรแกรม",
    },
    after: {
      phase: "after",
      recordedAt: daysAgoIso(6),
      muscularStrength: 68,
      muscularEndurance: 34,
      flexibility: 30,
      bmi: 21.4,
      cardioRespiratoryEndurance: 78,
      weight: 65,
      height: 172,
      pulse: 72,
      neck: 34.5,
      shoulderLeft: 48,
      shoulderRight: 49,
      upperArmLeft: 27,
      upperArmRight: 27.5,
      wristLeft: 15.2,
      wristRight: 15.2,
      chest: 94,
      abdomen: 81,
      waist: 79,
      hip: 94,
      thighLeft: 56,
      thighRight: 56,
      calfLeft: 38,
      calfRight: 38,
      ankleLeft: 23.5,
      ankleRight: 23.5,
      notes: "อัปเดตหลังเรียนครบ 8 สัปดาห์",
    },
  };

  mockState.seededEmail = user.email;
}

function evaluateAgainstStandards(testType: TestType, value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "ไม่มีเกณฑ์อ้างอิง";
  }
  const audience: StandardAudience = mockState.user?.role === "athlete" ? "athlete" : "general";
  let candidates = mockState.standards.filter(
    (row) => row.testType === testType && (row.audience ?? "general") === audience,
  );
  if (candidates.length === 0) {
    // Fallback to general if no audience-specific rows
    candidates = mockState.standards.filter(
      (row) => row.testType === testType && (row.audience ?? "general") === "general",
    );
  }
  for (const standard of candidates) {
    const minOk = standard.minValue == null || value >= standard.minValue;
    const maxOk = standard.maxValue == null || value <= standard.maxValue;
    if (standard.comparison === "range" && minOk && maxOk) {
      return standard.category;
    }
    if (standard.comparison === "threshold" && minOk) {
      return standard.category;
    }
  }
  return "ไม่มีเกณฑ์อ้างอิง";
}

const mockCall = async <T,>(args: FetchArgs): Promise<T> => {
  const { action, body, query } = args;

  await new Promise((resolve) => setTimeout(resolve, 250));

  switch (action) {
    case "register":
    case "login": {
      const user: User = {
        id: "user_mock",
        role: (body?.role ?? "student") as User["role"],
        fullName: (body?.fullName as string) ?? (mockState.user?.fullName ?? "Mocked User"),
        email: (body?.email as string) ?? "mock@example.com",
        gender: (body?.gender as User["gender"]) ?? "female",
        birthdate: "1995-01-01",
        classId: "class_mock",
        className: "Mocked Class",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockState.user = user;
      seedMockDataForUser(user);
      return { token: mockState.token, user } as T;
    }
    case "studentDashboard": {
      return {
        results: mockState.results,
        standards: mockState.standards,
        historyByTest: mockState.historyByTest,
      } as T;
    }
    case "recordTest": {
      const testType = body?.testType as TestType;
      const rawValue = Number(body?.value ?? 0);
      const derivedValue =
        typeof body?.derivedValue === "number"
          ? (body?.derivedValue as number)
          : (body?.value as number | undefined);
      const evaluation = evaluateAgainstStandards(testType, derivedValue ?? rawValue);
      const newResult: TestResult = {
        id: `tr_${mockState.results.length + 1}`,
        userId: mockState.user?.id ?? "user_mock",
        testType,
        recordedAt: new Date().toISOString(),
        value: rawValue,
        derivedValue: derivedValue != null ? Number(derivedValue) : undefined,
        evaluation,
        notes: (body?.notes as string) ?? "",
      };
      const existingHistory = mockState.historyByTest[testType] ?? [];
      mockState.historyByTest[testType] = [newResult, ...existingHistory];
      mockState.results = [
        newResult,
        ...mockState.results.filter((result) => result.testType !== testType),
      ];
      return { result: newResult, results: mockState.results } as T;
    }
    case "getTestResults": {
      return mockState.results as T;
    }
    case "getBodyMeasurements": {
      return mockState.bodyMeasurements as T;
    }
    case "recordBodyMeasurements": {
      const phase = (body?.phase as BodyMeasurementPhase) ?? "before";
      const measurements = (body?.measurements || {}) as BodyMeasurementValueMap;
      const entry: BodyMeasurements = {
        phase,
        recordedAt: new Date().toISOString(),
        ...measurements,
      };
      mockState.bodyMeasurements = {
        ...mockState.bodyMeasurements,
        [phase]: entry,
      };
      return mockState.bodyMeasurements as T;
    }
    case "instructorDashboard": {
      const classId = args.query?.classId as string | undefined;
      const payload = {
        classes: [
          {
            id: "class_mock",
            className: "ชั้นเรียนทดลอง",
            classCode: "ABC123",
            studentCount: 12,
            latestAverages: {
              bmi: 22.5,
              chair_stand: 44,
            },
          },
        ],
      } as InstructorDashboardPayload;

      if (classId === "class_mock") {
        payload.roster = [
          {
            id: "student_1",
            role: "student",
            fullName: "นักเรียนตัวอย่าง",
            email: "student@example.com",
            gender: "female",
            birthdate: "1997-06-01",
            classId: "class_mock",
            className: "ชั้นเรียนทดลอง",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            latestResults: {
              bmi: {
                id: "tr_student_1_bmi",
                userId: "student_1",
                testType: "bmi",
                recordedAt: new Date().toISOString(),
                value: 21.5,
                derivedValue: 21.5,
                evaluation: "Good",
              },
            },
          },
        ];
      }

      return payload as T;
    }
    case "getClassStudents": {
      return {
        students: [
          {
            id: "student_mock",
            fullName: "นักเรียนทดลอง",
            email: "student@example.com",
            age: 20,
            gender: "female",
            latestBMI: 21.4,
            testResults: {
              bmi: 21.4,
              bodyFat: 18.2,
              muscleMass: 36.5,
              overallScore: 84,
              lastTestDate: new Date().toISOString().slice(0, 10),
            },
            performanceLevel: "good",
          },
        ],
      } as T;
    }
    case "createClass": {
      return {
        classId: "class_mock",
        classCode: "CODE12",
      } as T;
    }
    case "standards": {
      const audienceParam = (query?.audience as string | undefined) as StandardAudience | undefined;
      if (audienceParam) {
        return mockState.standards.filter((s) => (s.audience ?? "general") === audienceParam) as T;
      }
      return mockState.standards as T;
    }
    case "createStandard": {
      return { id: "standard_mock", success: true } as T;
    }
    case "updateStandard": {
      return { success: true } as T;
    }
    case "deleteStandard": {
      return { success: true } as T;
    }
    case "importStudents": {
      const students = (body?.students as ImportStudentPayload[]) ?? [];
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";
      const generatePassword = () => {
        let output = "";
        for (let i = 0; i < 6; i += 1) {
          output += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return output;
      };

      const credentials = students.map((student) => {
        const studentId = String(student?.studentId ?? "").trim() || `student${Math.random().toString(36).slice(2, 8)}`;
        const email =
          (student?.email && student.email.trim() !== "")
            ? student.email.trim()
            : `${studentId}@student.wth.ac.th`;
        return {
          studentId,
          email,
          password: generatePassword(),
        };
      });

      return {
        success: true,
        imported: students.length,
        total: students.length,
        credentials,
      } as T;
    }
    case "changePassword": {
      return {
        success: true,
        message: "อัปเดตรหัสผ่าน (mock) แล้ว",
      } as T;
    }
    case "createRosterTemplate": {
      return {
        spreadsheetId: "mock-spreadsheet-id",
        spreadsheetUrl: "https://docs.google.com/spreadsheets/d/mock-spreadsheet-id",
        name: "แบบฟอร์มรวบรวมนักศึกษา (Mock)",
      } as T;
    }
    case "requestPasswordReset": {
      // Simulate rate limiting
      const email = (body as any)?.email;
      if (email === "blocked@example.com") {
        throw new Error("ส่งคำขอบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่");
      }
      
      return {
        success: true,
        message:
          "หากอีเมลนี้มีในระบบ เราได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบและนำรหัส 6 หลักมากรอกเพื่อตั้งรหัสผ่านใหม่",
      } as T;
    }
    case "resetPassword": {
      const otp = (body as any)?.otp as string | undefined;
      const email = (body as any)?.email as string | undefined;
      const newPassword = (body as any)?.newPassword as string | undefined;

      if (!otp || !email || !newPassword) {
        throw new Error("ข้อมูลไม่ครบถ้วน กรุณากรอกรหัส OTP, อีเมล และรหัสผ่านใหม่");
      }

      if (!/^\d{6}$/.test(otp)) {
        throw new Error("รหัส OTP ต้องเป็นตัวเลข 6 หลัก");
      }

      if (newPassword.length < 6) {
        throw new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      }

      // Mock success
      return {
        success: true,
        message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
      } as T;
    }
    default:
      throw new ApiError(`Mock for action "${action}" not implemented`);
  }
};

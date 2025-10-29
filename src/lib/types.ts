export type Role = "student" | "instructor" | "athlete";

export type TestType =
  | "bmi"
  | "sit_and_reach"
  | "hand_grip"
  | "chair_stand"
  | "step_up";

export type StandardAudience = "general" | "athlete"; // general = นักเรียนทั่วไป, athlete = นักกีฬา

export type BodyMeasurementPhase = "before" | "after";

export interface BodyMeasurements {
  phase: BodyMeasurementPhase;
  recordedAt: string | null;
  muscularStrength?: number | null;
  muscularEndurance?: number | null;
  flexibility?: number | null;
  bmi?: number | null;
  cardioRespiratoryEndurance?: number | null;
  weight?: number | null;
  height?: number | null;
  pulse?: number | null;
  neck?: number | null;
  shoulderLeft?: number | null;
  shoulderRight?: number | null;
  upperArmLeft?: number | null;
  upperArmRight?: number | null;
  wristLeft?: number | null;
  wristRight?: number | null;
  chest?: number | null;
  abdomen?: number | null;
  waist?: number | null;
  hip?: number | null;
  thighLeft?: number | null;
  thighRight?: number | null;
  calfLeft?: number | null;
  calfRight?: number | null;
  ankleLeft?: number | null;
  ankleRight?: number | null;
  notes?: string | null;
}

export type BodyMeasurementValueMap = Omit<BodyMeasurements, "phase" | "recordedAt">;

export interface BodyMeasurementResponse {
  before: BodyMeasurements | null;
  after: BodyMeasurements | null;
}

export interface FitnessMetric {
  value: number | null;
  evaluation: string | null;
}

type BodySizeField =
  | "weight"
  | "height"
  | "pulse"
  | "neck"
  | "shoulderLeft"
  | "shoulderRight"
  | "upperArmLeft"
  | "upperArmRight"
  | "wristLeft"
  | "wristRight"
  | "chest"
  | "abdomen"
  | "waist"
  | "hip"
  | "thighLeft"
  | "thighRight"
  | "calfLeft"
  | "calfRight"
  | "ankleLeft"
  | "ankleRight";

export interface ClassStudentBodyMeasurements
  extends Pick<BodyMeasurements, BodySizeField> {
  recordedAt: string | null;
  phase: BodyMeasurementPhase | null;
}

export type EvaluationCategory = string;

export interface User {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  gender: "male" | "female";
  birthdate: string; // ISO string yyyy-mm-dd
  classId?: string;
  className?: string;
  sportType?: string; // สำหรับนักกีฬา
  position?: string;  // สำหรับนักกีฬา
  createdAt: string;
  updatedAt: string;
}

export interface ClassSummary {
  id: string;
  className: string;
  classCode: string;
  studentCount: number;
  latestAverages: Partial<Record<TestType, number>>;
}

export type PerformanceLevel =
  | "excellent"
  | "good"
  | "average"
  | "needs_improvement";

export interface ClassStudentResults {
  bmi: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  overallScore: number;
  lastTestDate: string | null;
}

export interface ClassStudent {
  id: string;
  fullName: string;
  email: string;
  age: number;
  gender: "male" | "female";
  role?: Role; // Optional for backwards compatibility
  latestBMI: number | null;
  testResults: ClassStudentResults | null;
  performanceLevel: PerformanceLevel;
  fitnessMetrics?: {
    muscularStrength?: FitnessMetric;
    muscularEndurance?: FitnessMetric;
    flexibility?: FitnessMetric;
    bodyFat?: FitnessMetric;
    cardioRespiratoryEndurance?: FitnessMetric;
  };
  bodyMeasurements?: ClassStudentBodyMeasurements | null;
}

export interface ClassStudentsResponse {
  students: ClassStudent[];
}

export interface TestResult {
  id: string;
  userId: string;
  testType: TestType;
  recordedAt: string;
  value: number;
  derivedValue?: number;
  evaluation: EvaluationCategory;
  notes?: string;
}

export interface StandardRow {
  id: string;
  testType: TestType;
  gender: "male" | "female";
  ageMin: number;
  ageMax: number;
  category: EvaluationCategory;
  minValue: number | null;
  maxValue: number | null;
  comparison: "range" | "threshold";
  audience?: StandardAudience; // ถ้าไม่ระบุให้ถือเป็นทั่วไป (general)
}

export interface StandardPayload {
  id?: string;
  testType: TestType;
  gender: "male" | "female";
  ageMin: number;
  ageMax: number;
  category: EvaluationCategory;
  minValue: number | null;
  maxValue: number | null;
  comparison: "range" | "threshold";
  audience?: StandardAudience;
}

export interface ImportStudentPayload {
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  gender?: "male" | "female";
  birthdate?: string;
}

export interface ImportStudentsRequest {
  classId: string;
  students: ImportStudentPayload[];
}

export interface ImportedStudentCredential {
  studentId: string;
  email: string;
  password: string;
}

export interface ImportStudentsResponse {
  success: boolean;
  imported: number;
  total?: number;
  message?: string;
  errors?: string[];
  credentials?: ImportedStudentCredential[];
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}

// Password Reset Types
export interface RequestPasswordResetPayload {
  email: string;
}

export interface RequestPasswordResetResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordPayload {
  otp: string;
  email: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface SessionPayload {
  token: string;
  user: User;
}

export interface StudentDashboardPayload {
  results: TestResult[];
  standards: StandardRow[];
  historyByTest: Record<TestType, TestResult[]>;
}

export interface InstructorDashboardPayload {
  classes: ClassSummary[];
  roster?: Array<User & { latestResults: Partial<Record<TestType, TestResult>> }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

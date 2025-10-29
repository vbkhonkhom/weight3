import type { EvaluationCategory, TestType } from "./types";

export const TEST_LABELS: Record<TestType, string> = {
  bmi: "ดัชนีมวลกาย (BMI)",
  sit_and_reach: "นั่งงอตัวไปข้างหน้า",
  hand_grip: "แรงบีบมือ",
  chair_stand: "ยืน-นั่ง บนเก้าอี้ 60 วินาที",
  step_up: "ยืนยกเข่าขึ้นลง 3 นาที",
};

export const TEST_DESCRIPTIONS: Record<TestType, string> = {
  bmi:
    "กรอกน้ำหนักและส่วนสูง ระบบจะคำนวณค่าดัชนีมวลกายอัตโนมัติและเทียบเกณฑ์มาตรฐานของกรมพลศึกษา",
  sit_and_reach:
    "บันทึกระยะทางที่วัดได้จากการนั่งงอตัวไปข้างหน้า หน่วยเป็นเซนติเมตร",
  hand_grip:
    "กรอกแรงบีบมือ (กิโลกรัม) ระบบจะหารด้วยน้ำหนักตัวเพื่อเปรียบเทียบมาตรฐาน",
  chair_stand:
    "กรอกจำนวนครั้งที่สามารถยืน-นั่งบนเก้าอี้ภายใน 60 วินาที",
  step_up:
    "กรอกจำนวนครั้งที่ยืนยกเข่าขึ้นลงในเวลา 3 นาที โดยต้องแตะระดับที่กำหนด",
};

export const EVALUATION_ORDER: EvaluationCategory[] = [
  "ดีมาก",
  "ดี", 
  "ปานกลาง",
  "ต่ำ",
  "ต่ำมาก",
  "สมส่วน",
  "ผอม",
  "ท้วม",
  "อ้วน",
  "ผอมมาก",
];

export const STORAGE_KEYS = {
  SESSION: "wthFitness.session",
} as const;

export const GENDER_LABELS: Record<"male" | "female", string> = {
  male: "ชาย",
  female: "หญิง",
};

export const ROLE_LABELS: Record<"student" | "instructor" | "athlete", string> = {
  student: "นักเรียน",
  instructor: "ครูผู้สอน",
  athlete: "นักกีฬา",
};

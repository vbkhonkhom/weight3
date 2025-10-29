import type { StandardRow } from "@/lib/types";

/**
 * เกณฑ์มาตรฐานสำหรับนักกีฬา (Athlete Standards)
 * - เข้มงวดกว่านักเรียนทั่วไป 
 * - ค่าที่ต้องการสูงกว่า
 * - ใช้สำหรับนักกีฬาที่ต้องการพัฒนาสมรรถภาพในระดับสูง
 * 
 * Mock data - จะถูกแทนที่ด้วยเกณฑ์จริงจากกรมพลศึกษาหรือสมาคมกีฬา
 */

export const ATHLETE_STANDARDS: Omit<StandardRow, "id">[] = [
  // BMI สำหรับนักกีฬาชาย อายุ 15-25
  { testType: "bmi", gender: "male", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 20, maxValue: 23, comparison: "range" },
  { testType: "bmi", gender: "male", ageMin: 15, ageMax: 25, category: "ดี", minValue: 23.1, maxValue: 25, comparison: "range" },
  { testType: "bmi", gender: "male", ageMin: 15, ageMax: 25, category: "ควรปรับปรุง", minValue: 18.5, maxValue: 19.9, comparison: "range" },
  { testType: "bmi", gender: "male", ageMin: 15, ageMax: 25, category: "ควรปรับปรุง", minValue: 25.1, maxValue: 27, comparison: "range" },
  
  // BMI สำหรับนักกีฬาหญิง อายุ 15-25
  { testType: "bmi", gender: "female", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 19, maxValue: 22, comparison: "range" },
  { testType: "bmi", gender: "female", ageMin: 15, ageMax: 25, category: "ดี", minValue: 22.1, maxValue: 24, comparison: "range" },
  { testType: "bmi", gender: "female", ageMin: 15, ageMax: 25, category: "ควรปรับปรุง", minValue: 17, maxValue: 18.9, comparison: "range" },
  { testType: "bmi", gender: "female", ageMin: 15, ageMax: 25, category: "ควรปรับปรุง", minValue: 24.1, maxValue: 26, comparison: "range" },

  // ความยืดหยุ่น สำหรับนักกีฬาชาย
  { testType: "sit_and_reach", gender: "male", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 25, maxValue: null, comparison: "threshold" },
  { testType: "sit_and_reach", gender: "male", ageMin: 15, ageMax: 25, category: "ดี", minValue: 20, maxValue: 24.9, comparison: "range" },
  { testType: "sit_and_reach", gender: "male", ageMin: 15, ageMax: 25, category: "พอใช้", minValue: 15, maxValue: 19.9, comparison: "range" },
  { testType: "sit_and_reach", gender: "male", ageMin: 15, ageMax: 25, category: "ต้องปรับปรุง", minValue: null, maxValue: 14.9, comparison: "threshold" },

  // ความยืดหยุ่น สำหรับนักกีฬาหญิง
  { testType: "sit_and_reach", gender: "female", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 30, maxValue: null, comparison: "threshold" },
  { testType: "sit_and_reach", gender: "female", ageMin: 15, ageMax: 25, category: "ดี", minValue: 25, maxValue: 29.9, comparison: "range" },
  { testType: "sit_and_reach", gender: "female", ageMin: 15, ageMax: 25, category: "พอใช้", minValue: 20, maxValue: 24.9, comparison: "range" },
  { testType: "sit_and_reach", gender: "female", ageMin: 15, ageMax: 25, category: "ต้องปรับปรุง", minValue: null, maxValue: 19.9, comparison: "threshold" },

  // แรงบีบมือ สำหรับนักกีฬาชาย
  { testType: "hand_grip", gender: "male", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 0.65, maxValue: null, comparison: "threshold" },
  { testType: "hand_grip", gender: "male", ageMin: 15, ageMax: 25, category: "ดี", minValue: 0.55, maxValue: 0.64, comparison: "range" },
  { testType: "hand_grip", gender: "male", ageMin: 15, ageMax: 25, category: "พอใช้", minValue: 0.45, maxValue: 0.54, comparison: "range" },
  { testType: "hand_grip", gender: "male", ageMin: 15, ageMax: 25, category: "ต้องปรับปรุง", minValue: null, maxValue: 0.44, comparison: "threshold" },

  // แรงบีบมือ สำหรับนักกีฬาหญิง
  { testType: "hand_grip", gender: "female", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 0.50, maxValue: null, comparison: "threshold" },
  { testType: "hand_grip", gender: "female", ageMin: 15, ageMax: 25, category: "ดี", minValue: 0.42, maxValue: 0.49, comparison: "range" },
  { testType: "hand_grip", gender: "female", ageMin: 15, ageMax: 25, category: "พอใช้", minValue: 0.35, maxValue: 0.41, comparison: "range" },
  { testType: "hand_grip", gender: "female", ageMin: 15, ageMax: 25, category: "ต้องปรับปรุง", minValue: null, maxValue: 0.34, comparison: "threshold" },

  // ลุกนั่ง สำหรับนักกีฬาชาย
  { testType: "chair_stand", gender: "male", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 35, maxValue: null, comparison: "threshold" },
  { testType: "chair_stand", gender: "male", ageMin: 15, ageMax: 25, category: "ดี", minValue: 30, maxValue: 34, comparison: "range" },
  { testType: "chair_stand", gender: "male", ageMin: 15, ageMax: 25, category: "พอใช้", minValue: 25, maxValue: 29, comparison: "range" },
  { testType: "chair_stand", gender: "male", ageMin: 15, ageMax: 25, category: "ต้องปรับปรุง", minValue: null, maxValue: 24, comparison: "threshold" },

  // ลุกนั่ง สำหรับนักกีฬาหญิง
  { testType: "chair_stand", gender: "female", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 32, maxValue: null, comparison: "threshold" },
  { testType: "chair_stand", gender: "female", ageMin: 15, ageMax: 25, category: "ดี", minValue: 27, maxValue: 31, comparison: "range" },
  { testType: "chair_stand", gender: "female", ageMin: 15, ageMax: 25, category: "พอใช้", minValue: 22, maxValue: 26, comparison: "range" },
  { testType: "chair_stand", gender: "female", ageMin: 15, ageMax: 25, category: "ต้องปรับปรุง", minValue: null, maxValue: 21, comparison: "threshold" },

  // ขึ้นบันได สำหรับนักกีฬาชาย
  { testType: "step_up", gender: "male", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 200, maxValue: null, comparison: "threshold" },
  { testType: "step_up", gender: "male", ageMin: 15, ageMax: 25, category: "ดี", minValue: 180, maxValue: 199, comparison: "range" },
  { testType: "step_up", gender: "male", ageMin: 15, ageMax: 25, category: "พอใช้", minValue: 160, maxValue: 179, comparison: "range" },
  { testType: "step_up", gender: "male", ageMin: 15, ageMax: 25, category: "ต้องปรับปรุง", minValue: null, maxValue: 159, comparison: "threshold" },

  // ขึ้นบันได สำหรับนักกีฬาหญิง
  { testType: "step_up", gender: "female", ageMin: 15, ageMax: 25, category: "ดีเยี่ยม", minValue: 180, maxValue: null, comparison: "threshold" },
  { testType: "step_up", gender: "female", ageMin: 15, ageMax: 25, category: "ดี", minValue: 160, maxValue: 179, comparison: "range" },
  { testType: "step_up", gender: "female", ageMin: 15, ageMax: 25, category: "พอใช้", minValue: 140, maxValue: 159, comparison: "range" },
  { testType: "step_up", gender: "female", ageMin: 15, ageMax: 25, category: "ต้องปรับปรุง", minValue: null, maxValue: 139, comparison: "threshold" },
];

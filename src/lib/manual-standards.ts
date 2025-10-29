import type { StandardRow, TestResult, TestType } from "@/lib/types";
import { MANUAL_STANDARDS_19_59 } from "./manual-standards-19-59";
import { ATHLETE_STANDARDS } from "./manual-standards-athlete";

// Generate stable IDs for standards at module load
const MANUAL_STANDARD_ROWS: StandardRow[] = MANUAL_STANDARDS_19_59.map(
  (row, idx) => ({ id: `manual_19_59_${idx + 1}`, ...row }),
);

const ATHLETE_STANDARD_ROWS: StandardRow[] = ATHLETE_STANDARDS.map(
  (row: Omit<StandardRow, "id">, idx: number): StandardRow => ({ id: `athlete_${idx + 1}`, ...row }),
);

interface ManualEvaluationOptions {
  testType: TestType;
  gender: "male" | "female";
  age: number;
  value: number | null | undefined;
  role?: "student" | "athlete" | "instructor";
}

export function lookupManualEvaluation({
  testType,
  gender,
  age,
  value,
  role = "student",
}: ManualEvaluationOptions): string | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }

  // ถ้าเป็นนักกีฬา ลองหาเกณฑ์นักกีฬาก่อน
  if (role === "athlete") {
    const athleteRows = ATHLETE_STANDARD_ROWS.filter(
      (row) =>
        row.testType === testType &&
        row.gender === gender &&
        age >= row.ageMin &&
        age <= row.ageMax,
    );

    // ถ้ามีเกณฑ์นักกีฬาสำหรับการทดสอบนี้ ให้ใช้เกณฑ์นักกีฬา
    if (athleteRows.length > 0) {
      for (const row of athleteRows) {
        const minOk = row.minValue == null || value >= row.minValue;
        const maxOk = row.maxValue == null || value <= row.maxValue;
        if (minOk && maxOk) {
          return row.category;
        }
      }
      // มีเกณฑ์นักกีฬาแต่ค่าไม่ match
      return null;
    }
    
    // ไม่มีเกณฑ์นักกีฬาสำหรับการทดสอบนี้
    return "ยังไม่มีเกณฑ์นักกีฬา";
  }

  // ใช้เกณฑ์ทั่วไป (สำหรับนักเรียนทั่วไป)
  const rows = MANUAL_STANDARD_ROWS.filter(
    (row) =>
      row.testType === testType &&
      row.gender === gender &&
      age >= row.ageMin &&
      age <= row.ageMax,
  );

  for (const row of rows) {
    const minOk = row.minValue == null || value >= row.minValue;
    const maxOk = row.maxValue == null || value <= row.maxValue;
    if (minOk && maxOk) {
      return row.category;
    }
  }

  return null;
}

export function enhanceTestResultWithManualStandard(
  result: TestResult,
  options: { gender?: "male" | "female"; age?: number; role?: "student" | "athlete" | "instructor" },
): TestResult {
  const { gender, age, role = "student" } = options;

  if (!gender || typeof age !== "number") {
    return result;
  }

  const numericValue =
    result.testType === "hand_grip"
      ? Number(result.derivedValue ?? result.value)
      : Number(result.value ?? result.derivedValue);

  if (!Number.isFinite(numericValue)) {
    return result;
  }

  const manualEvaluation = lookupManualEvaluation({
    testType: result.testType,
    gender,
    age,
    value: numericValue,
    role,
  });

  // สำหรับนักกีฬา: ให้ override evaluation เสมอเพื่อใช้เกณฑ์นักกีฬา หรือแสดง "ยังไม่มีเกณฑ์นักกีฬา"
  if (role === "athlete" && manualEvaluation) {
    return { ...result, evaluation: manualEvaluation };
  }

  // สำหรับนักเรียนทั่วไป: override เฉพาะตอนที่ยังไม่มี evaluation หรือมีคำว่า "ไม่มีเกณฑ์"
  if (
    manualEvaluation &&
    (!result.evaluation || result.evaluation.includes("ไม่มีเกณฑ์"))
  ) {
    return { ...result, evaluation: manualEvaluation };
  }

  return result;
}

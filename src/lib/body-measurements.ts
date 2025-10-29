import type {
  BodyMeasurementResponse,
  BodyMeasurementValueMap,
  BodyMeasurements,
  TestResult,
} from "./types";

export type BodyMeasurementKey = keyof BodyMeasurementValueMap;
type NumericMeasurementKey = Exclude<BodyMeasurementKey, "notes">;

export type BodyMeasurementCategory =
  | "fitness"
  | "vital"
  | "circumference";

type PairKeys = {
  left: NumericMeasurementKey;
  right: NumericMeasurementKey;
};

export type BodyMeasurementFieldConfig =
  | {
      type: "single";
      key: NumericMeasurementKey;
      label: string;
      unit?: string;
      category: BodyMeasurementCategory;
      description?: string;
    }
  | {
      type: "pair";
      keys: PairKeys;
      label: string;
      unit?: string;
      category: BodyMeasurementCategory;
      description?: string;
      leftLabel?: string;
      rightLabel?: string;
    };

export const BODY_MEASUREMENT_FIELDS: BodyMeasurementFieldConfig[] = [
  {
    type: "single",
    key: "muscularStrength",
    label: "Muscular Strength",
    unit: "คะแนน",
    category: "fitness",
  },
  {
    type: "single",
    key: "muscularEndurance",
    label: "Muscular Endurance",
    unit: "ครั้ง",
    category: "fitness",
  },
  {
    type: "single",
    key: "flexibility",
    label: "Flexibility",
    unit: "เซนติเมตร",
    category: "fitness",
  },
  {
    type: "single",
    key: "bmi",
    label: "BMI",
    unit: "kg/m²",
    category: "fitness",
  },
  {
    type: "single",
    key: "cardioRespiratoryEndurance",
    label: "Cardio-Respiratory Endurance",
    unit: "คะแนน",
    category: "fitness",
  },
  {
    type: "single",
    key: "weight",
    label: "น้ำหนัก",
    unit: "กิโลกรัม",
    category: "vital",
  },
  {
    type: "single",
    key: "height",
    label: "ส่วนสูง",
    unit: "เซนติเมตร",
    category: "vital",
  },
  {
    type: "single",
    key: "pulse",
    label: "ชีพจร",
    unit: "ครั้ง/นาที",
    category: "vital",
  },
  {
    type: "single",
    key: "neck",
    label: "รอบคอ",
    unit: "เซนติเมตร",
    category: "circumference",
  },
  {
    type: "pair",
    label: "หัวไหล่",
    unit: "เซนติเมตร",
    category: "circumference",
    keys: { left: "shoulderLeft", right: "shoulderRight" },
    leftLabel: "ซ้าย",
    rightLabel: "ขวา",
  },
  {
    type: "pair",
    label: "แขนท่อนบน",
    unit: "เซนติเมตร",
    category: "circumference",
    keys: { left: "upperArmLeft", right: "upperArmRight" },
    leftLabel: "ซ้าย",
    rightLabel: "ขวา",
  },
  {
    type: "pair",
    label: "ข้อมือ",
    unit: "เซนติเมตร",
    category: "circumference",
    keys: { left: "wristLeft", right: "wristRight" },
    leftLabel: "ซ้าย",
    rightLabel: "ขวา",
  },
  {
    type: "single",
    key: "chest",
    label: "รอบอก",
    unit: "เซนติเมตร",
    category: "circumference",
  },
  {
    type: "single",
    key: "abdomen",
    label: "หน้าท้อง",
    unit: "มิลลิเมตร",
    category: "circumference",
  },
  {
    type: "single",
    key: "waist",
    label: "รอบเอว",
    unit: "เซนติเมตร",
    category: "circumference",
  },
  {
    type: "single",
    key: "hip",
    label: "รอบสะโพก",
    unit: "เซนติเมตร",
    category: "circumference",
  },
  {
    type: "pair",
    label: "ต้นขา",
    unit: "เซนติเมตร",
    category: "circumference",
    keys: { left: "thighLeft", right: "thighRight" },
    leftLabel: "ซ้าย",
    rightLabel: "ขวา",
  },
  {
    type: "pair",
    label: "น่อง",
    unit: "เซนติเมตร",
    category: "circumference",
    keys: { left: "calfLeft", right: "calfRight" },
    leftLabel: "ซ้าย",
    rightLabel: "ขวา",
  },
  {
    type: "pair",
    label: "ข้อเท้า",
    unit: "เซนติเมตร",
    category: "circumference",
    keys: { left: "ankleLeft", right: "ankleRight" },
    leftLabel: "ซ้าย",
    rightLabel: "ขวา",
  },
];

export const BODY_MEASUREMENT_CATEGORIES: Record<
  BodyMeasurementCategory,
  string
> = {
  fitness: "สมรรถภาพทางกาย",
  vital: "สัญญาณชีพ",
  circumference: "สัดส่วนร่างกาย",
};

export function computeMeasurementDifference(
  before?: number | null,
  after?: number | null,
): { absolute: number; percent: number | null } | null {
  if (
    before === undefined ||
    before === null ||
    after === undefined ||
    after === null
  ) {
    return null;
  }

  const absolute = after - before;
  const percent = before === 0 ? null : (absolute / before) * 100;

  return {
    absolute,
    percent: percent === null ? null : Number(percent.toFixed(2)),
  };
}

// ฟังก์ชันใหม่สำหรับแปลง BodyMeasurements เป็น form values (string)
export function getInitialMeasurementFormValues(
  measurement?: BodyMeasurements | null,
): Record<string, string> {
  const values: Record<string, string> = {};

  console.log("getInitialMeasurementFormValues - input measurement:", measurement);

  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    if (field.type === "single") {
      const key = field.key;
      const value = measurement?.[key];
      // แปลงเป็น string สำหรับ form input
      if (value !== null && value !== undefined && !isNaN(Number(value))) {
        values[key] = String(Number(value).toFixed(2)).replace(/\.00$/, ''); // ลบ .00 ถ้าเป็นจำนวนเต็ม
        console.log(`Set ${key}:`, values[key]);
      } else {
        values[key] = "";
      }
    } else {
      const leftKey = field.keys.left;
      const rightKey = field.keys.right;
      const leftValue = measurement?.[leftKey];
      const rightValue = measurement?.[rightKey];
      
      if (leftValue !== null && leftValue !== undefined && !isNaN(Number(leftValue))) {
        values[leftKey] = String(Number(leftValue).toFixed(2)).replace(/\.00$/, '');
        console.log(`Set ${leftKey}:`, values[leftKey]);
      } else {
        values[leftKey] = "";
      }
      
      if (rightValue !== null && rightValue !== undefined && !isNaN(Number(rightValue))) {
        values[rightKey] = String(Number(rightValue).toFixed(2)).replace(/\.00$/, '');
        console.log(`Set ${rightKey}:`, values[rightKey]);
      } else {
        values[rightKey] = "";
      }
    }
  });

  values.notes = measurement?.notes || "";
  
  console.log("getInitialMeasurementFormValues - final values:", values);
  return values;
}

export function getInitialMeasurementValues(
  measurement?: BodyMeasurements | null,
): BodyMeasurementValueMap {
  const values: Partial<BodyMeasurementValueMap> = {};

  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    if (field.type === "single") {
      const key = field.key;
      const value = measurement?.[key];
      values[key] = (value !== null && value !== undefined ? value : null) as BodyMeasurementValueMap[typeof key];
    } else {
      const leftKey = field.keys.left;
      const rightKey = field.keys.right;
      const leftValue = measurement?.[leftKey];
      const rightValue = measurement?.[rightKey];
      values[leftKey] = (leftValue !== null && leftValue !== undefined ? leftValue : null) as BodyMeasurementValueMap[typeof leftKey];
      values[rightKey] = (rightValue !== null && rightValue !== undefined ? rightValue : null) as BodyMeasurementValueMap[typeof rightKey];
    }
  });

  values.notes = measurement?.notes || "";

  return values as BodyMeasurementValueMap;
}

// ฟังก์ชันสำหรับรวมข้อมูลจาก TestResults เข้ากับ BodyMeasurements
export function mergeTestResultsWithBodyMeasurements(
  bodyMeasurements?: BodyMeasurements | null,
  testResults?: TestResult[] | null
): BodyMeasurements | null {
  // ถ้าไม่มี testResults ให้คืนค่า bodyMeasurements เดิม
  if (!testResults || testResults.length === 0) {
    console.log("No test results to merge, returning original bodyMeasurements:", bodyMeasurements);
    return bodyMeasurements || null;
  }
  
  console.log("Merging test results:", testResults.length, "items with body measurements");

  // หา TestResult ล่าสุดสำหรับแต่ละประเภท
  const latestResults = testResults.reduce((acc, result) => {
    if (!acc[result.testType] || new Date(result.recordedAt) > new Date(acc[result.testType].recordedAt)) {
      acc[result.testType] = result;
    }
    return acc;
  }, {} as Record<string, TestResult>);

  console.log("Latest test results by type:", latestResults);

  // สร้าง BodyMeasurements ใหม่หรือใช้ของเดิม
  const merged: BodyMeasurements = {
    phase: bodyMeasurements?.phase || "before",
    recordedAt: bodyMeasurements?.recordedAt || null,
    ...bodyMeasurements
  };
  
  console.log("Initial merged data:", merged);

  // เติมข้อมูลจาก TestResults
  if (latestResults.bmi) {
    merged.bmi = latestResults.bmi.derivedValue || latestResults.bmi.value;
    console.log("Set BMI from test result:", merged.bmi);
  }
  
  if (latestResults.sit_and_reach) {
    merged.flexibility = latestResults.sit_and_reach.value;
    console.log("Set flexibility from test result:", merged.flexibility);
  }
  
  if (latestResults.hand_grip) {
    // คำนวณ Muscular Strength จากค่าแรงบีบมือ
    // ใช้ค่า derivedValue (อัตราส่วนต่อน้ำหนักตัว) คูณ 100 เป็นคะแนน
    const gripRatio = latestResults.hand_grip.derivedValue || 
                     (latestResults.hand_grip.value / (bodyMeasurements?.weight || 70)); // ใช้น้ำหนักโดยประมาณถ้าไม่มี
    merged.muscularStrength = gripRatio * 100;
    console.log("Set muscular strength from hand grip:", merged.muscularStrength, "ratio:", gripRatio);
  }
  
  if (latestResults.chair_stand) {
    merged.muscularEndurance = latestResults.chair_stand.value;
    console.log("Set muscular endurance from chair stand:", merged.muscularEndurance);
  }
  
  if (latestResults.step_up) {
    // คำนวณ Cardio-Respiratory Endurance จากค่า Step Up
    // แปลงจากจำนวนครั้งเป็นคะแนน (สูตรประมาณ)
    merged.cardioRespiratoryEndurance = latestResults.step_up.value * 1.2;
    console.log("Set cardio endurance from step up:", merged.cardioRespiratoryEndurance);
  }

  console.log("Final merged data:", merged);
  return merged;
}

export type BodyMeasurementComparisonRow =
  | {
      id: string;
      type: "single";
      label: string;
      unit?: string;
      category: string;
      categoryKey: BodyMeasurementCategory;
      before: number | null | undefined;
      after: number | null | undefined;
      difference: ReturnType<typeof computeMeasurementDifference>;
    }
  | {
      id: string;
      type: "pair";
      label: string;
      unit?: string;
      category: string;
      categoryKey: BodyMeasurementCategory;
      sides: Array<{
        id: string;
        label: string;
        before: number | null | undefined;
        after: number | null | undefined;
        difference: ReturnType<typeof computeMeasurementDifference>;
      }>;
    };

export interface BodyMeasurementComparisonSummary {
  total: number;
  increase: number;
  decrease: number;
  unchanged: number;
}

export function buildBodyMeasurementComparison(
  response: BodyMeasurementResponse,
): BodyMeasurementComparisonRow[] {
  const rows: BodyMeasurementComparisonRow[] = [];

  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    if (field.type === "single") {
      const before = response.before?.[field.key];
      const after = response.after?.[field.key];
      rows.push({
        id: field.key,
        type: "single",
        label: field.label,
        unit: field.unit,
        category: BODY_MEASUREMENT_CATEGORIES[field.category],
        categoryKey: field.category,
        before,
        after,
        difference: computeMeasurementDifference(before ?? null, after ?? null),
      });
    } else {
      const sides = [
        {
          id: `${field.keys.left}`,
          label: field.leftLabel ?? "ซ้าย",
          before: response.before?.[field.keys.left],
          after: response.after?.[field.keys.left],
          difference: computeMeasurementDifference(
            response.before?.[field.keys.left] ?? null,
            response.after?.[field.keys.left] ?? null,
          ),
        },
        {
          id: `${field.keys.right}`,
          label: field.rightLabel ?? "ขวา",
          before: response.before?.[field.keys.right],
          after: response.after?.[field.keys.right],
          difference: computeMeasurementDifference(
            response.before?.[field.keys.right] ?? null,
            response.after?.[field.keys.right] ?? null,
          ),
        },
      ];
      rows.push({
        id: field.label,
        type: "pair",
        label: field.label,
        unit: field.unit,
        category: BODY_MEASUREMENT_CATEGORIES[field.category],
        categoryKey: field.category,
        sides,
      });
    }
  });

  return rows;
}

export function summarizeBodyMeasurementComparison(
  rows: BodyMeasurementComparisonRow[],
): BodyMeasurementComparisonSummary {
  return rows.reduce<BodyMeasurementComparisonSummary>(
    (acc, row) => {
      if (row.type === "single") {
        if (row.before != null && row.after != null) {
          acc.total += 1;
          const diff = row.difference?.absolute ?? 0;
          if (Math.abs(diff) < 0.01) {
            acc.unchanged += 1;
          } else if (diff > 0) {
            acc.increase += 1;
          } else {
            acc.decrease += 1;
          }
        }
      } else {
        row.sides.forEach((side) => {
          if (side.before != null && side.after != null) {
            acc.total += 1;
            const diff = side.difference?.absolute ?? 0;
            if (Math.abs(diff) < 0.01) {
              acc.unchanged += 1;
            } else if (diff > 0) {
              acc.increase += 1;
            } else {
              acc.decrease += 1;
            }
          }
        });
      }
      return acc;
    },
    { total: 0, increase: 0, decrease: 0, unchanged: 0 },
  );
}

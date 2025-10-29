"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StudentAccessGuide } from "./student-access-guide";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Trophy,
  TrendingDown,
  Users,
  Pencil,
  Trash2,
  UserPlus,
  Search,
  X,
} from "lucide-react";
import { useSession } from "@/providers/session-provider";
import { useGlobalLoading } from "@/providers/loading-provider";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/lib/api";
import { enhanceTestResultWithManualStandard } from "@/lib/manual-standards";
import { AddStudentDialog } from "./add-student-dialog";
import { downloadRawCsv } from "@/lib/utils";
import type {
  BodyMeasurementResponse,
  ClassStudent,
  PerformanceLevel as ApiPerformanceLevel,
  TestResult,
  TestType,
} from "@/lib/types";

/* ---------- Props / Types ---------- */
interface ClassDetailViewProps {
  classId: string;
  className: string;
  classCode: string;
  onBack: () => void;
  onImportStudents?: (classId: string) => void;
}

type SortField = "name" | "age" | "overallScore" | "lastTest";

interface SortConfig {
  field: SortField;
  direction: "asc" | "desc";
}

const performanceLevels: Record<ApiPerformanceLevel, { label: string; color: string }> = {
  excellent: { label: "ดีเยี่ยม", color: "bg-green-500" },
  good: { label: "ดี", color: "bg-blue-500" },
  average: { label: "ปานกลาง", color: "bg-yellow-500" },
  needs_improvement: { label: "ต้องพัฒนา", color: "bg-red-500" },
};

type FitnessColumnKey = keyof NonNullable<ClassStudent["fitnessMetrics"]>;
const FITNESS_COLUMNS: Array<{ key: FitnessColumnKey; label: string }> = [
  { key: "muscularStrength", label: "Muscular Strength" },
  { key: "muscularEndurance", label: "Muscular Endurance" },
  { key: "flexibility", label: "Flexibility" },
  { key: "bodyFat", label: "%Fat" },
  { key: "cardioRespiratoryEndurance", label: "Cardio - Respiratory Endurance" },
];

type BodyColumnKey = keyof NonNullable<ClassStudent["bodyMeasurements"]>;
const BODY_COLUMNS: Array<{ key: BodyColumnKey; label: string }> = [
  { key: "weight", label: "น้ำหนัก" },
  { key: "height", label: "ส่วนสูง" },
  { key: "pulse", label: "ชีพจร" },
  { key: "neck", label: "รอบคอ" },
  { key: "shoulderRight", label: "หัวไหล่ขวา" },
  { key: "shoulderLeft", label: "หัวไหล่ซ้าย" },
  { key: "upperArmRight", label: "แขนท่อนบน(ด้านขวา)" },
  { key: "upperArmLeft", label: "แขนท่อนบน(ด้านซ้าย)" },
  { key: "wristRight", label: "ข้อมือ(ด้านขวา)" },
  { key: "wristLeft", label: "ข้อมือ(ด้านซ้าย)" },
  { key: "chest", label: "รอบอก" },
  { key: "abdomen", label: "หน้าท้อง" },
  { key: "waist", label: "รอบเอว" },
  { key: "hip", label: "รอบสะโพก" },
  { key: "thighRight", label: "ต้นขา(ด้านขวา)" },
  { key: "thighLeft", label: "ต้นขา(ด้านซ้าย)" },
  { key: "calfRight", label: "น่อง(ด้านขวา)" },
  { key: "calfLeft", label: "น่อง(ด้านซ้าย)" },
  { key: "ankleRight", label: "ข้อเท้า(ด้านขวา)" },
  { key: "ankleLeft", label: "ข้อเท้า(ด้านซ้าย)" },
];

const formatNumberDisplay = (value: number | null | undefined, digits = 1) => {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return Number.isInteger(num) ? num.toString() : num.toFixed(digits);
};

const formatNumberCsv = (value: number | null | undefined, digits = 1) => {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return Number.isInteger(num) ? num.toString() : num.toFixed(digits);
};

const formatDateDisplay = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (err) {
    return value;
  }
};

const formatDateCsv = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split("T")[0];
};

const genderToThai = (gender?: ClassStudent["gender"]) => {
  if (gender === "male") return "ชาย";
  if (gender === "female") return "หญิง";
  return "-";
};

const FITNESS_SOURCE_MAP: Record<FitnessColumnKey, { testType: TestType; measurementKey?: string }> = {
  muscularStrength: { testType: "hand_grip", measurementKey: "muscularStrength" },
  muscularEndurance: { testType: "chair_stand", measurementKey: "muscularEndurance" },
  flexibility: { testType: "sit_and_reach", measurementKey: "flexibility" },
  bodyFat: { testType: "bmi", measurementKey: "bmi" },
  cardioRespiratoryEndurance: {
    testType: "step_up",
    measurementKey: "cardioRespiratoryEndurance",
  },
};

const MEASUREMENT_NUMERIC_KEYS = [
  "muscularStrength",
  "muscularEndurance",
  "flexibility",
  "bmi",
  "cardioRespiratoryEndurance",
  "weight",
  "height",
  "pulse",
  "neck",
  "shoulderLeft",
  "shoulderRight",
  "upperArmLeft",
  "upperArmRight",
  "wristLeft",
  "wristRight",
  "chest",
  "abdomen",
  "waist",
  "hip",
  "thighLeft",
  "thighRight",
  "calfLeft",
  "calfRight",
  "ankleLeft",
  "ankleRight",
] as const;

type NormalizedMeasurement = {
  recordedAt: string | null;
  phase: string | null;
} & Record<(typeof MEASUREMENT_NUMERIC_KEYS)[number], number | null>;

const coerceNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const roundTo = (value: number | null, digits = 2): number | null => {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
};

const computeBodyFatFromBmi = (bmi: number | null): number | null => {
  if (bmi === null || !Number.isFinite(bmi)) return null;
  return roundTo((bmi - 18.5) * 2 + 15, 1);
};

const normalizeMeasurement = (measurement: Record<string, unknown> | null | undefined): NormalizedMeasurement | null => {
  if (!measurement) return null;
  const numericEntries: Record<(typeof MEASUREMENT_NUMERIC_KEYS)[number], number | null> =
    {} as Record<(typeof MEASUREMENT_NUMERIC_KEYS)[number], number | null>;

  MEASUREMENT_NUMERIC_KEYS.forEach((key) => {
    numericEntries[key] = coerceNumber((measurement as Record<string, unknown>)[key]);
  });

  return {
    recordedAt: typeof measurement.recordedAt === "string" ? measurement.recordedAt : null,
    phase: typeof measurement.phase === "string" ? measurement.phase : null,
    ...numericEntries,
  };
};

const selectLatestMeasurement = (response: BodyMeasurementResponse | null | undefined): NormalizedMeasurement | null => {
  if (!response) return null;
  const records = [response.after, response.before].filter((record): record is NonNullable<typeof record> => Boolean(record));
  if (records.length === 0) return null;
  records.sort((a, b) => {
    const timeA = new Date(a.recordedAt ?? "").getTime();
    const timeB = new Date(b.recordedAt ?? "").getTime();
    return timeB - timeA;
  });
  return normalizeMeasurement(records[0] as unknown as Record<string, unknown>);
};

const buildBodyMeasurementsFromNormalized = (measurement: NormalizedMeasurement | null): ClassStudent["bodyMeasurements"] => {
  if (!measurement) return null;
  const result: Record<string, number | string | null> = {
    recordedAt: measurement.recordedAt,
    phase: measurement.phase,
  };
  BODY_COLUMNS.forEach(({ key }) => {
    result[key] = measurement[key] ?? null;
  });
  return result as unknown as ClassStudent["bodyMeasurements"];
};

const metricsAreEmpty = (metrics?: ClassStudent["fitnessMetrics"]) => {
  if (!metrics) return true;
  return Object.values(metrics).every(
    (metric) => !metric || (metric.value === null || metric.value === undefined) && !metric.evaluation,
  );
};

const buildFitnessMetricsFromSources = (
  existing: ClassStudent["fitnessMetrics"],
  latestResults?: Partial<Record<TestType, TestResult>>,
  measurement?: NormalizedMeasurement | null,
  studentInfo?: { gender?: "male" | "female"; age?: number; role?: "student" | "athlete" | "instructor" },
): ClassStudent["fitnessMetrics"] => {
  const next: ClassStudent["fitnessMetrics"] = { ...(existing ?? {}) };

  (Object.keys(FITNESS_SOURCE_MAP) as FitnessColumnKey[]).forEach((metricKey) => {
    const { testType, measurementKey } = FITNESS_SOURCE_MAP[metricKey];
    const baseline = existing?.[metricKey];
    let value = baseline?.value ?? null;
    let evaluation = baseline?.evaluation ?? "";

    let testResult = latestResults?.[testType];
    
    // Enhance test result with role-specific evaluation if student info is available
    if (testResult && studentInfo?.gender && typeof studentInfo?.age === "number") {
      testResult = enhanceTestResultWithManualStandard(testResult, {
        gender: studentInfo.gender,
        age: studentInfo.age,
        role: studentInfo.role || "student",
      });
    }
    
    if (testResult) {
      const raw = coerceNumber(
        typeof testResult.derivedValue === "number"
          ? testResult.derivedValue
          : testResult.derivedValue ?? testResult.value,
      );
      if (raw !== null) {
        value = metricKey === "bodyFat" ? computeBodyFatFromBmi(raw) : raw;
      }
      if (testResult.evaluation) {
        evaluation = testResult.evaluation;
      }
    }

    if ((value === null || Number.isNaN(value)) && measurement && measurementKey) {
      const measurementValue = measurement[measurementKey as keyof NormalizedMeasurement];
      if (measurementValue !== null && measurementValue !== undefined) {
        const numericValue = typeof measurementValue === 'string' ? parseFloat(measurementValue) : measurementValue;
        value =
          metricKey === "bodyFat" ? computeBodyFatFromBmi(numericValue) : numericValue;
      }
    }

    if (metricKey === "bodyFat" && (value === null || Number.isNaN(value)) && measurement && measurement.bmi !== null && measurement.bmi !== undefined) {
      value = computeBodyFatFromBmi(measurement.bmi);
    }

    next[metricKey] = {
      value: value !== null ? roundTo(value, metricKey === "cardioRespiratoryEndurance" ? 0 : metricKey === "bodyFat" ? 1 : 2) : null,
      evaluation: evaluation || "",
    };
  });

  return next;
};

/* ---------- Main Component ---------- */
export function ClassDetailView({
  classId,
  className,
  classCode,
  onBack,
  onImportStudents,
}: ClassDetailViewProps) {
  const { session } = useSession();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { success, error } = useToast();

  /* ---------- State ---------- */
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"fitness" | "measurements">("fitness");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "name",
    direction: "asc",
  });

  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState<ApiPerformanceLevel | "all">("all");

  // Add/Edit student states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<ClassStudent | null>(null);
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    email: "",
    gender: "male" as "male" | "female",
    birthdate: "",
  });

  // Delete student states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<ClassStudent | null>(null);

  /* ---------- Data Fetching ---------- */
  const fetchStudents = useCallback(async () => {
    if (!session?.token) return;

    try {
      setLoading(true);
      const data = await api.getClassStudents(session.token, classId);
      let studentList = data.students ?? [];

      const needsFitnessMetrics = studentList.some((student) => metricsAreEmpty(student.fitnessMetrics));
      const studentsNeedingMeasurements = studentList.filter(
        (student) => metricsAreEmpty(student.fitnessMetrics) || !student.bodyMeasurements,
      );

      let rosterMap: Map<string, { latestResults: Partial<Record<TestType, TestResult>> }> | null = null;
      if (needsFitnessMetrics) {
        try {
          const dashboard = await api.getInstructorDashboard(session.token, classId);
          if (dashboard?.roster?.length) {
            rosterMap = new Map(dashboard.roster.map((item) => [item.id, item]));
          }
        } catch (dashboardError) {
          console.warn("ไม่สามารถโหลดข้อมูลสรุปชั้นเรียนเพื่อคำนวณสมรรถภาพได้", dashboardError);
        }
      }

      let measurementMap = new Map<string, NormalizedMeasurement>();
      if (studentsNeedingMeasurements.length > 0) {
        const measurementEntries = await Promise.all(
          studentsNeedingMeasurements.map(async (student) => {
            try {
              const response = await api.getUserBodyMeasurements(session.token!, student.id);
              const normalized = selectLatestMeasurement(response);
              if (normalized) {
                return { id: student.id, measurement: normalized };
              }
            } catch (measurementError) {
              console.warn(`ไม่สามารถโหลดสัดส่วนร่างกายของ ${student.fullName}`, measurementError);
            }
            return null;
          }),
        );
        measurementMap = new Map(
          measurementEntries
            .filter((entry): entry is { id: string; measurement: NormalizedMeasurement } => Boolean(entry))
            .map((entry) => [entry.id, entry.measurement]),
        );
      }

      const enrichedStudents = studentList.map((student) => {
        const measurement = measurementMap.get(student.id) ?? null;
        const latestResults = rosterMap?.get(student.id)?.latestResults;
        const fitnessMetrics = buildFitnessMetricsFromSources(
          student.fitnessMetrics, 
          latestResults, 
          measurement,
          {
            gender: student.gender,
            age: student.age,
            role: student.role,
          }
        );
        const bodyMeasurements =
          student.bodyMeasurements ?? buildBodyMeasurementsFromNormalized(measurement);

        return {
          ...student,
          fitnessMetrics,
          bodyMeasurements,
        };
      });

      setStudents(enrichedStudents);
    } catch (err) {
      console.error("Error fetching students:", err);
      error("ไม่สามารถโหลดรายชื่อนักเรียนได้");
    } finally {
      setLoading(false);
    }
  }, [session?.token, classId, error]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  /* ---------- Filtering & Sorting ---------- */
  const sortedAndFilteredStudents = useMemo(() => {
    let filtered = students.filter((student) => {
      const matchesName = student.fullName.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesPerformance =
        performanceFilter === "all" || student.performanceLevel === performanceFilter;
      return matchesName && matchesPerformance;
    });

    // Sort
    filtered.sort((a, b) => {
      const { field, direction } = sortConfig;
      let aValue: any = null;
      let bValue: any = null;

      switch (field) {
        case "name":
          aValue = a.fullName;
          bValue = b.fullName;
          break;
        case "age":
          aValue = a.age ?? 0;
          bValue = b.age ?? 0;
          break;
        case "overallScore":
          aValue = a.testResults?.overallScore ?? -1;
          bValue = b.testResults?.overallScore ?? -1;
          break;
        case "lastTest":
          aValue = a.testResults?.lastTestDate
            ? new Date(a.testResults.lastTestDate).getTime()
            : 0;
          bValue = b.testResults?.lastTestDate
            ? new Date(b.testResults.lastTestDate).getTime()
            : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string") {
        return direction === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return direction === "asc" ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [students, nameFilter, performanceFilter, sortConfig]);

  useEffect(() => {
    setFilteredStudents(sortedAndFilteredStudents);
  }, [sortedAndFilteredStudents]);

  /* ---------- Sort Handler ---------- */
  const handleSort = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  /* ---------- Export Functions (CSV parity with reports) ---------- */
  const exportToCSV = useCallback(() => {
    try {
      showLoading("กำลังเตรียมไฟล์ CSV...");

      if (students.length === 0) {
        error("ยังไม่มีข้อมูลสำหรับส่งออก");
        return;
      }

      const average = (values: Array<number | null | undefined>) => {
        const valid = values.filter(
          (value): value is number => typeof value === "number" && Number.isFinite(value),
        );
        if (valid.length === 0) return null;
        const sum = valid.reduce((acc, value) => acc + value, 0);
        return Number((sum / valid.length).toFixed(1));
      };

      const fitnessAverages: Record<string, number | null> = {};
      FITNESS_COLUMNS.forEach((column) => {
        const metricValues = students.map(
          (student) => student.fitnessMetrics?.[column.key]?.value ?? null,
        );
        fitnessAverages[column.label] = average(metricValues);
      });

      const avgAge = average(
        students.map((student) =>
          typeof student.age === "number" && Number.isFinite(student.age) ? student.age : null,
        ),
      );

      const scoredStudents = students
        .filter((student) => typeof student.testResults?.overallScore === "number")
        .map((student) => ({
          name: student.fullName,
          score: student.testResults?.overallScore ?? 0,
        }))
        .sort((a, b) => b.score - a.score);

      const standout = scoredStudents[0]?.name ?? "-";
      const needsSupport =
        scoredStudents.length > 0
          ? scoredStudents[scoredStudents.length - 1]?.name ?? "-"
          : "-";

      const safeClassName = (className || "class")
        .trim()
        .replace(/[\\/:*?"<>|]/g, "_")
        .slice(0, 60);
      const lines: string[][] = [];

      lines.push([`=== สรุปสถิติกลุ่มเรียน ${className || ""} ===`]);
      lines.push([]);
      lines.push(["ข้อมูลเฉลี่ย", "ค่า (หน่วย)"]);
      FITNESS_COLUMNS.forEach((column) => {
        const value = fitnessAverages[column.label];
        lines.push([column.label, value !== null ? formatNumberCsv(value) : "-"]);
      });
      lines.push(["อายุเฉลี่ย", avgAge !== null ? formatNumberCsv(avgAge, 0) : "-"]);
      lines.push(["จำนวนนักเรียนทั้งหมด", String(students.length)]);
      lines.push(["นักเรียนที่มีผลงานโดดเด่น", standout]);
      lines.push(["นักเรียนที่ต้องดูแลเพิ่มเติม", needsSupport]);
      lines.push([]);

      const fitnessSpan = FITNESS_COLUMNS.length * 2;
      const groupRow = [
        "ข้อมูลผู้ประเมิน",
        "",
        "",
        "",
        "สมรรถภาพทางกาย",
        ...Array(Math.max(fitnessSpan - 1, 0)).fill(""),
        "สัดส่วนร่างกาย",
        ...Array(Math.max(BODY_COLUMNS.length - 1, 0)).fill(""),
        "ระดับผลงาน",
        "วันที่ทดสอบล่าสุด",
      ];
      lines.push(groupRow);

      const headerRow = [
        "ชื่อ-สกุล",
        "อีเมล",
        "อายุ",
        "เพศ",
        "คะแนนรวม",
        ...FITNESS_COLUMNS.flatMap((column) => [column.label, "ผลการประเมิน"]),
        ...BODY_COLUMNS.map((column) => column.label),
        "ระดับผลงาน",
        "วันที่ทดสอบล่าสุด",
      ];
      lines.push(headerRow);

      students.forEach((student) => {
        const metrics = FITNESS_COLUMNS.flatMap((column) => {
          const metric = student.fitnessMetrics?.[column.key];
          return [
            formatNumberCsv(metric?.value),
            metric?.evaluation ?? "",
          ];
        });

        const measurements = BODY_COLUMNS.map((column) => {
          const value = student.bodyMeasurements?.[column.key] ?? null;
          if (value === null || value === undefined) return formatNumberCsv(null);
          return formatNumberCsv(typeof value === 'string' ? parseFloat(value) || null : value);
        });

        const performanceLabel =
          performanceLevels[student.performanceLevel]?.label || "ไม่ระบุ";

        const row = [
          student.fullName,
          student.email ?? "",
          student.age ? String(student.age) : "",
          genderToThai(student.gender),
          formatNumberCsv(student.testResults?.overallScore ?? null, 0),
          ...metrics,
          ...measurements,
          performanceLabel,
          formatDateCsv(student.testResults?.lastTestDate ?? null),
        ];
        lines.push(row);
      });

      downloadRawCsv(lines, `รายงานนักเรียน_${safeClassName || "class"}.csv`);
      success("ส่งออกข้อมูลเรียบร้อยแล้ว");
    } catch (e) {
      console.error(e);
      error("เกิดข้อผิดพลาดระหว่างสร้างไฟล์ CSV");
    } finally {
      hideLoading();
    }
  }, [students, className, showLoading, hideLoading, success, error]);

  /* ---------- Student Management ---------- */
  const handleAddStudent = useCallback(() => {
    setShowAddDialog(true);
  }, []);

  const handleEditStudent = useCallback((student: ClassStudent) => {
    setEditingStudent(student);
    setStudentForm({
      fullName: student.fullName,
      email: student.email || "",
      gender: student.gender,
      birthdate: "",
    });
    setShowEditDialog(true);
  }, []);

  const handleDeleteStudent = useCallback((student: ClassStudent) => {
    setDeletingStudent(student);
    setShowDeleteDialog(true);
  }, []);

  const handleChangeRole = useCallback(async (studentId: string, newRole: "student" | "athlete") => {
    if (!session?.token) return;

    try {
      showLoading("กำลังเปลี่ยนบทบาท...");
      const result = await api.changeUserRole(session.token, { userId: studentId, newRole });
      success(result.message || `เปลี่ยนบทบาทเป็น ${newRole === "athlete" ? "นักกีฬา" : "นักเรียนทั่วไป"} เรียบร้อยแล้ว`);
      await fetchStudents(); // รีโหลดข้อมูลนักเรียน
    } catch (err) {
      error(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนบทบาทได้");
    } finally {
      hideLoading();
    }
  }, [session?.token, fetchStudents, showLoading, hideLoading, success, error]);


  const submitEditStudent = useCallback(async () => {
    if (!session?.token || !editingStudent || !studentForm.fullName.trim() || !studentForm.email.trim()) {
      error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      showLoading("กำลังอัปเดตข้อมูล...");
      await api.updateStudent(session.token, {
        studentId: editingStudent.id,
        fullName: studentForm.fullName.trim(),
        email: studentForm.email.trim(),
        gender: studentForm.gender,
        birthdate: studentForm.birthdate,
      });
      
      success("อัปเดตข้อมูลเรียบร้อยแล้ว");
      setShowEditDialog(false);
      setEditingStudent(null);
      await fetchStudents();
    } catch (err) {
      console.error("Error updating student:", err);
      error("ไม่สามารถอัปเดตข้อมูลได้");
    } finally {
      hideLoading();
    }
  }, [session?.token, editingStudent, studentForm, showLoading, hideLoading, success, error, fetchStudents]);

  const submitDeleteStudent = useCallback(async () => {
    if (!session?.token || !deletingStudent) return;

    try {
      showLoading("กำลังลบนักเรียน...");
      await api.deleteStudent(session.token, deletingStudent.id);
      
      success("ลบนักเรียนเรียบร้อยแล้ว");
      setShowDeleteDialog(false);
      setDeletingStudent(null);
      await fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
      error("ไม่สามารถลบนักเรียนได้");
    } finally {
      hideLoading();
    }
  }, [session?.token, deletingStudent, showLoading, hideLoading, success, error, fetchStudents]);

  /* ---------- Statistics ---------- */
  const statistics = useMemo(() => {
    if (students.length === 0) return null;

    const totalStudents = students.length;
    const testedStudents = students.filter(s => s.testResults?.lastTestDate).length;
    const avgBMI = students
      .filter(s => s.latestBMI)
      .reduce((sum, s) => sum + (s.latestBMI || 0), 0) / 
      students.filter(s => s.latestBMI).length;

    const performanceDistribution: Record<ApiPerformanceLevel, number> = {
      excellent: 0,
      good: 0,
      average: 0,
      needs_improvement: 0,
    };
    
    students.forEach((s) => {
      if (s.performanceLevel) {
        performanceDistribution[s.performanceLevel] = (performanceDistribution[s.performanceLevel] || 0) + 1;
      }
    });

    return {
      totalStudents,
      testedStudents,
      testingRate: (testedStudents / totalStudents) * 100,
      avgBMI: isNaN(avgBMI) ? 0 : avgBMI,
      performanceDistribution,
    };
  }, [students]);

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted">กำลังโหลดข้อมูล...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="min-h-[44px] px-3 py-2"
            >
              ← กลับ
            </Button>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">{className}</h1>
          <p className="text-sm text-muted">รหัสห้อง: {classCode}</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={handleAddStudent}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-4"
            title="เพิ่มนักเรียนใหม่ (Ctrl+N)"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">เพิ่มนักเรียน</span>
          </Button>

          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-4"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted">นักเรียนทั้งหมด</p>
                  <p className="text-xl sm:text-2xl font-bold">{statistics.totalStudents}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted">ทดสอบแล้ว</p>
                  <p className="text-xl sm:text-2xl font-bold">{statistics.testedStudents}</p>
                  <p className="text-xs text-muted">
                    {statistics.testingRate.toFixed(1)}% ของทั้งหมด
                  </p>
                </div>
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted">BMI เฉลี่ย</p>
                  <p className="text-xl sm:text-2xl font-bold">{statistics.avgBMI.toFixed(1)}</p>
                </div>
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 px-4 sm:px-6">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted mb-2">การกระจายผลงาน</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {(Object.keys(statistics.performanceDistribution) as ApiPerformanceLevel[]).map((level) => {
                    const count = statistics.performanceDistribution[level];
                    return (
                      <div key={level} className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            performanceLevels[level]?.color || "bg-gray-300"
                          }`}
                        />
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            ค้นหาและกรอง
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                id="name-filter"
                placeholder="ค้นหาชื่อนักเรียน..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
              {nameFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNameFilter("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div>
              <Select
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value as ApiPerformanceLevel | "all")}
                className="min-h-[44px]"
              >
                <option value="all">ระดับผลงาน: ทั้งหมด</option>
                {Object.entries(performanceLevels).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs sm:text-sm text-muted">
                แสดง {filteredStudents.length} จาก {students.length} คน
              </span>
              {(nameFilter || performanceFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNameFilter("");
                    setPerformanceFilter("all");
                  }}
                  className="text-xs min-h-[36px] px-3"
                >
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายชื่อนักเรียน ({filteredStudents.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted mx-auto mb-4" />
              <p className="text-muted mb-4">
                {students.length === 0
                  ? "ยังไม่มีนักเรียนในห้องเรียนนี้"
                  : "ไม่พบนักเรียนที่ตรงกับเงื่อนไขการค้นหา"}
              </p>
              {students.length === 0 && (
                <Button onClick={handleAddStudent} className="mx-auto">
                  เพิ่มนักเรียนคนแรก
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  {viewMode === "fitness"
                    ? "โหมดสมรรถภาพ: แสดงค่าการทดสอบล่าสุด 5 ด้านพร้อมผลการประเมิน"
                    : "โหมดสัดส่วน: แสดงค่าการวัดสัดส่วนร่างกายล่าสุด"}
                </p>
                <div className="inline-flex rounded-full border border-border overflow-hidden bg-surface">
                  <button
                    type="button"
                    onClick={() => setViewMode("fitness")}
                    className={`px-3 py-1 text-sm transition-colors ${
                      viewMode === "fitness"
                        ? "bg-accent text-white"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    สมรรถภาพ
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("measurements")}
                    className={`px-3 py-1 text-sm transition-colors border-l border-border ${
                      viewMode === "measurements"
                        ? "bg-accent text-white"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    สัดส่วน
                  </button>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="bg-surface text-xs font-semibold uppercase text-muted">
                      <th colSpan={5} className="p-3 text-left">
                        ข้อมูลผู้ประเมิน
                      </th>
                      <th
                        colSpan={viewMode === "fitness" ? FITNESS_COLUMNS.length * 2 : BODY_COLUMNS.length}
                        className="p-3 text-left"
                      >
                        {viewMode === "fitness" ? "สมรรถภาพทางกาย" : "สัดส่วนร่างกาย"}
                      </th>
                      <th className="p-3 text-left">ระดับผลงาน</th>
                      <th className="p-3 text-left">วันที่ทดสอบล่าสุด</th>
                      <th rowSpan={2} className="p-3 text-right align-top">
                        การจัดการ
                      </th>
                    </tr>
                    <tr className="bg-surface text-sm font-semibold text-foreground">
                      <th className="p-3">
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          ชื่อ-นามสกุล
                          {sortConfig.field === "name" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </th>
                      <th className="p-3 text-left">อีเมล</th>
                      <th className="p-3">
                        <button
                          onClick={() => handleSort("age")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          อายุ
                          {sortConfig.field === "age" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </th>
                      <th className="p-3 text-left">เพศ</th>
                      <th className="p-3">
                        <button
                          onClick={() => handleSort("overallScore")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          คะแนนรวม
                          {sortConfig.field === "overallScore" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </th>
                      {viewMode === "fitness"
                        ? FITNESS_COLUMNS.map((column) => (
                            <Fragment key={column.key}>
                              <th className="p-3 text-left">{column.label}</th>
                              <th className="p-3 text-left">ผลการประเมิน</th>
                            </Fragment>
                          ))
                        : BODY_COLUMNS.map((column) => (
                            <th key={column.key as string} className="p-3 text-left">
                              {column.label}
                            </th>
                          ))}
                      <th className="p-3 text-left">ระดับผลงาน</th>
                      <th className="p-3">
                        <button
                          onClick={() => handleSort("lastTest")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          วันที่ทดสอบล่าสุด
                          {sortConfig.field === "lastTest" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-t hover:bg-surface/60">
                        <td className="p-3 align-top">
                          <p className="font-medium">{student.fullName}</p>
                        </td>
                        <td className="p-3 align-top text-sm text-muted">
                          {student.email || "-"}
                        </td>
                        <td className="p-3 align-top">
                          {student.age ? String(student.age) : "-"}
                        </td>
                        <td className="p-3 align-top">{genderToThai(student.gender)}</td>
                        <td className="p-3 align-top">
                          {student.testResults?.overallScore !== undefined &&
                          student.testResults?.overallScore !== null
                            ? formatNumberDisplay(student.testResults.overallScore, 0)
                            : "-"}
                        </td>
                        {viewMode === "fitness"
                          ? FITNESS_COLUMNS.map((column) => {
                              const metric = student.fitnessMetrics?.[column.key];
                              const precision =
                                column.key === "bodyFat"
                                  ? 1
                                  : column.key === "cardioRespiratoryEndurance"
                                    ? 0
                                    : 2;
                              return (
                                <Fragment key={`${student.id}-${column.key}`}>
                                  <td className="p-3 align-top">
                                    {formatNumberDisplay(metric?.value, precision)}
                                  </td>
                                  <td className="p-3 align-top">
                                    {metric?.evaluation || "-"}
                                  </td>
                                </Fragment>
                              );
                            })
                          : BODY_COLUMNS.map((column) => (
                              <td
                                key={`${student.id}-${column.key as string}`}
                                className="p-3 align-top"
                              >
                                {formatNumberDisplay(
                                  student.bodyMeasurements?.[column.key] as number | null | undefined,
                                )}
                              </td>
                            ))}
                        <td className="p-3 align-top">
                          <Badge
                            variant="secondary"
                            className={`${
                              performanceLevels[student.performanceLevel]?.color ||
                              "bg-gray-500"
                            } text-white`}
                          >
                            {performanceLevels[student.performanceLevel]?.label || "ไม่ระบุ"}
                          </Badge>
                        </td>
                        <td className="p-3 align-top">
                          {formatDateDisplay(student.testResults?.lastTestDate ?? null)}
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Toggle between student and athlete role
                                const newRole = student.role === "athlete" ? "student" : "athlete";
                                handleChangeRole(student.id, newRole);
                              }}
                              className={student.role === "athlete" ? "text-amber-600" : "text-gray-400"}
                              title={student.role === "athlete" ? "นักกีฬา - คลิกเพื่อเปลี่ยนเป็นนักเรียนทั่วไป" : "นักเรียนทั่วไป - คลิกเพื่อเปลี่ยนเป็นนักกีฬา"}
                            >
                              <Trophy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                      {/* Student Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base truncate">{student.fullName}</h3>
                          <p className="text-xs text-muted truncate">{student.email || "-"}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {student.age ? `${student.age} ปี` : "-"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {genderToThai(student.gender)}
                            </Badge>
                            {student.role === "athlete" && (
                              <Badge variant="secondary" className="bg-amber-600 text-white text-xs flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                นักกีฬา
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className={`${
                                performanceLevels[student.performanceLevel]?.color || "bg-gray-500"
                              } text-white text-xs`}
                            >
                              {performanceLevels[student.performanceLevel]?.label || "ไม่ระบุ"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newRole = student.role === "athlete" ? "student" : "athlete";
                              handleChangeRole(student.id, newRole);
                            }}
                            className={`min-h-[44px] min-w-[44px] p-2 ${student.role === "athlete" ? "text-amber-600" : "text-gray-400"}`}
                            title={student.role === "athlete" ? "นักกีฬา" : "นักเรียน"}
                          >
                            <Trophy className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="min-h-[44px] min-w-[44px] p-2"
                            title="แก้ไข"
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            className="min-h-[44px] min-w-[44px] p-2 text-red-600 hover:text-red-800"
                            title="ลบ"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Test Score & Date */}
                      <div className="grid grid-cols-2 gap-3 py-3 border-t border-b">
                        <div>
                          <p className="text-xs text-muted mb-1">คะแนนรวม</p>
                          <p className="text-lg font-bold">
                            {student.testResults?.overallScore !== undefined &&
                            student.testResults?.overallScore !== null
                              ? formatNumberDisplay(student.testResults.overallScore, 0)
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted mb-1">วันที่ทดสอบล่าสุด</p>
                          <p className="text-sm font-medium">
                            {formatDateDisplay(student.testResults?.lastTestDate ?? null)}
                          </p>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted uppercase">
                          {viewMode === "fitness" ? "สมรรถภาพทางกาย" : "สัดส่วนร่างกาย"}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {viewMode === "fitness"
                            ? FITNESS_COLUMNS.map((column) => {
                                const metric = student.fitnessMetrics?.[column.key];
                                const precision =
                                  column.key === "bodyFat"
                                    ? 1
                                    : column.key === "cardioRespiratoryEndurance"
                                      ? 0
                                      : 2;
                                return (
                                  <div key={column.key} className="space-y-1">
                                    <p className="text-xs text-muted">{column.label}</p>
                                    <p className="font-medium">
                                      {formatNumberDisplay(metric?.value, precision)}
                                    </p>
                                    <p className="text-xs text-muted">{metric?.evaluation || "-"}</p>
                                  </div>
                                );
                              })
                            : BODY_COLUMNS.map((column) => (
                                <div key={column.key as string} className="space-y-1">
                                  <p className="text-xs text-muted">{column.label}</p>
                                  <p className="font-medium">
                                    {formatNumberDisplay(
                                      student.bodyMeasurements?.[column.key] as number | null | undefined,
                                    )}
                                  </p>
                                </div>
                              ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>



      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl">แก้ไขข้อมูลนักเรียน</DialogTitle>
            <DialogDescription className="text-sm">
              อัปเดตข้อมูลของ {editingStudent?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 sm:gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-sm">ชื่อ-นามสกุล *</Label>
              <Input
                id="edit-name"
                value={studentForm.fullName}
                onChange={(e) =>
                  setStudentForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="กรอกชื่อ-นามสกุล"
                className="min-h-[44px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-email" className="text-sm">อีเมล *</Label>
              <Input
                id="edit-email"
                type="email"
                value={studentForm.email}
                onChange={(e) =>
                  setStudentForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="student@example.com"
                className="min-h-[44px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-gender" className="text-sm">เพศ</Label>
              <Select
                value={studentForm.gender}
                onChange={(e) =>
                  setStudentForm((prev) => ({ ...prev, gender: e.target.value as "male" | "female" }))
                }
                className="min-h-[44px]"
              >
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-birthdate" className="text-sm">วันเกิด</Label>
              <Input
                id="edit-birthdate"
                type="date"
                value={studentForm.birthdate}
                onChange={(e) =>
                  setStudentForm((prev) => ({ ...prev, birthdate: e.target.value }))
                }
                className="min-h-[44px]"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={submitEditStudent}
              className="min-h-[44px] w-full sm:w-auto"
            >
              บันทึกการแก้ไข
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Student Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl">ยืนยันการลบนักเรียน</DialogTitle>
            <DialogDescription className="text-sm">
              คุณต้องการลบ <strong>{deletingStudent?.fullName}</strong> ออกจากห้องเรียนใช่หรือไม่?
              <br />
              <span className="text-red-600">การดำเนินการนี้ไม่สามารถยกเลิกได้</span>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              onClick={submitDeleteStudent}
              className="min-h-[44px] w-full sm:w-auto"
            >
              ลบนักเรียน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog - New standardized component */}
      <AddStudentDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        classId={classId}
        className={className}
        onSuccess={fetchStudents}
      />
    </div>
  );
}

// Default export for backwards compatibility
export default ClassDetailView;

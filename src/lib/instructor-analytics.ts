import { differenceInDays, format } from "date-fns";
import type { ClassStudent, ClassSummary, PerformanceLevel } from "./types";

export interface ClassSnapshot {
  classId: string;
  className: string;
  studentCount: number;
  averageOverallScore: number | null;
  averageBmi: number | null;
  bestStudent?: SnapshotStudent;
  worstStudent?: SnapshotStudent;
  performanceSpread: Record<PerformanceLevel, number>;
  recentActivity: {
    last30Days: number;
    previous30Days: number;
  };
  lastAssessmentOn?: string | null;
}

export interface SnapshotStudent {
  id: string;
  fullName: string;
  overallScore: number | null;
  performanceLevel: PerformanceLevel;
  lastTestDate: string | null | undefined;
}

export interface InstructorAnalytics {
  totalStudents: number;
  averageOverallScore: number | null;
  benchmarkOverallScore: number | null;
  bestClass?: ClassSnapshot;
  lowestClass?: ClassSnapshot;
  performanceDistribution: Record<PerformanceLevel, number>;
  activitySummary: {
    activeThisCycle: number;
    activePreviousCycle: number;
    percentChange: number | null;
  };
  alerts: InstructorAlert[];
}

export interface InstructorAlert {
  classId: string;
  className: string;
  message: string;
  severity: "warning" | "critical";
}

export interface ComparisonFilters {
  classIds: string[];
  gender: "all" | "male" | "female";
  ageMin?: number;
  ageMax?: number;
}

export interface ComparisonRow {
  classId: string;
  className: string;
  averageOverallScore: number | null;
  benchmarkOverallScore: number | null;
  activeStudents: number;
}

export interface ExportableStudentRow extends SnapshotStudent {
  classId: string;
  className: string;
  gender: "male" | "female";
  age: number;
  classAverageOverallScore: number | null;
}

export const performanceLevels: PerformanceLevel[] = [
  "excellent",
  "good",
  "average",
  "needs_improvement",
];

function safeNumber(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (filtered.length === 0) return null;
  const total = filtered.reduce((sum, value) => sum + value, 0);
  return filtered.length > 0 ? total / filtered.length : null;
}

export function buildClassSnapshot(
  summary: ClassSummary,
  students: ClassStudent[],
): ClassSnapshot {
  const now = new Date();
  let last30Days = 0;
  let previous30Days = 0;
  let latestAssessment: string | null | undefined = undefined;

  const distribution: Record<PerformanceLevel, number> = {
    excellent: 0,
    good: 0,
    average: 0,
    needs_improvement: 0,
  };

  let bestStudent: SnapshotStudent | undefined;
  let worstStudent: SnapshotStudent | undefined;

  students.forEach((student) => {
    distribution[student.performanceLevel] += 1;

    const snapshot: SnapshotStudent = {
      id: student.id,
      fullName: student.fullName,
      overallScore: student.testResults?.overallScore ?? null,
      performanceLevel: student.performanceLevel,
      lastTestDate: student.testResults?.lastTestDate,
    };

    const lastTest = student.testResults?.lastTestDate
      ? new Date(student.testResults.lastTestDate)
      : null;

    if (lastTest && Number.isFinite(lastTest.getTime())) {
      const diff = differenceInDays(now, lastTest);
      if (diff <= 30) {
        last30Days += 1;
      } else if (diff <= 60) {
        previous30Days += 1;
      }

      if (!latestAssessment || lastTest > new Date(latestAssessment)) {
        latestAssessment = student.testResults?.lastTestDate;
      }
    }

    if (
      snapshot.overallScore !== null &&
      (bestStudent === undefined ||
        (bestStudent.overallScore ?? -Infinity) < snapshot.overallScore)
    ) {
      bestStudent = snapshot;
    }

    if (
      snapshot.overallScore !== null &&
      (worstStudent === undefined ||
        (worstStudent.overallScore ?? Infinity) > snapshot.overallScore)
    ) {
      worstStudent = snapshot;
    }
  });

  const averageOverallScore = safeNumber(
    students.map((student) => student.testResults?.overallScore ?? null),
  );

  const averageBmi = safeNumber(
    students.map((student) => student.testResults?.bmi ?? student.latestBMI ?? null),
  );

  return {
    classId: summary.id,
    className: summary.className,
    studentCount: students.length,
    averageOverallScore,
    averageBmi,
    performanceSpread: distribution,
    recentActivity: {
      last30Days,
      previous30Days,
    },
    bestStudent,
    worstStudent,
    lastAssessmentOn: latestAssessment,
  };
}

export function buildInstructorAnalytics(
  classes: ClassSummary[],
  snapshots: ClassSnapshot[],
): InstructorAnalytics {
  if (classes.length !== snapshots.length) {
    // ensure consistent mapping; we use the snapshot information as ground truth
    const matchedSnapshots = classes
      .map((klass) => snapshots.find((snapshot) => snapshot.classId === klass.id))
      .filter((item): item is ClassSnapshot => Boolean(item));
    return buildInstructorAnalyticsInternal(matchedSnapshots);
  }

  return buildInstructorAnalyticsInternal(snapshots);
}

function buildInstructorAnalyticsInternal(snapshots: ClassSnapshot[]): InstructorAnalytics {
  const totalStudents = snapshots.reduce((sum, snapshot) => sum + snapshot.studentCount, 0);
  const averageOverallScore = safeNumber(
    snapshots.map((snapshot) => snapshot.averageOverallScore),
  );

  const performanceDistribution: Record<PerformanceLevel, number> = {
    excellent: 0,
    good: 0,
    average: 0,
    needs_improvement: 0,
  };

  snapshots.forEach((snapshot) => {
    performanceLevels.forEach((level) => {
      performanceDistribution[level] += snapshot.performanceSpread[level];
    });
  });

  const bestClass = snapshots.reduce<ClassSnapshot | undefined>((acc, snapshot) => {
    if (!acc) return snapshot;
    const currentScore = snapshot.averageOverallScore ?? -Infinity;
    const previousScore = acc.averageOverallScore ?? -Infinity;
    return currentScore > previousScore ? snapshot : acc;
  }, undefined);

  const lowestClass = snapshots.reduce<ClassSnapshot | undefined>((acc, snapshot) => {
    if (!acc) return snapshot;
    const currentScore = snapshot.averageOverallScore ?? Infinity;
    const previousScore = acc.averageOverallScore ?? Infinity;
    return currentScore < previousScore ? snapshot : acc;
  }, undefined);

  const activeThisCycle = snapshots.reduce(
    (sum, snapshot) => sum + snapshot.recentActivity.last30Days,
    0,
  );
  const activePreviousCycle = snapshots.reduce(
    (sum, snapshot) => sum + snapshot.recentActivity.previous30Days,
    0,
  );

  let percentChange: number | null = null;
  if (activePreviousCycle > 0) {
    percentChange = ((activeThisCycle - activePreviousCycle) / activePreviousCycle) * 100;
  } else if (activeThisCycle > 0) {
    percentChange = 100;
  }

  const alerts = snapshots.flatMap<InstructorAlert>((snapshot) => {
    const snapshotAlerts: InstructorAlert[] = [];
    const totalPerformanceEntries = performanceLevels.reduce(
      (sum, level) => sum + snapshot.performanceSpread[level],
      0,
    );

    const needsImprovementRatio =
      totalPerformanceEntries === 0
        ? 0
        : snapshot.performanceSpread.needs_improvement / totalPerformanceEntries;

    if (needsImprovementRatio >= 0.35) {
      snapshotAlerts.push({
        classId: snapshot.classId,
        className: snapshot.className,
        severity: needsImprovementRatio >= 0.5 ? "critical" : "warning",
        message: `สัดส่วนผู้เรียนที่ต้องพัฒนาอยู่ที่ ${(needsImprovementRatio * 100).toFixed(
          0,
        )}%`,
      });
    }

    const { last30Days, previous30Days } = snapshot.recentActivity;
    if (previous30Days > 0 && last30Days < previous30Days * 0.7) {
      snapshotAlerts.push({
        classId: snapshot.classId,
        className: snapshot.className,
        severity: "warning",
        message: "ปริมาณการบันทึกผลลดลงมากกว่า 30% เมื่อเทียบกับรอบก่อน",
      });
    }

    return snapshotAlerts;
  });

  return {
    totalStudents,
    averageOverallScore,
    benchmarkOverallScore: averageOverallScore,
    bestClass,
    lowestClass,
    performanceDistribution,
    activitySummary: {
      activeThisCycle,
      activePreviousCycle,
      percentChange,
    },
    alerts,
  };
}

export function buildComparisonRows(
  snapshots: ClassSnapshot[],
  filters: ComparisonFilters,
  studentLookup: Record<string, ClassStudent[]>,
): ComparisonRow[] {
  const selected = filters.classIds.length > 0 ? filters.classIds : snapshots.map((s) => s.classId);

  return snapshots
    .filter((snapshot) => selected.includes(snapshot.classId))
    .map((snapshot) => {
      const students = studentLookup[snapshot.classId] ?? [];
      const filteredStudents = students.filter((student) => {
        if (filters.gender !== "all" && student.gender !== filters.gender) return false;
        if (filters.ageMin !== undefined && student.age < filters.ageMin) return false;
        if (filters.ageMax !== undefined && student.age > filters.ageMax) return false;
        return true;
      });

      const averageOverallScore = safeNumber(
        filteredStudents.map((student) => student.testResults?.overallScore ?? null),
      );

      return {
        classId: snapshot.classId,
        className: snapshot.className,
        averageOverallScore,
        benchmarkOverallScore: snapshot.averageOverallScore,
        activeStudents: filteredStudents.length,
      };
    });
}

export function buildExportRows(
  snapshots: ClassSnapshot[],
  studentLookup: Record<string, ClassStudent[]>,
): ExportableStudentRow[] {
  return snapshots.flatMap((snapshot) => {
    const students = studentLookup[snapshot.classId] ?? [];
    return students.map<ExportableStudentRow>((student) => ({
      id: student.id,
      fullName: student.fullName,
      overallScore: student.testResults?.overallScore ?? null,
      performanceLevel: student.performanceLevel,
      lastTestDate: student.testResults?.lastTestDate,
      classId: snapshot.classId,
      className: snapshot.className,
      gender: student.gender,
      age: student.age,
      classAverageOverallScore: snapshot.averageOverallScore ?? null,
    }));
  });
}

export interface ExportColumn {
  key: keyof ExportableStudentRow;
  label: string;
}

export const DEFAULT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "fullName", label: "ชื่อ-สกุล" },
  { key: "gender", label: "เพศ" },
  { key: "age", label: "อายุ" },
  { key: "className", label: "ชั้นเรียน" },
  { key: "overallScore", label: "คะแนนรวม" },
  { key: "classAverageOverallScore", label: "ค่าเฉลี่ยชั้นเรียน" },
  { key: "performanceLevel", label: "ระดับผลงาน" },
  { key: "lastTestDate", label: "วันที่บันทึกล่าสุด" },
];

const genderLabels: Record<ExportableStudentRow["gender"], string> = {
  male: "ชาย",
  female: "หญิง",
};

const performanceLabels: Record<PerformanceLevel, string> = {
  excellent: "ดีเยี่ยม",
  good: "ดี",
  average: "ปานกลาง",
  needs_improvement: "ต้องพัฒนา",
};

function formatDateValue(value: string | null | undefined): string {
  if (!value) return "ยังไม่เคยบันทึก";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return format(date, "dd/MM/yyyy");
}

function formatValue(row: ExportableStudentRow, key: keyof ExportableStudentRow): string {
  const value = row[key];
  if (value === null || value === undefined) {
    return "";
  }

  switch (key) {
    case "gender":
      return genderLabels[value as ExportableStudentRow["gender"]] ?? String(value);
    case "performanceLevel":
      return performanceLabels[value as PerformanceLevel] ?? String(value);
    case "overallScore":
    case "classAverageOverallScore": {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value.toFixed(1);
      }
      return "";
    }
    case "lastTestDate":
      return formatDateValue(value as string | null | undefined);
    default:
      return String(value);
  }
}

export function exportToCsv(rows: ExportableStudentRow[], columns: ExportColumn[]) {
  if (rows.length === 0 || columns.length === 0) {
    return;
  }

  const header = columns.map((column) => column.label).join(",");
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const formatted = formatValue(row, column.key);
        if (formatted === "") {
          return "";
        }
        if (/[";,]/.test(formatted) || /^\s|\s$/.test(formatted)) {
          return `"${formatted.replace(/"/g, '""')}"`;
        }
        return formatted;
      })
      .join(","),
  );

  const csvContent = `\ufeff${[header, ...lines].join("\r\n")}`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `wth-fitness-dashboard-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// PDF export disabled per request
export function exportToPrintablePdf(_rows: ExportableStudentRow[], _columns: ExportColumn[]) {
  console.warn("PDF export is disabled");
}

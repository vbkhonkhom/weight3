"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/providers/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import type { User, ClassSummary, TestResult } from "@/lib/types";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Download, FileSpreadsheet, /* FileText,*/ TrendingUp, Users, Target, HelpCircle, Info } from "lucide-react";
// PDF export disabled per request
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HelpDialog } from "@/components/ui/help-dialog";
import { InstructorHelpContent } from "@/lib/help-content-instructor";
import { downloadRawCsv } from "@/lib/utils";
import type { InstructorDashboardPayload, TestType, TestResult as RTestResult } from "@/lib/types";

interface ChartData {
  name: string;
  before: number;
  after: number;
  improvement: number;
}

interface ClassStat {
  className: string;
  students: number;
  tested: number;
  avgImprovement: number;
}

interface DistributionData {
  name: string;
  value: number;
  [key: string]: string | number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function InstructorReportsPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTestType, setSelectedTestType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Real data from API
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; fullName: string; classId?: string }>>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progressData, setProgressData] = useState<ChartData[]>([]);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [evaluationDistribution, setEvaluationDistribution] = useState<DistributionData[]>([]);

  useEffect(() => {
    if (isRestoring) return;
    if (!session?.user || session.user.role !== "instructor") {
      router.push("/");
    }
  }, [isRestoring, session, router]);

  useEffect(() => {
    if (!session?.token) return;

    async function fetchData() {
      if (!session?.token) return;
      
      try {
        setLoading(true);

        // Fetch instructor dashboard data (includes classes)
        const dashboardData = await api.getInstructorDashboard(session.token);
        const testsData = await api.getTestResults(session.token);        // Extract classes from dashboard
        const classesData = dashboardData.classes || [];
        
        // Fetch all students from all classes
        const allStudentsPromises = classesData.map((cls: ClassSummary) =>
          api.getClassStudents(session.token, cls.id)
            .then(response => response.students.map(s => ({ ...s, classId: cls.id })))
            .catch(() => [])
        );
        const studentsArrays = await Promise.all(allStudentsPromises);
        const studentsData = studentsArrays.flat();
        
        setClasses(classesData);
        setStudents(studentsData);
        setTestResults(testsData);        // Calculate progress data by test type
        const progressByType = calculateProgressData(testsData);
        setProgressData(progressByType);

        // Calculate class statistics
        const stats = calculateClassStats(classesData, studentsData, testsData);
        setClassStats(stats);

        // Calculate evaluation distribution
        const distribution = calculateEvaluationDistribution(testsData);
        setEvaluationDistribution(distribution);

      } catch (error) {
        console.error("Error fetching reports data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session?.token]);

  function calculateProgressData(tests: TestResult[]): ChartData[] {
    const testTypes = ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"];
    const testLabels: Record<string, string> = {
      bmi: "BMI",
      sit_and_reach: "ความยืดหยุ่น",
      hand_grip: "แรงบีบมือ",
      chair_stand: "ลุกนั่ง",
      step_up: "ขึ้นบันได"
    };

    return testTypes.map(type => {
      const typeTests = tests.filter(t => t.testType === type);
      
      if (typeTests.length < 2) {
        return { name: testLabels[type], before: 0, after: 0, improvement: 0 };
      }

      // Sort by date
      const sorted = typeTests.sort((a, b) => 
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );

      const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
      const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

      const avgBefore = firstHalf.reduce((sum, t) => sum + (t.value || 0), 0) / firstHalf.length;
      const avgAfter = secondHalf.reduce((sum, t) => sum + (t.value || 0), 0) / secondHalf.length;
      const improvement = avgBefore > 0 ? ((avgAfter - avgBefore) / avgBefore) * 100 : 0;

      return {
        name: testLabels[type],
        before: Math.round(avgBefore * 100) / 100,
        after: Math.round(avgAfter * 100) / 100,
        improvement: Math.round(improvement * 10) / 10
      };
    });
  }

  function calculateClassStats(
    classes: ClassSummary[], 
    students: Array<{ id: string; fullName: string; classId?: string }>, 
    tests: TestResult[]
  ): ClassStat[] {
    return classes.map(cls => {
      const classStudents = students.filter(s => s.classId === cls.id);
      const classTests = tests.filter(t => 
        classStudents.some(s => s.id === t.userId)
      );
      
      const testedStudents = new Set(classTests.map(t => t.userId)).size;
      
      // Calculate average improvement per student
      const studentImprovements = classStudents.map(student => {
        const studentTests = classTests
          .filter(t => t.userId === student.id)
          .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        
        if (studentTests.length < 2) return 0;
        
        const first = studentTests[0].value || 0;
        const last = studentTests[studentTests.length - 1].value || 0;
        
        return first > 0 ? ((last - first) / first) * 100 : 0;
      });

      const avgImprovement = studentImprovements.length > 0
        ? studentImprovements.reduce((a, b) => a + b, 0) / studentImprovements.length
        : 0;

      return {
        className: cls.className,
        students: classStudents.length,
        tested: testedStudents,
        avgImprovement: Math.round(avgImprovement * 10) / 10
      };
    });
  }

  function calculateEvaluationDistribution(tests: TestResult[]): DistributionData[] {
    const evaluations: Record<string, number> = {};
    
    tests.forEach(test => {
      const evaluation = test.evaluation || "ไม่ระบุ";
      evaluations[evaluation] = (evaluations[evaluation] || 0) + 1;
    });

    return Object.entries(evaluations).map(([name, value]) => ({
      name,
      value
    }));
  }

  // PDF export disabled
  const exportToPDF = undefined;

  const exportToExcel = () => {
    setLoading(true);
    try {
      const wb = XLSX.utils.book_new();

      // Progress sheet
      const progressSheet = XLSX.utils.json_to_sheet(
        progressData.map(item => ({
          "ประเภทการทดสอบ": item.name,
          "ก่อน": item.before,
          "หลัง": item.after,
          "การพัฒนา (%)": item.improvement,
        }))
      );
      XLSX.utils.book_append_sheet(wb, progressSheet, "ความก้าวหน้า");

      // Class stats sheet
      const classStatsSheet = XLSX.utils.json_to_sheet(
        classStats.map(stat => ({
          "ห้องเรียน": stat.className,
          "จำนวนนักเรียน": stat.students,
          "ทดสอบแล้ว": stat.tested,
          "การพัฒนาเฉลี่ย (%)": stat.avgImprovement,
        }))
      );
      XLSX.utils.book_append_sheet(wb, classStatsSheet, "สถิติห้องเรียน");

      XLSX.writeFile(wb, `fitness-report-${Date.now()}.xlsx`);
    } catch (error) {
      console.error("Export Excel error:", error);
      alert("เกิดข้อผิดพลาดในการ export Excel");
    } finally {
      setLoading(false);
    }
  };

  // สร้าง CSV รูปแบบ "สรุปสถิติกลุ่ม" ตามตัวอย่างที่ให้มา
  const exportToGroupCsv = async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      // ดึง roster ของห้องที่เลือก เพื่อให้ได้ผลล่าสุดรายนักเรียน (มี derivedValue/evaluation)
      let classId = selectedClass !== "all" ? selectedClass : (classes[0]?.id ?? "");
      if (!classId && classes.length === 0) {
        alert("ยังไม่มีข้อมูลชั้นเรียนสำหรับส่งออก CSV");
        return;
      }
      const cls = classes.find((c) => c.id === classId) ?? classes[0];
      const rosterResp: InstructorDashboardPayload = await api.getInstructorDashboard(session.token, cls.id);
      const roster = rosterResp.roster ?? [];

      // Map ชื่อเมตริกกับ test type ในระบบ
      const METRIC_MAP: Record<string, TestType> = {
        "Muscular Strength": "hand_grip",
        "Muscular Endurance": "chair_stand",
        "Flexibility": "sit_and_reach",
        "Cardio - Respiatory Endurance": "step_up",
      };

      // Helper: ดึงค่าตัวเลขล่าสุด (ใช้ derivedValue ก่อน ถ้าไม่มีใช้ value)
      const getNumeric = (res?: RTestResult) => {
        if (!res) return undefined;
        const v = typeof res.derivedValue === "number" ? res.derivedValue : res.value;
        return Number.isFinite(v) ? Number(v) : undefined;
      };
      const getEval = (res?: RTestResult) => res?.evaluation ?? "";

      // คำนวณค่าเฉลี่ยตามเมตริก
      const averages: Record<string, number | undefined> = {};
      Object.entries(METRIC_MAP).forEach(([label, test]) => {
        const values: number[] = [];
        roster.forEach((u) => {
          const res = u.latestResults?.[test];
          const num = getNumeric(res);
          if (typeof num === "number") values.push(num);
        });
        if (values.length) {
          averages[label] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
        } else {
          averages[label] = undefined;
        }
      });

      // %Fat = ใช้ BMI ตามที่ผู้ใช้ต้องการ
      const bodyFatValues: number[] = [];
      roster.forEach((u) => {
        const bmi = getNumeric(u.latestResults?.bmi);
        if (typeof bmi === "number") bodyFatValues.push(bmi);
      });
      const avgBodyFat = bodyFatValues.length
        ? Math.round((bodyFatValues.reduce((a, b) => a + b, 0) / bodyFatValues.length) * 10) / 10
        : undefined;

      // อายุเฉลี่ย
      const ages = roster
        .map((u) => u.birthdate)
        .filter(Boolean)
        .map((d) => {
          const bd = new Date(String(d));
          const now = new Date();
          let age = now.getFullYear() - bd.getFullYear();
          const m = now.getMonth() - bd.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
          return age;
        });
      const avgAge = ages.length ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : undefined;

      // เลือกเด่น/ต้องดูแล: ใช้คะแนนเชิงคุณภาพจาก evaluation (ดีมาก>ดี>ปานกลาง>ต้องพัฒนา)
      const scoreEval = (e: string) => {
        if (!e) return 0;
        if (/(ดีมาก|excellent)/i.test(e)) return 4;
        if (/(ดี|good)/i.test(e)) return 3;
        if (/(ปานกลาง|average)/i.test(e)) return 2;
        if (/(ต้องพัฒนา|needs)/i.test(e)) return 1;
        return 0;
      };
      const rank = roster.map((u) => {
        const tests = Object.values(u.latestResults ?? {}) as RTestResult[];
        const sum = tests.reduce((s, r) => s + scoreEval(r?.evaluation ?? ""), 0);
        return { id: u.id, name: u.fullName, sum };
      });
      const best = rank.slice().sort((a, b) => b.sum - a.sum)[0]?.name ?? "-";
      const worst = rank.slice().sort((a, b) => a.sum - b.sum)[0]?.name ?? "-";

      // สร้างหัวรายงาน
      const classTitle = cls.className || "ทั้งหมด";
      const lines: string[][] = [];
    lines.push([`=== สรุปสถิติกลุ่มเรียน ${classTitle} ===`]);
      lines.push([]);
  const fmt = (n?: number) => (typeof n === "number" && Number.isFinite(n) ? n.toFixed(1) : "-");
  lines.push(["ข้อมูลเฉลี่ย", "ค่า"]);
  lines.push(["Muscular Strength", fmt(averages["Muscular Strength"]) ]);
  lines.push(["Muscular Endurance", fmt(averages["Muscular Endurance"]) ]);
  lines.push(["Flexibility", fmt(averages["Flexibility"]) ]);
  lines.push(["%Fat", fmt(avgBodyFat) ]);
  lines.push(["Cardio - Respiatory Endurance", fmt(averages["Cardio - Respiatory Endurance"]) ]);
  lines.push(["อายุเฉลี่ย", (typeof avgAge === "number" && Number.isFinite(avgAge)) ? Math.round(avgAge).toString() : "-"]);
      lines.push(["จำนวนนักเรียนทั้งหมด", String(roster.length)]);
      lines.push(["นักเรียนที่มีผลงานโดดเด่น", best]);
      lines.push(["นักเรียนที่ต้องดูแลเพิ่มเติม", worst]);
      lines.push([]);

      // แถวหัวข้อกลุ่มใหญ่ (เพื่อความสวยงามเหมือนตัวอย่าง)
      lines.push([
        "ข้อมูลผู้ประเมิน",
        "",
        "",
        "",
        // กลุ่มสมรรถภาพทางกาย (10 คอลัมน์): ป้าย + ช่องว่างอีก 9
        "สมรรถภาพทางกาย",
        ...Array(9).fill(""),
        // กลุ่มสัดส่วนร่างกาย (21 คอลัมน์): ป้าย + ช่องว่างอีก 20 (เพิ่มหมายเหตุสัดส่วน)
        "สัดส่วนร่างกาย",
        ...Array(19).fill(""),
        // คอลัมน์สุดท้าย 2 คอลัมน์
        "ระดับผลงาน",
        "วันที่ทดสอบล่าสุด",
      ]);

      // หัวคอลัมน์จริง
      const header = [
        "ชื่อ-สกุล",
        "อีเมล",
        "อายุ",
        "เพศ",
        "Muscular Strength",
        "ผลการประเมิน",
        "Muscular Endurance",
        "ผลการประเมิน",
        "Flexibility",
        "ผลการประเมิน",
        "%Fat",
        "ผลการประเมิน",
        "Cardio - Respiatory Endurance",
        "ผลการประเมิน",
        // ตัววัดสัดส่วน (ปล่อยว่างถ้าไม่มีข้อมูล)
        "น้ำหนัก",
        "ส่วนสูง",
        "ชีพจร",
        "รอบคอ",
        "หัวไหล่ขวา",
        "หัวไหล่ซ้าย",
        "แขนท่อนบน(ด้านขวา)",
        "แขนท่อนบน(ด้านซ้าย)",
        "ข้อมือ(ด้านขวา)",
        "ข้อมือ(ด้านซ้าย)",
        "รอบอก",
        "หน้าท้อง",
        "รอบเอว",
        "รอบสะโพก",
        "ต้นขา(ด้านขวา)",
        "ต้นขา(ด้านซ้าย)",
        "น่อง(ด้านขวา)",
        "น่อง(ด้านซ้าย)",
        "ข้อเท้า(ด้านขวา)",
        "ข้อเท้า(ด้านซ้าย)",
        "ระดับผลงาน",
        "วันที่ทดสอบล่าสุด",
      ];
      lines.push(header);

      // แปลงเพศเป็นไทย
      const genderTh = (g?: string) => (g === "male" ? "ชาย" : g === "female" ? "หญิง" : "");

      // เตรียมดึงสัดส่วนร่างกายล่าสุดของแต่ละคน (ก่อน/หลัง อันที่ใหม่กว่า)
      const measurementList = await Promise.all(
        roster.map(async (u) => {
          try {
            const m = await api.getUserBodyMeasurements(session.token!, u.id);
            const before = m.before?.recordedAt ? new Date(m.before.recordedAt) : null;
            const after = m.after?.recordedAt ? new Date(m.after.recordedAt) : null;
            let latest = null as (typeof m.before) | null;
            let phase: "before" | "after" | "" = "";
            if (before && after) {
              if (after.getTime() >= before.getTime()) {
                latest = m.after as typeof m.before;
                phase = "after";
              } else {
                latest = m.before as typeof m.before;
                phase = "before";
              }
            } else if (after) {
              latest = m.after as typeof m.before;
              phase = "after";
            } else if (before) {
              latest = m.before as typeof m.before;
              phase = "before";
            }
            return { userId: u.id, latest, phase };
          } catch {
            return { userId: u.id, latest: null, phase: "" as const };
          }
        }),
      );
      const measurementMap = new Map<string, { latest: any; phase: "before" | "after" | "" }>(
        measurementList.map((x) => [x.userId, { latest: x.latest, phase: x.phase }]),
      );

      // สร้างแถวข้อมูลรายคน
      roster.forEach((u) => {
        const strength = u.latestResults?.hand_grip;
        const endurance = u.latestResults?.chair_stand;
        const flex = u.latestResults?.sit_and_reach;
        const cardio = u.latestResults?.step_up;
        const bmi = u.latestResults?.bmi;

        // %Fat = ใช้ BMI
        const bodyFat = getNumeric(bmi);

        // วันที่ล่าสุดจากผลทดสอบที่มี (แปลงเป็นรูปแบบไทย)
        const latestDate = (() => {
          const all = Object.values(u.latestResults ?? {}) as RTestResult[];
          const dt = all
            .map((r) => new Date(r.recordedAt))
            .filter((d) => !Number.isNaN(d.getTime()))
            .sort((a, b) => b.getTime() - a.getTime())[0];
          if (!dt) return "-";
          try {
            return dt.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
          } catch {
            return dt.toISOString().split("T")[0];
          }
        })();

        const latestMeasure = measurementMap.get(u.id);
        const mv: any = latestMeasure?.latest;
        const row = [
          u.fullName ?? "",
          u.email ?? "",
          (u.birthdate
            ? (() => {
                const bd = new Date(String(u.birthdate));
                const now = new Date();
                let age = now.getFullYear() - bd.getFullYear();
                const m = now.getMonth() - bd.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
                return String(age);
              })()
            : ""),
          genderTh(u.gender),
          fmt(getNumeric(strength)),
          getEval(strength),
          fmt(getNumeric(endurance)),
          getEval(endurance),
          fmt(getNumeric(flex)),
          getEval(flex),
          fmt(bodyFat as number),
          "",
          fmt(getNumeric(cardio)),
          getEval(cardio),
          // สัดส่วนร่างกาย
          (mv?.weight ?? "").toString(),
          (mv?.height ?? "").toString(),
          (mv?.pulse ?? "").toString(),
          (mv?.neck ?? "").toString(),
          (mv?.shoulderRight ?? "").toString(),
          (mv?.shoulderLeft ?? "").toString(),
          (mv?.upperArmRight ?? "").toString(),
          (mv?.upperArmLeft ?? "").toString(),
          (mv?.wristRight ?? "").toString(),
          (mv?.wristLeft ?? "").toString(),
          (mv?.chest ?? "").toString(),
          (mv?.abdomen ?? "").toString(),
          (mv?.waist ?? "").toString(),
          (mv?.hip ?? "").toString(),
          (mv?.thighRight ?? "").toString(),
          (mv?.thighLeft ?? "").toString(),
          (mv?.calfRight ?? "").toString(),
          (mv?.calfLeft ?? "").toString(),
          (mv?.ankleRight ?? "").toString(),
          (mv?.ankleLeft ?? "").toString(),
          // ระดับผลงานรวม
          (() => {
            const all = Object.values(u.latestResults ?? {}) as RTestResult[];
            const score = all.reduce((s, r) => s + scoreEval(r?.evaluation ?? ""), 0);
            if (score >= 12) return "ดีมาก";
            if (score >= 9) return "ดี";
            if (score >= 6) return "ปานกลาง";
            return "ต้องพัฒนา";
          })(),
          latestDate,
        ];
        lines.push(row);
      });

      downloadRawCsv(lines, `รายงานนักเรียน_${classTitle}.csv`);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดระหว่างสร้างไฟล์ CSV");
    } finally {
      setLoading(false);
    }
  };

  if (isRestoring || !session?.user) {
    return (
      <AppShell title="กำลังโหลด...">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </AppShell>
    );
  }

  // เพิ่มตัวแสดงสถานะกำลังโหลดข้อมูลเมื่อดึงข้อมูลรายงาน
  if (loading) {
    return (
      <AppShell title="รายงานและสถิติ">
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-muted">กำลังโหลดข้อมูลรายงาน...</p>
        </div>
      </AppShell>
    );
  }

  const totalStudents = classStats.reduce((sum, stat) => sum + stat.students, 0);
  const totalTested = classStats.reduce((sum, stat) => sum + stat.tested, 0);
  const avgImprovement = classStats.reduce((sum, stat) => sum + stat.avgImprovement, 0) / classStats.length;

  return (
    <AppShell 
      title="รายงานและสถิติ" 
      description="วิเคราะห์ความก้าวหน้าและสถิติการทดสอบสมรรถภาพ"
    >
      <div className="space-y-6">
        {/* Header with Export Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">รายงานสมรรถภาพทางกาย</h1>
              <p className="text-sm text-muted">วิเคราะห์และเปรียบเทียบผลการทดสอบ</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <HelpDialog
              title="คู่มือการใช้งาน - รายงานและสถิติ"
              content={InstructorHelpContent.reports}
            />
            <Button
              onClick={exportToGroupCsv}
              disabled={loading}
              variant="outline"
              className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-3"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            {/* PDF export disabled */}
            <Button
              onClick={exportToExcel}
              disabled={loading}
              className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-3"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">ตัวกรอง</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium mb-2 block">ห้องเรียน</label>
                <Select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="min-h-[44px]"
                >
                  <option value="all">ทั้งหมด</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium mb-2 block">ประเภทการทดสอบ</label>
                <Select 
                  value={selectedTestType} 
                  onChange={(e) => setSelectedTestType(e.target.value)}
                  className="min-h-[44px]"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="bmi">BMI</option>
                  <option value="flexibility">ความยืดหยุ่น</option>
                  <option value="grip">แรงบีบมือ</option>
                  <option value="chair">ลุกนั่ง</option>
                  <option value="step">ขึ้นบันได</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="text-xs sm:text-sm font-medium text-muted">
                จำนวนนักเรียนทั้งหมด
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold">{totalStudents}</div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="text-xs sm:text-sm font-medium text-muted">
                ทดสอบแล้ว
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold">{totalTested}</div>
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted mt-1">
                {((totalTested / totalStudents) * 100).toFixed(1)}% ของทั้งหมด
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="text-xs sm:text-sm font-medium text-muted">
                การพัฒนาเฉลี่ย
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  +{avgImprovement.toFixed(1)}%
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="progress" className="min-h-[44px] text-xs sm:text-sm px-2">ความก้าวหน้า</TabsTrigger>
            <TabsTrigger value="comparison" className="min-h-[44px] text-xs sm:text-sm px-2">เปรียบเทียบ</TabsTrigger>
            <TabsTrigger value="distribution" className="min-h-[44px] text-xs sm:text-sm px-2">การกระจาย</TabsTrigger>
          </TabsList>

          {/* Progress Chart */}
          <TabsContent value="progress">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">กราฟแสดงความก้าวหน้า (ก่อน-หลัง)</CardTitle>
                <p className="text-xs sm:text-sm text-muted">
                  เปรียบเทียบผลการทดสอบก่อนและหลังการฝึก
                </p>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                  <BarChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="before" fill="#94a3b8" name="ก่อน" />
                    <Bar dataKey="after" fill="#3b82f6" name="หลัง" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Chart */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">กราฟเปรียบเทียบการพัฒนา</CardTitle>
                <p className="text-xs sm:text-sm text-muted">
                  เปอร์เซ็นต์การพัฒนาในแต่ละรายการทดสอบ
                </p>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="improvement" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="การพัฒนา (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Chart */}
          <TabsContent value="distribution">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">การกระจายผลการประเมิน</CardTitle>
                <p className="text-xs sm:text-sm text-muted">
                  สัดส่วนนักเรียนในแต่ละระดับการประเมิน
                </p>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                  <PieChart>
                    <Pie
                      data={evaluationDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={window.innerWidth < 640 ? 80 : 120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {evaluationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Class Statistics Table */}
        <Card>
          <CardHeader>
            <CardTitle>สถิติแต่ละห้องเรียน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">ห้องเรียน</th>
                    <th className="text-right p-3 font-semibold">จำนวนนักเรียน</th>
                    <th className="text-right p-3 font-semibold">ทดสอบแล้ว</th>
                    <th className="text-right p-3 font-semibold">เปอร์เซ็นต์</th>
                    <th className="text-right p-3 font-semibold">การพัฒนาเฉลี่ย</th>
                  </tr>
                </thead>
                <tbody>
                  {classStats.map((stat, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-medium">{stat.className}</td>
                      <td className="p-3 text-right">{stat.students}</td>
                      <td className="p-3 text-right">{stat.tested}</td>
                      <td className="p-3 text-right">
                        {((stat.tested / stat.students) * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right text-green-600 font-semibold">
                        +{stat.avgImprovement.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

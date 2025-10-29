"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { AppShell } from "@/components/layout/app-shell";
import { InstructorDashboard } from "@/components/instructor/instructor-dashboard";
import { useSession } from "@/providers/session-provider";
import { useGlobalLoading } from "@/providers/loading-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyStateEnhanced } from "@/components/ui/empty-state-enhanced";
import { LoadingState } from "@/components/ui/loading-spinner";
import { OnboardingTour, useOnboarding } from "@/components/ui/onboarding-tour";
import { useToast } from "@/providers/toast-provider";
import { ResultTable } from "@/components/dashboard/result-table";
import { EvaluationBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HelpDialog } from "@/components/ui/help-dialog";
import { StudentHelpContent } from "@/lib/help-content-student";
import { api } from "@/lib/api";
import { cn, formatNumber, formatTestName, downloadRawCsv } from "@/lib/utils";
import type { SessionPayload, StudentDashboardPayload, TestResult, TestType } from "@/lib/types";
import { differenceInDays, differenceInYears, format } from "date-fns";
import { enhanceTestResultWithManualStandard } from "@/lib/manual-standards";
import { th } from "date-fns/locale";
import { Alert } from "@/components/ui/alert";
import { useApiSWR } from "@/lib/use-api-swr";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();

  useEffect(() => {
    if (!isRestoring && !session?.user) {
      router.replace("/");
    }
  }, [isRestoring, session, router]);

  if (isRestoring) {
    return (
      <AppShell title="กำลังโหลด...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!session?.user) {
    return null;
  }

  const dashboardTitle =
    session.user.role === "instructor"
      ? "Dashboard อาจารย์"
      : session.user.role === "athlete"
        ? "Dashboard นักกีฬา"
        : "Dashboard นักเรียน";

  return (
    <AppShell title={dashboardTitle}>
      {session.user.role === "instructor" ? (
        <InstructorDashboard />
      ) : (
        <StudentDashboard session={session} />
      )}
    </AppShell>
  );
}

/* ---------------------- Student Dashboard (client) ---------------------- */

const STUDENT_TEST_ORDER: TestType[] = ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"];
const STUDENT_TEST_ROUTES: Record<TestType, string> = {
  bmi: "/tests/bmi",
  sit_and_reach: "/tests/flexibility",
  hand_grip: "/tests/strength",
  chair_stand: "/tests/chair-stand",
  step_up: "/tests/endurance",
};

interface TestCardConfig {
  test: TestType;
  title: string;
  subtitle: string;
  icon: string;
  iconGradient: string;
  hoverBorder: string;
  unit?: string;
  decimals?: number;
  rawUnit?: string;
  rawDecimals?: number;
}

// ปรับชื่อให้เข้าใจง่ายสำหรับคนไม่คุ้นเทค
const TEST_CARD_CONFIG: TestCardConfig[] = [
  {
    test: "bmi",
    title: "ดัชนีมวลกาย",
    subtitle: "BMI",
    icon: "⚖️",
    iconGradient: "from-blue-500/20 to-blue-600/20",
    hoverBorder: "hover:border-blue-500/20",
    unit: "",
    decimals: 1,
  },
  {
    test: "sit_and_reach",
    title: "ความยืดหยุ่น",
    subtitle: "นั่งงอตัว",
    icon: "🤸",
    iconGradient: "from-green-500/20 to-green-600/20",
    hoverBorder: "hover:border-green-500/20",
    unit: "ซม.",
    decimals: 0,
  },
  {
    test: "hand_grip",
    title: "แรงบีบมือ",
    subtitle: "กำลังกล้ามเนื้อ",
    icon: "💪",
    iconGradient: "from-red-500/20 to-red-600/20",
    hoverBorder: "hover:border-red-500/20",
    unit: "",
    decimals: 1,
    rawUnit: "กก.",
    rawDecimals: 0,
  },
  {
    test: "chair_stand",
    title: "ลุกยืนนั่ง",
    subtitle: "ความทนทาน",
    icon: "🪑",
    iconGradient: "from-purple-500/20 to-purple-600/20",
    hoverBorder: "hover:border-purple-500/20",
    unit: "ครั้ง",
    decimals: 0,
  },
  {
    test: "step_up",
    title: "ขึ้นลงบันได",
    subtitle: "ความอดทน",
    icon: "🏃",
    iconGradient: "from-orange-500/20 to-orange-600/20",
    hoverBorder: "hover:border-orange-500/20",
    unit: "ครั้ง",
    decimals: 0,
  },
];

function toValidDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getValidTime(value?: string | null) {
  const date = toValidDate(value);
  return date ? date.getTime() : 0;
}

function safeFormatDate(value?: string | null, fmt = "d MMM yyyy", fallback = "ยังไม่มีข้อมูล") {
  const date = toValidDate(value);
  if (!date) return fallback;
  try {
    return format(date, fmt, { locale: th });
  } catch {
    return fallback;
  }
}

function StudentDashboard({
  session,
}: {
  session: SessionPayload | null;
}) {
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { hasSeenTour, markAsComplete } = useOnboarding("student_dashboard");

  const { data, error, isLoading, mutate } = useApiSWR<StudentDashboardPayload>(
    "student-dashboard",
    (token) => api.getStudentDashboard(token)
  );

  const computedAge = useMemo(() => {
    const birthdate = session?.user?.birthdate;
    if (!birthdate) return undefined;
    const parsed = new Date(birthdate);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return differenceInYears(new Date(), parsed);
  }, [session?.user?.birthdate]);

  const processedData = useMemo(() => {
    if (!data) return null;
    if (!session?.user?.gender || typeof computedAge !== "number") {
      return data;
    }

    const enhance = (result: TestResult) =>
      enhanceTestResultWithManualStandard(result, {
        gender: session.user.gender,
        age: computedAge,
        role: session.user.role,
      });

    const enhancedResults = data.results.map(enhance);
    const enhancedHistoryByTest = Object.fromEntries(
      (Object.entries(data.historyByTest) as Array<[TestType, TestResult[]]>).map(
        ([test, history]) => [test, history.map(enhance)],
      ),
    ) as StudentDashboardPayload["historyByTest"];

    return {
      ...data,
      results: enhancedResults,
      historyByTest: enhancedHistoryByTest,
    };
  }, [data, session?.user?.gender, computedAge, session?.user?.role]);

  const dashboardData = processedData ?? data;

  const latestByTest = useMemo(() => {
    const result: Partial<Record<TestType, TestResult>> = {};
    if (!dashboardData?.historyByTest) return result;
    (Object.keys(dashboardData.historyByTest) as TestType[]).forEach((test) => {
      const history = dashboardData.historyByTest[test];
      if (history?.length) {
        const sorted = [...history].sort(
          (a, b) => getValidTime(b.recordedAt) - getValidTime(a.recordedAt)
        );
        result[test] = sorted[0];
      }
    });
    return result;
  }, [dashboardData?.historyByTest]);

  const recentResults = useMemo(() => {
    if (!dashboardData?.results?.length) return [] as TestResult[];
    return [...dashboardData.results]
      .sort((a, b) => getValidTime(b.recordedAt) - getValidTime(a.recordedAt))
      .slice(0, 6);
  }, [dashboardData?.results]);

  const hasTestData = (dashboardData?.results?.length ?? 0) > 0;

  const testsNeedingUpdate = useMemo(() => {
    return STUDENT_TEST_ORDER.filter((test) => {
      const latest = latestByTest[test];
      if (!latest) return true;
      const recordedDate = toValidDate(latest.recordedAt);
      if (!recordedDate) return true;
      return differenceInDays(new Date(), recordedDate) >= 30;
    });
  }, [latestByTest]);

  // ลบ progressInsights และ focusAreas ที่ซับซ้อน - ไม่จำเป็นสำหรับผู้ใช้ทั่วไป

  const handleNavigateToTest = useCallback(
    (testType: TestType) => {
      router.push(STUDENT_TEST_ROUTES[testType] ?? "/dashboard/tests");
    },
    [router],
  );

  const handleNavigateToComparison = useCallback(() => {
    router.push("/comparison");
  }, [router]);

  const handleNavigateToStandards = useCallback(() => {
    router.push("/standards");
  }, [router]);

  const handleExportCsv = useCallback(async () => {
    if (!session?.user) return;
    try {
      showLoading("กำลังเตรียมไฟล์ CSV...");
      const measurements = session?.token ? await api.getBodyMeasurements(session.token) : undefined;

      const name = session.user.fullName || session.user.email || "นักเรียน";
      const now = new Date();
      const classTitle = session.user.className || "รายบุคคล";
      const filename = `รายงานนักเรียน_${name.replace(/\s+/g, "-")}_${now.toISOString().slice(0,10)}.csv`;

      const lines: string[][] = [];
      
      // === หัวรายงานแบบกลุ่ม ===
      lines.push([`=== สรุปสถิติกลุ่มเรียน ${classTitle} ===`]);
      lines.push([]);

      // ข้อมูลเฉลี่ย (เป็นข้อมูลของนักเรียนคนเดียว)
      const fmt = (n?: number) => (typeof n === "number" && Number.isFinite(n) ? n.toFixed(1) : "-");
      const getMetricValue = (test: TestType) => {
        const latest = latestByTest[test];
        return latest ? (latest.derivedValue ?? latest.value) : undefined;
      };
      
      lines.push(["ข้อมูลเฉลี่ย", "ค่า"]);
      lines.push(["Muscular Strength", fmt(getMetricValue("hand_grip"))]);
      lines.push(["Muscular Endurance", fmt(getMetricValue("chair_stand"))]);
      lines.push(["Flexibility", fmt(getMetricValue("sit_and_reach"))]);
      lines.push(["%Fat", fmt(getMetricValue("bmi"))]);  // %Fat = BMI
      lines.push(["Cardio - Respiatory Endurance", fmt(getMetricValue("step_up"))]);
      lines.push(["อายุเฉลี่ย", computedAge != null ? Math.round(computedAge).toString() : "-"]);
      lines.push(["จำนวนนักเรียนทั้งหมด", "1"]);
      lines.push(["นักเรียนที่มีผลงานโดดเด่น", name]);
      lines.push(["นักเรียนที่ต้องดูแลเพิ่มเติม", name]);
      lines.push([]);

      // แถวหัวข้อกลุ่ม
      lines.push([
        "ข้อมูลผู้ประเมิน",
        "",
        "",
        "",
        "สมรรถภาพทางกาย",
        ...Array(9).fill(""),
        "สัดส่วนร่างกาย",
        ...Array(19).fill(""),
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

      // แถวข้อมูลนักเรียน
      const genderTh = session.user.gender === "male" ? "ชาย" : "หญิง";
      const age = computedAge != null ? String(Math.round(computedAge)) : "";
      
      // วันที่ทดสอบล่าสุด (รูปแบบไทย)
      const latestDate = (() => {
        const all = Object.values(latestByTest) as TestResult[];
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

      // ใช้สัดส่วนร่างกายล่าสุด (ก่อน/หลัง อันที่ใหม่กว่า)
      const latestMeasurement = (() => {
        if (!measurements) return null;
        const before = measurements.before?.recordedAt ? new Date(measurements.before.recordedAt) : null;
        const after = measurements.after?.recordedAt ? new Date(measurements.after.recordedAt) : null;
        if (before && after) {
          return after.getTime() >= before.getTime() ? measurements.after : measurements.before;
        } else if (after) {
          return measurements.after;
        } else if (before) {
          return measurements.before;
        }
        return null;
      })();
      
      // คำนวณระดับผลงานรวม
      const overallLevel = (() => {
        const all = Object.values(latestByTest) as TestResult[];
        const scoreEval = (e: string) => {
          if (!e) return 0;
          if (/(ดีมาก|excellent)/i.test(e)) return 4;
          if (/(ดี|good)/i.test(e)) return 3;
          if (/(ปานกลาง|average)/i.test(e)) return 2;
          if (/(ต้องพัฒนา|needs)/i.test(e)) return 1;
          return 0;
        };
        const totalScore = all.reduce((s, r) => s + scoreEval(r?.evaluation ?? ""), 0);
        if (totalScore >= 12) return "ดีมาก";
        if (totalScore >= 9) return "ดี";
        if (totalScore >= 6) return "ปานกลาง";
        return "ต้องพัฒนา";
      })();

      const row = [
        name,
        session.user.email || "",
        age,
        genderTh,
        fmt(getMetricValue("hand_grip")),
        latestByTest.hand_grip?.evaluation || "",
        fmt(getMetricValue("chair_stand")),
        latestByTest.chair_stand?.evaluation || "",
        fmt(getMetricValue("sit_and_reach")),
        latestByTest.sit_and_reach?.evaluation || "",
        fmt(getMetricValue("bmi")),
        "",  // %Fat ไม่มีผลการประเมิน
        fmt(getMetricValue("step_up")),
        latestByTest.step_up?.evaluation || "",
        // สัดส่วนร่างกาย
        (latestMeasurement?.weight ?? "").toString(),
        (latestMeasurement?.height ?? "").toString(),
        (latestMeasurement?.pulse ?? "").toString(),
        (latestMeasurement?.neck ?? "").toString(),
        (latestMeasurement?.shoulderRight ?? "").toString(),
        (latestMeasurement?.shoulderLeft ?? "").toString(),
        (latestMeasurement?.upperArmRight ?? "").toString(),
        (latestMeasurement?.upperArmLeft ?? "").toString(),
        (latestMeasurement?.wristRight ?? "").toString(),
        (latestMeasurement?.wristLeft ?? "").toString(),
        (latestMeasurement?.chest ?? "").toString(),
        (latestMeasurement?.abdomen ?? "").toString(),
        (latestMeasurement?.waist ?? "").toString(),
        (latestMeasurement?.hip ?? "").toString(),
        (latestMeasurement?.thighRight ?? "").toString(),
        (latestMeasurement?.thighLeft ?? "").toString(),
        (latestMeasurement?.calfRight ?? "").toString(),
        (latestMeasurement?.calfLeft ?? "").toString(),
        (latestMeasurement?.ankleRight ?? "").toString(),
        (latestMeasurement?.ankleLeft ?? "").toString(),
        overallLevel,
        latestDate,
      ];
      lines.push(row);

      downloadRawCsv(lines, filename);
    } catch (e) {
      console.error(e);
    } finally {
      hideLoading();
    }
  }, [session?.user, session?.token, computedAge, latestByTest, showLoading, hideLoading]);

  // ทำ nextActions ให้เรียบง่าย - แค่ปุ่มหลักๆ ที่จำเป็น
  const nextActions = useMemo(() => {
    const actions: Array<{
      title: string;
      description: string;
      cta: string;
      onClick: () => void;
    }> = [];

    // แสดงแค่ 2 tests ที่ต้องอัปเดต
    testsNeedingUpdate.slice(0, 2).forEach((test) => {
      const latest = latestByTest[test];
      if (!latest) {
        actions.push({
          title: `ยังไม่เคยบันทึก ${formatTestName(test)}`,
          description: "เริ่มบันทึกผลครั้งแรก",
          cta: "บันทึกตอนนี้",
          onClick: () => handleNavigateToTest(test),
        });
      } else {
        const days = differenceInDays(new Date(), new Date(latest.recordedAt));
        actions.push({
          title: `${formatTestName(test)} ผ่านมา ${days} วัน`,
          description: "ควรบันทึกผลใหม่",
          cta: "อัปเดตผล",
          onClick: () => handleNavigateToTest(test),
        });
      }
    });

    return actions.slice(0, 2);
  }, [
    testsNeedingUpdate,
    latestByTest,
    handleNavigateToTest,
  ]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordStatus(null);

    if (!session?.token) {
      setPasswordStatus({ type: "error", message: "ต้องเข้าสู่ระบบก่อนจึงจะเปลี่ยนรหัสผ่านได้" });
      return;
    }
    if (!currentPassword || !newPassword) {
      setPasswordStatus({ type: "error", message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "กรุณายืนยันรหัสผ่านใหม่ให้ตรงกัน" });
      return;
    }

    try {
      setChangingPassword(true);
      showLoading("กำลังเปลี่ยนรหัสผ่าน...");
      const response = await api.changePassword(session.token, {
        currentPassword,
        newPassword,
      });
      setPasswordStatus({
        type: "success",
        message: response.message ?? "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setPasswordStatus({
        type: "error",
        message: err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนรหัสผ่านได้",
      });
    } finally {
      hideLoading();
      setChangingPassword(false);
    }
  };

  // Onboarding tour steps
  const tourSteps = [
    {
      target: "welcome-card",
      title: "ยินดีต้อนรับ! 🎉",
      description: "นี่คือหน้า Dashboard ของคุณ ที่นี่คุณจะเห็นผลการทดสอบและความก้าวหน้าทั้งหมด",
    },
    {
      target: "test-cards",
      title: "การ์ดทดสอบ 📝",
      description: "กดที่การ์ดเพื่อบันทึกผลการทดสอบแต่ละรายการ ง่ายๆ แค่กรอกข้อมูลและกดบันทึก",
    },
    {
      target: "results",
      title: "ดูผลการทดสอบ 📊",
      description: "ผลล่าสุดจะแสดงที่นี่ พร้อมผลประเมินตามเกณฑ์มาตรฐาน",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding Tour */}
      {!hasSeenTour && (
        <OnboardingTour
          steps={tourSteps}
          onComplete={markAsComplete}
          onSkip={markAsComplete}
        />
      )}

      {/* ใช้การ์ดต้อนรับแบบง่ายๆ ขนาดใหญ่กว่า อ่านง่ายบนมือถือ */}
      <Card 
        id="welcome-card"
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 sm:p-8 border-0 shadow-lg"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          สวัสดี 👋
        </h1>
        <p className="text-lg sm:text-xl opacity-95 mb-2">
          {session?.user?.fullName || session?.user?.email?.split("@")[0] || "นักเรียน"}
        </p>
        <p className="text-base opacity-90">
          พร้อมบันทึกผลการทดสอบสมรรถภาพหรือยัง?
        </p>
      </Card>

      {error && (
        <Alert
          variant="error"
          message={error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้"}
        />
      )}

      {/* ปุ่มใหญ่ขึ้นสำหรับมือถือ */}
      <div className="flex flex-col sm:flex-row gap-3 justify-start sm:justify-end">
        <HelpDialog
          title="คู่มือการใช้งาน"
          content={StudentHelpContent.dashboard}
        />
        <Button
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto text-base py-6 sm:py-3"
          onClick={handleExportCsv}
          disabled={isLoading}
        >
          ส่งออก CSV
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full sm:w-auto text-base py-6 sm:py-3"
          onClick={() => mutate()}
          disabled={isLoading}
        >
          🔄 รีเฟรชข้อมูล
        </Button>
      </div>


      <div 
        id="test-cards"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {TEST_CARD_CONFIG.map((card) => {
          const latest = latestByTest[card.test];
          const numericDisplay =
            latest !== undefined ? Number(latest.derivedValue ?? latest.value) : undefined;
          const hasNumericDisplay =
            typeof numericDisplay === "number" && Number.isFinite(numericDisplay);
          const formattedValue = hasNumericDisplay
            ? formatNumber(
                numericDisplay,
                card.decimals ?? (Number.isInteger(numericDisplay) ? 0 : 2),
              )
            : null;
          const rawValue = latest !== undefined ? Number(latest.value) : undefined;
          const showRawValue =
            Boolean(
              card.rawUnit &&
                typeof latest?.derivedValue === "number" &&
                typeof rawValue === "number" &&
                Number.isFinite(rawValue) &&
                latest.derivedValue !== rawValue,
            );
          const formattedRawValue =
            showRawValue && typeof rawValue === "number"
              ? formatNumber(
                  rawValue,
                  card.rawDecimals ?? (Number.isInteger(rawValue) ? 0 : 2),
                )
              : null;
          const recordedLabel = latest
            ? safeFormatDate(latest.recordedAt, "d MMM yyyy HH:mm", "-")
            : undefined;

          return (
            <Card
              key={card.test}
              className={cn(
                "group cursor-pointer border-2 p-5 sm:p-6 transition-all duration-200 hover:shadow-lg",
                card.hoverBorder,
              )}
              onClick={() => handleNavigateToTest(card.test)}
            >
              {/* ไอคอนและหัวข้อ - ขนาดใหญ่ขึ้น */}
              <div className="mb-5 flex items-center space-x-4">
                <div
                  className={cn(
                    "flex h-16 w-16 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-r shadow-sm transition-all duration-200 group-hover:scale-105",
                    card.iconGradient,
                  )}
                >
                  <span className="text-3xl sm:text-2xl">{card.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-base font-bold text-primary">{card.title}</h3>
                  <p className="text-sm text-muted">{card.subtitle}</p>
                </div>
              </div>

              {latest ? (
                <div className="rounded-2xl border-2 border-border/50 bg-surface px-5 py-4 text-left mb-4">
                  <p className="text-sm text-muted mb-2">ผลล่าสุด</p>
                  {formattedValue ? (
                    <p className="text-3xl sm:text-2xl font-bold text-primary">
                      {formattedValue}
                      {card.unit ? (
                        <span className="ml-2 text-base font-medium text-muted">{card.unit}</span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-primary">-</p>
                  )}
                  {showRawValue && formattedRawValue ? (
                    <p className="mt-2 text-sm text-muted">
                      ค่าที่วัดได้ {formattedRawValue} {card.rawUnit}
                    </p>
                  ) : null}
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-sm font-medium text-primary mb-1">
                      ผลประเมิน: <span className="font-bold">{latest.evaluation || "-"}</span>
                    </p>
                    <p className="text-xs text-muted">
                      บันทึกล่าสุด {recordedLabel}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-border/50 bg-surface/50 px-5 py-6 text-center mb-4">
                  <p className="text-base text-muted font-medium">
                    ยังไม่มีข้อมูล
                  </p>
                  <p className="text-sm text-muted mt-1">
                    กดปุ่มด้านล่างเพื่อเริ่มบันทึก
                  </p>
                </div>
              )}

              <Button
                variant="secondary"
                size="lg"
                className="w-full text-base py-6 sm:py-3 font-semibold"
                onClick={(event) => {
                  event.stopPropagation();
                  handleNavigateToTest(card.test);
                }}
              >
                {latest ? "📝 บันทึกใหม่" : "▶️ เริ่มทดสอบ"}
              </Button>
            </Card>
          );
        })}

        {/* การ์ด: บันทึกสัดส่วนร่างกาย */}
        <Card
          className={cn(
            "group cursor-pointer border-2 p-5 sm:p-6 transition-all duration-200 hover:shadow-lg",
            "hover:border-blue-500/20",
          )}
          onClick={() => router.push("/tests/body-measurements")}
        >
          <div className="mb-5 flex items-center space-x-4">
            <div className="flex h-16 w-16 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 shadow-sm transition-all duration-200 group-hover:scale-105">
              <span className="text-3xl sm:text-2xl">📏</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-base font-bold text-primary">สัดส่วนร่างกาย</h3>
              <p className="text-sm text-muted">บันทึก 19 รายการ รอบคอ-เอว-สะโพก ฯลฯ</p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-border/50 bg-surface/50 px-5 py-6 text-center mb-4">
            <p className="text-base text-muted font-medium">ยังไม่มีข้อมูลหรืออยากอัปเดต</p>
            <p className="text-sm text-muted mt-1">กดเพื่อไปหน้าบันทึกสัดส่วน</p>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full text-base py-6 sm:py-3 font-semibold"
            onClick={(event) => {
              event.stopPropagation();
              router.push("/tests/body-measurements");
            }}
          >
            📝 บันทึกสัดส่วน
          </Button>
        </Card>
      </div>

      {/* ลดรายละเอียดผลลัพธ์ - แสดงเฉพาะที่จำเป็น */}
      <div id="results" className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 ผลการทดสอบล่าสุด</h2>
        {isLoading && !dashboardData ? (
          <LoadingState message="กำลังโหลดข้อมูล กรุณารอสักครู่..." />
        ) : !hasTestData ? (
          <EmptyStateEnhanced
            icon="📝"
            title="ยังไม่มีข้อมูลการทดสอบ"
            description="เริ่มบันทึกผลการทดสอบครั้งแรกของคุณ เพื่อติดตามความก้าวหน้า"
            actionLabel="▶️ เริ่มทดสอบแรก"
            onAction={() => handleNavigateToTest("bmi")}
            secondaryActionLabel="ดูคู่มือ"
            onSecondaryAction={() => router.push("/help")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STUDENT_TEST_ORDER.map((test) => {
              const latest = latestByTest[test];
              return (
                <Card key={test} className="p-6 flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-primary">{formatTestName(test)}</h3>
                      <p className="text-xs text-muted">{safeFormatDate(latest?.recordedAt)}</p>
                    </div>
                    <div className="flex items-center sm:justify-end">
                      {latest ? (
                        <EvaluationBadge value={latest.evaluation} />
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </div>
                  </div>
                  {latest ? (
                    <div>
                      <p className="text-3xl font-semibold text-primary">
                        {formatNumber(latest.derivedValue ?? latest.value)}
                      </p>
                      <p className="text-xs text-muted">ค่าที่วัดได้ {formatNumber(latest.value)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">บันทึกผลเพื่อเริ่มติดตามรายการนี้</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-stretch sm:self-start"
                    onClick={() => handleNavigateToTest(test)}
                  >
                    บันทึกผลรายการนี้
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ลบส่วน "ประวัติการบันทึกล่าสุด" และ "ไฮไลต์ความก้าวหน้า" - ซ้ำซ้อนและซับซ้อน */}

      {/* ลบ Progress Insights และ Focus Areas ออก - ทำให้ยุ่งยากเกินไป */}

      {/* แสดงปุ่มแนะนำเฉพาะเมื่อมี */}
      {nextActions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">📌 สิ่งที่ควรทำต่อไป</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {nextActions.map((item, index) => (
              <Card 
                key={`${item.title}-${index}`}
                className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={item.onClick}
              >
                <p className="font-semibold text-primary text-base mb-2">{item.title}</p>
                <p className="text-sm text-muted mb-4">{item.description}</p>
                <Button variant="secondary" size="sm" className="w-full">
                  {item.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">จัดการบัญชีผู้ใช้</h2>
        <Card className="p-6">
          <p className="text-sm text-muted mb-4">
            เปลี่ยนรหัสผ่านเพื่อความปลอดภัย แนะนำให้เลือกรหัสผ่านที่มีตัวอักษร ตัวเลข หรือสัญลักษณ์ผสมกัน
          </p>
          {passwordStatus && (
            <Alert variant={passwordStatus.type === "success" ? "info" : "error"} message={passwordStatus.message} className="mb-4" />
          )}
          <form onSubmit={handlePasswordChange} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-primary">รหัสผ่านปัจจุบัน</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-primary">รหัสผ่านใหม่</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-primary">ยืนยันรหัสผ่านใหม่</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                required
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <Button type="submit" loading={changingPassword} disabled={changingPassword}>
                บันทึกรหัสผ่านใหม่
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">ทรัพยากรเพิ่มเติม</h2>
        <Card className="p-6">
          <div className="flex flex-col gap-2 text-sm text-muted">
            <p>• ตรวจสอบเกณฑ์การประเมินจากกรมพลศึกษาได้ที่หน้าดูเกณฑ์มาตรฐาน</p>
            <p>• หากบันทึกค่าผิด สามารถกดบันทึกผลใหม่ ระบบจะอัปเดตผลล่าสุดให้โดยอัตโนมัติ</p>
            <div>
              <Button variant="ghost" onClick={handleNavigateToStandards}>
                เปิดหน้าดูเกณฑ์มาตรฐาน
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

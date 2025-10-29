"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { z } from "zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/providers/toast-provider";
import { ComparisonCard } from "@/components/body-measurements/comparison-card";
import { api } from "@/lib/api";
import { useSession } from "@/providers/session-provider";
import { cn } from "@/lib/utils";
import {
  BODY_MEASUREMENT_CATEGORIES,
  BODY_MEASUREMENT_FIELDS,
  buildBodyMeasurementComparison,
  getInitialMeasurementValues,
  getInitialMeasurementFormValues,
  mergeTestResultsWithBodyMeasurements,
  summarizeBodyMeasurementComparison,
  type BodyMeasurementCategory,
  type BodyMeasurementComparisonRow,
} from "@/lib/body-measurements";
import type {
  BodyMeasurementPhase,
  BodyMeasurementResponse,
  BodyMeasurementValueMap,
  TestResult,
} from "@/lib/types";
import { Lightbulb, Ruler, ClipboardCheck, Shield, ChevronDown, HelpCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Form values จะเป็น string เพราะ input field ใช้ string
type BodyMeasurementFormValues = {
  [K in keyof BodyMeasurementValueMap]: K extends "notes" 
    ? string 
    : string; // ทุกฟิลด์ที่ไม่ใช่ notes จะเป็น string (สำหรับ input)
} & FieldValues;

const numberField = (max = 400) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      if (typeof value === "string") {
        const normalized = value.replace(/,/g, ".");
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : value;
      }
      return value;
    },
    z
      .number({ message: "กรุณากรอกตัวเลข" })
      .min(-200, "ค่าต้องไม่ต่ำกว่า -200")
      .max(max, `ค่าต้องไม่เกิน ${max}`)
      .optional(),
  );

const measurementSchemaShape: Record<string, z.ZodTypeAny> = {};

BODY_MEASUREMENT_FIELDS.forEach((field) => {
  if (field.type === "single") {
    measurementSchemaShape[field.key] = numberField();
  } else {
    measurementSchemaShape[field.keys.left] = numberField();
    measurementSchemaShape[field.keys.right] = numberField();
  }
});

measurementSchemaShape.notes = z
  .string()
  .max(500, "จำกัด 500 ตัวอักษร")
  .optional()
  .or(z.literal(""));

const bodyMeasurementFormSchema = z.object(measurementSchemaShape);

const CATEGORY_ORDER: BodyMeasurementCategory[] = ["fitness", "vital", "circumference"];

const GROUPED_FIELDS = CATEGORY_ORDER.map((category) => ({
  category,
  title: BODY_MEASUREMENT_CATEGORIES[category],
  fields: BODY_MEASUREMENT_FIELDS.filter((field) => field.category === category),
}));

const CATEGORY_DESCRIPTIONS: Record<BodyMeasurementCategory, string> = {
  fitness: "วัดสมรรถภาพทางกายหลัก เช่น แรง กล้ามเนื้อ ความยืดหยุ่น และระบบไหลเวียน",
  vital: "ข้อมูลพื้นฐานของร่างกายและสัญญาณชีพที่สะท้อนสุขภาพโดยรวม",
  circumference: "วัดรอบสัดส่วนสำคัญเพื่อติดตามการเปลี่ยนแปลงรูปร่างอย่างละเอียด",
};

function safeFormatDate(value?: string | null, formatString = "d MMM yyyy", fallback = "ยังไม่มีข้อมูล") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  try {
    return format(date, formatString, { locale: th });
  } catch {
    return fallback;
  }
}

interface FormCardProps {
  phase: BodyMeasurementPhase;
  initialValues: BodyMeasurementFormValues;
  lastSaved?: string | null;
  disabled?: boolean;
  loading?: boolean;
  helperContent?: ReactNode;
  locked?: boolean;
  lockedReason?: string;
  onSubmit: (
    values: BodyMeasurementFormValues,
  ) => Promise<BodyMeasurementResponse | void>;
}

export default function BodyMeasurementsPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();
  const isInstructor = session?.user?.role === "instructor";
  const shouldBlockAccess = isInstructor;
  const token = session?.token;
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  useEffect(() => {
    if (!isRestoring && !session?.user) {
      router.replace("/");
    }
  }, [isRestoring, session, router]);

  useEffect(() => {
    if (!isRestoring && shouldBlockAccess) {
      router.replace("/dashboard");
    }
  }, [isRestoring, shouldBlockAccess, router]);

  type BodyMeasurementKey = readonly ["body-measurements", string];
  const key: BodyMeasurementKey | null = token && !shouldBlockAccess
    ? (["body-measurements", token] as BodyMeasurementKey)
    : null;

  type TestResultKey = readonly ["test-results", string];
  const testResultKey: TestResultKey | null = token && !shouldBlockAccess
    ? (["test-results", token] as TestResultKey)
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    BodyMeasurementResponse,
    Error,
    BodyMeasurementKey | null
  >(
    key,
    ([, currentToken]: BodyMeasurementKey) => api.getBodyMeasurements(currentToken),
    { 
      revalidateOnFocus: false,
      // เพิ่ม debug สำหรับการโหลดข้อมูล
      onSuccess: (data) => {
        if (process.env.NODE_ENV === "development") {
          console.log("SWR loaded body measurements:", data);
        }
      }
    },
  );

  const { data: testResults, error: testError } = useSWR<
    TestResult[],
    Error,
    TestResultKey | null
  >(
    testResultKey,
    ([, currentToken]: TestResultKey) => api.getTestResults(currentToken),
    { 
      revalidateOnFocus: false,
      onSuccess: (data) => {
        if (process.env.NODE_ENV === "development") {
          console.log("SWR loaded test results:", data);
        }
      }
    },
  );

  const handleSubmit = async (
    phase: BodyMeasurementPhase,
    values: BodyMeasurementFormValues,
  ) => {
    if (!token) {
      throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล");
    }

    // แปลงข้อมูลจาก string form values เป็น number สำหรับ API (typed)
    const convertedValues: Partial<BodyMeasurementValueMap> = {};

    BODY_MEASUREMENT_FIELDS.forEach((field) => {
      if (field.type === "single") {
        const key = field.key as keyof BodyMeasurementValueMap;
        const value = values[key as keyof BodyMeasurementFormValues];
        // @ts-expect-error dynamic key assignment within union
        convertedValues[key] = value && String(value).trim() !== "" ? Number(value) : null;
      } else {
        const leftKey = field.keys.left as keyof BodyMeasurementValueMap;
        const rightKey = field.keys.right as keyof BodyMeasurementValueMap;
        const leftValue = values[leftKey as keyof BodyMeasurementFormValues];
        const rightValue = values[rightKey as keyof BodyMeasurementFormValues];
        // @ts-expect-error dynamic key assignment within union
        convertedValues[leftKey] = leftValue && String(leftValue).trim() !== "" ? Number(leftValue) : null;
        // @ts-expect-error dynamic key assignment within union
        convertedValues[rightKey] = rightValue && String(rightValue).trim() !== "" ? Number(rightValue) : null;
      }
    });

    convertedValues.notes = values.notes || null;

  // Removed verbose debug logs

    const payload = await api.recordBodyMeasurements(
      token,
      phase,
      convertedValues as BodyMeasurementValueMap,
    );
    mutate(payload, false);
    return payload;
  };

  const hasAnyData = Boolean(data?.before || data?.after);

  const comparisonRows = useMemo(() => {
    if (!data) return [] as BodyMeasurementComparisonRow[];
    return buildBodyMeasurementComparison(data);
  }, [data]);

  const summary = useMemo(
    () => summarizeBodyMeasurementComparison(comparisonRows),
    [comparisonRows],
  );

  const beforeMeasurements = mergeTestResultsWithBodyMeasurements(data?.before, testResults);
  const isBeforeComplete = useMemo(() => {
    if (!beforeMeasurements) return false;
    return BODY_MEASUREMENT_FIELDS.every((field) => {
      if (field.type === "single") {
        const value = beforeMeasurements[field.key];
        return typeof value === "number" && !Number.isNaN(value);
      }
      const left = beforeMeasurements[field.keys.left];
      const right = beforeMeasurements[field.keys.right];
      return (
        typeof left === "number" &&
        !Number.isNaN(left) &&
        typeof right === "number" &&
        !Number.isNaN(right)
      );
    });
  }, [beforeMeasurements]);

  const [activePhase, setActivePhase] = useState<BodyMeasurementPhase>("before");

  const beforeHelperContent = (
    <ul className="mt-3 space-y-2 rounded-xl bg-surface-strong/60 p-3 text-xs text-muted">
      <li>• วัดในช่วงเวลาเดียวกันทุกครั้งเพื่อเทียบผลได้ง่าย</li>
      <li>• ให้เพื่อนหรือผู้ปกครองช่วยจดค่าเพื่อลดความคลาดเคลื่อน</li>
      <li>• หากบันทึกพลาดสามารถแก้ไขและกดบันทึกซ้ำได้ทันที</li>
    </ul>
  );

  const afterHelperContent = (
    <ul className="mt-3 space-y-2 rounded-xl bg-surface-strong/60 p-3 text-xs text-muted">
      <li>• พักหัวใจให้เต้นสงบเสมอก่อนวัดหลังเรียน 3-5 นาที</li>
      <li>• ใช้อุปกรณ์และตำแหน่งเดียวกับช่วงก่อนเรียนเพื่อความแม่นยำ</li>
      <li>• เปรียบเทียบกับค่าก่อนเรียนทันทีเพื่อวางแผนปรับปรุง</li>
    </ul>
  );

  const beforeLastSavedLabel = safeFormatDate(
    data?.before?.recordedAt,
    "d MMM yyyy HH:mm",
    "ยังไม่บันทึก"
  );
  const afterLastSavedLabel = safeFormatDate(
    data?.after?.recordedAt,
    "d MMM yyyy HH:mm",
    "ยังไม่บันทึก"
  );

  const afterLocked = !token ? false : !isBeforeComplete;
  const afterLockedReason =
    !token || isLoading
      ? undefined
      : !isBeforeComplete
        ? "กรุณาบันทึกข้อมูล 'ก่อนเรียน' ให้ครบทั้ง 19 รายการก่อน จึงจะบันทึกผลหลังเรียนได้"
        : undefined;

  const currentPhase = activePhase;
  const currentData = currentPhase === "before" ? data?.before : data?.after;
  
  // รวมข้อมูลจาก TestResults เข้ากับ BodyMeasurements
  // แก้ไข: ถ้าไม่มี testResults ให้ใช้ข้อมูลจาก currentData เฉย ๆ
  const mergedData = testResults && testResults.length > 0 
    ? mergeTestResultsWithBodyMeasurements(currentData, testResults)
    : currentData;
  
  const currentInitialValues = getInitialMeasurementFormValues(mergedData) as BodyMeasurementFormValues;
  const currentLastSaved = currentPhase === "before" ? data?.before?.recordedAt : data?.after?.recordedAt;
  const currentHelperContent = currentPhase === "before" ? beforeHelperContent : afterHelperContent;
  const currentLocked = currentPhase === "after" ? afterLocked : false;
  const currentLockedMessage = currentPhase === "after" ? afterLockedReason : undefined;

  // Removed development-only console debug logs

  if (shouldBlockAccess) {
    return null;
  }

  return (
    <AppShell
      title="บันทึกสัดส่วนร่างกาย 19 รายการ"
      description="กรอกค่าก่อนเรียนและหลังเรียนเพื่อเปรียบเทียบพัฒนาการของร่างกาย"
      actions={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setHelpDialogOpen(true)}>
            <HelpCircle className="mr-2 h-4 w-4" />
            คู่มือ
          </Button>
          <Button variant="secondary" onClick={() => router.back()}>
            กลับ
          </Button>
          <Button onClick={() => router.push("/comparison")}>ดูหน้าสรุปเปรียบเทียบ</Button>
        </div>
      }
    >
      {(error || testError) && (
        <Alert
          variant="error"
          message={`ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง ${error ? '(Body Measurements)' : ''} ${testError ? '(Test Results)' : ''}`}
        />
      )}

      {!token && !isRestoring && (
        <Alert variant="warning" message="กรุณาเข้าสู่ระบบเพื่อบันทึกข้อมูล" />
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-start gap-3 rounded-2xl border border-border-strong/80 bg-surface-elevated p-4 shadow-sm">
          <span className="rounded-full bg-accent/10 p-2 text-accent">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-primary">เตรียมอุปกรณ์ให้พร้อม</h2>
            <p className="mt-1 text-sm text-muted">
              ตรวจเช็กสายวัด น้ำหนัก และแบบฟอร์มก่อนเริ่ม เพื่อเก็บข้อมูลได้ครบถ้วนและเปรียบเทียบผลได้ชัดเจน
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 rounded-2xl border border-border-strong/80 bg-surface-elevated p-4 shadow-sm">
          <span className="rounded-full bg-success/20 p-2 text-success">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-primary">ข้อมูลสมรรถภาพโหลดอัตโนมัติ</h2>
            <p className="mt-1 text-sm text-muted">
              ระบบจะดึงข้อมูล BMI, ความยืดหยุ่น, แรงบีบมือ และสมรรถภาพอื่นๆ ที่เคยทดสอบไว้มาแสดงอัตโนมัติ
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 rounded-2xl border border-border-strong/80 bg-surface-elevated p-4 shadow-sm">
          <span className="rounded-full bg-accent/20 p-2 text-accent">
            <Ruler className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-primary">ใช้จุดอ้างอิงเดียวกันทุกครั้ง</h2>
            <p className="mt-1 text-sm text-muted">
              วัดรอบเอว แขน และขาในตำแหน่งเดิม เพื่อให้ความเปลี่ยนแปลงสะท้อนผลการฝึกได้จริง
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 rounded-2xl border border-border-strong/80 bg-surface-elevated p-4 shadow-sm">
          <span className="rounded-full bg-error/20 p-2 text-error">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-primary">ทบทวนผลหลังบันทึก</h2>
            <p className="mt-1 text-sm text-muted">
              กดบันทึกแล้วตรวจสอบผลอีกครั้ง หากมีจุดผิดสามารถบันทึกทับใหม่ ระบบจะเก็บค่าล่าสุดเสมอ
            </p>
          </div>
        </Card>
      </section>

      <section className="mt-8 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">บันทึกข้อมูลสัดส่วน</h2>
            <p className="text-sm text-muted">
              เลือกช่วงเวลาที่ต้องการบันทึก ทั้งสองแบบฟอร์มบันทึกลงชีตเดียวกัน และหากต้องการเปิดอีกแบบฟอร์มพร้อมกันให้เปิดหน้านี้ในหน้าต่างใหม่
            </p>
          </div>
          <div className="flex gap-2 rounded-full bg-surface-strong/60 p-1">
            <Button
              size="sm"
              variant={activePhase === "before" ? "primary" : "ghost"}
              className={cn(
                "rounded-full px-5",
                activePhase === "before" ? "" : "text-muted hover:text-primary",
              )}
              onClick={() => setActivePhase("before")}
            >
              ก่อนเรียน
            </Button>
            <Button
              size="sm"
              variant={activePhase === "after" ? "primary" : "ghost"}
              className={cn(
                "rounded-full px-5",
                activePhase === "after" ? "" : "text-muted hover:text-primary",
              )}
              onClick={() => setActivePhase("after")}
            >
              หลังเรียน
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-full bg-surface px-3 py-1">
            ก่อนเรียน: {beforeLastSavedLabel}
            {data?.before && <span className="ml-2 text-green-600">✓ มีข้อมูล</span>}
          </span>
          <span className="rounded-full bg-surface px-3 py-1">
            หลังเรียน: {afterLastSavedLabel}
            {data?.after && <span className="ml-2 text-green-600">✓ มีข้อมูล</span>}
          </span>
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1">
            กำลังแสดง: {activePhase === "before" ? "ก่อนเรียน" : "หลังเรียน"}
          </span>
          {testResults && testResults.length > 0 && (
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1">
              ✓ ดึงข้อมูลจากการทดสอบ {testResults.length} รายการ
            </span>
          )}
          {(!testResults || testResults.length === 0) && (
            <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1">
              ⚠ ไม่พบข้อมูลการทดสอบ
            </span>
          )}
        </div>

        {/* Debug panel removed from UI */}

        <BodyMeasurementFormCard
          key={`${currentPhase}-${currentLastSaved || 'empty'}`}
          phase={currentPhase}
          initialValues={currentInitialValues}
          lastSaved={currentLastSaved}
          disabled={!token}
          loading={isLoading}
          locked={currentLocked}
          lockedReason={currentLockedMessage}
          helperContent={currentHelperContent}
          onSubmit={(values) => handleSubmit(currentPhase, values)}
        />
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-primary">
          สรุปการเปลี่ยนแปลงก่อนและหลังการเรียน
        </h2>
        {!hasAnyData ? (
          <EmptyState
            title="ยังไม่มีข้อมูลการวัด"
            description="กรุณาบันทึกข้อมูลอย่างน้อยหนึ่งช่วงเวลาเพื่อดูการเปรียบเทียบ"
            action={{
              label: "เริ่มบันทึกก่อนเรียน",
              onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted">รายการที่สามารถเปรียบเทียบได้</p>
                <p className="mt-2 text-3xl font-semibold text-primary">{summary.total}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted">ค่าที่เพิ่มขึ้น</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">
                  {summary.increase}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted">ค่าที่ลดลง</p>
                <p className="mt-2 text-3xl font-semibold text-rose-600">
                  {summary.decrease}
                </p>
                <p className="text-xs text-muted mt-1">คงที่ {summary.unchanged}</p>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {comparisonRows.map((row) => (
                <ComparisonCard key={row.id} row={row} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              คู่มือการวัดสัดส่วนร่างกาย
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-semibold text-base">📏 ตำแหน่งการวัดแต่ละส่วน</h3>
              <div className="space-y-4 pl-4">
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 รอบคอ:</p>
                  <p className="text-muted pl-4">วัดรอบคอบริเวณกลางคอ ไม่ตึงและไม่หย่อนเกินไป</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 หัวไหล่:</p>
                  <p className="text-muted pl-4">วัดรอบจุดนูนสุดของกระดูกไหล่ ห่างจากคอประมาณ 2-3 นิ้ว</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 แขนท่อนบน:</p>
                  <p className="text-muted pl-4">วัดรอบกล้ามเนื้อแขนใหญ่ที่สุด (biceps) โดยแขนผ่อนคลาย</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 ข้อมือ:</p>
                  <p className="text-muted pl-4">วัดรอบข้อมือที่ตำแหน่งกระดูกนูน</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 รอบอก:</p>
                  <p className="text-muted pl-4">ชาย: วัดรอบอกผ่านหัวนม | หญิง: วัดรอบอกตรงส่วนสูงสุด</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 หน้าท้อง:</p>
                  <p className="text-muted pl-4">วัดรอบตรงสะดือ ขณะหายใจออกปกติ</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 รอบเอว:</p>
                  <p className="text-muted pl-4">วัดรอบเอวส่วนที่เล็กที่สุด (เหนือสะดือ 2-3 นิ้ว)</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 รอบสะโพก:</p>
                  <p className="text-muted pl-4">วัดรอบสะโพกส่วนที่ใหญ่ที่สุด</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 ต้นขา:</p>
                  <p className="text-muted pl-4">วัดรอบต้นขาที่ตำแหน่งใต้ขาหนีบ 5-10 ซม.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 น่อง:</p>
                  <p className="text-muted pl-4">วัดรอบน่องที่ตำแหน่งกล้ามเนื้อนูนที่สุด</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-blue-600">🔸 ข้อเท้า:</p>
                  <p className="text-muted pl-4">วัดรอบข้อเท้าที่ตำแหน่งกระดูกนูน</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">✅ เคล็ดลับการวัดให้ถูกต้อง</h3>
              <div className="space-y-2 pl-4">
                <p>• <strong>ใช้สายวัดเดียวกัน</strong> และแนบกับผิวหนังโดยไม่ตึงเกินไป</p>
                <p>• <strong>วัดในตำแหน่งเดิมทุกครั้ง</strong> (ใช้จุดอ้างอิง เช่น รอยไฝ หรือกระดูกนูน)</p>
                <p>• <strong>วัดตอนเช้า</strong>หลังตื่นนอน ก่อนรับประทานอาหาร จะได้ค่าที่แม่นยำที่สุด</p>
                <p>• <strong>ผ่อนคลายกล้ามเนื้อ</strong> อย่าเกร็งขณะวัด</p>
                <p>• <strong>ยืนตรง</strong> ไม่หดท้อง แขนห้อยธรรมชาติ</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">📊 ข้อมูลสมรรถภาพ (BMI, แรงบีบมือ, ความยืดหยุ่น)</h3>
              <div className="space-y-2 pl-4">
                <p>• ระบบจะ <strong>โหลดข้อมูลอัตโนมัติ</strong> จากการทดสอบที่เคยทำไว้</p>
                <p>• หากยังไม่มีข้อมูล สามารถไปทำการทดสอบในหน้า "บันทึกผล" ได้</p>
                <p>• ข้อมูลจะแยกเป็น <strong>ก่อนเรียน</strong> และ <strong>หลังเรียน</strong></p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">🔄 การเปรียบเทียบผล</h3>
              <div className="space-y-2 pl-4">
                <p>• กรอกข้อมูล <strong>ก่อนเรียน</strong> และ <strong>หลังเรียน</strong> ครบทั้ง 2 ช่วง</p>
                <p>• ระบบจะคำนวณและแสดง:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted">
                  <li><strong className="text-green-600">เพิ่มขึ้น</strong> (กล้ามเนื้อเพิ่ม/พัฒนา)</li>
                  <li><strong className="text-rose-600">ลดลง</strong> (ไขมันลด/ดีขึ้น)</li>
                  <li><strong className="text-gray-600">คงที่</strong> (ไม่เปลี่ยนแปลง)</li>
                </ul>
                <p>• กดปุ่ม <strong>"ดูหน้าสรุปเปรียบเทียบ"</strong> เพื่อดูภาพรวมทั้งหมด</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">💾 การบันทึกข้อมูล</h3>
              <div className="space-y-2 pl-4">
                <p>• กรอกข้อมูลในช่องที่มี (ไม่จำเป็นต้องกรอกทุกช่อง)</p>
                <p>• ข้อมูลจะถูกบันทึกแยกตามช่วง: <strong>ก่อน</strong> และ <strong>หลัง</strong></p>
                <p>• สามารถแก้ไขข้อมูลได้ทุกเมื่อโดยกรอกใหม่และบันทึกอีกครั้ง</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">⚠️ ข้อควรระวัง</h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg space-y-2 text-amber-800 dark:text-amber-300">
                <p>• ตัวเลขควรมีทศนิมมไม่เกิน 2 ตำแหน่ง (เช่น 85.50)</p>
                <p>• บางส่วนมีทั้งซ้ายและขวา (แขน, ขา) ให้กรอกทั้ง 2 ข้าง</p>
                <p>• หากวัดไม่ได้ ให้เว้นว่างไว้ อย่ากรอก 0</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function BodyMeasurementFormCard({
  phase,
  initialValues,
  lastSaved,
  onSubmit,
  disabled,
  loading,
  helperContent,
  locked,
  lockedReason,
}: FormCardProps) {
  const phaseLabel = phase === "before" ? "ก่อนเรียน" : "หลังเรียน";
  const form = useForm<BodyMeasurementFormValues>({
    resolver: zodResolver(bodyMeasurementFormSchema) as unknown as Resolver<
      BodyMeasurementFormValues
    >,
    defaultValues: initialValues,
    // เพิ่ม mode เพื่อให้ validation ทำงานทันทีเมื่อมีการเปลี่ยนแปลง
    mode: "onChange",
  });
  const toast = useToast();
  const [openSections, setOpenSections] = useState<Record<BodyMeasurementCategory, boolean>>({
    fitness: true,
    vital: false,
    circumference: false,
  });

  useEffect(() => {
    // Reset form แต่เฉพาะเมื่อค่า initialValues เปลี่ยนแปลงจริงๆ 
    // และมีข้อมูลใหม่จาก API มา
    const hasData = Object.values(initialValues).some(value => 
      value !== "" && value !== undefined && value !== null
    );
    
    if (hasData || Object.keys(initialValues).length > 0) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: BodyMeasurementFormValues) => {
    try {
      const result = await onSubmit(values);
      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      );
    }
  };

  const isLocked = Boolean(locked && lockedReason);
  const isSubmitting = form.formState.isSubmitting;
  const isDisabled = disabled || loading || isLocked || isSubmitting;
  const cardClassName = locked
    ? "p-6 border border-amber-300/70 bg-amber-50/40"
    : "p-6";

  const toggleSection = (category: BodyMeasurementCategory) => {
    setOpenSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <Card className={cardClassName}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">{`บันทึก${phaseLabel}`}</h2>
          <p className="text-sm text-muted">
            กรอกค่าการวัด 19 รายการตามแบบฟอร์มมาตรฐานกรมพลศึกษา
          </p>
          {helperContent}
        </div>
        {lastSaved && (
          <p className="whitespace-nowrap text-xs text-muted">
            {safeFormatDate(lastSaved, "d MMM yyyy HH:mm")}
          </p>
        )}
      </div>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="mt-6 space-y-6"
      >
        {isLocked && lockedReason && (
          <Alert variant="warning" message={lockedReason} />
        )}

        <div className="space-y-4">
          {GROUPED_FIELDS.map(({ category, title, fields }) => {
            const isOpen = openSections[category];
            return (
              <div
                key={category}
                className="rounded-2xl border border-border/50 bg-surface px-4 py-3 shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => toggleSection(category)}
                >
                  <div>
                    <p className="text-sm font-semibold text-primary">{title}</p>
                    <p className="text-xs text-muted">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-muted"}`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {fields.map((field) => {
                      if (field.type === "single") {
                        return (
                          <div key={field.key}>
                            <label className="mb-1 block text-sm font-medium">
                              {field.label}
                              {field.unit ? (
                                <span className="text-muted text-xs"> ({field.unit})</span>
                              ) : null}
                            </label>
                            <Input
                              inputMode="decimal"
                              step="0.1"
                              disabled={isDisabled}
                              {...form.register(field.key as keyof BodyMeasurementFormValues)}
                            />
                            {renderError(form, field.key as keyof BodyMeasurementFormValues)}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={field.label}
                          className="rounded-2xl border border-border-strong/80 bg-surface-elevated p-4"
                        >
                          <p className="text-sm font-medium text-primary">
                            {field.label}
                            {field.unit ? (
                              <span className="text-muted text-xs"> ({field.unit})</span>
                            ) : null}
                          </p>
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs text-muted">
                                {field.leftLabel ?? "ซ้าย"}
                              </label>
                              <Input
                                inputMode="decimal"
                                step="0.1"
                                disabled={isDisabled}
                                {...form.register(field.keys.left as keyof BodyMeasurementFormValues)}
                              />
                              {renderError(form, field.keys.left as keyof BodyMeasurementFormValues)}
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-muted">
                                {field.rightLabel ?? "ขวา"}
                              </label>
                              <Input
                                inputMode="decimal"
                                step="0.1"
                                disabled={isDisabled}
                                {...form.register(field.keys.right as keyof BodyMeasurementFormValues)}
                              />
                              {renderError(form, field.keys.right as keyof BodyMeasurementFormValues)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">หมายเหตุเพิ่มเติม</label>
          <Textarea
            rows={3}
            disabled={isDisabled}
            {...form.register("notes")}
          />
          {form.formState.errors.notes && (
            <p className="mt-1 text-xs text-rose-600">
              {form.formState.errors.notes.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="self-start"
          loading={isSubmitting}
          disabled={isDisabled}
        >
          {`บันทึกข้อมูลช่วง${phaseLabel}`}
        </Button>
      </form>
    </Card>
  );
}

function renderError(
  form: UseFormReturn<BodyMeasurementFormValues>,
  key: keyof BodyMeasurementFormValues,
) {
  const error = form.formState.errors[key];
  if (!error) return null;
  return <p className="mt-1 text-xs text-rose-600">{error.message as string}</p>;
}

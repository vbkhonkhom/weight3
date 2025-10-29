"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/providers/toast-provider";
import { ComparisonCard } from "@/components/body-measurements/comparison-card";
import { api } from "@/lib/api";
import {
  BODY_MEASUREMENT_CATEGORIES,
  buildBodyMeasurementComparison,
  summarizeBodyMeasurementComparison,
  type BodyMeasurementCategory,
  type BodyMeasurementComparisonRow,
} from "@/lib/body-measurements";
import type { BodyMeasurementResponse } from "@/lib/types";
import { useSession } from "@/providers/session-provider";
import { HelpCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";

type CategoryFilter = "all" | BodyMeasurementCategory;

export default function ComparisonPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();
  const token = session?.token;
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  useEffect(() => {
    if (!isRestoring && !session?.user) {
      router.replace("/");
    }
  }, [isRestoring, session, router]);

  const { data, error, isLoading } = useSWR<BodyMeasurementResponse>(
    token ? ["body-measurements", token] : null,
    ([, currentToken]: [string, string]) => api.getBodyMeasurements(currentToken),
    { revalidateOnFocus: false },
  );

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");

  const comparisonRows = useMemo(() => {
    if (!data) return [] as BodyMeasurementComparisonRow[];
    return buildBodyMeasurementComparison(data);
  }, [data]);

  const filteredRows = useMemo(() => {
    if (selectedCategory === "all") return comparisonRows;
    return comparisonRows.filter((row) => row.categoryKey === selectedCategory);
  }, [comparisonRows, selectedCategory]);

  const summary = useMemo(
    () => summarizeBodyMeasurementComparison(comparisonRows),
    [comparisonRows],
  );

  const categoryFilters: Array<{ value: CategoryFilter; label: string }> = useMemo(
    () => [
      { value: "all", label: "ทั้งหมด" },
      ...Object.entries(BODY_MEASUREMENT_CATEGORIES).map(([key, label]) => ({
        value: key as BodyMeasurementCategory,
        label,
      })),
    ],
    [],
  );

  const beforeRecordedAt = data?.before?.recordedAt;
  const afterRecordedAt = data?.after?.recordedAt;
  const hasData = comparisonRows.length > 0;

  return (
    <AppShell
      title="เปรียบเทียบสัดส่วนร่างกาย"
      description="ดูความเปลี่ยนแปลงของสัดส่วนร่างกาย 19 รายการก่อนและหลังการเรียน"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setHelpDialogOpen(true)}>
            <HelpCircle className="mr-2 h-4 w-4" />
            คู่มือ
          </Button>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value as CategoryFilter)}
            className="px-3 py-2 rounded-lg border border-border text-sm"
            disabled={!hasData}
          >
            {categoryFilters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            onClick={() => router.push("/tests/body-measurements")}
          >
            ไปที่หน้าบันทึกข้อมูล
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      }
    >
      {error && (
        <Alert
          variant="error"
          message="ไม่สามารถโหลดข้อมูลเปรียบเทียบได้ กรุณาลองใหม่อีกครั้ง"
        />
      )}

      {!token && !isRestoring && (
        <Alert variant="info" message="กรุณาเข้าสู่ระบบเพื่อดูข้อมูลเปรียบเทียบ" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted">รายการที่เปรียบเทียบได้</p>
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
          <p className="mt-2 text-3xl font-semibold text-rose-600">{summary.decrease}</p>
          <p className="text-xs text-muted mt-1">คงที่ {summary.unchanged}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">บันทึกล่าสุด</p>
          <div className="mt-2 text-sm text-gray-800 space-y-1">
            <p>
              ก่อนเรียน: {beforeRecordedAt
                ? format(new Date(beforeRecordedAt), "d MMM yyyy HH:mm", { locale: th })
                : "-"}
            </p>
            <p>
              หลังเรียน: {afterRecordedAt
                ? format(new Date(afterRecordedAt), "d MMM yyyy HH:mm", { locale: th })
                : "-"}
            </p>
          </div>
        </Card>
      </div>

      {isLoading && !hasData ? (
        <Card className="p-10 text-center text-muted">กำลังโหลดข้อมูล...</Card>
      ) : null}

      {!isLoading && !hasData ? (
        <>
          <EmptyState
            title="ยังไม่มีข้อมูลเปรียบเทียบ"
            description="กรุณาบันทึกข้อมูลก่อนเรียนหรือหลังเรียนเพื่อดูการเปลี่ยนแปลง"
          />
          <div className="mt-4 flex justify-center">
            <Button onClick={() => router.push("/tests/body-measurements")}>
              ไปหน้าบันทึกข้อมูล
            </Button>
          </div>
        </>
      ) : null}

      {hasData && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-primary">
            หมวดหมู่: {categoryFilters.find((cat) => cat.value === selectedCategory)?.label}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRows.map((row) => (
              <ComparisonCard key={row.id} row={row} />
            ))}
          </div>
        </div>
      )}

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              คู่มือการเปรียบเทียบสัดส่วนร่างกาย
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-semibold text-base">📊 ข้อมูลในการ์ดสรุป</h3>
              <div className="space-y-2 pl-4">
                <div className="space-y-1">
                  <p className="font-medium">1. รายการที่เปรียบเทียบได้:</p>
                  <p className="text-muted pl-4">จำนวนส่วนของร่างกายที่มีข้อมูลครบทั้งก่อนและหลัง</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">2. ค่าที่เพิ่มขึ้น:</p>
                  <p className="text-muted pl-4">
                    <span className="text-green-600 font-medium">สีเขียว</span> - จำนวนส่วนที่มีขนาดเพิ่มขึ้น 
                    (เช่น กล้ามเนื้อเพิ่ม, รอบอกขยาย)
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">3. ค่าที่ลดลง:</p>
                  <p className="text-muted pl-4">
                    <span className="text-rose-600 font-medium">สีแดง</span> - จำนวนส่วนที่มีขนาดลดลง 
                    (เช่น ไขมันลด, รอบเอวเล็กลง)
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">4. คงที่:</p>
                  <p className="text-muted pl-4">
                    <span className="text-gray-600 font-medium">สีเทา</span> - จำนวนส่วนที่ไม่เปลี่ยนแปลง
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">🎨 ความหมายของสี</h3>
              <div className="space-y-3 pl-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-4 h-4 rounded-full bg-green-500 mt-0.5"></div>
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">เพิ่มขึ้น (สีเขียว)</p>
                    <p className="text-xs text-muted">
                      ดีสำหรับ: กล้ามเนื้อ (แขน, ขา, หัวไหล่, รอบอก)<br/>
                      ควรระวัง: ไขมัน (รอบเอว, หน้าท้อง, สะโพก)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                  <div className="w-4 h-4 rounded-full bg-rose-500 mt-0.5"></div>
                  <div>
                    <p className="font-medium text-rose-700 dark:text-rose-400">ลดลง (สีแดง)</p>
                    <p className="text-xs text-muted">
                      ดีสำหรับ: ไขมัน (รอบเอว, หน้าท้อง), BMI ที่สูงเกินไป<br/>
                      ควรระวัง: กล้ามเนื้อ (อาจลดลงถ้าไม่ออกกำลังกาย)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-4 h-4 rounded-full bg-gray-400 mt-0.5"></div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-400">คงที่ (สีเทา)</p>
                    <p className="text-xs text-muted">
                      ค่าเท่าเดิม ไม่เปลี่ยนแปลง (อาจดี หรือควรปรับปรุงต่อ)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">📈 วิธีอ่านการ์ดแต่ละรายการ</h3>
              <div className="space-y-2 pl-4">
                <p><strong>• ชื่อส่วน:</strong> เช่น "รอบแขนท่อนบนซ้าย", "รอบเอว"</p>
                <p><strong>• ก่อน → หลัง:</strong> แสดงค่าเปรียบเทียบพร้อมลูกศรทิศทาง</p>
                <p><strong>• เปลี่ยนแปลง:</strong> แสดง +/- และเปอร์เซ็นต์</p>
                <p><strong>• ไอคอน:</strong></p>
                <ul className="list-disc pl-6 space-y-1 text-muted">
                  <li>↑ เพิ่มขึ้น (สีเขียว)</li>
                  <li>↓ ลดลง (สีแดง)</li>
                  <li>= คงที่ (สีเทา)</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">🔍 ตัวกรองหมวดหมู่</h3>
              <div className="space-y-2 pl-4">
                <p><strong>• ทั้งหมด:</strong> แสดงข้อมูลทุกหมวดหมู่</p>
                <p><strong>• สมรรถภาพ:</strong> BMI, ความยืดหยุ่น, แรงบีบมือ, ความแข็งแรง, ความอดทน</p>
                <p><strong>• สัญญาณชีพ:</strong> น้ำหนัก, ส่วนสูง, ชีพจร</p>
                <p><strong>• รอบส่วนต่างๆ:</strong> รอบคอ, แขน, ขา, อก, เอว, สะโพก ฯลฯ</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">💡 วิธีแปลผล</h3>
              <div className="space-y-2 pl-4">
                <p className="font-medium text-blue-600">สำหรับผู้ออกกำลังกายเพื่อสุขภาพ:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted">
                  <li>BMI ลดลงเข้าสู่ช่วงปกติ (18.5-24.9) = ดี</li>
                  <li>รอบเอวลดลง = ลดไขมันส่วนกลางลำตัว (ดี)</li>
                  <li>รอบแขน/ขาเพิ่ม = กล้ามเนื้อเพิ่ม (ดี)</li>
                  <li>ความยืดหยุ่นเพิ่ม = ดี</li>
                </ul>
                <p className="font-medium text-green-600 mt-3">สำหรับนักกีฬา:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted">
                  <li>รอบกล้ามเนื้อเพิ่ม = เพิ่มมวลกล้ามเนื้อ (ดี)</li>
                  <li>แรงบีบมือเพิ่ม = แข็งแรงขึ้น (ดี)</li>
                  <li>ความแข็งแรงเพิ่ม = สมรรถภาพดีขึ้น (ดี)</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">⚠️ ข้อควรระวัง</h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg space-y-2 text-amber-800 dark:text-amber-300">
                <p>• การเปลี่ยนแปลงขนาดเล็ก (&lt;2%) อาจเกิดจากความคลาดเคลื่อนในการวัด</p>
                <p>• ควรวัดในเวลาเดียวกัน (เช่น ตอนเช้าหลังตื่นนอน) เพื่อความแม่นยำ</p>
                <p>• การลดน้ำหนักอย่างรวดเร็วมาก อาจเป็นน้ำ ไม่ใช่ไขมัน</p>
                <p>• หากมีการเปลี่ยนแปลงผิดปกติ ควรปรึกษาผู้เชี่ยวชาญ</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">🎯 เป้าหมายทั่วไป</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                <p className="font-medium text-blue-700 dark:text-blue-300">การเปลี่ยนแปลงที่ดี:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted">
                  <li>BMI: อยู่ในช่วง 18.5-24.9</li>
                  <li>รอบเอว (ชาย): &lt;90 cm | (หญิง): &lt;80 cm</li>
                  <li>กล้ามเนื้อแขน/ขา: เพิ่มขึ้น 2-5%</li>
                  <li>ความยืดหยุ่น: เพิ่มขึ้น 10-20%</li>
                  <li>แรงบีบมือ: เพิ่มขึ้น 5-15%</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

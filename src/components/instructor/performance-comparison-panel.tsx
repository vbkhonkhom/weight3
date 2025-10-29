import { type ChangeEvent, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ClassStudent } from "@/lib/types";
import {
  DEFAULT_EXPORT_COLUMNS,
  type ExportColumn,
  buildComparisonRows,
  buildExportRows,
  exportToCsv,
  // exportToPrintablePdf,
  type ClassSnapshot,
  type ComparisonFilters,
} from "@/lib/instructor-analytics";
import { cn } from "@/lib/utils";
import { HelpDialog, HelpSection, HelpList, HelpTip } from "@/components/ui/help-dialog";

interface PerformanceComparisonPanelProps {
  snapshots: ClassSnapshot[];
  studentLookup: Record<string, ClassStudent[]>;
}

const genderOptions: Array<{ value: ComparisonFilters["gender"]; label: string }> = [
  { value: "all", label: "ทุกเพศ" },
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
];

export function PerformanceComparisonPanel({
  snapshots,
  studentLookup,
}: PerformanceComparisonPanelProps) {
  const [filters, setFilters] = useState<ComparisonFilters>({
    classIds: [],
    gender: "all",
  });
  const [ageRange, setAgeRange] = useState<{ min?: number; max?: number }>({});
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>(DEFAULT_EXPORT_COLUMNS);

  const comparisonRows = useMemo(
    () =>
      buildComparisonRows(
        snapshots,
        {
          ...filters,
          ageMin: ageRange.min,
          ageMax: ageRange.max,
        },
        studentLookup,
      ),
    [snapshots, filters, studentLookup, ageRange],
  );

  const exportRows = useMemo(
    () => buildExportRows(snapshots, studentLookup),
    [snapshots, studentLookup],
  );

  const classOptions = useMemo(
    () =>
      snapshots.map((snapshot) => ({
        value: snapshot.classId,
        label: `${snapshot.className} (${snapshot.studentCount})`,
      })),
    [snapshots],
  );

  const handleToggleClass = (classId: string) => {
    setFilters((prev) => {
      if (prev.classIds.includes(classId)) {
        return { ...prev, classIds: prev.classIds.filter((id) => id !== classId) };
      }
      return { ...prev, classIds: [...prev.classIds, classId] };
    });
  };

  const handleToggleColumn = (column: ExportColumn) => {
    setSelectedColumns((prev) => {
      const exists = prev.find((item) => item.key === column.key);
      if (exists) {
        return prev.filter((item) => item.key !== column.key);
      }
      return [...prev, column];
    });
  };

  const progressMax = useMemo(() => {
    const values = comparisonRows
      .map((row) => row.averageOverallScore ?? 0)
      .filter((value) => Number.isFinite(value));
    return values.length > 0 ? Math.max(...values) : 0;
  }, [comparisonRows]);

  // เนื้อหาคู่มือสำหรับผู้สอน: อธิบายวิธีใช้หน้าการเปรียบเทียบชั้นเรียน
  const helpContent = (
    <>
      <HelpSection title="ภาพรวม">
        <p className="text-sm text-muted">
          หน้านี้ใช้เปรียบเทียบผลการประเมินระหว่างหลายชั้นเรียน พร้อมตัวกรองเพศและช่วงอายุ และสามารถส่งออก CSV ได้
        </p>
      </HelpSection>

      <HelpSection title="ส่วนประกอบของหน้าจอ">
        <HelpList
          items={[
            "📊 แถบสีน้ำเงิน: แสดงคะแนนเฉลี่ยของชั้นเรียนแต่ละชั้น",
            "📏 เส้นกรอบสีเทา: แสดงค่า Benchmark (เกณฑ์มาตรฐาน)",
            "👥 จำนวนนักเรียน: แสดงจำนวนนักเรียนที่ถูกนับรวมในการคำนวณ",
            "🎯 คะแนนเฉลี่ย: คำนวณจากผลการทดสอบทั้งหมดของนักเรียนในชั้น",
          ]}
        />
      </HelpSection>

      <HelpSection title="วิธีใช้งาน">
        <HelpList
          items={[
            "เลือกชั้นเรียนทางซ้ายเพื่อเพิ่มเข้าเปรียบเทียบได้หลายชั้น",
            "ตั้งค่าตัวกรองเพศและช่วงอายุเพื่อจำกัดกลุ่มข้อมูล",
            "สังเกตแถบสีน้ำเงินเทียบกับเส้น Benchmark เพื่อดูว่าชั้นไหนผ่านเกณฑ์",
            "กดส่งออก CSV เพื่อดาวน์โหลดผลลัพธ์รายละเอียด",
          ]}
        />
      </HelpSection>

      <HelpSection title="การคำนวณคะแนน">
        <p className="text-sm text-muted mb-2">
          คะแนนเฉลี่ยของแต่ละชั้นเรียนคำนวณจาก:
        </p>
        <HelpList
          items={[
            "ผลการทดสอบสมรรถภาพทั้งหมดของนักเรียน (ความแข็งแรง ความอดทน ความยืดหยุ่น)",
            "ข้อมูลสัดส่วนร่างกาย (BMI, เปอร์เซ็นต์ไขมัน)",
            "แปลงเป็นคะแนนตามเกณฑ์การประเมิน (ดีมาก=5, ดี=4, ปานกลาง=3, ปรับปรุง=2)",
            "หาค่าเฉลี่ยของนักเรียนทุกคนในชั้น",
          ]}
        />
      </HelpSection>

      <HelpSection title="Benchmark คืออะไร?">
        <p className="text-sm text-muted mb-2">
          Benchmark คือค่ามาตรฐานเป้าหมายที่ใช้เทียบกับผลเฉลี่ยจริง เพื่อดูว่าชั้นเรียนอยู่ในระดับใดเมื่อเทียบกับเกณฑ์ที่ตั้งไว้
        </p>
        <p className="text-sm text-muted mb-2">
          ค่า Benchmark มาจาก:
        </p>
        <HelpList
          items={[
            "เกณฑ์มาตรฐานสมรรถภาพสำหรับแต่ละช่วงอายุและเพศ",
            "คะแนนระดับ 'ดี' (4 คะแนน) ถือเป็นเป้าหมายขั้นต่ำ",
            "ถ้าคะแนนเฉลี่ยถึงหรือเกิน Benchmark = ชั้นเรียนผ่านเกณฑ์",
            "ถ้าต่ำกว่า = ควรให้การสนับสนุนเพิ่มเติม",
          ]}
        />
        <HelpTip>ถ้าแถบสีน้ำเงินยาวถึงหรือเกินเส้น Benchmark แปลว่าชั้นเรียนนั้นถึงเป้าหมายแล้ว</HelpTip>
      </HelpSection>

      <HelpSection title="การส่งออกข้อมูล">
        <p className="text-sm text-muted mb-2">
          ไฟล์ CSV ที่ส่งออกจะมีข้อมูล:
        </p>
        <HelpList
          items={[
            "ชื่อชั้นเรียน และจำนวนนักเรียน",
            "คะแนนเฉลี่ยของแต่ละรายการทดสอบ",
            "ผลการประเมิน (ดีมาก/ดี/ปานกลาง/ปรับปรุง)",
            "สามารถเลือกคอลัมน์ที่ต้องการส่งออกได้",
          ]}
        />
      </HelpSection>
    </>
  );

  return (
    <Card>
      <CardHeader className="space-y-2 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold text-primary">
              เปรียบเทียบผลลัพธ์ระหว่างชั้นเรียน
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted">
              เลือกชั้นเรียนและตัวกรองเพื่อดูการเปรียบเทียบแบบเรียลไทม์
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* ปุ่มเปิดคู่มือหน้าเปรียบเทียบชั้นเรียน */}
            <HelpDialog title="คู่มือการเปรียบเทียบระหว่างชั้นเรียน" content={helpContent} />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportToCsv(exportRows, selectedColumns)}
              disabled={exportRows.length === 0 || selectedColumns.length === 0}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              ส่งออก CSV
            </Button>
            {/* PDF export disabled */}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-4 sm:px-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wide">
              เลือกชั้นเรียน
            </p>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border/60 p-3">
              {classOptions.map((option) => {
                const isSelected = filters.classIds.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggleClass(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs sm:text-sm transition-colors min-h-[44px]",
                      isSelected ? "bg-accent/10 text-primary" : "hover:bg-surface",
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        เลือก
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {classOptions.length === 0 && (
                <p className="text-xs sm:text-sm text-muted">ยังไม่มีชั้นเรียนที่ดึงข้อมูล</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wide">
              ตัวกรองเพศ
            </p>
            <Select
              value={filters.gender}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setFilters((prev) => ({
                  ...prev,
                  gender: event.target.value as ComparisonFilters["gender"],
                }))
              }
              className="min-h-[44px]"
            >
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wide">
              ช่วงอายุต่ำสุด
            </p>
            <Input
              type="number"
              value={ageRange.min ?? ""}
              onChange={(event) =>
                setAgeRange((prev) => ({
                  ...prev,
                  min: event.target.value === "" ? undefined : Number(event.target.value),
                }))
              }
              min={5}
              max={80}
              placeholder="เช่น 12"
              className="min-h-[44px]"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wide">
              ช่วงอายุสูงสุด
            </p>
            <Input
              type="number"
              value={ageRange.max ?? ""}
              onChange={(event) =>
                setAgeRange((prev) => ({
                  ...prev,
                  max: event.target.value === "" ? undefined : Number(event.target.value),
                }))
              }
              min={5}
              max={80}
              placeholder="เช่น 18"
              className="min-h-[44px]"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 overflow-x-auto">
          <div className="flex items-center justify-end gap-2 sm:gap-4 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] text-muted min-w-[300px]">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-4 rounded-full bg-gradient-to-r from-accent to-accent-light" />
              <span>ค่าเฉลี่ยชั้นเรียน</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-4 rounded-full border border-dashed border-accent-dark/50" />
              <span>Benchmark</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-0 divide-y divide-border">
            {comparisonRows.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted">
                เลือกชั้นเรียนหรือปรับตัวกรองเพื่อดูผลเปรียบเทียบ
              </div>
            ) : (
              comparisonRows.map((row) => {
                const score = row.averageOverallScore ?? 0;
                const benchmark = row.benchmarkOverallScore ?? 0;
                const max = progressMax || 100;
                const percentage = max === 0 ? 0 : Math.max(0, Math.min(100, (score / max) * 100));
                const benchmarkPercentage =
                  max === 0 ? 0 : Math.max(0, Math.min(100, (benchmark / max) * 100));

                return (
                  <div key={row.classId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">{row.className}</p>
                      <p className="text-xs text-muted">
                        เฉลี่ยปัจจุบัน {row.averageOverallScore?.toFixed(1) ?? "-"} · นักเรียนที่เข้าเกณฑ์ {row.activeStudents.toLocaleString("th-TH")}
                      </p>
                    </div>
                    <div className="w-full max-w-md">
                      <div className="relative h-6 rounded-full bg-surface">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-accent to-accent-light"
                          style={{ width: `${percentage}%` }}
                        />
                        <div
                          className="absolute left-0 top-0 h-full rounded-full border border-dashed border-accent-dark/50"
                          style={{ width: `${benchmarkPercentage}%` }}
                        />
                      </div>
                      {/* ลบป้าย "คะแนนเฉลี่ย" ตามคำขอ และคงไว้เฉพาะ Benchmark ทางขวา */}
                      <div className="mt-1 flex justify-end text-[11px] text-muted">
                        <span>Benchmark {row.benchmarkOverallScore?.toFixed(1) ?? "-"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wide">
            คอลัมน์สำหรับส่งออก
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_EXPORT_COLUMNS.map((column) => {
              const active = selectedColumns.some((item) => item.key === column.key);
              return (
                <button
                  key={column.key}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:border-accent/60",
                  )}
                  onClick={() => handleToggleColumn(column)}
                >
                  {column.label}
                </button>
              );
            })}
          </div>
          {selectedColumns.length === 0 && (
            <p className="mt-2 text-xs text-error">
              กรุณาเลือกอย่างน้อยหนึ่งคอลัมน์เพื่อเปิดใช้งานการส่งออก
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

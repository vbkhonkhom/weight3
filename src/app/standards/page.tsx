"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { HelpDialog } from "@/components/ui/help-dialog";
import { downloadCsv } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";
import { useSession } from "@/providers/session-provider";
import { api } from "@/lib/api";
import type { StandardPayload, StandardRow, TestType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Trash2, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TEST_TYPE_ORDER: TestType[] = ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"];

const TEST_TYPE_DETAILS: Record<
  TestType,
  { label: string; unit: string; description: string }
> = {
  bmi: {
    label: "BMI",
    unit: "kg/m²",
    description: "ดัชนีมวลกายเพื่อประเมินน้ำหนักตัวเทียบกับส่วนสูง",
  },
  sit_and_reach: {
    label: "นั่งงอตัวเอื้อมไปข้างหน้า",
    unit: "cm",
    description: "ทดสอบความยืดหยุ่นช่วงลำตัวและกล้ามเนื้อบริเวณเอ็นร้อยหวาย",
  },
  hand_grip: {
    label: "แรงบีบมือ",
    unit: "kg",
    description: "ใช้เครื่องวัดแรงบีบเพื่อประเมินกำลังกล้ามเนื้อมือและปลายแขน",
  },
  chair_stand: {
    label: "ลุกนั่งเก้าอี้",
    unit: "ครั้ง",
    description: "ทดสอบกำลังกล้ามเนื้อขาโดยนับจำนวนครั้งในการลุก-นั่งในเวลาที่กำหนด",
  },
  step_up: {
    label: "ก้าวขึ้นลงแท่น",
    unit: "คะแนน",
    description: "ประเมินความทนทานของระบบไหลเวียนโลหิตด้วยแบบทดสอบ Step Test",
  },
};

const FILTER_OPTIONS: Array<{ value: "all" | TestType; label: string }> = [
  { value: "all", label: "ทั้งหมด" },
  ...TEST_TYPE_ORDER.map((value) => ({
    value,
    label: TEST_TYPE_DETAILS[value].label,
  })),
];

const CATEGORY_PRIORITY = [
  "ยอดเยี่ยม",
  "ดีเยี่ยม",
  "ดีมาก",
  "ดี",
  "ค่อนข้างดี",
  "ปานกลาง",
  "ต่ำกว่าปกติ",
  "ต่ำ",
  "ต้องปรับปรุง",
  "ควรปรับปรุง",
];

type StandardsGroup = {
  key: string;
  testType: TestType;
  gender: "male" | "female";
  ageMin: number;
  ageMax: number;
  rows: StandardRow[];
};

function getCategoryRank(category: string) {
  const index = CATEGORY_PRIORITY.findIndex((priority) =>
    category.toLowerCase().includes(priority.toLowerCase()),
  );
  return index === -1 ? CATEGORY_PRIORITY.length : index;
}

function getCategoryStyle(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("น้ำหนักปกติ") || normalized.includes("สมส่วน")) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (normalized.includes("น้ำหนักเกิน") || normalized.includes("ค่อนข้างอ้วน")) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (normalized.includes("โรคอ้วน") || normalized.includes("อ้วน")) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  if (normalized.includes("น้ำหนักต่ำ")) {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (normalized.includes("ยอด") || normalized.includes("เยี่ยม")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (normalized.includes("ดี")) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (normalized.includes("ปานกลาง")) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (normalized.includes("ต่ำ") || normalized.includes("ค่อนข้าง")) {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (normalized.includes("ต้อง") || normalized.includes("ปรับปรุง")) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function formatRange(row: StandardRow, unit: string) {
  const { minValue, maxValue, comparison } = row;
  if (minValue != null && maxValue != null) {
    if (minValue === maxValue) {
      return `${minValue} ${unit}`.trim();
    }
    return `${minValue} - ${maxValue} ${unit}`.trim();
  }

  if (minValue != null) {
    return comparison === "threshold"
      ? `≥ ${minValue} ${unit}`.trim()
      : `${minValue}+ ${unit}`.trim();
  }

  if (maxValue != null) {
    return comparison === "threshold"
      ? `≤ ${maxValue} ${unit}`.trim()
      : `0 - ${maxValue} ${unit}`.trim();
  }

  return `ไม่มีข้อมูล`;
}

function genderLabel(gender: "male" | "female") {
  return gender === "male" ? "ชาย" : "หญิง";
}

export default function StandardsPage() {
  const router = useRouter();
  const { session } = useSession();
  const toast = useToast();
  const [selectedTestType, setSelectedTestType] = useState<"all" | TestType>("all");
  const canEdit = session?.user?.role === "instructor";
  const [editingGroup, setEditingGroup] = useState<StandardsGroup | null>(null);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<StandardsGroup | null>(null);
  const [formState, setFormState] = useState<{
    testType: TestType;
    gender: "male" | "female";
    ageMin: string;
    ageMax: string;
    category: string;
    comparison: "range" | "threshold";
    minValue: string;
    maxValue: string;
  }>();
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // กำหนด audience ตาม role: นักกีฬาดูเกณฑ์นักกีฬา, นักเรียนทั่วไปดูเกณฑ์ทั่วไป
  const audience = session?.user?.role === "athlete" ? "athlete" : "general";

  const swrKey = session?.token ? ["standards", session.token, audience] : null;
  const { data, isLoading, error, mutate } = useSWR(
    swrKey,
    async ([, token, aud]) => api.listStandards(token, aud as "general" | "athlete"),
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );

  // ดาวน์โหลด CSV ของเกณฑ์ที่แสดงอยู่ (กรองตามประเภทแล้ว)
  const handleExportCsv = () => {
    const rows: StandardRow[] = filteredStandards;
    const csvRows = rows.map((r) => ({
      test_type: TEST_TYPE_DETAILS[r.testType].label,
      gender: genderLabel(r.gender),
      age_min: r.ageMin,
      age_max: r.ageMax,
      category: r.category,
      min_value: r.minValue ?? "",
      max_value: r.maxValue ?? "",
      comparison: r.comparison,
      audience: r.audience ?? "general",
    }));
    downloadCsv(
      csvRows,
      [
        { key: "test_type", label: "ประเภทการทดสอบ" },
        { key: "gender", label: "เพศ" },
        { key: "age_min", label: "อายุต่ำสุด" },
        { key: "age_max", label: "อายุสูงสุด" },
        { key: "category", label: "หมวดหมู่" },
        { key: "min_value", label: "Min" },
        { key: "max_value", label: "Max" },
        { key: "comparison", label: "รูปแบบ" },
        { key: "audience", label: "กลุ่มผู้ใช้" },
      ],
      `standards-${audience}-${selectedTestType}-th.csv`,
    );
  };

  const filteredStandards = useMemo(() => {
    const source = data ?? [];
    if (selectedTestType === "all") {
      return source;
    }
    return source.filter((row) => row.testType === selectedTestType);
  }, [data, selectedTestType]);

  const groupedStandards = useMemo(() => {
    const groups = new Map<string, StandardsGroup>();

    filteredStandards.forEach((row) => {
      const key = `${row.testType}-${row.gender}-${row.ageMin}-${row.ageMax}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          testType: row.testType,
          gender: row.gender,
          ageMin: row.ageMin,
          ageMax: row.ageMax,
          rows: [],
        });
      }
      groups.get(key)?.rows.push(row);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        rows: group.rows
          .slice()
          .sort((a, b) => getCategoryRank(a.category) - getCategoryRank(b.category)),
      }))
      .sort((a, b) => {
        const typeDiff =
          TEST_TYPE_ORDER.indexOf(a.testType) - TEST_TYPE_ORDER.indexOf(b.testType);
        if (typeDiff !== 0) return typeDiff;
        if (a.gender !== b.gender) return a.gender === "male" ? -1 : 1;
        if (a.ageMin !== b.ageMin) return a.ageMin - b.ageMin;
        return a.ageMax - b.ageMax;
      });
  }, [filteredStandards]);

  const loadRowIntoForm = (group: StandardsGroup, row: StandardRow) => {
    setFormState({
      testType: group.testType,
      gender: group.gender,
      ageMin: String(group.ageMin),
      ageMax: String(group.ageMax),
      category: row.category,
      comparison: row.comparison,
      minValue: row.minValue != null ? String(row.minValue) : "",
      maxValue: row.maxValue != null ? String(row.maxValue) : "",
    });
  };

  const handleDeleteGroup = async () => {
    if (!deleteConfirmGroup || !session?.token) return;

    setDeleting(true);
    try {
      // Delete all standards in this group
      for (const row of deleteConfirmGroup.rows) {
        await api.deleteStandard(session.token, row.id);
      }

      await mutate(
        async () => api.listStandards(session.token),
        { revalidate: false }
      );

      toast.success(`ลบเกณฑ์มาตรฐานสำเร็จ (${deleteConfirmGroup.rows.length} รายการ)`);
      setDeleteConfirmGroup(null);
    } catch (err) {
      console.error("Error deleting standards:", err);
      toast.error(err instanceof Error ? err.message : "ไม่สามารถลบเกณฑ์มาตรฐานได้");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell
      title={audience === "athlete" ? "เกณฑ์นักกีฬา" : "เกณฑ์มาตรฐาน"}
      description={
        audience === "athlete"
          ? "เกณฑ์การประเมินสมรรถภาพทางกายสำหรับนักกีฬา (เข้มงวดกว่าเกณฑ์ทั่วไป)"
          : "เกณฑ์การประเมินสมรรถภาพทางกายตามมาตรฐานกรมพลศึกษา"
      }
      actions={
        <div className="flex gap-2">
          <HelpDialog
            title={audience === "athlete" ? "คู่มือเกณฑ์นักกีฬา" : "คู่มือการใช้งานเกณฑ์มาตรฐาน"}
            content={
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-2">
                    {audience === "athlete" ? "🏆 เกณฑ์นักกีฬาคืออะไร?" : "📊 เกณฑ์มาตรฐานคืออะไร?"}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {audience === "athlete"
                      ? "เกณฑ์นักกีฬาคือมาตรฐานการประเมินที่เข้มงวดกว่าเกณฑ์ทั่วไป สำหรับผู้ที่ต้องการพัฒนาสมรรถภาพในระดับสูง แบ่งตามช่วงอายุและเพศ"
                      : "เกณฑ์มาตรฐานคือค่ามาตรฐานที่ใช้ในการประเมินผลการทดสอบสมรรถภาพทางกาย จัดทำโดยกรมพลศึกษา แบ่งตามช่วงอายุและเพศ"}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">🎯 การใช้งาน</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted">
                    <li>ดูเกณฑ์{audience === "athlete" ? "นักกีฬา" : "มาตรฐาน"}ทั้งหมด หรือกรองตามประเภทการทดสอบ</li>
                    <li>ระบบจะใช้เกณฑ์นี้ในการประเมินผลการทดสอบของคุณโดยอัตโนมัติ</li>
                    {canEdit && <li>อาจารย์สามารถแก้ไขหรือลบเกณฑ์ได้</li>}
                    {audience === "athlete" && (
                      <li className="text-amber-600 font-medium">
                        ⚠️ หากยังไม่มีเกณฑ์นักกีฬาสำหรับการทดสอบใดๆ จะแสดง "ยังไม่มีเกณฑ์นักกีฬา"
                      </li>
                    )}
                  </ul>
                </section>

                {canEdit && (
                  <>
                    <section>
                      <h3 className="text-lg font-semibold mb-2">✏️ การแก้ไขเกณฑ์ (สำหรับอาจารย์)</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted">
                        <li>คลิกปุ่ม "แก้ไข" ในการ์ดเกณฑ์ที่ต้องการ</li>
                        <li>เลือกหมวดหมู่ที่ต้องการแก้ไข</li>
                        <li>ใส่ค่าต่ำสุด (Min) และค่าสูงสุด (Max)</li>
                        <li>กดปุ่ม "บันทึก"</li>
                      </ol>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-2">🗑️ การลบเกณฑ์</h3>
                      <p className="text-sm text-rose-600 leading-relaxed">
                        ⚠️ <strong>คำเตือน:</strong> การลบเกณฑ์จะลบทั้งกลุ่มอายุและเพศนั้นๆ
                        ไม่สามารถกู้คืนได้ กรุณาตรวจสอบให้แน่ใจก่อนลบ
                      </p>
                    </section>
                  </>
                )}

                <section>
                  <h3 className="text-lg font-semibold mb-2">💡 เคล็ดลับ</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted">
                    <li>ใช้ตัวกรองด้านบนเพื่อดูเฉพาะการทดสอบที่สนใจ</li>
                    <li>สีของหมวดหมู่จะช่วยให้มองเห็นระดับได้ง่ายขึ้น</li>
                  </ul>
                </section>
              </div>
            }
          />
          <Button variant="outline" onClick={handleExportCsv} disabled={!filteredStandards?.length}>
            ส่งออก CSV
          </Button>
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => router.push("/standards/manage")}
            >
              จัดการเกณฑ์
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <Alert
            variant="error"
            message={error instanceof Error ? error.message : "ไม่สามารถโหลดเกณฑ์มาตรฐานได้"}
          />
        )}

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <Card
                key={`skeleton-${index}`}
                className="h-48 animate-pulse rounded-3xl border border-border/60 bg-surface"
              />
            ))}
          </div>
        )}

        {!isLoading && groupedStandards.length === 0 && (
          <Card className="rounded-3xl border border-border/60 bg-surface p-10 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <div className="text-4xl">
                {audience === "athlete" ? "🏆" : "📊"}
              </div>
              <h3 className="text-xl font-semibold text-primary">
                {audience === "athlete" ? "ยังไม่มีเกณฑ์นักกีฬา" : "ยังไม่มีเกณฑ์มาตรฐาน"}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {audience === "athlete"
                  ? "ขณะนี้ยังไม่มีเกณฑ์นักกีฬาสำหรับการทดสอบที่เลือก กรุณาติดต่ออาจารย์ผู้สอนเพื่อเพิ่มเกณฑ์"
                  : selectedTestType === "all"
                  ? "ยังไม่มีเกณฑ์มาตรฐานในระบบ"
                  : `ยังไม่มีเกณฑ์สำหรับ${TEST_TYPE_DETAILS[selectedTestType].label}`}
              </p>
              {canEdit && (
                <Button
                  variant="secondary"
                  onClick={() => router.push("/standards/manage")}
                  className="mt-4"
                >
                  เพิ่มเกณฑ์ใหม่
                </Button>
              )}
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {groupedStandards.map((group) => {
            const details = TEST_TYPE_DETAILS[group.testType];
            const ageLabel =
              group.ageMin === group.ageMax
                ? `${group.ageMin} ปี`
                : `${group.ageMin}-${group.ageMax} ปี`;
            return (
              <Card
                key={group.key}
                className="space-y-4 rounded-3xl border border-border-strong/80 bg-surface-elevated p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">
                      {details.label} - {genderLabel(group.gender)} ({ageLabel})
                    </h2>
                    <p className="text-sm text-muted">{details.description}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => {
                          const baseRow = group.rows[0];
                          setEditingGroup(group);
                          setSelectedStandardId(baseRow.id);
                          loadRowIntoForm(group, baseRow);
                          setDialogError(null);
                        }}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-red-500 hover:text-red-600"
                        onClick={() => setDeleteConfirmGroup(group)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.rows.map((row) => (
                    <div
                      key={row.id}
                      className={`rounded-2xl border px-4 py-3 text-sm ${getCategoryStyle(row.category)}`}
                    >
                      <p className="font-semibold">{row.category}</p>
                      <p className="text-xs opacity-80">
                        {formatRange(row, details.unit)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog
        open={Boolean(editingGroup)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGroup(null);
            setSelectedStandardId(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>แก้ไขเกณฑ์มาตรฐาน</DialogTitle>
            <DialogDescription>
              กำหนดช่วงอายุและค่าเกณฑ์การประเมินสำหรับการทดสอบสมรรถภาพกายในแต่ละหมวดหมู่
            </DialogDescription>
          </DialogHeader>
          {dialogError && <Alert variant="error" message={dialogError} />}
          {editingGroup && selectedStandardId && formState && (
            <form
              className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();

                  const tokenForRequests = session?.token;
                  if (!tokenForRequests) {
                    setDialogError("ต้องเข้าสู่ระบบก่อนจึงจะปรับปรุงข้อมูลได้");
                    return;
                  }

                  const ageMin = Number(formState.ageMin);
                  const ageMax = Number(formState.ageMax);
                  if (Number.isNaN(ageMin) || Number.isNaN(ageMax)) {
                    setDialogError("กรุณาระบุช่วงอายุให้เป็นตัวเลข");
                    return;
                  }
                  if (ageMin > ageMax) {
                    setDialogError("อายุต่ำสุดต้องไม่มากกว่าอายุสูงสุด");
                    return;
                  }

                  const minValue =
                    formState.minValue.trim() === "" ? null : Number(formState.minValue);
                  const maxValue =
                    formState.maxValue.trim() === "" ? null : Number(formState.maxValue);

                  if (
                    (formState.minValue.trim() !== "" && Number.isNaN(minValue)) ||
                    (formState.maxValue.trim() !== "" && Number.isNaN(maxValue))
                  ) {
                    setDialogError("ค่าต่ำสุดและค่าสูงสุดต้องเป็นตัวเลข");
                    return;
                  }

                  const normalizeNumber = (value: number | null | undefined) =>
                    value === undefined ? null : value;

                  setDialogError(null);
                  setSaving(true);
                  try {
                    const targetRow =
                      editingGroup.rows.find((row) => row.id === selectedStandardId) ?? null;
                    if (!targetRow) {
                      setDialogError("ไม่พบรายการที่ต้องการแก้ไข");
                      return;
                    }

                    const updates = editingGroup.rows
                      .map((row) => {
                        const isSelected = row.id === selectedStandardId;
                        const payload: StandardPayload & { id: string } = {
                          id: row.id,
                          testType: formState.testType,
                          gender: formState.gender,
                          ageMin,
                          ageMax,
                          category: isSelected
                            ? formState.category.trim() || row.category
                            : row.category,
                          minValue: isSelected ? minValue : normalizeNumber(row.minValue),
                          maxValue: isSelected ? maxValue : normalizeNumber(row.maxValue),
                          comparison: isSelected ? formState.comparison : row.comparison,
                        };

                        const changed =
                          row.testType !== payload.testType ||
                          row.gender !== payload.gender ||
                          row.ageMin !== payload.ageMin ||
                          row.ageMax !== payload.ageMax ||
                          row.category !== payload.category ||
                          (normalizeNumber(row.minValue) ?? null) !== (payload.minValue ?? null) ||
                          (normalizeNumber(row.maxValue) ?? null) !== (payload.maxValue ?? null) ||
                          row.comparison !== payload.comparison;

                        return { payload, changed };
                      })
                      .filter(({ changed }) => changed);

                    if (updates.length === 0) {
                      setEditingGroup(null);
                      setSelectedStandardId(null);
                      return;
                    }

                    for (const { payload } of updates) {
                      await api.updateStandard(tokenForRequests, payload);
                    }

                    await mutate(
                      async () => api.listStandards(tokenForRequests),
                      { revalidate: false },
                    );
                    setEditingGroup(null);
                    setSelectedStandardId(null);
                  } catch (err) {
                    setDialogError(
                      err instanceof Error ? err.message : "ไม่สามารถบันทึกเกณฑ์มาตรฐานได้",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    เลือกหมวดหมู่ที่ต้องแก้ไข
                  </label>
                  <Select
                    value={selectedStandardId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setSelectedStandardId(nextId);
                      const nextRow =
                        editingGroup.rows.find((row) => row.id === nextId) ?? editingGroup.rows[0];
                      loadRowIntoForm(editingGroup, nextRow);
                    }}
                  >
                    {editingGroup.rows.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.category}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    ประเภทการทดสอบ
                  </label>
                  <Select
                    value={formState.testType}
                    onChange={(event) =>
                      setFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              testType: event.target.value as TestType,
                            }
                          : prev,
                      )
                    }
                  >
                    {TEST_TYPE_ORDER.map((type) => (
                      <option key={type} value={type}>
                        {TEST_TYPE_DETAILS[type].label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">เพศ</label>
                  <Select
                    value={formState.gender}
                    onChange={(event) =>
                      setFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              gender: event.target.value as "male" | "female",
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">อายุต่ำสุด</label>
                  <Input
                    value={formState.ageMin}
                    type="number"
                    min={0}
                    onChange={(event) =>
                      setFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              ageMin: event.target.value,
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">อายุสูงสุด</label>
                  <Input
                    value={formState.ageMax}
                    type="number"
                    min={0}
                    onChange={(event) =>
                      setFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              ageMax: event.target.value,
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    หมวดหมู่ผลการประเมิน
                  </label>
                  <Input
                    value={formState.category}
                    onChange={(event) =>
                      setFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              category: event.target.value,
                            }
                          : prev,
                      )
                    }
                    placeholder="เช่น ดี, ปานกลาง, ต้องปรับปรุง"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    รูปแบบการเปรียบเทียบ
                  </label>
                  <Select
                    value={formState.comparison}
                    onChange={(event) =>
                      setFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              comparison: event.target.value as "range" | "threshold",
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="range">อยู่ระหว่างค่า Min - Max</option>
                    <option value="threshold">ค่าอ้างอิงเดียว</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    ค่าต่ำสุด (Min)
                  </label>
                  <Input
                    value={formState.minValue}
                    onChange={(event) =>
                      setFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              minValue: event.target.value,
                            }
                          : prev,
                      )
                    }
                    placeholder="เช่น 18.5"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    ค่าสูงสุด (Max)
                  </label>
                  <Input
                    value={formState.maxValue}
                    onChange={(event) =>
                      setFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              maxValue: event.target.value,
                            }
                          : prev,
                      )
                    }
                    placeholder="เว้นว่างได้หากไม่มีค่าสูงสุด"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingGroup(null);
                    setSelectedStandardId(null);
                  }}
                  disabled={saving}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" loading={saving}>
                  บันทึก
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmGroup)}
        onOpenChange={(open) => !open && setDeleteConfirmGroup(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบเกณฑ์มาตรฐาน</DialogTitle>
            <DialogDescription>
              คุณต้องการลบเกณฑ์มาตรฐานทั้งหมดในกลุ่มนี้ใช่หรือไม่?
              {deleteConfirmGroup && (
                <div className="mt-2 text-sm">
                  <strong>
                    {TEST_TYPE_DETAILS[deleteConfirmGroup.testType].label} -{" "}
                    {genderLabel(deleteConfirmGroup.gender)} (
                    {deleteConfirmGroup.ageMin === deleteConfirmGroup.ageMax
                      ? `${deleteConfirmGroup.ageMin} ปี`
                      : `${deleteConfirmGroup.ageMin}-${deleteConfirmGroup.ageMax} ปี`}
                    )
                  </strong>
                  <p className="mt-1 text-muted-foreground">
                    จำนวน {deleteConfirmGroup.rows.length} รายการ
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmGroup(null)}
              disabled={deleting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              loading={deleting}
            >
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

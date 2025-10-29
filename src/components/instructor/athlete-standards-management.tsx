"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Trophy, 
  HelpCircle,
  Plus,
} from "lucide-react";
import { ControlledHelpDialog, HelpSection, HelpSteps, HelpList, HelpWarning, HelpTip } from "@/components/ui/help-dialog";
import { downloadCsv } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/lib/api";
import type { StandardRow, TestType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AthleteStandardsManagementProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

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
  if (normalized.includes("ปานกลาง") || normalized.includes("พอใช้")) {
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

const HelpContent = (
  <>
    <HelpSection title="🏆 เกณฑ์นักกีฬาคืออะไร?">
      <p className="text-muted-foreground mb-3">
        เกณฑ์สำหรับนักกีฬาเป็นมาตรฐานการประเมินที่<strong>เข้มงวดกว่า</strong>นักเรียนทั่วไป 
        เพราะนักกีฬาได้รับการฝึกฝนอย่างต่อเนื่องและคาดหวังให้มีสมรรถภาพที่สูงกว่า
      </p>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm"><strong>ตัวอย่างความแตกต่าง:</strong></p>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>• <strong>นักเรียนทั่วไป:</strong> BMI 20-25 = "ดีเยี่ยม"</p>
          <p>• <strong>นักกีฬา:</strong> BMI 20-23 = "ดีเยี่ยม" (ช่วงแคบกว่า)</p>
        </div>
      </div>
    </HelpSection>

    <HelpSection title="📝 วิธีแก้ไขเกณฑ์">
      <HelpSteps steps={[
        "เลือกประเภทการทดสอบที่ต้องการแก้ไข (BMI, ความยืดหยุ่น ฯลฯ)",
        "เลือกเพศ (ชาย/หญิง) - แต่ละเพศมีเกณฑ์แยกกัน",
        "คลิกที่แถวที่ต้องการแก้ไข",
        "ปรับค่า Min/Max ให้เหมาะสม",
        "กดปุ่ม 'บันทึกการเปลี่ยนแปลง'"
      ]} />
      <HelpWarning>
        ต้องบันทึกทุกครั้งก่อนเปลี่ยนหน้า ไม่เช่นนั้นข้อมูลจะหายไป!
      </HelpWarning>
    </HelpSection>

    <HelpSection title="🎯 หลักการกำหนดค่า">
      <HelpList items={[
        "ค่า Min/Max ต้องไม่ทับซ้อนกันระหว่างระดับ (ดีเยี่ยม, ดี, พอใช้)",
        "ระดับ 'ดีเยี่ยม' ควรมีค่าสูงสุด (เช่น BMI 20-23)",
        "ระดับ 'ต้องปรับปรุง' ควรมีค่าต่ำสุด",
        "เกณฑ์นักกีฬาควรเข้มงวดกว่านักเรียนทั่วไป 10-20%",
        "ใช้ข้อมูลจากสมาคมกีฬาหรือกรมพลศึกษาเป็นแนวทาง"
      ]} />
    </HelpSection>

    <HelpSection title="⚠️ ข้อควรระวัง">
      <HelpList items={[
        "การเปลี่ยนเกณฑ์จะมีผลกับการประเมินนักเรียนทันที",
        "ควรแจ้งนักกีฬาให้ทราบก่อนเปลี่ยนเกณฑ์",
        "เก็บภาพหน้าจอเกณฑ์เก่าไว้ก่อนแก้ไข",
        "ทดสอบกับนักเรียน 1-2 คนก่อนใช้จริงกับทุกคน"
      ]} />
    </HelpSection>

    <HelpSection title="💡 เคล็ดลับ">
      <HelpList items={[
        "ใช้ปุ่ม 'รีเซ็ต' เพื่อกลับไปค่าเริ่มต้น",
        "แก้ไขทีละเพศจะทำงานได้ง่ายกว่า",
        "ตรวจสอบว่าค่าไม่มีช่องว่าง (gap) ระหว่างระดับ",
        "ปรึกษาผู้เชี่ยวชาญก่อนกำหนดเกณฑ์ที่เข้มงวดมาก"
      ]} />
    </HelpSection>
  </>
);

export function AthleteStandardsManagement({ onBack, showBackButton = true }: AthleteStandardsManagementProps) {
  const { session } = useSession();
  const toast = useToast();
  const [selectedTestType, setSelectedTestType] = useState<TestType>("bmi");
  const [selectedGender, setSelectedGender] = useState<"male" | "female">("male");
  // ใช้ audience='athlete' แบบชัดเจน และเพิ่มเป็นส่วนหนึ่งของ key เพื่อกัน cache ปนกับ general
  const swrKey = session?.token ? ["standards", "athlete", session.token] : null;
  const { data: standardsData, isLoading, error, mutate } = useSWR(
    swrKey,
    // ดึงเฉพาะเกณฑ์ของกลุ่มนักกีฬาเท่านั้น (backend ถูกแก้ให้ไม่ fallback แล้ว)
    async ([, , token]) => api.listStandards(token, "athlete"),
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );
  const [standards, setStandards] = useState<StandardRow[]>([]);
  useEffect(() => {
    if (standardsData) setStandards(standardsData);
  }, [standardsData]);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StandardRow | null>(null);
  const [formState, setFormState] = useState<{
    category: string;
    minValue: string;
    maxValue: string;
  }>({
    category: "",
    minValue: "",
    maxValue: "",
  });
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<{
    testType: TestType;
    gender: "male" | "female";
    ageMin: string;
    ageMax: string;
    category: string;
    comparison: "range" | "threshold";
    minValue: string;
    maxValue: string;
  }>({
    testType: selectedTestType,
    gender: selectedGender,
    ageMin: "15",
    ageMax: "25",
    category: "ดีเยี่ยม",
    comparison: "range",
    minValue: "",
    maxValue: "",
  });

  const filteredStandards = useMemo(
    () =>
      standards.filter(
        (s) => s.testType === selectedTestType && s.gender === selectedGender,
      ),
    [standards, selectedTestType, selectedGender],
  );

  // เปิด dialog แก้ไข พร้อมเติมค่าเริ่มต้นจากแถวที่เลือก
  const handleEdit = (row: StandardRow) => {
    setSelectedRow(row);
    setFormState({
      category: row.category,
      minValue: row.minValue?.toString() ?? "",
      maxValue: row.maxValue?.toString() ?? "",
    });
    setEditOpen(true);
  };

  // บันทึกค่าที่แก้ไขลง backend โดยบังคับ audience = 'athlete'
  const handleEditSubmit = async () => {
    if (!session?.token || !selectedRow) return;
    const minValue = formState.minValue.trim() === "" ? null : parseFloat(formState.minValue);
    const maxValue = formState.maxValue.trim() === "" ? null : parseFloat(formState.maxValue);
    
    if ((formState.minValue && isNaN(minValue!)) || (formState.maxValue && isNaN(maxValue!))) {
      toast.error("ค่า Min/Max ต้องเป็นตัวเลข");
      return;
    }

    try {
      await api.updateStandard(session.token, {
        id: selectedRow.id,
        testType: selectedRow.testType,
        gender: selectedRow.gender,
        ageMin: selectedRow.ageMin,
        ageMax: selectedRow.ageMax,
        category: formState.category.trim() || selectedRow.category,
        minValue,
        maxValue,
        comparison: selectedRow.comparison,
        audience: selectedRow.audience ?? "athlete",
      });
      await mutate(async () => api.listStandards(session.token, "athlete"), { revalidate: false });
      toast.success("บันทึกเกณฑ์เรียบร้อย");
      setEditOpen(false);
      setSelectedRow(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถบันทึกได้");
    }
  };

  // เปิด dialog ยืนยันการลบ
  const handleDeleteClick = (row: StandardRow) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  // ลบแถวที่เลือกแล้วรีเฟรชรายการ (เฉพาะของนักกีฬา)
  const handleDeleteConfirm = async () => {
    if (!session?.token || !selectedRow) return;
    try {
      await api.deleteStandard(session.token, selectedRow.id);
      await mutate(async () => api.listStandards(session.token, "athlete"), { revalidate: false });
      toast.success("ลบเกณฑ์เรียบร้อย");
      setDeleteOpen(false);
      setSelectedRow(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถลบได้");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) {
      toast.error("กรุณาเข้าสู่ระบบก่อนเพิ่มเกณฑ์");
      return;
    }
    const ageMin = Number(addForm.ageMin);
    const ageMax = Number(addForm.ageMax);
    if (Number.isNaN(ageMin) || Number.isNaN(ageMax) || ageMin > ageMax) {
      toast.error("ช่วงอายุไม่ถูกต้อง");
      return;
    }
    const minValue = addForm.minValue.trim() === "" ? null : Number(addForm.minValue);
    const maxValue = addForm.maxValue.trim() === "" ? null : Number(addForm.maxValue);
    if ((addForm.minValue && Number.isNaN(minValue)) || (addForm.maxValue && Number.isNaN(maxValue))) {
      toast.error("ค่า Min/Max ต้องเป็นตัวเลข");
      return;
    }
    try {
      await api.createStandard(session.token, {
        testType: addForm.testType,
        gender: addForm.gender,
        ageMin,
        ageMax,
        category: addForm.category.trim() || "ไม่ระบุ",
        minValue,
        maxValue,
        comparison: addForm.comparison,
        audience: "athlete",
      });
      await mutate(async () => api.listStandards(session.token, "athlete"), { revalidate: false });
      toast.success("เพิ่มเกณฑ์สำเร็จ");
      setAddOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถเพิ่มเกณฑ์ได้");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับ
            </Button>
          )}
          <Trophy className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">จัดการเกณฑ์นักกีฬา</h1>
            <p className="text-sm text-muted">
              กำหนดมาตรฐานการประเมินสำหรับนักกีฬา (เข้มงวดกว่านักเรียนทั่วไป)
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpDialogOpen(true)}
            className="shrink-0"
            title="คู่มือการใช้งาน"
          >
            <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-primary" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setAddForm((prev) => ({
                ...prev,
                testType: selectedTestType,
                gender: selectedGender,
              }));
              setAddOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มเกณฑ์
          </Button>
          {/* ส่งออก CSV ของเกณฑ์นักกีฬาตามตัวกรองปัจจุบัน */}
          <Button
            variant="outline"
            onClick={() => {
              const csvRows = filteredStandards.map((r) => ({
                test_type: TEST_TYPE_DETAILS[r.testType].label,
                gender: genderLabel(r.gender),
                age_min: r.ageMin,
                age_max: r.ageMax,
                category: r.category,
                min_value: r.minValue ?? "",
                max_value: r.maxValue ?? "",
                comparison: r.comparison,
                audience: r.audience ?? "athlete",
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
                `standards-athlete-${selectedTestType}-${selectedGender}-th.csv`,
              );
            }}
            disabled={!filteredStandards.length}
          >
            ส่งออก CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border border-border/60 bg-surface">
        <CardHeader>
          <CardTitle>เลือกประเภทการทดสอบและเพศ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-type">ประเภทการทดสอบ</Label>
              <Select
                id="test-type"
                value={selectedTestType}
                onChange={(e) => setSelectedTestType(e.target.value as TestType)}
              >
                {Object.entries(TEST_TYPE_DETAILS).map(([value, details]) => (
                  <option key={value} value={value}>
                    {details.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">เพศ</Label>
              <Select
                id="gender"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value as "male" | "female")}
              >
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standards Grid styled like /standards */}
      <Card className="rounded-3xl border border-border-strong/80 bg-surface-elevated p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">
              {TEST_TYPE_DETAILS[selectedTestType].label} - {genderLabel(selectedGender)} ({filteredStandards[0]?.ageMin === filteredStandards[0]?.ageMax ? `${filteredStandards[0]?.ageMin ?? ''} ปี` : `${filteredStandards[0]?.ageMin ?? ''}-${filteredStandards[0]?.ageMax ?? ''} ปี`})
            </h2>
            <p className="text-sm text-muted">{TEST_TYPE_DETAILS[selectedTestType].description}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredStandards.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed p-6 text-center text-muted">
              ไม่พบเกณฑ์สำหรับการทดสอบนี้
            </div>
          ) : (
            filteredStandards.map((row, index) => {
              const unit = TEST_TYPE_DETAILS[row.testType].unit;
              return (
                <div
                  key={`${row.testType}-${row.gender}-${index}`}
                  className={`rounded-2xl border px-4 py-3 text-sm ${getCategoryStyle(row.category)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.category}</p>
                      <p className="text-xs opacity-80">{formatRange(row, unit)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(row)}
                        className="rounded-full"
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(row)}
                        className="rounded-full text-rose-600 hover:bg-rose-50"
                      >
                        ลบ
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add Standard Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>เพิ่มเกณฑ์มาตรฐานนักกีฬา</DialogTitle>
            <DialogDescription>
              ใช้รูปแบบเดียวกับหน้าเกณฑ์มาตรฐาน และจำกัดเฉพาะประเภทการทดสอบที่ระบบรองรับ
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-sm">ประเภทการทดสอบ</Label>
                <Select
                  value={addForm.testType}
                  onChange={(e) => setAddForm((p) => ({ ...p, testType: e.target.value as TestType }))}
                >
                  {Object.keys(TEST_TYPE_DETAILS).map((key) => (
                    <option key={key} value={key}>
                      {TEST_TYPE_DETAILS[key as TestType].label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-sm">เพศ</Label>
                <Select
                  value={addForm.gender}
                  onChange={(e) => setAddForm((p) => ({ ...p, gender: e.target.value as "male" | "female" }))}
                >
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-sm">อายุต่ำสุด</Label>
                <Input value={addForm.ageMin} type="number" min={0} onChange={(e) => setAddForm((p) => ({ ...p, ageMin: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1 block text-sm">อายุสูงสุด</Label>
                <Input value={addForm.ageMax} type="number" min={0} onChange={(e) => setAddForm((p) => ({ ...p, ageMax: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-sm">หมวดหมู่</Label>
                <Input value={addForm.category} onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))} placeholder="เช่น ดีเยี่ยม, ดี, พอใช้, ต้องปรับปรุง" />
              </div>
              <div>
                <Label className="mb-1 block text-sm">รูปแบบการเปรียบเทียบ</Label>
                <Select
                  value={addForm.comparison}
                  onChange={(e) => setAddForm((p) => ({ ...p, comparison: e.target.value as "range" | "threshold" }))}
                >
                  <option value="range">ช่วง (Min - Max)</option>
                  <option value="threshold">เกณฑ์เดียว (≥ Min หรือ ≤ Max)</option>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-sm">ค่าต่ำสุด (Min)</Label>
                <Input value={addForm.minValue} onChange={(e) => setAddForm((p) => ({ ...p, minValue: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1 block text-sm">ค่าสูงสุด (Max)</Label>
                <Input value={addForm.maxValue} onChange={(e) => setAddForm((p) => ({ ...p, maxValue: e.target.value }))} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit">เพิ่มเกณฑ์</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ControlledHelpDialog
        isOpen={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        title="คู่มือจัดการเกณฑ์นักกีฬา"
        content={HelpContent}
      />

      {/* Edit Standard Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>แก้ไขเกณฑ์มาตรฐานนักกีฬา</DialogTitle>
            <DialogDescription>
              แก้ไขค่าเกณฑ์ที่ใช้ในการประเมินสมรรถภาพของนักกีฬา
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>ประเภท:</strong> {TEST_TYPE_DETAILS[selectedRow.testType].label} ({genderLabel(selectedRow.gender)})
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>ช่วงอายุ:</strong> {selectedRow.ageMin}-{selectedRow.ageMax} ปี
                </p>
              </div>
              <div>
                <Label className="mb-1 block text-sm">หมวดหมู่</Label>
                <Input 
                  value={formState.category} 
                  onChange={(e) => setFormState(p => ({ ...p, category: e.target.value }))}
                  placeholder="เช่น ดีเยี่ยม, ดี, พอใช้"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-sm">ค่าต่ำสุด (Min)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={formState.minValue} 
                    onChange={(e) => setFormState(p => ({ ...p, minValue: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-sm">ค่าสูงสุด (Max)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={formState.maxValue} 
                    onChange={(e) => setFormState(p => ({ ...p, maxValue: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEditSubmit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบเกณฑ์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
              <p className="text-sm font-medium text-rose-900">{selectedRow.category}</p>
              <p className="text-xs text-rose-700">
                {TEST_TYPE_DETAILS[selectedRow.testType].label} - {genderLabel(selectedRow.gender)} ({selectedRow.ageMin}-{selectedRow.ageMax} ปี)
              </p>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>ลบเกณฑ์</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, HelpCircle, Info } from "lucide-react";
import { useSession } from "@/providers/session-provider";
import { useGlobalLoading } from "@/providers/loading-provider";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/lib/api";
import type {
  StandardPayload,
  StandardRow,
  TestType,
} from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StandardsManagementProps {
  onBack: () => void;
  initialTestType?: TestType | "all";
  initialGender?: "male" | "female" | "all";
}

const TEST_TYPE_OPTIONS: Array<{ value: TestType; label: string }> = [
  { value: "bmi", label: "BMI" },
  { value: "sit_and_reach", label: "นั่งงอตัวเอื้อมไปข้างหน้า" },
  { value: "hand_grip", label: "แรงบีบมือ" },
  { value: "chair_stand", label: "ลุกนั่งเก้าอี้" },
  { value: "step_up", label: "ก้าวขึ้นลงแท่น" },
];

const EMPTY_STANDARD: StandardPayload = {
  testType: "bmi",
  gender: "male",
  ageMin: 6,
  ageMax: 18,
  category: "ดี",
  minValue: null,
  maxValue: null,
  comparison: "range",
};

export function StandardsManagement({
  onBack,
  initialTestType,
  initialGender,
}: StandardsManagementProps) {
  const { session } = useSession();
  const { showLoading, hideLoading } = useGlobalLoading();
  const toast = useToast();
  const [standards, setStandards] = useState<StandardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTestTab, setActiveTestTab] = useState<TestType | "all">(initialTestType ?? "all");
  const [genderFilter, setGenderFilter] = useState<"male" | "female" | "all">(
    initialGender ?? "all",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StandardPayload>(EMPTY_STANDARD);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [standardToDelete, setStandardToDelete] = useState<StandardRow | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const loadStandards = useCallback(async () => {
    if (!session?.token) {
      setStandards([]);
      toast.error("กรุณาเข้าสู่ระบบเพื่อดึงข้อมูลเกณฑ์มาตรฐาน");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.listStandards(session.token);
      setStandards(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถโหลดเกณฑ์มาตรฐานได้";
      toast.error(message);
      setStandards([]);
    } finally {
      setLoading(false);
    }
  }, [session?.token, toast]);

  useEffect(() => {
    void loadStandards();
  }, [loadStandards]);

  useEffect(() => {
    if (initialTestType) {
      setActiveTestTab(initialTestType);
    }
  }, [initialTestType]);

  useEffect(() => {
    if (initialGender) {
      setGenderFilter(initialGender);
    }
  }, [initialGender]);

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setFormData(EMPTY_STANDARD);
    setIsDialogOpen(true);
  };

  const startEdit = (standard: StandardRow) => {
    setCreating(false);
    setEditingId(standard.id);
    setFormData({
      id: standard.id,
      testType: standard.testType,
      gender: standard.gender,
      ageMin: standard.ageMin,
      ageMax: standard.ageMax,
      category: standard.category,
      minValue: standard.minValue,
      maxValue: standard.maxValue,
      comparison: standard.comparison,
    });
    setIsDialogOpen(true);
  };

  const cancelForm = () => {
    setCreating(false);
    setEditingId(null);
    setFormData(EMPTY_STANDARD);
    setSubmitting(false);
    setIsDialogOpen(false);
  };

  const confirmDelete = (standard: StandardRow) => {
    setStandardToDelete(standard);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!session?.token || !standardToDelete) return;

    try {
      showLoading("กำลังลบเกณฑ์มาตรฐาน...");
      await api.deleteStandard(session.token, standardToDelete.id);
      setDeleteDialogOpen(false);
      setStandardToDelete(null);
      toast.success("ลบเกณฑ์มาตรฐานสำเร็จ");
      await loadStandards();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถลบเกณฑ์มาตรฐานได้";
      toast.error(message);
    } finally {
      hideLoading();
    }
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!session?.token) {
      toast.error("กรุณาเข้าสู่ระบบก่อนบันทึกเกณฑ์มาตรฐาน");
      return;
    }

    if (!formData.category.trim()) {
      toast.warning("กรุณาระบุชื่อประเภทผลการประเมิน");
      return;
    }

    try {
      setSubmitting(true);
      showLoading(creating ? "กำลังเพิ่มเกณฑ์มาตรฐาน..." : "กำลังบันทึกการแก้ไข...");
      if (creating) {
        await api.createStandard(session.token, formData);
        toast.success("เพิ่มเกณฑ์มาตรฐานสำเร็จ");
      } else if (editingId) {
        await api.updateStandard(session.token, { ...formData, id: editingId });
        toast.success("แก้ไขเกณฑ์มาตรฐานสำเร็จ");
      }
      cancelForm();
      await loadStandards();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถบันทึกเกณฑ์มาตรฐานได้";
      toast.error(message);
      setSubmitting(false);
    } finally {
      hideLoading();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-subtle">กำลังโหลดเกณฑ์มาตรฐาน...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">จัดการเกณฑ์มาตรฐาน</h1>
          <p className="text-sm text-muted">
            เกณฑ์สำหรับประเมินผลการทดสอบของนักเรียนทั่วไป
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              console.log('Help button clicked, current state:', helpDialogOpen);
              setHelpDialogOpen(true);
              console.log('After setState, should be true');
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            คู่มือ
          </Button>
          <Button onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มเกณฑ์
          </Button>
          <Button variant="secondary" onClick={onBack}>
            <X className="mr-2 h-4 w-4" />
            ปิด
          </Button>
        </div>
      </div>

      {/* Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onOpenChange={(open) => {
          console.log('Dialog onOpenChange called with:', open);
          setHelpDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto z-[60]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              คู่มือการใช้งาน - จัดการเกณฑ์มาตรฐาน
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-semibold text-base">📊 ข้อมูลในตารางมาจากไหน?</h3>
              <div className="space-y-2 pl-4">
                <p><strong>• ประเภทการทดสอบ:</strong> ชนิดของการทดสอบสมรรถภาพ (BMI, Sit and Reach, ฯลฯ)</p>
                <p><strong>• ช่วงอายุ:</strong> กลุ่มอายุที่ใช้เกณฑ์นี้ (เช่น 18-25 ปี)</p>
                <p><strong>• หมวดหมู่:</strong> ระดับการประเมิน (เช่น "ดีมาก", "ดี", "ปานกลาง", "ควรปรับปรุง")</p>
                <p><strong>• ค่า Min/Max:</strong> ช่วงคะแนนที่กำหนดสำหรับแต่ละระดับ</p>
                <p><strong>• รูปแบบ:</strong> วิธีการเปรียบเทียบ (ช่วงค่า หรือ ค่าอ้างอิง)</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">🎯 วิธีการใช้งาน</h3>
              <div className="space-y-2 pl-4">
                <p><strong>1. เพิ่มเกณฑ์ใหม่:</strong> กดปุ่ม "เพิ่มเกณฑ์" ด้านบน</p>
                <p><strong>2. แก้ไขเกณฑ์:</strong> กดปุ่ม "แก้ไข" ในแต่ละรายการ → จะเด้งฟอร์มแก้ไขขึ้นมา</p>
                <p><strong>3. ลบเกณฑ์:</strong> กดปุ่ม "ลบ" → ยืนยันการลบในหน้าต่างที่เด้งขึ้น</p>
                <p><strong>4. กรองข้อมูล:</strong> ใช้ Tabs ด้านล่างเลือกประเภทการทดสอบ และเลือกเพศจากตัวกรอง</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">💡 ตัวอย่างการตั้งค่า</h3>
              <div className="bg-surface-elevated p-4 rounded-lg space-y-2">
                <p><strong>ตัวอย่าง:</strong> BMI สำหรับเพศชาย อายุ 18-25 ปี</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>หมวดหมู่: "ดีมาก" → Min: 18.5, Max: 22.9</li>
                  <li>หมวดหมู่: "ดี" → Min: 23.0, Max: 24.9</li>
                  <li>หมวดหมู่: "ปานกลาง" → Min: 25.0, Max: 29.9</li>
                  <li>หมวดหมู่: "ควรปรับปรุง" → Min: 30.0, Max: null</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">⚠️ ข้อควรระวัง</h3>
              <div className="space-y-2 pl-4 text-amber-700 dark:text-amber-400">
                <p>• ต้องกำหนดช่วงอายุและเพศให้ครบถ้วน</p>
                <p>• ค่า Min/Max ต้องสมเหตุสมผลตามประเภทการทดสอบ</p>
                <p>• การลบเกณฑ์จะมีผลทันทีและไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelForm();
          } else {
            setIsDialogOpen(true);
          }
        }}
      >
        {/* ===== ⬇️ ⬇️ ⬇️ จุดที่แก้ไข (วิธีที่ง่ายที่สุด) ⬇️ ⬇️ ⬇️ ===== */}
        
        {/* 1. สั่งให้ DialogContent เลื่อนได้ทั้งอัน เมื่อความสูงเกิน 85% ของจอ */}
        <DialogContent className="max-w-2xl max-h-[85svh] overflow-y-auto">
          
          {/* ===== ⬆️ ⬆️ ⬆️ แก้ไขบรรทัดนี้ครับ ⬆️ ⬆️ ⬆️ ===== */}

          <DialogHeader>
            <DialogTitle>
              {creating ? "เพิ่มเกณฑ์มาตรฐานใหม่" : "แก้ไขเกณฑ์มาตรฐาน"}
            </DialogTitle>
            <DialogDescription>
              กำหนดช่วงอายุและเกณฑ์การประเมินสำหรับการทดสอบสมรรถภาพกายในแต่ละหมวดหมู่2222
            </DialogDescription>
          </DialogHeader>
          
          {/* 2. คืนค่า <form> กลับเป็นแบบเดิม (ลบ flex-col, flex-1, overflow-hidden ออก) */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* 3. ลบ div ที่ครอบ (flex-1 overflow-y-auto) ออก คืนค่าเดิม */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">ประเภทการทดสอบ</label>
                <Select
                  value={formData.testType}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, testType: event.target.value as TestType }))
                  }
                >
                  {TEST_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">เพศ222</label>
                <Select
                  value={formData.gender}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, gender: event.target.value as "male" | "female" }))
                  }
                >
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">อายุต่ำสุด</label>
                <Input
                  type="number"
                  value={formData.ageMin}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, ageMin: Number(event.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">อายุสูงสุด</label>
                <Input
                  type="number"
                  value={formData.ageMax}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, ageMax: Number(event.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">หมวดหมู่ผลการประเมิน</label>
                <Input
                  value={formData.category}
                  onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">รูปแบบการเปรียบเทียบ</label>
                <Select
                  value={formData.comparison}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      comparison: event.target.value as "range" | "threshold",
                    }))
                  }
                >
                  <option value="range">อยู่ระหว่างค่า Min - Max</option>
                  <option value="threshold">ค่ามากกว่าหรือน้อยกว่าที่กำหนด</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">ค่าต่ำสุด (Min)</label>
                <Input
                  type="number"
                  value={formData.minValue ?? ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      minValue: event.target.value === "" ? null : Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">ค่าสูงสุด (Max)</label>
                <Input
                  type="number"
                  value={formData.maxValue ?? ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxValue: event.target.value === "" ? null : Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            {/* 4. คืนค่า div ของปุ่ม กลับเป็นแบบเดิม (ลบ pt-4 ออก) */}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={cancelForm}>
                <X className="mr-2 h-4 w-4" />
                ยกเลิก
              </Button>
              <Button type="submit" loading={submitting}>
                <Save className="mr-2 h-4 w-4" />
                บันทึก
              </Button>
            </div>
          </form>
          
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1 block text-sm font-medium">เลือกเพศ</label>
            <Select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value as typeof genderFilter)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <p className="text-xs text-muted">
              ใช้แท็บด้านล่างเพื่อสลับระหว่างเกณฑ์ของการทดสอบแต่ละประเภท หรือเลือก {`"ทั้งหมด"`} เพื่อดูทุกหมวดในคราวเดียว
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายการเกณฑ์มาตรฐาน</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Tabs
            value={activeTestTab}
            onValueChange={(value) => setActiveTestTab(value as typeof activeTestTab)}
            className="space-y-4"
          >
            <TabsList className="flex w-full flex-wrap justify-start gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-surface p-2">
              <TabsTrigger value="all" className="rounded-full px-4 py-2 text-sm">
                ทั้งหมด
              </TabsTrigger>
              {TEST_TYPE_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="rounded-full px-4 py-2 text-sm"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {["all", ...TEST_TYPE_OPTIONS.map((option) => option.value)].map((value) => {
              const scopedList = standards
                .filter((standard) => {
                  const matchesTest = value === "all" || standard.testType === value;
                  const matchesGender = genderFilter === "all" || standard.gender === genderFilter;
                  return matchesTest && matchesGender;
                })
                .sort((a, b) => {
                  if (a.gender !== b.gender) {
                    return a.gender === "male" ? -1 : 1;
                  }
                  if (a.ageMin !== b.ageMin) {
                    return a.ageMin - b.ageMin;
                  }
                  return a.category.localeCompare(b.category, "th");
                });

              const sections = (["male", "female"] as const)
                .map((gender) => ({
                  gender,
                  rows: scopedList.filter((standard) => standard.gender === gender),
                }))
                .filter((section) => section.rows.length > 0);

              return (
                <TabsContent key={value} value={value as typeof activeTestTab}>
                  {scopedList.length === 0 ? (
                    <div className="py-10 text-center text-muted">
                      ยังไม่มีเกณฑ์ที่ตรงกับตัวกรอง
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sections.map((section) => (
                        <div key={`${value}-${section.gender}`} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-primary">
                              {section.gender === "male" ? "เพศชาย" : "เพศหญิง"}
                            </h3>
                            <span className="text-xs text-muted">
                              {section.rows.length} รายการ
                            </span>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-border-strong/80 bg-surface-elevated">
                            <table className="min-w-full divide-y divide-border text-sm">
                              <thead className="bg-surface">
                                <tr>
                                  <th className="px-4 py-3 text-left">การทดสอบ</th>
                                  <th className="px-4 py-3 text-left">ช่วงอายุ</th>
                                  <th className="px-4 py-3 text-left">หมวดหมู่</th>
                                  <th className="px-4 py-3 text-left">ค่า Min</th>
                                  <th className="px-4 py-3 text-left">ค่า Max</th>
                                  <th className="px-4 py-3 text-left">รูปแบบ</th>
                                  <th className="px-4 py-3 text-right">จัดการ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {section.rows.map((standard) => (
                                  <tr key={standard.id} className="align-top">
                                    <td className="px-4 py-3">
                                      {TEST_TYPE_OPTIONS.find((option) => option.value === standard.testType)?.label ?? standard.testType}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {standard.ageMin} - {standard.ageMax} ปี
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge variant="secondary">{standard.category}</Badge>
                                    </td>
                                    <td className="px-4 py-3">{standard.minValue ?? "-"}</td>
                                    <td className="px-4 py-3">{standard.maxValue ?? "-"}</td>
                                    <td className="px-4 py-3">
                                      {standard.comparison === "range" ? "ช่วงค่า" : "ค่าอ้างอิง"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => startEdit(standard)}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => confirmDelete(standard)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบเกณฑ์มาตรฐาน</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบเกณฑ์มาตรฐานนี้?
            </DialogDescription>
          </DialogHeader>
          {standardToDelete && (
            <div className="space-y-2 rounded-lg bg-surface-elevated p-4">
              <p><strong>ประเภทการทดสอบ:</strong> {TEST_TYPE_OPTIONS.find(o => o.value === standardToDelete.testType)?.label}</p>
              <p><strong>เพศ:</strong> {standardToDelete.gender === "male" ? "ชาย" : "หญิง"}</p>
              <p><strong>ช่วงอายุ:</strong> {standardToDelete.ageMin}-{standardToDelete.ageMax} ปี</p>
              <p><strong>หมวดหมู่:</strong> <Badge variant="secondary">{standardToDelete.category}</Badge></p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              ยืนยันการลบ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
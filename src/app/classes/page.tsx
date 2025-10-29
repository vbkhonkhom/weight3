"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalLoading } from "@/providers/loading-provider";
import useSWR from "swr";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/providers/toast-provider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { InstructorDashboardPayload } from "@/lib/types";
import { useSession } from "@/providers/session-provider";
import { ImportStudentsDialog, type ImportStudentsSummary } from "@/components/instructor/import-students-dialog";
import { StudentAccessGuide } from "@/components/instructor/student-access-guide";
import { ClassDetailView } from "@/components/instructor/class-detail-view";
import { Clipboard, UsersRound, UploadCloud, Trash2 } from "lucide-react";

interface GuideState {
  classId: string;
  className: string;
  classCode: string;
  summary?: ImportStudentsSummary;
}

interface SelectedClass {
  id: string;
  className: string;
  classCode: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { session, isRestoring } = useSession();
  const toast = useToast();
  const [className, setClassName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [importTarget, setImportTarget] = useState<GuideState | null>(null);
  const [guideState, setGuideState] = useState<GuideState | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<SelectedClass | null>(null);
  const [deleteClassDialog, setDeleteClassDialog] = useState<{ open: boolean; classId: string; className: string } | null>(null);

  useEffect(() => {
    if (!isRestoring && session?.user?.role !== "instructor") {
      router.replace("/");
    }
  }, [session, isRestoring, router]);

  const { data, mutate, isLoading } = useSWR<InstructorDashboardPayload>(
    session?.user?.role === "instructor" ? ["classes", session.token] : null,
    () => api.getInstructorDashboard(session!.token),
    {
      revalidateOnFocus: false,
    },
  );

  if (session?.user?.role !== "instructor") {
    return null;
  }

  const classes = data?.classes ?? [];

  const handleOpenImportDialog = (classId: string) => {
    const target = classes.find((klass) => klass.id === classId);
    if (!target) return;
    setImportTarget({
      classId: target.id,
      className: target.className,
      classCode: target.classCode,
    });
  };

  const handleViewClassDetails = (klass: { id: string; className: string; classCode: string }) => {
    setSelectedClass({
      id: klass.id,
      className: klass.className,
      classCode: klass.classCode,
    });
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      toast.warning("กรุณากรอกชื่อชั้นเรียน");
      return;
    }

    try {
      setIsCreating(true);
      showLoading("กำลังบันทึกข้อมูลชั้นเรียน...");
      await api.createClass(session.token, className.trim());
      setClassName("");
      toast.success("สร้างชั้นเรียนสำเร็จ");
      await mutate();
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถสร้างชั้นเรียนใหม่ได้");
    } finally {
      hideLoading();
      setIsCreating(false);
    }
  };

  const handleDeleteClass = (classId: string, className: string) => {
    const hasStudents = classes.find(c => c.id === classId)?.studentCount ?? 0;
    if (hasStudents > 0) {
      toast.error("ไม่สามารถลบห้องเรียนที่มีนักเรียนอยู่ได้ กรุณาลบนักเรียนทั้งหมดก่อน");
      return;
    }
    setDeleteClassDialog({ open: true, classId, className });
  };

  const submitDeleteClass = async () => {
    if (!deleteClassDialog || !session?.token) return;
    
    try {
      showLoading("กำลังลบห้องเรียน...");
      // TODO: Implement deleteClass API
      // await api.deleteClass(session.token, deleteClassDialog.classId);
      toast.info("ฟังก์ชันลบห้องเรียนกำลังพัฒนา");
      setDeleteClassDialog(null);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "ไม่สามารถลบห้องเรียนได้");
    } finally {
      hideLoading();
    }
  };

  const handleCopyCode = async (code: string, klass: { id: string; className: string; classCode: string }) => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopiedCode(klass.id);
      setGuideState({
        classId: klass.id,
        className: klass.className,
        classCode: klass.classCode,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (copyError) {
      console.error("Failed to copy class code", copyError);
    }
  };

  const summary = guideState?.summary;
  const recentGuide =
    guideState && (
      <StudentAccessGuide
        classDisplayName={guideState.className}
        classCode={guideState.classCode}
        importedCount={summary?.count}
        studentEmails={summary?.emails ?? []}
        className="mt-6"
      />
    );

  return (
    <AppShell
      title="จัดการชั้นเรียน"
      description="สร้างและแชร์รหัสชั้นเรียนให้กับนักเรียนเพื่อเริ่มบันทึกผล"
      actions={
        <Button
          variant="secondary"
          onClick={() =>
            window.open(
              "https://docs.google.com/spreadsheets/d/1AZ3_0g6bGya0sa2Ij1zKJZXNl3uS5P1etYL3csKt-HY/edit?usp=sharing",
              "_blank",
            )
          }
        >
          เปิด Google Sheet
        </Button>
      }
    >
      <Card>
        <CardHeader
          title="สร้างชั้นเรียนใหม่"
          description="ระบบจะสร้างรหัสชั้นเรียน 6 หลักโดยอัตโนมัติและบันทึกลงชีต `Classes`"
          action={
            <Button onClick={handleCreateClass} loading={isCreating}>
              สร้างชั้นเรียน
            </Button>
          }
        />
        <Input
          placeholder="ชื่อชั้นเรียน เช่น PE รุ่น 1/2568"
          value={className}
          onChange={(event) => setClassName(event.target.value)}
        />
      </Card>

      <div>
        <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-dashed border-border bg-surface-strong/60 p-6 text-sm text-muted">
          <div className="flex items-center gap-3 text-primary">
            <UsersRound className="h-5 w-5" />
            <div>
              <p className="text-base font-semibold text-primary">ขั้นตอนการนำเข้านักเรียน</p>
              <p className="text-xs text-muted">
                ดาวน์โหลดเทมเพลต ➜ ให้กรอกข้อมูลนักเรียน ➜ นำเข้าจากไฟล์ CSV ➜ แชร์รหัสชั้นเรียนให้นักเรียนเข้าสู่ระบบ
              </p>
            </div>
          </div>
          <p>
            เมื่อนำเข้ารายชื่อแล้ว นักเรียนสามารถเข้าสู่ระบบด้วยอีเมลที่ระบุไว้ และรหัสผ่านเริ่มต้นคือ <code className="rounded bg-accent/10 px-2 py-1 text-accent">รหัสนักศึกษา</code>
          </p>
          <p className="text-xs text-muted">
            * หากเว้นอีเมลไว้ ระบบจะสร้างให้อัตโนมัติในรูปแบบ <code className="rounded bg-accent/10 px-2 py-1 text-accent">studentId@student.wth.ac.th</code>
          </p>
        </div>

        <h2 className="text-lg font-semibold text-primary mt-8">ชั้นเรียนทั้งหมด</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          จัดการรหัสชั้นเรียนและนำเข้านักเรียนในแต่ละชั้นได้จากที่นี่
        </p>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-3xl bg-surface-strong"
              />
            ))}
          </div>
        )}

        {!isLoading && data && data.classes.length === 0 && (
          <EmptyState
            title="ยังไม่มีชั้นเรียน"
            description="สร้างชั้นเรียนแรกของคุณเพื่อเริ่มต้นใช้งานระบบ"
          />
        )}

        {!isLoading && data && data.classes.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.classes.map((klass) => (
              <div
                key={klass.id}
                className="rounded-3xl border border-border bg-surface-strong p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-primary">
                      {klass.className}
                    </h3>
                    <button
                      type="button"
                      className="mt-1 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted hover:text-primary"
                      onClick={() => handleCopyCode(klass.classCode, klass)}
                    >
                      <Clipboard className="h-3 w-3" />
                      {copiedCode === klass.id ? "คัดลอกแล้ว" : `Class Code: ${klass.classCode}`}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setImportTarget({
                          classId: klass.id,
                          className: klass.className,
                          classCode: klass.classCode,
                        })
                      }
                      className="inline-flex items-center gap-2"
                    >
                      <UploadCloud className="h-4 w-4" />
                      นำเข้า
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClass(klass.id, klass.className)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="ลบห้องเรียน"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm text-muted">
                  <div className="flex justify-between">
                    <dt>จำนวนนักเรียน</dt>
                    <dd>{klass.studentCount ?? 0} คน</dd>
                  </div>
                  {klass.latestAverages.bmi && (
                    <div className="flex justify-between">
                      <dt>BMI เฉลี่ยล่าสุด</dt>
                      <dd>{klass.latestAverages.bmi.toFixed(1)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setGuideState({
                        classId: klass.id,
                        className: klass.className,
                        classCode: klass.classCode,
                        summary: guideState?.classId === klass.id ? guideState.summary : undefined,
                      })
                    }
                  >
                    แชร์ขั้นตอนให้นักเรียน
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleViewClassDetails(klass)}
                  >
                    ดูรายละเอียด
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {recentGuide}

      {selectedClass && (
        <ClassDetailView
          classId={selectedClass.id}
          className={selectedClass.className}
          classCode={selectedClass.classCode}
          onBack={() => setSelectedClass(null)}
          onImportStudents={handleOpenImportDialog}
        />
      )}

      {importTarget && (
        <ImportStudentsDialog
          classData={{
            id: importTarget.classId,
            className: importTarget.className,
            classCode: importTarget.classCode,
          }}
          onClose={() => setImportTarget(null)}
          onImportComplete={async (summary) => {
            const target = importTarget;
            await mutate();
            if (target) {
              setGuideState({
                ...target,
                summary,
              });
            }
            setImportTarget(null);
          }}
        />
      )}

      {/* Delete Class Dialog */}
      <Dialog open={!!deleteClassDialog} onOpenChange={(open) => !open && setDeleteClassDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบห้องเรียน</DialogTitle>
            <DialogDescription>
              คุณต้องการลบห้องเรียน <strong>{deleteClassDialog?.className}</strong> ใช่หรือไม่?
              <br />
              <span className="text-red-600">การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลนักเรียนและผลการทดสอบทั้งหมดในห้องนี้</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteClassDialog(null)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={submitDeleteClass}>
              ลบห้องเรียน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

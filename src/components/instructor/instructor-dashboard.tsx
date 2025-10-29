"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  BookOpen, 
  Settings, 
  Plus, 
  Ruler,
  School,
  Dumbbell,
  ListChecks,
  ClipboardList,
  TrendingUp,
  FileBarChart,
  HelpCircle,
  Trophy,
} from "lucide-react";
import { AnalyticsHighlights, type DrilldownType } from "./analytics-highlights";
import { PerformanceComparisonPanel } from "./performance-comparison-panel";
import { AlertsPanel } from "./alerts-panel";
import { DrilldownDialog } from "./drilldown-dialog";
import { ClassCard } from "./class-card";
import { CreateClassDialog } from "./create-class-dialog";
import { ClassDetailView } from "./class-detail-view";
import { StandardsManagement } from "./standards-management";
import { ImportStudentsDialog, type ImportStudentsSummary } from "./import-students-dialog";
import { ControlledHelpDialog } from "@/components/ui/help-dialog";
import { InstructorHelpContent } from "@/lib/help-content-instructor";
import {
  FeaturePreviewDialog,
  type FeaturePreviewContext,
} from "./feature-preview-dialog";
import { useSession } from "@/providers/session-provider";
import { useGlobalLoading } from "@/providers/loading-provider";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/lib/api";
import {
  buildClassSnapshot,
  buildInstructorAnalytics,
  type ClassSnapshot,
  type InstructorAnalytics,
} from "@/lib/instructor-analytics";
import type { ClassSummary, ClassStudent, InstructorDashboardPayload } from "@/lib/types";

interface ImportDialogState {
  id: string;
  className: string;
  classCode: string;
}

export function InstructorDashboard() {
  const { session, isRestoring } = useSession();
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();
  const toast = useToast();
  const [dashboardData, setDashboardData] = useState<InstructorDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string; code: string } | null>(null);
  const [showStandards, setShowStandards] = useState(false);
  const [showImportStudents, setShowImportStudents] = useState<ImportDialogState | null>(null);
  const [studentLookup, setStudentLookup] = useState<Record<string, ClassStudent[]>>({});
  const [classSnapshots, setClassSnapshots] = useState<ClassSnapshot[]>([]);
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [drilldownState, setDrilldownState] = useState<{ open: boolean; type: DrilldownType | null }>({
    open: false,
    type: null,
  });
  const [featurePreview, setFeaturePreview] = useState<FeaturePreviewContext | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Quick action handlers
  const handleNavigateTo = (path: string) => {
    router.push(path);
  };

  const loadClassSnapshots = useCallback(
    async (classes: ClassSummary[]) => {
      if (!session?.token || classes.length === 0) {
        setStudentLookup({});
        setClassSnapshots([]);
        setAnalytics(null);
        return;
      }

      try {
        setLoadingSnapshots(true);
        const entries = await Promise.all(
          classes.map(async (klass) => {
            const response = await api.getClassStudents(session.token, klass.id);
            return [klass.id, response.students] as const;
          }),
        );

        const lookup: Record<string, ClassStudent[]> = {};
        entries.forEach(([classId, students]) => {
          lookup[classId] = students;
        });
        setStudentLookup(lookup);

        const snapshots = classes.map((klass) =>
          buildClassSnapshot(klass, lookup[klass.id] ?? []),
        );
        setClassSnapshots(snapshots);
        setAnalytics(buildInstructorAnalytics(classes, snapshots));
      } catch (err) {
        console.error("loadClassSnapshots", err);
        setAnalytics(null);
      } finally {
        setLoadingSnapshots(false);
      }
    },
    [session?.token],
  );

  const loadDashboard = useCallback(async () => {
    if (!session?.token) {
      setDashboardData(null);
      setStudentLookup({});
      setClassSnapshots([]);
      setAnalytics(null);
      toast.error("กรุณาเข้าสู่ระบบเพื่อดูแดชบอร์ดของครู");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getInstructorDashboard(session.token);
      setDashboardData(data);
      setLoading(false);
      await loadClassSnapshots(data.classes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถโหลดแดชบอร์ดได้";
      toast.error(message);
      setDashboardData(null);
      setClassSnapshots([]);
      setAnalytics(null);
      setLoading(false);
    }
  }, [session?.token, loadClassSnapshots, toast]);

  useEffect(() => {
    if (!isRestoring) {
      void loadDashboard();
    }
  }, [isRestoring, loadDashboard]);

  const handleOpenDrilldown = (type: DrilldownType) => {
    setDrilldownState({ open: true, type });
  };

  const handleCreateClass = async (className: string) => {
    if (!session?.token) {
      alert("กรุณาเข้าสู่ระบบก่อนสร้างชั้นเรียน");
      return;
    }

    try {
      showLoading("กำลังสร้างชั้นเรียนใหม่...");
      await api.createClass(session.token, className);
      setShowCreateClass(false);
      await loadDashboard();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถสร้างชั้นเรียนได้";
      alert(message);
    } finally {
      hideLoading();
    }
  };

  const handleViewDetails = (classId: string) => {
    const classInfo = dashboardData?.classes.find((klass) => klass.id === classId);
    if (classInfo) {
      setDrilldownState({ open: false, type: null });
      setSelectedClass({ id: classId, name: classInfo.className, code: classInfo.classCode });
    }
  };

  const handleImportStudents = (classId: string) => {
    const classInfo = dashboardData?.classes.find((klass) => klass.id === classId);
    if (classInfo) {
      setShowImportStudents({
        id: classId,
        className: classInfo.className,
        classCode: classInfo.classCode,
      });
    }
  };

  const handleExportData = useCallback(
    (classId: string) => {
      const classInfo = dashboardData?.classes.find((klass) => klass.id === classId);
      setFeaturePreview({
        feature: "export-class",
        className: classInfo?.className,
        classCode: classInfo?.classCode,
      });
    },
    [dashboardData?.classes],
  );

  const closeImportDialog = () => setShowImportStudents(null);

  if (isRestoring || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-subtle">
            {isRestoring ? "กำลังตรวจสอบสิทธิ์..." : "กำลังโหลดข้อมูล..."}
          </p>
        </div>
      </div>
    );
  }

  if (!session?.token) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-surface p-8 text-center">
        <h2 className="text-xl font-semibold text-primary">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-sm text-muted">แดชบอร์ดสำหรับครูผู้สอนสามารถเข้าถึงได้หลังจากเข้าสู่ระบบเท่านั้น</p>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <>
        <ClassDetailView
          classId={selectedClass.id}
          className={selectedClass.name}
          classCode={selectedClass.code}
          onBack={() => setSelectedClass(null)}
          onImportStudents={() => handleImportStudents(selectedClass.id)}
        />
        {showImportStudents && session?.token && (
          <ImportStudentsDialog
            classData={showImportStudents}
            onClose={closeImportDialog}
            onImportComplete={async (_summary: ImportStudentsSummary) => {
              void _summary;
              await loadDashboard();
            }}
          />
        )}
      </>
    );
  }

  if (showStandards) {
    return <StandardsManagement onBack={() => setShowStandards(false)} />;
  }

  const classes: ClassSummary[] = dashboardData?.classes ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-primary">แดชบอร์ดครูผู้สอน</h1>
            <p className="text-sm text-muted">
              จัดการชั้นเรียน ตรวจสอบสถิติ และอัปเดตเกณฑ์มาตรฐานการทดสอบ
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
          <Button onClick={() => handleNavigateTo("/instructor/reports")}>
            <FileBarChart className="mr-2 h-4 w-4" />
            รายงานและสถิติ
          </Button>
          <Button onClick={() => setShowCreateClass(true)}>
            <Plus className="mr-2 h-4 w-4" />
            สร้างชั้นเรียน
          </Button>
          <Button variant="secondary" onClick={() => handleNavigateTo("/instructor/athlete-standards")}>
            <Trophy className="mr-2 h-4 w-4" />
            เกณฑ์มาตรฐานนักกีฬา
          </Button>
        </div>
      </div>

      <AnalyticsHighlights
        analytics={analytics}
        loading={loadingSnapshots && !analytics}
        onOpenDrilldown={handleOpenDrilldown}
      />

      {loadingSnapshots ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-gray-200" />
          </CardContent>
        </Card>
      ) : classSnapshots.length > 0 ? (
        <PerformanceComparisonPanel snapshots={classSnapshots} studentLookup={studentLookup} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted">
            สร้างชั้นเรียนหรือรอให้นักเรียนบันทึกผลเพื่อดูกราฟเปรียบเทียบ
          </CardContent>
        </Card>
      )}

      <AlertsPanel alerts={analytics?.alerts ?? []} onViewClass={handleViewDetails} />

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenDrilldown("distribution")}
          disabled={classSnapshots.length === 0}
          className="text-xs text-accent hover:text-accent-dark"
        >
          ดูสัดส่วนระดับสมรรถภาพ
        </Button>
      </div>

      <Tabs defaultValue="classes" className="w-full">
        <TabsList>
          <TabsTrigger value="classes">
            <Users className="mr-2 h-4 w-4" /> ชั้นเรียนของฉัน
          </TabsTrigger>
          <TabsTrigger value="resources">
            <BookOpen className="mr-2 h-4 w-4" /> คู่มือการใช้งาน
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" /> เครื่องมือเพิ่มเติม
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted">
                ยังไม่มีชั้นเรียน เริ่มต้นด้วยการสร้างชั้นเรียนใหม่
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:gap-8">
              {classes.map((classData) => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  onViewDetails={handleViewDetails}
                  onExportData={handleExportData}
                  onImportStudents={handleImportStudents}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>คู่มือเริ่มต้นสำหรับภาคเรียนใหม่</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted">
              <ol className="list-decimal space-y-3 pl-5">
                <li>
                  <span className="text-primary font-medium">สร้างหรืออัปเดตรายวิชา</span> ผ่านปุ่ม
                  <span className="mx-1 font-medium text-primary">“สร้างชั้นเรียน”</span> แล้วแบ่งปันรหัสชั้นเรียนให้นักเรียน
                  ใช้ลงทะเบียนในแอป
                </li>
                <li>
                  <span className="text-primary font-medium">นำเข้าหรือลงชื่อรายบุคคล</span> โดยใช้ไฟล์ Google Sheet แม่แบบ
                  หรือเพิ่มชื่อเฉพาะกิจ หากมีนักเรียนใหม่เพิ่มภายหลังสามารถนำเข้าไฟล์ซ้ำได้ ระบบจะไม่สร้างรายการซ้ำ
                </li>
                <li>
                  <span className="text-primary font-medium">ให้นักเรียนบันทึกผลด้วยตนเอง</span> นักเรียนจะใช้เมนู
                  <span className="mx-1 font-medium text-primary">“บันทึกผล”</span> บนมือถือเพื่อกรอกค่าการทดสอบและสัดส่วนร่างกาย
                  ครูไม่จำเป็นต้องกรอกข้อมูลซ้ำ
                </li>
                <li>
                  <span className="text-primary font-medium">ตรวจสอบความพร้อมก่อนเริ่มสอบ</span> ยืนยันว่าชื่อทุกคนอยู่ในชั้นเรียน
                  และแจ้งให้นักเรียนเตรียมอุปกรณ์ตามแบบทดสอบของกรมพลศึกษา
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>การติดตามผลและให้ข้อเสนอแนะ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  ใช้ปุ่ม <span className="font-medium text-primary">“ดูรายละเอียด”</span> เพื่อเปิดมุมมองรายชั้น ตรวจสอบค่าเฉลี่ย
                  และลำดับผลงานล่าสุดได้ทันที
                </li>
                <li>
                  กรองรายชื่อนักเรียนตามช่วงอายุ ระดับสมรรถภาพ หรือค้นหาตามชื่อเพื่อดูผลรายบุคคลและวันที่บันทึกล่าสุด
                </li>
                <li>
                  โหลดข้อมูลที่นักเรียนนำเข้าหรือบัญชีผู้ใช้จากการนำเข้าล่าสุดได้ในส่วน
                  <span className="mx-1 font-medium text-primary">“แจ้งนักเรียนเพื่อเข้าใช้งานระบบ”</span> เพื่อส่งต่อหรือพิมพ์แจก
                </li>
                <li>
                  หากพบค่าที่ผิดปกติ ให้ประสานกับนักเรียนให้กลับไปแก้ไขที่หน้า “บันทึกผล” ระบบจะบันทึกค่าล่าสุดให้อัตโนมัติ
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>การจัดการเกณฑ์มาตรฐานและความปลอดภัยข้อมูล</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  ปรับปรุงค่ามาตรฐานได้จากเมนู <span className="font-medium text-primary">“จัดการเกณฑ์มาตรฐาน”</span> 
                  เพื่อให้ผลประเมินของนักเรียนสอดคล้องกับแนวทางของโครงการ
                </li>
                <li>
                  ตรวจสอบสิทธิ์การเข้าใช้ของบัญชีผู้สอนร่วม หากไม่ต้องการให้เข้าถึงข้อมูลให้ลบออกจากระบบบริหารสิทธิ์กลาง
                </li>
                <li>
                  ดาวน์โหลดไฟล์สรุปผลเป็น CSV เพื่อส่งต่อให้ผู้บริหารหรือเก็บเป็นหลักฐาน และเก็บรักษาข้อมูลส่วนบุคคลของนักเรียนตามนโยบาย
                </li>
                <li>
                  หากระบบทำงานผิดปกติให้รวบรวมรายละเอียดและแจ้งทีมพัฒนา พร้อมแนบรหัสชั้นเรียนที่ได้รับผลกระทบเพื่อช่วยตรวจสอบได้เร็วขึ้น
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>เครื่องมือ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted">
              <p>• สร้างไฟล์นำเข้ารายชื่อนักเรียนอัตโนมัติ</p>
              <p>• ติดตามการส่งผลทดสอบของนักเรียนรายบุคคล</p>
              <Button
                variant="secondary"
                onClick={() => setShowStandards(true)}
                className="inline-flex items-center"
              >
                <Ruler className="mr-2 h-4 w-4" />
                จัดการเกณฑ์มาตรฐาน
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCreateClass && (
        <CreateClassDialog
          open={showCreateClass}
          onClose={() => setShowCreateClass(false)}
          onCreate={handleCreateClass}
        />
      )}

      {showImportStudents && session?.token && (
        <ImportStudentsDialog
          classData={showImportStudents}
          onClose={closeImportDialog}
          onImportComplete={async (_summary: ImportStudentsSummary) => {
            void _summary;
            await loadDashboard();
          }}
        />
      )}

      <DrilldownDialog
        open={drilldownState.open}
        type={drilldownState.type}
        onOpenChange={(open) =>
          setDrilldownState((prev) => ({
            open,
            type: open ? prev.type : null,
          }))
        }
        analytics={analytics}
        snapshots={classSnapshots}
      />

      <FeaturePreviewDialog
        open={featurePreview !== null}
        context={featurePreview}
        onOpenChange={(open) => {
          if (!open) {
            setFeaturePreview(null);
          }
        }}
      />

      <ControlledHelpDialog
        isOpen={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        title="คู่มือการใช้งานแดชบอร์ดครูผู้สอน"
        content={InstructorHelpContent.dashboard}
      />
    </div>
  );
}

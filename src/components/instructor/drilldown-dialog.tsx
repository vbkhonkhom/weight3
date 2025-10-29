import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type {
  ClassSnapshot,
  InstructorAnalytics,
} from "@/lib/instructor-analytics";
import type { DrilldownType } from "./analytics-highlights";

interface DrilldownDialogProps {
  open: boolean;
  type: DrilldownType | null;
  onOpenChange: (open: boolean) => void;
  analytics: InstructorAnalytics | null;
  snapshots: ClassSnapshot[];
}

const drilldownTitles: Record<DrilldownType, string> = {
  students: "นักเรียนทั้งหมดจำแนกตามชั้นเรียน",
  "best-class": "ชั้นเรียนที่โดดเด่นและชั้นเรียนที่ควรโฟกัส",
  activity: "ความเคลื่อนไหวของการส่งผลทดสอบ",
  distribution: "สัดส่วนระดับสมรรถภาพ",
};

export function DrilldownDialog({
  open,
  type,
  onOpenChange,
  analytics,
  snapshots,
}: DrilldownDialogProps) {
  const title = type ? drilldownTitles[type] : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="h-[60vh] overflow-y-auto pr-1">
          {type === "students" ? (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.classId}
                  className="rounded-xl border border-border/60 bg-surface-strong/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary">
                      {snapshot.className}
                    </p>
                    <Badge variant="secondary">
                      {snapshot.studentCount.toLocaleString("th-TH")} คน
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    บันทึกล่าสุด: {snapshot.lastAssessmentOn ?? "-"} · กิจกรรมรอบล่าสุด{" "}
                    {snapshot.recentActivity.last30Days} ครั้ง
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {type === "best-class" && analytics ? (
            <div className="space-y-4">
              {analytics.bestClass ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">
                    ชั้นเรียนโดดเด่น: {analytics.bestClass.className}
                  </p>
                  <p className="text-xs text-emerald-700">
                    ค่าเฉลี่ยคะแนนรวม {analytics.bestClass.averageOverallScore?.toFixed(1) ?? "-"} ·
                    นักเรียนทั้งหมด {analytics.bestClass.studentCount}
                  </p>
                  {analytics.bestClass.bestStudent ? (
                    <p className="mt-2 text-xs text-emerald-700">
                      ผู้ทำคะแนนสูงสุด: {analytics.bestClass.bestStudent.fullName} (
                      {analytics.bestClass.bestStudent.overallScore?.toFixed(1) ?? "-"} คะแนน)
                    </p>
                  ) : null}
                </div>
              ) : null}

              {analytics.lowestClass ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    ชั้นเรียนควรโฟกัส: {analytics.lowestClass.className}
                  </p>
                  <p className="text-xs text-amber-700">
                    ค่าเฉลี่ยคะแนนรวม {analytics.lowestClass.averageOverallScore?.toFixed(1) ?? "-"} ·
                    นักเรียนทั้งหมด {analytics.lowestClass.studentCount}
                  </p>
                  {analytics.lowestClass.worstStudent ? (
                    <p className="mt-2 text-xs text-amber-700">
                      ผู้ที่ต้องการการสนับสนุน: {analytics.lowestClass.worstStudent.fullName}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {type === "activity" ? (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.classId}
                  className="rounded-xl border border-border-strong/80 bg-surface-elevated p-4 shadow-soft"
                >
                  <p className="text-sm font-semibold text-primary">{snapshot.className}</p>
                  <p className="text-xs text-muted">
                    ส่งผล 30 วันที่ผ่านมา {snapshot.recentActivity.last30Days} ครั้ง · รอบก่อนหน้า{" "}
                    {snapshot.recentActivity.previous30Days} ครั้ง
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {type === "distribution" && analytics ? (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.classId}
                  className="rounded-xl border border-border/60 bg-surface p-4"
                >
                  <p className="text-sm font-semibold text-primary">{snapshot.className}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                    <span>ยอดเยี่ยม: {snapshot.performanceSpread.excellent}</span>
                    <span>ดี: {snapshot.performanceSpread.good}</span>
                    <span>ปานกลาง: {snapshot.performanceSpread.average}</span>
                    <span>ต้องพัฒนา: {snapshot.performanceSpread.needs_improvement}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

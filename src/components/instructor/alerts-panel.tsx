import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InstructorAlert } from "@/lib/instructor-analytics";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface AlertsPanelProps {
  alerts: InstructorAlert[];
  onViewClass?: (classId: string) => void;
}

export function AlertsPanel({ alerts, onViewClass }: AlertsPanelProps) {
  return (
    <Card className="bg-surface-strong">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">
          การแจ้งเตือนเชิงรุก
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่พบสัญญาณที่ต้องเร่งติดตาม</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={`${alert.classId}-${alert.message}`}
              className="flex flex-col gap-3 rounded-xl border border-border-strong/80 bg-surface-elevated p-4 shadow-soft md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex rounded-full bg-warning/20 p-2 text-warning">
                  {alert.severity === "critical" ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-primary">
                    {alert.className}
                  </p>
                  <p className="text-xs text-subtle">{alert.message}</p>
                </div>
              </div>
              {onViewClass ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewClass(alert.classId)}
                  className="text-xs text-accent hover:text-accent-dark"
                >
                  ดูรายละเอียดชั้นเรียน
                </Button>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}


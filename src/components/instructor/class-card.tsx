"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Copy,
  Check,
  Eye,
  Download,
  Upload,
} from "lucide-react";
import type { ClassSummary, TestType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  classData: ClassSummary;
  onViewDetails: (classId: string) => void;
  onExportData: (classId: string) => void;
  onImportStudents?: (classId: string) => void;
}

const METRIC_LABELS: Record<TestType, string> = {
  bmi: "BMI",
  sit_and_reach: "นั่งงอตัว",
  hand_grip: "แรงบีบมือ",
  chair_stand: "ลุกนั่งเก้าอี้",
  step_up: "ขึ้นลงแท่น",
};

const METRIC_ORDER: TestType[] = [
  "bmi",
  "sit_and_reach",
  "hand_grip",
  "chair_stand",
  "step_up",
];

const METRIC_STYLES: Record<TestType, string> = {
  bmi: "bg-success/15 border-success/30",
  sit_and_reach: "bg-accent/15 border-accent/30",
  hand_grip: "bg-info/15 border-info/30",
  chair_stand: "bg-warning/15 border-warning/30",
  step_up: "bg-accent-light/15 border-accent-light/30",
};

const FALLBACK_STYLE =
  "bg-surface-strong/70 border-border/50 text-muted shadow-none";

function formatAverage(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { hasValue: false, display: "ยังไม่มีข้อมูล" };
  }

  return {
    hasValue: true,
    display: value.toFixed(2),
  };
}

export function ClassCard({
  classData,
  onViewDetails,
  onExportData,
  onImportStudents,
}: ClassCardProps) {
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyResetTimer.current) {
        window.clearTimeout(copyResetTimer.current);
      }
    },
    [],
  );

  const metrics = useMemo(
    () =>
      METRIC_ORDER.map((metric) => {
        const average = classData.latestAverages?.[metric];
        const { hasValue, display } = formatAverage(average);
        return {
          key: metric,
          label: METRIC_LABELS[metric],
          hasValue,
          display,
          value: average,
        };
      }),
    [classData.latestAverages],
  );

  const copyClassCode = async () => {
    try {
      const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;

      if (clipboard?.writeText) {
        await clipboard.writeText(classData.classCode);
      } else if (typeof document !== "undefined") {
        // Fallback for browsers without the async clipboard API.
        const textarea = document.createElement("textarea");
        textarea.value = classData.classCode;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } else {
        throw new Error("Clipboard API is not available in this environment");
      }

      if (copyResetTimer.current) {
        window.clearTimeout(copyResetTimer.current);
      }
      setCopied(true);
      copyResetTimer.current = window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (copyError) {
      console.error("Unable to copy class code", copyError);
      alert("ไม่สามารถคัดลอกรหัสชั้นเรียนได้ กรุณาลองอีกครั้ง");
    }
  };

  const highlightClass = useMemo(() => {
    const students = classData.studentCount;
    if (students >= 10) return "from-accent/15 via-accent/10 to-transparent";
    if (students > 0) return "from-success/15 via-success/10 to-transparent";
    return "from-border/40 via-border/20 to-transparent";
  }, [classData.studentCount]);

  return (
    <Card className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-3xl border border-border/30 bg-surface-elevated p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-medium">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-75 blur-xl",
          "bg-gradient-to-br",
          highlightClass,
        )}
      />
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-subtle">
            <Users className="h-3.5 w-3.5 text-muted" />
            <span>{classData.studentCount} คน</span>
          </div>
          <h3 className="text-xl font-semibold text-primary">
            {classData.className}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs tracking-widest">
              {classData.classCode}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyClassCode}
              className="h-7 w-7 rounded-full p-0 text-subtle hover:text-accent"
              title="คัดลอกรหัสชั้นเรียน"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          {copied && (
            <span className="text-xs text-success">
              คัดลอกรหัสชั้นเรียนเรียบร้อยแล้ว
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-subtle">
          <span className="h-1 w-8 rounded-full bg-accent" />
          ค่าเฉลี่ยการทดสอบล่าสุด
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className={cn(
                "rounded-2xl border px-3.5 py-3 text-center text-xs font-medium backdrop-blur-md",
                metric.hasValue
                  ? cn(
                      METRIC_STYLES[metric.key],
                      "text-primary shadow-soft hover:shadow-medium",
                    )
                  : FALLBACK_STYLE,
              )}
            >
              <div className="text-[11px] uppercase tracking-wide text-subtle/80">
                {metric.label}
              </div>
              <div
                className={cn(
                  "mt-2 text-base font-semibold",
                  metric.hasValue ? "text-primary" : "text-muted",
                )}
              >
                {metric.display}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-6 flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onViewDetails(classData.id)}
          className="flex-1 rounded-2xl py-2 text-sm"
        >
          <Eye className="mr-2 h-4 w-4" />
          ดูรายละเอียด
        </Button>
        {onImportStudents && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onImportStudents(classData.id)}
            className="h-11 w-11 rounded-full p-0"
            title="นำเข้ารายชื่อนักเรียน"
          >
            <Upload className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onExportData(classData.id)}
          className="h-11 w-11 rounded-full p-0"
          title="ส่งออกข้อมูล"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

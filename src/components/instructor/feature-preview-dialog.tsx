"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, CalendarClock } from "lucide-react";

export type FeaturePreviewKey = "export-class";

export interface FeaturePreviewContext {
  feature: FeaturePreviewKey;
  className?: string;
  classCode?: string;
}

interface FeaturePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: FeaturePreviewContext | null;
}

function buildContent(context: FeaturePreviewContext) {
  switch (context.feature) {
    case "export-class": {
      const classLabel = context.className ? ` “${context.className}”` : "ชั้นเรียนนี้";
      const codeLabel = context.classCode ? ` (รหัส ${context.classCode})` : "";
      return {
        title: "ฟีเจอร์ส่งออกข้อมูลกำลังจะมาเร็วๆ นี้",
        badge: "กำลังพัฒนา",
        description: `ระบบกำลังเตรียมช่องทางส่งออกข้อมูลสำหรับ${classLabel}${codeLabel} เพื่อให้คุณนำผลทดสอบไปใช้งานต่อได้อย่างสะดวก`,
        highlights: [
          "เลือกช่วงเวลาหรือตัวกรองที่ต้องการก่อนดาวน์โหลด",
          "ดาวน์โหลดไฟล์ CSV ที่จัดรูปแบบสำหรับส่งต่อหรือพิมพ์แจก",
          "แจ้งเตือนเมื่อมีข้อมูลนักเรียนที่ยังไม่บันทึกผลครบถ้วน",
        ],
        footerNote: "วางแผนเปิดใช้งานภายในไตรมาสถัดไป",
      };
    }
    default:
      return {
        title: "ฟีเจอร์ใหม่อยู่ระหว่างการพัฒนา",
        badge: "กำลังพัฒนา",
        description:
          "เรากำลังปรับปรุงระบบเพื่อให้ประสบการณ์การใช้งานดียิ่งขึ้น โปรดติดตามการอัปเดตในเร็วๆ นี้",
        highlights: [],
        footerNote: "",
      };
  }
}

export function FeaturePreviewDialog({ open, onOpenChange, context }: FeaturePreviewDialogProps) {
  if (!context) return null;

  const content = buildContent(context);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="space-y-5 rounded-3xl border border-border/40 bg-surface-elevated p-6 shadow-strong sm:max-w-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <Badge
              variant="outline"
              className="w-fit border-accent/30 bg-accent/15 px-3 py-1 text-xs font-medium text-accent"
            >
              {content.badge}
            </Badge>
            <DialogTitle className="text-xl font-semibold text-primary">
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-subtle">
              {content.description}
            </DialogDescription>
          </div>
        </div>

        {content.highlights.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-border/40 bg-surface-muted p-4">
            <p className="text-sm font-medium text-primary/80">
              สิ่งที่จะได้รับเมื่อเปิดใช้งาน
            </p>
            <ul className="space-y-2 text-sm text-muted">
              {content.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.footerNote && (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-accent/30 bg-accent/10 px-4 py-3 text-xs font-medium text-accent">
            <CalendarClock className="h-4 w-4" />
            {content.footerNote}
          </div>
        )}

        <DialogFooter className="sm:justify-end">
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            รับทราบ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

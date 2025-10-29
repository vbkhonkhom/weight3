"use client";

import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { TestResult } from "@/lib/types";
import { EvaluationBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber, formatTestName } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";

function formatRecordedDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  try {
    return format(date, "d MMM yyyy", { locale: th });
  } catch {
    return "-";
  }
}

export function ResultTable({ rows }: { rows: TestResult[] }) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; result: TestResult | null }>({ open: false, result: null });

  const handleDeleteResult = (result: TestResult) => {
    setDeleteDialog({ open: true, result });
  };

  const submitDeleteResult = async () => {
    if (!deleteDialog.result) return;
    // TODO: Implement deleteTestResult API
    alert("ฟังก์ชันลบผลการทดสอบกำลังพัฒนา");
    setDeleteDialog({ open: false, result: null });
  };

  if (!rows.length) {
    return (
      <p className="text-sm text-muted">
        ยังไม่มีผลการทดสอบ โปรดบันทึกผลครั้งแรกของคุณ
      </p>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-border">
        <table className="min-w-full divide-y divide-border bg-surface-strong text-left text-sm">
          <thead className="bg-surface-strong">
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-4">วันที่</th>
              <th className="px-5 py-4">รายการ</th>
              <th className="px-5 py-4">ค่าที่วัดได้</th>
              <th className="px-5 py-4">ค่าที่คำนวณ</th>
              <th className="px-5 py-4">ผลประเมิน</th>
              <th className="px-5 py-4">หมายเหตุ</th>
              <th className="px-5 py-4 text-center w-24">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {rows.map((row) => (
              <tr key={row.id} className="text-sm text-primary">
                <td className="px-5 py-4 align-top">
                  {formatRecordedDate(row.recordedAt)}
                </td>
                <td className="px-5 py-4 align-top font-medium">
                  {formatTestName(row.testType)}
                </td>
                <td className="px-5 py-4 align-top">
                  {formatNumber(row.value, 2)}
                </td>
                <td className="px-5 py-4 align-top">
                  {row.derivedValue ? formatNumber(row.derivedValue, 2) : "-"}
                </td>
                <td className="px-5 py-4 align-top">
                  <EvaluationBadge value={row.evaluation} />
                </td>
                <td className="px-5 py-4 align-top">
                  {row.notes ? row.notes : "-"}
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteResult(row)}
                      title="ลบผลการทดสอบ"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Result Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, result: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบผลการทดสอบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบผลการทดสอบ <strong>{deleteDialog.result ? formatTestName(deleteDialog.result.testType) : ""}</strong> วันที่{" "}
              <strong>{deleteDialog.result ? formatRecordedDate(deleteDialog.result.recordedAt) : ""}</strong> ใช่หรือไม่?
              <br />
              <span className="text-red-600">การกระทำนี้ไม่สามารถยกเลิกได้</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, result: null })}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={submitDeleteResult}>
              ลบผลการทดสอบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

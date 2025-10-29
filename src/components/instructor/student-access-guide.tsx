"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface StudentAccessGuideProps {
  classDisplayName: string;
  classCode: string;
  importedCount?: number;
  studentEmails?: string[];
  credentials?: Array<{
    studentId: string;
    email: string;
    password: string;
  }>;
  className?: string;
}

export function StudentAccessGuide({
  classDisplayName,
  classCode,
  importedCount,
  studentEmails = [],
  credentials = [],
  className,
}: StudentAccessGuideProps) {
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [copiedAccounts, setCopiedAccounts] = useState(false);

  const guideText = useMemo(() => {
    const baseSteps = [
      `1) ให้นักเรียนเปิดหน้า WTH Fitness App แล้วเลือกปุ่ม "เข้าสู่ระบบ"`,
      `2) ใช้อีเมลและรหัสผ่านชั่วคราวที่ครูแจกให้ (ดูจากรายชื่อด้านล่าง)`,
      `3) เมื่อเข้าสู่ระบบสำเร็จ ให้นักเรียนเข้าไปที่เมนู "โปรไฟล์" แล้วตั้งรหัสผ่านใหม่`,
      `4) หากไม่พบชื่อในรายการ หรือเข้าสู่ระบบไม่ได้ ให้ลงทะเบียนด้วยตนเองโดยใช้รหัสชั้นเรียน ${classCode}`,
    ];

    const summary = `ข้อมูลเข้าสู่ระบบสำหรับนักเรียนชั้น ${classDisplayName}`;
    return [summary, ...baseSteps].join("\n");
  }, [classDisplayName, classCode]);

  const emailList = useMemo(() => {
    if (!studentEmails.length) return "";
    return studentEmails.join(", ");
  }, [studentEmails]);

  const credentialCsv = useMemo(() => {
    if (!credentials.length) return "";
    const header = "studentId,email,password";
    const rows = credentials.map((credential) =>
      [credential.studentId, credential.email, credential.password].join(","),
    );
    return [header, ...rows].join("\n");
  }, [credentials]);

  const copyToClipboard = async (value: string) => {
    if (!value) return false;

    try {
      if (typeof window !== "undefined" && window.navigator?.clipboard?.writeText) {
        await window.navigator.clipboard.writeText(value);
        return true;
      }

      if (typeof document === "undefined") return false;

      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);

      const selection = document.getSelection();
      const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      textarea.select();
      const success = document.execCommand("copy");

      document.body.removeChild(textarea);

      if (selectedRange) {
        selection?.removeAllRanges();
        selection?.addRange(selectedRange);
      }

      return success;
    } catch (error) {
      console.error("Failed to copy text", error);
      return false;
    }
  };

  const handleCopy = async (
    value: string,
    setCopied: Dispatch<SetStateAction<boolean>>,
  ) => {
    const copied = await copyToClipboard(value);
    if (!copied) return;

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={cn("border-dashed border-border/70 bg-surface-strong/60", className)}>
      <CardHeader
        title="แจ้งนักเรียนเพื่อเข้าใช้งานระบบ"
        description={`แชร์ขั้นตอนการเริ่มใช้งานให้กับนักเรียนชั้น ${classDisplayName}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleCopy(guideText, setCopiedGuide)}>
              {copiedGuide ? (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Clipboard className="mr-2 h-4 w-4" />
                  คัดลอกข้อความ
                </>
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleCopy(classCode, setCopiedCode)}>
              {copiedCode ? (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Clipboard className="mr-2 h-4 w-4" />
                  คัดลอกรหัสชั้นเรียน
                </>
              )}
            </Button>
          </div>
        }
      />
      <CardContent className="space-y-4 text-sm text-muted">
        <Alert
          variant="info"
          title="สร้างบัญชีให้นักเรียนเรียบร้อย"
          message="ระบบได้ส่งอีเมลแจ้งบัญชีและรหัสผ่านชั่วคราวให้กับนักเรียนทุกคนแล้ว กรุณาย้ำให้นักเรียนเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก"
        />

        {typeof importedCount === "number" && (
          <div className="rounded-2xl bg-surface-muted px-4 py-3 text-subtle">
            นำเข้านักเรียนสำเร็จแล้ว {importedCount} คน
            {" • "}
            แชร์ขั้นตอนด้านล่างเพื่อให้ทุกคนเข้าใช้งานได้
          </div>
        )}

        <div className="rounded-2xl border border-border-strong/80 bg-surface-elevated px-4 py-4 text-sm text-subtle">
          <ol className="list-decimal space-y-2 pl-5">
            <li>ให้นักเรียนเปิดหน้า WTH Fitness App แล้วเลือกปุ่ม “เข้าสู่ระบบ”</li>
            <li>ใช้อีเมลและรหัสผ่านชั่วคราวที่ได้รับจากครู (ดูรายการบัญชีด้านล่างหรือไฟล์ CSV)</li>
            <li>เมื่อเข้าสู่ระบบสำเร็จ ให้นักเรียนเปลี่ยนรหัสผ่านใหม่ทันทีในเมนู “โปรไฟล์”</li>
            <li>
              หากไม่พบชื่อหรือไม่สามารถเข้าสู่ระบบได้ ให้ลงทะเบียนด้วยตนเองโดยใช้รหัสชั้นเรียน{" "}
              <code className="rounded bg-accent/10 px-2 py-1 text-accent">{classCode}</code>
            </li>
          </ol>
        </div>

        {credentials.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-medium text-primary">
                บัญชีเข้าสู่ระบบที่สร้างแล้ว ({credentials.length})
              </span>
              {credentialCsv && (
                <Button size="sm" variant="ghost" onClick={() => handleCopy(credentialCsv, setCopiedAccounts)}>
                  {copiedAccounts ? (
                    <>
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      คัดลอก CSV
                    </>
                  ) : (
                    <>
                      <Clipboard className="mr-2 h-4 w-4" />
                      คัดลอกรายชื่อ (CSV)
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-border/40">
              <table className="w-full text-xs text-muted">
                <thead className="bg-surface-strong/60 text-primary">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">รหัสนักศึกษา</th>
                    <th className="px-3 py-2 text-left font-medium">อีเมล</th>
                    <th className="px-3 py-2 text-left font-medium">รหัสผ่านชั่วคราว</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((credential) => (
                    <tr key={`${credential.studentId}-${credential.email}`} className="border-t border-border/30">
                      <td className="px-3 py-2 font-medium text-primary">{credential.studentId}</td>
                      <td className="px-3 py-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs text-primary">{credential.email}</code>
                      </td>
                      <td className="px-3 py-2">
                        <code className="rounded bg-accent/10 px-2 py-1 text-xs text-accent">
                          {credential.password}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              แนะนำให้นักเรียนเปลี่ยนรหัสผ่านทันทีหลังเข้าสู่ระบบ และเก็บข้อมูลนี้ไว้เป็นความลับ
            </p>
          </div>
        )}

        {studentEmails.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-medium text-primary">
                รายการอีเมลที่นำเข้า ({studentEmails.length})
              </span>
              <Button size="sm" variant="ghost" onClick={() => handleCopy(emailList, setCopiedEmails)}>
                {copiedEmails ? (
                  <>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Clipboard className="mr-2 h-4 w-4" />
                    คัดลอกอีเมลทั้งหมด
                  </>
                )}
              </Button>
            </div>
            <p className="whitespace-pre-wrap break-words text-xs text-muted">
              {studentEmails.join(", ")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

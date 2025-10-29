"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TestForm } from "@/components/forms/test-form";
import { useSession } from "@/providers/session-provider";

const INSTRUCTIONS = [
  "วอร์มอัพกล้ามเนื้อมือและแขนก่อนเริ่มทดสอบ",
  "ยืนตัวตรง แขนแนบลำตัว จับเครื่องวัดแรงบีบให้กระชับ",
  "บีบเต็มแรงต่อเนื่องประมาณ 3 วินาที และบันทึกค่าที่สูงที่สุด",
  "บันทึกน้ำหนักตัวในหน่วยกิโลกรัมเพื่อคำนวณค่าเปรียบเทียบ"
];

export default function StrengthTestPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();

  useEffect(() => {
    if (isRestoring) {
      return;
    }
    if (!session?.user) {
      router.replace("/");
      return;
    }
    if (session?.user?.role === "instructor") {
      router.replace("/dashboard");
    }
  }, [isRestoring, session?.user, session?.user?.role, router]);

  if (!session?.user || session.user.role === "instructor") {
    return null;
  }

  if (isRestoring) {
    return (
      <AppShell title="ทดสอบกำลังกล้ามเนื้อ" description="">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="ทดสอบกำลังกล้ามเนื้อ"
      description="ทดสอบ Hand Grip เพื่อวัดกำลังกล้ามเนื้อมือและแขน"
      actions={
        <Button variant="secondary" onClick={() => router.back()}>
          กลับ
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-primary">ขั้นตอนการเตรียมและวัดผล</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {INSTRUCTIONS.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 text-primary">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-primary">บันทึกผล Hand Grip</h2>
          <p className="mt-2 text-sm text-muted">
            กรอกค่าแรงบีบที่วัดได้และน้ำหนักตัว ระบบจะคำนวณอัตราส่วนแรงบีบต่อน้ำหนักเพื่อเปรียบเทียบมาตรฐานให้ทันที
          </p>
          <div className="mt-6">
            <TestForm
              testType="hand_grip"
              onRecorded={() => router.push("/dashboard")}
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

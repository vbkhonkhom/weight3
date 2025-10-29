"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TestForm } from "@/components/forms/test-form";
import { useSession } from "@/providers/session-provider";

const INSTRUCTIONS = [
  "เตรียมเก้าอี้มั่นคงสูงประมาณ 43–45 ซม. และพื้นที่ปลอดภัย",
  "นั่งตัวตรง เท้าแนบพื้น แขนกอดอกหรือวางที่อกเพื่อไม่ใช้มือช่วย",
  "ยืนขึ้นจนเหยียดตัวตรง จากนั้นนั่งลงให้สะโพกแตะที่นั่ง นับเป็น 1 ครั้ง",
  "ทำต่อเนื่องภายใน 60 วินาที และบันทึกจำนวนครั้งทั้งหมด"
];

export default function ChairStandTestPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();

  useEffect(() => {
    if (isRestoring) return;
    if (!session?.user) {
      router.replace("/");
      return;
    }
    if (session.user.role === "instructor") {
      router.replace("/dashboard");
    }
  }, [isRestoring, session?.user, router]);

  if (!session?.user || session.user.role === "instructor") {
    return null;
  }

  if (isRestoring) {
    return (
      <AppShell title="ทดสอบลุกนั่งเก้าอี้" description="">
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
      title="ทดสอบลุกนั่งเก้าอี้"
      description="ทดสอบ Chair Stand เพื่อวัดความแข็งแรงและทนทานของกล้ามเนื้อขา"
      actions={<Button variant="secondary" onClick={() => router.back()}>กลับ</Button>}
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
          <h2 className="text-lg font-semibold text-primary">บันทึกผล Chair Stand</h2>
          <p className="mt-2 text-sm text-muted">
            กรอกจำนวนครั้งที่ลุก-นั่งจากเก้าอี้ได้ภายใน 60 วินาที ระบบจะบันทึกและเปรียบเทียบกับเกณฑ์มาตรฐานให้ทันที
          </p>
          <div className="mt-6">
            <TestForm testType="chair_stand" onRecorded={() => router.push("/dashboard")} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

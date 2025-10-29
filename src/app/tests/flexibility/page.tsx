"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TestForm } from "@/components/forms/test-form";
import { useSession } from "@/providers/session-provider";

const INSTRUCTIONS = [
  "อบอุ่นร่างกายและยืดกล้ามเนื้อก่อนทดสอบอย่างน้อย 5 นาที",
  "นั่งเหยียดขาให้ตรง เท้าชิดกันและฝ่าเท้าติดกับกล่องวัด",
  "ค่อย ๆ โน้มตัวไปข้างหน้าจนสุดและค้างไว้ 2 วินาที ก่อนอ่านค่าที่ได้",
  "บันทึกค่าที่วัดได้เป็นหน่วยเซนติเมตร (รับค่าลบได้หากเอื้อมไม่ถึงพื้นฐาน)"
];

export default function FlexibilityTestPage() {
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
      <AppShell title="ทดสอบความยืดหยุ่น" description="">
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
      title="ทดสอบความยืดหยุ่น"
      description="ทดสอบ Sit and Reach เพื่อวัดความยืดหยุ่นของกล้ามเนื้อหลังและขาด้านหลัง"
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
            {INSTRUCTIONS.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-primary">บันทึกผล Sit and Reach</h2>
          <p className="mt-2 text-sm text-muted">
            กรอกระยะทางที่วัดได้เป็นเซนติเมตร ระบบจะบันทึกผลและเปรียบเทียบกับเกณฑ์มาตรฐานให้อัตโนมัติ
          </p>
          <div className="mt-6">
            <TestForm
              testType="sit_and_reach"
              onRecorded={() => router.push("/dashboard")}
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TestForm } from "@/components/forms/test-form";
import { useSession } from "@/providers/session-provider";

const INSTRUCTIONS = [
  "เตรียมแท่นสูง 30-35 เซนติเมตร และจับเวลา 3 นาที",
  "ก้าวขึ้นลงด้วยจังหวะคงที่ (ชาย 24 ครั้ง/นาที หญิง 22 ครั้ง/นาที)",
  "หลังกิจกรรมให้นั่งพักและจับชีพจรภายใน 5-20 วินาที เพื่อตรวจสอบความฟื้นตัว",
  "บันทึกจำนวนครั้งที่ทำได้ทั้งหมดภายใน 3 นาที"
];

export default function EnduranceTestPage() {
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
      <AppShell title="ทดสอบความอดทน" description="">
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
      title="ทดสอบความอดทน"
      description="ทดสอบ Step Up เพื่อวัดความอดทนของระบบหัวใจและหลอดเลือด"
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
          <h2 className="text-lg font-semibold text-primary">บันทึกผล Step Up</h2>
          <p className="mt-2 text-sm text-muted">
            กรอกจำนวนครั้งที่สามารถก้าวขึ้นลงได้ในเวลา 3 นาที ระบบจะบันทึกและเปรียบเทียบกับเกณฑ์มาตรฐานทันที
          </p>
          <div className="mt-6">
            <TestForm
              testType="step_up"
              onRecorded={() => router.push("/dashboard")}
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { TestForm } from "@/components/forms/test-form";
import { TEST_DESCRIPTIONS, TEST_LABELS } from "@/lib/constants";
import type { TestType } from "@/lib/types";
import { useSession } from "@/providers/session-provider";

const TEST_ORDER: TestType[] = [
  "bmi",
  "sit_and_reach",
  "hand_grip",
  "chair_stand",
  "step_up",
];

export default function TestsPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();
  const [activeTest, setActiveTest] = useState<TestType>("bmi");

  useEffect(() => {
    if (isRestoring) {
      return;
    }
    if (!session?.user) {
      router.replace("/");
      return;
    }
    if (session.user.role === "instructor") {
      router.replace("/dashboard");
    }
  }, [session?.user, isRestoring, router]);

  if (!session?.user || session.user.role === "instructor") {
    return null;
  }

  return (
    <AppShell
      title="บันทึกผลการทดสอบ"
      description="เลือกแบบทดสอบและกรอกค่าที่วัดได้เพื่อบันทึกลง Google Sheets"
    >
      <div className="flex flex-wrap gap-2">
        {TEST_ORDER.map((test) => (
          <Button
            key={test}
            variant={activeTest === test ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveTest(test)}
          >
            {TEST_LABELS[test]}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-border bg-surface-strong p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-primary">
            {TEST_LABELS[activeTest]}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {TEST_DESCRIPTIONS[activeTest]}
          </p>
          <div className="mt-6">
            <TestForm testType={activeTest} onRecorded={() => router.refresh()} />
          </div>
        </div>
        <aside className="rounded-3xl border border-border bg-surface-strong/80 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-primary flex items-center gap-2">
            📋 ขั้นตอนการเตรียมตัว
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="rounded-2xl bg-surface px-4 py-3 flex items-start gap-3">
              <span className="text-accent font-bold">1.</span>
              <span>ตรวจสอบว่าได้วอร์มอัพและเตรียมอุปกรณ์ครบถ้วนตามคู่มือทดสอบ</span>
            </li>
            <li className="rounded-2xl bg-surface px-4 py-3 flex items-start gap-3">
              <span className="text-accent font-bold">2.</span>
              <span>กรอกข้อมูลตามหน่วยที่กำหนด เช่น กิโลกรัม, เซนติเมตร หรือจำนวนครั้ง</span>
            </li>
            <li className="rounded-2xl bg-surface px-4 py-3 flex items-start gap-3">
              <span className="text-accent font-bold">3.</span>
              <span>ระบบจะคำนวณค่าที่ต้องใช้เปรียบเทียบเกณฑ์มาตรฐานให้อัตโนมัติ</span>
            </li>
          </ul>
          <div className="mt-6 rounded-2xl bg-accent/10 border border-accent/20 p-4 text-xs text-accent">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div>
                <p className="font-semibold mb-1">เคล็ดลับ:</p>
                <p>หากมีการกรอกผิดพลาดสามารถบันทึกซ้ำเพื่อทับผลล่าสุด หรือแจ้งครูผู้สอนให้ตรวจสอบข้อมูลในชีต Google Sheets</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

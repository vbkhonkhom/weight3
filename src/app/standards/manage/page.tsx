"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StandardsManagement } from "@/components/instructor/standards-management";
import { useSession } from "@/providers/session-provider";
import type { TestType } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

function ManageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTestType = useMemo(() => {
    const value = searchParams.get("testType");
    if (value && ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"].includes(value)) {
      return value as TestType;
    }
    return undefined;
  }, [searchParams]);

  const initialGender = useMemo(() => {
    const value = searchParams.get("gender");
    if (value === "male" || value === "female") {
      return value;
    }
    return undefined;
  }, [searchParams]);

  return (
    <StandardsManagement
      initialTestType={initialTestType}
      initialGender={initialGender}
      onBack={() => router.push("/standards")}
    />
  );
}

function ManageContentFallback() {
  return (
    <Card className="h-48 animate-pulse rounded-3xl border border-border/60 bg-surface" />
  );
}

export default function StandardsManagePage() {
  const { session, isRestoring } = useSession();

  if (isRestoring) {
    return (
      <AppShell title="จัดการเกณฑ์มาตรฐาน" description="">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (session?.user?.role !== "instructor") {
    return (
      <AppShell title="เกณฑ์มาตรฐาน" description="มีเฉพาะครูเท่านั้นที่สามารถแก้ไขเกณฑ์ได้">
        <Alert variant="warning" message="เฉพาะครูผู้สอนเท่านั้นที่มีสิทธิ์จัดการเกณฑ์มาตรฐาน" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="จัดการเกณฑ์มาตรฐาน"
      description="แก้ไข เพิ่ม หรือลบเกณฑ์ประเมินสำหรับการทดสอบสมรรถภาพกาย"
    >
      <Suspense fallback={<ManageContentFallback />}>
        <ManageContent />
      </Suspense>
    </AppShell>
  );
}

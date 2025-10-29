"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AthleteStandardsManagement } from "@/components/instructor/athlete-standards-management";

export default function AthleteStandardsPage() {
  return (
    <AppShell
      title="เกณฑ์มาตรฐานนักกีฬา"
      description="กำหนดเกณฑ์การประเมินเฉพาะสำหรับนักกีฬา (เข้มงวดกว่านักเรียนทั่วไป)"
    >
      <AthleteStandardsManagement showBackButton={false} />
    </AppShell>
  );
}

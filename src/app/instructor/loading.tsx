"use client";

import { LoadingState } from "@/components/ui/loading-spinner";

export default function InstructorSectionLoading() {
  return <LoadingState message="กำลังโหลดหน้าครูผู้สอน…" fullScreen />;
}

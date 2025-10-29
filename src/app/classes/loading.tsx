"use client";

import { LoadingState } from "@/components/ui/loading-spinner";

export default function ClassesLoading() {
  return <LoadingState message="กำลังโหลดรายวิชา…" fullScreen />;
}

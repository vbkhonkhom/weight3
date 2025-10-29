"use client";

import { LoadingState } from "@/components/ui/loading-spinner";

export default function DashboardLoading() {
  return <LoadingState message="กำลังโหลดแดชบอร์ด…" fullScreen />;
}

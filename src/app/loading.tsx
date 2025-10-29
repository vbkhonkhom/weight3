"use client";

import { LoadingState } from "@/components/ui/loading-spinner";

export default function RootRouteLoading() {
  return <LoadingState message="กำลังโหลดหน้า…" fullScreen />;
}

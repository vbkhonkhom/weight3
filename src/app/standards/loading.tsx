"use client";

import { LoadingState } from "@/components/ui/loading-spinner";

export default function StandardsLoading() {
  return <LoadingState message="กำลังโหลดเกณฑ์มาตรฐาน…" fullScreen />;
}

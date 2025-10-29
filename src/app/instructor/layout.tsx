"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={["instructor"]}>{children}</ProtectedRoute>;
}

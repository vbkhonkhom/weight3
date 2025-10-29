"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/providers/session-provider";
import { useToast } from "@/providers/toast-provider";

export type AllowedRole = "student" | "athlete" | "instructor";

/**
 * Client-side route guard. Use in layouts or pages to protect access.
 */
export function ProtectedRoute({
  children,
  roles,
  redirectTo = "/",
}: {
  children: React.ReactNode;
  roles?: AllowedRole[];
  redirectTo?: string;
}) {
  const { session, isRestoring } = useSession();
  const router = useRouter();
  const { warning } = useToast();

  useEffect(() => {
    if (isRestoring) return;
    const user = session?.user;
    if (!user) {
      router.replace(redirectTo);
      return;
    }
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      warning("ไม่มีสิทธิ์เข้าถึงหน้านี้");
      router.replace("/dashboard");
    }
  }, [isRestoring, session, roles, router, redirectTo, warning]);

  if (isRestoring) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;
  if (roles && roles.length > 0 && !roles.includes(session.user.role)) return null;

  return <>{children}</>;
}

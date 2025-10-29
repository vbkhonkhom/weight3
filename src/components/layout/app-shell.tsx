"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  LayoutDashboard, 
  GraduationCap, 
  Ruler, 
  BarChart3, 
  FileBarChart, 
  Dumbbell, 
  Settings, 
  LogOut, 
  Menu,
  Database,
  ClipboardList,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn, formatRole } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";

interface AppShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: Array<"student" | "athlete" | "instructor">;
};

// ลด Navigation ให้เหลือแค่เมนูหลักๆ ที่จำเป็น - เพื่อความเรียบง่าย
const BASE_NAV: Record<"student" | "athlete" | "instructor", NavItem[]> = {
  student: [
    { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
    { href: "/dashboard/tests", label: "บันทึกผล", icon: ClipboardList },
    { href: "/standards", label: "ดูเกณฑ์", icon: GraduationCap },
  ],
  athlete: [
    { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
    { href: "/dashboard/tests", label: "บันทึกผล", icon: ClipboardList },
    { href: "/standards", label: "เกณฑ์นักกีฬา", icon: Trophy },
  ],
  instructor: [
    { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
    { href: "/classes", label: "จัดการชั้นเรียน", icon: Users },
    { href: "/instructor/reports", label: "รายงาน", icon: FileBarChart },
    { href: "/standards", label: "เกณฑ์ทั่วไป", icon: Ruler },
    { href: "/instructor/athlete-standards", label: "เกณฑ์นักกีฬา", icon: Trophy },
  ],
};

export function AppShell({
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const { session, logout } = useSession();
  const pathname = usePathname();

  const role = session?.user?.role ?? null;
  const navItems =
    role && role in BASE_NAV ? BASE_NAV[role as keyof typeof BASE_NAV] : [];

  const renderNavLink = (item: NavItem, variant: "sidebar" | "mobile") => {
    // กำหนด active อย่างแม่นยำ: ไม่ให้ "/dashboard" ติด active เมื่ออยู่หน้า "/dashboard/..."
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    if (variant === "sidebar") {
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex w-full items-center gap-4 rounded-xl px-5 py-4 text-base font-medium transition-all duration-200 text-left",
            isActive
              ? "bg-gradient-to-r from-accent/15 to-accent-light/15 text-accent border border-accent/20 shadow-sm"
              : "text-muted hover:bg-accent/10 hover:text-primary hover:shadow-sm",
          )}
        >
          <Icon className="h-6 w-6" />
          <span>{item.label}</span>
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-2 rounded-xl px-3 py-4 text-xs font-medium transition-all duration-200 min-h-[72px]",
          isActive
            ? "bg-gradient-to-r from-accent/15 to-accent-light/15 text-accent border border-accent/20 shadow-sm"
            : "text-muted hover:bg-accent/10 hover:text-primary",
        )}
      >
        <Icon className="h-6 w-6" />
        <span className="text-center leading-tight">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-strong to-accent/5 pb-20 sm:pb-0">
      {/* Enhanced header with better mobile support */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface-strong/95 backdrop-blur-md shadow-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div className="flex w-full items-center justify-between sm:w-auto">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <span className="text-2xl">🏃‍♀️</span>
              <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                WTH Fitness
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {session?.user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="flex md:hidden"
                >
                  ออกจากระบบ
                </Button>
              )}
            </div>
          </div>
          {session?.user && (
            <div className="hidden items-center gap-3 sm:flex md:hidden">
              <div>
                <p className="text-sm font-medium text-primary">
                  {session.user.fullName}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted">
                    {formatRole(session.user.role)}
                  </p>
                  <span
                    className="inline-flex h-2 w-2 animate-pulse rounded-full bg-success"
                    title="เชื่อมต่อแล้ว"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile navigation tabs */}
        {session?.user && (
          <nav className="mx-auto max-w-6xl px-4 pb-4 md:hidden">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 min-h-[40px]",
                    (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href))
                      ? "bg-gradient-to-r from-accent/15 to-accent-light/15 text-accent border border-accent/20 shadow-sm"
                      : "text-muted hover:bg-accent/10 hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      
      {/* Main content with sidebar layout */}
      <div className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 md:flex-row">
        {session?.user && navItems.length > 0 && (
          <aside className="sticky top-28 hidden h-[calc(100vh-7rem)] w-64 flex-shrink-0 flex-col gap-6 rounded-2xl border border-border bg-surface-strong/80 p-4 shadow-soft backdrop-blur md:flex">
            <div className="space-y-2">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">
                เมนู
              </p>
              <div className="flex flex-col gap-1">
                {navItems.map((item) => renderNavLink(item, "sidebar"))}
              </div>
            </div>
            <div className="mt-auto rounded-xl border border-border bg-surface p-4 shadow-soft">
              <p className="text-sm font-medium text-primary">
                {session.user.fullName}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                <span
                  className="inline-flex h-2 w-2 rounded-full bg-success"
                  title="เชื่อมต่อแล้ว"
                />
                {formatRole(session.user.role)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="mt-4 w-full justify-center"
              >
                ออกจากระบบ
              </Button>
            </div>
          </aside>
        )}
        <main className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
              {description && (
                <p className="text-sm text-muted leading-relaxed sm:text-base">{description}</p>
              )}
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
          <div className="animate-fadeIn">{children}</div>
        </main>
      </div>
      
      {/* Enhanced mobile bottom navigation */}
      {session?.user && navItems.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-strong/95 px-2 py-2 shadow-strong backdrop-blur-md md:hidden">
          <div className="flex items-center gap-1">
            {navItems.map((item) => renderNavLink(item, "mobile"))}
          </div>
        </nav>
      )}
    </div>
  );
}

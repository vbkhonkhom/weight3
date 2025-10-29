"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm, RegisterForm } from "@/components/forms/auth-forms";
import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  "รองรับการทดสอบสมรรถภาพทางกาย 5 รายการตามกรมพลศึกษา",
  "ประมวลผลเปรียบเทียบเกณฑ์มาตรฐานแบบอัตโนมัติ",
  "เชื่อมต่อ Google Sheets ผ่าน Google Apps Script อย่างปลอดภัย",
];

export default function Home() {
  const router = useRouter();
  const { session, isRestoring } = useSession();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Clear redirect flag when user reaches homepage
  useEffect(() => {
    try {
      sessionStorage.removeItem("wth.auth.redirecting");
    } catch {
      // no-op
    }
  }, []);

  // หากล็อกอินอยู่แล้ว ให้พาไปหน้าแดชบอร์ดทันที (ลบหน้า "ยินดีต้อนรับกลับ")
  useEffect(() => {
    if (!isRestoring && session?.user && session?.token) {
      router.replace("/dashboard");
    }
  }, [isRestoring, session, router]);
  
  // Optional: Add a "Go to Dashboard" button for existing logged-in users
  const canAccessDashboard = session?.user && session?.token;

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-strong to-accent/5">
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1.1fr_1fr] lg:min-h-screen">
        {/* Left section - Hero content */}
        <section className="flex flex-col justify-between px-4 py-8 text-primary sm:px-8 lg:px-16 lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-accent/15 to-accent-light/15 px-4 py-2 text-xs font-semibold text-accent border border-accent/20">
              🏃‍♀️ Weight Training For Health
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                ระบบประเมินสมรรถภาพทางกาย
                <br />
                <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                  สำหรับครูผู้สอนและนักเรียน
                </span>
              </h1>
              <p className="max-w-xl text-base text-muted leading-relaxed">
                บันทึกผลการทดสอบ เปรียบเทียบกับเกณฑ์มาตรฐานของกรมพลศึกษา
                และดูความก้าวหน้าของนักเรียนแต่ละคนผ่านแดชบอร์ดเดียว
              </p>
            </div>
            <ul className="space-y-3 text-sm text-primary">
              {HIGHLIGHTS.map((item, index) => (
                <li key={item} className="flex items-start gap-3 animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-light text-white text-xs font-semibold shadow-sm">
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Data structure info */}
          <div className="mt-8 rounded-2xl border border-border bg-gradient-to-r from-surface-strong to-surface-strong/80 p-6 shadow-soft backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="text-xl">🗂️</span>
              โครงสร้างข้อมูลที่ใช้
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              โปรแกรมเชื่อมต่อกับ Google Sheets ผ่าน Apps Script 
              อ้างอิงชีต <code className="bg-accent/10 px-2 py-1 rounded-lg text-accent text-xs font-mono">Users</code>, 
              <code className="bg-accent/10 px-2 py-1 rounded-lg text-accent text-xs font-mono">Classes</code>, 
              <code className="bg-accent/10 px-2 py-1 rounded-lg text-accent text-xs font-mono">TestResults</code>
              และ <code className="bg-accent/10 px-2 py-1 rounded-lg text-accent text-xs font-mono">Standards</code>
              เพื่อประเมินผลตามช่วงอายุและเพศของนักเรียน
            </p>
          </div>
        </section>

        {/* Right section - Auth forms */}
        <section className="flex items-center justify-center bg-gradient-to-br from-surface-strong to-surface px-4 py-8 sm:px-8 lg:px-10 lg:py-12">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-border-strong/80 bg-surface-elevated p-6 shadow-strong backdrop-blur-sm sm:p-8">
              {!(canAccessDashboard && !isRestoring) ? (
                /* Not logged in - show login/register forms */
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-surface rounded-xl p-1">
                    <button
                      type="button"
                      className={cn(
                        "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                        activeTab === "login"
                          ? "bg-gradient-to-r from-accent to-accent-light text-white shadow-sm"
                          : "text-muted hover:bg-accent/10 hover:text-primary",
                      )}
                      onClick={() => setActiveTab("login")}
                    >
                      เข้าสู่ระบบ
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                        activeTab === "register"
                          ? "bg-gradient-to-r from-accent to-accent-light text-white shadow-sm"
                          : "text-muted hover:bg-accent/10 hover:text-primary",
                      )}
                      onClick={() => setActiveTab("register")}
                    >
                      ลงทะเบียน
                    </button>
                  </div>
                  <div className="animate-fadeIn">
                    {activeTab === "login" ? <LoginForm /> : <RegisterForm />}
                  </div>
                </div>
              ) : null}
              
              {/* Help section */}
              <div className="mt-8 rounded-xl bg-gradient-to-r from-surface to-surface-strong px-4 py-3 text-xs text-muted border border-border/50">
                <p className="leading-relaxed">
                  ใช้งานครั้งแรก? ตรวจสอบคู่มือการตั้งค่า Google Apps Script และ
                  Sheet ภายในเอกสารของโปรเจ็กต์
                </p>
              </div>
              
              {/* Footer note */}
              <div className="mt-6 text-center text-xs text-muted sm:text-right">
                รองรับการดีพลอยบน Vercel
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

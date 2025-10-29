"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";
import {
  clearPendingRegistration,
  loadPendingRegistration,
  savePendingRegistration,
  type PendingRegistrationData,
} from "@/lib/pending-registration";
import { useSession } from "@/providers/session-provider";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, session } = useSession();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [pending, setPending] = useState<PendingRegistrationData | null>(null);

  const emailFromQuery = searchParams.get("email")?.toLowerCase() ?? "";

  useEffect(() => {
    if (session?.user && session?.token) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  useEffect(() => {
    const data = loadPendingRegistration();
    if (!data) {
      setError("ไม่พบข้อมูลการลงทะเบียน กรุณากรอกแบบฟอร์มใหม่");
      return;
    }

    if (emailFromQuery && data.email.toLowerCase() !== emailFromQuery) {
      setInfo("กำลังใช้ข้อมูลการลงทะเบียนล่าสุดที่บันทึกไว้");
    }

    setPending(data);
  }, [emailFromQuery]);

  const email = useMemo(() => pending?.email ?? emailFromQuery, [pending, emailFromQuery]);

  const handleResend = async () => {
    if (!pending?.email) {
      setError("ไม่พบอีเมลสำหรับส่งรหัส OTP ใหม่");
      return;
    }

    setIsResending(true);
    setError(undefined);
    setInfo(undefined);
    try {
      await api.sendOTP(pending.email);
      setInfo("ส่งรหัส OTP ใหม่เรียบร้อยแล้ว");
      // เก็บข้อมูลล่าสุดไว้เผื่อผู้ใช้กลับมาในภายหลัง
      savePendingRegistration(pending);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถส่งรหัส OTP ได้";
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (!pending || !email) {
      setError("ไม่พบข้อมูลการลงทะเบียน กรุณากรอกแบบฟอร์มใหม่");
      return;
    }

    if (otp.length !== 6) {
      setError("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }

    setIsVerifying(true);
    setError(undefined);
    setInfo(undefined);

    try {
      await api.verifyOTP(email, otp);
      const sessionPayload = await api.register({
        ...pending,
        otpVerified: true,
      });
      clearPendingRegistration();
      setSession(sessionPayload);
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถยืนยันรหัส OTP ได้";
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-strong px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border-strong/80 bg-surface-elevated p-8 shadow-2xl backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-primary">ยืนยันรหัส OTP</h1>
          <p className="text-sm text-muted">
            เราได้ส่งรหัส OTP ไปที่อีเมล {email ?? "-"} กรุณากรอกภายใน 10 นาทีเพื่อเปิดใช้งานบัญชีของคุณ
          </p>
        </div>

        {error && <Alert message={error} variant="error" />}
        {info && <Alert message={info} variant="info" />}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">รหัส OTP</label>
            <Input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="กรอกรหัส 6 หลัก"
            />
          </div>
          <Button
            type="button"
            onClick={handleVerify}
            loading={isVerifying}
            disabled={!pending || otp.length !== 6}
            className="w-full"
          >
            ยืนยันและเข้าใช้งาน
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            loading={isResending}
            disabled={!pending}
            className="w-full text-sm"
          >
            ส่งรหัส OTP อีกครั้ง
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              clearPendingRegistration();
              router.push("/");
            }}
          >
            กลับไปหน้าลงทะเบียน
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-strong px-4 py-12">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-border-strong/80 bg-surface-elevated p-8 text-center text-sm text-subtle shadow-2xl backdrop-blur">
            กำลังเตรียมแบบฟอร์มยืนยันรหัส OTP...
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}

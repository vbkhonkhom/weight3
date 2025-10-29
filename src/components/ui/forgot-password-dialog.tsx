"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, Key, CheckCircle } from "lucide-react";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/lib/api";

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordDialog({ isOpen, onClose }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<'email' | 'otp' | 'complete'>('email');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleReset = () => {
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setStep('email');
  };

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [onClose]);

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      error("กรุณาใส่อีเมล");
      return;
    }

    if (!email.includes("@")) {
      error("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    try {
      setLoading(true);
      const result = await api.requestPasswordReset({ email: email.trim() });
      success(result.message);
      setStep('otp');
    } catch (err: any) {
      error(err.message || "ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [email, success, error]);

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      error("กรุณาใส่รหัส OTP");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      error("รหัส OTP ต้องเป็นตัวเลข 6 หลัก");
      return;
    }

    if (!newPassword) {
      error("กรุณาใส่รหัสผ่านใหม่");
      return;
    }

    if (newPassword.length < 6) {
      error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);
      const result = await api.resetPassword({ 
        otp: otp.trim(),
        email: email.trim(),
        newPassword
      });
      success(result.message);
      setStep('complete');
    } catch (err: any) {
      error(err.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
    } finally {
      setLoading(false);
    }
  }, [otp, email, newPassword, confirmPassword, success, error]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'email' && <Mail className="h-5 w-5" />}
            {step === 'otp' && <Key className="h-5 w-5" />}
            {step === 'complete' && <CheckCircle className="h-5 w-5 text-green-500" />}
            ลืมรหัสผ่าน
          </DialogTitle>
          <DialogDescription>
            {step === 'email' && "ใส่อีเมลของคุณเพื่อรับรหัส OTP"}
            {step === 'otp' && "ใส่รหัส OTP ที่ส่งไปยังอีเมลของคุณ พร้อมตั้งรหัสผ่านใหม่"}
            {step === 'complete' && "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว"}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>เคล็ดลับ:</strong> หากอีเมลของคุณอยู่ในระบบ เราจะส่งรหัส OTP 6 หลักไปให้<br />
                   ตรวจสอบโฟลเดอร์ Spam/Junk หากไม่เห็นอีเมล<br />
                   รหัส OTP จะหมดอายุใน 15 นาที
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  "ส่งรหัส OTP"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <Key className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-yellow-700">
                รหัส OTP ถูกส่งไปยัง <strong>{email}</strong><br />
                กรุณาตรวจสอบอีเมลและนำรหัส 6 หลักมากรอก
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">รหัส OTP (6 หลัก)</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                maxLength={6}
                className="text-center text-lg font-mono tracking-wider"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="ใส่รหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('email')} 
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับ
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังรีเซ็ต...
                  </>
                ) : (
                  "รีเซ็ตรหัสผ่าน"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'complete' && (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 p-6 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                เรียบร้อย!
              </h3>
              <p className="text-green-700 mb-4">
                รหัสผ่านของคุณถูกรีเซ็ตเรียบร้อยแล้ว<br />
                กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              เข้าสู่ระบบ
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

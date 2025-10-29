"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface TokenExpiredDialogProps {
  isOpen: boolean;
  onRedirect: () => void;
}

export function TokenExpiredDialog({ isOpen, onRedirect }: TokenExpiredDialogProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onRedirect]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-lg">หมดเวลาการเข้าสู่ระบบ</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            โทเค็นการเข้าสู่ระบบของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่เพื่อดำเนินการต่อ
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                จะเปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบอัตโนมัติใน{" "}
                <span className="font-bold text-xl text-blue-600">{countdown}</span>{" "}
                วินาที
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end gap-3 mt-4">
          <Button onClick={onRedirect} className="min-w-[100px]">
            เข้าสู่ระบบตอนนี้
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
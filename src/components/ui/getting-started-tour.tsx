"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Step {
  title: string;
  description: string;
  image?: string;
  action?: {
    label: string;
    path: string;
  };
}

const INSTRUCTOR_STEPS: Step[] = [
  {
    title: "ยินดีต้อนรับ ครูผู้สอน!",
    description: "ระบบนี้จะช่วยคุณจัดการการทดสอบสมรรถภาพทางกายของนักเรียนได้อย่างง่ายดาย",
  },
  {
    title: "📚 สร้างห้องเรียน",
    description: "เริ่มต้นด้วยการสร้างห้องเรียนและนำเข้ารายชื่อนักเรียน ระบบจะสร้างรหัสห้องเรียนให้อัตโนมัติ",
    action: {
      label: "ไปสร้างห้องเรียน",
      path: "/classes",
    },
  },
  {
    title: "📊 ตั้งค่าเกณฑ์มาตรฐาน",
    description: "กำหนดเกณฑ์การประเมินสำหรับการทดสอบแต่ละประเภทตามช่วงอายุและเพศ",
    action: {
      label: "จัดการเกณฑ์",
      path: "/standards/manage",
    },
  },
  {
    title: "👨‍🎓 นักเรียนเข้าสู่ระบบ",
    description: "นักเรียนใช้อีเมลและรหัสห้องเรียนที่คุณแจกจ่ายเพื่อเข้าสู่ระบบและบันทึกผลการทดสอบ",
  },
  {
    title: "📈 ติดตามผลและวิเคราะห์",
    description: "ดูภาพรวมผลการทดสอบ เปรียบเทียบระหว่างนักเรียน และวิเคราะห์แนวโน้มการพัฒนา",
    action: {
      label: "ไปแดชบอร์ด",
      path: "/dashboard",
    },
  },
];

const STUDENT_STEPS: Step[] = [
  {
    title: "ยินดีต้อนรับ นักเรียน!",
    description: "ระบบนี้จะช่วยคุณบันทึกและติดตามผลการทดสอบสมรรถภาพทางกายของคุณเอง",
  },
  {
    title: "🏃 บันทึกผลการทดสอบ",
    description: "เลือกประเภทการทดสอบที่ต้องการบันทึก เช่น BMI, ความยืดหยุ่น, กำลังกล้ามเนื้อ ฯลฯ",
    action: {
      label: "เริ่มบันทึกผล",
      path: "/dashboard/tests",
    },
  },
  {
    title: "📏 บันทึกสัดส่วนร่างกาย",
    description: "บันทึกขนาดสัดส่วนร่างกาย 19 รายการ ทั้งก่อนและหลังเรียนเพื่อเปรียบเทียบการเปลี่ยนแปลง",
    action: {
      label: "บันทึกสัดส่วน",
      path: "/tests/body-measurements",
    },
  },
  {
    title: "📊 ดูผลและความก้าวหน้า",
    description: "ตรวจสอบผลการทดสอบของคุณ ดูประเมินตามเกณฑ์มาตรฐาน และติดตามความก้าวหน้า",
    action: {
      label: "ดูแดชบอร์ด",
      path: "/dashboard",
    },
  },
];

interface GettingStartedTourProps {
  userRole: "instructor" | "student" | "athlete";
  onClose: () => void;
}

export function GettingStartedTour({ userRole, onClose }: GettingStartedTourProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = userRole === "instructor" ? INSTRUCTOR_STEPS : STUDENT_STEPS;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl relative animate-in fade-in-0 zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[300px] flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary">{currentStepData.title}</h2>
              <p className="text-lg text-muted leading-relaxed">{currentStepData.description}</p>

              {currentStepData.action && (
                <Button
                  onClick={() => handleNavigate(currentStepData.action!.path)}
                  className="mt-6"
                >
                  {currentStepData.action.label}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="text-muted"
              >
                ย้อนกลับ
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">
                  {currentStep + 1} / {steps.length}
                </span>
              </div>

              <Button onClick={handleNext}>
                {isLastStep ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    เริ่มใช้งาน
                  </>
                ) : (
                  <>
                    ถัดไป
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Hook to check if user should see the tour
export function useGettingStartedTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenGettingStartedTour");
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  const closeTour = () => {
    setShowTour(false);
    localStorage.setItem("hasSeenGettingStartedTour", "true");
  };

  const resetTour = () => {
    localStorage.removeItem("hasSeenGettingStartedTour");
    setShowTour(true);
  };

  return { showTour, closeTour, resetTour };
}

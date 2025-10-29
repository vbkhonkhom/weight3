"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const current = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fadeIn" />

      {/* Tour Card */}
      <Card className="fixed z-50 w-full max-w-sm p-6 shadow-2xl animate-slideUp bottom-4 left-1/2 -translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="ข้าม"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="space-y-4 pr-6">
          {/* Step indicator */}
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl">
            {currentStep + 1}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">{current.title}</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!isLastStep && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1 text-base py-5"
              >
                ข้ามทั้งหมด
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 text-base py-5"
            >
              {isLastStep ? "เสร็จสิ้น" : "ถัดไป"}
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-sm text-gray-500 text-center">
            ขั้นตอนที่ {currentStep + 1} จาก {steps.length}
          </p>
        </div>
      </Card>
    </>
  );
}

// Hook สำหรับจัดการ onboarding state
export function useOnboarding(key: string) {
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`onboarding_${key}`) === "true";
    }
    return false;
  });

  const markAsComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`onboarding_${key}`, "true");
    }
    setHasSeenTour(true);
  };

  const reset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`onboarding_${key}`);
    }
    setHasSeenTour(false);
  };

  return { hasSeenTour, markAsComplete, reset };
}

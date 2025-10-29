"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  text,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-4 border-gray-200 border-t-blue-600",
          sizeClasses[size]
        )}
        role="status"
        aria-label="กำลังโหลด"
      />
      {text && (
        <p className={cn("text-gray-600 font-medium", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  message = "กำลังโหลดข้อมูล...",
  fullScreen = false,
}: LoadingStateProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <LoadingSpinner size="xl" text={message} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <LoadingSpinner size="lg" text={message} />
    </div>
  );
}

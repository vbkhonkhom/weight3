"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
}

const variantStyles = {
  default: {
    container: "bg-surface-elevated border-border",
    icon: null,
    iconColor: "",
  },
  success: {
    container: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    icon: CheckCircle,
    iconColor: "text-green-600 dark:text-green-400",
  },
  error: {
    container: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    icon: AlertCircle,
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    container: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    container: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

export function Toast({ id, message, variant = "default", onClose }: ToastProps) {
  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg transition-all",
        "animate-in slide-in-from-top-full fade-in duration-300",
        style.container
      )}
      role="alert"
    >
      {Icon && <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", style.iconColor)} />}
      <div className="flex-1 text-sm">{message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">ปิด</span>
      </button>
    </div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-4 sm:right-4 sm:max-w-md sm:flex-col">
      {children}
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
const palette: Record<string, string> = {
  // English labels
  Excellent: "bg-emerald-500/15 text-emerald-600",
  Good: "bg-sky-500/15 text-sky-600",
  Fair: "bg-amber-500/15 text-amber-600",
  "Below Average": "bg-orange-500/15 text-orange-600",
  Poor: "bg-rose-500/15 text-rose-600",
  "Very Good": "bg-emerald-500/15 text-emerald-600",
  "Needs Improvement": "bg-rose-500/15 text-rose-600",
  
  // Thai labels for fitness tests
  "ดีมาก": "bg-emerald-500/15 text-emerald-600",
  "ดี": "bg-sky-500/15 text-sky-600", 
  "ปานกลาง": "bg-amber-500/15 text-amber-600",
  "ต่ำ": "bg-orange-500/15 text-orange-600",
  "ต่ำมาก": "bg-rose-500/15 text-rose-600",
  
  // Thai labels for BMI
  "สมส่วน": "bg-emerald-500/15 text-emerald-600",
  "ผอม": "bg-amber-500/15 text-amber-600",
  "ท้วม": "bg-orange-500/15 text-orange-600",
  "อ้วน": "bg-rose-500/15 text-rose-600",
  "ผอมมาก": "bg-rose-500/15 text-rose-600",
  
  // Default for unknown categories
  "ไม่มีเกณฑ์อ้างอิง": "bg-gray-500/15 text-subtle",
};

export function EvaluationBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        palette[value] ?? "bg-surface text-muted border border-border/60",
        className,
      )}
    >
      {value}
    </span>
  );
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: {
  variant?: "default" | "outline" | "secondary" | "destructive";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const variants = {
    default: "bg-accent text-white shadow-sm",
    outline: "border border-border bg-surface-muted text-subtle",
    secondary: "bg-surface-muted text-subtle border border-border/80",
    destructive: "bg-error text-white shadow-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

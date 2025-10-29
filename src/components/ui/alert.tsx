"use client";

import { cn } from "@/lib/utils";

type AlertVariant = "error" | "info" | "warning" | "success";

const variantStyles: Record<AlertVariant, string> = {
  error: "bg-gradient-to-r from-error/10 to-red-500/10 text-error border border-error/20",
  info: "bg-gradient-to-r from-info/10 to-cyan-500/10 text-info border border-info/20",
  warning: "bg-gradient-to-r from-warning/10 to-amber-500/10 text-warning border border-warning/20",
  success: "bg-gradient-to-r from-success/10 to-emerald-500/10 text-success border border-success/20",
};

export function Alert({
  variant = "error",
  title,
  message,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  message: string;
  className?: string;
}) {
  const styles = variantStyles[variant];
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-sm leading-relaxed shadow-soft animate-fadeIn",
        styles,
        className,
      )}
    >
      {title && <div className="font-semibold mb-1">{title}</div>}
      <p>{message}</p>
    </div>
  );
}

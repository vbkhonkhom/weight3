"use client";

import { cn, formatNumber } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  suffix,
  trend,
  className,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  trend?: { value: number; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-surface-strong p-6 shadow-sm",
        className,
      )}
    >
      <p className="text-sm font-medium text-muted">{label}</p>
      <div className="mt-3 text-3xl font-semibold text-primary">
        {typeof value === "number" ? formatNumber(value) : value}
        {suffix && <span className="ml-1 text-base text-muted">{suffix}</span>}
      </div>
      {trend && (
        <p className="mt-3 text-xs font-medium text-muted">
          {trend.label}{" "}
          <span
            className={trend.value >= 0 ? "text-emerald-600" : "text-rose-500"}
          >
            {trend.value >= 0 ? "+" : ""}
            {formatNumber(trend.value, 1)}%
          </span>
        </p>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      disabled,
      loading,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-65 active:scale-[0.98]",
          // Base styles
          "rounded-xl border shadow-sm hover:shadow-md",
          // Variants
          variant === "primary" &&
            "bg-gradient-to-r from-accent to-accent-light text-white border-accent hover:from-accent-dark hover:to-accent hover:shadow-lg",
          variant === "secondary" &&
            "bg-surface-strong text-primary border-border hover:bg-accent/5 hover:border-accent/20",
          variant === "ghost" &&
            "bg-transparent text-primary border-transparent hover:bg-accent/10 hover:text-accent",
          variant === "destructive" &&
            "bg-gradient-to-r from-error to-red-500 text-white border-error hover:from-red-600 hover:to-red-500 hover:shadow-lg",
          variant === "success" &&
            "bg-gradient-to-r from-success to-emerald-400 text-white border-success hover:from-emerald-600 hover:to-emerald-500 hover:shadow-lg",
          variant === "outline" &&
            "bg-transparent text-accent border-accent hover:bg-accent hover:text-white",
          // Sizes
          size === "sm" && "px-3 py-2 text-xs min-h-[36px]",
          size === "md" && "px-5 py-2.5 text-sm min-h-[44px]",
          size === "lg" && "px-6 py-3 text-base min-h-[52px]",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

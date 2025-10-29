"use client";

import { isValidElement, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateAction =
  | ReactNode
  | {
      label: string;
      onClick: () => void;
      icon?: ReactNode;
      variant?: ButtonProps["variant"];
      loading?: boolean;
    };

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  let actionContent: ReactNode = null;

  if (action) {
    if (isValidElement(action) || typeof action !== "object") {
      actionContent = action;
    } else if ("label" in action && typeof action.onClick === "function") {
      const {
        label,
        onClick,
        icon,
        variant = "primary",
        loading,
      } = action;
      actionContent = (
        <Button
          onClick={onClick}
          variant={variant}
          size="sm"
          loading={loading}
        >
          {icon ? <span className="mr-2 inline-flex">{icon}</span> : null}
          {label}
        </Button>
      );
    } else {
      actionContent = action as ReactNode;
    }
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed border-border bg-surface-strong/70 p-8 text-center",
        className,
      )}
    >
      <h4 className="text-base font-semibold text-primary">{title}</h4>
      {description && (
        <p className="mt-2 text-sm text-muted">{description}</p>
      )}
      {actionContent && (
        <div className="mt-4 flex justify-center">{actionContent}</div>
      )}
    </div>
  );
}

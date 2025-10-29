"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-strong shadow-soft hover:shadow-medium transition-all duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({
  className,
  children,
  title,
  description,
  action,
  ...props
}: CardHeaderProps) {
  const hasStructuredContent = title || description || action;

  return (
    <div
      className={cn("p-4 sm:p-6 pb-0", className)}
      {...props}
    >
      {hasStructuredContent ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title &&
              (typeof title === "string" ? (
                <CardTitle>{title}</CardTitle>
              ) : (
                title
              ))}
            {description &&
              (typeof description === "string" ? (
                <CardDescription>{description}</CardDescription>
              ) : (
                description
              ))}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      ) : (
        children
      )}
      {hasStructuredContent && children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-tight tracking-tight text-primary", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-4 sm:p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-4 sm:p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

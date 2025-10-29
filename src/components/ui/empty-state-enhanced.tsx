"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyStateEnhanced({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl animate-bounce-slow">
          {icon}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {actionLabel && onAction && (
              <Button
                size="lg"
                onClick={onAction}
                className="text-base py-6 px-8"
              >
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button
                size="lg"
                variant="outline"
                onClick={onSecondaryAction}
                className="text-base py-6 px-8"
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

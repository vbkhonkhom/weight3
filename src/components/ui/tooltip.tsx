"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 -translate-x-2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 translate-x-2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800",
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className={cn("inline-flex cursor-help", className)}
      >
        {children || <HelpCircle className="h-4 w-4 text-muted hover:text-primary transition-colors" />}
      </div>
      
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg",
            "max-w-xs whitespace-normal break-words",
            "animate-in fade-in-0 zoom-in-95",
            positionClasses[position]
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              "absolute w-0 h-0 border-4",
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

interface HelpIconProps {
  tooltip: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function HelpIcon({ tooltip, position = "top", className }: HelpIconProps) {
  return (
    <Tooltip content={tooltip} position={position} className={className}>
      <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors" />
    </Tooltip>
  );
}

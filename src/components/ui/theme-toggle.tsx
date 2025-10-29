"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "สลับไปโหมดสว่าง" : "สลับไปโหมดมืด"}
      className="gap-2 px-3 text-xs font-medium text-muted hover:text-accent"
    >
      {isDark ? (
        <Sun aria-hidden className="h-4 w-4" />
      ) : (
        <Moon aria-hidden className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {isDark ? "โหมดสว่าง" : "โหมดมืด"}
      </span>
    </Button>
  );
}


import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InstructorAnalytics } from "@/lib/instructor-analytics";
import { cn } from "@/lib/utils";

export type DrilldownType = "students" | "best-class" | "activity" | "distribution";

interface AnalyticsHighlightsProps {
  analytics: InstructorAnalytics | null;
  loading?: boolean;
  onOpenDrilldown: (type: DrilldownType) => void;
}

export function AnalyticsHighlights({
  analytics,
  loading,
  onOpenDrilldown,
}: AnalyticsHighlightsProps) {
  const cards = useMemo(() => {
    if (!analytics) return [];
    const percentChange = analytics.activitySummary.percentChange;
    const percentText =
      percentChange === null
        ? "ยังไม่มีข้อมูลเพียงพอ"
        : `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(0)}% เทียบรอบก่อน`;

    return [
      {
        key: "students" as DrilldownType,
        title: "นักเรียนทั้งหมด",
        value: analytics.totalStudents.toLocaleString("th-TH"),
        description: "รวมทุกชั้นเรียนที่คุณดูแล",
        variant: "default" as const,
      },
      {
        key: "best-class" as DrilldownType,
        title: analytics.bestClass?.className ?? "ยังไม่มีข้อมูล",
        value:
          analytics.bestClass?.averageOverallScore !== null &&
          analytics.bestClass?.averageOverallScore !== undefined
            ? `${analytics.bestClass?.averageOverallScore.toFixed(1)} คะแนน`
            : "-",
        description: "ค่าเฉลี่ยคะแนนรวมสูงสุด",
        variant: "positive" as const,
      },
      {
        key: "activity" as DrilldownType,
        title: "กิจกรรมรอบล่าสุด",
        value: analytics.activitySummary.activeThisCycle.toLocaleString("th-TH"),
        description: percentText,
        variant:
          percentChange === null
            ? ("default" as const)
            : percentChange >= 0
              ? ("positive" as const)
              : ("warning" as const),
      },
    ];
  }, [analytics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Card key={index}>
            <CardContent className="space-y-4 p-6">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card
          key={card.key}
          className={cn(
            "border border-border/60 shadow-sm transition-all duration-300",
            card.variant === "positive" && "bg-emerald-50/50",
            card.variant === "warning" && "bg-amber-50/50",
          )}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold text-muted">{card.description}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-6 pt-2">
            <span className="text-xl font-semibold text-primary">{card.value}</span>
            <span className="text-sm text-muted">{card.title}</span>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenDrilldown(card.key)}
                className="px-0 text-xs text-accent hover:text-accent-dark"
              >
                ดูรายละเอียด
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


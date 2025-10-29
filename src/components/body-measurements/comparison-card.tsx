"use client";

import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import {
  computeMeasurementDifference,
  type BodyMeasurementComparisonRow,
} from "@/lib/body-measurements";

export function ComparisonCard({
  row,
}: {
  row: BodyMeasurementComparisonRow;
}) {
  if (row.type === "single") {
    return (
      <Card className="p-4">
        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-primary">{row.label}</h3>
            <p className="text-xs text-muted">{row.category}</p>
          </div>
          {row.unit && <span className="text-xs text-muted">หน่วย {row.unit}</span>}
        </header>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <ValueBlock title="ก่อนเรียน" value={row.before} unit={row.unit} />
          <ValueBlock title="หลังเรียน" value={row.after} unit={row.unit} />
          <DeltaBlock difference={row.difference} unit={row.unit} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">{row.label}</h3>
          <p className="text-xs text-muted">{row.category}</p>
        </div>
        {row.unit && <span className="text-xs text-muted">หน่วย {row.unit}</span>}
      </header>
      <div className="mt-4 space-y-3 text-sm">
        {row.sides.map((side) => (
          <div key={side.id} className="rounded-xl border border-border/60 p-3">
            <p className="text-xs font-medium text-muted uppercase">
              {side.label}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <ValueBlock title="ก่อน" value={side.before} unit={row.unit} />
              <ValueBlock title="หลัง" value={side.after} unit={row.unit} />
              <DeltaBlock difference={side.difference} unit={row.unit} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ValueBlock({
  title,
  value,
  unit,
}: {
  title: string;
  value: number | null | undefined;
  unit?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{title}</p>
      <p className="text-lg font-semibold text-gray-900">
        {value == null ? "-" : `${formatNumber(value, 2)}${unit ? ` ${unit}` : ""}`}
      </p>
    </div>
  );
}

function DeltaBlock({
  difference,
  unit,
}: {
  difference: ReturnType<typeof computeMeasurementDifference>;
  unit?: string;
}) {
  if (!difference) {
    return (
      <div>
        <p className="text-xs text-muted">การเปลี่ยนแปลง</p>
        <p className="text-lg font-semibold text-muted">-</p>
      </div>
    );
  }
  const absolute = difference.absolute;
  const percent = difference.percent;
  const tone =
    Math.abs(absolute) < 0.01
      ? "text-slate-600"
      : absolute > 0
      ? "text-emerald-600"
      : "text-rose-600";

  return (
    <div>
      <p className="text-xs text-muted">การเปลี่ยนแปลง</p>
      <p className={`text-lg font-semibold ${tone}`}>
        {`${absolute > 0 ? "+" : ""}${formatNumber(absolute, 2)}${
          unit ? ` ${unit}` : ""
        }`}
      </p>
      {percent != null && (
        <p className="text-xs text-muted">{`${percent > 0 ? "+" : ""}${formatNumber(
          percent,
          2,
        )}%`}</p>
      )}
    </div>
  );
}

"use client";

import type { InstructorDashboardPayload, TestType } from "@/lib/types";
import { EvaluationBadge } from "@/components/ui/badge";
import { formatRole, formatTestName } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const TEST_ORDER: TestType[] = [
  "bmi",
  "sit_and_reach",
  "hand_grip",
  "chair_stand",
  "step_up",
];

export function ClassRoster({
  roster,
}: {
  roster: NonNullable<InstructorDashboardPayload["roster"]>;
}) {
  if (!roster.length) {
    return (
      <p className="text-sm text-muted">
        ยังไม่มีนักเรียนในชั้นเรียนนี้ แจ้งรหัสชั้นเรียนให้นักเรียนใช้ลงทะเบียน
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-surface-strong">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-surface-strong text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-5 py-4">ชื่อ - สกุล</th>
            <th className="px-5 py-4">บทบาท</th>
            <th className="px-5 py-4">อัปเดตล่าสุด</th>
            {TEST_ORDER.map((test) => (
              <th key={test} className="px-5 py-4">
                {formatTestName(test)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/80">
          {roster.map((member) => (
            <tr key={member.id}>
              <td className="px-5 py-4 align-top font-medium text-primary">
                {member.fullName}
              </td>
              <td className="px-5 py-4 align-top text-muted">
                {formatRole(member.role)}
              </td>
              <td className="px-5 py-4 align-top text-muted">
                {member.updatedAt
                  ? format(new Date(member.updatedAt), "d MMM yyyy", {
                      locale: th,
                    })
                  : "-"}
              </td>
              {TEST_ORDER.map((test) => {
                const result = member.latestResults?.[test];
                return (
                  <td key={`${member.id}-${test}`} className="px-5 py-4 align-top">
                    {result ? (
                      <div className="flex flex-col gap-1">
                        <EvaluationBadge value={result.evaluation} />
                        <span className="text-xs text-muted">
                          {format(new Date(result.recordedAt), "d MMM", {
                            locale: th,
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

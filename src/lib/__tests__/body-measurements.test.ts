import {
  BODY_MEASUREMENT_CATEGORIES,
  buildBodyMeasurementComparison,
  getInitialMeasurementValues,
  summarizeBodyMeasurementComparison,
} from "@/lib/body-measurements";
import type { BodyMeasurementResponse } from "@/lib/types";

const SAMPLE_RESPONSE: BodyMeasurementResponse = {
  before: {
    muscularStrength: 15,
    muscularEndurance: 20,
    weight: 70,
    shoulderLeft: 30,
    shoulderRight: 31,
    notes: "ก่อนเริ่มโปรแกรม",
  },
  after: {
    muscularStrength: 18,
    muscularEndurance: 18,
    weight: 68,
    shoulderLeft: 31,
    shoulderRight: 32,
    notes: "หลังจบโปรแกรม",
  },
};

describe("body measurements helpers", () => {
  it("buildBodyMeasurementComparison creates rows with localized categories", () => {
    const rows = buildBodyMeasurementComparison(SAMPLE_RESPONSE);
    const weightRow = rows.find((row) => row.id === "weight");
    const shoulderRow = rows.find((row) => row.id === "หัวไหล่");

    expect(weightRow).toBeDefined();
    expect(weightRow?.type).toBe("single");
    expect(weightRow?.categoryKey).toBe("vital");
    expect(weightRow?.category).toBe(BODY_MEASUREMENT_CATEGORIES.vital);
    expect(weightRow?.difference?.absolute).toBeCloseTo(-2);

    expect(shoulderRow).toBeDefined();
    expect(shoulderRow?.type).toBe("pair");
    expect(shoulderRow?.categoryKey).toBe("circumference");
    if (!shoulderRow || shoulderRow.type !== "pair") {
      throw new Error("Expected shoulder row to be of type pair");
    }
    expect(shoulderRow.sides).toHaveLength(2);
    expect(shoulderRow.sides.every((side) => side.difference?.absolute === 1)).toBe(true);
  });

  it("summarizeBodyMeasurementComparison counts increases and decreases", () => {
    const rows = buildBodyMeasurementComparison(SAMPLE_RESPONSE);
    const summary = summarizeBodyMeasurementComparison(rows);

    expect(summary.total).toBe(5);
    expect(summary.increase).toBe(3);
    expect(summary.decrease).toBe(2);
    expect(summary.unchanged).toBe(0);
  });

  it("getInitialMeasurementValues returns a flat value map with notes", () => {
    const initial = getInitialMeasurementValues(SAMPLE_RESPONSE.before);

    expect(initial.muscularStrength).toBe(15);
    expect(initial.shoulderLeft).toBe(30);
    expect(initial.notes).toBe("ก่อนเริ่มโปรแกรม");
  });
});

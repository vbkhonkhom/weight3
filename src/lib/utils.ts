import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Role, TestType } from "./types";
import { ROLE_LABELS, TEST_LABELS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRole(role: Role) {
  return ROLE_LABELS[role] ?? role;
}

export function formatTestName(test: TestType) {
  return TEST_LABELS[test] ?? test;
}

export function formatNumber(value: number, fractionDigits = 2) {
  return Number.isFinite(value)
    ? value.toLocaleString("th-TH", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
    : "-";
}

// สร้างและดาวน์โหลดไฟล์ CSV แบบ generic จากรายการข้อมูลและหัวคอลัมน์ที่กำหนด
export function downloadCsv(
  rows: Array<Record<string, unknown>>,
  columns: Array<{ key: string; label: string }>,
  filename = `export-${Date.now()}.csv`,
) {
  if (!rows || rows.length === 0 || columns.length === 0) return;

  const header = columns.map((c) => c.label).join(",");
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "number") return String(val);
    const s = String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
  // เพิ่ม BOM เพื่อให้ Excel บน Windows แสดงภาษาไทยถูกต้อง
  const csvContent = "\uFEFF" + [header, ...lines].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ดาวน์โหลด CSV จากเมทริกซ์ของสตริง (รองรับเลย์เอาต์หลายแถว/กลุ่มหัวข้อ)
export function downloadRawCsv(
  rows: string[][],
  filename = `export-${Date.now()}.csv`,
) {
  if (!rows || rows.length === 0) return;
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "number") return String(val);
    const s = String(val);
    // ถ้ามีคอมมา, เครื่องหมายคำพูด หรือช่องว่างต้น/ท้าย ให้ใส่เครื่องหมายคำพูดครอบ
    if (/[",\n]|^\s|\s$/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  // เพิ่ม BOM เพื่อให้ Excel บน Windows แสดงภาษาไทยถูกต้อง
  const csvContent = "\uFEFF" + rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

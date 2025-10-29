"use client";

import React, { useState, useRef } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import {
  Upload,
  Download,
  X,
  FileText,
  Users,
  AlertCircle,
  CheckCircle,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { useSession } from "@/providers/session-provider";
import { api } from "@/lib/api";
import { StudentAccessGuide } from "./student-access-guide";
import type { ImportedStudentCredential } from "@/lib/types";
import { useGlobalLoading } from "@/providers/loading-provider";

type StudentGender = "male" | "female";

interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  gender?: StudentGender;
  birthdate?: string;
  row?: number;
  errors?: string[];
}

export interface ImportStudentsSummary {
  count: number;
  emails: string[];
  credentials: ImportedStudentCredential[];
}

interface ImportStudentsDialogProps {
  classData: {
    id: string;
    className: string;
    classCode: string;
  };
  onClose: () => void;
  onImportComplete?: (summary: ImportStudentsSummary) => void | Promise<void>;
}

const DEFAULT_MANUAL_STUDENT: Partial<Student> = {
  studentId: "",
  firstName: "",
  lastName: "",
  email: "",
  gender: "female",
  birthdate: "",
};

/* --------------------------------------------
 * ส่วนใหม่: Card แบบเลือกโหมด (CSV / เพิ่มทีละคน)
 * - ทำให้ "สิ่งที่ต้องเลือก" แตกต่างจาก "ปุ่มกดทำงาน"
 * - ใช้ border/ไอคอน/ติ๊กถูก เพื่อความชัดเจน
 * -------------------------------------------- */
function ModeCard({
  active,
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition",
        active
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border hover:bg-surface",
      ].join(" ")}
      aria-pressed={active}
    >
      <div
        className={[
          "mt-1 grid h-9 w-9 place-items-center rounded-lg",
          active ? "bg-primary/10" : "bg-muted",
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {active && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              <Check className="h-3 w-3" /> เลือกอยู่
            </span>
          )}
        </div>
        <p className="text-sm text-subtle">{desc}</p>
      </div>
    </button>
  );
}

export function ImportStudentsDialog({
  classData,
  onClose,
  onImportComplete,
}: ImportStudentsDialogProps) {
  const { session } = useSession();
  const { showLoading, hideLoading } = useGlobalLoading();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [validStudents, setValidStudents] = useState<Student[]>([]);
  const [invalidStudents, setInvalidStudents] = useState<Student[]>([]);
  const [showInvalid, setShowInvalid] = useState(false);

  // โหมดนำเข้า: CSV (ค่าเริ่มต้น) / manual
  const [importMode, setImportMode] = useState<"csv" | "manual">("csv");

  const [manualStudent, setManualStudent] =
    useState<Partial<Student>>(DEFAULT_MANUAL_STUDENT);
  const [importSummary, setImportSummary] =
    useState<ImportStudentsSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [latestSheetUrl, setLatestSheetUrl] = useState<string | null>(null);
  const [latestSheetName, setLatestSheetName] = useState<string | null>(null);

  const normalizeGender = (value?: string): StudentGender | undefined => {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    if (["ชาย", "male", "m"].includes(normalized)) return "male";
    if (["หญิง", "female", "f"].includes(normalized)) return "female";
    return undefined;
  };

  const validateStudent = (student: Student): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (!student.studentId || student.studentId.trim().length < 3) {
      errors.push("กรุณากรอกรหัสนักศึกษา (อย่างน้อย 3 ตัวอักษร)");
    }
    if (!student.firstName || student.firstName.trim().length < 1) {
      errors.push("กรุณากรอกชื่อ");
    }
    if (!student.lastName || student.lastName.trim().length < 1) {
      errors.push("กรุณากรอกนามสกุล");
    }
    if (student.email && !student.email.includes("@")) {
      errors.push("อีเมลไม่ถูกต้อง");
    }
    if (student.birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(student.birthdate)) {
      errors.push("วันเกิดต้องอยู่ในรูปแบบ YYYY-MM-DD");
    }

    const gender = normalizeGender(student.gender);
    if (student.gender && !gender) {
      errors.push("เพศต้องเป็น male/female หรือ ชาย/หญิง");
    }
    if (gender) student.gender = gender;

    return { isValid: errors.length === 0, errors };
  };

  const headerHandlers = {
    studentId: (student: Student, value: string) => {
      student.studentId = value;
    },
    firstName: (student: Student, value: string) => {
      student.firstName = value;
    },
    lastName: (student: Student, value: string) => {
      student.lastName = value;
    },
    email: (student: Student, value: string) => {
      student.email = value || undefined;
    },
    gender: (student: Student, value: string) => {
      student.gender = normalizeGender(value);
    },
    birthdate: (student: Student, value: string) => {
      student.birthdate = value || undefined;
    },
  } satisfies Record<string, (student: Student, value: string) => void>;

  const headerAliases: Record<string, keyof typeof headerHandlers> = {
    studentid: "studentId",
    "รหัสนักศึกษา": "studentId",
    firstname: "firstName",
    ชื่อ: "firstName",
    lastname: "lastName",
    นามสกุล: "lastName",
    email: "email",
    อีเมล: "email",
    gender: "gender",
    เพศ: "gender",
    birthdate: "birthdate",
    วันเกิด: "birthdate",
  };

  const parseCSV = (csvText: string): Student[] => {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return [];

    const headers = lines[0]
      .split(",")
      .map((col) => col.trim().replace(/^"|"$/g, ""));
    const hasHeader = headers.some(
      (header) => headerAliases[header.toLowerCase()]
    );

    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line, index) => {
      const columns = line
        .split(",")
        .map((col) => col.trim().replace(/^"|"$/g, ""));

      const student: Student = {
        studentId: "",
        firstName: "",
        lastName: "",
        email: "",
        gender: undefined,
        birthdate: "",
        row: index + (hasHeader ? 2 : 1),
      };

      if (hasHeader) {
        headers.forEach((header, headerIndex) => {
          const alias = headerAliases[header.toLowerCase()];
          if (!alias) return;
          const value = columns[headerIndex] || "";
          headerHandlers[alias](student, value);
        });
      } else {
        student.studentId = columns[0] || "";
        student.firstName = columns[1] || "";
        student.lastName = columns[2] || "";
        student.email = columns[3] || "";
        student.gender = normalizeGender(columns[4]);
        student.birthdate = columns[5] || undefined;
      }

      const validation = validateStudent(student);
      if (!validation.isValid) {
        student.errors = validation.errors;
      } else {
        student.studentId = student.studentId.trim();
        student.firstName = student.firstName.trim();
        student.lastName = student.lastName.trim();
        if (student.email) {
          student.email = student.email.trim();
          if (student.email === "") student.email = undefined;
        }
        if (student.birthdate) {
          student.birthdate = student.birthdate.trim();
          if (student.birthdate === "") student.birthdate = undefined;
        }
      }

      return student;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setImportSummary(null);
    setInfoMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parsedStudents = parseCSV(csvText);

      const valid = parsedStudents.filter(
        (s) => !s.errors || s.errors.length === 0
      );
      const invalid = parsedStudents.filter(
        (s) => s.errors && s.errors.length > 0
      );

      setValidStudents(valid);
      setInvalidStudents(invalid);
      setImportMode("csv");
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleAddManualStudent = () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setImportSummary(null);

    if (
      !manualStudent.studentId ||
      !manualStudent.firstName ||
      !manualStudent.lastName
    ) {
      setErrorMessage("กรุณากรอกรหัสนักศึกษา ชื่อ และนามสกุลให้ครบถ้วน");
      return;
    }

    const student: Student = {
      studentId: manualStudent.studentId.trim(),
      firstName: manualStudent.firstName.trim(),
      lastName: manualStudent.lastName.trim(),
      email: manualStudent.email?.trim() || undefined,
      gender: (manualStudent.gender as StudentGender) || "female",
      birthdate: manualStudent.birthdate || undefined,
    };

    const validation = validateStudent(student);
    if (!validation.isValid) {
      setErrorMessage("ข้อมูลไม่ถูกต้อง: " + validation.errors.join(", "));
      return;
    }

    setValidStudents((prev) => [...prev, student]);
    setManualStudent(DEFAULT_MANUAL_STUDENT);
    setImportMode("manual");
    setInfoMessage(
      `เพิ่มนักเรียน ${student.firstName} ${student.lastName} ในรายการนำเข้าแล้ว`
    );
  };

  const resolveStudentEmail = (student: Student) => {
    const trimmedEmail = student.email?.trim();
    if (trimmedEmail) return trimmedEmail;
    const trimmedId = student.studentId.trim();
    return `${trimmedId}@${
      process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN || "student.wth.ac.th"
    }`;
  };

  const generateTempPassword = () => {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 6; i += 1) {
      password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return password;
  };

  const handleImport = async () => {
    if (validStudents.length === 0) {
      setErrorMessage("ไม่มีนักเรียนที่ถูกต้องให้นำเข้า");
      return;
    }

    setImporting(true);
    showLoading("กำลังนำเข้ารายชื่อและบันทึกข้อมูล...");
    setErrorMessage(null);
    setInfoMessage(null);

    const emails = validStudents.map((student) => resolveStudentEmail(student));

    try {
      let importedCount = validStudents.length;
      let credentials: ImportStudentsSummary["credentials"] = [];

      if (!session?.token) {
        throw new Error("ไม่พบโทเค็นสำหรับเรียกใช้งาน API");
      }

      const result = await api.importStudents(session.token, {
        classId: classData.id,
        students: validStudents,
      });

      if (!result.success) {
        throw new Error("ไม่สามารถนำเข้านักเรียนได้");
      }

      if (typeof result.imported === "number") {
        importedCount = result.imported;
      }

      if (Array.isArray(result.credentials)) {
        credentials = result.credentials;
      }

      const summary: ImportStudentsSummary = {
        count: importedCount,
        emails,
        credentials,
      };
      setImportSummary(summary);
      setInfoMessage(
        `นำเข้านักเรียน ${importedCount} คนเรียบร้อยแล้ว${
          credentials.length ? " และส่งอีเมลแจ้งข้อมูลเข้าสู่ระบบให้ทุกคนแล้ว" : ""
        }`
      );
      setValidStudents([]);
      setInvalidStudents([]);
      setShowInvalid(false);
      setManualStudent(DEFAULT_MANUAL_STUDENT);
      setImportMode("csv");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onImportComplete) await onImportComplete(summary);
    } catch (error) {
      console.error("Error importing students:", error);
      const message =
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการนำเข้านักเรียน";
      setErrorMessage(message);
    } finally {
      hideLoading();
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      "studentId,firstName,lastName,email,gender,birthdate",
      // ใช้ตัวอย่างเพศเป็นภาษาไทยเพื่อสื่อว่ากรอก ชาย/หญิง ได้ (ระบบจะแม็ปเป็นอังกฤษอัตโนมัติ)
      "65012345,สมชาย,ใจดี,somchai@example.com,ชาย,2004-01-15",
      "65012346,สมหญิง,สวยงาม,somying@example.com,หญิง,2005-03-22",
      "65012347,วิทยา,เก่งมาก,,ชาย,2004-07-08",
    ].join("\n");

    // ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยถูกต้อง
    const blob = new Blob(["\ufeff" + template], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_import_students.csv";
    link.click();
  };

  const removeStudent = (index: number) => {
    setValidStudents((prev) => prev.filter((_, i) => i !== index));
    setImportSummary(null);
    setInfoMessage(null);
  };

  const handleCreateRosterSheet = async () => {
    try {
      setCreatingSheet(true);
      showLoading("กำลังสร้างไฟล์รวบรวมนักเรียน...");
      setLatestSheetUrl(null);
      setLatestSheetName(null);
      setInfoMessage(null);
      setErrorMessage(null);

      if (!session?.token) {
        setErrorMessage("กรุณาเข้าระบบก่อนสร้างไฟล์ Google Sheet");
        return;
      }

      const response = await api.createStudentRosterSheet(session.token, {
        classId: classData.id,
        className: classData.className,
        classCode: classData.classCode,
      });

      setLatestSheetUrl(response.spreadsheetUrl);
      setLatestSheetName(response.name);
      setInfoMessage(
        "สร้างไฟล์ Google Sheet สำเร็จ! สามารถเปิดลิงก์เพื่อแชร์ให้นักเรียนกรอกข้อมูลได้"
      );
    } catch (error) {
      console.error("Error creating roster sheet:", error);
      setErrorMessage("ไม่สามารถสร้างไฟล์ Google Sheet ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      hideLoading();
      setCreatingSheet(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-surface-elevated">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                นำเข้ารายชื่อนักเรียน
              </CardTitle>
              <p className="mt-1 text-sm text-subtle">
                ชั้นเรียน: {classData.className} ({classData.classCode})
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* แบนเนอร์คำเตือน: ใช้โทนสีแตกต่างจากปุ่ม เพื่อไม่ให้เข้าใจว่าเป็นปุ่มกด */}
          <Alert
            variant="warning"
            title="ระบบไม่ได้สร้างรหัสผ่านให้อัตโนมัติ"
            message="หลังนำเข้ารายชื่อแล้ว ให้นักเรียนลงทะเบียนด้วยตนเองโดยใช้รหัสชั้นเรียนและยืนยันอีเมลผ่านรหัส OTP"
          />

          {errorMessage && <Alert variant="error" message={errorMessage} />}

          {infoMessage && !importSummary && (
            <Alert variant="info" message={infoMessage} />
          )}

          {importSummary && (
            <div className="space-y-4">
              <Alert
                variant="info"
                title="นำเข้าข้อมูลสำเร็จ"
                message={`เพิ่มนักเรียน ${importSummary.count} คนเรียบร้อยแล้ว คุณสามารถแชร์ขั้นตอนให้นักเรียนเข้าใช้งานได้ทันที`}
              />
              <StudentAccessGuide
                classDisplayName={classData.className}
                classCode={classData.classCode}
                importedCount={importSummary.count}
                studentEmails={importSummary.emails}
                credentials={importSummary.credentials}
              />
            </div>
          )}

          {/* ---------- โหมดที่ต้อง "เลือก" (ไม่ใช่ปุ่มทำงาน) ---------- */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">โหมดการนำเข้า (เลือก 1)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeCard
                active={importMode === "csv"}
                icon={FileText}
                title="นำเข้าจากไฟล์ CSV"
                desc="เหมาะสำหรับเพิ่มหลายคนในครั้งเดียว รองรับดาวน์โหลดเทมเพลต / สร้าง Google Sheet แล้วแปลงเป็น CSV"
                onClick={() => {
                  setImportMode("csv");
                  setImportSummary(null);
                  setInfoMessage(null);
                }}
              />
              <ModeCard
                active={importMode === "manual"}
                icon={Users}
                title="เพิ่มทีละคน"
                desc="กรอกแบบฟอร์มสั้น ๆ เพื่อเพิ่มนักเรียนแบบรายบุคคล เหมาะกับการแก้ไขเฉพาะราย"
                onClick={() => {
                  setImportMode("manual");
                  setImportSummary(null);
                  setInfoMessage(null);
                }}
              />
            </div>
          </div>

          {/* ---------- เนื้อหาแต่ละโหมด ---------- */}
          {importMode === "csv" && (
            <div className="space-y-5">
              {/* Steps/คู่มือ + ปุ่มรอง */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 text-base font-medium">ขั้นตอนสำหรับโหมด CSV</h4>
                <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>ดาวน์โหลดไฟล์ตัวอย่าง หรือสร้างแบบฟอร์ม Google Sheet</li>
                  <li>ให้นักเรียนกรอกข้อมูลให้ครบ แล้วดาวน์โหลดเป็นไฟล์ CSV</li>
                  <li>อัปโหลดไฟล์ CSV เพื่อแสดงรายการตรวจสอบ และกด “นำเข้า”</li>
                </ol>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* ปุ่มรองใช้ outline/secondary เพื่อไม่แย่งความเด่นจากปุ่มเลือกไฟล์ */}
                    <Button onClick={downloadTemplate} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      ดาวน์โหลดไฟล์ตัวอย่าง
                    </Button>
                    <Button
                      onClick={handleCreateRosterSheet}
                      variant="outline"
                      loading={creatingSheet}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      สร้าง Google Sheet รวบรวมข้อมูล
                    </Button>
                  </div>
                  <span className="text-xs text-subtle">
                    * ใช้อย่างใดอย่างหนึ่งก็ได้ แล้วค่อยเลือกไฟล์ CSV เพื่ออัปโหลด
                  </span>
                </div>

                {latestSheetUrl && (
                  <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    สร้างไฟล์สำเร็จ:{" "}
                    <a
                      href={latestSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      {latestSheetName || "เปิดไฟล์ใน Google Sheets"}
                    </a>
                  </div>
                )}
              </div>

              {/* ปุ่มหลักของโหมด: เลือกไฟล์ CSV */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  เลือกไฟล์ CSV
                </Button>
              </div>

              {/* อธิบายรูปแบบไฟล์ (ข้อมูล) ชัดเจนว่าไม่ใช่ปุ่ม */}
              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-900">รูปแบบไฟล์ CSV</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>• คอลัมน์ที่ 1: studentId (รหัสนักศึกษา - บังคับ)</p>
                  <p>• คอลัมน์ที่ 2: firstName (ชื่อ - บังคับ)</p>
                  <p>• คอลัมน์ที่ 3: lastName (นามสกุล - บังคับ)</p>
                  <p>• คอลัมน์ที่ 4: email (ไม่บังคับ เว้นว่างได้)</p>
                    <p>• คอลัมน์ที่ 5: gender (ชาย/หญิง หรือ male/female — ระบบแปลงเป็นอังกฤษให้)</p>
                  <p>• คอลัมน์ที่ 6: birthdate (YYYY-MM-DD, ไม่บังคับ)</p>
                </div>
              </div>
            </div>
          )}

          {importMode === "manual" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">เพิ่มนักเรียนทีละคน</h3>
              <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    รหัสนักศึกษา *
                  </label>
                  <Input
                    value={manualStudent.studentId || ""}
                    onChange={(e) =>
                      setManualStudent((prev) => ({
                        ...prev,
                        studentId: e.target.value,
                      }))
                    }
                    placeholder="เช่น 65012345"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    อีเมล (ไม่บังคับ)
                  </label>
                  <Input
                    type="email"
                    value={manualStudent.email || ""}
                    onChange={(e) =>
                      setManualStudent((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="เว้นว่างได้ หากต้องการใช้อีเมลอัตโนมัติ"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">ชื่อ *</label>
                  <Input
                    value={manualStudent.firstName || ""}
                    onChange={(e) =>
                      setManualStudent((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="เช่น สมชาย"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    นามสกุล *
                  </label>
                  <Input
                    value={manualStudent.lastName || ""}
                    onChange={(e) =>
                      setManualStudent((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="เช่น ใจดี"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">เพศ</label>
                  <Select
                    value={manualStudent.gender || "female"}
                    onChange={(e) =>
                      setManualStudent((prev) => ({
                        ...prev,
                        gender: e.target.value as StudentGender,
                      }))
                    }
                  >
                    <option value="female">หญิง</option>
                    <option value="male">ชาย</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    วันเกิด (YYYY-MM-DD)
                  </label>
                  <Input
                    type="date"
                    value={manualStudent.birthdate || ""}
                    onChange={(e) =>
                      setManualStudent((prev) => ({
                        ...prev,
                        birthdate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  {/* ปุ่มหลักของโหมด manual */}
                  <Button onClick={handleAddManualStudent}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มนักเรียน
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* รายการที่พร้อมนำเข้า */}
          {validStudents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  นักเรียนที่พร้อมนำเข้า ({validStudents.length} คน)
                </h3>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">รหัสนักศึกษา</th>
                      <th className="p-2 text-left">ชื่อ</th>
                      <th className="p-2 text-left">นามสกุล</th>
                      <th className="p-2 text-left">อีเมล</th>
                      <th className="p-2 text-left">เพศ</th>
                      <th className="p-2 text-left">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validStudents.map((student, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{student.studentId}</td>
                        <td className="p-2">{student.firstName}</td>
                        <td className="p-2">{student.lastName}</td>
                        <td className="p-2">{student.email || "-"}</td>
                        <td className="p-2">
                          {student.gender
                            ? student.gender === "male"
                              ? "ชาย"
                              : "หญิง"
                            : "-"}
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => removeStudent(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* รายการที่มีปัญหา */}
          {invalidStudents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-medium text-red-600">
                  ข้อมูลที่มีปัญหา ({invalidStudents.length} รายการ)
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInvalid(!showInvalid)}
                >
                  {showInvalid ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showInvalid ? "ซ่อน" : "แสดง"}
                </Button>
              </div>

              {showInvalid && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="p-2 text-left">แถว</th>
                        <th className="p-2 text-left">ข้อมูล</th>
                        <th className="p-2 text-left">ปัญหา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invalidStudents.map((student, index) => (
                        <tr key={index} className="border-t border-red-100">
                          <td className="p-2">{student.row || index + 1}</td>
                          <td className="p-2">
                            {student.studentId} - {student.firstName}{" "}
                            {student.lastName}
                            {student.email ? ` (${student.email})` : ""}
                          </td>
                          <td className="p-2 text-red-600">
                            {student.errors?.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* แถบปุ่มสรุปท้าย (CTA หลัก/รอง แยกชัดเจน) */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" onClick={onClose}>
              {importSummary ? "ปิดหน้าต่าง" : "ยกเลิก"}
            </Button>
            <Button
              onClick={handleImport}
              disabled={validStudents.length === 0 || importing}
              loading={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              นำเข้า {validStudents.length} คน
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  );
}

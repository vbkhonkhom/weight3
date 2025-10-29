"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { UserPlus, Upload, Download, CheckCircle, X } from "lucide-react";
import { useSession } from "@/providers/session-provider";
import { useGlobalLoading } from "@/providers/loading-provider";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/lib/api";
import { downloadRawCsv } from "@/lib/utils";

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  onSuccess: () => void;
}

interface StudentFormData {
  fullName: string;
  email: string;
  gender: "male" | "female";
  birthdate: string;
}

export function AddStudentDialog({
  isOpen,
  onClose,
  classId,
  className,
  onSuccess,
}: AddStudentDialogProps) {
  const { session } = useSession();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { success, error } = useToast();

  // Individual student form
  const [studentForm, setStudentForm] = useState<StudentFormData>({
    fullName: "",
    email: "",
    gender: "male",
    birthdate: "",
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [importResults, setImportResults] = useState<{
    success: boolean;
    imported: number;
    total?: number;
    credentials?: Array<{ studentId: string; email: string; password: string }>;
  } | null>(null);

  // Reset form when dialog opens/closes
  const resetForm = useCallback(() => {
    setStudentForm({
      fullName: "",
      email: "",
      gender: "male",
      birthdate: "",
    });
    setCsvFile(null);
    setCsvPreview([]);
    setImportResults(null);
  }, []);

  // Handle dialog close
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Individual student submission
  const submitIndividualStudent = useCallback(async () => {
    if (!session?.token || !studentForm.fullName.trim() || !studentForm.email.trim()) {
      error("กรุณากรอกชื่อและอีเมลให้ครบถ้วน");
      return;
    }

    try {
      showLoading("กำลังเพิ่มนักเรียน...");
      await api.addStudent(session.token, {
        classId,
        fullName: studentForm.fullName.trim(),
        email: studentForm.email.trim(),
        gender: studentForm.gender,
        birthdate: studentForm.birthdate,
      });
      
      success("เพิ่มนักเรียนเรียบร้อยแล้ว");
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error adding student:", err);
      error("ไม่สามารถเพิ่มนักเรียนได้");
    } finally {
      hideLoading();
    }
  }, [session?.token, studentForm, classId, showLoading, hideLoading, success, error, onSuccess, handleClose]);

  // CSV file handler with validation
  const handleCsvFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setCsvPreview([]);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      error("กรุณาเลือกไฟล์ CSV เท่านั้น");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      error("ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ที่เล็กกว่า 5MB");
      return;
    }

    setCsvFile(file);

    // Read and preview CSV with validation
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const rows = lines.map(line => 
          line.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'))
        );
        
        // Show preview with validation indicators
        setCsvPreview(rows.slice(0, 6));
        
        // Show file info
        success(`โหลดไฟล์สำเร็จ: ${lines.length - 1} แถวข้อมูล`);
      } catch (err) {
        error("ไม่สามารถอ่านไฟล์ CSV ได้ กรุณาตรวจสอบรูปแบบไฟล์");
        setCsvFile(null);
        setCsvPreview([]);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, [error, success]);

  // Submit CSV import
  const submitCsvImport = useCallback(async () => {
    if (!session?.token || !csvFile) {
      error("กรุณาเลือกไฟล์ CSV ก่อน");
      return;
    }

    try {
      showLoading("กำลังนำเข้าข้อมูล...");
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const rows = lines.slice(1).map(line => // Skip header row
            line.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'))
          );

          const students = rows
            .filter(row => row.length >= 4 && row[0] && row[3]) // Must have name and email
            .map((row, index) => {
              const fullName = row[1] || row[0];
              const nameParts = fullName.split(' ');
              return {
                studentId: row[0] || `student${index + 1}`,
                firstName: nameParts[0] || fullName,
                lastName: nameParts.slice(1).join(' ') || '',
                gender: row[2]?.toLowerCase() === 'หญิง' || row[2]?.toLowerCase() === 'female' ? 'female' as const : 'male' as const,
                email: row[3],
                birthdate: row[4] || '',
              };
            });

          if (students.length === 0) {
            error("ไม่พบข้อมูลนักเรียนที่ถูกต้องในไฟล์");
            return;
          }

          const result = await api.importStudents(session.token!, {
            classId,
            students,
          });

          setImportResults(result);
          success(`นำเข้าข้อมูลเรียบร้อยแล้ว ${result.imported}/${result.total || 0} คน`);
          onSuccess();
        } catch (err) {
          console.error("CSV import error:", err);
          error("ไม่สามารถนำเข้าข้อมูลได้");
        } finally {
          hideLoading();
        }
      };
      
      reader.readAsText(csvFile, 'UTF-8');
    } catch (err) {
      hideLoading();
      console.error("Error reading CSV:", err);
      error("ไม่สามารถอ่านไฟล์ได้");
    }
  }, [session?.token, csvFile, classId, showLoading, hideLoading, success, error, onSuccess]);

  // Download CSV template
  const downloadTemplate = useCallback(() => {
    const template = [
      ["รหัสนักเรียน", "ชื่อ-นามสกุล", "เพศ", "อีเมล", "วันเกิด"],
      ["65012345", "นาย สมชาย ใจดี", "ชาย", "somchai@example.com", "2000-01-15"],
      ["65012346", "นางสาว สมใส ใจดี", "หญิง", "somsai@example.com", "2000-03-22"],
    ];
    
    downloadRawCsv(template, "template-students.csv");
    success("ดาวน์โหลดแม่แบบเรียบร้อยแล้ว");
  }, [success]);

  // Download credentials after import
  const downloadCredentials = useCallback(() => {
    if (!importResults?.credentials) return;

    const credentialsData = [
      ["อีเมล", "รหัสผ่านชั่วคราว"],
      ...importResults.credentials.map(cred => [cred.email, cred.password])
    ];

    downloadRawCsv(credentialsData, `${className}-รหัสผ่านนักเรียน.csv`);
    success("ดาวน์โหลดรหัสผ่านเรียบร้อยแล้ว");
  }, [importResults, className, success]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            เพิ่มนักเรียนเข้าห้องเรียน
          </DialogTitle>
          <DialogDescription>
            เพิ่มนักเรียนเข้า "{className}" ทีละคนหรือนำเข้าจากไฟล์ CSV
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">เพิ่มทีละคน</TabsTrigger>
            <TabsTrigger value="csv">นำเข้าจาก CSV</TabsTrigger>
          </TabsList>

          {/* Individual Student Tab */}
          <TabsContent value="individual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลนักเรียน</CardTitle>
                <CardDescription>
                  กรอกข้อมูลนักเรียนที่ต้องการเพิ่ม (อีเมลบังคับใส่)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="individual-name">ชื่อ-นามสกุล *</Label>
                  <Input
                    id="individual-name"
                    value={studentForm.fullName}
                    onChange={(e) =>
                      setStudentForm(prev => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="individual-email">อีเมล *</Label>
                  <Input
                    id="individual-email"
                    type="email"
                    value={studentForm.email}
                    onChange={(e) =>
                      setStudentForm(prev => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="student@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="individual-gender">เพศ</Label>
                    <Select
                      value={studentForm.gender}
                      onChange={(e) =>
                        setStudentForm(prev => ({ 
                          ...prev, 
                          gender: e.target.value as "male" | "female" 
                        }))
                      }
                    >
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="individual-birthdate">วันเกิด</Label>
                    <Input
                      id="individual-birthdate"
                      type="date"
                      value={studentForm.birthdate}
                      onChange={(e) =>
                        setStudentForm(prev => ({ ...prev, birthdate: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleClose}>
                    ยกเลิก
                  </Button>
                  <Button onClick={submitIndividualStudent}>
                    เพิ่มนักเรียน
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CSV Import Tab */}
          <TabsContent value="csv" className="space-y-4">
            {!importResults ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      ดาวน์โหลดแม่แบบ
                    </CardTitle>
                    <CardDescription>
                      ดาวน์โหลดไฟล์ตัวอย่างเพื่อใช้เป็นแม่แบบการนำเข้าข้อมูล
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      ดาวน์โหลดแม่แบบ CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      เลือกไฟล์ CSV
                    </CardTitle>
                    <CardDescription>
                      รูปแบบไฟล์: รหัสนักเรียน, ชื่อ-นามสกุล, เพศ, อีเมล, วันเกิด
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {csvPreview.length > 0 && (
                      <div>
                        <Label className="flex items-center gap-2">
                          ตัวอย่างข้อมูล (6 แถวแรก)
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>ถูกต้อง</span>
                            <div className="w-2 h-2 rounded-full bg-red-500 ml-2"></div>
                            <span>ผิดพลาด</span>
                          </div>
                        </Label>
                        <div className="mt-2 overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm">
                            <tbody>
                              {csvPreview.map((row, index) => {
                                const isHeader = index === 0;
                                const hasValidEmail = row[3] && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[3]);
                                const hasName = row[1] && row[1].trim().length > 0;
                                const isValid = isHeader || (hasValidEmail && hasName);
                                
                                return (
                                  <tr key={index} className={`${isHeader ? "bg-muted font-semibold" : ""} ${!isValid && index > 0 ? "bg-red-50" : ""}`}>
                                    {row.map((cell, cellIndex) => {
                                      let cellClass = "px-3 py-2 border-r border-b";
                                      
                                      // Highlight invalid cells
                                      if (!isHeader && index > 0) {
                                        if (cellIndex === 1 && !hasName) cellClass += " bg-red-100";
                                        if (cellIndex === 3 && !hasValidEmail) cellClass += " bg-red-100";
                                      }
                                      
                                      return (
                                        <td key={cellIndex} className={cellClass}>
                                          <div className="flex items-center gap-2">
                                            {cell}
                                            {!isHeader && index > 0 && (
                                              <>
                                                {cellIndex === 1 && !hasName && <X className="h-3 w-3 text-red-500" />}
                                                {cellIndex === 1 && hasName && <CheckCircle className="h-3 w-3 text-green-500" />}
                                                {cellIndex === 3 && !hasValidEmail && <X className="h-3 w-3 text-red-500" />}
                                                {cellIndex === 3 && hasValidEmail && <CheckCircle className="h-3 w-3 text-green-500" />}
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <Alert 
                      variant="info" 
                      message="อีเมลเป็นช่องบังคับ ระบบจะสร้างรหัสผ่านชั่วคราวให้อัตโนมัติ"
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={handleClose}>
                        ยกเลิก
                      </Button>
                      <Button 
                        onClick={submitCsvImport}
                        disabled={!csvFile}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        นำเข้าข้อมูล
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    นำเข้าข้อมูลเรียบร้อย
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800">
                      นำเข้าข้อมูลสำเร็จ <strong>{importResults.imported}</strong> จาก <strong>{importResults.total || 0}</strong> คน
                    </p>
                  </div>

                  {importResults.credentials && importResults.credentials.length > 0 && (
                    <div>
                      <Alert 
                        variant="warning"
                        message="ระบบได้สร้างรหัสผ่านชั่วคราวสำหรับนักเรียนใหม่ กรุณาดาวน์โหลดและแจกจ่ายให้นักเรียน"
                      />
                      
                      <Button variant="outline" onClick={downloadCredentials} className="mt-2">
                        <Download className="h-4 w-4 mr-2" />
                        ดาวน์โหลดรหัสผ่านชั่วคราว
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={handleClose}>
                      เสร็จสิ้น
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
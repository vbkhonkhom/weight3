"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/providers/session-provider";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/lib/api";
import { Archive, Trash2, Database, AlertTriangle, CheckCircle } from "lucide-react";

interface SheetStat {
  name: string;
  rowCount: number;
  columnCount: number;
  cellCount: number;
  percentFull: number;
}

interface SheetStats {
  sheets: SheetStat[];
  totalCells: number;
  maxCells: number;
  warningThreshold: boolean;
}

export default function StorageManagementPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();
  const toast = useToast();
  const [stats, setStats] = useState<SheetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [archiveDate, setArchiveDate] = useState("");
  const [deleteDate, setDeleteDate] = useState("");
  const [keepLatest, setKeepLatest] = useState(5);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isRestoring) return;
    if (!session?.user || session.user.role !== "instructor") {
      router.replace("/dashboard");
      return;
    }
    loadStats();
  }, [isRestoring, session, router]);

  const loadStats = async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const data = await api.getSheetStats(session.token);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("ไม่สามารถโหลดข้อมูลสถิติ Sheet ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!session?.token || !archiveDate) {
      toast.error("กรุณาเลือกวันที่");
      return;
    }

    setProcessing(true);
    try {
      const result = await api.archiveOldData(session.token, {
        beforeDate: archiveDate,
        sheetNames: selectedSheet ? [selectedSheet] : undefined,
      });

      toast.success(
        `Archive สำเร็จ! ย้ายข้อมูล ${result.archivedCount} รายการไปยัง ${result.archiveSheetName}`
      );
      setArchiveDialogOpen(false);
      setArchiveDate("");
      setSelectedSheet("");
      await loadStats();
    } catch (error) {
      console.error("Archive error:", error);
      toast.error(error instanceof Error ? error.message : "ไม่สามารถ archive ข้อมูลได้");
    } finally {
      setProcessing(false);
    }
  };

  const handleCleanup = async () => {
    if (!session?.token || !selectedSheet) {
      toast.error("กรุณาเลือก Sheet");
      return;
    }

    setProcessing(true);
    try {
      const result = await api.cleanupDuplicates(session.token, selectedSheet);
      toast.success(`ลบข้อมูลซ้ำสำเร็จ! ลบไป ${result.removedCount} รายการ`);
      setCleanupDialogOpen(false);
      setSelectedSheet("");
      await loadStats();
    } catch (error) {
      console.error("Cleanup error:", error);
      toast.error(error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลซ้ำได้");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.token || !selectedSheet || !deleteDate) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setProcessing(true);
    try {
      const result = await api.deleteOldRecords(session.token, {
        sheetName: selectedSheet,
        beforeDate: deleteDate,
        keepLatestPerUser: keepLatest,
      });

      toast.success(`ลบข้อมูลเก่าสำเร็จ! ลบไป ${result.deletedCount} รายการ`);
      setDeleteDialogOpen(false);
      setDeleteDate("");
      setSelectedSheet("");
      await loadStats();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลได้");
    } finally {
      setProcessing(false);
    }
  };

  if (isRestoring || loading) {
    return (
      <AppShell title="จัดการพื้นที่เก็บข้อมูล" description="">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const percentUsed = stats ? (stats.totalCells / stats.maxCells) * 100 : 0;

  return (
    <AppShell
      title="จัดการพื้นที่เก็บข้อมูล"
      description="ตรวจสอบและจัดการพื้นที่เก็บข้อมูลใน Google Sheet"
      actions={
        <Button variant="secondary" onClick={() => router.back()}>
          กลับ
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Warning Alert */}
        {stats?.warningThreshold && (
          <Alert
            variant="warning"
            message={`⚠️ พื้นที่เก็บข้อมูลใกล้เต็ม (${percentUsed.toFixed(1)}%) กรุณาทำการ Archive หรือลบข้อมูลเก่า`}
          />
        )}

        {/* Overall Statistics */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">สถิติการใช้งานโดยรวม</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-elevated p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">จำนวนเซลล์ทั้งหมด</p>
              <p className="text-2xl font-bold text-primary">
                {stats?.totalCells.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                จากทั้งหมด {stats?.maxCells.toLocaleString()} เซลล์
              </p>
            </div>
            <div className="bg-surface-elevated p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">เปอร์เซ็นต์ที่ใช้</p>
              <p className="text-2xl font-bold text-primary">{percentUsed.toFixed(1)}%</p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    percentUsed > 80
                      ? "bg-red-500"
                      : percentUsed > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
            <div className="bg-surface-elevated p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">สถานะ</p>
              <div className="flex items-center gap-2 mt-2">
                {percentUsed > 80 ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-red-600 font-semibold">ใกล้เต็ม</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-semibold">ปกติ</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Sheet Statistics */}
        <div className="grid gap-4 md:grid-cols-2">
          {stats?.sheets.map((sheet) => (
            <Card key={sheet.name} className="p-6">
              <h3 className="text-lg font-semibold mb-4">{sheet.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">จำนวนแถว</span>
                  <span className="font-semibold">{sheet.rowCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">จำนวนคอลัมน์</span>
                  <span className="font-semibold">{sheet.columnCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">จำนวนเซลล์</span>
                  <span className="font-semibold">{sheet.cellCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">การใช้งาน</span>
                  <span
                    className={`font-semibold ${
                      sheet.percentFull > 80
                        ? "text-red-600"
                        : sheet.percentFull > 60
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {sheet.percentFull.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">การจัดการข้อมูล</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => setArchiveDialogOpen(true)}
            >
              <Archive className="w-6 h-6 mb-2" />
              <span className="font-semibold">Archive ข้อมูลเก่า</span>
              <span className="text-xs text-muted-foreground mt-1">
                ย้ายข้อมูลเก่าไปชีทแยก
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => setCleanupDialogOpen(true)}
            >
              <Database className="w-6 h-6 mb-2" />
              <span className="font-semibold">ลบข้อมูลซ้ำ</span>
              <span className="text-xs text-muted-foreground mt-1">
                ลบข้อมูลที่ซ้ำกัน
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col py-4 text-red-600 hover:text-red-700"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-6 h-6 mb-2" />
              <span className="font-semibold">ลบข้อมูลเก่า</span>
              <span className="text-xs text-muted-foreground mt-1">
                ลบข้อมูลก่อนวันที่กำหนด
              </span>
            </Button>
          </div>
        </Card>

        {/* Archive Dialog */}
        <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive ข้อมูลเก่า</DialogTitle>
              <DialogDescription>
                ย้ายข้อมูลเก่าไปยังชีทแยกเพื่อประหยัดพื้นที่
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>เลือก Sheet (ไม่เลือก = ทุก Sheet)</Label>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="w-full mt-1 rounded-md border border-border bg-surface px-3 py-2"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="TestResults">TestResults</option>
                  <option value="BodyMeasurements">BodyMeasurements</option>
                </select>
              </div>
              <div>
                <Label htmlFor="archiveDate">Archive ข้อมูลก่อนวันที่</Label>
                <Input
                  id="archiveDate"
                  type="date"
                  value={archiveDate}
                  onChange={(e) => setArchiveDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleArchive} loading={processing}>
                Archive
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cleanup Dialog */}
        <Dialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ลบข้อมูลซ้ำ</DialogTitle>
              <DialogDescription>
                ลบข้อมูลที่มีค่าซ้ำกันใน Sheet
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label>เลือก Sheet</Label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full mt-1 rounded-md border border-border bg-surface px-3 py-2"
              >
                <option value="">เลือก Sheet</option>
                <option value="TestResults">TestResults</option>
                <option value="BodyMeasurements">BodyMeasurements</option>
                <option value="Users">Users</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCleanupDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCleanup} loading={processing}>
                ลบข้อมูลซ้ำ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ลบข้อมูลเก่า</DialogTitle>
              <DialogDescription className="text-red-600">
                ⚠️ การลบไม่สามารถย้อนกลับได้! แนะนำให้ Archive ก่อน
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>เลือก Sheet</Label>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="w-full mt-1 rounded-md border border-border bg-surface px-3 py-2"
                >
                  <option value="">เลือก Sheet</option>
                  <option value="TestResults">TestResults</option>
                  <option value="BodyMeasurements">BodyMeasurements</option>
                </select>
              </div>
              <div>
                <Label htmlFor="deleteDate">ลบข้อมูลก่อนวันที่</Label>
                <Input
                  id="deleteDate"
                  type="date"
                  value={deleteDate}
                  onChange={(e) => setDeleteDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="keepLatest">เก็บผลล่าสุดต่อผู้ใช้ (รายการ)</Label>
                <Input
                  id="keepLatest"
                  type="number"
                  min="0"
                  value={keepLatest}
                  onChange={(e) => setKeepLatest(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  เก็บผลทดสอบล่าสุด {keepLatest} รายการต่อผู้ใช้ แม้จะเก่ากว่าวันที่กำหนด
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button variant="destructive" onClick={handleDelete} loading={processing}>
                ลบข้อมูล
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

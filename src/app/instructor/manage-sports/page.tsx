"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface SportType {
  id: string;
  name: string;
  positions: string[];
  createdAt: string;
}

interface SportFormData {
  name: string;
  positions: string;
}

export default function ManageSportsPage() {
  const [sports, setSports] = useState<SportType[]>([
    {
      id: "1",
      name: "ฟุตบอล",
      positions: ["กองหน้า", "กองกลาง", "กองหลัง", "ผู้รักษาประตู"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "วอลเลย์บอล",
      positions: ["ตัวเซ็ตเตอร์", "ตัวรับ", "ตัวตบ", "ลิเบอโร่"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "บาสเกตบอล",
      positions: ["ยิงประตู", "ฟอร์เวิร์ด", "เซนเตอร์", "การ์ด"],
      createdAt: new Date().toISOString(),
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportType | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SportFormData>();

  const openAddDialog = () => {
    setEditingSport(null);
    reset();
    setIsDialogOpen(true);
  };

  const openEditDialog = (sport: SportType) => {
    setEditingSport(sport);
    setValue("name", sport.name);
    setValue("positions", sport.positions.join(", "));
    setIsDialogOpen(true);
  };

  const onSubmit = (data: SportFormData) => {
    const positions = data.positions
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (editingSport) {
      // Update existing sport
      setSports(
        sports.map((s) =>
          s.id === editingSport.id
            ? { ...s, name: data.name, positions }
            : s
        )
      );
    } else {
      // Add new sport
      const newSport: SportType = {
        id: Date.now().toString(),
        name: data.name,
        positions,
        createdAt: new Date().toISOString(),
      };
      setSports([...sports, newSport]);
    }

    setIsDialogOpen(false);
    reset();
  };

  const handleDelete = (id: string) => {
    setSports(sports.filter((s) => s.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <AppShell
      title="จัดการประเภทกีฬา"
      description="เพิ่ม แก้ไข หรือลบประเภทกีฬาและตำแหน่งของนักกีฬา"
      actions={
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มประเภทกีฬา
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => (
            <Card key={sport.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{sport.name}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(sport)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(sport.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  ตำแหน่ง:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sport.positions.map((position, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                    >
                      {position}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSport ? "แก้ไขประเภทกีฬา" : "เพิ่มประเภทกีฬา"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อกีฬา</Label>
                <Input
                  id="name"
                  {...register("name", { required: "กรุณากรอกชื่อกีฬา" })}
                  placeholder="เช่น ฟุตบอล"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="positions">
                  ตำแหน่ง (คั่นด้วยเครื่องหมายจุลภาค)
                </Label>
                <Input
                  id="positions"
                  {...register("positions", {
                    required: "กรุณากรอกตำแหน่งอย่างน้อย 1 ตำแหน่ง",
                  })}
                  placeholder="เช่น กองหน้า, กองกลาง, กองหลัง"
                />
                {errors.positions && (
                  <p className="text-sm text-red-500">
                    {errors.positions.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  ใส่ตำแหน่งหลายตำแหน่ง โดยคั่นด้วยเครื่องหมายจุลภาค (,)
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit">
                  {editingSport ? "บันทึก" : "เพิ่ม"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmId !== null}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการลบ</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              คุณต้องการลบประเภทกีฬานี้ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                ลบ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateClassDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (className: string) => Promise<void> | void;
}

export function CreateClassDialog({
  open,
  onClose,
  onCreate,
}: CreateClassDialogProps) {
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    setLoading(true);
    try {
      await onCreate(className.trim());
      setClassName('');
      onClose();
    } catch (error) {
      console.error('Failed to create class', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>สร้างชั้นเรียนใหม่</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="className">ชื่อชั้นเรียน</Label>
            <Input
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="เช่น การออกกำลังกายเพื่อสุขภาพ กลุ่ม A"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" loading={loading} disabled={loading || !className.trim()}>
              สร้างชั้นเรียน
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Filter, Trophy } from "lucide-react";
import { AthleteStandardsManagement } from "@/components/instructor/athlete-standards-management";

interface FitnessCriteria {
  id: string;
  sportType: string;
  gender: "male" | "female";
  ageMin: number;
  ageMax: number;
  testType: string;
  excellent: string;
  good: string;
  fair: string;
  poor: string;
  unit: string;
  createdAt: string;
}

interface CriteriaFormData {
  sportType: string;
  gender: "male" | "female";
  ageMin: number;
  ageMax: number;
  testType: string;
  excellent: string;
  good: string;
  fair: string;
  poor: string;
  unit: string;
}

export default function ManageCriteriaPage() {
  // Redirect this legacy route to the new Athlete Standards page
  const router = useRouter();
  useEffect(() => {
    router.replace("/instructor/athlete-standards");
  }, [router]);
  return null;

  /* LEGACY PAGE CONTENT (deprecated):
  const [criteria, setCriteria] = useState<FitnessCriteria[]>([
    {
      id: "1",
      sportType: "ฟุตบอล",
      gender: "male",
      ageMin: 18,
      ageMax: 25,
      testType: "VO2 Max",
      excellent: "> 55",
      good: "50-55",
      fair: "45-50",
      poor: "< 45",
      unit: "ml/kg/min",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      sportType: "วอลเลย์บอล",
      gender: "female",
      ageMin: 18,
      ageMax: 25,
      testType: "Vertical Jump",
      excellent: "> 50",
      good: "45-50",
      fair: "40-45",
      poor: "< 40",
      unit: "cm",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<FitnessCriteria | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CriteriaFormData>();

  const openAddDialog = () => {
    setEditingCriteria(null);
    reset();
    setIsDialogOpen(true);
  };

  const openEditDialog = (criteria: FitnessCriteria) => {
    setEditingCriteria(criteria);
    setValue("sportType", criteria.sportType);
    setValue("gender", criteria.gender);
    setValue("ageMin", criteria.ageMin);
    setValue("ageMax", criteria.ageMax);
    setValue("testType", criteria.testType);
    setValue("excellent", criteria.excellent);
    setValue("good", criteria.good);
  // Update existing criteria
  */
}

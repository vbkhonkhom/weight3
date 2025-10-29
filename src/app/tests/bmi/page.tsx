"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useSession } from "@/providers/session-provider";

interface TestFormData {
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female";
}

export default function BMITestPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();
  const token = session?.token;
  const [formData, setFormData] = useState<TestFormData>({
    weight: 0,
    height: 0,
    age: 20,
    gender: "male"
  });
  const [result, setResult] = useState<{ bmi: number; category: string; color: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  useEffect(() => {
    if (!isRestoring && session?.user?.role === "instructor") {
      router.replace("/dashboard");
    }
  }, [isRestoring, session?.user?.role, router]);

  if (session?.user?.role === "instructor") {
    return null;
  }

  if (isRestoring) {
    return (
      <AppShell title="ทดสอบ BMI" description="">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const calculateBMI = () => {
    if (formData.weight <= 0 || formData.height <= 0) {
      setErrorMessage("กรุณากรอกน้ำหนักและส่วนสูงให้ถูกต้อง");
      return;
    }

    const heightInMeters = formData.height / 100;
    const bmi = formData.weight / (heightInMeters * heightInMeters);
    
    let category = "";
    let color = "";

    if (bmi < 18.5) {
      category = "น้ำหนักต่ำกว่าเกณฑ์";
      color = "text-blue-600";
    } else if (bmi < 23) {
      category = "น้ำหนักปกติ";
      color = "text-green-600";
    } else if (bmi < 25) {
      category = "น้ำหนักเกิน";
      color = "text-yellow-600";
    } else if (bmi < 30) {
      category = "โรคอ้วนระดับ 1";
      color = "text-orange-600";
    } else {
      category = "โรคอ้วนระดับ 2";
      color = "text-red-600";
    }

    setErrorMessage(undefined);
    setResult({ bmi: Number(bmi.toFixed(1)), category, color });
  };

  const handleSubmit = async () => {
    if (!result) {
      calculateBMI();
      return;
    }

    if (!token) {
      setErrorMessage("กรุณาเข้าสู่ระบบก่อนบันทึกผลการทดสอบ");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      await api.recordTest(token, {
        testType: "bmi",
        value: Number(result.bmi.toFixed(2)),
        weightKg: formData.weight,
        heightM: formData.height / 100,
        notes: `อายุ ${formData.age} ปี | เพศ ${formData.gender === "male" ? "ชาย" : "หญิง"}`,
      });
      setSuccessMessage("บันทึกผลการทดสอบเรียบร้อยแล้ว");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setErrorMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBMIRecommendation = (bmi: number) => {
    if (bmi < 18.5) {
      return {
        title: "คำแนะนำ: เพิ่มน้ำหนัก",
        tips: [
          "รับประทานอาหารให้ครบ 5 หมู่",
          "เพิ่มปริมาณโปรตีนและคาร์โบไฮเดรต",
          "ออกกำลังกายเสริมสร้างกล้ามเนื้อ",
          "พักผ่อนให้เพียงพอ"
        ]
      };
    } else if (bmi < 23) {
      return {
        title: "คำแนะนำ: รักษาน้ำหนัก",
        tips: [
          "รักษาการรับประทานอาหารให้สมดุล",
          "ออกกำลังกายสม่ำเสมอ",
          "ดูแลสุขภาพจิต",
          "ตรวจสุขภาพประจำปี"
        ]
      };
    } else {
      return {
        title: "คำแนะนำ: ลดน้ำหนัก",
        tips: [
          "ลดปริมาณอาหารที่มีน้ำตาลและไขมัน",
          "เพิ่มการออกกำลังกายแบบแอโรบิก",
          "ดื่มน้ำให้เพียงพอ",
          "ปรึกษาแพทย์หรือนักโภชนาการ"
        ]
      };
    }
  };

  return (
    <AppShell 
      title="ทดสอบ BMI" 
      description="วัดดัชนีมวลกาย (Body Mass Index) เพื่อประเมินสัดส่วนน้ำหนักและส่วนสูง"
      actions={
        <Button variant="secondary" onClick={() => router.back()}>
          กลับ
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {errorMessage && <Alert variant="error" message={errorMessage} />}
        {successMessage && <Alert variant="info" message={successMessage} />}
        {/* Input Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">กรอกข้อมูลส่วนตัว</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                น้ำหนัก (กิโลกรัม)
              </label>
              <Input
                type="number"
                value={formData.weight || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                placeholder="เช่น 65"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ส่วนสูง (เซนติเมตร)
              </label>
              <Input
                type="number"
                value={formData.height || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, height: Number(e.target.value) }))}
                placeholder="เช่น 170"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อายุ (ปี)
              </label>
              <Input
                type="number"
                value={formData.age || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, age: Number(e.target.value) }))}
                placeholder="เช่น 20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เพศ
              </label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as "male" | "female" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
              </select>
            </div>
          </div>
          
          <Button 
            onClick={calculateBMI}
            className="w-full mt-4"
            disabled={formData.weight <= 0 || formData.height <= 0}
          >
            คำนวณ BMI
          </Button>
        </Card>

        {/* Result */}
        {result && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">ผลการทดสอบ</h2>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {result.bmi}
              </div>
              <div className={`text-lg font-semibold ${result.color}`}>
                {result.category}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Body Mass Index (BMI)
              </div>
            </div>

            {/* BMI Scale */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">เกณฑ์ BMI</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-blue-50 text-blue-800 text-sm">
                  <span>น้ำหนักต่ำกว่าเกณฑ์</span>
                  <span>&lt; 18.5</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-green-50 text-green-800 text-sm">
                  <span>น้ำหนักปกติ</span>
                  <span>18.5 - 22.9</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-yellow-50 text-yellow-800 text-sm">
                  <span>น้ำหนักเกิน</span>
                  <span>23.0 - 24.9</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-orange-50 text-orange-800 text-sm">
                  <span>โรคอ้วนระดับ 1</span>
                  <span>25.0 - 29.9</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-red-50 text-red-800 text-sm">
                  <span>โรคอ้วนระดับ 2</span>
                  <span>≥ 30.0</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">{getBMIRecommendation(result.bmi).title}</h3>
              <ul className="space-y-2">
                {getBMIRecommendation(result.bmi).tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-sm text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              บันทึกผลการทดสอบและกลับสู่หน้าหลัก
            </Button>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">ข้อมูลเกี่ยวกับ BMI</h3>
          <p className="text-blue-700 text-sm mb-3">
            BMI (Body Mass Index) หรือดัชนีมวลกาย เป็นตัวชี้วัดที่ใช้ประเมินว่าน้ำหนักของคุณอยู่ในเกณฑ์ปกติหรือไม่ 
            โดยคำนวณจากน้ำหนัก (กิโลกรัม) หารด้วยส่วนสูง (เมตร) ยกกำลังสอง
          </p>
          <div className="text-blue-600 text-sm font-medium">
            สูตรการคำนวณ: BMI = น้ำหนัก (kg) ÷ ส่วนสูง² (m²)
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

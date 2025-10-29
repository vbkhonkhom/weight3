"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { InstructorDashboard } from "@/components/instructor/instructor-dashboard";
import { useSession } from "@/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isRestoring } = useSession();

  useEffect(() => {
    if (!isRestoring && !session?.user) {
      router.replace("/");
    }
  }, [isRestoring, session, router]);

  if (isRestoring) {
    return (
      <AppShell title="กำลังโหลด...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!session?.user) {
    return null;
  }

  const dashboardTitle = session.user.role === "instructor" ? "Dashboard อาจารย์" : "Dashboard นักเรียน";

  return (
    <AppShell title={dashboardTitle}>
      {session.user.role === "instructor" ? <InstructorDashboard /> : <StudentDashboard />}
    </AppShell>
  );
}

// Enhanced Student Dashboard Component
function StudentDashboard() {
  const router = useRouter();
  const { session } = useSession();

  const hasTestData = false;
  const hasBodyCompositionData = false;

  const handleNavigateToTest = (testType: string) => {
    router.push(`/tests/${testType}`);
  };

  const handleNavigateToComparison = () => {
    router.push("/comparison");
  };

  const handleNavigateToStandards = () => {
    router.push("/standards");
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          สวัสดี {session?.user?.email?.split('@')[0] || "นักเรียน"} 👋
        </h1>
        <p className="text-gray-600">
          ติดตามและบันทึกผลการทดสอบสมรรถภาพกายของคุณ
        </p>
      </div>

      {/* Quick Action Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* BMI Test */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleNavigateToTest('bmi')}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">วัด BMI</h3>
              <p className="text-sm text-gray-600">ดัชนีมวลกาย</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            เริ่มทดสอบ
          </Button>
        </Card>

        {/* Flexibility Test */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleNavigateToTest('flexibility')}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <span className="text-xl">🤸</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ความยืดหยุ่น</h3>
              <p className="text-sm text-gray-600">Sit and Reach</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            เริ่มทดสอบ
          </Button>
        </Card>

        {/* Strength Test */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleNavigateToTest('strength')}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <span className="text-xl">💪</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">กำลังกล้ามเนื้อ</h3>
              <p className="text-sm text-gray-600">Hand Grip</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            เริ่มทดสอบ
          </Button>
        </Card>

        {/* Endurance Test */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleNavigateToTest('endurance')}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <span className="text-xl">🏃</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ความอดทน</h3>
              <p className="text-sm text-gray-600">Step Up Test</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            เริ่มทดสอบ
          </Button>
        </Card>

        {/* Body Composition Comparison */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleNavigateToComparison}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">เปรียบเทียบสัดส่วน</h3>
              <p className="text-sm text-gray-600">19 จุดวัด</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full" disabled={!hasBodyCompositionData}>
            {hasBodyCompositionData ? "ดูเปรียบเทียบ" : "ยังไม่มีข้อมูล"}
          </Button>
        </Card>

        {/* Standards Management */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleNavigateToStandards}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center group-hover:bg-teal-200 transition-colors">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">เกณฑ์มาตรฐาน</h3>
              <p className="text-sm text-gray-600">ดูเกณฑ์การประเมิน</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            ดูเกณฑ์
          </Button>
        </Card>
      </div>

      {/* Test Results Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">ผลการทดสอบล่าสุด</h2>
        
        {!hasTestData ? (
          <div className="space-y-4">
            <EmptyState
              title="ยังไม่มีข้อมูลการทดสอบ"
              description="เมื่อคุณทำการทดสอบแล้ว ผลการทดสอบจะแสดงที่นี่"
            />
            <div className="text-center">
              <Button onClick={() => handleNavigateToTest('bmi')}>
                เริ่มทดสอบแรก
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">22.5</div>
                <div className="text-sm text-gray-600">BMI</div>
                <div className="text-xs text-green-600 mt-1">ปกติ</div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Progress Chart Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">ความก้าวหน้า</h2>
        
        {!hasTestData ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>แผนภูมิความก้าวหน้าจะแสดงเมื่อมีข้อมูลการทดสอบ</p>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>แผนภูมิความก้าวหน้า (จะพัฒนาต่อไป)</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

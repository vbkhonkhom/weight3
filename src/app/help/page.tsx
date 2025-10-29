"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  UserPlus, 
  ClipboardCheck, 
  Users, 
  HelpCircle,
  Video,
  FileText,
  Mail
} from "lucide-react";

export default function HelpPage() {
  return (
    <AppShell title="คู่มือการใช้งาน">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">
            📚 ศูนย์ช่วยเหลือ WTH Fitness
          </h1>
          <p className="text-muted-foreground">
            คู่มือการใช้งานแบบละเอียด สำหรับผู้ใช้งานทุกระดับ
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Video className="w-12 h-12 mx-auto text-blue-500 mb-2" />
              <CardTitle className="text-sm">วิดีโอสอนใช้งาน</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <FileText className="w-12 h-12 mx-auto text-green-500 mb-2" />
              <CardTitle className="text-sm">คู่มือ PDF</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-orange-500 mb-2" />
              <CardTitle className="text-sm">คำถามที่พบบ่อย</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Mail className="w-12 h-12 mx-auto text-red-500 mb-2" />
              <CardTitle className="text-sm">ติดต่อเรา</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="getting-started" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
            <TabsTrigger value="getting-started">เริ่มต้นใช้งาน</TabsTrigger>
            <TabsTrigger value="student">สำหรับนักเรียน</TabsTrigger>
            <TabsTrigger value="athlete">สำหรับนักกีฬา</TabsTrigger>
            <TabsTrigger value="instructor">สำหรับครู</TabsTrigger>
          </TabsList>

          {/* เริ่มต้นใช้งาน */}
          <TabsContent value="getting-started" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  ขั้นตอนการเริ่มต้นใช้งาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold">สมัครสมาชิก</h3>
                      <p className="text-sm text-muted-foreground">
                        คลิกปุ่ม "สมัครสมาชิก" แล้วเลือกประเภทผู้ใช้ (นักเรียน/นักกีฬา)
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                        <li>กรอกอีเมลและรอรับรหัส OTP</li>
                        <li>กรอกข้อมูลส่วนตัวให้ครบถ้วน</li>
                        <li>สำหรับนักกีฬา: เลือกประเภทกีฬาและตำแหน่ง</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold">เข้าสู่ระบบ</h3>
                      <p className="text-sm text-muted-foreground">
                        ใช้อีเมลและรหัสผ่านที่สมัครไว้เพื่อเข้าสู่ระบบ
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold">เข้าร่วมชั้นเรียน (สำหรับนักเรียน)</h3>
                      <p className="text-sm text-muted-foreground">
                        ขอรหัสชั้นเรียนจากครูผู้สอน แล้วกรอกในหน้าชั้นเรียน
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold">บันทึกผลการทดสอบ</h3>
                      <p className="text-sm text-muted-foreground">
                        ไปที่หน้าการทดสอบแล้วเลือกประเภทที่ต้องการบันทึก
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💡 เคล็ดลับการใช้งาน</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>บันทึกผลการทดสอบทันทีหลังทำเสร็จ เพื่อความแม่นยำ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>ตรวจสอบข้อมูลก่อนกดบันทึก ป้องกันข้อผิดพลาด</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>ดูกราฟแนวโน้มในแดชบอร์ดเพื่อติดตามความคืบหน้า</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>ใช้โหมดเปรียบเทียบเพื่อดูการพัฒนาตนเอง</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* สำหรับนักเรียน */}
          <TabsContent value="student" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  คู่มือสำหรับนักเรียน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">การทดสอบสมรรถภาพ 5 ประเภท</h3>
                    <div className="space-y-3">
                      <div className="border-l-4 border-blue-500 pl-3">
                        <h4 className="font-medium">1. BMI (ดัชนีมวลกาย)</h4>
                        <p className="text-sm text-muted-foreground">วัดน้ำหนักและส่วนสูง ระบบจะคำนวณให้อัตโนมัติ</p>
                      </div>
                      
                      <div className="border-l-4 border-green-500 pl-3">
                        <h4 className="font-medium">2. Sit & Reach (ความยืดหยุ่น)</h4>
                        <p className="text-sm text-muted-foreground">นั่งเหยียดขา โน้มตัวไปข้างหน้าวัดระยะที่เอื้อมได้</p>
                      </div>
                      
                      <div className="border-l-4 border-orange-500 pl-3">
                        <h4 className="font-medium">3. Hand Grip (แรงบีบมือ)</h4>
                        <p className="text-sm text-muted-foreground">บีบเครื่องวัดแรงด้วยมือทั้งสองข้าง</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-3">
                        <h4 className="font-medium">4. Chair Stand (ความอดทนกล้ามเนื้อ)</h4>
                        <p className="text-sm text-muted-foreground">ลุกนั่งจากเก้าอี้ 30 วินาที นับจำนวนครั้ง</p>
                      </div>
                      
                      <div className="border-l-4 border-purple-500 pl-3">
                        <h4 className="font-medium">5. Step Up (ความอดทนหัวใจ)</h4>
                        <p className="text-sm text-muted-foreground">ขึ้นลงบันได 3 นาที นับจำนวนครั้ง</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">การวัดสัดส่วนร่างกาย</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      วัด 2 ครั้ง: ก่อนเรียนและหลังเรียน เพื่อเปรียบเทียบการเปลี่ยนแปลง
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>ต้องวัดก่อนเรียนก่อน จึงจะวัดหลังเรียนได้</li>
                      <li>วัดในช่วงเวลาเดียวกันทุกครั้ง</li>
                      <li>ขอให้เพื่อนหรือครูช่วยวัดเพื่อความแม่นยำ</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* สำหรับนักกีฬา */}
          <TabsContent value="athlete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  คู่มือสำหรับนักกีฬา
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                  <p className="font-semibold text-orange-800">🏆 สำหรับนักกีฬา</p>
                  <p className="text-sm text-orange-700 mt-1">
                    นักกีฬาสามารถติดตามผลการฝึกและพัฒนาสมรรถภาพได้แบบเฉพาะทาง
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">ประโยชน์สำหรับนักกีฬา</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>ติดตามผลการพัฒนาตามประเภทกีฬาที่เล่น</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>เปรียบเทียบผลกับนักกีฬาในตำแหน่งเดียวกัน</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>วางแผนการฝึกตามจุดแข็ง-จุดอ่อน</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>บันทึกผลการฝึกประจำวันได้</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">ประเภทกีฬาที่รองรับ</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="border rounded p-2">⚽ ฟุตบอล</div>
                      <div className="border rounded p-2">🏀 บาสเกตบอล</div>
                      <div className="border rounded p-2">🏐 วอลเลย์บอล</div>
                      <div className="border rounded p-2">🏸 แบดมินตัน</div>
                      <div className="border rounded p-2">🎾 เทนนิส</div>
                      <div className="border rounded p-2">🏊 ว่ายน้ำ</div>
                      <div className="border rounded p-2">🏃 กรีฑา</div>
                      <div className="border rounded p-2">➕ อื่นๆ</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* สำหรับครู */}
          <TabsContent value="instructor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  คู่มือสำหรับครูผู้สอน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">การจัดการชั้นเรียน</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">1.</span>
                        <span>สร้างชั้นเรียนใหม่และรับรหัสชั้นเรียน</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">2.</span>
                        <span>แจกรหัสชั้นเรียนให้นักเรียน</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">3.</span>
                        <span>หรือใช้ไฟล์ Excel นำเข้านักเรียนทีเดียว</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">การดูผลการทดสอบ</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>ดูภาพรวมทั้งชั้นเรียนในแดชบอร์ด</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>กรองดูตามระดับผลงาน (ดีเด่น/ต้องพัฒนา)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>เปรียบเทียบผลการทดสอบแต่ละครั้ง</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>ส่งออกรายงานเป็น Excel</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">การจัดการเกณฑ์มาตรฐาน</h3>
                    <p className="text-sm text-muted-foreground">
                      ปรับแต่งเกณฑ์การประเมินให้เหมาะกับอายุและเพศของนักเรียน
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ติดต่อเรา */}
        <Card>
          <CardHeader>
            <CardTitle>📞 ต้องการความช่วยเหลือเพิ่มเติม?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-1">อีเมลติดต่อ</p>
                <p className="text-muted-foreground">admin@wth.ac.th</p>
              </div>
              <div>
                <p className="font-semibold mb-1">เวลาทำการ</p>
                <p className="text-muted-foreground">จันทร์-ศุกร์ 08:00-16:30 น.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

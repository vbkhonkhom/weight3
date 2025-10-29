import { HelpSection, HelpSteps, HelpList, HelpTip, HelpWarning } from "@/components/ui/help-dialog";

export const StudentHelpContent = {
  dashboard: (
    <>
      <HelpSection title="📊 หน้า Dashboard คืออะไร?">
        <p>
          หน้าแรกที่แสดง<strong>สรุปผล</strong>การทดสอบทั้งหมดของคุณ เปรียบเทียบความก้าวหน้าของตัวเอง
        </p>
      </HelpSection>

      <HelpSection title="📖 ข้อมูลที่แสดง">
        <div className="space-y-3">
          <div>
            <strong>BMI ล่าสุด:</strong>
            <p className="text-sm ml-4">ดัชนีมวลกายของคุณจากการทดสอบครั้งล่าสุด</p>
          </div>
          <div>
            <strong>จำนวนการทดสอบ:</strong>
            <p className="text-sm ml-4">กี่ครั้งที่คุณทดสอบแล้วทั้งหมด</p>
          </div>
          <div>
            <strong>การพัฒนา:</strong>
            <p className="text-sm ml-4">เพิ่มหรือลดเท่าไหร่เมื่อเทียบกับครั้งก่อน</p>
            <ul className="text-sm ml-8 mt-2">
              <li>📈 สีเขียว = พัฒนาดีขึ้น</li>
              <li>📉 สีแดง = ลดลง</li>
            </ul>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="📊 กราฟแสดงผล">
        <HelpList items={[
          "เส้นกราฟ: แสดงแนวโน้มการเปลี่ยนแปลงในแต่ละครั้ง",
          "แท่งสี: เปรียบเทียบค่าที่วัดได้ในแต่ละครั้ง",
          "สีต่างกัน: แยกตามประเภทการทดสอบ"
        ]} />
      </HelpSection>

      <HelpSection title="📋 ตารางผลการทดสอบ">
        <p className="mb-2">แสดงรายละเอียดแต่ละครั้งที่ทดสอบ:</p>
        <HelpList items={[
          "วันที่ทดสอบ",
          "ค่าที่วัดได้ (เช่น BMI 22.5)",
          "ผลประเมิน (เช่น ดี, ปกติ, ควรปรับปรุง)"
        ]} />
      </HelpSection>

      <HelpSection title="💡 เคล็ดลับ">
        <HelpList items={[
          "เข้าดู Dashboard ทุกสัปดาห์",
          "ตั้งเป้าหมายที่ชัดเจน (เช่น BMI ต้อง 18.5-24.9)",
          "ถ้าเห็นลดลง → ถามอาจารย์ว่าต้องปรับอะไร"
        ]} />
      </HelpSection>
    </>
  ),

  bmiTest: (
    <>
      <HelpSection title="🎯 BMI คืออะไร?">
        <p>
          <strong>ดัชนีมวลกาย (Body Mass Index)</strong> วัดว่าน้ำหนักของคุณเหมาะสมกับส่วนสูงหรือไม่
        </p>
      </HelpSection>

      <HelpSection title="📖 วิธีบันทึกผล">
        <HelpSteps steps={[
          "ไปหน้า 'ทดสอบ → BMI'",
          "กรอกน้ำหนัก (กิโลกรัม) เช่น 65",
          "กรอกส่วนสูง (เซนติเมตร) เช่น 170",
          "กดปุ่ม 'บันทึกผล'",
          "ระบบจะคำนวณ BMI อัตโนมัติ"
        ]} />
        <HelpTip>
          วัดน้ำหนักและส่วนสูงตอนเช้าก่อนอาหารเพื่อความแม่นยำ
        </HelpTip>
      </HelpSection>

      <HelpSection title="💡 เข้าใจผล BMI">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span><strong>{"< 18.5"}</strong></span>
            <span>ผอม (ควรเพิ่มน้ำหนัก)</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span><strong>18.5-24.9</strong></span>
            <span>ปกติ (ดีมาก! 🎉)</span>
          </div>
          <div className="flex justify-between text-yellow-600">
            <span><strong>25-29.9</strong></span>
            <span>ท้วม (ควรระวัง)</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span><strong>≥ 30</strong></span>
            <span>อ้วน (ควรลดน้ำหนัก)</span>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="🏃 แนะนำ">
        <HelpList items={[
          "BMI สูง → ออกกำลังกายเพิ่ม, กินผักผลไม้มากขึ้น",
          "BMI ต่ำ → กินอาหารครบ 5 หมู่, เพิ่มโปรตีน",
          "ปรึกษาอาจารย์หรือนักกำหนดอาหารถ้าไม่แน่ใจ"
        ]} />
      </HelpSection>
    </>
  ),

  flexibilityTest: (
    <>
      <HelpSection title="🎯 ทดสอบความยืดหยุ่นคืออะไร?">
        <p>
          <strong>นั่งงอตัวไปข้างหน้า (Sit and Reach)</strong> วัดความยืดหยุ่นของกล้ามเนื้อหลังและขา
        </p>
      </HelpSection>

      <HelpSection title="📖 วิธีทำการทดสอบ">
        <HelpSteps steps={[
          "นั่งขาตรงบนพื้น",
          "เท้าชิดกับกล่องวัด",
          "งอตัวไปข้างหน้าช้าๆ เอามือโป้นให้ไกลที่สุด",
          "อ่านค่าที่ปลายนิ้ว (เซนติเมตร)",
          "ทำ 2-3 ครั้ง เลือกครั้งที่ดีที่สุด"
        ]} />
        <HelpWarning>
          อย่าดีดตัวหรือใช้แรงมาก อาจทำให้เกร็ง!
        </HelpWarning>
      </HelpSection>

      <HelpSection title="📱 วิธีบันทึกผล">
        <HelpSteps steps={[
          "ไปหน้า 'ทดสอบ → ความยืดหยุ่น'",
          "กรอกระยะทาง (cm) เช่น 25",
          "กดปุ่ม 'บันทึกผล'"
        ]} />
      </HelpSection>

      <HelpSection title="💪 วิธีพัฒนา">
        <HelpList items={[
          "ยืดเหยียดกล้ามเนื้อทุกวัน 10-15 นาที",
          "โยคะหรือพิลาทิสช่วยเพิ่มความยืดหยุ่น",
          "อบอุ่นร่างกายก่อนทดสอบ",
          "อย่าบังคับตัวเองมากเกินไป"
        ]} />
      </HelpSection>
    </>
  ),

  strengthTest: (
    <>
      <HelpSection title="🎯 ทดสอบแรงบีบมือคืออะไร?">
        <p>
          <strong>แรงบีบมือ (Hand Grip)</strong> วัดความแข็งแรงของกล้ามเนื้อมือและแขน
        </p>
      </HelpSection>

      <HelpSection title="📖 วิธีทำการทดสอบ">
        <HelpSteps steps={[
          "จับเครื่องวัดแรงบีบมือด้วยมือที่ถนัด",
          "ยกแขนตั้งฉากกับตัว",
          "บีบแรงๆ สุดกำลัง (ประมาณ 3-5 วินาที)",
          "อ่านค่าที่แสดง (กิโลกรัม)",
          "ทำ 2-3 ครั้ง เลือกครั้งที่ดีที่สุด"
        ]} />
        <HelpTip>
          พักระหว่างการทดสอบ 1-2 นาที เพื่อกล้ามเนื้อได้พักผ่อน
        </HelpTip>
      </HelpSection>

      <HelpSection title="📱 วิธีบันทึกผล">
        <HelpSteps steps={[
          "ไปหน้า 'ทดสอบ → แรงบีบมือ'",
          "กรอกแรงบีบ (kg) เช่น 35",
          "กรอกน้ำหนักตัว (kg) เช่น 65",
          "กดปุ่ม 'บันทึกผล'",
          "ระบบคำนวณ = แรงบีบ ÷ น้ำหนัก"
        ]} />
      </HelpSection>

      <HelpSection title="💪 วิธีพัฒนา">
        <HelpList items={[
          "ออกกำลังกายด้วยน้ำหนัก (Dumbbell)",
          "บีบลูกบอลยาง 20-30 ครั้ง/วัน",
          "Push-up, Pull-up ช่วยเพิ่มแรง",
          "กินอาหารที่มีโปรตีนสูง"
        ]} />
      </HelpSection>
    </>
  ),

  enduranceTest: (
    <>
      <HelpSection title="🎯 ทดสอบความอดทนคืออะไร?">
        <p>
          ทดสอบ 2 แบบ:
        </p>
        <HelpList items={[
          "ยืน-นั่งบนเก้าอี้ 60 วินาที → วัดแรงและความทนของขา",
          "ยกเข่าขึ้นลง 3 นาที → วัดความอดทนของหัวใจและปอด"
        ]} />
      </HelpSection>

      <HelpSection title="📖 วิธีทำ: ยืน-นั่ง (Chair Stand)">
        <HelpSteps steps={[
          "นั่งบนเก้าอี้ หลังตรง เท้าแนบพื้น",
          "เมื่อได้สัญญาณ → ยืนขึ้นเต็มที่",
          "นั่งลงช้าๆ จนสะโพกแตะเก้าอี้",
          "ยืนขึ้น → นั่งลง ซ้ำไปเรื่อยๆ",
          "นับว่าทำได้กี่ครั้งใน 60 วินาที"
        ]} />
        <HelpWarning>
          อย่าใช้มือช่วยดัน หรือโยนตัว อาจทำให้บาดเจ็บ!
        </HelpWarning>
      </HelpSection>

      <HelpSection title="📖 วิธีทำ: ยกเข่า (Step Test)">
        <HelpSteps steps={[
          "ยืนตรง",
          "ยกเข่าขวาขึ้นให้สูง (90 องศา)",
          "ลงเท้า → ยกเข่าซ้าย",
          "ทำสลับซ้าย-ขวา เป็นจังหวะ",
          "ทำเป็นเวลา 3 นาที",
          "นับว่าทำได้กี่ครั้งทั้งหมด"
        ]} />
        <HelpTip>
          ฟังเพลงจังหวะสม่ำเสมอช่วยให้ทำได้นานขึ้น
        </HelpTip>
      </HelpSection>

      <HelpSection title="📱 วิธีบันทึกผล">
        <HelpSteps steps={[
          "ไปหน้า 'ทดสอบ → ลุกนั่ง' หรือ 'ทดสอบ → ขึ้นบันได'",
          "กรอกจำนวนครั้ง เช่น 28 หรือ 180",
          "กดปุ่ม 'บันทึกผล'"
        ]} />
      </HelpSection>

      <HelpSection title="💪 วิธีพัฒนา">
        <HelpList items={[
          "วิ่ง/เดินเร็ว 20-30 นาที/วัน",
          "ขึ้นบันไดแทนลิฟต์",
          "Squat, Lunges เพิ่มกำลังขา",
          "พักผ่อนให้เพียงพอ"
        ]} />
      </HelpSection>
    </>
  ),

  bodyMeasurements: (
    <>
      <HelpSection title="📏 บันทึกข้อมูลร่างกายคืออะไร?">
        <p>
          บันทึกรอบส่วนต่างๆ ของร่างกาย เช่น รอบแขน รอบขา รอบเอว เพื่อเปรียบเทียบความเปลี่ยนแปลง
        </p>
      </HelpSection>

      <HelpSection title="📖 วิธีใช้งาน">
        <HelpSteps steps={[
          "ไปหน้า 'บันทึกข้อมูลร่างกาย'",
          "เลือกช่วงเวลา:",
          "  • ก่อน: ก่อนเริ่มเทรน/ก่อนเทอม",
          "  • หลัง: หลังเทรน/หลังเทอม",
          "กรอกข้อมูล (เซนติเมตร):",
          "  • น้ำหนัก, ส่วนสูง, ชีพจร",
          "  • รอบคอ, รอบไหล่, รอบแขน",
          "  • รอบอก, รอบหน้าท้อง, รอบเอว",
          "  • รอบสะโพก, รอบขา, รอบน่อง",
          "กด 'บันทึกผล'"
        ]} />
        <HelpTip>
          วัดตอนเช้าก่อนอาหารเพื่อความแม่นยำ
        </HelpTip>
      </HelpSection>

      <HelpSection title="📐 วิธีวัดให้ถูกต้อง">
        <div className="space-y-3">
          <div>
            <strong>รอบแขน:</strong>
            <p className="text-sm ml-4">วัดที่ส่วนหนาที่สุด (กลางต้นแขน) แขนห้อยปกติ</p>
          </div>
          <div>
            <strong>รอบอก:</strong>
            <p className="text-sm ml-4">วัดรอบหน้าอกตรงหัวนม หายใจปกติ</p>
          </div>
          <div>
            <strong>รอบเอว:</strong>
            <p className="text-sm ml-4">วัดรอบเอวที่เล็กที่สุด (เหนือสะดือเล็กน้อย)</p>
          </div>
          <div>
            <strong>รอบสะโพก:</strong>
            <p className="text-sm ml-4">วัดรอบสะโพกตรงส่วนที่โตที่สุด</p>
          </div>
          <div>
            <strong>รอบขา:</strong>
            <p className="text-sm ml-4">วัดที่ต้นขาส่วนหนาที่สุด</p>
          </div>
        </div>
        <HelpWarning>
          ใช้สายวัดที่ไม่ยืด และไม่รัดแน่นหรือหลวมเกินไป
        </HelpWarning>
      </HelpSection>

      <HelpSection title="📊 เปรียบเทียบก่อน-หลัง">
        <HelpSteps steps={[
          "ไปหน้า 'เปรียบเทียบ'",
          "ดูการ์ดแต่ละส่วน:",
          "  • ซ้าย (สีฟ้า) = ข้อมูลก่อน",
          "  • ขวา (สีเขียว) = ข้อมูลหลัง",
          "  • ตรงกลาง = ความแตกต่าง",
          "สัญลักษณ์:",
          "  • 📈 ลูกศรขึ้น (เขียว) = เพิ่มขึ้น",
          "  • 📉 ลูกศรลง (แดง) = ลดลง",
          "  • ➡️ ลูกศรตรง (เทา) = ไม่เปลี่ยน"
        ]} />
      </HelpSection>

      <HelpSection title="💡 เคล็ดลับ">
        <HelpList items={[
          "วัดครั้งแรกก่อนเริ่มเทอม (เป็นข้อมูลตั้งต้น)",
          "วัดครั้งสุดท้ายหลังจบเทอม",
          "วัดในเงื่อนไขเดิมทุกครั้ง (เวลา, สถานที่)",
          "ถ้ามีคนช่วยวัด จะได้ผลแม่นยำกว่า"
        ]} />
      </HelpSection>
    </>
  ),

  comparison: (
    <>
      <HelpSection title="📊 หน้าเปรียบเทียบคืออะไร?">
        <p>
          หน้านี้แสดงผลเปรียบเทียบ<strong>ก่อน-หลัง</strong>เทรนหรือเทอม ให้เห็นความเปลี่ยนแปลงชัดเจน
        </p>
      </HelpSection>

      <HelpSection title="📖 วิธีอ่านการ์ดเปรียบเทียบ">
        <div className="space-y-3">
          <div>
            <strong>ด้านซ้าย (สีฟ้า):</strong>
            <p className="text-sm ml-4">ข้อมูล "ก่อน" (Before) ที่บันทึกไว้</p>
          </div>
          <div>
            <strong>ด้านขวา (สีเขียว):</strong>
            <p className="text-sm ml-4">ข้อมูล "หลัง" (After) ที่บันทึกล่าสุด</p>
          </div>
          <div>
            <strong>ตรงกลาง:</strong>
            <p className="text-sm ml-4">แสดงความแตกต่างและทิศทาง</p>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="🔍 เข้าใจสัญลักษณ์">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <strong className="text-green-600">ลูกศรขึ้น (สีเขียว)</strong>
              <p className="text-sm">เพิ่มขึ้น (ดีสำหรับกล้ามเนื้อ, แรง)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📉</span>
            <div>
              <strong className="text-red-600">ลูกศรลง (สีแดง)</strong>
              <p className="text-sm">ลดลง (ดีสำหรับไขมัน, น้ำหนัก)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">➡️</span>
            <div>
              <strong className="text-gray-600">ลูกศรตรง (สีเทา)</strong>
              <p className="text-sm">ไม่เปลี่ยนแปลง</p>
            </div>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="💡 วิธีใช้ข้อมูล">
        <HelpList items={[
          "น้ำหนักเพิ่ม + รอบกล้ามเนื้อเพิ่ม = เพิ่มมวลกล้ามเนื้อ (ดี! 💪)",
          "น้ำหนักลด + รอบเอวลด = เผาผลาญไขมัน (ดี! 🔥)",
          "น้ำหนักไม่เปลี่ยน แต่รอบกล้ามเนื้อเพิ่ม = เปลี่ยนไขมันเป็นกล้าม (ดีมาก! ⭐)",
          "ถ้าไม่แน่ใจ → ถามอาจารย์"
        ]} />
      </HelpSection>

      <HelpSection title="🎯 เป้าหมายที่ดี">
        <HelpList items={[
          "เพิ่มกล้ามเนื้อ (รอบแขน, รอบขา)",
          "ลดไขมัน (รอบเอว, รอบหน้าท้อง)",
          "รักษา BMI ในช่วง 18.5-24.9",
          "เพิ่มความยืดหยุ่นและความแข็งแรง"
        ]} />
      </HelpSection>
    </>
  ),
};

export default StudentHelpContent;

// สคริปต์สำหรับสร้าง API Key และ Password Pepper
import { randomBytes } from "crypto";

console.log('🔑 สร้าง Keys สำหรับ WTH Fitness App');
console.log('====================================');
console.log('');

const apiKey = randomBytes(32).toString("hex");
const passwordPepper = randomBytes(32).toString("hex");

console.log('📋 ใช้ค่าเหล่านี้ใน Google Apps Script Properties:');
console.log('');
console.log('Key: API_KEY');
console.log('Value:', apiKey);
console.log('');
console.log('Key: PASSWORD_PEPPER'); 
console.log('Value:', passwordPepper);
console.log('');
console.log('📝 และใช้ API_KEY นี้ในไฟล์ .env.local:');
console.log('NEXT_PUBLIC_GAS_API_KEY=' + apiKey);
console.log('');
console.log('⚠️  เก็บค่าเหล่านี้ไว้ให้ปลอดภัย!');
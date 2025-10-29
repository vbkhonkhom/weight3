"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ForgotPasswordDialog } from "@/components/ui/forgot-password-dialog";
import { api } from "@/lib/api";
import { useSession } from "@/providers/session-provider";
import { savePendingRegistration } from "@/lib/pending-registration";

const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร"),
});

type LoginSchema = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  fullName: z.string().min(2, "กรุณากรอกชื่อ-สกุล"),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องไม่น้อยกว่า 8 ตัวอักษร"),
  gender: z.enum(["male", "female"]),
  birthdate: z.string().min(1, "กรุณาเลือกวันเกิด"),
  age: z
    .number()
    .min(10, "อายุต้องไม่น้อยกว่า 10 ปี")
    .max(100, "อายุต้องไม่เกิน 100 ปี"),
  classCode: z.string().min(1, "นักเรียนต้องกรอกรหัสชั้นเรียน"),
});

type RegisterSchema = z.infer<typeof registerSchema>;

export function LoginForm() {
  const router = useRouter();
  const { setSession } = useSession();
  const [error, setError] = useState<string>();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setError(undefined);
    try {
      const session = await api.login(values);
      setSession(session);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถเข้าสู่ระบบได้";
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {error && <Alert message={error} />}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">อีเมล</label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="กรอกอีเมลของคุณ"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-error animate-fadeIn">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">รหัสผ่าน</label>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="กรอกรหัสผ่าน"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-error animate-fadeIn">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="w-full"
          size="lg"
        >
          เข้าสู่ระบบ
        </Button>
        
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowForgotPassword(true)}
            disabled={form.formState.isSubmitting}
          >
            ลืมรหัสผ่าน?
          </Button>
        </div>
      </form>
      
      <ForgotPasswordDialog
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      gender: "female",
      birthdate: "",
      age: undefined,
      classCode: "",
    },
  });

  const onSubmit = async (values: RegisterSchema) => {
    setError(undefined);
    const registrationData = { ...values, role: "student" as const };

    try {
      await api.sendOTP(registrationData.email);
      savePendingRegistration(registrationData);
      router.push(`/verify-otp?email=${encodeURIComponent(registrationData.email)}`);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถส่งรหัส OTP ได้";
      setError(errorMessage);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {error && (
        <div className="sm:col-span-2">
          <Alert message={error} />
        </div>
      )}
      <div className="sm:col-span-2">
        <Alert
          variant="info"
          message="การลงทะเบียนเปิดสำหรับนักเรียนเท่านั้น บัญชีครูผู้สอนให้ผู้ดูแลระบบเพิ่มให้เป็นรายบุคคล"
        />
      </div>
      <div className="sm:col-span-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">ชื่อ-สกุล</label>
          <Input placeholder="กรอกชื่อ-สกุลของคุณ" {...form.register("fullName")} />
          {form.formState.errors.fullName && (
            <p className="text-xs text-error animate-fadeIn">
              {form.formState.errors.fullName.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">อีเมล</label>
          <Input type="email" autoComplete="email" placeholder="กรอกอีเมล" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-error animate-fadeIn">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">รหัสผ่าน</label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-error animate-fadeIn">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">เพศ</label>
          <Select {...form.register("gender")}>
            <option value="female">หญิง</option>
            <option value="male">ชาย</option>
          </Select>
        </div>
      </div>
      <div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">วันเดือนปีเกิด</label>
          <Input type="date" {...form.register("birthdate")} />
          {form.formState.errors.birthdate && (
            <p className="text-xs text-error animate-fadeIn">
              {form.formState.errors.birthdate.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">อายุ (ปี)</label>
          <Input 
            type="number" 
            placeholder="กรอกอายุ" 
            min="10"
            max="100"
            {...form.register("age", { valueAsNumber: true })} 
          />
          {form.formState.errors.age && (
            <p className="text-xs text-error animate-fadeIn">
              {form.formState.errors.age.message}
            </p>
          )}
        </div>
      </div>
      <div className="sm:col-span-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">
            รหัสชั้นเรียน (Class Code)
          </label>
          <Input
            placeholder="เช่น ABC123"
            {...form.register("classCode")}
            autoComplete="off"
          />
          {form.formState.errors.classCode && (
            <p className="text-xs text-error animate-fadeIn">
              {form.formState.errors.classCode.message as string}
            </p>
          )}
        </div>
      </div>
      <div className="sm:col-span-2">
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="w-full"
          size="lg"
        >
          ลงทะเบียน
        </Button>
      </div>
    </form>
  );
}


"use client";

import { useMemo, useState } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldError,
  type FieldPath,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TestType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useSession } from "@/providers/session-provider";
import { useGlobalLoading } from "@/providers/loading-provider";
import { formatNumber } from "@/lib/utils";
import { lookupManualEvaluation } from "@/lib/manual-standards";

/* -------------------------------------------------
 * Utils
 * ------------------------------------------------- */

const getAgeFromBirthdate = (birthdate?: string | null): number | null => {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/* -------------------------------------------------
 * Validation Schemas (zod)
 * ------------------------------------------------- */

const sharedFields = z.object({
  notes: z
    .string()
    .max(240, "จำกัด 240 ตัวอักษร")
    .optional()
    .or(z.literal("")),
});

const bmiSchema = sharedFields.extend({
  weightKg: z.coerce
    .number({
      message: "กรุณากรอกน้ำหนักตัว",
    })
    .positive("น้ำหนักต้องมากกว่า 0")
    .max(250, "น้ำหนักต้องไม่เกิน 250 กิโลกรัม"),
  heightCm: z.coerce
    .number({
      message: "กรุณากรอกส่วนสูง",
    })
    .positive("ส่วนสูงต้องมากกว่า 0")
    .max(250, "ส่วนสูงต้องไม่เกิน 250 เซนติเมตร"),
});

const sitAndReachSchema = sharedFields.extend({
  value: z.coerce
    .number({
      message: "กรุณากรอกระยะทาง",
    })
    .min(-20, "ค่าต่ำสุด -20 เซนติเมตร")
    .max(60, "ค่าสูงสุด 60 เซนติเมตร"),
});

const handGripSchema = sharedFields.extend({
  value: z.coerce
    .number({
      message: "กรุณากรอกแรงบีบ",
    })
    .positive("แรงบีบต้องมากกว่า 0")
    .max(100, "แรงบีบต้องไม่เกิน 100 กิโลกรัม"),
  weightKg: z.coerce
    .number({
      message: "กรุณากรอกน้ำหนักตัว",
    })
    .positive("น้ำหนักต้องมากกว่า 0")
    .max(250, "ต้องไม่เกิน 250 กิโลกรัม"),
});

const chairStandSchema = sharedFields.extend({
  value: z.coerce
    .number({
      message: "กรุณากรอกจำนวนครั้ง",
    })
    .int("ต้องเป็นจำนวนเต็ม")
    .min(0, "ต้องไม่ต่ำกว่า 0")
    .max(100, "ต้องไม่เกิน 100 ครั้ง"),
});

const stepUpSchema = sharedFields.extend({
  value: z.coerce
    .number({
      message: "กรุณากรอกจำนวนครั้ง",
    })
    .int("ต้องเป็นจำนวนเต็ม")
    .min(0, "ต้องไม่ต่ำกว่า 0")
    .max(300, "ต้องไม่เกิน 300 ครั้ง"),
});

/**
 * Map testType -> zod schema
 */
const schemaMap = {
  bmi: bmiSchema,
  sit_and_reach: sitAndReachSchema,
  hand_grip: handGripSchema,
  chair_stand: chairStandSchema,
  step_up: stepUpSchema,
} as const satisfies Record<TestType, z.ZodTypeAny>;

type SchemaMap = typeof schemaMap;
type FormValues<T extends TestType> = z.infer<SchemaMap[T]>;

type FormValuesMap = {
  [K in TestType]: FormValues<K>;
};

/**
 * defaultValuesMap
 *
 * - Runtime: ให้ RHF เริ่ม/รีเซ็ตฟิลด์ด้วย string ว่าง "" เพื่อไม่ให้ React บ่น
 *   เรื่อง controlled/uncontrolled เวลา reset
 * - TypeScript: ฟิลด์ numeric ใน schema เป็น number | undefined,
 *   เลยชนกับ "" (string)
 *
 * เราแก้โดยทำให้ defaultValuesMap เป็น generic loose object ก่อน
 * (Record<string, any>) แล้วค่อย cast ตอนใช้งานจริง
 */
const defaultValuesMap = {
  bmi: {
    weightKg: "",
    heightCm: "",
    notes: "",
  },
  sit_and_reach: {
    value: "",
    notes: "",
  },
  hand_grip: {
    value: "",
    weightKg: "",
    notes: "",
  },
  chair_stand: {
    value: "",
    notes: "",
  },
  step_up: {
    value: "",
    notes: "",
  },
} as const satisfies Record<TestType, Record<string, any>>;

/* -------------------------------------------------
 * Component
 * ------------------------------------------------- */

interface TestFormProps<T extends TestType> {
  testType: T;
  onRecorded?: () => void;
}

export function TestForm<T extends TestType>({
  testType,
  onRecorded,
}: TestFormProps<T>) {
  const { session } = useSession();
  const userAge = useMemo(
    () => getAgeFromBirthdate(session?.user?.birthdate ?? null),
    [session?.user?.birthdate],
  );

  const { showLoading, hideLoading } = useGlobalLoading();

  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  // schema & defaultValues ของ testType ปัจจุบัน
  const schema = schemaMap[testType] as SchemaMap[T];

  const form = useForm<FormValues<T>>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues<T>>,
    defaultValues: defaultValuesMap[testType] as DefaultValues<FormValues<T>>,
  });

  const errors = form.formState.errors as Record<
    string,
    FieldError | undefined
  >;

  /* -------------------------------------------------
   * Preview แบบ realtime (BMI, grip ratio)
   * ------------------------------------------------- */
  const preview = useMemo(() => {
    const values = form.watch();

    // BMI preview
    if (testType === "bmi" && "weightKg" in values && "heightCm" in values) {
      const hCm = Number(values.heightCm);
      const wKg = Number(values.weightKg);
      const hM = hCm / 100;
      if (hM > 0 && wKg > 0) {
        const bmi = wKg / (hM * hM);
        if (Number.isFinite(bmi)) {
          return `ค่าดัชนีมวลกายประมาณ ${formatNumber(bmi)}`;
        }
      }
    }

    // hand_grip ratio preview
    if (
      testType === "hand_grip" &&
      "value" in values &&
      "weightKg" in values
    ) {
      const grip = Number(values.value);
      const wKg = Number(values.weightKg);
      if (wKg > 0 && grip > 0) {
        const ratio = grip / wKg;
        if (Number.isFinite(ratio)) {
          return `ค่าแรงบีบต่อน้ำหนักตัวประมาณ ${formatNumber(ratio)}`;
        }
      }
    }

    return undefined;
  }, [form, testType]);

  /* -------------------------------------------------
   * คำนวณผลประเมิน (ตาม role / gender / age)
   * ------------------------------------------------- */
  const evaluation = useMemo(() => {
    if (!session?.user?.gender || userAge === null) return null;

    const values = form.watch();
    let value: number | null = null;

    switch (testType) {
      case "bmi": {
        const wKg = Number(
          "weightKg" in values ? values.weightKg : undefined,
        );
        const hCm = Number(
          "heightCm" in values ? values.heightCm : undefined,
        );
        const hM = hCm / 100;
        if (wKg > 0 && hM > 0) {
          const bmi = wKg / (hM * hM);
          if (Number.isFinite(bmi)) value = bmi;
        }
        break;
      }
      case "hand_grip": {
        const grip = Number("value" in values ? values.value : undefined);
        const wKg = Number(
          "weightKg" in values ? values.weightKg : undefined,
        );
        if (grip > 0 && wKg > 0) {
          const ratio = grip / wKg;
          if (Number.isFinite(ratio)) value = ratio;
        }
        break;
      }
      default: {
        const v = Number("value" in values ? values.value : undefined);
        if (Number.isFinite(v)) value = v;
        break;
      }
    }

    return lookupManualEvaluation({
      testType,
      gender: session.user.gender,
      age: userAge,
      value,
      role: session.user.role,
    });
  }, [form, testType, session?.user?.gender, session?.user?.role, userAge]);

  /* -------------------------------------------------
   * Submit handler
   * ------------------------------------------------- */
  const handleSubmit = async (values: FormValues<T>) => {
    if (!session?.token) {
      setErrorMessage("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล");
      return;
    }
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const payload = createPayload(testType, values);
      showLoading("กำลังบันทึกผลการทดสอบ...");

      await api.recordTest(session.token, payload);

      setSuccessMessage("บันทึกผลล่าสุดเรียบร้อยแล้ว");

      // รีเซ็ตฟอร์มกลับไปค่าเริ่มต้น (cast อีกครั้งกัน TS ดราม่า)
      form.reset(
        defaultValuesMap[testType] as DefaultValues<FormValues<T>>,
      );

      onRecorded?.();
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "ไม่สามารถบันทึกผลการทดสอบได้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      hideLoading();
    }
  };

  /* -------------------------------------------------
   * Render
   * ------------------------------------------------- */

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex flex-col gap-4"
    >
      {successMessage && (
        <Alert variant="info" message={successMessage} className="text-sm" />
      )}

      {errorMessage && <Alert message={errorMessage} />}

      {renderFields(testType, form)}

      <div>
        <label className="mb-1 block text-sm font-medium">
          หมายเหตุ (ถ้ามี)
        </label>
        <Textarea
          rows={3}
          {...form.register("notes" as FieldPath<FormValues<T>>)}
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-rose-500">
            {errors.notes?.message as string}
          </p>
        )}
      </div>

      {preview && <p className="text-xs text-muted">{preview}</p>}

      {evaluation && (
        <div className="mt-2 text-sm">
          <span className="font-semibold text-primary">ผลประเมิน:</span>
          <span className="ml-2 text-accent">{evaluation}</span>
        </div>
      )}

      <Button
        type="submit"
        loading={form.formState.isSubmitting}
        className="self-start"
      >
        บันทึกผลรายการนี้
      </Button>
    </form>
  );
}

/* -------------------------------------------------
 * Field renderer per testType
 * ------------------------------------------------- */

function renderFields<T extends TestType>(
  testType: T,
  form: UseFormReturn<FormValues<T>>,
) {
  const errors = form.formState.errors as Record<
    string,
    FieldError | undefined
  >;

  switch (testType) {
    case "bmi":
      return (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">
              น้ำหนัก (กิโลกรัม)
            </label>
            <Input
              inputMode="decimal"
              step="0.1"
              {...form.register("weightKg" as FieldPath<FormValues<T>>)}
            />
            {errors.weightKg && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.weightKg?.message as string}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              ส่วนสูง (เซนติเมตร)
            </label>
            <Input
              inputMode="decimal"
              step="0.1"
              {...form.register("heightCm" as FieldPath<FormValues<T>>)}
            />
            {errors.heightCm && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.heightCm?.message as string}
              </p>
            )}
          </div>
        </>
      );

    case "sit_and_reach":
      return (
        <div>
          <label className="mb-1 block text-sm font-medium">
            ระยะทาง (เซนติเมตร)
          </label>
          <Input
            inputMode="decimal"
            step="0.1"
            {...form.register("value" as FieldPath<FormValues<T>>)}
          />
          {errors.value && (
            <p className="mt-1 text-xs text-rose-500">
              {errors.value?.message as string}
            </p>
          )}
        </div>
      );

    case "hand_grip":
      return (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">
              แรงบีบมือ (กิโลกรัม)
            </label>
            <Input
              inputMode="decimal"
              step="0.1"
              {...form.register("value" as FieldPath<FormValues<T>>)}
            />
            {errors.value && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.value?.message as string}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              น้ำหนักตัว (กิโลกรัม)
            </label>
            <Input
              inputMode="decimal"
              step="0.1"
              {...form.register("weightKg" as FieldPath<FormValues<T>>)}
            />
            {errors.weightKg && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.weightKg?.message as string}
              </p>
            )}
          </div>
        </>
      );

    case "chair_stand":
      return (
        <div>
          <label className="mb-1 block text-sm font-medium">
            จำนวนครั้งใน 60 วินาที
          </label>
          <Input
            inputMode="numeric"
            {...form.register("value" as FieldPath<FormValues<T>>)}
          />
          {errors.value && (
            <p className="mt-1 text-xs text-rose-500">
              {errors.value?.message as string}
            </p>
          )}
        </div>
      );

    case "step_up":
      return (
        <div>
          <label className="mb-1 block text-sm font-medium">
            จำนวนครั้งใน 3 นาที
          </label>
          <Input
            inputMode="numeric"
            {...form.register("value" as FieldPath<FormValues<T>>)}
          />
          {errors.value && (
            <p className="mt-1 text-xs text-rose-500">
              {errors.value?.message as string}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

/* -------------------------------------------------
 * Payload builder (ส่งเข้า API)
 * ------------------------------------------------- */

function createPayload<T extends TestType>(
  testType: T,
  values: FormValues<T>,
) {
  switch (testType) {
    case "bmi": {
      const bmiValues = values as FormValuesMap["bmi"];
      const weightKgNum = Number(bmiValues.weightKg);
      const heightM = Number(bmiValues.heightCm) / 100;

      let bmiNumber = 0;
      if (heightM > 0 && weightKgNum > 0) {
        const raw = weightKgNum / (heightM * heightM);
        bmiNumber = Number(raw.toFixed(2));
      }

      return {
        testType,
        value: bmiNumber,
        weightKg: weightKgNum,
        heightM,
        notes: bmiValues.notes,
      };
    }

    case "hand_grip": {
      const gripValues = values as FormValuesMap["hand_grip"];
      return {
        testType,
        value: Number(gripValues.value),
        weightKg: Number(gripValues.weightKg),
        notes: gripValues.notes,
      };
    }

    default: {
      const simpleValues = values as
        | FormValuesMap["chair_stand"]
        | FormValuesMap["sit_and_reach"]
        | FormValuesMap["step_up"];
      return {
        testType,
        value: Number(simpleValues.value),
        notes: simpleValues.notes,
      };
    }
  }
}

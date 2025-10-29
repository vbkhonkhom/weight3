"use client";

export const PENDING_REGISTRATION_KEY = "wthFitness.pendingRegistration";

export interface PendingRegistrationData {
  role: "student";
  fullName: string;
  email: string;
  password: string;
  gender: "male" | "female";
  birthdate: string;
  age: number;
  classCode?: string;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function savePendingRegistration(data: PendingRegistrationData) {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to store pending registration", error);
  }
}

export function loadPendingRegistration(): PendingRegistrationData | null {
  if (!isBrowser()) return null;
  const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingRegistrationData> & {
      role?: string;
    };
    if (!parsed?.email) return null;
    if (parsed.role !== "student") return null;
    return {
      ...parsed,
      role: "student",
    } as PendingRegistrationData;
  } catch (error) {
    console.error("Failed to parse pending registration", error);
    return null;
  }
}

export function clearPendingRegistration() {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
  } catch (error) {
    console.error("Failed to clear pending registration", error);
  }
}

import { STORAGE_KEYS } from "./constants";
import type { SessionPayload } from "./types";

export function loadSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionPayload;
    return session;
  } catch (error) {
    console.warn("Unable to parse stored session", error);
    return null;
  }
}

export function saveSession(session: SessionPayload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.SESSION);
}

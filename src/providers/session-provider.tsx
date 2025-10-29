"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearSession, loadSession, saveSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/types";

interface SessionContextValue {
  session: SessionPayload | null;
  isRestoring: boolean;
  setSession: (payload: SessionPayload) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<SessionPayload | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const restored = loadSession();
    if (restored) {
      setSessionState(restored);
    }
    setIsRestoring(false);
  }, []);

  const setSession = useCallback((payload: SessionPayload) => {
    setSessionState(payload);
    saveSession(payload);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      setSession,
      logout,
      isRestoring,
    }),
    [session, setSession, logout, isRestoring],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return ctx;
}

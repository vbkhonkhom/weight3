"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface LoadingState {
  isOpen: boolean;
  message?: string;
}

interface LoadingContextValue {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(callback: () => Promise<T>, message?: string) => Promise<T>;
}

const LoadingOverlayContext = createContext<LoadingContextValue | undefined>(
  undefined,
);

export function LoadingOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<LoadingState>({ isOpen: false });

  const showLoading = useCallback((message?: string) => {
    setState({ isOpen: true, message });
  }, []);

  const hideLoading = useCallback(() => {
    setState({ isOpen: false });
  }, []);

  const withLoading = useCallback(
    async <T,>(callback: () => Promise<T>, message?: string): Promise<T> => {
      showLoading(message);
      try {
        return await callback();
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading],
  );

  const value = useMemo(
    () => ({ showLoading, hideLoading, withLoading }),
    [showLoading, hideLoading, withLoading],
  );

  return (
    <LoadingOverlayContext.Provider value={value}>
      {children}
      {state.isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={state.message || "กำลังโหลด"}
        >
          <div className="mx-4 max-w-sm rounded-2xl border border-gray-200/60 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-gray-900">
            <div className="flex flex-col items-center gap-5">
              <div className="relative" aria-hidden>
                <div className="h-16 w-16 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <span className="sr-only">Loading</span>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {state.message || "กำลังโหลด..."}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  กรุณารอสักครู่ อย่ากดออกหรือรีเฟรชหน้า
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full w-3/4 animate-pulse rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 dark:from-blue-500 dark:via-blue-600 dark:to-blue-700" />
              </div>
            </div>
          </div>
        </div>
      )}
    </LoadingOverlayContext.Provider>
  );
}

export function useGlobalLoading(): LoadingContextValue {
  const ctx = useContext(LoadingOverlayContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within LoadingOverlayProvider");
  }
  return ctx;
}

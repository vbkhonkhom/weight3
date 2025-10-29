"use client";

import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import { useSession } from "@/providers/session-provider";
import { useToast } from "@/providers/toast-provider";

/**
 * useApiSWR wraps SWR with token injection and default error-toasts.
 *
 * Usage:
 * const { data, error, isLoading } = useApiSWR(
 *   "student-dashboard",
 *   (token) => api.getStudentDashboard(token)
 * );
 */
export function useApiSWR<Data = unknown, Error = any>(
  key: string,
  fetcher: (token: string) => Promise<Data>,
  options?: SWRConfiguration<Data, Error>
): SWRResponse<Data, Error> & { isLoading: boolean } {
  const { session } = useSession();
  const token = session?.token;
  const { error: showErrorToast } = useToast();

  const swr = useSWR<Data, Error>(
    token ? [key, token] : null,
    async ([, t]: [string, string]) => fetcher(t),
    {
      revalidateOnFocus: true,
      shouldRetryOnError: true,
      onError: (err) => {
        try {
          const message = (err as any)?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล";
          showErrorToast(message);
        } catch {
          // no-op
        }
      },
      ...options,
    }
  );

  return { ...swr, isLoading: (swr as any).isLoading ?? (!swr.data && !swr.error) } as any;
}

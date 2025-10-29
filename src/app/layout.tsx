import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/providers/session-provider";
import { LoadingOverlayProvider } from "@/providers/loading-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { TokenExpiredProvider } from "@/providers/token-expired-provider";
import { MaintenanceProvider } from "@/providers/maintenance-provider";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "WTH Fitness App",
  description:
    "ระบบบันทึกและประเมินผลสมรรถภาพทางกายตามเกณฑ์กรมพลศึกษา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" data-theme="light" suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "bg-surface text-primary antialiased",
        )}
      >
        <ThemeProvider>
          <ToastProvider>
            <MaintenanceProvider>
              <SessionProvider>
                <LoadingOverlayProvider>
                  <TokenExpiredProvider>
                    {children}
                  </TokenExpiredProvider>
                </LoadingOverlayProvider>
              </SessionProvider>
            </MaintenanceProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

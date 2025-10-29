"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setTokenExpiredHandler, clearTokenExpiredHandler } from "@/lib/api";
import { TokenExpiredDialog } from "@/components/ui/token-expired-dialog";

export function TokenExpiredProvider({ children }: { children: React.ReactNode }) {
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Set up global handler when component mounts
    const handleTokenExpired = () => {
      setShowDialog(true);
    };

    setTokenExpiredHandler(handleTokenExpired);

    return () => {
      clearTokenExpiredHandler();
    };
  }, []);

  const handleRedirect = () => {
    setShowDialog(false);
    router.push("/");
  };

  return (
    <>
      {children}
      <TokenExpiredDialog 
        isOpen={showDialog} 
        onRedirect={handleRedirect}
      />
    </>
  );
}
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import MaintenancePage from '@/components/maintenance/maintenance-page';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  isChecking: boolean;
  refetch: () => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function useMaintenanceMode() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenanceMode must be used within a MaintenanceProvider');
  }
  return context;
}

interface MaintenanceProviderProps {
  children: React.ReactNode;
}

export function MaintenanceProvider({ children }: MaintenanceProviderProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const checkMaintenanceMode = React.useCallback(async () => {
    const now = Date.now();
    
    // ป้องกันการเรียกบ่อยเกินไป (ขั้นต่ำ 5 วินาที)
    if (now - lastCheck < 5000) {
      return;
    }
    
    setLastCheck(now);
    
    try {
      const response = await fetch('/api/gas?action=ping', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      if (response.status === 503 && data.error_code === 'maintenance_mode') {
        setIsMaintenanceMode(true);
        setMaintenanceMessage(data.message || 'ระบบอยู่ระหว่างการบำรุงรักษา');
      } else if (response.ok) {
        setIsMaintenanceMode(false);
        setMaintenanceMessage('');
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      
      // หากไม่สามารถเชื่อมต่อได้ อาจจะเป็น maintenance mode
      // แต่ให้รออีกครั้งก่อนตัดสินใจ
      if (!isMaintenanceMode) {
        setTimeout(() => {
          checkMaintenanceMode();
        }, 5000);
      }
    } finally {
      setIsChecking(false);
    }
  }, [isMaintenanceMode, lastCheck]);

  const refetch = React.useCallback(() => {
    setIsChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, []);

  useEffect(() => {
    // ตรวจสอบครั้งแรก
    checkMaintenanceMode();

    // ตรวจสอบทุก 30 วินาที
    const interval = setInterval(checkMaintenanceMode, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [checkMaintenanceMode]);

  // หากอยู่ในโหมดบำรุงรักษา แสดงหน้า Maintenance
  if (isMaintenanceMode) {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  // หากยังตรวจสอบอยู่ แสดง Loading
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const contextValue: MaintenanceContextType = {
    isMaintenanceMode,
    maintenanceMessage,
    isChecking,
    refetch
  };

  return (
    <MaintenanceContext.Provider value={contextValue}>
      {children}
    </MaintenanceContext.Provider>
  );
}
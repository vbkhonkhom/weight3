import React from 'react';
import { AlertTriangle, Clock, Settings } from 'lucide-react';

interface MaintenancePageProps {
  message?: string;
  estimatedTime?: string;
}

export default function MaintenancePage({ 
  message = "ระบบอยู่ระหว่างการบำรุงรักษา กรุณาลองใหม่อีกครั้งในภายหลัง", 
  estimatedTime 
}: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <Settings className="w-10 h-10 text-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute -top-1 -right-1">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          🔧 ระบบอยู่ระหว่างบำรุงรักษา
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Estimated Time */}
        {estimatedTime && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Clock className="w-4 h-4" />
            <span>ประมาณเวลา: {estimatedTime}</span>
          </div>
        )}

        {/* Loading Animation */}
        <div className="mb-6">
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          🔄 ลองใหม่อีกครั้ง
        </button>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>เคล็ดลับ:</strong> หน้าเว็บจะอัพเดทอัตโนมัติเมื่อระบบพร้อมใช้งาน
          </p>
        </div>

        {/* Contact Info */}
        <p className="text-xs text-gray-400 mt-4">
          หากมีปัญหาเร่งด่วน กรุณาติดต่อผู้ดูแลระบบ
        </p>
      </div>
    </div>
  );
}

// Hook สำหรับตรวจสอบ maintenance mode
export function useMaintenanceCheck() {
  const [isMaintenanceMode, setIsMaintenanceMode] = React.useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = React.useState('');
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/gas?action=ping');
        const data = await response.json();
        
        if (response.status === 503 && data.error_code === 'maintenance_mode') {
          setIsMaintenanceMode(true);
          setMaintenanceMessage(data.message || 'ระบบอยู่ระหว่างการบำรุงรักษา');
        } else {
          setIsMaintenanceMode(false);
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
        // หากไม่สามารถเชื่อมต่อได้ อาจจะเป็น maintenance mode
        setIsMaintenanceMode(true);
        setMaintenanceMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsChecking(false);
      }
    };

    checkMaintenanceMode();

    // ตรวจสอบทุก 30 วินาที
    const interval = setInterval(checkMaintenanceMode, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    isMaintenanceMode,
    maintenanceMessage,
    isChecking,
    refetch: () => {
      setIsChecking(true);
      // รอสักครู่แล้ว reload
      setTimeout(() => window.location.reload(), 1000);
    }
  };
}
import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface OfflineBlockerProps {
  isChecking: boolean;
  lastCheckFailed: boolean;
  lastCheckedAt: Date | null;
  onRetry: () => Promise<boolean>;
}

export const OfflineBlocker: React.FC<OfflineBlockerProps> = ({
  isChecking,
  lastCheckFailed,
  lastCheckedAt,
  onRetry,
}) => {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-rose-950/20 border-2 border-rose-200 overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 px-6 py-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg mb-3 animate-pulse">
              <WifiOff className="w-8 h-8 text-white" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/25 border border-white/30 text-rose-100 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
              ออฟไลน์ (Offline Mode)
            </span>

            <h2 id="offline-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ไม่สามารถใช้งานได้ขณะออฟไลน์
            </h2>
            <p className="text-xs sm:text-sm text-rose-100 mt-1 font-medium">
              หอผู้ป่วยผู้สูงอายุ (Aging Ward) • stockMUNAaging
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Main policy explanation */}
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex gap-3 text-rose-950">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed space-y-1">
              <p className="font-semibold text-rose-900">
                ระบบถูกระงับการทำงานเพื่อความถูกต้องของสต็อกเวชภัณฑ์
              </p>
              <p className="text-rose-800">
                ระบบไม่อนุญาตให้ใช้งาน บันทึกเบิก-จ่าย หรือแก้ไขข้อมูลสต็อกใดๆ ขณะไม่มีสัญญาณอินเทอร์เน็ต เพื่อป้องกันความผิดพลาดของยอดสต็อกคงเหลือ การตัดยอดซ้ำซ้อน และเพื่อให้ข้อมูลระหว่างพยาบาลทุกเวรตรงกับฐานข้อมูลกลางเสมอ
              </p>
            </div>
          </div>

          {/* Guidelines checklist */}
          <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              คำแนะนำสำหรับเจ้าหน้าที่:
            </div>
            <ul className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                <span>ตรวจสอบการเชื่อมต่อสัญญาณ Wi-Fi ประจำตึก หรือเปิดอินเทอร์เน็ตบนอุปกรณ์</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                <span>หากเชื่อมต่ออินเทอร์เน็ตแล้ว ให้กดปุ่ม <strong>"ตรวจสอบสัญญาณและเชื่อมต่อใหม่"</strong> ด้านล่าง</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                <span>ระบบจะปลดล็อคและพร้อมใช้งานทันทีที่การเชื่อมต่ออินเทอร์เน็ตกลับมาเป็นปกติ</span>
              </li>
            </ul>
          </div>

          {/* Last check info / error notice */}
          {lastCheckFailed && !isChecking && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <span>⚠️ ยังไม่พบสัญญาณอินเทอร์เน็ต กรุณาลองใหม่อีกครั้ง</span>
              {lastCheckedAt && (
                <span className="text-[11px] text-amber-700">
                  {lastCheckedAt.toLocaleTimeString('th-TH')}
                </span>
              )}
            </div>
          )}

          {/* Action button */}
          <button
            type="button"
            onClick={() => onRetry()}
            disabled={isChecking}
            className={`w-full py-3.5 px-5 rounded-2xl font-bold text-white shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              isChecking
                ? 'bg-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-purple-900/20 active:scale-[0.98]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>
              {isChecking ? 'กำลังตรวจสอบสัญญาณเครือข่าย...' : 'ตรวจสอบสัญญาณและเชื่อมต่อใหม่'}
            </span>
          </button>

          <p className="text-center text-[11px] text-slate-400">
            ระบบตรวจสอบสถานะการเชื่อมต่อใหม่อัตโนมัติทุก 5 วินาที
          </p>
        </div>
      </div>
    </div>
  );
};

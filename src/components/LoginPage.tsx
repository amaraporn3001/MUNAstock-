import React, { useState } from 'react';
import { UserCheck, HeartHandshake, Activity, WifiOff, Calendar, Eye, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  initialUser?: string;
  onLogin: (userName: string) => void;
  onOpenAppointments?: () => void;
  isOnline?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialUser = '',
  onLogin,
  onOpenAppointments,
  isOnline = true,
}) => {
  const [name, setName] = useState(initialUser || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setError('ไม่สามารถเข้าสู่ระบบขณะออฟไลน์ได้ กรุณาเชื่อมต่ออินเทอร์เน็ต');
      return;
    }
    const clean = name.trim();
    if (!clean) {
      setError('กรุณาระบุชื่อผู้บันทึกก่อนเข้าสู่ระบบ');
      return;
    }
    setError('');
    onLogin(clean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf6fe] via-[#f7f2fb] to-[#f2ebf8] flex flex-col justify-between p-4 sm:p-6 selection:bg-purple-200">
      {/* Top hospital header branding */}
      <div className="w-full max-w-md mx-auto pt-4 sm:pt-8 flex items-center justify-center gap-2 text-purple-900">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-400 text-white flex items-center justify-center shadow-xs">
          <Activity className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">
            Aging Ward System
          </span>
          <span className="text-sm font-semibold text-slate-700">หอผู้ป่วยผู้สูงอายุ</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-200/30 border border-purple-100/90 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400 p-6 sm:p-8 text-white text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-3.5 shadow-inner">
              <HeartHandshake className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              เข้าสู่ระบบเวร Aging Ward
            </h1>
            <p className="text-xs sm:text-sm text-purple-100 mt-1.5 font-normal">
              ระบบบันทึกสต็อกของใช้ &amp; หัตถการผู้ป่วย
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
            <div>
              <label
                htmlFor="login-name-input"
                className="block text-sm font-bold text-slate-800 mb-1.5"
              >
                ระบุชื่อผู้ปฏิบัติงาน / ผู้บันทึกข้อมูล <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="เช่น พว. วิภาดา หรือ ผช. สมนึก"
                  className="w-full border-2 border-purple-200/70 rounded-2xl px-4 py-3.5 text-base text-slate-900 bg-white focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100/70 transition placeholder:text-slate-400 font-medium"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-rose-600 text-xs font-semibold mt-2 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              {!isOnline && (
                <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>ระบบไม่อนุญาตให้ใช้งานขณะออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ต</span>
                </div>
              )}
              <button
                type="submit"
                id="btn-login-submit"
                disabled={!isOnline}
                className={`w-full min-h-[48px] py-3.5 px-6 rounded-2xl font-bold text-base shadow-md transition flex items-center justify-center gap-2 ${
                  isOnline
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-400 hover:from-purple-600 hover:to-indigo-500 active:scale-[0.99] text-white shadow-purple-300/30 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                <span>{isOnline ? 'เข้าสู่ระบบบันทึกข้อมูล' : 'ไม่สามารถเข้าสู่ระบบขณะออฟไลน์'}</span>
              </button>
            </div>

            {/* Quick action: View appointments without login (Read-Only) */}
            {onOpenAppointments && (
              <div className="pt-3 border-t border-purple-100/80">
                <button
                  type="button"
                  id="btn-login-view-appointments"
                  onClick={onOpenAppointments}
                  className="w-full py-2.5 px-4 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200/90 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-98"
                >
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>ดูนัดหมาย (Google Calendar) โดยไม่ต้องลงชื่อเข้าใช้</span>
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>โหมดเรียกดูอย่างเดียว (Read-Only) • ไม่สามารถแก้ไขปฏิทินได้</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                🔒 ชื่อที่ระบุจะถูกบันทึกกำกับในประวัติการเบิกของใช้และหัตถการผู้ป่วย เพื่อความถูกต้องและโปร่งใสในการปฏิบัติงาน
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="w-full max-w-md mx-auto pb-4 text-center text-xs text-slate-400">
        หอผู้ป่วยผู้สูงอายุ (Aging Ward) • Mahidol University
      </div>
    </div>
  );
};

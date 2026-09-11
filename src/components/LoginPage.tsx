import React, { useState } from 'react';
import { UserCheck, HeartHandshake, Activity } from 'lucide-react';

interface LoginPageProps {
  initialUser?: string;
  onLogin: (userName: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialUser = '', onLogin }) => {
  const [name, setName] = useState(initialUser || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError('กรุณาระบุชื่อผู้บันทึกก่อนเข้าสู่ระบบ');
      return;
    }
    setError('');
    onLogin(clean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-slate-50 to-purple-100/50 flex flex-col justify-between p-4 sm:p-6 selection:bg-purple-200">
      {/* Top hospital header branding */}
      <div className="w-full max-w-md mx-auto pt-4 sm:pt-8 flex items-center justify-center gap-2 text-purple-900">
        <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-sm">
          <Activity className="w-5 h-5 text-purple-100" />
        </div>
        <div className="text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 block">
            Aging Ward System
          </span>
          <span className="text-sm font-semibold text-slate-700">หอผู้ป่วยผู้สูงอายุ</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-950/5 border border-purple-100/90 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 p-6 sm:p-8 text-white text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-3.5 shadow-inner">
              <HeartHandshake className="w-9 h-9 text-purple-100" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              เข้าสู่ระบบเวร Aging Ward
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 mt-1.5">
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
                  className="w-full border-2 border-purple-200/80 rounded-2xl px-4 py-3.5 text-base text-slate-900 bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition placeholder:text-slate-400 font-medium"
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
              <button
                type="submit"
                id="btn-login-submit"
                className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-purple-700/20 transition flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5" />
                <span>เข้าสู่ระบบบันทึกข้อมูล</span>
              </button>
            </div>

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

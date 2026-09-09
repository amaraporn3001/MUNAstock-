import React, { useState } from 'react';
import { UserCheck, Shield, Sparkles, HeartHandshake } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  currentUser: string;
  onLogin: (username: string) => void;
  onClose?: () => void;
}

const PRESET_USERS = [
  'พว. สมหญิง',
  'พว. รัตนา',
  'ผช. วรพงษ์',
  'พว. สุภาพร',
  'พว. ประจำเวรเช้า',
  'พว. ประจำเวรบ่าย',
  'พว. ประจำเวรดึก'
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentUser,
  onLogin,
  onClose,
}) => {
  const [username, setUsername] = useState(currentUser || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim();
    if (!clean) {
      setError('กรุณาระบุชื่อผู้บันทึกข้อมูล');
      return;
    }
    setError('');
    onLogin(clean);
  };

  const handleSelectPreset = (name: string) => {
    setUsername(name);
    setError('');
    onLogin(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-purple-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Banner */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
            <HeartHandshake className="w-6 h-6 text-purple-100" />
          </div>
          <h2 className="text-xl font-bold">เข้าสู่ระบบเวร Aging Ward</h2>
          <p className="text-xs text-purple-200 mt-1">
            ระบุชื่อพยาบาลหรือผู้ช่วยเพื่อลงชื่อกำกับในประวัติการเบิกและหัตถการ
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="username-input"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              ชื่อผู้บันทึก / พยาบาลผู้ปฏิบัติงาน <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="เช่น พว. วิภาดา หรือ ผช. สมนึก"
                className="w-full border border-purple-200 rounded-xl px-4 py-3 text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition placeholder:text-slate-400"
                autoFocus
              />
            </div>
            {error && <p className="text-rose-600 text-xs mt-1.5">{error}</p>}
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-xs font-medium text-slate-500 block mb-2">
              เลือกด่วนจากรายชื่อเวรประจำ:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_USERS.map((user) => (
                <button
                  type="button"
                  key={user}
                  onClick={() => handleSelectPreset(user)}
                  className="text-xs px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-100 transition font-medium text-left"
                >
                  {user}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            {currentUser && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition text-sm"
              >
                ยกเลิก
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition text-sm shadow-md shadow-purple-200 flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>ยืนยันเข้าปฏิบัติงาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

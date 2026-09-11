import React from 'react';
import { Package, User, LogOut, Settings, Clock, ClipboardList, BarChart3, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  currentUser: string;
  activeTab: 'record' | 'history' | 'summary';
  onTabChange: (tab: 'record' | 'history' | 'summary') => void;
  onOpenManage: () => void;
  onOpenUserModal: () => void;
  onLogout?: () => void;
  lowStockCount: number;
  borrowedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenManage,
  onOpenUserModal,
  onLogout,
  lowStockCount,
  borrowedCount,
}) => {
  return (
    <header className="bg-white border-b border-purple-200/80 sticky top-0 z-40 shadow-xs backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-700 text-white flex-shrink-0 flex items-center justify-center shadow-md shadow-purple-900/10">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight tracking-tight truncate">
                  Stock ของใช้ &amp; หัตถการผู้ป่วย
                </h1>
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full border border-purple-200/70 whitespace-nowrap">
                  Aging Ward
                </span>
                <span
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded-full border border-emerald-200/80 whitespace-nowrap"
                  title="เชื่อมต่อฐานข้อมูล Firebase Firestore โปรเจกต์ stockMUNAaging แบบเรียลไทม์"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>stockMUNAaging</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                ระบบจัดการคลังของใช้และบันทึกหัตถการผู้ป่วย • หอผู้ป่วยผู้สูงอายุ
              </p>
            </div>
          </div>

          {/* Navigation (Desktop) & User Bar */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {currentUser && (
              <nav className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl gap-1 border border-slate-200/60">
                <button
                  type="button"
                  id="nav-tab-record"
                  onClick={() => onTabChange('record')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'record'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50/80'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>คีย์ข้อมูล</span>
                </button>

                <button
                  type="button"
                  id="nav-tab-history"
                  onClick={() => onTabChange('history')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'history'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50/80'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>ประวัติ</span>
                </button>

                <button
                  type="button"
                  id="nav-tab-summary"
                  onClick={() => onTabChange('summary')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all relative ${
                    activeTab === 'summary'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50/80'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>สรุปยอด</span>
                  {(lowStockCount > 0 || borrowedCount > 0) && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              </nav>
            )}

            {/* Quick Actions & User Pill */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={onOpenManage}
                  title="จัดการข้อมูลของใช้"
                  className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition min-w-[38px] min-h-[38px] flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>

                <div className="flex items-center gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={onOpenUserModal}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 bg-purple-50 hover:bg-purple-100/80 rounded-lg text-xs font-semibold text-purple-900 transition border border-purple-200/60"
                    title="คลิกเพื่อเปลี่ยนชื่อผู้ปฏิบัติงาน"
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-[10px]">
                      {currentUser.slice(0, 1)}
                    </div>
                    <span className="max-w-[85px] sm:max-w-[130px] truncate">{currentUser}</span>
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      title="ออกจากระบบ / สลับผู้ใช้งาน"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenUserModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-800 transition shadow-xs"
              >
                <User className="w-4 h-4" />
                <span>เข้าสู่ระบบเวร</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

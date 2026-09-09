import React from 'react';
import { Package, User, LogOut, Settings, Clock, ClipboardList, BarChart3, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  currentUser: string;
  activeTab: 'record' | 'history' | 'summary';
  onTabChange: (tab: 'record' | 'history' | 'summary') => void;
  onOpenManage: () => void;
  onOpenUserModal: () => void;
  lowStockCount: number;
  borrowedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenManage,
  onOpenUserModal,
  lowStockCount,
  borrowedCount,
}) => {
  return (
    <header className="bg-white border-b border-purple-200/80 sticky top-0 z-40 shadow-xs backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-900/10">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight tracking-tight">
                  Stock ของใช้ &amp; หัตถการรายเตียง
                </h1>
                <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200/70">
                  Aging Ward
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                ระบบจัดการคลังของใช้และบันทึกหัตถการผู้ป่วยรายเตียง • หอผู้ป่วยผู้สูงอายุ
              </p>
            </div>
          </div>

          {/* Navigation & User Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {currentUser && (
              <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl gap-1 border border-slate-200/60">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenManage}
                  title="จัดการรายการของใช้"
                  className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={onOpenUserModal}
                    className="flex items-center gap-2 px-2.5 py-1 bg-purple-50 hover:bg-purple-100/80 rounded-lg text-xs font-semibold text-purple-900 transition border border-purple-200/60"
                    title="คลิกเพื่อเปลี่ยนผู้ใช้งาน"
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-[10px]">
                      {currentUser.slice(0, 1)}
                    </div>
                    <span className="max-w-[120px] truncate">{currentUser}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenUserModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-700 text-white rounded-lg text-sm font-semibold hover:bg-purple-800 transition shadow-xs"
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

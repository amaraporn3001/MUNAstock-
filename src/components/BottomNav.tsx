import React from 'react';
import { ClipboardList, BarChart3, Download, LogOut, Calendar } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'record' | 'summary';
  onTabChange: (tab: 'record' | 'summary') => void;
  onOpenAppointments?: () => void;
  onExportClick?: () => void;
  onLogout?: () => void;
  lowStockCount?: number;
  borrowedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAppointments,
  onExportClick,
  onLogout,
  lowStockCount = 0,
  borrowedCount = 0,
}) => {
  const alertCount = lowStockCount + borrowedCount;

  return (
    <nav
      id="bottom-quick-navigation"
      aria-label="เมนูลัดด้านล่าง"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-[0_-4px_20px_rgba(168,85,247,0.06)]"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
      }}
    >
      <div className="max-w-lg sm:max-w-2xl mx-auto px-1.5 sm:px-3 py-1 flex items-center justify-between gap-1 sm:gap-1.5">
        {/* Tab 1: คีย์ข้อมูล (รวมประวัติไว้ด้านล่าง) */}
        <button
          type="button"
          id="bottom-nav-record"
          onClick={() => {
            onTabChange('record');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 ${
            activeTab === 'record'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-400 text-white shadow-sm shadow-purple-300/30 font-bold'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70 font-medium'
          }`}
        >
          <ClipboardList className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'record' ? 'text-white' : 'text-slate-400'}`} />
          <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap">คีย์ข้อมูล</span>
        </button>

        {/* Tab 2: สรุปยอด */}
        <button
          type="button"
          id="bottom-nav-summary"
          onClick={() => {
            onTabChange('summary');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 relative ${
            activeTab === 'summary'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-400 text-white shadow-sm shadow-purple-300/30 font-bold'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70 font-medium'
          }`}
        >
          <div className="relative">
            <BarChart3 className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'summary' ? 'text-white' : 'text-slate-400'}`} />
            {alertCount > 0 && (
              <span
                title={`มีการแจ้งเตือน ${alertCount} รายการ`}
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"
              />
            )}
          </div>
          <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap">สรุปยอด</span>
          {alertCount > 0 && (
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-bold hidden sm:inline-block ${
                activeTab === 'summary'
                  ? 'bg-white/25 text-white'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {alertCount}
            </span>
          )}
        </button>

        {/* Tab 4: ดูนัดหมาย (เมนูลัด Google Calendar) */}
        {onOpenAppointments && (
          <button
            type="button"
            id="bottom-nav-appointments"
            onClick={onOpenAppointments}
            className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 text-purple-700 hover:text-purple-900 hover:bg-purple-100/70 border border-purple-200/90 font-semibold bg-purple-50/60"
            title="ดูนัดหมาย Google Calendar"
          >
            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-600" />
            <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap">ดูนัดหมาย</span>
          </button>
        )}

        {/* Tab 5: ส่งออก CSV (ปุ่มลัดขอบล่างจอ) */}
        {onExportClick && (
          <button
            type="button"
            id="bottom-nav-export-csv"
            onClick={onExportClick}
            className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 text-emerald-700 hover:bg-emerald-50/80 border border-emerald-200/80 font-semibold bg-emerald-50/40"
            title="ส่งออกรายงานข้อมูลเป็นไฟล์ Excel/CSV"
          >
            <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-700" />
            <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap">ส่งออก CSV</span>
          </button>
        )}

        {/* Tab 5: ออกจากระบบ */}
        {onLogout && (
          <button
            type="button"
            id="bottom-nav-logout"
            onClick={onLogout}
            className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 text-rose-600 hover:text-rose-800 hover:bg-rose-50/90 border border-rose-200/70 font-semibold bg-rose-50/30"
            title="ออกจากระบบ / สลับผู้ใช้งาน"
          >
            <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-600" />
            <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap">ออกจากระบบ</span>
          </button>
        )}
      </div>
    </nav>
  );
};

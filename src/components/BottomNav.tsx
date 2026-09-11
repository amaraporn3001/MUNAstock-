import React from 'react';
import { ClipboardList, Clock, BarChart3, Download, FileSpreadsheet } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'record' | 'history' | 'summary';
  onTabChange: (tab: 'record' | 'history' | 'summary') => void;
  onExportClick?: () => void;
  lowStockCount?: number;
  borrowedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onExportClick,
  lowStockCount = 0,
  borrowedCount = 0,
}) => {
  const alertCount = lowStockCount + borrowedCount;

  return (
    <nav
      id="bottom-quick-navigation"
      aria-label="เมนูลัดด้านล่าง"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
      }}
    >
      <div className="max-w-md sm:max-w-xl mx-auto px-2 sm:px-3 py-1 flex items-center justify-between gap-1 sm:gap-1.5">
        {/* Tab 1: คีย์ข้อมูล */}
        <button
          type="button"
          id="bottom-nav-record"
          onClick={() => {
            onTabChange('record');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 ${
            activeTab === 'record'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25 font-bold'
              : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50 font-medium'
          }`}
        >
          <ClipboardList className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'record' ? 'text-white' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap">คีย์ข้อมูล</span>
        </button>

        {/* Tab 2: ประวัติ */}
        <button
          type="button"
          id="bottom-nav-history"
          onClick={() => {
            onTabChange('history');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 ${
            activeTab === 'history'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25 font-bold'
              : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50 font-medium'
          }`}
        >
          <Clock className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'history' ? 'text-white' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap">ประวัติ</span>
        </button>

        {/* Tab 3: สรุปยอด */}
        <button
          type="button"
          id="bottom-nav-summary"
          onClick={() => {
            onTabChange('summary');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 relative ${
            activeTab === 'summary'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25 font-bold'
              : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50 font-medium'
          }`}
        >
          <div className="relative">
            <BarChart3 className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'summary' ? 'text-white' : 'text-slate-500'}`} />
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
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {alertCount}
            </span>
          )}
        </button>

        {/* Tab 4: ส่งออก CSV (ปุ่มลัดขอบล่างจอ) */}
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
      </div>
    </nav>
  );
};

import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  ExternalLink,
  X,
  Clock,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

interface AppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string; // YYYY-MM-DD
}

export const AppointmentsModal: React.FC<AppointmentsModalProps> = ({
  isOpen,
  onClose,
  defaultDate = '2026-10-07',
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

  if (!isOpen) return null;

  // The primary URL requested by user
  const requestedCalendarUrl = 'https://calendar.google.com/calendar/u/0/r/day/2026/10/7?pli=1';

  // Dynamic URL based on selected date
  const getCustomDateUrl = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        return `https://calendar.google.com/calendar/u/0/r/day/${y}/${m}/${d}?pli=1`;
      }
    } catch {
      // fallback
    }
    return 'https://calendar.google.com/calendar/u/0/r';
  };

  const dynamicUrl = getCustomDateUrl(selectedDate);

  // Format thai date for display
  const formatThaiDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10) + 543;
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const thaiMonths = [
          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${d} ${thaiMonths[m - 1]} ${y}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-purple-100/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 p-4 sm:p-5 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="calendar-modal-title" className="text-base sm:text-lg font-bold leading-tight">
                  ดูนัดหมาย (Google Calendar)
                </h2>
                <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full border border-white/30 text-white">
                  เมนูลัด
                </span>
              </div>
              <p className="text-xs text-purple-100 mt-0.5">
                ตารางนัดตรวจ นัดหมายหัตถการ และกิจกรรมผู้ป่วยหอผู้สูงอายุ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/20 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Main Requested Shortcut Card (7 ต.ค. 2026) */}
          <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white p-4 sm:p-4.5 rounded-2xl border border-purple-200/90 shadow-xs relative overflow-hidden group">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>นัดหมายที่ระบุ: 7 ตุลาคม 2569</span>
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 pt-0.5">
                  ตารางนัดหมายประจำวันที่ 7 ต.ค. 2026
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  เปิดดูนัดหมายผู้ป่วยใน Google Calendar ประจำวันที่ระบุโดยตรง
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-purple-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-purple-700/80 font-medium truncate max-w-[220px] sm:max-w-xs">
                {requestedCalendarUrl}
              </span>

              <a
                href={requestedCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-400/20 transition active:scale-95 shrink-0"
              >
                <span>เปิดดูนัดหมาย</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Date Selector to view any day's calendar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-purple-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>หรือเลือกวันที่ต้องการดูนัดหมาย:</span>
              </label>
              {selectedDate && (
                <span className="text-[11px] font-semibold text-purple-700">
                  {formatThaiDate(selectedDate)}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 border border-purple-200/90 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              />

              <a
                href={dynamicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-purple-300 hover:bg-purple-50 text-purple-700 text-xs sm:text-sm font-semibold transition active:scale-95 shrink-0"
              >
                <span>เปิดวันที่เลือก</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Quick date chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-slate-500 font-medium">ลัดไปที่:</span>
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 rounded-lg text-slate-600 transition"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate('2026-10-07')}
                className="text-[11px] px-2.5 py-1 bg-purple-100/70 border border-purple-200 text-purple-800 rounded-lg font-semibold transition hover:bg-purple-200/60"
              >
                7 ต.ค. 2026 (เป้าหมาย)
              </button>
              <a
                href="https://calendar.google.com/calendar/u/0/r"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 text-purple-600 hover:text-purple-800 rounded-lg transition inline-flex items-center gap-1"
              >
                <span>เปิดหน้าหลัก Calendar</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Ward Notice / Helper tip */}
          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-xs text-purple-900/90 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">คำแนะนำการใช้งาน:</span>
              <span className="text-slate-600 leading-relaxed block text-[11px]">
                เมื่อกดเปิด ระบบจะนำคุณไปยัง Google Calendar ของบัญชีผู้ใช้งานทันที เพื่อให้สามารถตรวจสอบเวลาเข้าตรวจของแพทย์, นัดหมายหัตถการ, หรือนัดตรวจพิเศษของผู้ป่วยในหอผู้สูงอายุได้แบบเรียลไทม์
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-purple-100 bg-slate-50/60 flex items-center justify-between gap-2">
          <a
            href={requestedCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-700 hover:text-purple-900 font-semibold underline underline-offset-2 flex items-center gap-1"
          >
            <span>ลิงก์ตรง 7 ต.ค. 2026</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white text-xs sm:text-sm transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

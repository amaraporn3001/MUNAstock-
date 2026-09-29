import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  ExternalLink,
  X,
  Clock,
  CalendarCheck,
  Lock,
  Eye,
  Info,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string; // YYYY-MM-DD
}

export const AppointmentsModal: React.FC<AppointmentsModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
}) => {
  // Helper to get formatted local date YYYY-MM-DD with day offset
  const getLocalDateString = (offsetDays = 0): string => {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const yesterdayStr = useMemo(() => getLocalDateString(-1), []);
  const todayStr = useMemo(() => getLocalDateString(0), []);
  const tomorrowStr = useMemo(() => getLocalDateString(1), []);

  // Selected date state (defaults to today in real-time if not specified)
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate || todayStr);
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Real-time live clock
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Sync if defaultDate changes and modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(defaultDate || todayStr);
    }
  }, [isOpen, defaultDate, todayStr]);

  if (!isOpen) return null;

  const isYesterday = selectedDate === yesterdayStr;
  const isToday = selectedDate === todayStr;
  const isTomorrow = selectedDate === tomorrowStr;

  // Ward primary calendar ID
  const calendarId = 'agingwardmahidol@gmail.com';

  // Convert YYYY-MM-DD to YYYYMMDD
  const formatDateForEmbed = (dateStr: string) => {
    return dateStr.replace(/-/g, '');
  };

  // Get next day string in YYYYMMDD format for Google Calendar embed single-day range
  const getNextDayEmbedStr = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + 1);
      const nextY = dt.getFullYear();
      const nextM = String(dt.getMonth() + 1).padStart(2, '0');
      const nextD = String(dt.getDate()).padStart(2, '0');
      return `${nextY}${nextM}${nextD}`;
    } catch {
      return formatDateForEmbed(dateStr);
    }
  };

  // Google Calendar Public Embed URL restricted strictly to the single selected date
  const getDailyEmbedUrl = () => {
    const startStr = formatDateForEmbed(selectedDate);
    const endStr = getNextDayEmbedStr(selectedDate);
    // dates format: YYYYMMDD/YYYYMMDD with mode=AGENDA limits view strictly to that 1 day
    return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
      calendarId
    )}&ctz=Asia%2FBangkok&mode=AGENDA&showPrint=0&showTabs=0&showCalendars=0&showTz=0&dates=${startStr}/${endStr}&nocache=${refreshKey}`;
  };

  // Dynamic day URL in Google Calendar (opens specifically in Day View)
  const getDailyCalendarWebUrl = (dateStr: string) => {
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
    return `https://calendar.google.com/calendar/u/0/r?pli=1`;
  };

  const dayWebUrl = getDailyCalendarWebUrl(selectedDate);

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

  // Short Thai date for button badge (e.g. 29 ก.ย.)
  const formatThaiDateShort = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const thaiMonthsShort = [
          'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        return `${d} ${thaiMonthsShort[m - 1]}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(Date.now());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-purple-100/90 overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 p-4 sm:p-5 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="calendar-modal-title" className="text-base sm:text-lg font-bold leading-tight">
                  ดูนัดหมายประจำวัน
                </h2>
                <span className="text-[10px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-full border border-white/30">
                  Google Calendar
                </span>
                <span className="text-[10px] font-bold bg-purple-900/40 text-purple-100 px-2 py-0.5 rounded-full border border-purple-300/30 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-purple-200" />
                  <span>Read-Only ไม่สามารถแก้ไขได้</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-100 mt-0.5">
                <span>แสดงนัดหมายตามปฏิทินแบบเรียลไทม์</span>
                <span className="text-purple-300">•</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-purple-900/30 px-2 py-0.2 rounded-md">
                  <Clock className="w-3 h-3 text-purple-200" />
                  <span>เวลาปัจจุบัน: {currentTime} น.</span>
                </span>
              </div>
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

        {/* Date Scope Controls: ปุ่มลัด เมื่อวาน, วันนี้, พรุ่งนี้ & วันที่เลือก */}
        <div className="bg-purple-50/90 border-b border-purple-100 p-3 sm:px-5 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-purple-600" />
              <span>ปุ่มลัดเลือกวัน:</span>
            </div>

            {/* Quick Scope Buttons: เมื่อวาน, วันนี้, พรุ่งนี้ */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* เมื่อวาน */}
              <button
                type="button"
                id="btn-scope-yesterday"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isYesterday
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-300/40 ring-2 ring-purple-400/50'
                    : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-100/70'
                }`}
                title={`ดูนัดหมายเมื่อวาน (${formatThaiDate(yesterdayStr)})`}
              >
                <span>เมื่อวาน</span>
                <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded-md ${
                  isYesterday ? 'bg-purple-700/80 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {formatThaiDateShort(yesterdayStr)}
                </span>
              </button>

              {/* วันนี้ (เรียลไทม์) */}
              <button
                type="button"
                id="btn-scope-today"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isToday
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-300/40 ring-2 ring-purple-400/50'
                    : 'bg-white text-purple-800 border-2 border-purple-300 hover:bg-purple-100/70 font-extrabold'
                }`}
                title={`ดูนัดหมายวันนี้ (${formatThaiDate(todayStr)})`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isToday ? 'text-amber-300' : 'text-purple-600'}`} />
                <span>วันนี้</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                  isToday ? 'bg-purple-800/80 text-amber-200' : 'bg-purple-100 text-purple-800'
                }`}>
                  {formatThaiDateShort(todayStr)}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="เรียลไทม์" />
              </button>

              {/* พรุ่งนี้ */}
              <button
                type="button"
                id="btn-scope-tomorrow"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isTomorrow
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-300/40 ring-2 ring-purple-400/50'
                    : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-100/70'
                }`}
                title={`ดูนัดหมายพรุ่งนี้ (${formatThaiDate(tomorrowStr)})`}
              >
                <span>พรุ่งนี้</span>
                <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded-md ${
                  isTomorrow ? 'bg-purple-700/80 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {formatThaiDateShort(tomorrowStr)}
                </span>
              </button>
            </div>
          </div>

          {/* Date Picker Input & Live Indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">หรือระบุวันที่:</span>
              <input
                type="date"
                id="input-appointment-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-purple-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 hover:bg-purple-100/60 text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                title="รีเฟรชข้อมูลปฏิทินเรียลไทม์"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
                <span>รีเฟรช</span>
              </button>

              <div className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-xl border border-purple-200/80 shadow-2xs flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>
                  {isToday ? 'วันนี้: ' : isYesterday ? 'เมื่อวาน: ' : isTomorrow ? 'พรุ่งนี้: ' : ''}
                  {formatThaiDate(selectedDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Embedded Google Calendar for this specific day */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-bold flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
                <span>ปฏิทิน Google Calendar ประจำวันที่ {formatThaiDate(selectedDate)}:</span>
              </span>
              <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/70 font-semibold">
                Read-Only
              </span>
            </div>

            <div className="relative w-full h-[420px] sm:h-[480px] rounded-2xl overflow-hidden border border-purple-200 shadow-inner bg-slate-50">
              <iframe
                key={`${selectedDate}-${refreshKey}`}
                title={`Google Calendar - ${selectedDate}`}
                src={getDailyEmbedUrl()}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          {/* Helpful Information Notice */}
          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">คำแนะนำ:</span>
              <span className="text-slate-600 leading-relaxed block text-[11px]">
                ตารางนัดหมายด้านบนเชื่อมโยงกับ Google Calendar แบบเรียลไทม์ ท่านสามารถกดปุ่มลัด <strong>"เมื่อวาน"</strong>, <strong>"วันนี้"</strong> หรือ <strong>"พรุ่งนี้"</strong> เพื่อสลับดูรายการได้ทันที และสามารถกดปุ่ม <strong>"รีเฟรช"</strong> เพื่อดึงข้อมูลอัปเดตล่าสุดได้ตลอดเวลา
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-purple-100 bg-slate-50/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>แสดงเฉพาะวัน: <strong>{formatThaiDate(selectedDate)}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={dayWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-700 hover:text-purple-900 font-bold underline underline-offset-2 flex items-center gap-1"
            >
              <span>เปิด Google Calendar</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white text-xs sm:text-sm transition cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

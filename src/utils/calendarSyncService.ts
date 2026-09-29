// Service to synchronize and retrieve events from the primary Google Calendar feed (agingwardmahidol@gmail.com)

export interface CalendarEventItem {
  id: string;
  title: string;
  patientName?: string;
  appointmentTime: string; // ISO format: YYYY-MM-DDTHH:mm:ss
  isAllDay?: boolean;
  location?: string;
  notes?: string;
}

const STORAGE_KEY = 'aging_ward_calendar_events';
const LAST_SYNC_KEY = 'aging_ward_calendar_last_sync';

// Retrieve cached events from localStorage
export const getCachedCalendarEvents = (): CalendarEventItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[CalendarSync] Failed to read cached events:', e);
  }
  return [];
};

// Retrieve timestamp of last sync
export const getLastCalendarSyncTime = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
};

// Fetch calendar events from server API proxy
export const syncCalendarEventsFromWardLink = async (
  forceRefresh = false
): Promise<{ success: boolean; events: CalendarEventItem[]; error?: string }> => {
  if (typeof window === 'undefined') {
    return { success: false, events: [] };
  }

  try {
    const url = `/api/calendar-events${forceRefresh ? '?refresh=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data && Array.isArray(data.events)) {
      const events: CalendarEventItem[] = data.events;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      localStorage.setItem(LAST_SYNC_KEY, data.lastSync || new Date().toISOString());
      return { success: true, events };
    }
    return { success: false, events: getCachedCalendarEvents(), error: 'Invalid response format' };
  } catch (err: any) {
    console.warn('[CalendarSync] Fetch failed, falling back to cached events:', err);
    return {
      success: false,
      events: getCachedCalendarEvents(),
      error: err?.message || 'Network error',
    };
  }
};

// Get calendar events for a specific date (YYYY-MM-DD) in local time
export const getCalendarEventsForDate = (
  dateStr: string,
  eventsList?: CalendarEventItem[]
): CalendarEventItem[] => {
  const list = eventsList || getCachedCalendarEvents();
  return list.filter((item) => {
    if (!item.appointmentTime) return false;
    try {
      const d = new Date(item.appointmentTime);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}` === dateStr;
    } catch {
      return item.appointmentTime.slice(0, 10) === dateStr;
    }
  });
};

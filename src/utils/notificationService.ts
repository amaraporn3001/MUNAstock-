import { getCachedCalendarEvents } from './calendarSyncService';

// Notification service for 30-minute mobile appointment alerts

export interface AppointmentAlertItem {
  id: string;
  title: string;
  patientName?: string;
  appointmentTime: string; // ISO string or YYYY-MM-DDTHH:mm
  location?: string;
  notes?: string;
}

let swRegistration: ServiceWorkerRegistration | null = null;

// Initialize Service Worker
export const initNotificationServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('[NotificationService] ServiceWorker registration failed:', err);
    return null;
  }
};

// Check if notification is supported on this browser/device
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Get current permission status
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Request notification permission from user
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('aging_ward_notify_30min', 'true');
      await initNotificationServiceWorker();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[NotificationService] Permission request failed:', err);
    return false;
  }
};

// Check if user has enabled 30-min reminder preference
export const is30MinReminderEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('aging_ward_notify_30min') === 'true';
};

// Toggle 30-min reminder preference
export const set30MinReminderEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('aging_ward_notify_30min', enabled ? 'true' : 'false');
};

// Web Audio API Synthesizer - Hospital/Medical Alert Chime
export const playAlertSound = (): void => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Pleasant three-tone hospital chime: 523Hz (C5) -> 659Hz (E5) -> 784Hz (G5)
    const tones = [
      { freq: 523.25, time: 0.0, dur: 0.25 },
      { freq: 659.25, time: 0.2, dur: 0.25 },
      { freq: 783.99, time: 0.4, dur: 0.5 },
    ];

    tones.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  } catch (e) {
    console.warn('[NotificationService] Sound playback error:', e);
  }
};

// Vibrate mobile device
export const vibrateMobile = (): void => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 400]);
    }
  } catch {
    // ignore
  }
};

// Send actual notification to mobile/device
export const sendMobileNotification = async (
  title: string,
  body: string,
  extraOptions?: NotificationOptions
): Promise<boolean> => {
  playAlertSound();
  vibrateMobile();

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions & { vibrate?: number[] } = {
    body,
    vibrate: [300, 150, 300, 150, 400],
    tag: 'aging-ward-appointment-' + Date.now(),
    requireInteraction: true,
    ...extraOptions,
  };

  try {
    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, options);
      return true;
    }

    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return true;
    }

    // Fallback to classic desktop/browser Notification
    new Notification(title, options);
    return true;
  } catch (err) {
    try {
      new Notification(title, options);
      return true;
    } catch (e) {
      console.warn('[NotificationService] Failed to send notification:', e);
      return false;
    }
  }
};

// Trigger test notification immediately to test phone alert & sound
export const sendTestAppointmentNotification = async (): Promise<boolean> => {
  return sendMobileNotification(
    '🔔 ทดสอบการแจ้งเตือน Aging Ward',
    'ระบบแจ้งเตือนในมือถือทำงานปกติ! ระบบจะเตือนอัตโนมัติ 30 นาทีก่อนถึงเวลานัดหมาย'
  );
};

// Check upcoming appointments (including Google Calendar link events) and trigger 30-min alert
export const checkAndTrigger30MinAlerts = (appointments: AppointmentAlertItem[] = []): void => {
  if (!is30MinReminderEnabled()) return;
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const now = Date.now();
  const notifiedMap: Record<string, number> = JSON.parse(
    localStorage.getItem('aging_ward_notified_appointments') || '{}'
  );

  // Pull events synced from the Google Calendar link (agingwardmahidol@gmail.com)
  const calendarLinkEvents = getCachedCalendarEvents().map((ev) => ({
    id: ev.id,
    title: ev.title,
    patientName: ev.patientName,
    appointmentTime: ev.appointmentTime,
    location: ev.location,
    notes: ev.notes,
  }));

  // Combine provided appointments and Google Calendar feed events (avoiding duplicates by id)
  const combinedMap = new Map<string, AppointmentAlertItem>();
  [...calendarLinkEvents, ...appointments].forEach((item) => {
    if (item && item.id) {
      combinedMap.set(item.id, item);
    }
  });

  const allAppointmentsToMonitor = Array.from(combinedMap.values());

  allAppointmentsToMonitor.forEach((item) => {
    try {
      const aptTime = new Date(item.appointmentTime).getTime();
      if (isNaN(aptTime)) return;

      // 30 minutes before appointment (in milliseconds)
      const thirtyMinutesBefore = aptTime - 30 * 60 * 1000;
      // Window: between 30 minutes and 0 minutes before
      const isWithin30MinWindow = now >= thirtyMinutesBefore && now < aptTime;

      // Has not been notified yet (or notified more than 12 hours ago)
      const lastNotified = notifiedMap[item.id] || 0;
      const alreadyNotified = lastNotified > 0 && now - lastNotified < 12 * 60 * 60 * 1000;

      if (isWithin30MinWindow && !alreadyNotified) {
        const timeFormatted = new Date(item.appointmentTime).toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        });

        sendMobileNotification(
          `⏰ เตือนนัดหมายปฏิทินอีก 30 นาที (${timeFormatted} น.)`,
          `รายการ: ${item.title}${item.patientName ? ` | ผู้ป่วย: ${item.patientName}` : ''}${
            item.location ? ` | สถานที่: ${item.location}` : ''
          }`
        );

        notifiedMap[item.id] = now;
        localStorage.setItem('aging_ward_notified_appointments', JSON.stringify(notifiedMap));
      }
    } catch (e) {
      console.warn('[NotificationService] check error:', e);
    }
  });
};

// Generate an .ics calendar file with 30-min native mobile alarm
export const create30MinReminderIcsUrl = (item: AppointmentAlertItem): string => {
  const startDate = new Date(item.appointmentTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hr duration

  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aging Ward System//Appointments//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${item.id}-${Date.now()}@agingward.hospital`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:นัดหมาย: ${item.title}${item.patientName ? ` (${item.patientName})` : ''}`,
    `DESCRIPTION:นัดหมายหอผู้ป่วยผู้สูงอายุ Aging Ward\\n${item.notes || ''}`,
    item.location ? `LOCATION:${item.location}` : '',
    // 30 MINUTE ALARM / NOTIFICATION (Native mobile phone alarm)
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:แจ้งเตือนนัดหมาย Aging Ward (อีก 30 นาที)',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
};

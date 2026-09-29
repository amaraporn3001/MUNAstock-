import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

// Calendar Events Plugin to fetch and parse Google Calendar events for Aging Ward
let cachedCalendarEvents: any[] | null = null;
let lastCalendarFetchTime = 0;

function parseICS(icsText: string) {
  const events: any[] = [];
  const rawEvents = icsText.split('BEGIN:VEVENT');
  for (let i = 1; i < rawEvents.length; i++) {
    const block = rawEvents[i].split('END:VEVENT')[0];
    const uidMatch = block.match(/UID:([^\r\n]+)/);
    const summaryMatch = block.match(/SUMMARY:([^\r\n]+)/);
    const dtstartMatch = block.match(/DTSTART(?:;[^:]+)?:([^\r\n]+)/);
    const dtendMatch = block.match(/DTEND(?:;[^:]+)?:([^\r\n]+)/);
    const locationMatch = block.match(/LOCATION:([^\r\n]+)/);
    const descMatch = block.match(/DESCRIPTION:([^\r\n]+)/);

    if (!summaryMatch || !dtstartMatch) continue;

    const rawStart = dtstartMatch[1].trim();
    let startTimeIso = '';
    let isAllDay = false;

    if (rawStart.length === 8) {
      const y = rawStart.slice(0, 4);
      const m = rawStart.slice(4, 6);
      const d = rawStart.slice(6, 8);
      startTimeIso = `${y}-${m}-${d}T09:00:00+07:00`;
      isAllDay = true;
    } else if (rawStart.endsWith('Z')) {
      const y = parseInt(rawStart.slice(0, 4), 10);
      const m = parseInt(rawStart.slice(4, 6), 10) - 1;
      const d = parseInt(rawStart.slice(6, 8), 10);
      const h = parseInt(rawStart.slice(9, 11), 10);
      const min = parseInt(rawStart.slice(11, 13), 10);
      const s = parseInt(rawStart.slice(13, 15) || '0', 10);
      const dt = new Date(Date.UTC(y, m, d, h, min, s));
      startTimeIso = dt.toISOString();
    } else {
      const y = rawStart.slice(0, 4);
      const m = rawStart.slice(4, 6);
      const d = rawStart.slice(6, 8);
      const h = rawStart.slice(9, 11) || '00';
      const min = rawStart.slice(11, 13) || '00';
      const s = rawStart.slice(13, 15) || '00';
      startTimeIso = `${y}-${m}-${d}T${h}:${min}:${s}+07:00`;
    }

    const title = summaryMatch[1].trim().replace(/\\,/g, ',').replace(/\\n/g, ' ');

    let patientName: string | undefined = undefined;
    const bedMatch = title.match(/^(B\.\s*\d+[^-\s]*|\bเตียง\s*\d+[^-\s]*)\s+([^\-]+)/i);
    if (bedMatch) {
      patientName = `${bedMatch[1].trim()} ${bedMatch[2].trim()}`;
    }

    events.push({
      id: uidMatch ? uidMatch[1].trim() : 'evt-' + i,
      title,
      patientName,
      appointmentTime: startTimeIso,
      isAllDay,
      location: locationMatch ? locationMatch[1].trim().replace(/\\,/g, ',') : undefined,
      notes: descMatch ? descMatch[1].trim().replace(/\\n/g, '\n') : undefined,
    });
  }
  return events;
}

function calendarEventsApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-calendar-events',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/calendar-events')) {
          const urlObj = new URL(req.url, 'http://localhost');
          const forceRefresh = urlObj.searchParams.get('refresh') === 'true';
          const filterDate = urlObj.searchParams.get('date');

          const now = Date.now();
          if (!cachedCalendarEvents || forceRefresh || now - lastCalendarFetchTime > 2 * 60 * 1000) {
            try {
              const resp = await fetch(
                'https://calendar.google.com/calendar/ical/agingwardmahidol%40gmail.com/public/basic.ics',
                { headers: { 'User-Agent': 'AgingWardSystem/1.0' } }
              );
              if (resp.ok) {
                const text = await resp.text();
                cachedCalendarEvents = parseICS(text);
                lastCalendarFetchTime = now;
              }
            } catch (err) {
              console.error('Failed to fetch Google Calendar ics:', err);
            }
          }

          let results = cachedCalendarEvents || [];
          if (filterDate) {
            results = results.filter((ev) => {
              const dt = new Date(ev.appointmentTime);
              const y = dt.getFullYear();
              const m = String(dt.getMonth() + 1).padStart(2, '0');
              const d = String(dt.getDate()).padStart(2, '0');
              return `${y}-${m}-${d}` === filterDate;
            });
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
              success: true,
              count: results.length,
              lastSync: new Date(lastCalendarFetchTime).toISOString(),
              events: results,
            })
          );
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), calendarEventsApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

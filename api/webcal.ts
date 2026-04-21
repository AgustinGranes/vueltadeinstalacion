import { DOMParser } from 'linkedom';

// Polyfill DOMParser for NodeJS environment on Vercel
if (typeof global !== 'undefined' && !(global as any).DOMParser) {
  (global as any).DOMParser = DOMParser;
}

import { dataService } from '../src/data/dataService';

export default async function handler(req: any, res: any) {
  try {
    // 1. Fetch real events from the app using fast mode (skipImages = true)
    const weeklyRaces = await dataService.getWeeklyCalendar(true);
    
    // Normalize into flat schedules
    const flatSchedules = weeklyRaces.flatMap(race =>
      race.schedules.map(s => ({
        ...s,
        category: race.category,
      }))
    );

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Vuelta de Instalacion//Calendario Dinamico//ES",
      "X-PUBLISHED-TTL:PT1H",
      "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
      "METHOD:PUBLISH"
    ];

    const generateICSDatetime = (timestamp: number) => {
      const d = new Date(timestamp);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const generateICSDateOnly = (d: Date) => {
      return d.toISOString().split('T')[0].replace(/-/g, '');
    };

    const escapeICS = (str: string) => {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n');
    };

    const nowStamp = generateICSDatetime(Date.now());
    const allDayAddedCategories = new Set<string>();

    if (flatSchedules.length === 0) {
      // Add a placeholder event so the calendar isn't empty (avoids validation errors)
      icsContent.push(
        "BEGIN:VEVENT",
        `UID:placeholder-no-races@vueltadeinstalacion`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${nowStamp}`,
        `DTEND:${generateICSDatetime(Date.now() + 3600000)}`,
        `SUMMARY:${escapeICS("Sin carreras este fin de semana")}`,
        "END:VEVENT"
      );
    }

    flatSchedules.forEach((sched: any) => {
      const isAllDay = sched.time === '--:--' || !sched.time || sched.time === '';
      
      let startStr = '';
      let endStr = '';
      
      if (isAllDay) {
        if (allDayAddedCategories.has(sched.category)) return;
        allDayAddedCategories.add(sched.category);

        const d = new Date(sched.startAt);
        const day = d.getDay();
        const friday = new Date(d);
        if (day === 0) { friday.setDate(d.getDate() - 2); } 
        else { friday.setDate(d.getDate() - (day - 5)); }
        
        const monday = new Date(friday);
        monday.setDate(friday.getDate() + 3); 
        
        startStr = generateICSDateOnly(friday);
        endStr = generateICSDateOnly(monday); 
      } else {
        startStr = generateICSDatetime(sched.startAt);
        endStr = generateICSDatetime(sched.endAt ? sched.endAt : sched.startAt + 3600000);
      }

      const summary = isAllDay ? `${sched.category} (horario no definido)` : `${sched.category}: ${sched.name}`;
      
      // Clean UID: alphanumeric only, use id if available for total stability
      const eventUid = sched.id ? `event-${sched.id}`.replace(/[^a-zA-Z0-9-]/g, '') : `${sched.startAt}-${sched.category}`.replace(/[^a-zA-Z0-9]/g, '');
      
      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${eventUid}@vueltadeinstalacion`,
        `DTSTAMP:${nowStamp}`
      );
      
      if (isAllDay) {
        icsContent.push(
          `DTSTART;VALUE=DATE:${startStr}`,
          `DTEND;VALUE=DATE:${endStr}`
        );
      } else {
        icsContent.push(
          `DTSTART:${startStr}`,
          `DTEND:${endStr}`
        );
      }
      
      icsContent.push(
        `SUMMARY:${escapeICS(summary)}`,
        "END:VEVENT"
      );
    });

    icsContent.push("END:VCALENDAR");

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="CalendarioDinamico.ics"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600'); 
    
    // Join with CRLF (\r\n)
    res.status(200).send(icsContent.join('\r\n'));
  } catch (error) {
    console.error('WebCal API Error:', error);
    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const errorIcs = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Vuelta de Instalacion//Calendario Dinamico//ES",
        "BEGIN:VEVENT",
        `UID:error-${nowStamp}@vueltadeinstalacion`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${nowStamp}`,
        `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
        `SUMMARY:Error actualizando - El sitio fuente no responde`,
        "END:VEVENT",
        "END:VCALENDAR"
    ];
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.status(200).send(errorIcs.join('\r\n'));
  }
}

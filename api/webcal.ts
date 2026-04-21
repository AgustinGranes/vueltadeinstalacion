import { DOMParser } from 'linkedom';

// Polyfill DOMParser for NodeJS environment on Vercel
if (typeof global !== 'undefined' && !(global as any).DOMParser) {
  (global as any).DOMParser = DOMParser;
}

import { dataService } from '../src/data/dataService';

export default async function handler(req: any, res: any) {
  try {
    const weeklyRaces = await dataService.getWeeklyCalendar();
    
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
      "PRODID:-//Vuelta de Instalacion//Calendario Dinamico//ES"
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
        `UID:placeholder-${nowStamp}@vueltadeinstalacion`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${nowStamp}`,
        `DTEND:${generateICSDatetime(Date.now() + 3600000)}`,
        `SUMMARY:${escapeICS("Vuelta de Instalación: Sin carreras esta semana")}`,
        "END:VEVENT"
      );
    }

    flatSchedules.forEach((sched: any) => {
      const isAllDay = sched.time === '--:--' || !sched.time;
      
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

      const summary = isAllDay ? `${sched.category} (Horarios TBD)` : `${sched.category}: ${sched.name}`;
      // Clean UID: alphanumeric only
      const cleanUid = `${sched.startAt}-${sched.category}`.replace(/[^a-zA-Z0-9]/g, '');
      
      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${cleanUid}-${Math.floor(Math.random()*1000)}@vueltadeinstalacion`,
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600'); 
    
    // Join with CRLF (\r\n)
    res.status(200).send(icsContent.join('\r\n'));
  } catch (error) {
    console.error('WebCal API Error:', error);
    res.status(500).json({ 
      error: 'Error al generar el calendario', 
      message: (error as any).message,
      stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
    });
  }
}

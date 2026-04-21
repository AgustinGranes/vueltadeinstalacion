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

    const allDayAddedCategories = new Set<string>();

    flatSchedules.forEach((sched: any) => {
      const isAllDay = sched.time === '--:--' || !sched.time;
      
      let startStr = '';
      let endStr = '';
      
      if (isAllDay) {
        // Prevent stacking multiple all-day blocks for the same category on the same weekend
        if (allDayAddedCategories.has(sched.category)) return;
        allDayAddedCategories.add(sched.category);

        const d = new Date(sched.startAt);
        const day = d.getDay(); // 0 = Sunday, 5 = Friday
        
        const friday = new Date(d);
        if (day === 0) { 
            friday.setDate(d.getDate() - 2); 
        } else {
            friday.setDate(d.getDate() - (day - 5));
        }
        
        const monday = new Date(friday);
        monday.setDate(friday.getDate() + 3);
        
        startStr = generateICSDateOnly(friday);
        endStr = generateICSDateOnly(monday); 
      } else {
        startStr = generateICSDatetime(sched.startAt);
        const endAt = sched.endAt;
        endStr = generateICSDatetime(endAt ? endAt : sched.startAt + 3600000);
      }

      const summary = isAllDay ? `${sched.category} (Horarios TBD)` : `${sched.category}: ${sched.name}`;
      
      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${sched.startAt}-${sched.category.replace(/\s+/g,'')}@vueltadeinstalacion`,
        `DTSTAMP:${generateICSDatetime(Date.now())}`
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
        `SUMMARY:${summary}`,
        "END:VEVENT"
      );
    });

    icsContent.push("END:VCALENDAR");

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400'); // Cache for 6 hours
    res.status(200).send(icsContent.join('\r\n'));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Fallo al generar el calendario' });
  }
}

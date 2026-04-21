import { DOMParser } from 'linkedom';

// Polyfill DOMParser for NodeJS environment on Vercel
if (typeof global !== 'undefined' && !(global as any).DOMParser) {
  (global as any).DOMParser = DOMParser;
}

export default async function handler(req: any, res: any) {
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
  const icsContent: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vuelta de Instalacion//Calendario Dinamico//ES"
  ];

  try {
    // 1. Fetch direct HTML skipping proxy
    const htmlRes = await fetch('https://vueltarapida.com/calendario', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (!htmlRes.ok) throw new Error('API fetching failed with ' + htmlRes.status);
    
    const htmlText = await htmlRes.text();
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');

    // 2. Parse basic elements
    const flatSchedules: any[] = [];
    const events = Array.from(doc.querySelectorAll('.button-day-item, .rd-calendar-event, .rd-event-item, .event-container'));
    
    // We scrape all present categories to generate generic all-week events if specific times fail
    const currentWeekCategories = new Set<string>();

    events.forEach((el: any) => {
      let title = el.querySelector('.event-title, .title, strong')?.textContent?.trim() || '';
      if (!title) {
         title = el.textContent?.trim().replace(/\s+/g, ' ') || 'Motor Event';
      }
      
      // Determine pseudo-category to tag it
      let category = 'Motorsport';
      if (title.toUpperCase().includes('F1') || title.toUpperCase().includes('FORMULA 1')) category = 'F1';
      else if (title.toUpperCase().includes('TC') || title.toUpperCase().includes('TURISMO CARRETERA')) category = 'TC';
      else if (title.toUpperCase().includes('WEC')) category = 'WEC';
      else if (title.toUpperCase().includes('INDY')) category = 'IndyCar';
      else if (title.toUpperCase().includes('WRC')) category = 'WRC';
      else if (title.toUpperCase().includes('NASCAR')) category = 'NASCAR';
      else category = title.split(' ')[0] || 'Evento';

      currentWeekCategories.add(category);
    });

    // Generate events for the weekend (Friday to Sunday) based on found categories
    const now = new Date();
    const day = now.getDay();
    const friday = new Date(now);
    if (day === 0) { friday.setDate(now.getDate() - 2); } 
    else { friday.setDate(now.getDate() - (day - 5)); }
    
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3); // Sunday night/Monday Morning

    const startStr = generateICSDateOnly(friday);
    const endStr = generateICSDateOnly(monday); 

    currentWeekCategories.forEach((cat) => {
      const summary = `${cat} (Fin de Semana de Carrera)`;
      const cleanUid = `${startStr}-${cat}`.replace(/[^a-zA-Z0-9]/g, '');
      
      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${cleanUid}-${Math.floor(Math.random()*1000)}@vueltadeinstalacion`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${startStr}`,
        `DTEND;VALUE=DATE:${endStr}`,
        `SUMMARY:${escapeICS(summary)}`,
        "END:VEVENT"
      );
    });

    if (currentWeekCategories.size === 0) {
      // No events scraped, fallback to empty warning but 200 OK
      icsContent.push(
        "BEGIN:VEVENT",
        `UID:placeholder-${nowStamp}@vueltadeinstalacion`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${nowStamp}`,
        `DTEND:${generateICSDatetime(Date.now() + 3600000)}`,
        `SUMMARY:${escapeICS("Sin carreras este fin de semana")}`,
        "END:VEVENT"
      );
    }
  } catch (error) {
    console.error('WebCal Direct Scrape Error:', error);
    // Anti-500: Always return a calendar, just insert an error event warning
    icsContent.push(
      "BEGIN:VEVENT",
      `UID:error-${nowStamp}@vueltadeinstalacion`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${nowStamp}`,
      `DTEND:${generateICSDatetime(Date.now() + 3600000)}`,
      `SUMMARY:${escapeICS("Error actualizando - El sitio fuente no responde")}`,
      "END:VEVENT"
    );
  }

  icsContent.push("END:VCALENDAR");

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="CalendarioDinamico.ics"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600'); 
  
  res.status(200).send(icsContent.join('\r\n'));
}

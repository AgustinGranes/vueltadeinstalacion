import { getWeeklyCalendar } from './index.js';

export default async function handler(req: any, res: any) {
  try {
    // --- Parse hidden categories from query ---
    const hiddenQuery = req.query.hidden || '';
    const hiddenCategories = hiddenQuery
      ? hiddenQuery.split(',').map((c: string) => c.trim().toLowerCase())
      : [];

    // --- Fetch unified races from getWeeklyCalendar() ---
    let races: any[] = [];
    try {
      const weeklyData = await getWeeklyCalendar();
      races = Array.isArray(weeklyData?.data) ? weeklyData.data : [];
    } catch (fetchErr) {
      console.error('[webcal] getWeeklyCalendar error:', fetchErr);
    }

    // --- Filter out hidden categories ---
    const filteredRaces = races.filter(race => {
      if (hiddenCategories.length === 0) return true;
      const cat = (race.category || '').toLowerCase();
      const evt = (race.event || '').toLowerCase();
      const short = (race.categoryShort || '').toLowerCase();
      
      for (const hidden of hiddenCategories) {
        if (cat === hidden || cat.includes(hidden) || hidden.includes(cat) || evt.includes(hidden) || short === hidden) {
          return false;
        }
      }
      return true;
    });

    // --- ICS helpers ---
    const toICSDatetime = (ts: number) =>
      new Date(ts).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const toICSDate = (d: Date) =>
      d.toISOString().split('T')[0].replace(/-/g, '');

    const escapeICS = (str: string) =>
      (str || '')
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n');

    const nowStamp = toICSDatetime(Date.now());

    // --- Build ICS ---
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vuelta de Instalacion//Calendario//ES',
      'X-WR-CALNAME:Vuelta de Instalacion - Motorsport',
      'X-WR-CALDESC:Todos los eventos de motorsport de la semana',
      'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
      'X-PUBLISHED-TTL:PT1H',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
      'METHOD:PUBLISH',
      'CALSCALE:GREGORIAN',
    ];

    let flatSchedules: any[] = [];

    for (const race of filteredRaces) {
      const schedules: any[] = race.schedules || [];
      let category = race.category || race.name || 'Motorsport';
      if (category === 'Super Formula Japonesa' || category === 'Super Fórmula Japonesa') category = 'Super Formula';
      if (category === 'World Rally Championship') category = 'WRC';
      if (category === 'Fórmula 4 Brasil' || category === 'Formula 4 Brasil') category = 'F4 Brazil';
      if (category === 'NASCAR México' || category === 'NASCAR Mexico') category = 'NASCAR Mexico';
      if (category === 'Stock Car Brasil') category = 'Stock Car Pro';
      const event: string = (race.completeName || race.name || category)
        .replace(/\s*[–—-]+\s*$/, '').trim();
      const circuit: string = typeof race.circuit === 'string'
        ? race.circuit
        : race.circuit?.name || '';

      for (const sched of schedules) {
        const startTs: number = sched.startAt || sched.start;
        if (!startTs) continue;

        const isConfirmed = sched.confirmed !== false && sched.time !== '--:--' && sched.time !== '';
        if (!isConfirmed) continue;

        const schedName: string = sched.name || sched.title || 'Evento';
        flatSchedules.push({
          category,
          event,
          circuit,
          name: schedName,
          startAt: startTs,
          endAt: sched.endAt || (startTs + 3600000)
        });
      }
    }

    // --- Deduplicate identical schedules (e.g., Carrera 2 vs Race 2 at same time) ---
    const uniqueSchedules: any[] = [];
    for (const sched of flatSchedules) {
      const isDup = uniqueSchedules.some(u => {
        const catMatch = (u.category || '').toLowerCase().trim() === (sched.category || '').toLowerCase().trim();
        const timeDiff = Math.abs(u.startAt - sched.startAt);
        // If same category and within 10 minutes, treat as duplicate
        return catMatch && timeDiff < 600000;
      });
      if (!isDup) uniqueSchedules.push(sched);
    }
    flatSchedules = uniqueSchedules;

    let eventCount = 0;
    for (const sched of flatSchedules) {
      const uid = `${sched.startAt}-${(sched.category + sched.name).replace(/[^a-zA-Z0-9]/g, '')}@vueltadeinstalacion`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${nowStamp}`);

      lines.push(`DTSTART:${toICSDatetime(sched.startAt)}`);
      lines.push(`DTEND:${toICSDatetime(sched.endAt)}`);

      const summary = `${escapeICS(sched.category)}: ${escapeICS(sched.name)}`;
      lines.push(`SUMMARY:${summary}`);

      const descParts = [sched.event, sched.circuit].filter(Boolean).join(' · ');
      if (descParts) lines.push(`DESCRIPTION:${escapeICS(descParts)}`);
      if (sched.circuit) lines.push(`LOCATION:${escapeICS(sched.circuit)}`);

      lines.push('END:VEVENT');
      eventCount++;
    }

    // Placeholder if no events found
    if (eventCount === 0) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:no-events-${from}@vueltadeinstalacion`);
      lines.push(`DTSTAMP:${nowStamp}`);
      lines.push(`DTSTART;VALUE=DATE:${toICSDate(monday)}`);
      lines.push(`DTEND;VALUE=DATE:${toICSDate(monday)}`);
      lines.push('SUMMARY:Sin carreras esta semana');
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="vueltadeinstalacion.ics"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).send(lines.join('\r\n'));

  } catch (error) {
    console.error('[webcal] Fatal error:', error);
    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const errorIcs = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vuelta de Instalacion//Calendario//ES',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:error-${Date.now()}@vueltadeinstalacion`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${nowStamp}`,
      `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
      'SUMMARY:Error al cargar el calendario - intente más tarde',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.status(200).send(errorIcs);
  }
}

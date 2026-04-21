export default async function handler(req: any, res: any) {
  try {
    // --- Date range: current week (Mon) to end of next week (Sun) ---
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ...
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(monday);
    nextSunday.setDate(monday.getDate() + 13); // 2 weeks window
    nextSunday.setHours(23, 59, 59, 999);

    const from = monday.getTime();
    const to = nextSunday.getTime();

    // --- Fetch races from VueltaRapida API directly ---
    let races: any[] = [];
    try {
      const apiUrl = `https://api.vueltarapida.com/api/races?minDate=${from}&maxDate=${to}`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VueltaDeInstalacion/1.0)',
          'Accept': 'application/json',
          'Referer': 'https://vueltarapida.com/',
          'Origin': 'https://vueltarapida.com',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        races = Array.isArray(data) ? data : (data?.races || data?.data || []);
      }
    } catch (fetchErr) {
      console.error('[webcal] VueltaRapida fetch error:', fetchErr);
    }

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

    let eventCount = 0;

    for (const race of races) {
      const schedules: any[] = race.schedules || [];
      const category: string = race.category || race.name || 'Motorsport';
      const event: string = (race.completeName || race.name || category)
        .replace(/\s*[–—-]+\s*$/, '').trim();
      const circuit: string = typeof race.circuit === 'string'
        ? race.circuit
        : race.circuit?.name || '';

      for (const sched of schedules) {
        const startTs: number = sched.startAt || sched.start;
        if (!startTs) continue;

        const isConfirmed = sched.confirmed !== false && sched.time !== '--:--' && sched.time !== '';
        const schedName: string = sched.name || sched.title || 'Evento';
        const uid = `${startTs}-${(category + schedName).replace(/[^a-zA-Z0-9]/g, '')}@vueltadeinstalacion`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${nowStamp}`);

        if (isConfirmed) {
          const endTs = sched.endAt || (startTs + 3600000);
          lines.push(`DTSTART:${toICSDatetime(startTs)}`);
          lines.push(`DTEND:${toICSDatetime(endTs)}`);
        } else {
          // All-day event when time is not confirmed
          const d = new Date(startTs);
          const dayEnd = new Date(d);
          dayEnd.setDate(d.getDate() + 1);
          lines.push(`DTSTART;VALUE=DATE:${toICSDate(d)}`);
          lines.push(`DTEND;VALUE=DATE:${toICSDate(dayEnd)}`);
        }

        const summary = `${escapeICS(category)}: ${escapeICS(schedName)}`;
        lines.push(`SUMMARY:${summary}`);

        const descParts = [event, circuit].filter(Boolean).join(' · ');
        if (descParts) lines.push(`DESCRIPTION:${escapeICS(descParts)}`);
        if (circuit) lines.push(`LOCATION:${escapeICS(circuit)}`);

        lines.push('END:VEVENT');
        eventCount++;
      }
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
    // Always return valid ICS even on error to avoid calendar app crashes
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

export default async function handler(req: any, res: any) {
  try {
    // --- Parse hidden categories from query ---
    const hiddenQuery = req.query.hidden || '';
    const hiddenCategories = hiddenQuery
      ? hiddenQuery.split(',').map((c: string) => c.trim().toLowerCase())
      : [];

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
    let vrRaces: any[] = [];
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
        vrRaces = Array.isArray(data) ? data : (data?.races || data?.data || []);
      }
    } catch (fetchErr) {
      console.error('[webcal] VueltaRapida fetch error:', fetchErr);
    }

    // --- Fetch races from horarios.json ---
    let horariosRaces: any[] = [];
    try {
      const HORARIOS_URL = 'https://raw.githubusercontent.com/AgustinGranes/DataExtractor/main/data/horarios.json';
      const horRes = await fetch(HORARIOS_URL);
      if (horRes.ok) {
        const data = await horRes.json();
        
        const seriesMap: Record<string, any> = {};
        if (Array.isArray(data.series)) {
          for (const s of data.series) {
            if (s.details?.id) seriesMap[s.details.id] = s;
          }
        }

        const events = Array.isArray(data.events) ? data.events : [];
        for (const ev of events) {
          const validSessions = (ev.sessions || []).filter((s: any) => {
            const d = new Date(s.date).getTime();
            return d >= from && d <= to;
          });

          if (validSessions.length === 0) continue;

          // Group sessions by their INDIVIDUAL series field
          const sessionsBySeries: Record<string, any[]> = {};
          for (const s of validSessions) {
            const sId = s.series || (ev.series || [])[0] || '';
            if (!sessionsBySeries[sId]) sessionsBySeries[sId] = [];
            sessionsBySeries[sId].push(s);
          }

          for (const [seriesId, groupSessions] of Object.entries(sessionsBySeries)) {
            const seriesInfo = seriesMap[seriesId] || null;
            const categoryName = seriesInfo?.details?.shortName || seriesInfo?.details?.name || seriesId.toUpperCase() || 'Motorsport';
            const categoryFullName = seriesInfo?.details?.name || categoryName;

            const c = (categoryFullName || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
            if (c === 'formula1' || c === 'f1' || c === 'formula2' || c === 'f2' || c === 'formula3' || c === 'f3') {
              continue;
            }

            const firstSession = groupSessions[0];
            const circuitObj = firstSession?.circuit || {};
            const circuitName = [
              circuitObj.circuit,
              circuitObj.layout && circuitObj.layout !== 'N/A' ? circuitObj.layout : null,
              circuitObj.emoji || circuitObj.country
            ].filter(Boolean).join(' · ');

            const schedulesList = groupSessions.map((s: any, idx: number) => ({
              id: `horarios-${ev.eventId}-${s.id || idx}`,
              name: s.sessionName || s.sessionType || `Sesión ${idx + 1}`,
              startAt: new Date(s.date).getTime(),
              confirmed: true
            }));

            // Sort schedules within this group
            schedulesList.sort((a, b) => a.startAt - b.startAt);

            horariosRaces.push({
              id: `horarios-${ev.eventId}-${seriesId}`,
              categoryId: seriesId,
              category: categoryFullName,
              categoryShort: categoryName,
              event: ev.eventName || categoryName,
              circuit: circuitName,
              schedules: schedulesList,
            });
          }
        }
      }
    } catch (e) {
      console.error('[webcal] Horarios fetch error:', e);
    }

    // --- Deduplication Helper ---
    const _normalizeCategoryKey = (cat: string): string => {
      let c = (cat || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      c = c.replace(/trucks/g, 'truck');
      c = c.replace(/\b(series|championship|champ|ntt)\b/g, '');
      c = c.replace(/[^a-z0-9]/g, '');
      return c;
    };

    let allRaces: any[] = [];
    if (horariosRaces.length === 0) {
      allRaces = vrRaces;
    } else if (vrRaces.length === 0) {
      allRaces = horariosRaces.map((r: any) => {
        if (r.category && r.category.toLowerCase().includes('nascar') && r.category.toLowerCase().includes('trucks')) {
          return { ...r, category: r.category.replace(/Trucks/ig, 'Truck'), categoryShort: (r.categoryShort || '').replace(/Trucks/ig, 'Truck') };
        }
        return r;
      });
    } else {
      const primaryByCat = new Map<string, any[]>();
      for (const race of vrRaces) {
        const key = _normalizeCategoryKey(race.category);
        if (!primaryByCat.has(key)) primaryByCat.set(key, []);
        primaryByCat.get(key)!.push(race);
      }

      const secondaryByCat = new Map<string, any[]>();
      for (const race of horariosRaces) {
        let key = _normalizeCategoryKey(race.category);
        if (!secondaryByCat.has(key)) secondaryByCat.set(key, []);
        secondaryByCat.get(key)!.push(race);
      }

      const allKeys = new Set([...primaryByCat.keys(), ...secondaryByCat.keys()]);
      
      for (const key of allKeys) {
        const primRaces = primaryByCat.get(key) || [];
        let secRaces = secondaryByCat.get(key) || [];

        secRaces = secRaces.map((r: any) => {
          if (r.category && r.category.toLowerCase().includes('nascar') && r.category.toLowerCase().includes('trucks')) {
            return { ...r, category: r.category.replace(/Trucks/ig, 'Truck'), categoryShort: (r.categoryShort || '').replace(/Trucks/ig, 'Truck') };
          }
          return r;
        });

        if (primRaces.length > 0 && secRaces.length === 0) {
          allRaces.push(...primRaces);
        } else if (secRaces.length > 0 && primRaces.length === 0) {
          allRaces.push(...secRaces);
        } else {
          const primRace = primRaces[0];
          const secRace = secRaces[0];

          const mergedRace = { ...primRace };
          const primScheds = primRace.schedules || [];
          const secScheds = secRace.schedules || [];

          const overlaps = primScheds.some((p: any) => {
            const pT = p.startAt || p.start;
            return secScheds.some((s: any) => {
              const sT = s.startAt || s.start;
              return Math.abs(pT - sT) < 48 * 3600000;
            });
          });

          if (overlaps) {
            if (secScheds.length > primScheds.length) {
               mergedRace.schedules = [...secScheds];
            } else {
               mergedRace.schedules = [...primScheds];
            }
          } else {
            allRaces.push(primRace);
            allRaces.push(secRace);
            continue;
          }

          allRaces.push(mergedRace);
          for (let i = 1; i < primRaces.length; i++) allRaces.push(primRaces[i]);
          for (let i = 1; i < secRaces.length; i++) allRaces.push(secRaces[i]);
        }
      }
    }

    // --- Filter out hidden categories ---
    const filteredRaces = allRaces.filter(race => {
      if (hiddenCategories.length === 0) return true;
      const cat = (race.category || '').toLowerCase();
      const evt = (race.event || '').toLowerCase();
      
      for (const hidden of hiddenCategories) {
        if (cat.includes(hidden) || evt.includes(hidden)) {
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

    let eventCount = 0;

    for (const race of filteredRaces) {
      const schedules: any[] = race.schedules || [];
      let category: string = race.category || race.name || 'Motorsport';
      if (category === 'Super Formula Japonesa' || category === 'Super Fórmula Japonesa') category = 'Super Formula';
      if (category === 'World Rally Championship') category = 'WRC';
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
        const uid = `${startTs}-${(category + schedName).replace(/[^a-zA-Z0-9]/g, '')}@vueltadeinstalacion`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${nowStamp}`);

        const endTs = sched.endAt || (startTs + 3600000);
        lines.push(`DTSTART:${toICSDatetime(startTs)}`);
        lines.push(`DTEND:${toICSDatetime(endTs)}`);

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

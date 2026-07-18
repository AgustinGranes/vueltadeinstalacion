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

          const primarySeriesId = (ev.series || [])[0] || '';
          const seriesInfo = seriesMap[primarySeriesId] || null;
          const categoryName = seriesInfo?.details?.shortName || seriesInfo?.details?.name || primarySeriesId.toUpperCase() || 'Motorsport';
          const categoryFullName = seriesInfo?.details?.name || categoryName;

          const firstSession = validSessions[0];
          const circuitObj = firstSession?.circuit || {};
          const circuitName = [
            circuitObj.circuit,
            circuitObj.layout && circuitObj.layout !== 'N/A' ? circuitObj.layout : null,
            circuitObj.emoji || circuitObj.country
          ].filter(Boolean).join(' · ');

          const schedulesList = validSessions.map((s: any, idx: number) => ({
            id: `horarios-${ev.eventId}-${s.id || idx}`,
            name: s.sessionName || s.sessionType || `Sesión ${idx + 1}`,
            startAt: new Date(s.date).getTime(),
            confirmed: true
          }));

          horariosRaces.push({
            id: `horarios-${ev.eventId}`,
            categoryId: primarySeriesId,
            category: categoryFullName,
            categoryShort: categoryName,
            event: ev.eventName || categoryName,
            circuit: circuitName,
            schedules: schedulesList,
          });
        }
      }
    } catch (e) {
      console.error('[webcal] Horarios fetch error:', e);
    }

    // --- Deduplication Helper ---
    const _normalizeCategoryKey = (cat: string): string => {
      const c = (cat || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (c === 'f1' || c.includes('formula1') || c.includes('formulaone')) return 'f1';
      if (c === 'f2' || c.includes('formula2') || c.includes('formulatwo')) return 'f2';
      if (c === 'f3' || c.includes('formula3')) return 'f3';
      if (c === 'fe' || c.includes('formulae') || c.includes('formulaelectric')) return 'fe';
      if (c.includes('f1academy') || c.includes('f1acad') || c === 'f1acad') return 'f1academy';
      if (c.includes('freca') || (c.includes('formula') && c.includes('regional') && c.includes('eu'))) return 'freca';
      if (c.includes('euroformulaopen') || c.includes('euroformula')) return 'efo';
      if (c.includes('wrc2')) return 'wrc2';
      if (c.includes('wrc') || c.includes('worldrally')) return 'wrc';
      if (c.includes('erc') || c.includes('europeanrally')) return 'erc';
      if (c.includes('indynxt') || c.includes('indynext')) return 'indynxt';
      if (c.includes('indycar')) return 'indycar';
      if (c.includes('nascar') && (c.includes('cup') || c === 'cup' || c.includes('nascarcup'))) return 'nascarcup';
      if (c.includes('nascar') && (c.includes('truck') || c.includes('trucks'))) return 'nascartrucks';
      if (c.includes('nascar') && (c.includes('xfinity') || c.includes('oreilly') || c.includes('reilly'))) return 'nascarxfinity';
      if (c.includes('nascarmodified') || c.includes('nascarmod')) return 'nascarmodifieds';
      if (c.includes('nascarcanada')) return 'nascarcanada';
      if (c.includes('arca') && c.includes('east')) return 'arcaeast';
      if (c.includes('arca')) return 'arca';
      if (c.includes('fiawec') || (c.includes('wec') && !c.includes('gtwce'))) return 'wec';
      if (c.includes('imsa') && !c.includes('pilot') && !c.includes('sportscar')) return 'imsa';
      if (c.includes('imsapilot') || (c.includes('imsa') && c.includes('pilot'))) return 'imsapilot';
      if (c.includes('imsasportscar') || (c.includes('imsa') && c.includes('sportscar'))) return 'imsasportscar';
      if (c.includes('elms') || (c.includes('european') && c.includes('lemans'))) return 'elms';
      if (c.includes('gtwceuro') || (c.includes('gtwc') && (c.includes('eu') || c.includes('europe')))) return 'gtwceuro';
      if (c.includes('gtwcaus') || (c.includes('gtwc') && c.includes('aus'))) return 'gtwcaus';
      if (c.includes('gtwcam') || (c.includes('gtwc') && c.includes('am'))) return 'gtwcamerica';
      if (c.includes('gtwcasia') || (c.includes('gtwc') && c.includes('asia'))) return 'gtwcasia';
      if (c.includes('gtwc') || (c.includes('gt') && c.includes('world') && c.includes('challenge'))) return 'gtwc';
      if (c.includes('dtm')) return 'dtm';
      if (c.includes('britishgt') || (c.includes('british') && c.includes('gt'))) return 'britishgt';
      if (c.includes('gt4euro') || (c.includes('gt4') && c.includes('eu'))) return 'gt4euro';
      if (c.includes('gt2euro') || (c.includes('gt2') && c.includes('eu'))) return 'gt2euro';
      if (c.includes('gtopen') || (c.includes('gt') && c.includes('open'))) return 'gtopen';
      if (c.includes('nls') || c.includes('nurburgring')) return 'nls';
      if (c.includes('igtc')) return 'igtc';
      if (c.includes('supertaikyu')) return 'supertaikyu';
      if (c.includes('supergt')) return 'supergt';
      if (c.includes('superformulalights') || (c.includes('superformula') && c.includes('light'))) return 'superformulalights';
      if (c.includes('superformula') || c === 'sf') return 'superformula';
      if (c.includes('motogp')) return 'motogp';
      if (c.includes('worldsbk') || c.includes('superbike') || c.includes('worldsuperbike')) return 'worldsbk';
      if (c.includes('mxgp')) return 'mxgp';
      if (c.includes('mx2')) return 'mx2';
      if (c.includes('bsb') || c.includes('britishsuperbike')) return 'bsb';
      if (c.includes('tcrsa') || c.includes('tcrsouth') || c.includes('tcrsam') || c.includes('tcrsouthamerica')) return 'tcrsa';
      if (c.includes('wtcr') || c.includes('worldtcr') || c.includes('tcrtour') || c.includes('tcworld')) return 'wtcr';
      if (c.includes('tcrit') || (c.includes('tcr') && c.includes('it'))) return 'tcrit';
      if (c.includes('btcc') || c.includes('britishtouringcar')) return 'btcc';
      if (c === 'tc' || c.includes('turismocarretera')) return 'tc';
      if (c.includes('tcpistapickup') || c.includes('tcppk') || c === 'tcppk') return 'tcppk';
      if (c.includes('tcpickup') || c.includes('tcpk') || c === 'tcpk') return 'tcpk';
      if (c.includes('tcpistamouras') || c.includes('tcpm') || c === 'tcpm') return 'tcpm';
      if (c.includes('tcpista') || c === 'tcp') return 'tcp';
      if (c.includes('tcmouras') || c === 'tcm') return 'tcm';
      if (c.includes('tc2000')) return 'tc2000';
      if (c.includes('tnclase2') || c.includes('tnc2')) return 'tnc2';
      if (c.includes('tnclase3') || c.includes('tnc3')) return 'tnc3';
      if (c.includes('procar')) return 'procar4000';
      if (c.includes('stockcarpro') || c.includes('stockcar')) return 'stockcarpro';
      if (c.includes('driftmasters') || c.includes('drift')) return 'drift';
      return c;
    };

    let allRaces: any[] = [];
    if (horariosRaces.length === 0) {
      allRaces = vrRaces;
    } else if (vrRaces.length === 0) {
      allRaces = horariosRaces;
    } else {
      const primaryByCat = new Map<string, any[]>();
      for (const race of vrRaces) {
        const key = _normalizeCategoryKey(race.category);
        if (!primaryByCat.has(key)) primaryByCat.set(key, []);
        primaryByCat.get(key)!.push(race);
      }

      const toAdd: any[] = [];
      for (const secRace of horariosRaces) {
        const key = _normalizeCategoryKey(secRace.category);
        const primRaces = primaryByCat.get(key);

        if (!primRaces || primRaces.length === 0) {
          toAdd.push(secRace);
          continue;
        }

        const primTotal = primRaces.reduce((sum, r) => sum + (r.schedules?.length || 0), 0);
        const secTotal = secRace.schedules?.length || 0;

        if (secTotal > primTotal) {
          toAdd.push(secRace);
        }
      }
      allRaces = [...vrRaces, ...toAdd];
    }

    // --- Filter out hidden categories ---
    const filteredRaces = allRaces.filter(race => {
      // NEVER hide VueltaRapida events
      if (!String(race.id).startsWith('horarios-')) return true;
      if (hiddenCategories.length === 0) return true;
      const cat = (race.category || '').toLowerCase();
      // Only exclude if it exactly matches a hidden category name (which is also lowerecased)
      return !hiddenCategories.includes(cat);
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

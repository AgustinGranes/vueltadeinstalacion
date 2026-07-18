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
      const c = (cat || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
      if (c === 'f1' || c.includes('formula1') || c.includes('formulaone')) return 'f1';
      if (c === 'f2' || c.includes('formula2') || c.includes('formulatwo')) return 'f2';
      if (c === 'f3' || c.includes('formula3')) return 'f3';
      if (c === 'fe' || c.includes('formulae') || c.includes('formulaelectric')) return 'fe';
      if (c.includes('f1academy') || c.includes('f1acad') || c === 'f1acad') return 'f1academy';
      if (c.includes('freca') || (c.includes('formula') && c.includes('regional') && c.includes('eu'))) return 'freca';
      if (c.includes('euroformulaopen') || c.includes('euroformula')) return 'efo';
      if (c.includes('superformula')) return 'superformula';
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

      const secondaryByCat = new Map<string, any[]>();
      for (const race of horariosRaces) {
        let key = _normalizeCategoryKey(race.category);

        // Cross-category deduplication for NASCAR
        if (key.includes('nascar')) {
          const primaryRacesFlat = Array.from(primaryByCat.values()).flat();
          for (const primRace of primaryRacesFlat) {
            const primKey = _normalizeCategoryKey(primRace.category);
            if (primKey.includes('nascar')) {
              const overlaps = (race.schedules || []).some((secSched: any) => {
                const secStart = secSched.startAt || secSched.start;
                if (!secStart) return false;
                return (primRace.schedules || []).some((primSched: any) => {
                  const primStart = primSched.startAt || primSched.start;
                  if (!primStart) return false;
                  // Coincides within 4 hours
                  return Math.abs(secStart - primStart) < 4 * 3600000;
                });
              });
              if (overlaps) {
                key = primKey; // Override key to force merge
                break;
              }
            }
          }
        }

        if (!secondaryByCat.has(key)) secondaryByCat.set(key, []);
        secondaryByCat.get(key)!.push(race);
      }

      const allKeys = new Set([...primaryByCat.keys(), ...secondaryByCat.keys()]);
      
      for (const key of allKeys) {
        const primRaces = primaryByCat.get(key) || [];
        const secRaces = secondaryByCat.get(key) || [];

        if (primRaces.length > 0 && secRaces.length === 0) {
          allRaces.push(...primRaces);
        } else if (secRaces.length > 0 && primRaces.length === 0) {
          allRaces.push(...secRaces);
        } else {
          // SMART MERGE: Use Primary Race as base
          const primRace = primRaces[0];
          const secRace = secRaces[0];

          const mergedRace = { ...primRace };
          const mergedSchedules = [...(primRace.schedules || [])];

          for (const secSched of (secRace.schedules || [])) {
            const secStart = secSched.startAt || secSched.start;
            if (!secStart) continue;

            const overlaps = mergedSchedules.some(primSched => {
              const primStart = primSched.startAt || primSched.start;
              if (!primStart) return false;
              return Math.abs(secStart - primStart) < 3 * 3600000;
            });

            if (!overlaps) {
              mergedSchedules.push(secSched);
            }
          }

          mergedSchedules.sort((a, b) => {
            const aT = a.startAt || a.start || 0;
            const bT = b.startAt || b.start || 0;
            return aT - bT;
          });

          mergedRace.schedules = mergedSchedules;
          allRaces.push(mergedRace);
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

    // --- Build JSON for Widget ---
    const isLive = (item: any) => {
      const now = Date.now();
      const match = (item.name + ' ' + item.event).match(/\b(\d+)\s*hs\b/i);
      const duration = match ? parseInt(match[1], 10) * 3600000 : 3600000;
      return now >= item.startAt && now <= item.startAt + duration;
    };

    let flatSchedules: any[] = [];
    for (const race of filteredRaces) {
      const schedules = race.schedules || [];
      let category = race.category || race.name || 'Motorsport';
      if (category === 'Super Formula Japonesa' || category === 'Super Fórmula Japonesa') category = 'Super Formula';
      if (category === 'World Rally Championship') category = 'WRC';
      const event = (race.completeName || race.name || category).replace(/\s*[–—-]+\s*$/, '').trim();

      for (const sched of schedules) {
        const startTs = sched.startAt || sched.start;
        if (!startTs) continue;
        const isConfirmed = sched.confirmed !== false && sched.time !== '--:--' && sched.time !== '';
        if (!isConfirmed) continue;
        
        let timeStr = '';
        if (startTs) {
          const d = new Date(startTs);
          timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });
        } else {
          timeStr = sched.time || '--:--';
        }

        flatSchedules.push({
          category,
          event,
          name: sched.name || sched.title || 'Evento',
          startAt: startTs,
          time: timeStr,
          color: race.categoryColor || '#ff3b30'
        });
      }
    }

    flatSchedules.sort((a, b) => a.startAt - b.startAt);

    const upcomingSchedules = flatSchedules.filter(s => s.startAt >= Date.now() || isLive(s)).map(s => ({
      ...s,
      isLive: isLive(s)
    }));
    
    upcomingSchedules.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.startAt - b.startAt;
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(upcomingSchedules.slice(0, 15));

  } catch (error) {
    console.error('[widget] Fatal error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

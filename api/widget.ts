

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
        vrRaces = vrRaces.filter((r: any) => {
          const cat = (r.category || r.name || '').toLowerCase();
          const blockedCategories = ['fórmula 1', 'formula 1', 'f1', 'fórmula 2', 'formula 2', 'f2', 'fórmula 3', 'formula 3', 'f3', 'btcc', 'dtm', "nascar o'reilly", 'nascar cup', 'nascar truck', 'nascar trucks'];
          return !blockedCategories.includes(cat);
        });
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

            const firstSession = groupSessions[0];
            const circuitObj = firstSession?.circuit || {};
            let circuitName = circuitObj.circuit || '';
            if (circuitName.includes(' - ')) {
              circuitName = circuitName.split(' - ').pop()?.trim() || circuitName;
            }

            const schedulesList = groupSessions.map((s: any, idx: number) => ({
              id: `horarios-${ev.eventId}-${s.id || idx}`,
              name: s.sessionName || s.sessionType || `Sesión ${idx + 1}`,
              startAt: new Date(s.date).getTime(),
              confirmed: true
            }));

            // Sort schedules within this group
            schedulesList.sort((a, b) => a.startAt - b.startAt);

            let eventName = ev.eventName || categoryName;
            if (eventName.includes(' - ')) {
              eventName = eventName.split(' - ').pop()?.trim() || eventName;
            }

            horariosRaces.push({
              id: `horarios-${ev.eventId}-${seriesId}`,
              categoryId: seriesId,
              category: categoryFullName,
              categoryShort: categoryName,
              event: eventName,
              circuit: circuitName,
              lat: circuitObj.lat,
              long: circuitObj.long,
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
      if (c === 'stockcarbrasil') return 'stockcarpro';
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
      if (category === 'Fórmula 4 Brasil' || category === 'Formula 4 Brasil') category = 'F4 Brazil';
      if (category === 'NASCAR México' || category === 'NASCAR Mexico') category = 'NASCAR Mexico';
      if (category === 'Stock Car Brasil') category = 'Stock Car Pro';
      const event = (race.circuit || race.event || race.completeName || race.name || category).replace(/\s*[–—-]+\s*$/, '').trim();

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
          color: race.categoryColor || '#ff3b30',
          lat: race.lat,
          long: race.long
        });
      }
    }

    flatSchedules.sort((a, b) => a.startAt - b.startAt);

    // --- Deduplicate identical schedules (e.g., Carrera 2 vs Race 2 at same time) ---
    const uniqueSchedules: any[] = [];
    for (const sched of flatSchedules) {
      const isDup = uniqueSchedules.some(u => {
        const catMatch = _normalizeCategoryKey(u.category) === _normalizeCategoryKey(sched.category);
        const timeDiff = Math.abs(u.startAt - sched.startAt);
        // If same category and within 10 minutes, treat as duplicate
        return catMatch && timeDiff < 600000;
      });
      if (!isDup) uniqueSchedules.push(sched);
    }
    flatSchedules = uniqueSchedules;

    const upcomingSchedules = flatSchedules.filter(s => s.startAt >= Date.now() || isLive(s)).map(s => ({
      ...s,
      isLive: isLive(s)
    }));
    
    upcomingSchedules.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.startAt - b.startAt;
    });

    const finalSchedules = upcomingSchedules.slice(0, 35); // Up to 35 for pagination

    // 1. Geocode any missing coordinates
    const geocodePromises = [];
    const HARDCODED_COORDS: Record<string, {lat: number, long: number}> = {
  "buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "autodromo buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "autódromo buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "circuito buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "gran premio buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "gp buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "autodromo de buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "autódromo de buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "autodromo ciudad de buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "autódromo ciudad de buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "parque buenos aires": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "buenos aires circuit": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "buenos aires raceway": {
    "lat": -34.6943,
    "long": -58.4593
  },
  "autodromo rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "autódromo rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "circuito rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "gran premio rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "gp rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "autodromo de rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "autódromo de rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "autodromo ciudad de rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "autódromo ciudad de rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "parque rafaela": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "rafaela circuit": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "rafaela raceway": {
    "lat": -31.25285,
    "long": -61.49078
  },
  "autodromo termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autódromo termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "circuito termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "gran premio termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "gp termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autodromo de termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autódromo de termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autodromo ciudad de termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autódromo ciudad de termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "parque termas de rio hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "termas de rio hondo circuit": {
    "lat": -27.5029,
    "long": -64.915
  },
  "termas de rio hondo raceway": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autodromo termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autódromo termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "circuito termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "gran premio termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "gp termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autodromo de termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autódromo de termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autodromo ciudad de termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autódromo ciudad de termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "parque termas de río hondo": {
    "lat": -27.5029,
    "long": -64.915
  },
  "termas de río hondo circuit": {
    "lat": -27.5029,
    "long": -64.915
  },
  "termas de río hondo raceway": {
    "lat": -27.5029,
    "long": -64.915
  },
  "autodromo viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "autódromo viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "circuito viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "gran premio viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "gp viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "autodromo de viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "autódromo de viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "autodromo ciudad de viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "autódromo ciudad de viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "parque viedma": {
    "lat": -40.834,
    "long": -62.9772
  },
  "viedma circuit": {
    "lat": -40.834,
    "long": -62.9772
  },
  "viedma raceway": {
    "lat": -40.834,
    "long": -62.9772
  },
  "autodromo concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autódromo concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "circuito concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "gran premio concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "gp concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autodromo de concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autódromo de concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autodromo ciudad de concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autódromo ciudad de concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "parque concepcion del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "concepcion del uruguay circuit": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "concepcion del uruguay raceway": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autodromo concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autódromo concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "circuito concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "gran premio concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "gp concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autodromo de concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autódromo de concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autodromo ciudad de concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autódromo ciudad de concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "parque concepción del uruguay": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "concepción del uruguay circuit": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "concepción del uruguay raceway": {
    "lat": -32.4839,
    "long": -58.2917
  },
  "autodromo san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autódromo san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "circuito san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "gran premio san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "gp san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autodromo de san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autódromo de san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autodromo ciudad de san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autódromo ciudad de san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "parque san nicolas": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "san nicolas circuit": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "san nicolas raceway": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autodromo san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autódromo san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "circuito san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "gran premio san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "gp san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autodromo de san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autódromo de san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autodromo ciudad de san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autódromo ciudad de san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "parque san nicolás": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "san nicolás circuit": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "san nicolás raceway": {
    "lat": -33.3644,
    "long": -60.1869
  },
  "autodromo toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "autódromo toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "circuito toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "gran premio toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "gp toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "autodromo de toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "autódromo de toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "autodromo ciudad de toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "autódromo ciudad de toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "parque toay": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "toay circuit": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "toay raceway": {
    "lat": -36.6997,
    "long": -64.3168
  },
  "autodromo el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "autódromo el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "circuito el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "gran premio el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "gp el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "autodromo de el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "autódromo de el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "autodromo ciudad de el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "autódromo ciudad de el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "parque el calafate": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "el calafate circuit": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "el calafate raceway": {
    "lat": -50.2851,
    "long": -72.2238
  },
  "autodromo posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "autódromo posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "circuito posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "gran premio posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "gp posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "autodromo de posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "autódromo de posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "autodromo ciudad de posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "autódromo ciudad de posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "parque posadas": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "posadas circuit": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "posadas raceway": {
    "lat": -27.4245,
    "long": -55.9329
  },
  "autodromo parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autódromo parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "circuito parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "gran premio parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "gp parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autodromo de parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autódromo de parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autodromo ciudad de parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autódromo ciudad de parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "parque parana": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "parana circuit": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "parana raceway": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autodromo paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autódromo paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "circuito paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "gran premio paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "gp paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autodromo de paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autódromo de paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autodromo ciudad de paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autódromo ciudad de paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "parque paraná": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "paraná circuit": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "paraná raceway": {
    "lat": -31.7825,
    "long": -60.4851
  },
  "autodromo rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "autódromo rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "circuito rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "gran premio rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "gp rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "autodromo de rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "autódromo de rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "autodromo ciudad de rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "autódromo ciudad de rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "parque rosario": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "rosario circuit": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "rosario raceway": {
    "lat": -32.9069,
    "long": -60.7788
  },
  "autodromo alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "autódromo alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "circuito alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "gran premio alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "gp alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "autodromo de alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "autódromo de alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "autodromo ciudad de alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "autódromo ciudad de alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "parque alta gracia": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "alta gracia circuit": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "alta gracia raceway": {
    "lat": -31.64978,
    "long": -64.42972
  },
  "autodromo cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autódromo cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "circuito cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "gran premio cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "gp cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autodromo de cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autódromo de cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autodromo ciudad de cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autódromo ciudad de cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "parque cabalen": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "cabalen circuit": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "cabalen raceway": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autodromo cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autódromo cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "circuito cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "gran premio cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "gp cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autodromo de cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autódromo de cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autodromo ciudad de cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autódromo ciudad de cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "parque cabalén": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "cabalén circuit": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "cabalén raceway": {
    "lat": -31.6961,
    "long": -64.4414
  },
  "autodromo centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "circuito centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "gran premio centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "gp centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo de centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo de centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo ciudad de centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo ciudad de centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "parque centenario": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "centenario circuit": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "centenario raceway": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "circuito neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "gran premio neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "gp neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo de neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo de neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo ciudad de neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo ciudad de neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "parque neuquen": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "neuquen circuit": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "neuquen raceway": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "circuito neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "gran premio neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "gp neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo de neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo de neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo ciudad de neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autódromo ciudad de neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "parque neuquén": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "neuquén circuit": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "neuquén raceway": {
    "lat": -38.7905,
    "long": -68.1256
  },
  "autodromo concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "autódromo concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "circuito concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "gran premio concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "gp concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "autodromo de concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "autódromo de concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "autodromo ciudad de concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "autódromo ciudad de concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "parque concordia": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "concordia circuit": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "concordia raceway": {
    "lat": -31.3323,
    "long": -58.0163
  },
  "autodromo trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "autódromo trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "circuito trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "gran premio trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "gp trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "autodromo de trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "autódromo de trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "autodromo ciudad de trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "autódromo ciudad de trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "parque trelew": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "trelew circuit": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "trelew raceway": {
    "lat": -43.24895,
    "long": -65.30505
  },
  "autodromo comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "autódromo comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "circuito comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "gran premio comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "gp comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "autodromo de comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "autódromo de comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "autodromo ciudad de comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "autódromo ciudad de comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "parque comodoro rivadavia": {
    "lat": -45.86256,
    "long": -67.494
  },
  "comodoro rivadavia circuit": {
    "lat": -45.86256,
    "long": -67.494
  },
  "comodoro rivadavia raceway": {
    "lat": -45.86256,
    "long": -67.494
  },
  "autodromo san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "circuito san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "gran premio san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "gp san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo de san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo de san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo ciudad de san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo ciudad de san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "parque san luis": {
    "lat": -33.2773,
    "long": -66.315
  },
  "san luis circuit": {
    "lat": -33.2773,
    "long": -66.315
  },
  "san luis raceway": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "circuito rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "gran premio rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "gp rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo de rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo de rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo ciudad de rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo ciudad de rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "parque rosendo hernandez": {
    "lat": -33.2773,
    "long": -66.315
  },
  "rosendo hernandez circuit": {
    "lat": -33.2773,
    "long": -66.315
  },
  "rosendo hernandez raceway": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "circuito rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "gran premio rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "gp rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo de rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo de rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo ciudad de rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autódromo ciudad de rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "parque rosendo hernández": {
    "lat": -33.2773,
    "long": -66.315
  },
  "rosendo hernández circuit": {
    "lat": -33.2773,
    "long": -66.315
  },
  "rosendo hernández raceway": {
    "lat": -33.2773,
    "long": -66.315
  },
  "autodromo potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "autódromo potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "circuito potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "gran premio potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "gp potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "autodromo de potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "autódromo de potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "autodromo ciudad de potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "autódromo ciudad de potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "parque potrero de los funes": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "potrero de los funes circuit": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "potrero de los funes raceway": {
    "lat": -33.2201,
    "long": -66.2307
  },
  "autodromo la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "autódromo la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "circuito la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "gran premio la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "gp la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "autodromo de la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "autódromo de la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "autodromo ciudad de la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "autódromo ciudad de la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "parque la pedrera": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "la pedrera circuit": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "la pedrera raceway": {
    "lat": -33.6931,
    "long": -65.4542
  },
  "autodromo villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "autódromo villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "circuito villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "gran premio villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "gp villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "autodromo de villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "autódromo de villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "autodromo ciudad de villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "autódromo ciudad de villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "parque villa mercedes": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "villa mercedes circuit": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "villa mercedes raceway": {
    "lat": -37.40421,
    "long": -71.97949
  },
  "autodromo san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autódromo san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "circuito san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "gran premio san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "gp san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autodromo de san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autódromo de san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autodromo ciudad de san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autódromo ciudad de san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "parque san juan": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "san juan circuit": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "san juan raceway": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autodromo villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autódromo villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "circuito villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "gran premio villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "gp villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autodromo de villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autódromo de villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autodromo ciudad de villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autódromo ciudad de villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "parque villicum": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "villicum circuit": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "villicum raceway": {
    "lat": -31.2952,
    "long": -68.5684
  },
  "autodromo el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "autódromo el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "circuito el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "gran premio el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "gp el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "autodromo de el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "autódromo de el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "autodromo ciudad de el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "autódromo ciudad de el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "parque el zonda": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "el zonda circuit": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "el zonda raceway": {
    "lat": -31.5273,
    "long": -68.6479
  },
  "autodromo rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autódromo rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "circuito rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "gran premio rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "gp rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autodromo de rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autódromo de rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autodromo ciudad de rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autódromo ciudad de rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "parque rio gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "rio gallegos circuit": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "rio gallegos raceway": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autodromo río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autódromo río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "circuito río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "gran premio río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "gp río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autodromo de río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autódromo de río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autodromo ciudad de río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autódromo ciudad de río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "parque río gallegos": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "río gallegos circuit": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "río gallegos raceway": {
    "lat": -51.6441,
    "long": -69.2435
  },
  "autodromo bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autódromo bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "circuito bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "gran premio bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "gp bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autodromo de bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autódromo de bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autodromo ciudad de bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autódromo ciudad de bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "parque bahia blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "bahia blanca circuit": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "bahia blanca raceway": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autodromo bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autódromo bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "circuito bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "gran premio bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "gp bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autodromo de bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autódromo de bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autodromo ciudad de bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autódromo ciudad de bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "parque bahía blanca": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "bahía blanca circuit": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "bahía blanca raceway": {
    "lat": -38.7511,
    "long": -62.2464
  },
  "autodromo olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "autódromo olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "circuito olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "gran premio olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "gp olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "autodromo de olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "autódromo de olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "autodromo ciudad de olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "autódromo ciudad de olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "parque olavarria": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "olavarria circuit": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "olavarria raceway": {
    "lat": -36.89384,
    "long": -60.32319
  },
  "autodromo olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autódromo olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "circuito olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "gran premio olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "gp olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autodromo de olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autódromo de olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autodromo ciudad de olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autódromo ciudad de olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "parque olavarría": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "olavarría circuit": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "olavarría raceway": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autodromo la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autódromo la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "circuito la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "gran premio la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "gp la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autodromo de la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autódromo de la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autodromo ciudad de la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autódromo ciudad de la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "parque la plata": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "la plata circuit": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "la plata raceway": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autodromo roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autódromo roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "circuito roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "gran premio roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "gp roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autodromo de roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autódromo de roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autodromo ciudad de roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autódromo ciudad de roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "parque roberto mouras": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "roberto mouras circuit": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "roberto mouras raceway": {
    "lat": -35.0315,
    "long": -58.0617
  },
  "autodromo mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autódromo mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "circuito mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "gran premio mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "gp mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autodromo de mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autódromo de mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autodromo ciudad de mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autódromo ciudad de mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "parque mar de ajo": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "mar de ajo circuit": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "mar de ajo raceway": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autodromo mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autódromo mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "circuito mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "gran premio mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "gp mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autodromo de mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autódromo de mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autodromo ciudad de mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autódromo ciudad de mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "parque mar de ajó": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "mar de ajó circuit": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "mar de ajó raceway": {
    "lat": -36.7214,
    "long": -56.6853
  },
  "autodromo balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "autódromo balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "circuito balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "gran premio balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "gp balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "autodromo de balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "autódromo de balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "autodromo ciudad de balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "autódromo ciudad de balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "parque balcarce": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "balcarce circuit": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "balcarce raceway": {
    "lat": -37.8715,
    "long": -58.2618
  },
  "autodromo nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autódromo nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "circuito nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "gran premio nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "gp nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autodromo de nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autódromo de nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autodromo ciudad de nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autódromo ciudad de nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "parque nicolas matias": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "nicolas matias circuit": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "nicolas matias raceway": {
    "lat": -36.9157,
    "long": -60.2974
  },
  "autodromo rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "autódromo rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "circuito rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "gran premio rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "gp rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "autodromo de rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "autódromo de rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "autodromo ciudad de rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "autódromo ciudad de rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "parque rio cuarto": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "rio cuarto circuit": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "rio cuarto raceway": {
    "lat": -33.13044,
    "long": -64.35272
  },
  "autodromo río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "autódromo río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "circuito río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "gran premio río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "gp río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "autodromo de río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "autódromo de río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "autodromo ciudad de río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "autódromo ciudad de río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "parque río cuarto": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "río cuarto circuit": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "río cuarto raceway": {
    "lat": -33.1554,
    "long": -64.3411
  },
  "autodromo san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "autódromo san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "circuito san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "gran premio san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "gp san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "autodromo de san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "autódromo de san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "autodromo ciudad de san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "autódromo ciudad de san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "parque san jorge": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "san jorge circuit": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "san jorge raceway": {
    "lat": -31.8906,
    "long": -61.8596
  },
  "autodromo marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "autódromo marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "circuito marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "gran premio marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "gp marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "autodromo de marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "autódromo de marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "autodromo ciudad de marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "autódromo ciudad de marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "parque marcos juarez": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "marcos juarez circuit": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "marcos juarez raceway": {
    "lat": -32.6978,
    "long": -62.10672
  },
  "autodromo marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "autódromo marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "circuito marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "gran premio marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "gp marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "autodromo de marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "autódromo de marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "autodromo ciudad de marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "autódromo ciudad de marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "parque marcos juárez": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "marcos juárez circuit": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "marcos juárez raceway": {
    "lat": -32.7011,
    "long": -62.1553
  },
  "autodromo obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autódromo obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "circuito obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "gran premio obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "gp obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autodromo de obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autódromo de obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autodromo ciudad de obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autódromo ciudad de obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "parque obera": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "obera circuit": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "obera raceway": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autodromo oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autódromo oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "circuito oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "gran premio oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "gp oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autodromo de oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autódromo de oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autodromo ciudad de oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autódromo ciudad de oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "parque oberá": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "oberá circuit": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "oberá raceway": {
    "lat": -27.4727,
    "long": -55.1278
  },
  "autodromo salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "circuito salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "gran premio salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "gp salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo de salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo de salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo ciudad de salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo ciudad de salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "parque salta": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "salta circuit": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "salta raceway": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "circuito martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "gran premio martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "gp martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo de martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo de martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo ciudad de martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo ciudad de martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "parque martin miguel de guemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "martin miguel de guemes circuit": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "martin miguel de guemes raceway": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "circuito martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "gran premio martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "gp martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo de martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo de martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo ciudad de martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autódromo ciudad de martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "parque martín miguel de güemes": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "martín miguel de güemes circuit": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "martín miguel de güemes raceway": {
    "lat": -24.8193,
    "long": -65.3857
  },
  "autodromo chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "circuito chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "gran premio chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "gp chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo de chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo de chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo ciudad de chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo ciudad de chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "parque chaco": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "chaco circuit": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "chaco raceway": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "circuito resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "gran premio resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "gp resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo de resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo de resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo ciudad de resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo ciudad de resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "parque resistencia": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "resistencia circuit": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "resistencia raceway": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "circuito yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "gran premio yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "gp yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo de yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo de yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo ciudad de yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autódromo ciudad de yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "parque yaco guarnieri": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "yaco guarnieri circuit": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "yaco guarnieri raceway": {
    "lat": -27.3888,
    "long": -59.0271
  },
  "autodromo general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autódromo general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "circuito general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "gran premio general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "gp general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autodromo de general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autódromo de general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autodromo ciudad de general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autódromo ciudad de general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "parque general roca": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "general roca circuit": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "general roca raceway": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autodromo parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autódromo parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "circuito parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "gran premio parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "gp parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autodromo de parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autódromo de parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autodromo ciudad de parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autódromo ciudad de parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "parque parque ciudad": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "parque ciudad circuit": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "parque ciudad raceway": {
    "lat": -39.0118,
    "long": -67.5768
  },
  "autodromo pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autódromo pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "circuito pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "gran premio pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "gp pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autodromo de pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autódromo de pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autodromo ciudad de pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autódromo ciudad de pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "parque pigüé": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "pigüé circuit": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "pigüé raceway": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autodromo pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autódromo pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "circuito pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "gran premio pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "gp pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autodromo de pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autódromo de pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autodromo ciudad de pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autódromo ciudad de pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "parque pigue": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "pigue circuit": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "pigue raceway": {
    "lat": -37.6049,
    "long": -62.3929
  },
  "autodromo interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autódromo interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "circuito interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "gran premio interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "gp interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autodromo de interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autódromo de interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autodromo ciudad de interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autódromo ciudad de interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "parque interlagos": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "interlagos circuit": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "interlagos raceway": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autodromo sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "autódromo sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "circuito sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "gran premio sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "gp sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "autodromo de sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "autódromo de sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "autodromo ciudad de sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "autódromo ciudad de sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "parque sao paulo": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "sao paulo circuit": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "sao paulo raceway": {
    "lat": -23.5475,
    "long": -46.63611
  },
  "autodromo são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autódromo são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "circuito são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "gran premio são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "gp são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autodromo de são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autódromo de são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autodromo ciudad de são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autódromo ciudad de são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "parque são paulo": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "são paulo circuit": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "são paulo raceway": {
    "lat": -23.7013,
    "long": -46.6974
  },
  "autodromo velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "autódromo velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "circuito velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "gran premio velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "gp velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "autodromo de velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "autódromo de velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "autodromo ciudad de velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "autódromo ciudad de velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "parque velocitta": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "velocitta circuit": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "velocitta raceway": {
    "lat": -22.2855,
    "long": -46.8973
  },
  "autodromo goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "autódromo goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "circuito goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "gran premio goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "gp goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "autodromo de goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "autódromo de goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "autodromo ciudad de goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "autódromo ciudad de goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "parque goiania": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "goiania circuit": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "goiania raceway": {
    "lat": -16.67861,
    "long": -49.25389
  },
  "autodromo goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autódromo goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "circuito goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "gran premio goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "gp goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autodromo de goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autódromo de goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autodromo ciudad de goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autódromo ciudad de goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "parque goiânia": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "goiânia circuit": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "goiânia raceway": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autodromo ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autódromo ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "circuito ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "gran premio ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "gp ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autodromo de ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autódromo de ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autodromo ciudad de ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autódromo ciudad de ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "parque ayrton senna (goiânia)": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "ayrton senna (goiânia) circuit": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "ayrton senna (goiânia) raceway": {
    "lat": -16.7139,
    "long": -49.2078
  },
  "autodromo cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "autódromo cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "circuito cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "gran premio cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "gp cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "autodromo de cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "autódromo de cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "autodromo ciudad de cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "autódromo ciudad de cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "parque cascavel": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "cascavel circuit": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "cascavel raceway": {
    "lat": -24.95583,
    "long": -53.45528
  },
  "autodromo zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "autódromo zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "circuito zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "gran premio zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "gp zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "autodromo de zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "autódromo de zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "autodromo ciudad de zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "autódromo ciudad de zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "parque zilmar beux": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "zilmar beux circuit": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "zilmar beux raceway": {
    "lat": -24.9961,
    "long": -53.4316
  },
  "autodromo curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "autódromo curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "circuito curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "gran premio curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "gp curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "autodromo de curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "autódromo de curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "autodromo ciudad de curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "autódromo ciudad de curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "parque curitiba": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "curitiba circuit": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "curitiba raceway": {
    "lat": -25.42778,
    "long": -49.27306
  },
  "autodromo pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "autódromo pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "circuito pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "gran premio pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "gp pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "autodromo de pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "autódromo de pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "autodromo ciudad de pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "autódromo ciudad de pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "parque pinhais": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "pinhais circuit": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "pinhais raceway": {
    "lat": -25.4411,
    "long": -49.1982
  },
  "autodromo taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autódromo taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "circuito taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "gran premio taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "gp taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autodromo de taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autódromo de taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autodromo ciudad de taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autódromo ciudad de taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "parque taruma": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "taruma circuit": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "taruma raceway": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autodromo tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autódromo tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "circuito tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "gran premio tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "gp tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autodromo de tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autódromo de tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autodromo ciudad de tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autódromo ciudad de tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "parque tarumã": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "tarumã circuit": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "tarumã raceway": {
    "lat": -30.0822,
    "long": -51.0186
  },
  "autodromo santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "autódromo santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "circuito santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "gran premio santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "gp santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "autodromo de santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "autódromo de santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "autodromo ciudad de santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "autódromo ciudad de santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "parque santa cruz do sul": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "santa cruz do sul circuit": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "santa cruz do sul raceway": {
    "lat": -29.7439,
    "long": -52.4172
  },
  "autodromo londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "autódromo londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "circuito londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "gran premio londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "gp londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "autodromo de londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "autódromo de londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "autodromo ciudad de londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "autódromo ciudad de londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "parque londrina": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "londrina circuit": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "londrina raceway": {
    "lat": -23.31028,
    "long": -51.16278
  },
  "autodromo ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "autódromo ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "circuito ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "gran premio ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "gp ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "autodromo de ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "autódromo de ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "autodromo ciudad de ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "autódromo ciudad de ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "parque ayrton senna (londrina)": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "ayrton senna (londrina) circuit": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "ayrton senna (londrina) raceway": {
    "lat": -23.2758,
    "long": -51.1717
  },
  "autodromo ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "autódromo ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "circuito ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "gran premio ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "gp ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "autodromo de ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "autódromo de ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "autodromo ciudad de ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "autódromo ciudad de ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "parque ribeirao preto": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "ribeirao preto circuit": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "ribeirao preto raceway": {
    "lat": -21.1775,
    "long": -47.81028
  },
  "autodromo ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "autódromo ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "circuito ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "gran premio ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "gp ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "autodromo de ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "autódromo de ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "autodromo ciudad de ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "autódromo ciudad de ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "parque ribeirão preto": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "ribeirão preto circuit": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "ribeirão preto raceway": {
    "lat": -21.1704,
    "long": -47.8103
  },
  "autodromo velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autódromo velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "circuito velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "gran premio velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "gp velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autodromo de velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autódromo de velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autodromo ciudad de velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autódromo ciudad de velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "parque velopark": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "velopark circuit": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "velopark raceway": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autodromo nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autódromo nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "circuito nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "gran premio nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "gp nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autodromo de nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autódromo de nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autodromo ciudad de nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autódromo ciudad de nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "parque nova santa rita": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "nova santa rita circuit": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "nova santa rita raceway": {
    "lat": -29.8378,
    "long": -51.2784
  },
  "autodromo campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "autódromo campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "circuito campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "gran premio campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "gp campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "autodromo de campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "autódromo de campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "autodromo ciudad de campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "autódromo ciudad de campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "parque campo grande": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "campo grande circuit": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "campo grande raceway": {
    "lat": -20.44278,
    "long": -54.64639
  },
  "autodromo orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "autódromo orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "circuito orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "gran premio orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "gp orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "autodromo de orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "autódromo de orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "autodromo ciudad de orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "autódromo ciudad de orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "parque orlando moura": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "orlando moura circuit": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "orlando moura raceway": {
    "lat": -20.4571,
    "long": -54.5428
  },
  "autodromo brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "circuito brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "gran premio brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "gp brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo de brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo de brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo ciudad de brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo ciudad de brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "parque brasilia": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "brasilia circuit": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "brasilia raceway": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "circuito brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "gran premio brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "gp brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo de brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo de brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo ciudad de brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo ciudad de brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "parque brasília": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "brasília circuit": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "brasília raceway": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "circuito nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "gran premio nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "gp nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo de nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo de nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo ciudad de nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autódromo ciudad de nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "parque nelson piquet": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "nelson piquet circuit": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "nelson piquet raceway": {
    "lat": -15.7766,
    "long": -47.8966
  },
  "autodromo rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "autódromo rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "circuito rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "gran premio rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "gp rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "autodromo de rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "autódromo de rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "autodromo ciudad de rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "autódromo ciudad de rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "parque rio de janeiro": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "rio de janeiro circuit": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "rio de janeiro raceway": {
    "lat": -22.90642,
    "long": -43.18223
  },
  "autodromo jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autódromo jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "circuito jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "gran premio jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "gp jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autodromo de jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autódromo de jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autodromo ciudad de jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autódromo ciudad de jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "parque jacarepagua": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "jacarepagua circuit": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "jacarepagua raceway": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autodromo jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autódromo jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "circuito jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "gran premio jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "gp jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autodromo de jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autódromo de jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autodromo ciudad de jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autódromo ciudad de jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "parque jacarepaguá": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "jacarepaguá circuit": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "jacarepaguá raceway": {
    "lat": -22.9772,
    "long": -43.4005
  },
  "autodromo el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "autódromo el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "circuito el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "gran premio el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "gp el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "autodromo de el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "autódromo de el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "autodromo ciudad de el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "autódromo ciudad de el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "parque el pinar": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "el pinar circuit": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "el pinar raceway": {
    "lat": -34.7831,
    "long": -55.9868
  },
  "autodromo mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "autódromo mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "circuito mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "gran premio mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "gp mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "autodromo de mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "autódromo de mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "autodromo ciudad de mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "autódromo ciudad de mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "parque mercedes": {
    "lat": -33.257,
    "long": -58.0583
  },
  "mercedes circuit": {
    "lat": -33.257,
    "long": -58.0583
  },
  "mercedes raceway": {
    "lat": -33.257,
    "long": -58.0583
  },
  "autodromo rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "autódromo rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "circuito rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "gran premio rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "gp rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "autodromo de rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "autódromo de rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "autodromo ciudad de rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "autódromo ciudad de rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "parque rivera": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "rivera circuit": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "rivera raceway": {
    "lat": -30.9161,
    "long": -55.5358
  },
  "autodromo junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "autódromo junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "circuito junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "gran premio junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "gp junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "autodromo de junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "autódromo de junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "autodromo ciudad de junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "autódromo ciudad de junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "parque junin": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "junin circuit": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "junin raceway": {
    "lat": -34.59391,
    "long": -60.94644
  },
  "autodromo nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "autódromo nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "circuito nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "gran premio nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "gp nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "autodromo de nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "autódromo de nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "autodromo ciudad de nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "autódromo ciudad de nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "parque nueve de julio": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "nueve de julio circuit": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "nueve de julio raceway": {
    "lat": -35.44394,
    "long": -60.88463
  },
  "autodromo esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "autódromo esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "circuito esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "gran premio esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "gp esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "autodromo de esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "autódromo de esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "autodromo ciudad de esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "autódromo ciudad de esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "parque esquel": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "esquel circuit": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "esquel raceway": {
    "lat": -42.91147,
    "long": -71.31947
  },
  "autodromo puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "autódromo puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "circuito puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "gran premio puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "gp puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "autodromo de puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "autódromo de puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "autodromo ciudad de puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "autódromo ciudad de puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "parque puerto madryn": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "puerto madryn circuit": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "puerto madryn raceway": {
    "lat": -42.76848,
    "long": -65.03827
  },
  "autodromo bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "autódromo bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "circuito bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "gran premio bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "gp bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "autodromo de bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "autódromo de bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "autodromo ciudad de bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "autódromo ciudad de bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "parque bariloche": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "bariloche circuit": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "bariloche raceway": {
    "lat": -41.14557,
    "long": -71.30822
  },
  "autodromo jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "autódromo jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "circuito jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "gran premio jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "gp jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "autodromo de jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "autódromo de jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "autodromo ciudad de jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "autódromo ciudad de jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "parque jesus maria": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "jesus maria circuit": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "jesus maria raceway": {
    "lat": 21.96111,
    "long": -102.34333
  },
  "autodromo villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "autódromo villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "circuito villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "gran premio villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "gp villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "autodromo de villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "autódromo de villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "autodromo ciudad de villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "autódromo ciudad de villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "parque villa carlos paz": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "villa carlos paz circuit": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "villa carlos paz raceway": {
    "lat": -31.4183,
    "long": -64.49008
  },
  "autodromo san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "autódromo san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "circuito san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "gran premio san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "gp san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "autodromo de san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "autódromo de san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "autodromo ciudad de san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "autódromo ciudad de san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "parque san francisco": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "san francisco circuit": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "san francisco raceway": {
    "lat": 37.77493,
    "long": -122.41942
  },
  "autodromo rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "autódromo rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "circuito rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "gran premio rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "gp rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "autodromo de rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "autódromo de rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "autodromo ciudad de rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "autódromo ciudad de rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "parque rio tercero": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "rio tercero circuit": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "rio tercero raceway": {
    "lat": -32.17675,
    "long": -64.11295
  },
  "autodromo villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "autódromo villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "circuito villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "gran premio villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "gp villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "autodromo de villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "autódromo de villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "autodromo ciudad de villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "autódromo ciudad de villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "parque villa maria": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "villa maria circuit": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "villa maria raceway": {
    "lat": -32.40751,
    "long": -63.24016
  },
  "autodromo cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "autódromo cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "circuito cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "gran premio cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "gp cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "autodromo de cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "autódromo de cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "autodromo ciudad de cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "autódromo ciudad de cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "parque cruz del eje": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "cruz del eje circuit": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "cruz del eje raceway": {
    "lat": -30.72644,
    "long": -64.80387
  },
  "autodromo gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "autódromo gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "circuito gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "gran premio gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "gp gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "autodromo de gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "autódromo de gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "autodromo ciudad de gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "autódromo ciudad de gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "parque gualeguaychu": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "gualeguaychu circuit": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "gualeguaychu raceway": {
    "lat": -33.00777,
    "long": -58.51836
  },
  "autodromo gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "autódromo gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "circuito gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "gran premio gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "gp gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "autodromo de gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "autódromo de gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "autodromo ciudad de gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "autódromo ciudad de gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "parque gualeguay": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "gualeguay circuit": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "gualeguay raceway": {
    "lat": -33.14091,
    "long": -59.31257
  },
  "autodromo villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "autódromo villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "circuito villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "gran premio villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "gp villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "autodromo de villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "autódromo de villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "autodromo ciudad de villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "autódromo ciudad de villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "parque villaguay": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "villaguay circuit": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "villaguay raceway": {
    "lat": -31.86767,
    "long": -59.02701
  },
  "autodromo victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "autódromo victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "circuito victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "gran premio victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "gp victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "autodromo de victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "autódromo de victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "autodromo ciudad de victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "autódromo ciudad de victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "parque victoria": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "victoria circuit": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "victoria raceway": {
    "lat": -20.31944,
    "long": -40.33778
  },
  "autodromo chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "autódromo chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "circuito chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "gran premio chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "gp chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "autodromo de chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "autódromo de chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "autodromo ciudad de chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "autódromo ciudad de chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "parque chajari": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "chajari circuit": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "chajari raceway": {
    "lat": -30.75482,
    "long": -57.98196
  },
  "autodromo paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "autódromo paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "circuito paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "gran premio paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "gp paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "autodromo de paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "autódromo de paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "autodromo ciudad de paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "autódromo ciudad de paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "parque paso de los libres": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "paso de los libres circuit": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "paso de los libres raceway": {
    "lat": -29.71251,
    "long": -57.08771
  },
  "autodromo goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "autódromo goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "circuito goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "gran premio goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "gp goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "autodromo de goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "autódromo de goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "autodromo ciudad de goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "autódromo ciudad de goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "parque goya": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "goya circuit": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "goya raceway": {
    "lat": -29.13995,
    "long": -59.26343
  },
  "autodromo curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "autódromo curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "circuito curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "gran premio curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "gp curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "autodromo de curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "autódromo de curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "autodromo ciudad de curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "autódromo ciudad de curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "parque curuzu cuatia": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "curuzu cuatia circuit": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "curuzu cuatia raceway": {
    "lat": -29.79145,
    "long": -58.0499
  },
  "autodromo eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "autódromo eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "circuito eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "gran premio eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "gp eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "autodromo de eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "autódromo de eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "autodromo ciudad de eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "autódromo ciudad de eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "parque eldorado": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "eldorado circuit": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "eldorado raceway": {
    "lat": 33.20763,
    "long": -92.66627
  },
  "autodromo iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "autódromo iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "circuito iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "gran premio iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "gp iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "autodromo de iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "autódromo de iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "autodromo ciudad de iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "autódromo ciudad de iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "parque iguazu": {
    "lat": -21.06667,
    "long": -63.1
  },
  "iguazu circuit": {
    "lat": -21.06667,
    "long": -63.1
  },
  "iguazu raceway": {
    "lat": -21.06667,
    "long": -63.1
  },
  "autodromo roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "autódromo roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "circuito roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "gran premio roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "gp roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "autodromo de roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "autódromo de roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "autodromo ciudad de roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "autódromo ciudad de roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "parque roque saenz peña": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "roque saenz peña circuit": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "roque saenz peña raceway": {
    "lat": -26.79095,
    "long": -60.44132
  },
  "autodromo apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "autódromo apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "circuito apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "gran premio apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "gp apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "autodromo de apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "autódromo de apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "autodromo ciudad de apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "autódromo ciudad de apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "parque apóstoles": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "apóstoles circuit": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "apóstoles raceway": {
    "lat": -27.91421,
    "long": -55.75355
  },
  "autodromo villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "autódromo villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "circuito villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "gran premio villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "gp villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "autodromo de villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "autódromo de villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "autodromo ciudad de villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "autódromo ciudad de villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "parque villa angela": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "villa angela circuit": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "villa angela raceway": {
    "lat": -27.57679,
    "long": -60.71114
  },
  "autodromo charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "autódromo charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "circuito charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "gran premio charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "gp charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "autodromo de charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "autódromo de charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "autodromo ciudad de charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "autódromo ciudad de charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "parque charata": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "charata circuit": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "charata raceway": {
    "lat": -27.21787,
    "long": -61.18738
  },
  "autodromo tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "autódromo tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "circuito tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "gran premio tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "gp tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "autodromo de tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "autódromo de tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "autodromo ciudad de tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "autódromo ciudad de tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "parque tartagal": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "tartagal circuit": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "tartagal raceway": {
    "lat": -22.51682,
    "long": -63.8056
  },
  "autodromo clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "autódromo clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "circuito clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "gran premio clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "gp clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "autodromo de clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "autódromo de clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "autodromo ciudad de clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "autódromo ciudad de clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "parque clorinda": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "clorinda circuit": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "clorinda raceway": {
    "lat": -25.28627,
    "long": -57.72168
  },
  "autodromo pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "autódromo pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "circuito pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "gran premio pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "gp pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "autodromo de pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "autódromo de pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "autodromo ciudad de pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "autódromo ciudad de pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "parque pirane": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "pirane circuit": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "pirane raceway": {
    "lat": -25.73271,
    "long": -59.10989
  },
  "autodromo oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "autódromo oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "circuito oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "gran premio oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "gp oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "autodromo de oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "autódromo de oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "autodromo ciudad de oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "autódromo ciudad de oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "parque oran": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "oran circuit": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "oran raceway": {
    "lat": 35.69906,
    "long": -0.63588
  },
  "autodromo rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "autódromo rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "circuito rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "gran premio rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "gp rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "autodromo de rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "autódromo de rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "autodromo ciudad de rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "autódromo ciudad de rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "parque rosario de la frontera": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "rosario de la frontera circuit": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "rosario de la frontera raceway": {
    "lat": -25.79856,
    "long": -64.97386
  },
  "autodromo ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "autódromo ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "circuito ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "gran premio ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "gp ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "autodromo de ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "autódromo de ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "autodromo ciudad de ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "autódromo ciudad de ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "parque ledesma": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "ledesma circuit": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "ledesma raceway": {
    "lat": 41.08829,
    "long": -6.00178
  },
  "autodromo metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "autódromo metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "circuito metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "gran premio metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "gp metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "autodromo de metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "autódromo de metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "autodromo ciudad de metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "autódromo ciudad de metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "parque metan": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "metan circuit": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "metan raceway": {
    "lat": -25.49711,
    "long": -64.97106
  },
  "autodromo perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "autódromo perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "circuito perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "gran premio perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "gp perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "autodromo de perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "autódromo de perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "autodromo ciudad de perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "autódromo ciudad de perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "parque perico": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "perico circuit": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "perico raceway": {
    "lat": 36.45169,
    "long": -103.1841
  },
  "autodromo palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "autódromo palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "circuito palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "gran premio palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "gp palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "autodromo de palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "autódromo de palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "autodromo ciudad de palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "autódromo ciudad de palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "parque palpala": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "palpala circuit": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "palpala raceway": {
    "lat": -24.25798,
    "long": -65.21358
  },
  "autodromo banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "autódromo banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "circuito banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "gran premio banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "gp banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "autodromo de banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "autódromo de banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "autodromo ciudad de banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "autódromo ciudad de banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "parque banda del rio sali": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "banda del rio sali circuit": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "banda del rio sali raceway": {
    "lat": -26.84031,
    "long": -65.16285
  },
  "autodromo tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "autódromo tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "circuito tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "gran premio tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "gp tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "autodromo de tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "autódromo de tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "autodromo ciudad de tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "autódromo ciudad de tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "parque tafi viejo": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "tafi viejo circuit": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "tafi viejo raceway": {
    "lat": -26.7333,
    "long": -65.26146
  },
  "autodromo monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "autódromo monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "circuito monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "gran premio monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "gp monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "autodromo de monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "autódromo de monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "autodromo ciudad de monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "autódromo ciudad de monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "parque monteros": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "monteros circuit": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "monteros raceway": {
    "lat": -27.16825,
    "long": -65.49892
  },
  "autodromo frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "autódromo frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "circuito frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "gran premio frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "gp frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "autodromo de frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "autódromo de frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "autodromo ciudad de frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "autódromo ciudad de frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "parque frias": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "frias circuit": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "frias raceway": {
    "lat": 42.76225,
    "long": -3.29394
  },
  "autodromo termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "autódromo termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "circuito termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "gran premio termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "gp termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "autodromo de termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "autódromo de termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "autodromo ciudad de termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "autódromo ciudad de termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "parque termas": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "termas circuit": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "termas raceway": {
    "lat": -7.1053,
    "long": 110.7467
  },
  "autodromo añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "autódromo añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "circuito añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "gran premio añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "gp añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "autodromo de añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "autódromo de añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "autodromo ciudad de añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "autódromo ciudad de añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "parque añatuya": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "añatuya circuit": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "añatuya raceway": {
    "lat": -28.4602,
    "long": -62.83354
  },
  "autodromo chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "autódromo chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "circuito chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "gran premio chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "gp chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "autodromo de chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "autódromo de chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "autodromo ciudad de chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "autódromo ciudad de chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "parque chilecito": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "chilecito circuit": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "chilecito raceway": {
    "lat": -29.16163,
    "long": -67.49934
  },
  "autodromo aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "autódromo aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "circuito aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "gran premio aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "gp aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "autodromo de aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "autódromo de aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "autodromo ciudad de aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "autódromo ciudad de aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "parque aimogasta": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "aimogasta circuit": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "aimogasta raceway": {
    "lat": -28.56003,
    "long": -66.80737
  },
  "autodromo chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "autódromo chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "circuito chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "gran premio chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "gp chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "autodromo de chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "autódromo de chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "autodromo ciudad de chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "autódromo ciudad de chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "parque chamical": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "chamical circuit": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "chamical raceway": {
    "lat": -30.35942,
    "long": -66.31387
  },
  "autodromo andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "autódromo andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "circuito andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "gran premio andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "gp andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "autodromo de andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "autódromo de andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "autodromo ciudad de andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "autódromo ciudad de andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "parque andalgala": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "andalgala circuit": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "andalgala raceway": {
    "lat": -27.58185,
    "long": -66.31626
  },
  "autodromo belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "autódromo belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "circuito belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "gran premio belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "gp belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "autodromo de belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "autódromo de belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "autodromo ciudad de belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "autódromo ciudad de belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "parque belen": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "belen circuit": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "belen raceway": {
    "lat": 31.70487,
    "long": 35.20376
  },
  "autodromo tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "autódromo tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "circuito tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "gran premio tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "gp tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "autodromo de tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "autódromo de tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "autodromo ciudad de tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "autódromo ciudad de tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "parque tinogasta": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "tinogasta circuit": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "tinogasta raceway": {
    "lat": -28.06556,
    "long": -67.56437
  },
  "autodromo caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "autódromo caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "circuito caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "gran premio caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "gp caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "autodromo de caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "autódromo de caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "autodromo ciudad de caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "autódromo ciudad de caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "parque caucete": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "caucete circuit": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "caucete raceway": {
    "lat": -31.6515,
    "long": -68.28216
  },
  "autodromo chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "autódromo chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "circuito chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "gran premio chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "gp chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "autodromo de chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "autódromo de chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "autodromo ciudad de chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "autódromo ciudad de chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "parque chimbas": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "chimbas circuit": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "chimbas raceway": {
    "lat": -31.49313,
    "long": -68.53263
  },
  "autodromo rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "autódromo rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "circuito rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "gran premio rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "gp rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "autodromo de rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "autódromo de rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "autodromo ciudad de rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "autódromo ciudad de rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "parque rawson": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "rawson circuit": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "rawson raceway": {
    "lat": -43.30031,
    "long": -65.10564
  },
  "autodromo general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "autódromo general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "circuito general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "gran premio general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "gp general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "autodromo de general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "autódromo de general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "autodromo ciudad de general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "autódromo ciudad de general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "parque general pico": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "general pico circuit": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "general pico raceway": {
    "lat": -35.6593,
    "long": -63.75787
  },
  "autodromo macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "autódromo macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "circuito macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "gran premio macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "gp macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "autodromo de macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "autódromo de macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "autodromo ciudad de macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "autódromo ciudad de macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "parque macachin": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "macachin circuit": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "macachin raceway": {
    "lat": -37.13698,
    "long": -63.66674
  },
  "autodromo victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "autódromo victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "circuito victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "gran premio victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "gp victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "autodromo de victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "autódromo de victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "autodromo ciudad de victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "autódromo ciudad de victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "parque victorica": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "victorica circuit": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "victorica raceway": {
    "lat": -36.21654,
    "long": -65.43709
  },
  "autodromo choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "autódromo choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "circuito choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "gran premio choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "gp choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "autodromo de choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "autódromo de choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "autodromo ciudad de choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "autódromo ciudad de choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "parque choele choel": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "choele choel circuit": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "choele choel raceway": {
    "lat": -39.28941,
    "long": -65.6606
  },
  "autodromo villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "autódromo villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "circuito villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "gran premio villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "gp villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "autodromo de villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "autódromo de villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "autodromo ciudad de villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "autódromo ciudad de villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "parque villa regina": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "villa regina circuit": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "villa regina raceway": {
    "lat": -39.09631,
    "long": -67.08374
  },
  "autodromo allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "autódromo allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "circuito allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "gran premio allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "gp allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "autodromo de allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "autódromo de allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "autodromo ciudad de allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "autódromo ciudad de allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "parque allen": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "allen circuit": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "allen raceway": {
    "lat": 33.10317,
    "long": -96.67055
  },
  "autodromo cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "autódromo cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "circuito cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "gran premio cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "gp cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "autodromo de cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "autódromo de cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "autodromo ciudad de cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "autódromo ciudad de cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "parque cipolletti": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "cipolletti circuit": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "cipolletti raceway": {
    "lat": -38.93392,
    "long": -67.99032
  },
  "autodromo zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "autódromo zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "circuito zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "gran premio zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "gp zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "autodromo de zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "autódromo de zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "autodromo ciudad de zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "autódromo ciudad de zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "parque zapala": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "zapala circuit": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "zapala raceway": {
    "lat": -38.90056,
    "long": -70.06674
  },
  "autodromo cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "autódromo cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "circuito cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "gran premio cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "gp cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "autodromo de cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "autódromo de cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "autodromo ciudad de cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "autódromo ciudad de cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "parque cinco saltos": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "cinco saltos circuit": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "cinco saltos raceway": {
    "lat": -38.82225,
    "long": -68.06293
  },
  "autodromo catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "autódromo catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "circuito catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "gran premio catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "gp catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "autodromo de catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "autódromo de catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "autodromo ciudad de catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "autódromo ciudad de catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "parque catriel": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "catriel circuit": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "catriel raceway": {
    "lat": -37.87552,
    "long": -67.79451
  },
  "autodromo cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "autódromo cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "circuito cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "gran premio cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "gp cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "autodromo de cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "autódromo de cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "autodromo ciudad de cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "autódromo ciudad de cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "parque cutral co": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "cutral co circuit": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "cutral co raceway": {
    "lat": -38.9397,
    "long": -69.2646
  },
  "autodromo plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "autódromo plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "circuito plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "gran premio plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "gp plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "autodromo de plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "autódromo de plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "autodromo ciudad de plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "autódromo ciudad de plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "parque plaza huincul": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "plaza huincul circuit": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "plaza huincul raceway": {
    "lat": -38.93012,
    "long": -69.20778
  },
  "autodromo caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "autódromo caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "circuito caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "gran premio caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "gp caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "autodromo de caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "autódromo de caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "autodromo ciudad de caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "autódromo ciudad de caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "parque caleta olivia": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "caleta olivia circuit": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "caleta olivia raceway": {
    "lat": -46.44785,
    "long": -67.52274
  },
  "autodromo san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "autódromo san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "circuito san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "gran premio san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "gp san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "autodromo de san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "autódromo de san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "autodromo ciudad de san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "autódromo ciudad de san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "parque san martin de los andes": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "san martin de los andes circuit": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "san martin de los andes raceway": {
    "lat": -40.15789,
    "long": -71.35337
  },
  "autodromo puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "autódromo puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "circuito puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "gran premio puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "gp puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "autodromo de puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "autódromo de puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "autodromo ciudad de puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "autódromo ciudad de puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "parque puerto deseado": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "puerto deseado circuit": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "puerto deseado raceway": {
    "lat": -47.75131,
    "long": -65.89674
  },
  "autodromo pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "autódromo pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "circuito pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "gran premio pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "gp pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "autodromo de pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "autódromo de pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "autodromo ciudad de pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "autódromo ciudad de pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "parque pico truncado": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "pico truncado circuit": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "pico truncado raceway": {
    "lat": -46.79942,
    "long": -67.95785
  },
  "autodromo rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "autódromo rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "circuito rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "gran premio rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "gp rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "autodromo de rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "autódromo de rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "autodromo ciudad de rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "autódromo ciudad de rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "parque rio grande": {
    "lat": -32.035,
    "long": -52.09861
  },
  "rio grande circuit": {
    "lat": -32.035,
    "long": -52.09861
  },
  "rio grande raceway": {
    "lat": -32.035,
    "long": -52.09861
  },
  "autodromo rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "autódromo rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "circuito rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "gran premio rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "gp rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "autodromo de rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "autódromo de rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "autodromo ciudad de rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "autódromo ciudad de rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "parque rio turbio": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "rio turbio circuit": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "rio turbio raceway": {
    "lat": -51.53642,
    "long": -72.33786
  },
  "autodromo ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "autódromo ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "circuito ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "gran premio ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "gp ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "autodromo de ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "autódromo de ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "autodromo ciudad de ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "autódromo ciudad de ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "parque ushuaia": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "ushuaia circuit": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "ushuaia raceway": {
    "lat": -54.81084,
    "long": -68.31591
  },
  "autodromo azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "autódromo azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "circuito azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "gran premio azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "gp azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "autodromo de azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "autódromo de azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "autodromo ciudad de azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "autódromo ciudad de azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "parque azul": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "azul circuit": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "azul raceway": {
    "lat": -36.77803,
    "long": -59.85848
  },
  "autodromo tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "autódromo tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "circuito tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "gran premio tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "gp tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "autodromo de tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "autódromo de tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "autodromo ciudad de tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "autódromo ciudad de tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "parque tolhuin": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "tolhuin circuit": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "tolhuin raceway": {
    "lat": -54.51083,
    "long": -67.1955
  },
  "autodromo tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "autódromo tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "circuito tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "gran premio tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "gp tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "autodromo de tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "autódromo de tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "autodromo ciudad de tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "autódromo ciudad de tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "parque tres arroyos": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "tres arroyos circuit": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "tres arroyos raceway": {
    "lat": -38.37694,
    "long": -60.27563
  },
  "autodromo tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "autódromo tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "circuito tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "gran premio tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "gp tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "autodromo de tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "autódromo de tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "autodromo ciudad de tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "autódromo ciudad de tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "parque tandil": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "tandil circuit": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "tandil raceway": {
    "lat": -37.3287,
    "long": -59.1369
  },
  "autodromo necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "autódromo necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "circuito necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "gran premio necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "gp necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "autodromo de necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "autódromo de necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "autodromo ciudad de necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "autódromo ciudad de necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "parque necochea": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "necochea circuit": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "necochea raceway": {
    "lat": -38.5545,
    "long": -58.73961
  },
  "autodromo coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "autódromo coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "circuito coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "gran premio coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "gp coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "autodromo de coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "autódromo de coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "autodromo ciudad de coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "autódromo ciudad de coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "parque coronel suarez": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "coronel suarez circuit": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "coronel suarez raceway": {
    "lat": -37.45859,
    "long": -61.93294
  },
  "autodromo pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "autódromo pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "circuito pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "gran premio pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "gp pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "autodromo de pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "autódromo de pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "autodromo ciudad de pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "autódromo ciudad de pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "parque pehuajo": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "pehuajo circuit": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "pehuajo raceway": {
    "lat": -35.81081,
    "long": -61.89897
  },
  "autodromo trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "autódromo trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "circuito trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "gran premio trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "gp trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "autodromo de trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "autódromo de trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "autodromo ciudad de trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "autódromo ciudad de trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "parque trenque lauquen": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "trenque lauquen circuit": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "trenque lauquen raceway": {
    "lat": -35.97334,
    "long": -62.73275
  },
  "autodromo coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "autódromo coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "circuito coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "gran premio coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "gp coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "autodromo de coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "autódromo de coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "autodromo ciudad de coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "autódromo ciudad de coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "parque coronel pringles": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "coronel pringles circuit": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "coronel pringles raceway": {
    "lat": -37.98567,
    "long": -61.3504
  },
  "autodromo chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "autódromo chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "circuito chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "gran premio chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "gp chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "autodromo de chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "autódromo de chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "autodromo ciudad de chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "autódromo ciudad de chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "parque chivilcoy": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "chivilcoy circuit": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "chivilcoy raceway": {
    "lat": -34.8969,
    "long": -60.01909
  },
  "autodromo chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "autódromo chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "circuito chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "gran premio chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "gp chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "autodromo de chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "autódromo de chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "autodromo ciudad de chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "autódromo ciudad de chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "parque chacabuco": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "chacabuco circuit": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "chacabuco raceway": {
    "lat": -34.64203,
    "long": -60.47124
  },
  "autodromo bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "autódromo bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "circuito bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "gran premio bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "gp bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "autodromo de bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "autódromo de bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "autodromo ciudad de bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "autódromo ciudad de bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "parque bragado": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "bragado circuit": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "bragado raceway": {
    "lat": -35.11557,
    "long": -60.48965
  },
  "autodromo las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "autódromo las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "circuito las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "gran premio las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "gp las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "autodromo de las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "autódromo de las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "autodromo ciudad de las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "autódromo ciudad de las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "parque las flores": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "las flores circuit": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "las flores raceway": {
    "lat": -36.01427,
    "long": -59.09986
  },
  "autodromo lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "autódromo lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "circuito lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "gran premio lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "gp lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "autodromo de lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "autódromo de lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "autodromo ciudad de lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "autódromo ciudad de lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "parque lincoln": {
    "lat": 40.8,
    "long": -96.66696
  },
  "lincoln circuit": {
    "lat": 40.8,
    "long": -96.66696
  },
  "lincoln raceway": {
    "lat": 40.8,
    "long": -96.66696
  },
  "autodromo saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "autódromo saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "circuito saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "gran premio saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "gp saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "autodromo de saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "autódromo de saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "autodromo ciudad de saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "autódromo ciudad de saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "parque saladillo": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "saladillo circuit": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "saladillo raceway": {
    "lat": -35.63884,
    "long": -59.77938
  },
  "autodromo dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "autódromo dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "circuito dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "gran premio dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "gp dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "autodromo de dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "autódromo de dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "autodromo ciudad de dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "autódromo ciudad de dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "parque dolores": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "dolores circuit": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "dolores raceway": {
    "lat": 38.14002,
    "long": -0.77088
  },
  "autodromo chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "autódromo chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "circuito chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "gran premio chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "gp chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "autodromo de chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "autódromo de chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "autodromo ciudad de chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "autódromo ciudad de chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "parque chascomus": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "chascomus circuit": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "chascomus raceway": {
    "lat": -35.57681,
    "long": -58.01215
  },
  "autodromo lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "autódromo lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "circuito lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "gran premio lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "gp lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "autodromo de lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "autódromo de lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "autodromo ciudad de lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "autódromo ciudad de lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "parque lobos": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "lobos circuit": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "lobos raceway": {
    "lat": -35.18537,
    "long": -59.09788
  },
  "autodromo mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "autódromo mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "circuito mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "gran premio mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "gp mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "autodromo de mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "autódromo de mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "autodromo ciudad de mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "autódromo ciudad de mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "parque mercedes ba": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "mercedes ba circuit": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "mercedes ba raceway": {
    "lat": 20.93472,
    "long": -89.62444
  },
  "autodromo lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "autódromo lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "circuito lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "gran premio lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "gp lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "autodromo de lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "autódromo de lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "autodromo ciudad de lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "autódromo ciudad de lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "parque lujan": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "lujan circuit": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "lujan raceway": {
    "lat": -34.5664,
    "long": -59.11478
  },
  "autodromo campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "autódromo campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "circuito campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "gran premio campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "gp campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "autodromo de campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "autódromo de campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "autodromo ciudad de campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "autódromo ciudad de campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "parque campana": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "campana circuit": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "campana raceway": {
    "lat": -34.16327,
    "long": -58.95919
  },
  "autodromo zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "autódromo zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "circuito zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "gran premio zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "gp zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "autodromo de zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "autódromo de zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "autodromo ciudad de zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "autódromo ciudad de zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "parque zarate": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "zarate circuit": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "zarate raceway": {
    "lat": -34.09584,
    "long": -59.02423
  },
  "autodromo ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "autódromo ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "circuito ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "gran premio ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "gp ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "autodromo de ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "autódromo de ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "autodromo ciudad de ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "autódromo ciudad de ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "parque ramallo": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "ramallo circuit": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "ramallo raceway": {
    "lat": -33.48508,
    "long": -60.00629
  },
  "autodromo san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "autódromo san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "circuito san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "gran premio san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "gp san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "autodromo de san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "autódromo de san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "autodromo ciudad de san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "autódromo ciudad de san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "parque san pedro ba": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "san pedro ba circuit": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "san pedro ba raceway": {
    "lat": 18.78303,
    "long": -102.05216
  },
  "autodromo baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "autódromo baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "circuito baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "gran premio baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "gp baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "autodromo de baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "autódromo de baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "autodromo ciudad de baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "autódromo ciudad de baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "parque baradero": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "baradero circuit": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "baradero raceway": {
    "lat": -33.81199,
    "long": -59.50467
  },
  "autodromo pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "autódromo pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "circuito pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "gran premio pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "gp pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "autodromo de pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "autódromo de pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "autodromo ciudad de pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "autódromo ciudad de pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "parque pergamino": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "pergamino circuit": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "pergamino raceway": {
    "lat": -33.89101,
    "long": -60.57462
  },
  "autodromo salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "autódromo salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "circuito salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "gran premio salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "gp salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "autodromo de salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "autódromo de salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "autodromo ciudad de salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "autódromo ciudad de salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "parque salto": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "salto circuit": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "salto raceway": {
    "lat": -23.20083,
    "long": -47.28694
  },
  "autodromo arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "autódromo arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "circuito arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "gran premio arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "gp arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "autodromo de arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "autódromo de arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "autodromo ciudad de arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "autódromo ciudad de arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "parque arrecifes": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "arrecifes circuit": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "arrecifes raceway": {
    "lat": -34.06306,
    "long": -60.10261
  },
  "autodromo rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "autódromo rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "circuito rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "gran premio rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "gp rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "autodromo de rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "autódromo de rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "autodromo ciudad de rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "autódromo ciudad de rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "parque rojas": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "rojas circuit": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "rojas raceway": {
    "lat": 42.57781,
    "long": -3.44195
  },
  "autodromo san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "autódromo san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "circuito san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "gran premio san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "gp san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "autodromo de san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "autódromo de san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "autodromo ciudad de san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "autódromo ciudad de san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "parque san antonio de areco": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "san antonio de areco circuit": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "san antonio de areco raceway": {
    "lat": -34.25083,
    "long": -59.46944
  },
  "autodromo capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "autódromo capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "circuito capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "gran premio capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "gp capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "autodromo de capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "autódromo de capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "autodromo ciudad de capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "autódromo ciudad de capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "parque capilla del señor": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "capilla del señor circuit": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "capilla del señor raceway": {
    "lat": -34.29169,
    "long": -59.10126
  },
  "autodromo avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "autódromo avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "circuito avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "gran premio avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "gp avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "autodromo de avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "autódromo de avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "autodromo ciudad de avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "autódromo ciudad de avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "parque avellaneda": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "avellaneda circuit": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "avellaneda raceway": {
    "lat": 40.38909,
    "long": -5.38811
  },
  "autodromo lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "autódromo lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "circuito lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "gran premio lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "gp lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "autodromo de lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "autódromo de lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "autodromo ciudad de lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "autódromo ciudad de lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "parque lanus": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "lanus circuit": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "lanus raceway": {
    "lat": -34.70757,
    "long": -58.39132
  },
  "autodromo quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "autódromo quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "circuito quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "gran premio quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "gp quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "autodromo de quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "autódromo de quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "autodromo ciudad de quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "autódromo ciudad de quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "parque quilmes": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "quilmes circuit": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "quilmes raceway": {
    "lat": -34.72065,
    "long": -58.25454
  },
  "autodromo berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "autódromo berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "circuito berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "gran premio berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "gp berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "autodromo de berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "autódromo de berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "autodromo ciudad de berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "autódromo ciudad de berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "parque berazategui": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "berazategui circuit": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "berazategui raceway": {
    "lat": -34.76531,
    "long": -58.21278
  },
  "autodromo ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "autódromo ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "circuito ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "gran premio ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "gp ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "autodromo de ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "autódromo de ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "autodromo ciudad de ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "autódromo ciudad de ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "parque ezeiza": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "ezeiza circuit": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "ezeiza raceway": {
    "lat": -34.8544,
    "long": -58.52474
  },
  "autodromo almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "autódromo almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "circuito almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "gran premio almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "gp almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "autodromo de almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "autódromo de almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "autodromo ciudad de almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "autódromo ciudad de almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "parque almirante brown": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "almirante brown circuit": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "almirante brown raceway": {
    "lat": -34.79799,
    "long": -58.38441
  },
  "autodromo la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "autódromo la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "circuito la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "gran premio la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "gp la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "autodromo de la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "autódromo de la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "autodromo ciudad de la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "autódromo ciudad de la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "parque la matanza": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "la matanza circuit": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "la matanza raceway": {
    "lat": -5.21334,
    "long": -80.09149
  },
  "autodromo moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "autódromo moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "circuito moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "gran premio moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "gp moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "autodromo de moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "autódromo de moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "autodromo ciudad de moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "autódromo ciudad de moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "parque moron": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "moron circuit": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "moron raceway": {
    "lat": -34.65118,
    "long": -58.62205
  },
  "autodromo moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "autódromo moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "circuito moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "gran premio moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "gp moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "autodromo de moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "autódromo de moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "autodromo ciudad de moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "autódromo ciudad de moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "parque moreno": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "moreno circuit": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "moreno raceway": {
    "lat": 5.88148,
    "long": -71.89167
  },
  "autodromo ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "autódromo ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "circuito ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "gran premio ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "gp ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "autodromo de ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "autódromo de ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "autodromo ciudad de ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "autódromo ciudad de ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "parque ituzaingo": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "ituzaingo circuit": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "ituzaingo raceway": {
    "lat": -27.58504,
    "long": -56.68707
  },
  "autodromo general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "autódromo general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "circuito general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "gran premio general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "gp general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "autodromo de general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "autódromo de general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "autodromo ciudad de general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "autódromo ciudad de general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "parque general rodriguez": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "general rodriguez circuit": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "general rodriguez raceway": {
    "lat": -34.60658,
    "long": -58.95221
  },
  "autodromo lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "autódromo lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "circuito lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "gran premio lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "gp lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "autodromo de lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "autódromo de lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "autodromo ciudad de lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "autódromo ciudad de lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "parque lomas de zamora": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "lomas de zamora circuit": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "lomas de zamora raceway": {
    "lat": -34.7574,
    "long": -58.40279
  },
  "autodromo tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "autódromo tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "circuito tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "gran premio tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "gp tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "autodromo de tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "autódromo de tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "autodromo ciudad de tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "autódromo ciudad de tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "parque tigre": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "tigre circuit": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "tigre raceway": {
    "lat": -3.43944,
    "long": -39.14833
  },
  "autodromo san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "autódromo san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "circuito san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "gran premio san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "gp san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "autodromo de san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "autódromo de san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "autodromo ciudad de san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "autódromo ciudad de san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "parque san vicente": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "san vicente circuit": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "san vicente raceway": {
    "lat": 13.64114,
    "long": -88.78459
  },
  "autodromo cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "autódromo cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "circuito cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "gran premio cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "gp cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "autodromo de cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "autódromo de cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "autodromo ciudad de cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "autódromo ciudad de cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "parque cañuelas": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "cañuelas circuit": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "cañuelas raceway": {
    "lat": -35.05379,
    "long": -58.76205
  },
  "autodromo san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "autódromo san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "circuito san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "gran premio san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "gp san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "autodromo de san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "autódromo de san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "autodromo ciudad de san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "autódromo ciudad de san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "parque san fernando": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "san fernando circuit": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "san fernando raceway": {
    "lat": 15.03425,
    "long": 120.68445
  },
  "autodromo san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "autódromo san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "circuito san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "gran premio san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "gp san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "autodromo de san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "autódromo de san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "autodromo ciudad de san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "autódromo ciudad de san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "parque san isidro": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "san isidro circuit": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "san isidro raceway": {
    "lat": -34.46971,
    "long": -58.52111
  },
  "autodromo vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "autódromo vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "circuito vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "gran premio vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "gp vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "autodromo de vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "autódromo de vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "autodromo ciudad de vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "autódromo ciudad de vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "parque vicente lopez": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "vicente lopez circuit": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "vicente lopez raceway": {
    "lat": -34.52947,
    "long": -58.4737
  },
  "autodromo san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "autódromo san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "circuito san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "gran premio san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "gp san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "autodromo de san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "autódromo de san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "autodromo ciudad de san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "autódromo ciudad de san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "parque san martin ba": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "san martin ba circuit": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "san martin ba raceway": {
    "lat": -68.13004,
    "long": -67.10131
  },
  "autodromo tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "autódromo tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "circuito tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "gran premio tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "gp tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "autodromo de tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "autódromo de tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "autodromo ciudad de tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "autódromo ciudad de tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "parque tres de febrero": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "tres de febrero circuit": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "tres de febrero raceway": {
    "lat": 9.58102,
    "long": -70.97904
  },
  "autodromo hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "autódromo hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "circuito hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "gran premio hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "gp hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "autodromo de hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "autódromo de hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "autodromo ciudad de hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "autódromo ciudad de hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "parque hurlingham": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "hurlingham circuit": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "hurlingham raceway": {
    "lat": -34.5904,
    "long": -58.62904
  },
  "autodromo san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "autódromo san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "circuito san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "gran premio san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "gp san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "autodromo de san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "autódromo de san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "autodromo ciudad de san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "autódromo ciudad de san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "parque san miguel": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "san miguel circuit": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "san miguel raceway": {
    "lat": 9.05032,
    "long": -79.47068
  },
  "autodromo pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "autódromo pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "circuito pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "gran premio pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "gp pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "autodromo de pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "autódromo de pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "autodromo ciudad de pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "autódromo ciudad de pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "parque pilar": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "pilar circuit": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "pilar raceway": {
    "lat": -34.45867,
    "long": -58.91398
  },
  "autodromo malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "autódromo malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "circuito malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "gran premio malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "gp malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "autodromo de malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "autódromo de malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "autodromo ciudad de malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "autódromo ciudad de malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "parque malvinas argentinas": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "malvinas argentinas circuit": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "malvinas argentinas raceway": {
    "lat": -31.38194,
    "long": -64.05545
  },
  "autodromo escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "autódromo escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "circuito escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "gran premio escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "gp escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "autodromo de escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "autódromo de escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "autodromo ciudad de escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "autódromo ciudad de escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "parque escobar": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "escobar circuit": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "escobar raceway": {
    "lat": 41.09079,
    "long": -4.13117
  },
  "autodromo zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "autódromo zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "circuito zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "gran premio zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "gp zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "autodromo de zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "autódromo de zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "autodromo ciudad de zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "autódromo ciudad de zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "parque zavalla": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "zavalla circuit": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "zavalla raceway": {
    "lat": 31.15852,
    "long": -94.42631
  },
  "autodromo cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "autódromo cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "circuito cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "gran premio cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "gp cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "autodromo de cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "autódromo de cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "autodromo ciudad de cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "autódromo ciudad de cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "parque cañada de gomez": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "cañada de gomez circuit": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "cañada de gomez raceway": {
    "lat": -32.82033,
    "long": -61.39513
  },
  "autodromo venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "autódromo venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "circuito venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "gran premio venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "gp venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "autodromo de venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "autódromo de venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "autodromo ciudad de venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "autódromo ciudad de venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "parque venado tuerto": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "venado tuerto circuit": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "venado tuerto raceway": {
    "lat": -33.74585,
    "long": -61.96711
  },
  "autodromo casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "autódromo casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "circuito casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "gran premio casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "gp casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "autodromo de casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "autódromo de casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "autodromo ciudad de casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "autódromo ciudad de casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "parque casilda": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "casilda circuit": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "casilda raceway": {
    "lat": -33.04459,
    "long": -61.16423
  },
  "autodromo las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "autódromo las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "circuito las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "gran premio las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "gp las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "autodromo de las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "autódromo de las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "autodromo ciudad de las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "autódromo ciudad de las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "parque las parejas": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "las parejas circuit": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "las parejas raceway": {
    "lat": -32.68478,
    "long": -61.51637
  },
  "autodromo el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "autódromo el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "circuito el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "gran premio el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "gp el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "autodromo de el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "autódromo de el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "autodromo ciudad de el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "autódromo ciudad de el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "parque el trebol": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "el trebol circuit": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "el trebol raceway": {
    "lat": -32.19857,
    "long": -61.70208
  },
  "autodromo las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "autódromo las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "circuito las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "gran premio las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "gp las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "autodromo de las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "autódromo de las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "autodromo ciudad de las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "autódromo ciudad de las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "parque las rosas": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "las rosas circuit": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "las rosas raceway": {
    "lat": 16.36554,
    "long": -92.37063
  },
  "autodromo armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "autódromo armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "circuito armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "gran premio armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "gp armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "autodromo de armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "autódromo de armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "autodromo ciudad de armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "autódromo ciudad de armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "parque armstrong": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "armstrong circuit": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "armstrong raceway": {
    "lat": 43.39607,
    "long": -94.47831
  },
  "autodromo sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "autódromo sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "circuito sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "gran premio sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "gp sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "autodromo de sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "autódromo de sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "autodromo ciudad de sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "autódromo ciudad de sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "parque sunchales": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "sunchales circuit": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "sunchales raceway": {
    "lat": -30.94478,
    "long": -61.5597
  },
  "autodromo esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "autódromo esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "circuito esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "gran premio esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "gp esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "autodromo de esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "autódromo de esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "autodromo ciudad de esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "autódromo ciudad de esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "parque esperanza": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "esperanza circuit": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "esperanza raceway": {
    "lat": -31.44957,
    "long": -60.93153
  },
  "autodromo reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "autódromo reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "circuito reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "gran premio reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "gp reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "autodromo de reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "autódromo de reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "autodromo ciudad de reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "autódromo ciudad de reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "parque reconquista": {
    "lat": -29.15,
    "long": -59.65
  },
  "reconquista circuit": {
    "lat": -29.15,
    "long": -59.65
  },
  "reconquista raceway": {
    "lat": -29.15,
    "long": -59.65
  },
  "autodromo vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "autódromo vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "circuito vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "gran premio vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "gp vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "autodromo de vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "autódromo de vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "autodromo ciudad de vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "autódromo ciudad de vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "parque vera": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "vera circuit": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "vera raceway": {
    "lat": 37.24345,
    "long": -1.85905
  },
  "autodromo san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "autódromo san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "circuito san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "gran premio san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "gp san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "autodromo de san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "autódromo de san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "autodromo ciudad de san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "autódromo ciudad de san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "parque san javier": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "san javier circuit": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "san javier raceway": {
    "lat": 37.80626,
    "long": -0.83736
  },
  "autodromo gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "autódromo gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "circuito gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "gran premio gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "gp gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "autodromo de gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "autódromo de gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "autodromo ciudad de gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "autódromo ciudad de gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "parque gobernador virasoro": {
    "lat": -28.05,
    "long": -56.03333
  },
  "gobernador virasoro circuit": {
    "lat": -28.05,
    "long": -56.03333
  },
  "gobernador virasoro raceway": {
    "lat": -28.05,
    "long": -56.03333
  },
  "autodromo campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "autódromo campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "circuito campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "gran premio campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "gp campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "autodromo de campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "autódromo de campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "autodromo ciudad de campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "autódromo ciudad de campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "parque campinas": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "campinas circuit": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "campinas raceway": {
    "lat": -22.90556,
    "long": -47.06083
  },
  "autodromo guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "autódromo guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "circuito guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "gran premio guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "gp guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "autodromo de guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "autódromo de guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "autodromo ciudad de guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "autódromo ciudad de guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "parque guarulhos": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "guarulhos circuit": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "guarulhos raceway": {
    "lat": -23.46278,
    "long": -46.53333
  },
  "autodromo sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "autódromo sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "circuito sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "gran premio sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "gp sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "autodromo de sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "autódromo de sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "autodromo ciudad de sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "autódromo ciudad de sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "parque sao bernardo do campo": {
    "lat": -23.69389,
    "long": -46.565
  },
  "sao bernardo do campo circuit": {
    "lat": -23.69389,
    "long": -46.565
  },
  "sao bernardo do campo raceway": {
    "lat": -23.69389,
    "long": -46.565
  },
  "autodromo santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "autódromo santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "circuito santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "gran premio santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "gp santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "autodromo de santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "autódromo de santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "autodromo ciudad de santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "autódromo ciudad de santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "parque santo andre": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "santo andre circuit": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "santo andre raceway": {
    "lat": -23.66389,
    "long": -46.53833
  },
  "autodromo osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "autódromo osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "circuito osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "gran premio osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "gp osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "autodromo de osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "autódromo de osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "autodromo ciudad de osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "autódromo ciudad de osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "parque osasco": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "osasco circuit": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "osasco raceway": {
    "lat": -23.5325,
    "long": -46.79167
  },
  "autodromo sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "autódromo sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "circuito sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "gran premio sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "gp sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "autodromo de sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "autódromo de sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "autodromo ciudad de sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "autódromo ciudad de sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "parque sao jose dos campos": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "sao jose dos campos circuit": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "sao jose dos campos raceway": {
    "lat": -23.17944,
    "long": -45.88694
  },
  "autodromo uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "autódromo uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "circuito uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "gran premio uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "gp uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "autodromo de uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "autódromo de uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "autodromo ciudad de uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "autódromo ciudad de uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "parque uberlandia": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "uberlandia circuit": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "uberlandia raceway": {
    "lat": -18.91861,
    "long": -48.27722
  },
  "autodromo sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "autódromo sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "circuito sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "gran premio sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "gp sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "autodromo de sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "autódromo de sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "autodromo ciudad de sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "autódromo ciudad de sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "parque sorocaba": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "sorocaba circuit": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "sorocaba raceway": {
    "lat": -23.50167,
    "long": -47.45806
  },
  "autodromo contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "autódromo contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "circuito contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "gran premio contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "gp contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "autodromo de contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "autódromo de contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "autodromo ciudad de contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "autódromo ciudad de contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "parque contagem": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "contagem circuit": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "contagem raceway": {
    "lat": -19.93167,
    "long": -44.05361
  },
  "autodromo feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "autódromo feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "circuito feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "gran premio feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "gp feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "autodromo de feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "autódromo de feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "autodromo ciudad de feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "autódromo ciudad de feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "parque feira de santana": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "feira de santana circuit": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "feira de santana raceway": {
    "lat": -12.26667,
    "long": -38.96667
  },
  "autodromo aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "autódromo aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "circuito aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "gran premio aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "gp aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "autodromo de aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "autódromo de aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "autodromo ciudad de aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "autódromo ciudad de aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "parque aracaju": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "aracaju circuit": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "aracaju raceway": {
    "lat": -10.91111,
    "long": -37.07167
  },
  "autodromo cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "autódromo cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "circuito cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "gran premio cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "gp cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "autodromo de cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "autódromo de cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "autodromo ciudad de cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "autódromo ciudad de cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "parque cuiaba": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "cuiaba circuit": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "cuiaba raceway": {
    "lat": -15.59611,
    "long": -56.09667
  },
  "autodromo joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "autódromo joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "circuito joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "gran premio joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "gp joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "autodromo de joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "autódromo de joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "autodromo ciudad de joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "autódromo ciudad de joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "parque joinville": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "joinville circuit": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "joinville raceway": {
    "lat": -26.30444,
    "long": -48.84556
  },
  "autodromo juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "autódromo juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "circuito juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "gran premio juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "gp juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "autodromo de juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "autódromo de juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "autodromo ciudad de juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "autódromo ciudad de juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "parque juiz de fora": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "juiz de fora circuit": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "juiz de fora raceway": {
    "lat": -21.76417,
    "long": -43.35028
  },
  "autodromo aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "autódromo aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "circuito aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "gran premio aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "gp aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "autodromo de aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "autódromo de aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "autodromo ciudad de aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "autódromo ciudad de aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "parque aparecida de goiania": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "aparecida de goiania circuit": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "aparecida de goiania raceway": {
    "lat": -16.82333,
    "long": -49.24389
  },
  "autodromo ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "autódromo ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "circuito ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "gran premio ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "gp ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "autodromo de ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "autódromo de ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "autodromo ciudad de ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "autódromo ciudad de ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "parque ananindeua": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "ananindeua circuit": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "ananindeua raceway": {
    "lat": -1.36556,
    "long": -48.37222
  },
  "autodromo viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "autódromo viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "circuito viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "gran premio viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "gp viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "autodromo de viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "autódromo de viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "autodromo ciudad de viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "autódromo ciudad de viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "parque viamão": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "viamão circuit": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "viamão raceway": {
    "lat": -30.08111,
    "long": -51.02333
  },
  "autodromo porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "autódromo porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "circuito porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "gran premio porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "gp porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "autodromo de porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "autódromo de porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "autodromo ciudad de porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "autódromo ciudad de porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "parque porto velho": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "porto velho circuit": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "porto velho raceway": {
    "lat": -8.76194,
    "long": -63.90389
  },
  "autodromo bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "autódromo bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "circuito bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "gran premio bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "gp bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "autodromo de bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "autódromo de bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "autodromo ciudad de bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "autódromo ciudad de bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "parque bauru": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "bauru circuit": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "bauru raceway": {
    "lat": -22.31472,
    "long": -49.06056
  },
  "autodromo duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autódromo duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "circuito duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "gran premio duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "gp duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autodromo de duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autódromo de duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autodromo ciudad de duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autódromo ciudad de duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "parque duque de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "duque de caxias circuit": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "duque de caxias raceway": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autodromo sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "autódromo sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "circuito sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "gran premio sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "gp sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "autodromo de sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "autódromo de sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "autodromo ciudad de sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "autódromo ciudad de sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "parque sao goncalo": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "sao goncalo circuit": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "sao goncalo raceway": {
    "lat": -7.57611,
    "long": -40.49833
  },
  "autodromo maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "autódromo maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "circuito maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "gran premio maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "gp maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "autodromo de maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "autódromo de maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "autodromo ciudad de maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "autódromo ciudad de maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "parque maceio": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "maceio circuit": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "maceio raceway": {
    "lat": -9.66583,
    "long": -35.73528
  },
  "autodromo nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "autódromo nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "circuito nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "gran premio nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "gp nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "autodromo de nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "autódromo de nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "autodromo ciudad de nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "autódromo ciudad de nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "parque nova iguacu": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "nova iguacu circuit": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "nova iguacu raceway": {
    "lat": -22.75917,
    "long": -43.45111
  },
  "autodromo natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "autódromo natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "circuito natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "gran premio natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "gp natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "autodromo de natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "autódromo de natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "autodromo ciudad de natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "autódromo ciudad de natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "parque natal": {
    "lat": -5.795,
    "long": -35.20944
  },
  "natal circuit": {
    "lat": -5.795,
    "long": -35.20944
  },
  "natal raceway": {
    "lat": -5.795,
    "long": -35.20944
  },
  "autodromo teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "autódromo teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "circuito teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "gran premio teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "gp teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "autodromo de teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "autódromo de teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "autodromo ciudad de teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "autódromo ciudad de teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "parque teresina": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "teresina circuit": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "teresina raceway": {
    "lat": -5.08917,
    "long": -42.80194
  },
  "autodromo sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "autódromo sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "circuito sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "gran premio sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "gp sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "autodromo de sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "autódromo de sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "autodromo ciudad de sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "autódromo ciudad de sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "parque sao jose do rio preto": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "sao jose do rio preto circuit": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "sao jose do rio preto raceway": {
    "lat": -20.81972,
    "long": -49.37944
  },
  "autodromo joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "autódromo joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "circuito joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "gran premio joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "gp joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "autodromo de joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "autódromo de joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "autodromo ciudad de joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "autódromo ciudad de joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "parque joao pessoa": {
    "lat": -7.115,
    "long": -34.86306
  },
  "joao pessoa circuit": {
    "lat": -7.115,
    "long": -34.86306
  },
  "joao pessoa raceway": {
    "lat": -7.115,
    "long": -34.86306
  },
  "autodromo jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "autódromo jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "circuito jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "gran premio jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "gp jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "autodromo de jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "autódromo de jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "autodromo ciudad de jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "autódromo ciudad de jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "parque jaboatao dos guararapes": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "jaboatao dos guararapes circuit": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "jaboatao dos guararapes raceway": {
    "lat": -8.11278,
    "long": -35.01472
  },
  "autodromo mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "autódromo mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "circuito mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "gran premio mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "gp mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "autodromo de mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "autódromo de mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "autodromo ciudad de mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "autódromo ciudad de mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "parque mogi das cruzes": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "mogi das cruzes circuit": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "mogi das cruzes raceway": {
    "lat": -23.52278,
    "long": -46.18833
  },
  "autodromo betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "autódromo betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "circuito betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "gran premio betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "gp betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "autodromo de betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "autódromo de betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "autodromo ciudad de betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "autódromo ciudad de betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "parque betim": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "betim circuit": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "betim raceway": {
    "lat": -19.96778,
    "long": -44.19833
  },
  "autodromo jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "autódromo jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "circuito jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "gran premio jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "gp jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "autodromo de jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "autódromo de jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "autodromo ciudad de jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "autódromo ciudad de jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "parque jundiai": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "jundiai circuit": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "jundiai raceway": {
    "lat": -23.18639,
    "long": -46.88417
  },
  "autodromo diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "autódromo diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "circuito diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "gran premio diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "gp diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "autodromo de diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "autódromo de diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "autodromo ciudad de diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "autódromo ciudad de diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "parque diadema": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "diadema circuit": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "diadema raceway": {
    "lat": -23.68611,
    "long": -46.62278
  },
  "autodromo campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "autódromo campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "circuito campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "gran premio campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "gp campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "autodromo de campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "autódromo de campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "autodromo ciudad de campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "autódromo ciudad de campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "parque campina grande": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "campina grande circuit": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "campina grande raceway": {
    "lat": -7.23056,
    "long": -35.88111
  },
  "autodromo maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "autódromo maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "circuito maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "gran premio maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "gp maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "autodromo de maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "autódromo de maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "autodromo ciudad de maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "autódromo ciudad de maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "parque maringa": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "maringa circuit": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "maringa raceway": {
    "lat": -23.42528,
    "long": -51.93861
  },
  "autodromo montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "autódromo montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "circuito montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "gran premio montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "gp montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "autodromo de montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "autódromo de montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "autodromo ciudad de montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "autódromo ciudad de montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "parque montes claros": {
    "lat": -16.735,
    "long": -43.86167
  },
  "montes claros circuit": {
    "lat": -16.735,
    "long": -43.86167
  },
  "montes claros raceway": {
    "lat": -16.735,
    "long": -43.86167
  },
  "autodromo piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "autódromo piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "circuito piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "gran premio piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "gp piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "autodromo de piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "autódromo de piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "autodromo ciudad de piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "autódromo ciudad de piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "parque piracicaba": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "piracicaba circuit": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "piracicaba raceway": {
    "lat": -22.72528,
    "long": -47.64917
  },
  "autodromo carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "autódromo carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "circuito carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "gran premio carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "gp carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "autodromo de carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "autódromo de carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "autodromo ciudad de carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "autódromo ciudad de carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "parque carapicuiba": {
    "lat": -23.52272,
    "long": -46.835
  },
  "carapicuiba circuit": {
    "lat": -23.52272,
    "long": -46.835
  },
  "carapicuiba raceway": {
    "lat": -23.52272,
    "long": -46.835
  },
  "autodromo olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "autódromo olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "circuito olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "gran premio olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "gp olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "autodromo de olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "autódromo de olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "autodromo ciudad de olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "autódromo ciudad de olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "parque olinda": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "olinda circuit": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "olinda raceway": {
    "lat": -8.00889,
    "long": -34.85528
  },
  "autodromo cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "autódromo cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "circuito cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "gran premio cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "gp cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "autodromo de cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "autódromo de cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "autodromo ciudad de cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "autódromo ciudad de cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "parque cariacica": {
    "lat": -20.26389,
    "long": -40.42
  },
  "cariacica circuit": {
    "lat": -20.26389,
    "long": -40.42
  },
  "cariacica raceway": {
    "lat": -20.26389,
    "long": -40.42
  },
  "autodromo rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "autódromo rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "circuito rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "gran premio rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "gp rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "autodromo de rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "autódromo de rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "autodromo ciudad de rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "autódromo ciudad de rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "parque rio branco": {
    "lat": -9.97472,
    "long": -67.81
  },
  "rio branco circuit": {
    "lat": -9.97472,
    "long": -67.81
  },
  "rio branco raceway": {
    "lat": -9.97472,
    "long": -67.81
  },
  "autodromo vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "autódromo vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "circuito vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "gran premio vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "gp vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "autodromo de vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "autódromo de vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "autodromo ciudad de vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "autódromo ciudad de vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "parque vila velha": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "vila velha circuit": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "vila velha raceway": {
    "lat": -20.32972,
    "long": -40.2925
  },
  "autodromo anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "autódromo anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "circuito anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "gran premio anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "gp anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "autodromo de anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "autódromo de anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "autodromo ciudad de anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "autódromo ciudad de anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "parque anapolis": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "anapolis circuit": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "anapolis raceway": {
    "lat": -16.32667,
    "long": -48.95278
  },
  "autodromo belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "autódromo belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "circuito belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "gran premio belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "gp belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "autodromo de belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "autódromo de belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "autodromo ciudad de belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "autódromo ciudad de belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "parque belford roxo": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "belford roxo circuit": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "belford roxo raceway": {
    "lat": -22.76417,
    "long": -43.39944
  },
  "autodromo caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "autódromo caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "circuito caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "gran premio caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "gp caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "autodromo de caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "autódromo de caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "autodromo ciudad de caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "autódromo ciudad de caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "parque caucaia": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "caucaia circuit": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "caucaia raceway": {
    "lat": -3.73611,
    "long": -38.65306
  },
  "autodromo manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "autódromo manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "circuito manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "gran premio manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "gp manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "autodromo de manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "autódromo de manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "autodromo ciudad de manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "autódromo ciudad de manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "parque manaus": {
    "lat": -3.10194,
    "long": -60.025
  },
  "manaus circuit": {
    "lat": -3.10194,
    "long": -60.025
  },
  "manaus raceway": {
    "lat": -3.10194,
    "long": -60.025
  },
  "autodromo belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "autódromo belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "circuito belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "gran premio belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "gp belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "autodromo de belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "autódromo de belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "autodromo ciudad de belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "autódromo ciudad de belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "parque belo horizonte": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "belo horizonte circuit": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "belo horizonte raceway": {
    "lat": -19.92083,
    "long": -43.93778
  },
  "autodromo fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "autódromo fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "circuito fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "gran premio fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "gp fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "autodromo de fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "autódromo de fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "autodromo ciudad de fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "autódromo ciudad de fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "parque fortaleza": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "fortaleza circuit": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "fortaleza raceway": {
    "lat": -3.71722,
    "long": -38.54306
  },
  "autodromo salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "autódromo salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "circuito salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "gran premio salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "gp salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "autodromo de salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "autódromo de salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "autodromo ciudad de salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "autódromo ciudad de salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "parque salvador": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "salvador circuit": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "salvador raceway": {
    "lat": -12.97563,
    "long": -38.49096
  },
  "autodromo recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "autódromo recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "circuito recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "gran premio recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "gp recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "autodromo de recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "autódromo de recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "autodromo ciudad de recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "autódromo ciudad de recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "parque recife": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "recife circuit": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "recife raceway": {
    "lat": -8.05389,
    "long": -34.88111
  },
  "autodromo belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "autódromo belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "circuito belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "gran premio belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "gp belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "autodromo de belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "autódromo de belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "autodromo ciudad de belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "autódromo ciudad de belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "parque belem": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "belem circuit": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "belem raceway": {
    "lat": -1.45583,
    "long": -48.50444
  },
  "autodromo porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "autódromo porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "circuito porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "gran premio porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "gp porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "autodromo de porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "autódromo de porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "autodromo ciudad de porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "autódromo ciudad de porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "parque porto alegre": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "porto alegre circuit": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "porto alegre raceway": {
    "lat": -30.03283,
    "long": -51.23019
  },
  "autodromo sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "autódromo sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "circuito sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "gran premio sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "gp sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "autodromo de sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "autódromo de sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "autodromo ciudad de sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "autódromo ciudad de sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "parque sao luis": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "sao luis circuit": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "sao luis raceway": {
    "lat": -2.52972,
    "long": -44.30278
  },
  "autodromo vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "autódromo vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "circuito vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "gran premio vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "gp vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "autodromo de vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "autódromo de vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "autodromo ciudad de vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "autódromo ciudad de vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "parque vitoria": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "vitoria circuit": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "vitoria raceway": {
    "lat": 42.84998,
    "long": -2.67268
  },
  "autodromo macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "autódromo macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "circuito macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "gran premio macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "gp macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "autodromo de macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "autódromo de macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "autodromo ciudad de macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "autódromo ciudad de macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "parque macapa": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "macapa circuit": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "macapa raceway": {
    "lat": 0.03889,
    "long": -51.06639
  },
  "autodromo florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "autódromo florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "circuito florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "gran premio florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "gp florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "autodromo de florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "autódromo de florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "autodromo ciudad de florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "autódromo ciudad de florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "parque florianopolis": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "florianopolis circuit": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "florianopolis raceway": {
    "lat": -27.59667,
    "long": -48.54917
  },
  "autodromo palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "autódromo palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "circuito palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "gran premio palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "gp palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "autodromo de palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "autódromo de palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "autodromo ciudad de palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "autódromo ciudad de palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "parque palmas": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "palmas circuit": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "palmas raceway": {
    "lat": -10.16745,
    "long": -48.32766
  },
  "autodromo boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "autódromo boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "circuito boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "gran premio boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "gp boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "autodromo de boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "autódromo de boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "autodromo ciudad de boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "autódromo ciudad de boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "parque boa vista": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "boa vista circuit": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "boa vista raceway": {
    "lat": 2.81972,
    "long": -60.67333
  },
  "autodromo ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "autódromo ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "circuito ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "gran premio ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "gp ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "autodromo de ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "autódromo de ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "autodromo ciudad de ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "autódromo ciudad de ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "parque ponta grossa": {
    "lat": -25.095,
    "long": -50.16194
  },
  "ponta grossa circuit": {
    "lat": -25.095,
    "long": -50.16194
  },
  "ponta grossa raceway": {
    "lat": -25.095,
    "long": -50.16194
  },
  "autodromo franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "autódromo franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "circuito franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "gran premio franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "gp franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "autodromo de franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "autódromo de franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "autodromo ciudad de franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "autódromo ciudad de franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "parque franca": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "franca circuit": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "franca raceway": {
    "lat": -20.53861,
    "long": -47.40083
  },
  "autodromo pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "autódromo pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "circuito pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "gran premio pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "gp pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "autodromo de pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "autódromo de pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "autodromo ciudad de pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "autódromo ciudad de pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "parque pelotas": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "pelotas circuit": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "pelotas raceway": {
    "lat": -31.76997,
    "long": -52.34101
  },
  "autodromo canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "autódromo canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "circuito canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "gran premio canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "gp canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "autodromo de canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "autódromo de canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "autodromo ciudad de canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "autódromo ciudad de canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "parque canoas": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "canoas circuit": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "canoas raceway": {
    "lat": -29.91778,
    "long": -51.18361
  },
  "autodromo vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "autódromo vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "circuito vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "gran premio vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "gp vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "autodromo de vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "autódromo de vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "autodromo ciudad de vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "autódromo ciudad de vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "parque vitoria da conquista": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "vitoria da conquista circuit": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "vitoria da conquista raceway": {
    "lat": -14.86611,
    "long": -40.83944
  },
  "autodromo blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "autódromo blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "circuito blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "gran premio blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "gp blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "autodromo de blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "autódromo de blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "autodromo ciudad de blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "autódromo ciudad de blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "parque blumenau": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "blumenau circuit": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "blumenau raceway": {
    "lat": -26.91944,
    "long": -49.06611
  },
  "autodromo uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "autódromo uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "circuito uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "gran premio uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "gp uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "autodromo de uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "autódromo de uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "autodromo ciudad de uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "autódromo ciudad de uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "parque uberaba": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "uberaba circuit": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "uberaba raceway": {
    "lat": -19.74833,
    "long": -47.93194
  },
  "autodromo santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "autódromo santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "circuito santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "gran premio santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "gp santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "autodromo de santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "autódromo de santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "autodromo ciudad de santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "autódromo ciudad de santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "parque santarem": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "santarem circuit": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "santarem raceway": {
    "lat": -2.44306,
    "long": -54.70833
  },
  "autodromo paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "autódromo paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "circuito paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "gran premio paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "gp paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "autodromo de paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "autódromo de paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "autodromo ciudad de paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "autódromo ciudad de paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "parque paulista": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "paulista circuit": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "paulista raceway": {
    "lat": -7.94083,
    "long": -34.87306
  },
  "autodromo petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "autódromo petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "circuito petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "gran premio petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "gp petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "autodromo de petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "autódromo de petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "autodromo ciudad de petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "autódromo ciudad de petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "parque petropolis": {
    "lat": -22.505,
    "long": -43.17861
  },
  "petropolis circuit": {
    "lat": -22.505,
    "long": -43.17861
  },
  "petropolis raceway": {
    "lat": -22.505,
    "long": -43.17861
  },
  "autodromo ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "autódromo ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "circuito ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "gran premio ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "gp ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "autodromo de ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "autódromo de ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "autodromo ciudad de ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "autódromo ciudad de ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "parque ribeirao das neves": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "ribeirao das neves circuit": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "ribeirao das neves raceway": {
    "lat": -19.76694,
    "long": -44.08667
  },
  "autodromo guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "autódromo guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "circuito guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "gran premio guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "gp guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "autodromo de guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "autódromo de guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "autodromo ciudad de guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "autódromo ciudad de guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "parque guaruja": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "guaruja circuit": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "guaruja raceway": {
    "lat": -23.99306,
    "long": -46.25639
  },
  "autodromo taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "autódromo taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "circuito taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "gran premio taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "gp taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "autodromo de taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "autódromo de taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "autodromo ciudad de taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "autódromo ciudad de taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "parque taubate": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "taubate circuit": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "taubate raceway": {
    "lat": -23.02639,
    "long": -45.55528
  },
  "autodromo limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "autódromo limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "circuito limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "gran premio limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "gp limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "autodromo de limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "autódromo de limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "autodromo ciudad de limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "autódromo ciudad de limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "parque limeira": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "limeira circuit": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "limeira raceway": {
    "lat": -22.56472,
    "long": -47.40167
  },
  "autodromo suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "autódromo suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "circuito suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "gran premio suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "gp suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "autodromo de suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "autódromo de suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "autodromo ciudad de suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "autódromo ciudad de suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "parque suzano": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "suzano circuit": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "suzano raceway": {
    "lat": -23.5425,
    "long": -46.31083
  },
  "autodromo santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "autódromo santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "circuito santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "gran premio santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "gp santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "autodromo de santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "autódromo de santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "autodromo ciudad de santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "autódromo ciudad de santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "parque santa maria": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "santa maria circuit": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "santa maria raceway": {
    "lat": 17.06025,
    "long": -96.72544
  },
  "autodromo foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "autódromo foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "circuito foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "gran premio foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "gp foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "autodromo de foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "autódromo de foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "autodromo ciudad de foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "autódromo ciudad de foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "parque foz do iguaçu": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "foz do iguaçu circuit": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "foz do iguaçu raceway": {
    "lat": -25.54778,
    "long": -54.58806
  },
  "autodromo camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "autódromo camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "circuito camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "gran premio camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "gp camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "autodromo de camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "autódromo de camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "autodromo ciudad de camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "autódromo ciudad de camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "parque camaçari": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "camaçari circuit": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "camaçari raceway": {
    "lat": -12.6975,
    "long": -38.32417
  },
  "autodromo imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "autódromo imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "circuito imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "gran premio imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "gp imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "autodromo de imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "autódromo de imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "autodromo ciudad de imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "autódromo ciudad de imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "parque imperatriz": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "imperatriz circuit": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "imperatriz raceway": {
    "lat": -5.52639,
    "long": -47.49167
  },
  "autodromo maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "autódromo maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "circuito maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "gran premio maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "gp maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "autodromo de maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "autódromo de maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "autodromo ciudad de maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "autódromo ciudad de maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "parque maraba": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "maraba circuit": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "maraba raceway": {
    "lat": -5.38146,
    "long": -49.13232
  },
  "autodromo itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "autódromo itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "circuito itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "gran premio itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "gp itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "autodromo de itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "autódromo de itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "autodromo ciudad de itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "autódromo ciudad de itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "parque itaborai": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "itaborai circuit": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "itaborai raceway": {
    "lat": -22.74444,
    "long": -42.85944
  },
  "autodromo americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "autódromo americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "circuito americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "gran premio americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "gp americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "autodromo de americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "autódromo de americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "autodromo ciudad de americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "autódromo ciudad de americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "parque americana": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "americana circuit": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "americana raceway": {
    "lat": -22.73917,
    "long": -47.33139
  },
  "autodromo macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "autódromo macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "circuito macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "gran premio macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "gp macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "autodromo de macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "autódromo de macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "autodromo ciudad de macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "autódromo ciudad de macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "parque macae": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "macae circuit": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "macae raceway": {
    "lat": -22.38484,
    "long": -41.78324
  },
  "autodromo indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "autódromo indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "circuito indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "gran premio indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "gp indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "autodromo de indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "autódromo de indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "autodromo ciudad de indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "autódromo ciudad de indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "parque indaiatuba": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "indaiatuba circuit": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "indaiatuba raceway": {
    "lat": -23.08842,
    "long": -47.2119
  },
  "autodromo cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "autódromo cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "circuito cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "gran premio cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "gp cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "autodromo de cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "autódromo de cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "autodromo ciudad de cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "autódromo ciudad de cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "parque cotia": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "cotia circuit": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "cotia raceway": {
    "lat": -23.60389,
    "long": -46.91917
  },
  "autodromo araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "autódromo araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "circuito araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "gran premio araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "gp araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "autodromo de araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "autódromo de araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "autodromo ciudad de araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "autódromo ciudad de araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "parque araraquara": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "araraquara circuit": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "araraquara raceway": {
    "lat": -21.79444,
    "long": -48.17556
  },
  "autodromo marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "autódromo marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "circuito marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "gran premio marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "gp marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "autodromo de marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "autódromo de marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "autodromo ciudad de marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "autódromo ciudad de marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "parque marilia": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "marilia circuit": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "marilia raceway": {
    "lat": -22.21389,
    "long": -49.94583
  },
  "autodromo jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "autódromo jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "circuito jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "gran premio jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "gp jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "autodromo de jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "autódromo de jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "autodromo ciudad de jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "autódromo ciudad de jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "parque jacarei": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "jacarei circuit": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "jacarei raceway": {
    "lat": -23.30528,
    "long": -45.96583
  },
  "autodromo presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "autódromo presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "circuito presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "gran premio presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "gp presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "autodromo de presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "autódromo de presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "autodromo ciudad de presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "autódromo ciudad de presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "parque presidente prudente": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "presidente prudente circuit": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "presidente prudente raceway": {
    "lat": -22.12556,
    "long": -51.38889
  },
  "autodromo sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "autódromo sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "circuito sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "gran premio sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "gp sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "autodromo de sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "autódromo de sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "autodromo ciudad de sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "autódromo ciudad de sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "parque sete lagoas": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "sete lagoas circuit": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "sete lagoas raceway": {
    "lat": -19.46583,
    "long": -44.24667
  },
  "autodromo divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "autódromo divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "circuito divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "gran premio divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "gp divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "autodromo de divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "autódromo de divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "autodromo ciudad de divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "autódromo ciudad de divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "parque divinopolis": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "divinopolis circuit": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "divinopolis raceway": {
    "lat": -20.14355,
    "long": -44.89065
  },
  "autodromo hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "autódromo hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "circuito hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "gran premio hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "gp hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "autodromo de hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "autódromo de hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "autodromo ciudad de hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "autódromo ciudad de hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "parque hortolandia": {
    "lat": -22.85833,
    "long": -47.22
  },
  "hortolandia circuit": {
    "lat": -22.85833,
    "long": -47.22
  },
  "hortolandia raceway": {
    "lat": -22.85833,
    "long": -47.22
  },
  "autodromo ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "autódromo ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "circuito ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "gran premio ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "gp ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "autodromo de ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "autódromo de ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "autodromo ciudad de ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "autódromo ciudad de ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "parque ipatinga": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "ipatinga circuit": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "ipatinga raceway": {
    "lat": -19.46833,
    "long": -42.53667
  },
  "autodromo santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "autódromo santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "circuito santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "gran premio santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "gp santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "autodromo de santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "autódromo de santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "autodromo ciudad de santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "autódromo ciudad de santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "parque santa luzia": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "santa luzia circuit": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "santa luzia raceway": {
    "lat": -19.76972,
    "long": -43.85139
  },
  "autodromo criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "autódromo criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "circuito criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "gran premio criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "gp criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "autodromo de criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "autódromo de criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "autodromo ciudad de criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "autódromo ciudad de criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "parque criciuma": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "criciuma circuit": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "criciuma raceway": {
    "lat": -28.6775,
    "long": -49.36972
  },
  "autodromo chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "autódromo chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "circuito chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "gran premio chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "gp chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "autodromo de chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "autódromo de chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "autodromo ciudad de chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "autódromo ciudad de chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "parque chapeco": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "chapeco circuit": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "chapeco raceway": {
    "lat": -27.09639,
    "long": -52.61833
  },
  "autodromo arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "autódromo arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "circuito arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "gran premio arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "gp arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "autodromo de arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "autódromo de arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "autodromo ciudad de arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "autódromo ciudad de arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "parque arapiraca": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "arapiraca circuit": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "arapiraca raceway": {
    "lat": -9.7525,
    "long": -36.66111
  },
  "autodromo itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "autódromo itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "circuito itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "gran premio itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "gp itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "autodromo de itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "autódromo de itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "autodromo ciudad de itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "autódromo ciudad de itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "parque itajai": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "itajai circuit": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "itajai raceway": {
    "lat": -26.90778,
    "long": -48.66194
  },
  "autodromo tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "autódromo tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "circuito tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "gran premio tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "gp tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "autodromo de tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "autódromo de tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "autodromo ciudad de tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "autódromo ciudad de tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "parque tres lagoas": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "tres lagoas circuit": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "tres lagoas raceway": {
    "lat": -20.78765,
    "long": -51.70338
  },
  "autodromo dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "autódromo dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "circuito dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "gran premio dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "gp dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "autodromo de dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "autódromo de dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "autodromo ciudad de dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "autódromo ciudad de dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "parque dourados": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "dourados circuit": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "dourados raceway": {
    "lat": -22.22111,
    "long": -54.80556
  },
  "autodromo sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "autódromo sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "circuito sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "gran premio sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "gp sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "autodromo de sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "autódromo de sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "autodromo ciudad de sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "autódromo ciudad de sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "parque sinop": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "sinop circuit": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "sinop raceway": {
    "lat": -11.86417,
    "long": -55.5025
  },
  "autodromo rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "autódromo rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "circuito rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "gran premio rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "gp rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "autodromo de rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "autódromo de rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "autodromo ciudad de rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "autódromo ciudad de rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "parque rondonopolis": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "rondonopolis circuit": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "rondonopolis raceway": {
    "lat": -16.47083,
    "long": -54.63556
  },
  "autodromo castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "autódromo castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "circuito castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "gran premio castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "gp castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "autodromo de castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "autódromo de castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "autodromo ciudad de castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "autódromo ciudad de castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "parque castanhal": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "castanhal circuit": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "castanhal raceway": {
    "lat": -1.29389,
    "long": -47.92639
  },
  "autodromo parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "autódromo parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "circuito parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "gran premio parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "gp parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "autodromo de parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "autódromo de parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "autodromo ciudad de parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "autódromo ciudad de parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "parque parauapebas": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "parauapebas circuit": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "parauapebas raceway": {
    "lat": -6.0675,
    "long": -49.90222
  },
  "autodromo caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autódromo caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "circuito caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "gran premio caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "gp caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autodromo de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autódromo de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autodromo ciudad de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autódromo ciudad de caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "parque caxias": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "caxias circuit": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "caxias raceway": {
    "lat": -22.78556,
    "long": -43.31167
  },
  "autodromo juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "autódromo juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "circuito juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "gran premio juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "gp juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "autodromo de juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "autódromo de juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "autodromo ciudad de juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "autódromo ciudad de juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "parque juazeiro do norte": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "juazeiro do norte circuit": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "juazeiro do norte raceway": {
    "lat": -7.21306,
    "long": -39.31528
  },
  "autodromo parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "autódromo parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "circuito parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "gran premio parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "gp parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "autodromo de parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "autódromo de parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "autodromo ciudad de parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "autódromo ciudad de parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "parque parnaiba": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "parnaiba circuit": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "parnaiba raceway": {
    "lat": -23.44417,
    "long": -46.91778
  },
  "autodromo sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "autódromo sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "circuito sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "gran premio sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "gp sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "autodromo de sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "autódromo de sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "autodromo ciudad de sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "autódromo ciudad de sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "parque sobral": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "sobral circuit": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "sobral raceway": {
    "lat": -3.68611,
    "long": -40.34972
  },
  "autodromo itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "autódromo itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "circuito itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "gran premio itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "gp itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "autodromo de itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "autódromo de itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "autodromo ciudad de itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "autódromo ciudad de itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "parque itabuna": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "itabuna circuit": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "itabuna raceway": {
    "lat": -14.78556,
    "long": -39.28028
  },
  "autodromo ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "autódromo ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "circuito ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "gran premio ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "gp ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "autodromo de ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "autódromo de ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "autodromo ciudad de ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "autódromo ciudad de ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "parque ilheus": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "ilheus circuit": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "ilheus raceway": {
    "lat": -14.79909,
    "long": -39.03228
  },
  "autodromo jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "autódromo jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "circuito jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "gran premio jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "gp jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "autodromo de jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "autódromo de jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "autodromo ciudad de jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "autódromo ciudad de jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "parque jequie": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "jequie circuit": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "jequie raceway": {
    "lat": -13.85875,
    "long": -40.08512
  },
  "autodromo alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "autódromo alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "circuito alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "gran premio alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "gp alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "autodromo de alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "autódromo de alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "autodromo ciudad de alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "autódromo ciudad de alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "parque alagoinhas": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "alagoinhas circuit": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "alagoinhas raceway": {
    "lat": -12.13556,
    "long": -38.41917
  },
  "autodromo teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "autódromo teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "circuito teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "gran premio teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "gp teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "autodromo de teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "autódromo de teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "autodromo ciudad de teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "autódromo ciudad de teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "parque teixeira de freitas": {
    "lat": -17.535,
    "long": -39.74194
  },
  "teixeira de freitas circuit": {
    "lat": -17.535,
    "long": -39.74194
  },
  "teixeira de freitas raceway": {
    "lat": -17.535,
    "long": -39.74194
  },
  "autodromo barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "autódromo barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "circuito barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "gran premio barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "gp barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "autodromo de barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "autódromo de barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "autodromo ciudad de barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "autódromo ciudad de barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "parque barreiras": {
    "lat": -12.15278,
    "long": -44.99
  },
  "barreiras circuit": {
    "lat": -12.15278,
    "long": -44.99
  },
  "barreiras raceway": {
    "lat": -12.15278,
    "long": -44.99
  },
  "autodromo pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "autódromo pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "circuito pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "gran premio pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "gp pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "autodromo de pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "autódromo de pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "autodromo ciudad de pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "autódromo ciudad de pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "parque pouso alegre": {
    "lat": -22.23,
    "long": -45.93639
  },
  "pouso alegre circuit": {
    "lat": -22.23,
    "long": -45.93639
  },
  "pouso alegre raceway": {
    "lat": -22.23,
    "long": -45.93639
  },
  "autodromo varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "autódromo varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "circuito varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "gran premio varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "gp varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "autodromo de varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "autódromo de varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "autodromo ciudad de varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "autódromo ciudad de varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "parque varginha": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "varginha circuit": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "varginha raceway": {
    "lat": -21.55139,
    "long": -45.43028
  },
  "autodromo lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "autódromo lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "circuito lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "gran premio lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "gp lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "autodromo de lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "autódromo de lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "autodromo ciudad de lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "autódromo ciudad de lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "parque lavras": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "lavras circuit": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "lavras raceway": {
    "lat": -21.24528,
    "long": -44.99972
  },
  "autodromo passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "autódromo passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "circuito passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "gran premio passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "gp passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "autodromo de passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "autódromo de passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "autodromo ciudad de passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "autódromo ciudad de passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "parque passos": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "passos circuit": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "passos raceway": {
    "lat": -20.71889,
    "long": -46.60972
  },
  "autodromo itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "autódromo itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "circuito itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "gran premio itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "gp itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "autodromo de itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "autódromo de itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "autodromo ciudad de itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "autódromo ciudad de itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "parque itajuba": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "itajuba circuit": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "itajuba raceway": {
    "lat": -22.42556,
    "long": -45.45278
  },
  "autodromo poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "autódromo poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "circuito poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "gran premio poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "gp poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "autodromo de poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "autódromo de poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "autodromo ciudad de poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "autódromo ciudad de poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "parque poços de caldas": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "poços de caldas circuit": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "poços de caldas raceway": {
    "lat": -21.78778,
    "long": -46.56139
  },
  "autodromo extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "autódromo extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "circuito extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "gran premio extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "gp extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "autodromo de extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "autódromo de extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "autodromo ciudad de extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "autódromo ciudad de extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "parque extrema": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "extrema circuit": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "extrema raceway": {
    "lat": -22.85472,
    "long": -46.31833
  },
  "autodromo mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "autódromo mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "circuito mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "gran premio mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "gp mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "autodromo de mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "autódromo de mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "autodromo ciudad de mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "autódromo ciudad de mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "parque mogi guaçu": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "mogi guaçu circuit": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "mogi guaçu raceway": {
    "lat": -22.3677,
    "long": -46.94552
  },
  "autodromo san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "autódromo san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "circuito san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "gran premio san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "gp san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "autodromo de san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "autódromo de san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "autodromo ciudad de san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "autódromo ciudad de san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "parque san salvador de jujuy": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "san salvador de jujuy circuit": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "san salvador de jujuy raceway": {
    "lat": -24.1928,
    "long": -65.29342
  },
  "autodromo santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "autódromo santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "circuito santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "gran premio santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "gp santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "autodromo de santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "autódromo de santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "autodromo ciudad de santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "autódromo ciudad de santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "parque santiago del estero": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "santiago del estero circuit": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "santiago del estero raceway": {
    "lat": -27.80047,
    "long": -64.26285
  },
  "autodromo san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "autódromo san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "circuito san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "gran premio san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "gp san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "autodromo de san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "autódromo de san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "autodromo ciudad de san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "autódromo ciudad de san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "parque san fernando del valle de catamarca": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "san fernando del valle de catamarca circuit": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "san fernando del valle de catamarca raceway": {
    "lat": -28.46957,
    "long": -65.78524
  },
  "autodromo san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "autódromo san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "circuito san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "gran premio san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "gp san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "autodromo de san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "autódromo de san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "autodromo ciudad de san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "autódromo ciudad de san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "parque san nicolas de los arroyos": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "san nicolas de los arroyos circuit": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "san nicolas de los arroyos raceway": {
    "lat": -33.33425,
    "long": -60.2108
  },
  "autodromo bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "autódromo bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "circuito bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "gran premio bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "gp bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "autodromo de bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "autódromo de bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "autodromo ciudad de bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "autódromo ciudad de bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "parque bell ville": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "bell ville circuit": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "bell ville raceway": {
    "lat": -32.63021,
    "long": -62.68883
  },
  "autodromo salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "autódromo salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "circuito salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "gran premio salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "gp salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "autodromo de salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "autódromo de salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "autodromo ciudad de salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "autódromo ciudad de salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "parque salvador ba": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "salvador ba circuit": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "salvador ba raceway": {
    "lat": 23.3088,
    "long": -99.55328
  },
  "autodromo caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "autódromo caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "circuito caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "gran premio caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "gp caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "autodromo de caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "autódromo de caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "autodromo ciudad de caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "autódromo ciudad de caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "parque caxias do sul": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "caxias do sul circuit": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "caxias do sul raceway": {
    "lat": -29.16806,
    "long": -51.17944
  },
  "autodromo caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "autódromo caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "circuito caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "gran premio caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "gp caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "autodromo de caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "autódromo de caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "autodromo ciudad de caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "autódromo ciudad de caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "parque caruaru": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "caruaru circuit": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "caruaru raceway": {
    "lat": -8.28333,
    "long": -35.97611
  },
  "autodromo petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "autódromo petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "circuito petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "gran premio petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "gp petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "autodromo de petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "autódromo de petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "autodromo ciudad de petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "autódromo ciudad de petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "parque petrolina": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "petrolina circuit": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "petrolina raceway": {
    "lat": -9.39861,
    "long": -40.50083
  },
  "autodromo mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "autódromo mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "circuito mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "gran premio mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "gp mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "autodromo de mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "autódromo de mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "autodromo ciudad de mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "autódromo ciudad de mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "parque mossoro": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "mossoro circuit": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "mossoro raceway": {
    "lat": -5.1875,
    "long": -37.34417
  },
  "autodromo nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "autódromo nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "circuito nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "gran premio nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "gp nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "autodromo de nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "autódromo de nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "autodromo ciudad de nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "autódromo ciudad de nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "parque nova friburgo": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "nova friburgo circuit": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "nova friburgo raceway": {
    "lat": -22.28194,
    "long": -42.53111
  },
  "autodromo volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "autódromo volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "circuito volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "gran premio volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "gp volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "autodromo de volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "autódromo de volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "autodromo ciudad de volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "autódromo ciudad de volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "parque volta redonda": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "volta redonda circuit": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "volta redonda raceway": {
    "lat": -22.52306,
    "long": -44.10417
  },
  "autodromo campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "autódromo campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "circuito campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "gran premio campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "gp campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "autodromo de campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "autódromo de campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "autodromo ciudad de campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "autódromo ciudad de campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "parque campos dos goytacazes": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "campos dos goytacazes circuit": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "campos dos goytacazes raceway": {
    "lat": -21.75227,
    "long": -41.33044
  },
  "autodromo resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "autódromo resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "circuito resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "gran premio resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "gp resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "autodromo de resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "autódromo de resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "autodromo ciudad de resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "autódromo ciudad de resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "parque resende": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "resende circuit": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "resende raceway": {
    "lat": -22.46889,
    "long": -44.44667
  },
  "autodromo angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "autódromo angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "circuito angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "gran premio angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "gp angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "autodromo de angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "autódromo de angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "autodromo ciudad de angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "autódromo ciudad de angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "parque angra dos reis": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "angra dos reis circuit": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "angra dos reis raceway": {
    "lat": -23.00667,
    "long": -44.31806
  },
  "autodromo sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "autódromo sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "circuito sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "gran premio sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "gp sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "autodromo de sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "autódromo de sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "autodromo ciudad de sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "autódromo ciudad de sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "parque sao vicente": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "sao vicente circuit": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "sao vicente raceway": {
    "lat": -23.96306,
    "long": -46.39194
  },
  "autodromo santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "autódromo santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "circuito santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "gran premio santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "gp santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "autodromo de santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "autódromo de santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "autodromo ciudad de santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "autódromo ciudad de santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "parque santos": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "santos circuit": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "santos raceway": {
    "lat": -23.96083,
    "long": -46.33361
  },
  "autodromo praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "autódromo praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "circuito praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "gran premio praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "gp praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "autodromo de praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "autódromo de praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "autodromo ciudad de praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "autódromo ciudad de praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "parque praia grande": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "praia grande circuit": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "praia grande raceway": {
    "lat": -24.00583,
    "long": -46.40278
  },
  "autodromo sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "autódromo sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "circuito sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "gran premio sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "gp sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "autodromo de sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "autódromo de sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "autodromo ciudad de sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "autódromo ciudad de sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "parque sao carlos": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "sao carlos circuit": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "sao carlos raceway": {
    "lat": -22.0175,
    "long": -47.89083
  },
  "autodromo rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "autódromo rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "circuito rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "gran premio rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "gp rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "autodromo de rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "autódromo de rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "autodromo ciudad de rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "autódromo ciudad de rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "parque rio claro": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "rio claro circuit": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "rio claro raceway": {
    "lat": -22.41139,
    "long": -47.56139
  },
  "autodromo itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "autódromo itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "circuito itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "gran premio itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "gp itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "autodromo de itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "autódromo de itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "autodromo ciudad de itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "autódromo ciudad de itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "parque itu": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "itu circuit": {
    "lat": -23.26417,
    "long": -47.29917
  },
  "itu raceway": {
    "lat": -23.26417,
    "long": -47.29917
  }
};
    for (const sched of finalSchedules) {
      if (!sched.lat || !sched.long) {
        const locName = sched.event || sched.circuit;
        if (locName) {
          const key = locName.toLowerCase().trim();
          let found = false;
          for (const [circuit, coords] of Object.entries(HARDCODED_COORDS as Record<string, {lat: number, long: number}>)) {
            if (key.includes(circuit)) {
              sched.lat = coords.lat;
              sched.long = coords.long;
              found = true;
              break;
            }
          }
          if (!found) {
            geocodePromises.push(
              fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locName)}&count=1&language=es&format=json`)
                .then(res => res.json())
                .then(data => {
                  if (data.results && data.results.length > 0) {
                    sched.lat = data.results[0].latitude;
                    sched.long = data.results[0].longitude;
                  }
                })
                .catch(() => {})
            );
          }
        }
      }
    }
    await Promise.allSettled(geocodePromises);

    // 2. Fetch weather for each unique lat/long in finalSchedules
    const weatherCache = new Map<string, any>();
    const weatherPromises = [];

    for (const sched of finalSchedules) {
      if (sched.lat && sched.long && !weatherCache.has(`${sched.lat},${sched.long}`)) {
        const key = `${sched.lat},${sched.long}`;
        weatherCache.set(key, null);
        weatherPromises.push(
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${sched.lat}&longitude=${sched.long}&hourly=temperature_2m,precipitation_probability,weathercode,is_day&timezone=UTC&forecast_days=16`)
            .then(res => res.json())
            .then(data => { weatherCache.set(key, data); })
            .catch(() => {})
        );
      }
    }
    await Promise.allSettled(weatherPromises);

    for (const sched of finalSchedules) {
      if (sched.lat && sched.long) {
        const data = weatherCache.get(`${sched.lat},${sched.long}`);
        if (data && data.hourly && data.hourly.time) {
          let closestIdx = -1;
          let minDiff = Infinity;
          for (let i = 0; i < data.hourly.time.length; i++) {
             const timeStr = data.hourly.time[i];
             const hourTimestamp = new Date(timeStr + 'Z').getTime();
             const diff = Math.abs(hourTimestamp - sched.startAt);
             if (diff < minDiff) { minDiff = diff; closestIdx = i; }
          }
          if (closestIdx !== -1) {
             const code = data.hourly.weathercode[closestIdx];
             const isDay = data.hourly.is_day[closestIdx] === 1;
             
             let sfSymbol = 'cloud.fill';
             if (code === 0) sfSymbol = isDay ? 'sun.max.fill' : 'moon.stars.fill';
             else if (code === 1 || code === 2) sfSymbol = isDay ? 'cloud.sun.fill' : 'cloud.moon.fill';
             else if (code === 3) sfSymbol = 'cloud.fill';
             else if (code === 45 || code === 48) sfSymbol = 'cloud.fog.fill';
             else if (code >= 51 && code <= 57) sfSymbol = 'cloud.drizzle.fill';
             else if (code >= 61 && code <= 67) sfSymbol = 'cloud.rain.fill';
             else if (code >= 71 && code <= 77) sfSymbol = 'cloud.snow.fill';
             else if (code >= 80 && code <= 82) sfSymbol = isDay ? 'cloud.sun.rain.fill' : 'cloud.moon.rain.fill';
             else if (code >= 85 && code <= 86) sfSymbol = 'cloud.snow.fill';
             else if (code >= 95 && code <= 99) sfSymbol = 'cloud.bolt.rain.fill';

             const temp = Math.round(data.hourly.temperature_2m[closestIdx]);
             const rain = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[closestIdx] : 0;
             
             // Fallback for simple string if needed
             let fallbackIcon = '☁️';
             if (code === 0) fallbackIcon = isDay ? '☀️' : '🌙';
             else if (code === 1 || code === 2) fallbackIcon = isDay ? '⛅' : '☁️';
             else if (code >= 51 && code <= 67) fallbackIcon = '🌧️';
             else if (code >= 71 && code <= 86) fallbackIcon = '❄️';
             else if (code >= 95) fallbackIcon = '⛈️';

             sched.weather = `${fallbackIcon} ${temp}°C`;
             sched.weatherData = {
               temp,
               rain,
               sfSymbol,
               isDay
             };
          }
        }
      }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(finalSchedules);

  } catch (error) {
    console.error('[widget] Fatal error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

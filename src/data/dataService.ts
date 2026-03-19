// Team color mapping for F1 teams
const TEAM_COLORS: Record<string, string> = {
  'Mercedes': 'var(--team-mercedes)',
  'Ferrari': 'var(--team-ferrari)',
  'Red Bull Racing': 'var(--team-redbull)',
  'Red Bull': 'var(--team-redbull)',
  'McLaren': 'var(--team-mclaren)',
  'Alpine': 'var(--team-alpine)',
  'Aston Martin': 'var(--team-astonmartin)',
  'Williams': 'var(--team-williams)',
  'Haas F1 Team': 'var(--team-haas)',
  'Haas': 'var(--team-haas)',
  'Racing Bulls': 'var(--team-racingbulls)',
  'RB': 'var(--team-racingbulls)',
  'Sauber': 'var(--team-audi)',
  'Kick Sauber': 'var(--team-audi)',
  'Cadillac': 'var(--team-cadillac)',
};

export function getTeamColor(team: string): string {
  for (const [key, val] of Object.entries(TEAM_COLORS)) {
    if (team.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return 'var(--text-tertiary)';
}

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  'F1': '#e8002d',
  'WRC': '#0066CC',
  'IndyCar': '#0057B8',
  'NASCAR': '#FFD659',
  'MotoGP': '#BE0026',
  'WEC': '#004C97',
  'TN': '#1c7c3b',
  'TC': '#005BAC',
  'TCP': '#EAB308',
  'TCM': '#CC0000',
  'TC2000': '#e02020',
  'Top Race': '#ff8c00',
  'ACTC': '#00438a',
  'F2': '#0090D0',
  'F3': '#0D80FF',
  'FE': '#00AEEF',
  'IMSA': '#E42526',
  'TCPM': '#990000',
  'TCPPK': '#006633',
};

export function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || 'var(--accent-blue)';
}

// ========== TYPES ==========

export type Race = {
  id: string;
  category: string;
  categoryShort: string;
  categoryId: string;
  categoryColor?: string;
  categoryImage?: string;
  event: string;
  circuit: string;
  circuitId?: string;
  circuitImage?: string;
  platforms: string[];
  schedules: { id: string; name: string; time: string; startAt: number }[];
  time?: string;
  ticketLink?: string;
  watchLinks?: { platform: string; url: string }[];
};

export type CalendarRace = {
  round: number;
  race: string;
  dates: string;
  status: 'Finished' | 'Upcoming' | 'Next' | 'Live';
  winner: string;
};

export type NewsItem = {
  title: string;
  summary: string;
  link: string;
  source: string;
  category?: string;
  imageUrl?: string;
};

export type F1StandingsRow = {
  pos: string;
  driver: string;
  team: string;
  raceResults: { race: string; pts: string }[];
  totalPts: string;
};

export type F1ConstructorRow = {
  pos: string;
  team: string;
  raceResults: { race: string; pts: string }[];
  totalPts: string;
};

export type WRCStandingRow = {
  pos: string;
  driver: string;
  codriverOrTeam: string;
  points: string;
};

export type WRCStandings = {
  drivers: WRCStandingRow[];
  codrivers: WRCStandingRow[];
  manufacturers: WRCStandingRow[];
  teams: WRCStandingRow[];
};

export type WRCCalendarEvent = {
  round: number;
  rallyName: string;
  dates: string;
  status: 'Finished' | 'Upcoming' | 'Next' | 'Live';
  winner?: string;
};

export type TCStandingRow = {
  pos: string;
  driver: string;
  points: string;
  team?: string;
  totalPts?: string;
};

export const CATEGORY_RESULTS_URLS: Record<string, string> = {
  'F1': 'https://lat.motorsport.com/f1/results/2026',
  'WRC': 'https://es.motorsport.com/wrc/results/2026',
  'NASCAR': 'https://es.motorsport.com/nascar-cup/results/2026',
  'WEC': 'https://es.motorsport.com/wec/results/2026/',
  'IndyCar': 'https://es.motorsport.com/indycar/results/2026/',
  'TC': 'https://tiempos.actc.org.ar/resultados',
  'TCP': 'https://tiempos.actc.org.ar/resultados',
  'TCM': 'https://tiempos.actc.org.ar/resultados',
  'TCPM': 'https://tiempos.actc.org.ar/resultados',
  'TCPK': 'https://tiempos.actc.org.ar/resultados',
  'TCPPK': 'https://tiempos.actc.org.ar/resultados',
  'TC2000': 'https://tc2000.com.ar/carreras.php?accion=tiempos&id=411#'
};

export type TC2000Standings = {
  drivers: TCStandingRow[];
  teams: TCStandingRow[];
  brands: TCStandingRow[];
};

export type WECStandings = {
  hypercarMfr: TCStandingRow[];
  hypercarTeams: TCStandingRow[];
  hypercarDrivers: TCStandingRow[];
  lmgt3Drivers: TCStandingRow[];
};

export type WRCRallyResult = {
  rallyName: string;
  fullResultsUrl: string;
  results: { pos: string; driver: string; codriver: string; team: string; time: string; diff: string }[];
};

// ========== DATA SERVICE ==========

export interface NascarStandings {
  drivers: TCStandingRow[];
  owners: TCStandingRow[];
  manufacturers: TCStandingRow[];
}

export const dataService = {

  // === WEEKLY CALENDAR (VueltaRapida API) ===
  async getWeeklyCalendar(): Promise<Race[]> {
    try {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // USE VERCEL REWRITES (AS IN WORKING VERSION)
      const url = `/api/vueltarapida/races?minDate=${monday.getTime()}&maxDate=${sunday.getTime()}`;
      const categoriesUrl = `/api/vueltarapida/categories`;

      const [racesRes, catRes] = await Promise.all([
        fetch(url),
        fetch(categoriesUrl)
      ]);

      let data;
      if (racesRes.ok) {
        data = await racesRes.json();
      }

      let categoriesMap: Record<string, any> = {};
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData)) {
          catData.forEach((c: any) => {
            if (c.categoryId) categoriesMap[c.categoryId] = c;
          });
        }
      }

      const races = Array.isArray(data) ? data : (data?.races || data?.data || []);
      
      if (races && Array.isArray(races) && races.length > 0) {
        const racesWithImages = await Promise.all(races.map(async (r: any) => {
          const catInfo = categoriesMap[r.categoryId] || {};
          const schedulesList = (r.schedules || []).map((s: any) => {
            const d = new Date(s.startAt || s.start);
            const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
            const dayStr = `${dayNames[d.getDay()]}. ${d.getDate()}`;
            const rawTime = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
            const timeStr = (s.time === '-' || s.time === '' || isNaN(d.getTime())) ? '' : rawTime;
            
            return {
              id: s._id || s.id || Math.random().toString(),
              name: s.name || s.title || '',
              time: timeStr ? `${dayStr}, ${timeStr}` : dayStr,
              startAt: s.startAt || s.start || d.getTime()
            };
          });

          const watchLinks = (r.links || [])
            .filter((l: any) => l.url || l.link)
            .map((l: any) => ({
              platform: l.platform || l.name || 'Ver',
              url: l.url || l.link || ''
            }));

          let circuitImage = r.circuitImage || '';
          const possibleIds = [r.circuit?._id, r.circuitId, r._id].filter(Boolean);
          
          if (!circuitImage && possibleIds.length > 0) {
            for (const cid of possibleIds) {
              try {
                const circuitRes = await this.fetchWithProxy(`https://api.vueltarapida.com/api/circuits/by-circuit-id/${cid}`);
                if (circuitRes && circuitRes.trim() && !circuitRes.startsWith('<!DOCTYPE')) {
                  const circuitData = JSON.parse(circuitRes);
                  const imgUrl = circuitData.circuit?.image || circuitData.circuit?.layoutImage || circuitData.image;
                  if (imgUrl) {
                    circuitImage = imgUrl.startsWith('/') ? `https://vueltarapida.com${imgUrl}` : imgUrl;
                    break; 
                  }
                }
              } catch (err) {}
            }
          }

          // Format circuit name if it's missing but we have circuitId
          let circuitName = r.circuit || '';
          if (!circuitName && r.circuitId) {
            circuitName = r.circuitId.split('_').filter(Boolean).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
          }

          return {
            id: r._id || r.id || '',
            categoryId: r.categoryId || '',
            categoryColor: catInfo.categoryColor || r.categoryColor,
            categoryImage: catInfo.categoryImage || r.categoryImage || (r.categoryId ? `https://api.vueltarapida.com/logos/${r.categoryId}.png` : ''),
            category: r.category || r.name || '',
            categoryShort: r.categoryShort || r.name || '',
            event: (r.completeName || r.name || '').replace(/\s*[\u2013\u2014-]+\s*$/, '').trim(),
            circuit: circuitName.replace(/\s*[\u2013\u2014-]+\s*$/, '').trim(),
            circuitId: r.circuitId,
            circuitImage,
            platforms: (r.links || []).filter((l: any) => l.platform || l.name).map((l: any) => l.platform || l.name || ''),
            schedules: schedulesList,
            time: schedulesList.length > 0 ? schedulesList[0].time : '--:--',
            ticketLink: r.ticketLink || '',
            watchLinks,
          };
        }));
        return racesWithImages;
      }

      // FALLBACK: Scrape the HTML if API returns empty or fails
      console.log('[DataService] API empty or failed, attempting to scrape HTML...');
      const htmlUrl = `/api/vueltarapida-html/calendario`; // Use Vercel rewrite
      const htmlText = await (await fetch(htmlUrl)).text();
      if (!htmlText) return [];

      const doc = new DOMParser().parseFromString(htmlText, 'text/html');
      const eventEls = doc.querySelectorAll('.button-day-item');
      if (eventEls.length === 0) return [];

      const scrapedRaces: Race[] = [];
      eventEls.forEach((el, idx) => {
        const img = el.querySelector('img');
        const category = img?.getAttribute('alt') || img?.getAttribute('title') || 'Otros';
        const time = el.querySelector('p')?.textContent?.trim() || '';
        const logoUrl = img?.getAttribute('src') || '';

        scrapedRaces.push({
          id: `scraped-${idx}`,
          category,
          categoryShort: category,
          categoryId: '',
          categoryColor: getCategoryColor(category),
          categoryImage: logoUrl ? (logoUrl.startsWith('/') ? `https://vueltarapida.com${logoUrl}` : logoUrl) : '',
          event: category, 
          circuit: '',
          circuitImage: '',
          platforms: [],
          schedules: [{ id: `s-${idx}`, name: 'Evento', time: time, startAt: Date.now() }],
          time: time,
          watchLinks: [],
        });
      });

      return scrapedRaces;
    } catch (e) {
      console.error('[DataService] Weekly calendar error:', e);
      return [];
    }
  },

  // === F1 CALENDAR (ESPN JSON API) ===
  async getF1Calendar(): Promise<CalendarRace[]> {
    try {
      const res = await fetch(`/api/espn-json/apis/site/v2/sports/racing/f1/scoreboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const races: CalendarRace[] = [];
      const now = new Date();

      const calendarEntries = data?.leagues?.[0]?.calendar || [];
      const currentEvents = data?.events || [];

      for (let i = 0; i < calendarEntries.length; i++) {
        const entry = calendarEntries[i];
        const endDate = new Date(entry.endDate);
        const startDate = new Date(entry.startDate);
        const raceName = entry.label || `Race ${i + 1}`;

        let status: CalendarRace['status'] = 'Upcoming';
        let winner = '';

        const startOfRace = new Date(startDate);
        startOfRace.setHours(0, 0, 0, 0);
        
        const endOfRace = new Date(endDate);
        endOfRace.setHours(23, 59, 59, 999);

        if (now > endOfRace) {
          status = 'Finished';
        } else if (now >= startOfRace && now <= endOfRace) {
          status = 'Live';
        }


        const matchedEvent = currentEvents.find((ev: any) =>
          raceName.includes(ev.shortName?.replace(' GP', '')) || ev.name?.includes(raceName.split(' ').slice(0, 2).join(' '))
        );
        if (matchedEvent?.status?.type?.detail?.includes('Winner')) {
          winner = matchedEvent.status.type.detail;
        }

        if (status === 'Upcoming') {
          const hasNext = races.some(r => r.status === 'Next');
          if (!hasNext) status = 'Next';
        }

        const dateStr = startDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) +
          ' - ' + endDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

        races.push({ round: i + 1, race: raceName, dates: dateStr, status, winner });
      }
      return races;
    } catch (e) {
      console.error('[DataService] F1 calendar error:', e);
      return [];
    }
  },

  // === WEC NEWS (Motorsport + SoyMotor) ===
  async getWECNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    
    // Source 1: Motorsport.com (Latam)
    try {
      const html = await this.fetchWithProxy('https://lat.motorsport.com/wec/');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('a.ms-item').forEach(art => {
        const title = art.querySelector('.ms-item__title')?.textContent?.trim();
        const link = art.getAttribute('href');
        const img = art.querySelector('img')?.getAttribute('data-src') || art.querySelector('img')?.getAttribute('src');
        if (title && link) {
          allNews.push({
            title, summary: '',
            link: link.startsWith('/') ? `https://lat.motorsport.com${link}` : link,
            source: 'Motorsport.com',
            category: 'WEC',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] Motorsport WEC news error:', e); }

    // Source 2: SoyMotor
    try {
      const html = await this.fetchWithProxy('https://soymotor.com/competicion/noticias/wec');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('.views-row').forEach(row => {
        const titleElem = row.querySelector('h2');
        const linkElem = row.querySelector('a.node-container');
        const imgElem = row.querySelector('img');
        
        const title = titleElem?.textContent?.trim();
        const link = linkElem?.getAttribute('href');
        const img = imgElem?.getAttribute('src') || imgElem?.getAttribute('data-src');
        
        if (title && link) {
          allNews.push({
            title, summary: '',
            link: link.startsWith('/') ? `https://soymotor.com${link}` : link,
            source: 'SoyMotor',
            category: 'WEC',
            imageUrl: img ? (img.startsWith('http') ? img : `https://soymotor.com${img}`) : undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] SoyMotor WEC news error:', e); }

    const seen = new Set<string>();
    return allNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  // === WEC STANDINGS (Motorsport.com) ===
  async getWECStandings(): Promise<WECStandings> {
    const standings: WECStandings = {
      hypercarMfr: [],
      hypercarTeams: [],
      hypercarDrivers: [],
      lmgt3Drivers: []
    };

    const parseMotorsportTable = (html: string) => {
      const rows: TCStandingRow[] = [];
      if (!html) return rows;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // Using the precise row class observed
      const trs = doc.querySelectorAll('tr.ms-table_row');
      
      trs.forEach(tr => {
        const posEl = tr.querySelector('.ms-table_field--pos');
        const pointsEl = tr.querySelector('.ms-table_field--total_points');
        
        let name = '';
        // Try different name selectors based on category
        const driverNameEl = tr.querySelector('.ms-table_field--driver .name-short');
        const teamNameEl = tr.querySelector('.ms-table_field--team .name');
        const constructorNameEl = tr.querySelector('.ms-table_field--result_constructor');
        
        if (driverNameEl) name = driverNameEl.textContent?.trim() || '';
        else if (teamNameEl) name = teamNameEl.textContent?.trim() || '';
        else if (constructorNameEl) name = constructorNameEl.textContent?.trim() || '';
        else {
          // Fallback to name-short class anywhere or second cell
          name = tr.querySelector('.name-short, .name')?.textContent?.trim() || 
                 tr.querySelectorAll('td')[1]?.textContent?.trim() || '';
        }

        const pos = posEl?.textContent?.trim() || '';
        const pts = pointsEl?.textContent?.trim() || '0';
        
        if (pos && name && !isNaN(parseInt(pos))) {
          rows.push({ pos, driver: name, points: pts });
        }
      });
      return rows;
    };

    try {
      // Using stable 2025 URLs to ensure distinct data categories (2026 redirects to default page).
      const [driversHtml, lmgt3Html, mfrHtml, teamsHtml] = await Promise.all([
        this.fetchWithProxy('https://es.motorsport.com/wec/standings/2025/?type=Driver&class='),
        this.fetchWithProxy('https://es.motorsport.com/wec/standings/2025/?type=Driver&class=LMGT3'),
        this.fetchWithProxy('https://es.motorsport.com/wec/standings/2025/?type=Manufacturers&class=HYPERCAR'),
        this.fetchWithProxy('https://es.motorsport.com/wec/standings/2025/?type=Team&class=HYPERCAR')
      ]);

      standings.hypercarDrivers = parseMotorsportTable(driversHtml);
      standings.lmgt3Drivers = parseMotorsportTable(lmgt3Html);
      standings.hypercarMfr = parseMotorsportTable(mfrHtml);
      standings.hypercarTeams = parseMotorsportTable(teamsHtml);

      // Re-use teams for lmgt3Teams if needed, or just leave as is if not provided specifically
      // (User only provided 4 URLs, so we'll populate those 4 fields)
    } catch (e) {
      console.error('[DataService] WEC standings error:', e);
    }
    return standings;
  },

  // === WEC CALENDAR (Campeones) ===
  async getWECCalendar(): Promise<WRCCalendarEvent[]> {
    const calendar: WRCCalendarEvent[] = [];
    try {
      const html = await this.fetchWithProxy('https://campeones.com.ar/calendario-mundial-de-resistencia-2022/');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('table tr');
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const monthsMap: Record<string, number> = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5, 
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
      };

      rows.forEach((row, idx) => {
        if (idx === 0) return; // Skip header
        const tds = row.querySelectorAll('td');
        if (tds.length >= 3) {
          const dateStr = tds[1]?.textContent?.trim() || '';
          const raceName = tds[2]?.textContent?.trim() || '';
          const circuit = tds[3]?.textContent?.trim() || '';
          
          if (raceName || circuit) {
            let status: WRCCalendarEvent['status'] = 'Upcoming';
            
            if (dateStr) {
              const lowerDate = dateStr.toLowerCase();
              let monthName = '';
              let monthIdx = -1;
              
              for (const [m, idx] of Object.entries(monthsMap)) {
                if (lowerDate.includes(m)) {
                  if (m.length > monthName.length) { // Prefer longer matches like "febrero" over "feb"
                    monthName = m;
                    monthIdx = idx;
                  }
                }
              }

              if (monthIdx !== -1) {
                const dayMatches = lowerDate.match(/\d+/g);
                if (dayMatches && dayMatches.length > 0) {
                  const firstDay = parseInt(dayMatches[0]);
                  const lastDay = parseInt(dayMatches[dayMatches.length - 1]);
                  
                  const startDate = new Date(now.getFullYear(), monthIdx, firstDay);
                  const endDate = new Date(now.getFullYear(), monthIdx, lastDay);
                  endDate.setHours(23, 59, 59, 999);

                  if (now > endDate) {
                    status = 'Finished';
                  } else if (now >= startDate && now <= endDate) {
                    status = 'Live';
                  }
                }
              }
            }

            calendar.push({
              round: calendar.length + 1,
              rallyName: raceName || circuit,
              dates: dateStr,
              status
            });
          }
        }
      });

      // Set first Upcoming as Next
      let foundNext = false;
      for (const event of calendar) {
        if (!foundNext && event.status === 'Upcoming') {
          event.status = 'Next';
          foundNext = true;
        }
      }

    } catch (e) { console.error('[DataService] WEC calendar error:', e); }
    return calendar;
  },

  // === F1 NEWS (AS.com + Motorsport.com) ===
  async getF1News(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];

    // Source 1: AS.com
    try {
      const res = await fetch('/api/as/motor/formula_1/');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('article').forEach(art => {
        const t = art.querySelector('h2, h3')?.textContent?.trim();
        const l = art.querySelector('a')?.getAttribute('href');
        if (t && l) {
          allNews.push({
            title: t, summary: '',
            link: l.startsWith('/') ? `https://as.com${l}` : l,
            source: 'AS.com',
            category: 'F1'
          });
        }
      });
    } catch (e) { console.warn('[DataService] AS.com F1 news error:', e); }

    // Source 2: lat.motorsport.com
    try {
      const res = await fetch('/api/motorsport/f1/news/');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('.ms-item, .ms-item_link, article, [class*="article"], [class*="news"]').forEach(art => {
        const anchor = art.tagName === 'A' ? art : art.querySelector('a');
        const t = art.querySelector('.ms-item_title, .ms-item__title, h2, h3, [class*="title"]')?.textContent?.trim()
          || anchor?.textContent?.trim();
        const l = anchor?.getAttribute('href');
        if (t && l && t.length > 15) {
          allNews.push({
            title: t.split('\n').map(s => s.trim()).filter(Boolean).pop() || t,
            summary: '',
            link: l.startsWith('/') ? `https://lat.motorsport.com${l}` : l,
            source: 'Motorsport.com',
            category: 'F1'
          });
        }
      });
    } catch (e) { console.warn('[DataService] Motorsport.com F1 news error:', e); }

    const seen = new Set<string>();
    return allNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  // === WRC NEWS (Motorsport.com + Marca) ===
  async getWRCNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];

    try {
      const html = await this.fetchWithProxy('https://lat.motorsport.com/wrc/');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('.ms-item, .ms-item_link, article, [class*="article"], [class*="news"]').forEach(art => {
        const anchor = art.tagName === 'A' ? art : art.querySelector('a');
        const t = art.querySelector('.ms-item_title, .ms-item__title, h2, h3, [class*="title"]')?.textContent?.trim()
          || anchor?.textContent?.trim();
        const l = anchor?.getAttribute('href');
        if (t && l && t.length > 15) {
          // Strictly filter by category slug
          if (l.includes('/wrc/')) {
            allNews.push({
              title: t.split('\n').map(s => s.trim()).filter(Boolean).pop() || t,
              summary: '',
              link: l.startsWith('/') ? `https://lat.motorsport.com${l}` : l,
              source: 'Motorsport.com',
              category: 'WRC'
            });
          }
        }
      });
    } catch (e) { console.warn('[DataService] Motorsport.com WRC news error:', e); }

    try {
      const html = await this.fetchWithProxy('https://www.marca.com/motor/rallies.html');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('article, .mod-data, [class*="article"]').forEach(art => {
        const t = art.querySelector('h2, h3, h4, .mod-title, [class*="title"]')?.textContent?.trim();
        const l = art.querySelector('a')?.getAttribute('href');
        if (t && l) {
          allNews.push({
            title: t, summary: '',
            link: l.startsWith('/') ? `https://www.marca.com${l}` : l,
            source: 'Marca',
            category: 'WRC'
          });
        }
      });
    } catch (e) { console.warn('[DataService] Marca WRC news error:', e); }

    const seen = new Set<string>();
    return allNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  // === F1 STANDINGS (ESPN JSON API — reliable race-by-race data) ===
  async getF1StandingsFull(): Promise<{ drivers: F1StandingsRow[]; constructors: F1ConstructorRow[] }> {
    const drivers: F1StandingsRow[] = [];
    const constructors: F1ConstructorRow[] = [];

    try {
      const res = await fetch('/api/espn-json/apis/v2/sports/racing/f1/standings');
      if (!res.ok) throw new Error(`ESPN standings HTTP ${res.status}`);
      const data = await res.json();

      const children: any[] = data?.children || [];

      for (const section of children) {
        const entries: any[] = section?.standings?.entries || [];
        const isDrivers = (section?.name || '').toLowerCase().includes('driver');

        if (isDrivers) {
          // Build race column names from first entry's stats (skip rank + points + overall)
          entries.forEach((entry: any) => {
            const athlete = entry?.athlete;
            if (!athlete) return;
            const stats: any[] = entry?.stats || [];
            const rankStat = stats.find((s: any) => s.type === 'rank');
            const ptsStat = stats.find((s: any) => s.type === 'points');
            const pos = rankStat?.displayValue || '';
            const totalPts = ptsStat?.displayValue || '0';
            const raceResults: { race: string; pts: string }[] = [];
            stats.filter((s: any) => s.type !== 'rank' && s.type !== 'points' && s.name !== 'overall' && s.played !== undefined).forEach((s: any) => {
              raceResults.push({ race: s.abbreviation || s.name, pts: s.played ? (s.displayValue?.trim() || '-') : '' });
            });
            const name = athlete.shortName || athlete.displayName || '';
            if (name && pos) drivers.push({ pos, driver: name, team: '', raceResults, totalPts });
          });
        } else {
          // Constructor standings
          entries.forEach((entry: any) => {
            const team = entry?.team;
            if (!team) return;
            const stats: any[] = entry?.stats || [];
            const rankStat = stats.find((s: any) => s.type === 'rank');
            const ptsStat = stats.find((s: any) => s.type === 'points');
            const pos = rankStat?.displayValue || '';
            const totalPts = ptsStat?.displayValue || '0';
            const raceResults: { race: string; pts: string }[] = [];
            stats.filter((s: any) => s.type !== 'rank' && s.type !== 'points' && s.name !== 'overall' && s.played !== undefined).forEach((s: any) => {
              raceResults.push({ race: s.abbreviation || s.name, pts: s.played ? (s.displayValue?.trim() || '-') : '' });
            });
            const teamName = team.displayName || team.name || '';
            if (teamName && pos) constructors.push({ pos, team: teamName, raceResults, totalPts });
          });
        }
      }
    } catch (e) {
      console.error('[DataService] F1 standings (ESPN JSON) error:', e);
    }

    return { drivers, constructors };
  },

  // === WRC CHAMPIONSHIP STANDINGS (lat.motorsport.com — dynamic, year-aware, drivers only) ===
  async getWRCStandings(): Promise<WRCStandings> {
    const standings: WRCStandings = { drivers: [], codrivers: [], manufacturers: [], teams: [] };

    const fetchMarca = async (url: string, key: keyof WRCStandings) => {
      try {
        const html = await this.fetchWithProxy(url);
        if (!html) return;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('table tr');
        
        rows.forEach((row, idx) => {
          if (idx === 0) return; // Skip header
          const pos = row.querySelector('td.posicion')?.textContent?.trim() || '';
          const name = row.querySelector('td.piloto')?.textContent?.trim() || '';
          const pts = row.querySelector('td.puntosmundial')?.textContent?.trim() || '0';
          
          if (pos && name) {
            standings[key].push({
              pos,
              driver: name,
              codriverOrTeam: '',
              points: pts
            });
          }
        });
      } catch (e) {
        console.error(`[DataService] Marca standings error for ${key}:`, e);
      }
    };

    await Promise.all([
      fetchMarca('https://www.marca.com/motor/rallies/clasificacion-pilotos.html', 'drivers'),
      fetchMarca('https://www.marca.com/motor/rallies/clasificacion-equipos.html', 'manufacturers')
    ]);
    return standings;
  },

  // === WRC2 NEWS (Lapeando — LIVE SCRAPING) ===
  async getWRC2News(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('/api/lapeando/noticias?categoria=22');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Select news articles
      const articles = doc.querySelectorAll('.post-block, article, .news-item, .post');
      articles.forEach(art => {
        const linkElem = art.querySelector('a');
        const titleElem = art.querySelector('h1, h2, h3, .title');
        const imgElem = art.querySelector('img');
        
        const title = titleElem?.textContent?.trim() || linkElem?.textContent?.trim() || '';
        const link = linkElem?.getAttribute('href') || '';
        const img = imgElem?.getAttribute('src') || '';
        
        if (title && link) {
          allNews.push({
            title,
            summary: '',
            link: link.startsWith('http') ? link : `https://lapeando.com${link.startsWith('/') ? '' : '/'}${link}`,
            source: 'Lapeando',
            category: 'WRC2',
            imageUrl: img ? (img.startsWith('http') ? img : `https://lapeando.com${img.startsWith('/') ? '' : '/'}${img}`) : undefined
          });
        }
      });

      // Fallback: search all links if specific blocks fail
      if (allNews.length === 0) {
        doc.querySelectorAll('a').forEach(l => {
          const t = l.textContent?.trim();
          const h = l.getAttribute('href');
          if (t && t.length > 25 && h && h.includes('/noticias/')) {
            allNews.push({
              title: t,
              summary: '',
              link: h.startsWith('http') ? h : `https://lapeando.com${h.startsWith('/') ? '' : '/'}${h}`,
              source: 'Lapeando',
              category: 'WRC2'
            });
          }
        });
      }
    } catch (e) { console.warn(`[DataService] WRC2 news error:`, e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
  },

  // === WRC2 STANDINGS (wrc.com — Official) ===
  async getWRC2Standings(): Promise<WRCStandings> {
    const standings: WRCStandings = { drivers: [], codrivers: [], manufacturers: [], teams: [] };
    try {
      const html = await this.fetchWithProxy('/api/wrc-api/championship-overall-results.json?championshipId=337&seasonId=47');
      const data = JSON.parse(html);
      if (data && data.results) {
        data.results.forEach((r: any) => {
          standings.drivers.push({
            pos: r.position?.toString() || '',
            driver: r.driverDisplayName || r.driverName || '',
            codriverOrTeam: r.teamName || '',
            points: r.totalPoints?.toString() || '0'
          });
        });
      }
    } catch (e) { console.error('[DataService] WRC2 standings error:', e); }
    return standings;
  },

  async getWRC2Calendar(): Promise<WRCCalendarEvent[]> {
    try {
      return await this.getWRCCalendar();
    } catch { return []; }
  },

  // === WRC3 NEWS (Diario Rally) ===
  async getWRC3News(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('/api/diariorally/info_cat.asp?idcat=1');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const links = doc.querySelectorAll('a[href*="info_nota.asp"]');
      links.forEach(l => {
        const title = l.textContent?.trim() || '';
        const href = l.getAttribute('href') || '';
        if (title && title.length > 20 && href) {
          allNews.push({
            title,
            summary: '',
            link: href.startsWith('http') ? href : `http://www.diariorally.com.ar/${href}`,
            source: 'Diario Rally',
            category: 'WRC3'
          });
        }
      });
    } catch (e) { console.warn(`[DataService] WRC3 news error:`, e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i).slice(0, 15);
  },

  // === WRC3 STANDINGS (Red Bull API) ===
  async getWRC3Standings(): Promise<WRCStandings> {
    const standings: WRCStandings = { drivers: [], codrivers: [], manufacturers: [], teams: [] };
    try {
      const html = await this.fetchWithProxy('/api/wrc-api/championship-overall-results.json?championshipId=344&seasonId=47');
      const data = JSON.parse(html);
      if (data && data.results) {
        data.results.forEach((r: any) => {
          standings.drivers.push({
            pos: r.position?.toString() || '',
            driver: r.driverDisplayName || r.driverName || '',
            codriverOrTeam: r.teamName || '',
            points: r.totalPoints?.toString() || '0'
          });
        });
      }
    } catch (e) { console.error('[DataService] WRC3 standings error:', e); }
    return standings;
  },

  async getWRC3Calendar(): Promise<WRCCalendarEvent[]> {
    try {
      return await this.getWRCCalendar();
    } catch { return []; }
  },

  // === WRC CALENDAR (Marca.com scraping) ===
  async getWRCCalendar(): Promise<WRCCalendarEvent[]> {
    const events: WRCCalendarEvent[] = [];
    
    try {
      const html = await this.fetchWithProxy('https://www.marca.com/motor/rallies/calendario.html');
      if (!html) return [];
      
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('table.calendario.motor tbody tr');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      rows.forEach((row, idx) => {
        const titleEl = row.querySelector('td.evento');
        let rallyName = titleEl?.textContent?.trim() || '';
        if (!rallyName) return;

        // Clean name
        rallyName = rallyName.replace(/^WRC\s+/i, '').replace(/\s+\d{4}$/, '').trim();

        const dateEl = row.querySelector('td.fecha-inicio');
        const dates = dateEl?.textContent?.trim() || '';
        
        const winnerEl = row.querySelector('td.primero');
        const winner = winnerEl?.textContent?.trim() || '';
        
        // Parse date for "Live" detection (Formato DD-MM-YYYY)
        let status: WRCCalendarEvent['status'] = 'Upcoming';
        
        if (winner) {
          status = 'Finished';
        } else if (dates) {
          const parts = dates.split('-');
          if (parts.length === 3) {
            const eventDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            eventDate.setHours(0,0,0,0);
            
            // Assume rally lasts 4 days
            const endDate = new Date(eventDate);
            endDate.setDate(eventDate.getDate() + 3);
            
            if (today >= eventDate && today <= endDate) {
              status = 'Live';
            } else if (today > endDate) {
              status = 'Finished';
            }
          }
        }

        events.push({ 
          round: idx + 1, 
          rallyName, 
          dates, 
          status,
          winner: winner || undefined
        });
      });

      // Find "Next" event (first Upcoming)
      let foundNext = false;
      events.forEach(ev => {
        if (ev.status === 'Upcoming' && !foundNext) {
          ev.status = 'Next';
          foundNext = true;
        }
      });

      return events;

    } catch (e) {
      console.error('[DataService] Marca WRC calendar error:', e);
      return [];
    }
  },

  // === WRC RALLY RESULTS (lat.motorsport.com) ===
  async getWRCRallyResults(): Promise<WRCRallyResult[]> {
    // ... removed to match App.tsx cleanup if desired, but I'll keep it for now as it's not hurting
    return [];
  },

  // === TC NEWS (SoloTC + Campeones — LIVE SCRAPING) ===
  async getTCNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    console.log('[DataService] Fetching TC news...');

    const tcSources = [
      'https://www.solotc.com.ar/',
      'https://www.solotc.com.ar/turismo-carretera/',
      'https://campeones.com.ar/category/nacionales/tc/'
    ];

    for (const sourceUrl of tcSources) {
      try {
        const isCampeones = sourceUrl.includes('campeones');
        const isSoloTC = sourceUrl.includes('solotc');
        
        console.log(`[DataService] Loading TC source: ${sourceUrl}`);
        const html = await this.fetchWithProxy(sourceUrl);
        console.log(`[DataService] Loaded ${html.length} chars from ${sourceUrl}`);
        
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        if (isSoloTC) {
          console.log(`[DataService] Ultra-aggressive SoloTC scraping for ${sourceUrl}`);
          const allLinks = doc.querySelectorAll('a');
          allLinks.forEach(link => {
            const h = link.getAttribute('href');
            const t = link.textContent?.trim();
            if (h && t && t.length > 20 && h.length > 20 && 
                !h.includes('/category/') && !h.includes('/author/') && !h.includes('/tag/') &&
                !h.includes('facebook.com') && !h.includes('twitter.com') &&
                t !== 'SoloTC | Turismo Carretera') {
              
              const fullLink = h.startsWith('http') ? h : `https://www.solotc.com.ar${h.startsWith('/') ? '' : '/'}${h}`;
              allNews.push({
                title: t, summary: '',
                link: fullLink,
                source: 'SoloTC',
                category: 'TC'
              });
            }
          });

          doc.querySelectorAll('h1, h2, h3').forEach(hd => {
            const link = hd.querySelector('a') || hd.closest('a');
            const t = hd.textContent?.trim();
            const l = link?.getAttribute('href');
            if (t && l && t.length > 10 && t !== 'SoloTC | Turismo Carretera') {
              const fullLink = l.startsWith('http') ? l : `https://www.solotc.com.ar${l.startsWith('/') ? '' : '/'}${l}`;
              allNews.push({
                title: t, summary: '',
                link: fullLink,
                source: 'SoloTC',
                category: 'TC'
              });
            }
          });
        } else if (isCampeones) {
          const items = doc.querySelectorAll('article, .post-item, .elementor-post, .post-block');
          console.log(`[DataService] Campeones items identified: ${items.length}`);
          
          items.forEach(art => {
            const linkElem = art.querySelector('a[href*="/"]');
            const t = linkElem?.textContent?.trim() || art.querySelector('h1, h2, h3, h4')?.textContent?.trim();
            const l = linkElem?.getAttribute('href');
            
            if (t && l && t.length > 10 && l.length > 15) {
              const fullLink = l.startsWith('http') ? l : `https://campeones.com.ar${l.startsWith('/') ? '' : '/'}${l}`;
              allNews.push({
                title: t, summary: '',
                link: fullLink,
                source: 'Campeones',
                category: 'TC'
              });
            }
          });
        }
      } catch (e) { console.warn(`[DataService] Error fetching TC news from ${sourceUrl}:`, e); }
    }

    const seen = new Set<string>();
    const filtered = allNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    console.log(`[DataService] Success! Filtered to ${filtered.length} unique TC news items.`);
    return filtered;
  },

  // === TC STANDINGS (ACTC Tiempos — LIVE SCRAPING) ===
  async getTCStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    console.log('[DataService] Fetching TC standings (Live)...');
    try {
      const html = await this.fetchWithProxy('https://tiempos.actc.org.ar/campeonato-tc/campeonato');
      console.log(`[DataService] Loaded ${html.length} chars from ACTC Tiempos`);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const rows = doc.querySelectorAll('tr'); // Query all TRs directly
      console.log(`[DataService] TR rows found in ACTC: ${rows.length}`);
      
      rows.forEach(row => {
        // Try precise classes first
        let posText = row.querySelector('.col-pos')?.textContent?.trim();
        let driverText = row.querySelector('.col-name')?.textContent?.trim();
        let pointsText = row.querySelector('.col-total')?.textContent?.trim();
        
        // Fallback to cells by index if classes miss (sometimes templates shift)
        if (!posText || !driverText) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            posText = cells[0].textContent?.trim();
            driverText = cells[1].textContent?.trim();
            // Total is usually the last or one of the last
            pointsText = cells[cells.length - 1].textContent?.trim();
          }
        }

        if (posText && driverText && /^\d+$/.test(posText.replace('.', ''))) {
          const driver = driverText.split('\n').map(s => s.trim()).filter(Boolean).join(' ');
          standings.push({ 
            pos: posText.replace('.', ''), 
            driver: driver, 
            points: pointsText || '0' 
          });
        }
      });
    } catch (e) {
      console.error('[DataService] TC standings error:', e);
    }
    console.log(`[DataService] Final TC standings list: ${standings.length} drivers.`);
    return standings;
  },

  // === UNIFIED ACTC CALENDAR HELPER ===
  async _getACTCCalendar(categorySlug: string): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy(`https://actc.org.ar/${categorySlug}/calendario.html`);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const elements = doc.querySelectorAll('.info-race');
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const monthsMap: Record<string, number> = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 
        'jul': 6, 'ago': 7, 'set': 8, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
      };

      elements.forEach((el, idx) => {
        const dateEl = el.querySelector('.date');
        const dayStr = dateEl?.querySelector('span')?.textContent?.trim() || '';
        const monthYearStr = dateEl?.textContent?.replace(dayStr, '').trim().toLowerCase() || '';
        const dates = dayStr ? `${dayStr} ${monthYearStr}` : '';
        
        let status: CalendarRace['status'] = 'Upcoming';
        if (dayStr && monthYearStr) {
          const monthMatch = monthYearStr.match(/[a-z]{3}/);
          if (monthMatch && monthsMap[monthMatch[0]] !== undefined) {
            const raceDate = new Date(now.getFullYear(), monthsMap[monthMatch[0]], parseInt(dayStr));
            raceDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((now.getTime() - raceDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 5) status = 'Finished';
            else if (diffDays >= 0) status = 'Live';
            else status = 'Upcoming';
          }
        }

        const hd = el.querySelector('.hd');
        const race = hd?.querySelector('h2')?.textContent?.trim() || hd?.querySelector('p')?.textContent?.trim() || 'A confirmar';
        const winner = el.querySelector('.winner, .winner .name, .ganador')?.textContent?.trim() || '';
        if (winner || status === 'Finished') status = 'Finished';

        calendar.push({ round: idx + 1, race, dates, status, winner });
      });
    } catch (e) { console.error(`[DataService] ACTC ${categorySlug} calendar error:`, e); }
    return calendar;
  },

  // === TC CALENDAR ===
  async getTCCalendar(): Promise<CalendarRace[]> {
    return this._getACTCCalendar('tc');
  },

  // === TCPK NEWS ===
  async getTCPKNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    console.log('[DataService] Fetching TCPK news...');
    const sources = [
      'https://actc.org.ar/tcpk/noticias.html',
      'https://www.solotc.com.ar/tc-pick-up/'
    ];

    for (const sourceUrl of sources) {
      try {
        const isSoloTC = sourceUrl.includes('solotc');
        console.log(`[DataService] Loading TCPK source: ${sourceUrl}`);
        const html = await this.fetchWithProxy(sourceUrl);
        const doc = new DOMParser().parseFromString(html, 'text/html');

        if (isSoloTC) {
          const allLinks = doc.querySelectorAll('a');
          allLinks.forEach(link => {
            const h = link.getAttribute('href');
            const t = link.textContent?.trim();
            if (h && t && t.length > 20 && h.length > 20 && 
                !h.includes('/category/') && !h.includes('/author/') && !h.includes('/tag/') &&
                !h.includes('facebook.com') && !h.includes('twitter.com') &&
                t !== 'SoloTC | Turismo Carretera') {
              const fullLink = h.startsWith('http') ? h : `https://www.solotc.com.ar${h.startsWith('/') ? '' : '/'}${h}`;
              allNews.push({ title: t, summary: '', link: fullLink, source: 'SoloTC', category: 'TCPK' });
            }
          });
        } else {
          const items = doc.querySelectorAll('.nota, article, .ms-item, .post-block');
          items.forEach(item => {
            const linkElem = item.querySelector('a');
            const t = item.querySelector('h1, h2, h3, .title')?.textContent?.trim() || linkElem?.textContent?.trim();
            const l = linkElem?.getAttribute('href');
            if (t && l && t.length > 10) {
              const fullLink = l.startsWith('http') ? l : `https://actc.org.ar${l.startsWith('/') ? '' : '/'}${l}`;
              allNews.push({ title: t, summary: '', link: fullLink, source: 'ACTC', category: 'TCPK' });
            }
          });
        }
      } catch (e) { console.warn(`[DataService] TCPK news error for ${sourceUrl}:`, e); }
    }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
  },

  // === TCPK STANDINGS ===
  async getTCPKStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy('https://tiempos.actc.org.ar/tc-pick-up/campeonato');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const pos = cells[0].textContent?.trim().replace('.', '');
          const name = cells[1].textContent?.trim().split('\n')[0].trim();
          const pts = cells[cells.length - 1].textContent?.trim();
          if (pos && /^\d+$/.test(pos) && name) {
            standings.push({ pos, driver: name, points: pts || '0' });
          }
        }
      });
    } catch (e) { console.error('[DataService] TCPK standings error:', e); }
    return standings;
  },

  // === TCPK CALENDAR ===
  async getTCPKCalendar(): Promise<CalendarRace[]> {
    return this._getACTCCalendar('tcpk');
  },

  // === INDYCAR NEWS ===
  async getIndyCarNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    const sources = [
      'https://campeones.com.ar/category/internacionales/indycar/',
      'https://as.com/noticias/indycar/'
    ];

    for (const sourceUrl of sources) {
      try {
        const html = await this.fetchWithProxy(sourceUrl);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        if (sourceUrl.includes('campeones')) {
          const articles = doc.querySelectorAll('article');
          articles.forEach(art => {
            const link = art.querySelector('a');
            const title = art.querySelector('h2, h3, h1')?.textContent?.trim();
            const href = link?.getAttribute('href');
            if (title && href) {
              allNews.push({ 
                title, 
                summary: '', 
                link: href.startsWith('http') ? href : `https://campeones.com.ar${href}`, 
                source: 'Campeones', 
                category: 'IndyCar' 
              });
            }
          });
        } else if (sourceUrl.includes('as.com')) {
          // AS.com Scraper - Updated with correct selectors
          const articles = doc.querySelectorAll('.s, article, .cnt-article');
          articles.forEach(art => {
            const titleCol = art.querySelector('.s_t a, h2 a, h3 a');
            const title = titleCol?.textContent?.trim();
            const href = titleCol?.getAttribute('href');
            
            if (title && href && title.length > 10 && !title.includes('Noticias de')) {
              allNews.push({
                title,
                summary: '',
                link: href.startsWith('http') ? href : `https://as.com${href}`,
                source: 'AS.com',
                category: 'IndyCar'
              });
            }
          });
        }
      } catch (e) { console.warn(`[DataService] IndyCar news error:`, e); }
    }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i).slice(0, 15);
  },

  // === NASCAR NEWS ===
  // === NASCAR NEWS ===
  async getNascarNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    const sourceUrl = 'https://campeones.com.ar/category/internacionales/nascar/';

    try {
      const html = await this.fetchWithProxy(sourceUrl);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Campeones News Selectors
      const articles = doc.querySelectorAll('article, .post-item, .elementor-post');
      articles.forEach(art => {
        const link = art.querySelector('a');
        const titleEl = art.querySelector('h1, h2, h3, .title, .entry-title, .elementor-post__title');
        const title = titleEl?.textContent?.trim() || link?.getAttribute('title')?.trim() || link?.textContent?.trim();
        const href = link?.getAttribute('href');
        
        if (title && href && title.length > 10) {
          allNews.push({ 
            title, 
            summary: '', 
            link: href, 
            source: 'Campeones', 
            category: 'NASCAR' 
          });
        }
      });
    } catch (e) { 
      console.warn(`[DataService] NASCAR news error for ${sourceUrl}:`, e); 
    }
    
    // Deduplication and limit
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i).slice(0, 15);
  },

  // === NASCAR STANDINGS ===
  async getNascarStandings(): Promise<NascarStandings> {
    const result: NascarStandings = { drivers: [], owners: [], manufacturers: [] };
    const year = new Date().getFullYear();
    
    // Sources requested by user
    const driverUrl = `https://lat.motorsport.com/nascar-cup/standings/${year}/?type=Driver&class=`;
    const manufacturerUrl = `https://lat.motorsport.com/nascar-cup/standings/${year}/?type=Constructor&class=`;

    // Fetch Drivers
    try {
      const html = await this.fetchWithProxy(driverUrl);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const table = doc.querySelector('table, .ms-table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, idx) => {
          if (idx === 0) return;
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const pos = cells[0].textContent?.trim().replace('.', '');
            const name = cells[1].textContent?.trim().split('\n')[0].trim();
            const pointsCell = row.querySelector('.ms-table_field--total_points');
            const points = pointsCell ? pointsCell.textContent?.trim() : cells[cells.length - 1].textContent?.trim();
            if (pos && /^\d+$/.test(pos) && name) {
              result.drivers.push({ pos, driver: name, points: points || '0' });
            }
          }
        });
      }
    } catch (e) { console.warn(`[DataService] NASCAR driver standings error:`, e); }

    // Fetch Manufacturers (Constructores)
    try {
      const html = await this.fetchWithProxy(manufacturerUrl);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const table = doc.querySelector('table, .ms-table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, idx) => {
          if (idx === 0) return;
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const pos = cells[0].textContent?.trim().replace('.', '');
            const name = cells[1].textContent?.trim().split('\n')[0].trim();
            const pointsCell = row.querySelector('.ms-table_field--total_points');
            const points = pointsCell ? pointsCell.textContent?.trim() : cells[cells.length - 1].textContent?.trim();
            if (pos && /^\d+$/.test(pos) && name) {
              result.manufacturers.push({ pos, driver: name, points: points || '0' });
            }
          }
        });
      }
    } catch (e) { console.warn(`[DataService] NASCAR manufacturer standings error:`, e); }

    return result;
  },

  // === NASCAR CALENDAR ===
  async getNascarCalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    const year = new Date().getFullYear();
    const url = `https://lat.motorsport.com/nascar-cup/schedule/${year}/?all_event_types=1`;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    try {
      const html = await this.fetchWithProxy(url);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Try JSON-LD first (Motorsport usually has it)
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      let foundJsonEvents: any[] = [];
      scripts.forEach(script => {
        try {
          const content = script.textContent || '';
          const data = JSON.parse(content);
          const potentialEvents = Array.isArray(data) ? data : (data['@graph'] || (data.itemListElement?.map((e:any)=>e.item) || []));
          potentialEvents.forEach((ev: any) => {
            if (ev?.['@type'] === 'Event' || ev?.['@type'] === 'SportsEvent') {
              foundJsonEvents.push(ev);
            }
          });
        } catch (e) { /* ignore */ }
      });

      const items = doc.querySelectorAll('.ms-schedule-table__item, tr[class*="event-row"]');
      const groups: { [key: string]: { sessions: any[], round?: number, jsonEvent?: any } } = {};
      
      items.forEach(item => {
        const nameEl = item.querySelector('.ms-schedule-table-item-main__event .ms-link, .race-name, .event-name');
        if (!nameEl) return;
        const name = nameEl.textContent?.trim() || '';
        if (!groups[name]) groups[name] = { sessions: [] };
        
        // Find round
        const roundEl = item.querySelector('.ms-schedule-table-item__round');
        if (roundEl && !groups[name].round) {
          groups[name].round = parseInt(roundEl.textContent?.trim() || '0');
        }
        
        // Find corresponding JSON event
        if (!groups[name].jsonEvent && foundJsonEvents.length > 0) {
          groups[name].jsonEvent = foundJsonEvents.find(je => {
            const jeName = (je.name || '').toLowerCase();
            const itName = name.toLowerCase();
            return jeName.includes(itName) || itName.includes(jeName);
          });
        }
        
        groups[name].sessions.push(item);
      });

      const eventList = Object.entries(groups).map(([eventName, group]) => {
        let dateRange = '';
        let startDateIso: Date | null = null;
        let endDateIso: Date | null = null;
        const parsedDates: { date: Date, original: string }[] = [];

        // 1. Try JSON Event dates
        if (group.jsonEvent) {
          if (group.jsonEvent.startDate) startDateIso = new Date(group.jsonEvent.startDate);
          if (group.jsonEvent.endDate) endDateIso = new Date(group.jsonEvent.endDate);
        }

        // 2. Extract dates from sessions
        group.sessions.forEach(s => {
          const dEl = s.querySelector('.ms-schedule-table-subevent-day__main, .date');
          const dStr = dEl?.textContent?.trim();
          const dIso = s.querySelector('time')?.getAttribute('datetime');
          if (dIso) {
            parsedDates.push({ date: new Date(dIso), original: dStr || '' });
          } else if (dStr) {
            const match = dStr.match(/(\d+)\s+([a-zA-Z]+)/);
            if (match) {
              const day = parseInt(match[1]);
              const monthStr = match[2].toLowerCase().substring(0, 3);
              const months: {[k:string]:number} = { 'ene':0,'feb':1,'mar':2,'abr':3,'may':4,'jun':5,'jul':6,'ago':7,'sep':8,'oct':9,'nov':10,'dic':11,'jan':0,'apr':3,'aug':7,'dec':11 };
              const month = months[monthStr] !== undefined ? months[monthStr] : now.getMonth();
              parsedDates.push({ date: new Date(year, month, day), original: dStr });
            }
          }
        });

        parsedDates.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (startDateIso && endDateIso) {
          const startStr = startDateIso.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
          const endStr = endDateIso.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
          dateRange = startStr === endStr ? startStr : `${startDateIso.getDate()} ${startDateIso.toLocaleString('es-ES',{month:'short'})} - ${endStr}`;
        } else if (parsedDates.length > 0) {
          const first = parsedDates[0];
          const last = parsedDates[parsedDates.length - 1];
          if (first.date.getTime() === last.date.getTime()) {
            dateRange = first.original;
          } else {
            const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            dateRange = `${first.date.getDate()} ${shortMonths[first.date.getMonth()]} - ${last.date.getDate()} ${shortMonths[last.date.getMonth()]}`;
          }
        }

        // Status logic
        let status: CalendarRace['status'] = 'Upcoming';
        const isFinished = group.sessions.some(s => s.classList.contains('is-finished') || s.querySelector('.icon-check, .finished'));
        
        if (isFinished) {
          status = 'Finished';
        } else {
          const sDate = startDateIso || (parsedDates.length > 0 ? parsedDates[0].date : null);
          const eDate = endDateIso || (parsedDates.length > 0 ? parsedDates[parsedDates.length - 1].date : null);
          
          if (sDate && eDate) {
            const startOfDay = new Date(sDate); startOfDay.setHours(0,0,0,0);
            const endOfDay = new Date(eDate); endOfDay.setHours(23,59,59,999);
            if (now >= startOfDay && now <= endOfDay) status = 'Live';
            else if (now > endOfDay) status = 'Finished';
            else status = 'Upcoming';
          }
        }

        const raceSession = group.sessions.find(s => s.textContent?.toLowerCase().includes('race') || s.textContent?.toLowerCase().includes('carrera'));
        const sortDate = startDateIso || (parsedDates.length > 0 ? parsedDates[0].date : new Date(year, 11, 31));

        return {
          eventName,
          dateRange,
          status,
          sortDate,
          winner: raceSession?.querySelector('.winner-name, .winner')?.textContent?.trim() || ''
        };
      });

      // Sort by date and assign rounds
      eventList.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
      eventList.forEach((ev, idx) => {
        calendar.push({
          round: idx + 1,
          race: ev.eventName,
          dates: ev.dateRange,
          status: ev.status,
          winner: ev.winner
        });
      });

    } catch (e) { console.warn(`[DataService] NASCAR calendar error:`, e); }

    return calendar;
  },

  // === INDYCAR STANDINGS ===
  async getIndyCarStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    const year = new Date().getFullYear();
    try {
      const html = await this.fetchWithProxy(`https://es.motorsport.com/indycar/standings/${year}/`);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const table = doc.querySelector('table, .ms-table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const pos = cells[0].textContent?.trim().replace('.', '');
            const driver = cells[1].textContent?.trim().split('\n')[0].trim();
            // Total points usually has a specific class on Motorsport
            const pointsCell = row.querySelector('.ms-table_field--total_points');
            const points = pointsCell ? pointsCell.textContent?.trim() : cells[cells.length - 1].textContent?.trim();
            
            if (pos && /^\d+$/.test(pos) && driver) {
              standings.push({ pos, driver, points: points || '0' });
            }
          }
        });
      }
    } catch (e) { console.error('[DataService] IndyCar standings error:', e); }
    return standings;
  },

  // === INDYCAR CALENDAR ===
  async getIndyCarCalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    const year = new Date().getFullYear();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    try {
      const html = await this.fetchWithProxy(`https://es.motorsport.com/indycar/schedule/${year}/`);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Try to find JSON-LD first (most reliable)
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      let foundJsonEvents: any[] = [];
      
      scripts.forEach(script => {
        try {
          const content = script.textContent || '';
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const list = parsed.filter(item => item['@type'] === 'SportsEvent');
            if (list.length > 0) foundJsonEvents = list;
          } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
            const list = parsed['@graph'].filter((item: any) => item['@type'] === 'SportsEvent');
            if (list.length > 0) foundJsonEvents = list;
          }
        } catch (e) {}
      });

      if (foundJsonEvents.length > 0) {
        foundJsonEvents.forEach((ev, idx) => {
          const eventName = ev.name?.replace(', IndyCar - 2025', '').replace(', IndyCar - 2026', '').replace(', IndyCar - 2024', '').trim();
          const startDate = new Date(ev.startDate);
          const endDate = new Date(ev.endDate);
          
          let status: CalendarRace['status'] = 'Upcoming';
          if (now >= startDate && now <= endDate) {
            status = 'Live';
          } else if (now > endDate) {
            status = 'Finished';
          }
          
          const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          let dates = `${startDate.getDate()} ${shortMonths[startDate.getMonth()]}`;
          if (startDate.getTime() !== endDate.getTime()) {
            dates += ` - ${endDate.getDate()} ${shortMonths[endDate.getMonth()]}`;
          }

          calendar.push({
            round: idx + 1,
            race: eventName || 'IndyCar Event',
            dates,
            status,
            winner: ''
          });
        });
        return calendar;
      }

      // Fallback to table scraping if JSON-LD fails
      const rows = doc.querySelectorAll('.ms-schedule-table__item, tr');
      
      const eventGroups: Record<string, { sessions: any[], round?: number }> = {};
      let tempRound = 1;

      rows.forEach(row => {
        // Event title (e.g. St. Petersburg) is often in its own hidden span or context
        const eventEl = row.querySelector('.ms-schedule-table-item-main__event .ms-link span, .ms-schedule-table-subevent-day__title .hidden');
        const sessionEl = row.querySelector('.ms-schedule-table-subevent-day__title, .race-name');
        const dateEl = row.querySelector('.ms-schedule-table-subevent-day__main, .date');
        
        if (sessionEl && dateEl) {
          const eventName = eventEl?.textContent?.trim() || sessionEl.textContent?.trim().split('-')[0].trim() || 'IndyCar Event';
          const sessionName = sessionEl.textContent?.trim() || '';
          const dateStr = dateEl.textContent?.trim() || '';
          
          if (!eventGroups[eventName]) {
            eventGroups[eventName] = { sessions: [], round: tempRound++ };
          }
          eventGroups[eventName].sessions.push({ sessionName, dateStr, row });
        }
      });

      Object.entries(eventGroups).forEach(([eventName, group]) => {
        if (group.sessions.length === 0) return;

        // Group by min/max dates
        const months: Record<string, number> = {
          'ene': 0, 'jan': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'apr': 3, 'may': 4,
          'jun': 5, 'jul': 6, 'ago': 7, 'aug': 7, 'sep': 8, 'set': 8, 'oct': 9, 'nov': 10, 'dic': 11, 'dec': 11
        };

        const parsedDates = group.sessions.map(s => {
          const dateMatch = s.dateStr.match(/(\d+)\s+([a-zA-Z]{3})/);
          if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const month = months[dateMatch[2].toLowerCase().substring(0, 3)];
            if (month !== undefined) return { day, month, date: new Date(year, month, day) };
          }
          // Fallback to ISO parsing if available (from JSON-LD possibly)
          return null;
        }).filter(Boolean) as { day: number, month: number, date: Date }[];

        const startDateIso = group.sessions[0].startDate ? new Date(group.sessions[0].startDate) : null;
        const endDateIso = group.sessions[0].endDate ? new Date(group.sessions[0].endDate) : null;

        let dateRange = group.sessions[0].dateStr;
        if (parsedDates.length > 0) {
          const minDate = parsedDates.reduce((a, b) => a.date < b.date ? a : b);
          const maxDate = parsedDates.reduce((a, b) => a.date > b.date ? a : b);
          
          if (minDate.date.getTime() === maxDate.date.getTime()) {
            dateRange = group.sessions[0].dateStr;
          } else {
            const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            dateRange = `${minDate.day} ${shortMonths[minDate.month]} - ${maxDate.day} ${shortMonths[maxDate.month]}`;
          }
        }

        // Status logic based on the "Race" session or 5-day rule on the last session
        const raceSession = group.sessions.find(s => s.sessionName.toLowerCase().includes('carrera') || s.sessionName.toLowerCase().includes('race'));
        
        let status: CalendarRace['status'] = 'Upcoming';
        const isFinished = group.sessions.some(s => s.row.classList.contains('is-finished') || s.row.querySelector('.icon-check, .finished'));
        
        if (isFinished) {
          status = 'Finished';
        } else if (startDateIso && endDateIso) {
          // Robust logic for JSON-LD events
          if (now >= startDateIso && now <= endDateIso) {
            status = 'Live';
          } else if (now > endDateIso) {
            const diff = (now.getTime() - endDateIso.getTime()) / (1000 * 60 * 60 * 24);
            status = diff >= 5 ? 'Finished' : 'Live';
          } else {
            status = 'Upcoming';
          }
        } else if (parsedDates.length > 0) {
          const firstDate = parsedDates[0].date;
          const lastDate = parsedDates[parsedDates.length - 1].date;
          
          if (now >= firstDate && now <= lastDate) {
            status = 'Live';
          } else if (now > lastDate) {
            const diff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
            status = diff >= 5 ? 'Finished' : 'Live';
          } else {
            status = 'Upcoming';
          }
        }

        calendar.push({
          round: group.round || 1,
          race: eventName,
          dates: dateRange,
          status,
          winner: raceSession?.row.querySelector('.winner-name, .winner')?.textContent?.trim() || ''
        });
      });

    } catch (e) { console.error('[DataService] IndyCar calendar error:', e); }
    return calendar;
  },

  // === CORS PROXY HELPER ===
  // === TCP NEWS ===
  async getTCPNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://actc.org.ar/tcp/noticias.html');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // The internal layout uses specific links for news
      const links = doc.querySelectorAll('a[href*="/noticias/"]');
      links.forEach(l => {
        const title = l.querySelector('h1, h2, h3, .title')?.textContent?.trim() || 
                      l.textContent?.trim() || '';
        const href = l.getAttribute('href');
        if (title && title.length > 10 && href) {
          const fullLink = href.startsWith('http') ? href : `https://actc.org.ar${href.startsWith('/') ? '' : '/'}${href}`;
          allNews.push({ 
            title: title, 
            summary: '', 
            link: fullLink, 
            source: 'ACTC', 
            category: 'TCP',
            imageUrl: undefined
          });
        }
      });
      
      // Fallback for general items if necessary
      if (allNews.length === 0) {
        const items = doc.querySelectorAll('.nota, article, .post-block, .noticia');
        items.forEach(item => {
          const linkElem = item.querySelector('a');
          const t = item.querySelector('h1, h2, h3, .title')?.textContent?.trim() || linkElem?.textContent?.trim();
          const l = linkElem?.getAttribute('href');
          if (t && l && t.length > 10) {
            const fullLink = l.startsWith('http') ? l : `https://actc.org.ar${l.startsWith('/') ? '' : '/'}${l}`;
            allNews.push({ title: t, summary: '', link: fullLink, source: 'ACTC', category: 'TCP', imageUrl: undefined });
          }
        });
      }
    } catch (e) { console.warn(`[DataService] TCP news error:`, e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
  },

  // === TCP STANDINGS ===
  async getTCPStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy('https://tiempos.actc.org.ar/campeonato-tc-pista/campeonato');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const pos = cells[0].textContent?.trim().replace('.', '');
          const name = cells[1].textContent?.trim().split('\n')[0].trim();
          const pts = cells[cells.length - 1].textContent?.trim();
          if (pos && /^\d+$/.test(pos) && name) {
            standings.push({ pos, driver: name, points: pts || '0' });
          }
        }
      });
    } catch (e) { console.error('[DataService] TCP standings error:', e); }
    return standings;
  },

  // === TCP CALENDAR ===
  async getTCPCalendar(): Promise<CalendarRace[]> {
    return this._getACTCCalendar('tcp');
  },

  // === TCM NEWS ===
  async getTCMNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://actc.org.ar/tcm/noticias.html');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href*="/noticias/"]');
      links.forEach(l => {
        const title = l.querySelector('h1, h2, h3, .title')?.textContent?.trim() || 
                      l.textContent?.trim() || '';
        const href = l.getAttribute('href');
        if (title && title.length > 10 && href) {
          const fullLink = href.startsWith('http') ? href : `https://actc.org.ar${href.startsWith('/') ? '' : '/'}${href}`;
          allNews.push({ 
            title: title, 
            summary: '', 
            link: fullLink, 
            source: 'ACTC', 
            category: 'TCM',
            imageUrl: undefined
          });
        }
      });
    } catch (e) { console.warn(`[DataService] TCM news error:`, e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
  },

  // === TCM STANDINGS ===
  async getTCMStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy('https://tiempos.actc.org.ar/tc-mouras/campeonato');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const pos = cells[0].textContent?.trim().replace('.', '');
          const name = cells[1].textContent?.trim().split('\n')[0].trim();
          const pts = cells[cells.length - 1].textContent?.trim();
          if (pos && /^\d+$/.test(pos) && name) {
            standings.push({ pos, driver: name, points: pts || '0' });
          }
        }
      });
    } catch (e) { console.error('[DataService] TCM standings error:', e); }
    return standings;
  },

  // === TCM CALENDAR ===
  async getTCMCalendar(): Promise<CalendarRace[]> {
    return this._getACTCCalendar('tcm');
  },

  // === TCPM NEWS ===
  async getTCPMNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://actc.org.ar/tcpm/noticias.html');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href*="/noticias/"]');
      links.forEach(l => {
        const title = l.querySelector('h1, h2, h3, .title')?.textContent?.trim() || 
                      l.textContent?.trim() || '';
        const href = l.getAttribute('href');
        if (title && title.length > 10 && href) {
          const fullLink = href.startsWith('http') ? href : `https://actc.org.ar${href.startsWith('/') ? '' : '/'}${href}`;
          allNews.push({ 
            title: title, 
            summary: '', 
            link: fullLink, 
            source: 'ACTC', 
            category: 'TCPM',
            imageUrl: undefined
          });
        }
      });
    } catch (e) { console.warn(`[DataService] TCPM news error:`, e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
  },

  // === TCPM STANDINGS ===
  async getTCPMStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy('https://tiempos.actc.org.ar/tc-pista-mouras/campeonato');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const pos = cells[0].textContent?.trim().replace('.', '');
          const name = cells[1].textContent?.trim().split('\n')[0].trim();
          const pts = cells[cells.length - 1].textContent?.trim();
          if (pos && /^\d+$/.test(pos) && name) {
            standings.push({ pos, driver: name, points: pts || '0' });
          }
        }
      });
    } catch (e) { console.error('[DataService] TCPM standings error:', e); }
    return standings;
  },

  // === TCPM CALENDAR ===
  async getTCPMCalendar(): Promise<CalendarRace[]> {
    return this._getACTCCalendar('tcpm');
  },

  // === TCPPK NEWS ===
  async getTCPPKNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://actc.org.ar/tcppk/noticias.html');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href*="/noticias/"]');
      links.forEach(l => {
        const title = l.querySelector('h1, h2, h3, .title')?.textContent?.trim() || 
                      l.textContent?.trim() || '';
        const href = l.getAttribute('href');
        if (title && title.length > 10 && href) {
          const fullLink = href.startsWith('http') ? href : `https://actc.org.ar${href.startsWith('/') ? '' : '/'}${href}`;
          allNews.push({ 
            title: title, 
            summary: '', 
            link: fullLink, 
            source: 'ACTC', 
            category: 'TCPPK',
            imageUrl: undefined
          });
        }
      });
    } catch (e) { console.warn(`[DataService] TCPPK news error:`, e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
  },

  // === TCPPK STANDINGS ===
  async getTCPPKStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy('https://tiempos.actc.org.ar/tcppick-up/campeonato');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const pos = cells[0].textContent?.trim().replace('.', '');
          const name = cells[1].textContent?.trim().split('\n')[0].trim();
          const pts = cells[cells.length - 1].textContent?.trim();
          if (pos && /^\d+$/.test(pos) && name) {
            standings.push({ pos, driver: name, points: pts || '0' });
          }
        }
      });
    } catch (e) { console.error('[DataService] TCPPK standings error:', e); }
    return standings;
  },

  // === TCPPK CALENDAR ===
  async getTCPPKCalendar(): Promise<CalendarRace[]> {
    return this._getACTCCalendar('tcppk');
  },

  // === TC2000 ===
  async getTC2000Calendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy('https://tc2000.com.ar/carreras.php?evento=calendario');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items = doc.querySelectorAll('.box-fechas');
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const monthsMap: Record<string, number> = {
        'ENE': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3, 'MAY': 4, 'JUN': 5, 
        'JUL': 6, 'AGO': 7, 'SET': 8, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11
      };

      items.forEach((el, idx) => {
        const roundStr = el.querySelector('.item-fechas')?.textContent?.trim() || '';
        const round = parseInt(roundStr) || idx + 1;
        const dateStr = el.querySelector('.gris')?.textContent?.trim() || ''; // DOM 15 / MAR
        const eventName = el.querySelector('h3')?.textContent?.trim() || 'A confirmar';
        
        let status: CalendarRace['status'] = 'Upcoming';
        if (dateStr) {
          // Robust regex to find day and month: "15 / MAR", "15-03", "15/03", "DOM 15 / MAR"
          const match = dateStr.toUpperCase().match(/(\d{1,2})\s*[\/\.-]?\s*([A-Z]{3}|\d{1,2})/);
          
          if (match) {
            const day = parseInt(match[1]);
            const monthPart = match[2];
            let month = monthsMap[monthPart];
            if (month === undefined && /^\d+$/.test(monthPart)) {
              month = parseInt(monthPart) - 1;
            }
            
            if (month !== undefined) {
              const raceYear = now.getFullYear();
              const raceDate = new Date(raceYear, month, day);
              raceDate.setHours(0, 0, 0, 0);

              if (raceDate.getTime() === now.getTime()) {
                status = 'Live';
              } else if (raceDate.getTime() < now.getTime()) {
                status = 'Finished';
              } else {
                status = 'Upcoming';
              }
            }
          }
        }

        calendar.push({ round, race: eventName, dates: dateStr, status, winner: '' });
      });
    } catch (e) { console.error('[DataService] TC2000 calendar error:', e); }
    return calendar;
  },

  async getTC2000Standings(): Promise<TC2000Standings> {
    const standings: TC2000Standings = { drivers: [], teams: [], brands: [] };
    try {
      const html = await this.fetchWithProxy('https://tc2000.com.ar/estadisticas.php?accion=posiciones');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const parseTable = (tabId: string) => {
        const rows: TCStandingRow[] = [];
        const tab = doc.getElementById(tabId);
        if (!tab) return rows;
        const items = tab.querySelectorAll('.puntajes');
        items.forEach(ul => {
          const posRaw = ul.querySelector('.posicion')?.textContent?.trim() || '';
          const pos = posRaw.replace('°', '').replace('&deg;', '').trim();
          const name = ul.querySelector('.piloto span')?.textContent?.trim() || 
                       ul.querySelector('.piloto')?.textContent?.trim() || '';
          const pts = ul.querySelector('.total')?.textContent?.trim() || '0';
          if (name) rows.push({ pos, driver: name, points: pts, totalPts: pts });
        });
        return rows;
      };

      standings.drivers = parseTable('tabs-1');
      standings.teams = parseTable('tabs-2');
      standings.brands = parseTable('tabs-3');
    } catch (e) { console.error('[DataService] TC2000 standings error:', e); }
    return standings;
  },

  async getTC2000News(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      // 1. Official News
      try {
        const officialHtml = await this.fetchWithProxy('https://tc2000.com.ar/noticias.php');
        const officialDoc = new DOMParser().parseFromString(officialHtml, 'text/html');
        officialDoc.querySelectorAll('.item_listado_multimedia').forEach(el => {
          const title = el.querySelector('h3')?.textContent?.trim() || '';
          const link = el.querySelector('a')?.getAttribute('href') || '';
          const img = el.querySelector('img')?.getAttribute('src') || undefined;
          if (title) {
            allNews.push({
              title,
              summary: '',
              link: link.startsWith('http') ? link : `https://tc2000.com.ar/${link}`,
              source: 'Oficial',
              imageUrl: img ? (img.startsWith('http') ? img : `https://tc2000.com.ar/${img}`) : undefined,
              category: 'TC2000'
            });
          }
        });
      } catch (e) {}

      // 2. Carburando
      try {
        const carbHtml = await this.fetchWithProxy('https://carburando.com/categorias/tc2000');
        const carbDoc = new DOMParser().parseFromString(carbHtml, 'text/html');
        carbDoc.querySelectorAll('article').forEach(el => {
           const title = el.querySelector('h1.title, h2.title')?.textContent?.trim();
           const link = el.querySelector('a')?.getAttribute('href');
           const img = el.querySelector('img')?.getAttribute('data-src') || el.querySelector('img')?.getAttribute('src');
           if (title && link) {
             allNews.push({
               title,
               summary: '',
               link: link.startsWith('http') ? link : `https://www.carburando.com${link}`,
               source: 'Carburando',
               imageUrl: img || undefined,
               category: 'TC2000'
             });
           }
        });
      } catch (e) {}

      // 3. Campeones
      try {
        const campHtml = await this.fetchWithProxy('https://campeones.com.ar/category/nacionales/tc2000/');
        const campDoc = new DOMParser().parseFromString(campHtml, 'text/html');
        const articles = campDoc.querySelectorAll('article.elementor-article-post, .post-item, article');
        articles.forEach(el => {
          const title = el.querySelector('h2, h3, .post-title')?.textContent?.trim() || '';
          const link = el.querySelector('a')?.getAttribute('href') || undefined;
          const img = el.querySelector('img')?.getAttribute('src') || undefined;
          if (title && link) {
            allNews.push({
              title,
              summary: '',
              link,
              source: 'Campeones',
              imageUrl: img || undefined,
              category: 'TC2000'
            });
          }
        });
      } catch (e) {}

    } catch (e) { console.error('[DataService] TC2000 news error:', e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i).slice(0, 30);
  },

  async fetchWithProxy(targetUrl: string): Promise<string> {
    // 1. Local/Internal
    if (targetUrl.startsWith('/')) {
      try {
        const res = await fetch(targetUrl);
        if (res.ok) return await res.text();
        return '';
      } catch (e) { return ''; }
    }

    const cacheBuster = `cb=${Date.now()}`;
    const cleanUrl = targetUrl.includes('?') ? `${targetUrl}&${cacheBuster}` : `${targetUrl}?${cacheBuster}`;

    // 2. PRIMARY: Our Serverless Proxy (bypass CORS & 403)
    try {
      const serverlessUrl = `/api/proxy?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(serverlessUrl);
      if (res.ok) {
        const text = await res.text();
        // More lenient check for content: if it contains an opening tag or tr.ms-table_row it's likely valid HTML
        if (text && text.length > 20 && (text.includes('<') || text.includes('ms-table_row'))) {
          return text;
        }
      }
      console.warn(`[DataService] Serverless proxy failed or returned 403 for ${targetUrl}`);
    } catch (e) {
      console.warn(`[DataService] Serverless proxy exception:`, e);
    }

    // 3. FALLBACK: Public CORS Proxies with different IPs
    const publicProxies = [
      (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&t=${Date.now()}`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];

    for (const proxyFn of publicProxies) {
      try {
        const proxyUrl = proxyFn(targetUrl);
        const res = await fetch(proxyUrl); 
        if (!res.ok) continue;

        if (proxyUrl.includes('allorigins')) {
          const data = await res.json();
          if (data && data.contents) return data.contents;
          continue;
        }
        
        const text = await res.text();
        if (text && text.length > 20 && !text.includes('Forbidden') && !text.includes('<title>403')) {
          return text;
        }
      } catch (e) {}
    }

    // 4. LAST STAND: Legacy Rewrites
    try {
      let proxyPath = targetUrl
        .replace('https://tc2000.com.ar', '/api/tc2000')
        .replace('https://carburando.com', '/api/carburando')
        .replace('https://www.wrc.com', '/api/wrc')
        .replace('https://api.vueltarapida.com/api', '/api/vueltarapida')
        .replace('https://api.vueltarapida.com', '/api/vueltarapida')
        .replace('https://actc.org.ar', '/api/actc')
        .replace('https://vueltarapida.com', '/api/vueltarapida-html')
        .replace('https://www.fiawec.com/en', '/api/wec-api')
        .replace('https://soymotor.com', '/api/soymotor')
        .replace('https://campeones.com.ar', '/api/campeones');

        if (proxyPath !== targetUrl) {
        const res = await fetch(`${proxyPath}${proxyPath.includes('?') ? '&' : '?'}${cacheBuster}`);
        if (res.ok) return await res.text();
      }
    } catch (e) {}

    throw new Error('All proxy methods failed to bypass 403/CORS');
  },
  
  CATEGORY_RESULTS_URLS,
};

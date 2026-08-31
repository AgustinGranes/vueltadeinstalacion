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
  'WRC2': '#f57c00',
  'IndyCar': '#0057B8',
  'IndyCar Series': '#0057B8',
  'NASCAR': '#FFD659',
  'WEC': '#0288d1',
  'TN': '#1c7c3b',
  'TC': '#005BAC',
  'TCP': '#EAB308',
  'TCM': '#CC0000',
  'TC2000': '#e02020',
  'Top Race': '#ff8c00',
  'ACTC': '#00438a',
  'F2': '#0288d1',
  'F3': '#ff0000',
  'FE': '#0288d1',
  'IMSA': '#E42526',
  'TCPM': '#990000',
  'TCPPK': '#006633',
  'TCPK': '#FFD659',
  'NASCARO': '#FFD659',
  'NASCART': '#ff0000',
  'TNC3': '#e02020',
  'TNC2': '#0288d1',
  'F1A': '#9c27b0',
  'SUPERCARS': '#e10600',
  'GTWC': '#e10600',
  'BTCC': '#4B0082',
  'DTM': '#FFCC00',
  'SF': '#1a1a1a',
  'PROCAR4000': '#e8002d',
  'ELMS': '#0288d1',
  'MotoGP': '#e10600',
  'WORLD SBK': '#e10600',
  'WTCR': '#e10600',
  'TCRSA': '#e8002d',
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
  lat?: number;
  long?: number;
};

export type CalendarRace = {
  round: number;
  race: string;
  dates: string;
  status: 'Finished' | 'Upcoming' | 'Next' | 'Live' | 'Cancelled';
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
  car?: string | number;
};

export const CATEGORY_RESULTS_URLS: Record<string, string> = {
  'F1': 'https://www.formula1.com/en/results/2026/races/1281/japan/race-result',
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
  'TC2000': 'https://tc2000.com.ar/carreras.php?accion=tiempos&id=411#',
  'IMSA': 'https://lat.motorsport.com/imsa/results/2026',
  'NASCARO': 'https://www.nascar.com/results/nascar-oreilly-auto-parts-series/',
  'NASCART': 'https://www.nascar.com/live-results/nascar-craftsman-truck-series/2026-fresh-from-florida-250/',
  'F2': 'https://lat.motorsport.com/fia-f2/results/2026',
  'F3': 'https://lat.motorsport.com/fiaf3/results/2026/albert-park-664972/',
  'FE': 'https://lat.motorsport.com/formula-e/results/2026/eprix-de-madrid-en-el-jarama/',
  'TNC3': 'https://apat.org.ar/carreras/calendario',
  'MotoGP': 'https://as.com/resultados/motor/motogp/clasificacion/races/',
  'F1A': 'https://lat.motorsport.com/f1-academy/results/2026/shanghai-664714/',
  'SUPERCARS': 'https://lat.motorsport.com/v8supercars/results/2026/sydney-500/',
  'BTCC': 'https://btcc.net/results/race-results/2026-donington-park/',
  'DTM': 'https://es.motorsport.com/dtm/results/2026',
};

export const MotoGP_CALENDAR_URL = 'https://lat.motorsport.com/motogp/schedule/2026/';
export const MotoGP_NEWS_URL = 'https://as.com/noticias/moto-gp/';
export const MotoGP_DRIVERS_URL = 'https://lat.motorsport.com/motogp/standings/2026/';
export const MotoGP_TEAMS_URL = 'https://lat.motorsport.com/motogp/standings/2026/?type=Team&class=';
export const MotoGP_CONS_URL = 'https://lat.motorsport.com/motogp/standings/2026/?type=Constructor&class=';

export const F1A_STANDINGS_URL = 'https://lat.motorsport.com/f1-academy/standings/2026/';
export const F1A_NEWS_URL = 'https://lat.motorsport.com/f1-academy/news/';
export const F1A_CALENDAR_URL = 'https://es.motorsport.com/f1-academy/schedule/2026/?all_event_types=0';

export const IMSA_STANDINGS_URL = 'https://www.imsa.com/standings/';
export const TNC3_STANDINGS_URL = 'https://apat.org.ar/campeonato/ranking/c3';
export const TNC2_STANDINGS_URL = 'https://apat.org.ar/campeonato/c2';

export const NASCARO_STANDINGS_URL = 'https://www.nascar.com/standings/nascar-oreilly-auto-parts-series/';
export const SUPERCARS_NEWS_URL = 'https://www.supercars.com/news';
export const SUPERCARS_CALENDAR_URL = 'https://www.motorsport.com/v8supercars/schedule/2026/';
export const SUPERCARS_DRIVERS_URL = 'https://es.motorsport.com/v8supercars/standings/2026/?type=Driver&class=';
export const SUPERCARS_TEAMS_URL = 'https://es.motorsport.com/v8supercars/standings/2026/?type=Team&class=';

export const GTWC_NEWS_URL = 'https://www.gt-world-challenge.com/news';
export const GTWC_STANDINGS_URL = 'https://www.gt-world-challenge.com/standings';
export const GTWC_CALENDAR_URL = 'https://www.gt-world-challenge.com/calendar';

export const DTM_NEWS_URLS = [
  'https://es.motorsport.com/dtm/news/',
  'https://www.dtm.com/en/news/dtm'
];
export const DTM_CALENDAR_URL = 'https://www.autosport.com/dtm/schedule/2026/?all_event_types=0';
export const DTM_STANDINGS_URL = 'https://www.autosport.com/dtm/standings/';

export const WORLDSBK_CALENDAR_URL = 'https://www.worldsbk.com/en/calendar';
export const WORLDSBK_RESULTS_URL = 'https://www.worldsbk.com/en/results%20statistics';
export const WORLDSBK_NEWS_URL = 'https://www.worldsbk.com/es/noticias';

export const WTCR_EVENTS_URL = 'https://www.fiatcrworldtour.com/events';
export const WTCR_NEWS_URL = 'https://www.fiatcrworldtour.com/news';
export const WTCR_STANDINGS_URL = 'https://www.fiatcrworldtour.com/STANDINGS';



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

export type MotoGPStandings = {
  drivers: TCStandingRow[];
  teams: TCStandingRow[];
  constructors: TCStandingRow[];
};

export type DTMStandings = {
  drivers: TCStandingRow[];
  teams: TCStandingRow[];
  constructors: TCStandingRow[];
};



// ========== DATA SERVICE ==========

export interface NascarStandings {
  drivers: TCStandingRow[];
  owners: TCStandingRow[];
  manufacturers: TCStandingRow[];
}

export const dataService = {

  // === WEEKLY CALENDAR (VueltaRapida API) ===
  async getWeeklyCalendar(skipImages: boolean = false): Promise<Race[]> {
    try {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // USE UNIFIED PROXY PATHS (HANDLED BY VITE LOCALLY AND VERCEL REWRITES IN PROD)
      const url = `/api/vueltarapida/races?minDate=${monday.getTime()}&maxDate=${sunday.getTime()}`;
      const categoriesUrl = `/api/vueltarapida/categories`;

      // CRITICAL: Use fetchWithProxy to include required headers (Referer, UA)
      const [racesResText, catResText] = await Promise.all([
        this.fetchWithProxy(url),
        this.fetchWithProxy(categoriesUrl)
      ]);

      let data: any = [];
      if (racesResText) {
        try { data = JSON.parse(racesResText); } catch(e) { console.warn('Failed to parse races JSON'); }
      }

      let categoriesMap: Record<string, any> = {};
      if (catResText) {
        try {
          const catData = JSON.parse(catResText);
          if (Array.isArray(catData)) {
            catData.forEach((c: any) => {
              if (c.categoryId) categoriesMap[c.categoryId] = c;
            });
          }
        } catch(e) { console.warn('Failed to parse categories JSON'); }
      }

      let races = Array.isArray(data) ? data : (data?.races || data?.data || []);
      
      if (races && Array.isArray(races) && races.length > 0) {
        const racesWithImages = await Promise.all(races.map(async (r: any) => {
          const catInfo = categoriesMap[r.categoryId] || {};
          const schedulesList = (r.schedules || []).map((s: any) => {
            const d = new Date(s.startAt || s.start);
            const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
            const dayStr = `${dayNames[d.getDay()]}. ${d.getDate()}`;
            const rawTime = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
            const timeStr = (s.confirmed === false || s.time === '-' || s.time === '' || s.time === '--:--' || isNaN(d.getTime())) ? (s.time === '--:--' || s.confirmed === false ? '--:--' : '') : rawTime;
            
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
          
          if (!skipImages) {
            const possibleIds = [r.circuit?._id, r.circuitId].filter(Boolean);
            if (!circuitImage && possibleIds.length > 0) {
              for (const cid of possibleIds) {                // Use unified proxy path
                  const circuitRes = await this.fetchWithProxy(`/api/vueltarapida/circuits/by-circuit-id/${cid}`);
                  if (circuitRes && circuitRes.trim() && !circuitRes.startsWith('<!DOCTYPE')) {
                    const circuitData = JSON.parse(circuitRes);
                    const imgUrl = circuitData.circuit?.image || circuitData.circuit?.layoutImage || circuitData.image;
                    if (imgUrl) {
                      circuitImage = imgUrl.startsWith('http') ? imgUrl : `https://vueltarapida.com${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
                      break; 
                    }
                  }
              }
            }
          }

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
            categoryShort: r.categoryShort || r.category || r.name || '',
            event: (r.completeName || r.name || '').replace(/\s*[\u2013\u2014-]+\s*$/, '').trim(),
            circuit: circuitName.replace(/\s*[\u2013\u2014-]+\s*$/, '').trim(),
            circuitId: r.circuitId,
            circuitImage,
            platforms: (r.links || []).filter((l: any) => l.platform || l.name).map((l: any) => l.platform || l.name || ''),
            schedules: schedulesList,
            time: schedulesList.length > 0 ? (schedulesList[0].time === '--:--' ? '--:--' : schedulesList[0].time) : '--:--',
            ticketLink: r.ticketLink || '',
            watchLinks,
          };
        }));

        return racesWithImages;
      }

      // FALLBACK: Scrape the HTML if API returns empty or fails
      console.log('[DataService] API empty or failed, attempting to scrape HTML...');
      const htmlText = await this.fetchWithProxy('https://vueltarapida.com/calendario');
      if (!htmlText) return [];

      const doc = new DOMParser().parseFromString(htmlText, 'text/html');
      
      // Try multiple selectors based on observed site changes
      const eventEls = doc.querySelectorAll('.button-day-item, .rd-calendar-event, .rd-event-item');
      if (eventEls.length === 0) return [];

      const scrapedRaces: Race[] = [];
      eventEls.forEach((el, idx) => {
        const img = el.querySelector('img');
        const category = img?.getAttribute('alt') || img?.getAttribute('title') || el.querySelector('.rd-cat-name')?.textContent?.trim() || 'Otros';
        const eventName = el.querySelector('.rd-event-name, h3, h4')?.textContent?.trim() || category;
        const time = el.querySelector('p, .rd-s-time, .rd-time')?.textContent?.trim() || '';
        const logoUrl = img?.getAttribute('src') || '';
        const circuitImg = el.querySelector('.rd-track-layout, img[src*="layout"]')?.getAttribute('src') || '';

        scrapedRaces.push({
          id: `scraped-${idx}`,
          category,
          categoryShort: category,
          categoryId: '',
          categoryColor: getCategoryColor(category),
          categoryImage: logoUrl ? (logoUrl.startsWith('/') ? `https://vueltarapida.com${logoUrl}` : logoUrl) : '',
          event: eventName, 
          circuit: el.querySelector('.rd-circuit-name')?.textContent?.trim() || '',
          circuitImage: circuitImg ? (circuitImg.startsWith('/') ? `https://vueltarapida.com${circuitImg}` : circuitImg) : '',
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

  async getF1Calendar(): Promise<CalendarRace[]> {
    try {
      const resText = await this.fetchWithProxy(`/api/espn-json/apis/site/v2/sports/racing/f1/scoreboard`);
      if (!resText) throw new Error("Empty response from ESPN");
      const data = JSON.parse(resText);
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
      const html = await this.fetchWithProxy('/api/as/motor/formula_1/');
      if (!html) throw new Error("Empty response from AS.com");
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
      const html = await this.fetchWithProxy('/api/motorsport/f1/news/');
      if (!html) throw new Error("Empty response from Motorsport.com");
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
      const resText = await this.fetchWithProxy('/api/espn-json/apis/v2/sports/racing/f1/standings');
      if (!resText) throw new Error("Empty response from ESPN standings");
      const data = JSON.parse(resText);

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

  // === WRC2 NEWS (Lapeando & Carburando — LIVE SCRAPING) ===
  async getWRC2News(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    
    // 1. Carburando
    try {
      const html = await this.fetchWithProxy('https://www.carburando.com/tema/wrc2');
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('div.col').forEach(art => {
          const title = art.querySelector('h2')?.textContent?.trim();
          const link = art.querySelector('a.card-link')?.getAttribute('href');
          const img = art.querySelector('img')?.getAttribute('src');
          if (title && link) {
            allNews.push({
              title, summary: '',
              link: link.startsWith('http') ? link : `https://www.carburando.com${link}`,
              source: 'Carburando',
              category: 'WRC2',
              imageUrl: img || undefined
            });
          }
        });
      }
    } catch(e) { console.warn('[DataService] Carburando WRC2 news error:', e); }

    // 2. Lapeando
    try {
      const html = await this.fetchWithProxy('https://lapeando.com/noticias?categoria=22');
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('a:has(article), a[href*="/articulo?id="]').forEach(l => {
          const t = l.querySelector('h1, h3, .title')?.textContent?.trim() || l.getAttribute('title') || '';
          const h = l.getAttribute('href') || '';
          const img = l.querySelector('img')?.getAttribute('src');
          if (t && h) {
            allNews.push({
              title: t, summary: '',
              link: h.startsWith('http') ? h : `https://lapeando.com${h.startsWith('/') ? '' : '/'}${h}`,
              source: 'Lapeando',
              category: 'WRC2',
              imageUrl: img || undefined
            });
          }
        });
      }
    } catch (e) { console.warn(`[DataService] Lapeando WRC2 news error:`, e); }

    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i).slice(0, 20);
  },

  // === WRC2 STANDINGS (Lapeando — LIVE SCRAPING) ===
  async getWRC2Standings(): Promise<WRCStandings> {
    const standings: WRCStandings = { drivers: [], codrivers: [], manufacturers: [], teams: [] };
    try {
      const html = await this.fetchWithProxy('https://lapeando.com/standings?categoria=22');
      if (!html) return standings;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const rows = doc.querySelectorAll('table.standings-table tbody tr');
      console.log(`[DataService] Found ${rows.length} WRC2 rows`);
      rows.forEach(row => {
        const pos = row.querySelector('td.standings-pos')?.textContent?.trim() || '';
        const nameNode = row.querySelector('span.standings-pilot-name');
        const name = nameNode ? nameNode.textContent?.trim() : row.querySelector('td.standings-name')?.textContent?.trim();
        const pts = row.querySelector('td.standings-points')?.textContent?.trim() || '0';
        
        if (pos && name) {
          standings.drivers.push({
            pos,
            driver: name || 'A Confirmar',
            codriverOrTeam: '',
            points: pts
          });
        }
      });
      console.log(`[DataService] Extracted ${standings.drivers.length} WRC2 drivers`);
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
      // Strip all whitespace and lower case to catch invisible HTML entities like &nbsp;
      const strippedTitle = n.title.replace(/\s+/g, '').toLowerCase();
      if (strippedTitle.includes('solotc|turismocarretera')) return false;
      
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
      const html = await this.fetchWithProxy('https://tiempos.actc.org.ar/campeonato-de-tc/campeonato');
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
    console.log('[DataService] Fetching TC calendar...');
    try {
      // Use the rewrite to avoid CORS/403 issues more reliably
      const html = await this.fetchWithProxy(`/api/actc/${categorySlug}/calendario.html`);
      console.log(`[DataService] Loaded ${html ? html.length : 0} chars for ${categorySlug} calendar`);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const elements = doc.querySelectorAll('.info-race');
      console.log(`[DataService] Found ${elements.length} race elements`);
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
    const sources = [
      { url: 'https://tobychristie.com/nascar/cup-series/', source: 'TobyChristie.com' },
      { url: 'https://campeones.com.ar/category/internacionales/nascar/', source: 'Campeones' }
    ];

    for (const src of sources) {
      try {
        const html = await this.fetchWithProxy(src.url);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        if (src.source === 'Campeones') {
          const articles = doc.querySelectorAll('article, .post-item, .elementor-post');
          articles.forEach(art => {
            const link = art.querySelector('a');
            const titleEl = art.querySelector('h1, h2, h3, .title, .entry-title, .elementor-post__title');
            const title = titleEl?.textContent?.trim() || link?.getAttribute('title')?.trim() || link?.textContent?.trim();
            const href = link?.getAttribute('href');
            if (title && href && title.length > 10) {
              allNews.push({ title, summary: '', link: href, source: 'Campeones', category: 'NASCAR' });
            }
          });
        } else if (src.source === 'TobyChristie.com') {
          const elements = doc.querySelectorAll('.elementor-post');
          elements.forEach(container => {
            const linkEl = container.querySelector('.elementor-post__title a');
            const imgEl = container.querySelector('.elementor-post__thumbnail img, .elementor-post__thumbnail__link img');
            const title = linkEl?.textContent?.trim();
            const href = linkEl?.getAttribute('href');
            const img = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src');
            if (title && href) {
              allNews.push({ title, summary: '', link: href, source: 'TobyChristie.com', category: 'NASCAR', imageUrl: img || undefined });
            }
          });
        }
      } catch (e) { 
        console.warn(`[DataService] NASCAR news error for ${src.url}:`, e); 
      }
    }
    
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i).slice(0, 20);
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

  // === IMSA NEWS ===
  async getIMSANews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://lat.motorsport.com/imsa/news/');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const articles = doc.querySelectorAll('a.ms-item');
      articles.forEach(el => {
        const title = el.querySelector('.ms-item--title, .ms-article-list-item--title, .ms-item__title')?.textContent?.trim() || el.getAttribute('title');
        const href = el.getAttribute('href');
        const img = el.querySelector('img')?.getAttribute('data-src') || el.querySelector('img')?.getAttribute('src');
        if (title && href) {
          allNews.push({
            title,
            summary: '',
            link: href.startsWith('http') ? href : `https://lat.motorsport.com${href}`,
            source: 'Motorsport Lat',
            category: 'IMSA',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) {
      console.warn('[DataService] IMSA news error:', e);
    }
    return allNews.filter((v, i, a) => a.findIndex(t => t.title === v.title) === i);
  },

  // === F2 NEWS ===
  async getF2News(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    
    // Source 1: Motorsport.com (Latam)
    try {
      const html = await this.fetchWithProxy('https://lat.motorsport.com/fia-f2/news/');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('a.ms-item').forEach(art => {
        const title = art.querySelector('.ms-item__title, .ms-item--title')?.textContent?.trim();
        const link = art.getAttribute('href');
        const img = art.querySelector('img')?.getAttribute('data-src') || art.querySelector('img')?.getAttribute('src');
        if (title && link) {
          allNews.push({
            title, summary: '',
            link: link.startsWith('/') ? `https://lat.motorsport.com${link}` : link,
            source: 'Motorsport.com',
            category: 'F2',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] Motorsport F2 news error:', e); }

    // Source 2: SoyMotor
    try {
      const html = await this.fetchWithProxy('https://soymotor.com/competicion/noticias/fia-formula-2');
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
            category: 'F2',
            imageUrl: img ? (img.startsWith('http') ? img : `https://soymotor.com${img}`) : undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] SoyMotor F2 news error:', e); }

    const seen = new Set<string>();
    return allNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  // === F2 STANDINGS ===
  async getF2Standings(): Promise<{ drivers: TCStandingRow[]; teams: TCStandingRow[] }> {
    const drivers: TCStandingRow[] = [];
    const teams: TCStandingRow[] = [];
    
    const scrapeTable = (html: string, target: TCStandingRow[]) => {
      if (!html) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const table = doc.querySelector('table, .ms-table');
      if (!table) return;
      
      const rows = table.querySelectorAll('tr.ms-table_row');
      rows.forEach(tr => {
        const posEl = tr.querySelector('.ms-table_field--pos');
        const pointsEl = tr.querySelector('.ms-table_field--total_points');
        const nameEl = tr.querySelector('.ms-table_field--driver .name-short, .ms-table_field--team .name, .name-short, .name');
        
        const pos = posEl?.textContent?.trim() || '';
        const name = nameEl?.textContent?.trim() || '';
        const pts = pointsEl?.textContent?.trim() || '0';
        
        if (pos && name && !isNaN(parseInt(pos))) {
          target.push({ pos, driver: name, points: pts });
        }
      });
    };

    try {
      const [driversHtml, teamsHtml] = await Promise.all([
        this.fetchWithProxy('https://lat.motorsport.com/fia-f2/standings/2026/'),
        this.fetchWithProxy('https://lat.motorsport.com/fia-f2/standings/2026/?type=Team&class=')
      ]);
      
      scrapeTable(driversHtml, drivers);
      scrapeTable(teamsHtml, teams);
    } catch (e) {
      console.error('[DataService] F2 standings error:', e);
    }
    return { drivers, teams };
  },

  // === F3 NEWS ===
  async getF3News(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    
    // Source 1: Motorsport.com (Latam)
    try {
      const html = await this.fetchWithProxy('https://lat.motorsport.com/fiaf3/news/');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('a.ms-item').forEach(art => {
        const title = art.querySelector('.ms-item__title, .ms-item--title')?.textContent?.trim();
        const link = art.getAttribute('href');
        const img = art.querySelector('img')?.getAttribute('data-src') || art.querySelector('img')?.getAttribute('src');
        if (title && link) {
          allNews.push({
            title, summary: '',
            link: link.startsWith('/') ? `https://lat.motorsport.com${link}` : link,
            source: 'Motorsport.com',
            category: 'F3',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] Motorsport F3 news error:', e); }

    // Source 2: SoyMotor
    try {
      const html = await this.fetchWithProxy('https://soymotor.com/competicion/noticias/f3');
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
            category: 'F3',
            imageUrl: img ? (img.startsWith('http') ? img : `https://soymotor.com${img}`) : undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] SoyMotor F3 news error:', e); }

    const seen = new Set<string>();
    return allNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  // === F3 STANDINGS ===
  async getF3Standings(): Promise<{ drivers: TCStandingRow[]; teams: TCStandingRow[] }> {
    const drivers: TCStandingRow[] = [];
    const teams: TCStandingRow[] = [];
    
    const scrapeTable = (html: string, target: TCStandingRow[]) => {
      if (!html) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const table = doc.querySelector('table, .ms-table');
      if (!table) return;
      
      const rows = table.querySelectorAll('tr.ms-table_row');
      rows.forEach(tr => {
        const posEl = tr.querySelector('.ms-table_field--pos');
        const pointsEl = tr.querySelector('.ms-table_field--total_points');
        const nameEl = tr.querySelector('.ms-table_field--driver .name-short, .ms-table_field--team .name, .name-short, .name');
        
        const pos = posEl?.textContent?.trim() || '';
        const name = nameEl?.textContent?.trim() || '';
        const pts = pointsEl?.textContent?.trim() || '0';
        
        if (pos && name && !isNaN(parseInt(pos))) {
          target.push({ pos, driver: name, points: pts });
        }
      });
    };

    try {
      const [driversHtml, teamsHtml] = await Promise.all([
        this.fetchWithProxy('https://lat.motorsport.com/fiaf3/standings/2026/'),
        this.fetchWithProxy('https://lat.motorsport.com/fiaf3/standings/2026/?type=Team&class=')
      ]);
      
      scrapeTable(driversHtml, drivers);
      scrapeTable(teamsHtml, teams);
    } catch (e) {
      console.error('[DataService] F3 standings error:', e);
    }
    return { drivers, teams };
  },

  // === F3 CALENDAR ===
  async getF3Calendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    const year = 2026;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    try {
      const html = await this.fetchWithProxy(`https://es.motorsport.com/fiaf3/schedule/${year}/?all_event_types=0`);
      const doc = new DOMParser().parseFromString(html, 'text/html');

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
          const eventName = ev.name?.replace(`, FIA F3 - ${year}`, '').trim();
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
            race: eventName || 'F3 Event',
            dates,
            status,
            winner: ''
          });
        });
        
        const upcomingIdx = calendar.findIndex(r => r.status === 'Upcoming');
        if (upcomingIdx !== -1) calendar[upcomingIdx].status = 'Next';
        
        return calendar;
      }
      
      const rows = doc.querySelectorAll('.ms-schedule-table__item, tr.ms-table_row');
      rows.forEach((row, idx) => {
        const eventEl = row.querySelector('.ms-schedule-table-item-main__event .ms-link, .event-name');
        const dateEl = row.querySelector('.ms-schedule-table-subevent-day__main, .date');
        
        if (eventEl && dateEl) {
          const race = eventEl.textContent?.trim() || '';
          const dates = dateEl.textContent?.trim() || '';
          calendar.push({ round: idx + 1, race, dates, status: 'Upcoming', winner: '' });
        }
      });
    } catch (e) {
      console.error('[DataService] F3 calendar error:', e);
    }
    return calendar;
  },
  async getF2Calendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    const year = 2026;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    try {
      const html = await this.fetchWithProxy(`https://lat.motorsport.com/fia-f2/schedule/${year}/`);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Try JSON-LD first
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
          const eventName = ev.name?.replace(`, FIA F2 - ${year}`, '').trim();
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
            race: eventName || 'F2 Event',
            dates,
            status,
            winner: ''
          });
        });
        
        // Mark first upcoming as Next
        const upcomingIdx = calendar.findIndex(r => r.status === 'Upcoming');
        if (upcomingIdx !== -1) calendar[upcomingIdx].status = 'Next';
        
        return calendar;
      }

      // Fallback
      const rows = doc.querySelectorAll('.ms-schedule-table__item, tr.ms-table_row');
      rows.forEach((row, idx) => {
        const eventEl = row.querySelector('.ms-schedule-table-item-main__event .ms-link, .event-name');
        const dateEl = row.querySelector('.ms-schedule-table-subevent-day__main, .date');
        
        if (eventEl && dateEl) {
          const race = eventEl.textContent?.trim() || '';
          const dates = dateEl.textContent?.trim() || '';
          calendar.push({ round: idx + 1, race, dates, status: 'Upcoming', winner: '' });
        }
      });
    } catch (e) {
      console.error('[DataService] F2 calendar error:', e);
    }
    return calendar;
  },

  // === FORMULA E NEWS ===
  async getFENews(): Promise<NewsItem[]> {
    const news: NewsItem[] = [];
    
    // Fetch Motorsport.com exclusively as requested
    try {
      const msHtml = await this.fetchWithProxy('https://lat.motorsport.com/formula-e/news/');
      if (msHtml) {
        const doc = new DOMParser().parseFromString(msHtml, 'text/html');
        const articles = doc.querySelectorAll('a.ms-item, a.ms-article-list-item, .ms-item--news, .ms-grid-item');
        articles.forEach((art, i) => {
          if (i >= 14) return;
          const title = art.querySelector('.ms-item__title, .ms-article-list-item__title, .ms-grid-item__title, .title')?.textContent?.trim();
          let link = art.getAttribute('href') || art.querySelector('a')?.getAttribute('href') || null;
          
          if (title && link) {
            news.push({
              title,
              summary: '',
              link: link.startsWith('http') ? link : `https://lat.motorsport.com${link}`,
              source: 'Motorsport.com',
              category: 'FE',
              imageUrl: art.querySelector('img')?.getAttribute('src') || ''
            });
          }
        });
      }
    } catch (e) {
      console.error('[DataService] Motorsport FE news error:', e);
    }
    
    return news;
  },

  // === TN CLASE 3 ===
  async getTNC3Calendar(): Promise<CalendarRace[]> {
    try {
      const html = await this.fetchWithProxy('https://apat.org.ar/carreras/calendario');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('table tbody tr');
      const races: CalendarRace[] = [];
      const now = new Date();

      rows.forEach((row, i) => {
        const round = parseInt(row.querySelector('td:nth-child(1) span')?.textContent || (i + 1).toString());
        const dateStr = row.querySelector('td:nth-child(2) .fw-bold')?.textContent?.trim() || '';
        const track = row.querySelector('td:nth-child(3) a')?.textContent?.trim() || row.querySelector('td:nth-child(3)')?.textContent?.trim() || '';
        
        let status: CalendarRace['status'] = 'Upcoming';
        let winner = '';

        // Check for winner info
        const winnerEl = row.querySelector('td:nth-child(5) .winner-info span.fw-bold');
        if (winnerEl) {
          winner = winnerEl.textContent?.trim() || '';
          status = 'Finished';
        }

        // Simple date parsing for status if winner not present
        if (dateStr && status === 'Upcoming') {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const raceDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            if (now > raceDate) status = 'Finished';
            else if (now.toDateString() === raceDate.toDateString()) status = 'Live';
          }
        }

        races.push({ round, race: track, dates: dateStr, status, winner });
      });
      return races;
    } catch (e) {
      console.error('[DataService] TNC3 calendar error:', e);
      return [];
    }
  },

  async getTNC2Standings(): Promise<any[]> {
    try {
      const html = await this.fetchWithProxy(TNC2_STANDINGS_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('table tbody tr');
      const drivers: any[] = [];

      rows.forEach(row => {
        const pos = row.querySelector('td:nth-child(1)')?.textContent?.trim() || '';
        const driver = row.querySelector('td:nth-child(3) strong')?.textContent?.trim() || '';
        const team = row.querySelector('td:nth-child(4)')?.textContent?.trim() || '';
        const points = row.querySelector('td:nth-child(6) strong')?.textContent?.trim() || '';
        if (pos && driver) {
          drivers.push({ pos, driver, team, points });
        }
      });
      return drivers;
    } catch (e) {
      console.error('[DataService] TNC2 standings error:', e);
      return [];
    }
  },

  async getTNC3Standings(): Promise<any[]> {
    try {
      const html = await this.fetchWithProxy(TNC3_STANDINGS_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('table tbody tr');
      const drivers: any[] = [];

      rows.forEach(row => {
        const pos = row.querySelector('td:nth-child(1)')?.textContent?.trim() || '';
        const driver = row.querySelector('td:nth-child(3) strong')?.textContent?.trim() || '';
        const team = row.querySelector('td:nth-child(4)')?.textContent?.trim() || '';
        const points = row.querySelector('td:nth-child(6) strong')?.textContent?.trim() || '';
        if (pos && driver) {
          drivers.push({ pos, driver, team, points });
        }
      });
      return drivers;
    } catch (e) {
      console.error('[DataService] TNC3 standings error:', e);
      return [];
    }
  },

  async getTNC3News(): Promise<NewsItem[]> {
    try {
      const html = await this.fetchWithProxy('https://campeones.com.ar/category/nacionales/tn/');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items = doc.querySelectorAll('.elementor-post');
      const news: NewsItem[] = [];
      items.forEach((item, i) => {
        if (i >= 12) return;
        const titleEl = item.querySelector('.elementor-post__title a');
        const title = titleEl?.textContent?.trim();
        const link = titleEl?.getAttribute('href');
        const imageUrl = item.querySelector('.elementor-post__thumbnail img')?.getAttribute('src') || '';
        
        if (title && link) {
          news.push({
            title,
            summary: item.querySelector('.elementor-post__excerpt')?.textContent?.trim() || '',
            link,
            source: 'Campeones',
            category: 'TN C2/C3',
            imageUrl
          });
        }
      });
      return news;
    } catch (e) {
      console.error('[DataService] TNC3 news error:', e);
      return [];
    }
  },

  // === FORMULA E STANDINGS ===
  async getFEStandings(): Promise<{ drivers: any[], teams: any[] }> {
    const res: { drivers: any[], teams: any[] } = { drivers: [], teams: [] };
    try {
      const [drvHtml, teamHtml] = await Promise.all([
        this.fetchWithProxy('https://lat.motorsport.com/formula-e/standings/2026/'),
        this.fetchWithProxy('https://lat.motorsport.com/formula-e/standings/2026/?type=Team&class=')
      ]);

      if (drvHtml) {
        const doc = new DOMParser().parseFromString(drvHtml, 'text/html');
        const rows = doc.querySelectorAll('table.ms-table tbody tr, .ms-table_row');
        rows.forEach(row => {
          // Pos: 1st td or .pos
          const pos = (row.querySelector('td:nth-child(1), .pos, .ms-table_cell--pos')?.textContent || '').trim().replace('.', '');
          // Driver/Team info: .info-wrapper span:first-child or specialized link class
          const driver = (row.querySelector('.info-wrapper span:first-child, .ms-table-link--driver, .name')?.textContent || '').trim();
          const team = (row.querySelector('.info-wrapper span:last-child, .ms-table-link--team, .team-name')?.textContent || '').trim();
          // Points: 3rd td, .points, or .total
          const points = (row.querySelector('td:nth-child(3), .points, .ms-table_cell--points')?.textContent || '').trim();
          
          if (pos && (driver || team)) {
            res.drivers.push({ pos, driver, team, points });
          }
        });
      }
      if (teamHtml) {
        const doc = new DOMParser().parseFromString(teamHtml, 'text/html');
        const rows = doc.querySelectorAll('table.ms-table tbody tr, .ms-table_row');
        rows.forEach(row => {
          const pos = (row.querySelector('td:nth-child(1), .pos, .ms-table_cell--pos')?.textContent || '').trim().replace('.', '');
          const team = (row.querySelector('.info-wrapper, .ms-table-link--team, .name')?.textContent || '').trim();
          const points = (row.querySelector('td:nth-child(3), .points, .ms-table_cell--points')?.textContent || '').trim();
          if (pos && team) {
            res.teams.push({ pos, team, points });
          }
        });
      }
    } catch (e) {
      console.error('[DataService] FE standings error:', e);
    }
    return res;
  },

  // === FORMULA E CALENDAR ===
  async getFECalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    const year = 2026;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    try {
      const html = await this.fetchWithProxy(`https://lat.motorsport.com/formula-e/schedule/${year}/`);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
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
          const eventName = ev.name?.replace(`, FIA Formula E - ${year}`, '').trim();
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
            race: eventName || 'FE Event',
            dates,
            status,
            winner: ''
          });
        });
        
        const upcomingIdx = calendar.findIndex(r => r.status === 'Upcoming');
        if (upcomingIdx !== -1) calendar[upcomingIdx].status = 'Next';
        
        return calendar;
      }

      const rows = doc.querySelectorAll('tr.ms-schedule-list-item');
      rows.forEach(row => {
        const roundText = row.querySelector('.ms-schedule-list-item__round')?.textContent?.trim();
        const round = roundText ? parseInt(roundText) : 0;
        const race = row.querySelector('.ms-schedule-list-item__event-name a')?.textContent?.trim() || '';
        const dateDay = row.querySelector('.ms-schedule-list-item__day')?.textContent?.trim() || '';
        const dateMonth = row.querySelector('.ms-schedule-list-item__month')?.textContent?.trim() || '';
        const dates = (dateDay && dateMonth) ? `${dateDay} ${dateMonth}` : '';
        const statusBadge = row.querySelector('.ms-schedule-list-item__status-badge');
        let status: 'Finished' | 'Upcoming' | 'Next' | 'Live' = 'Upcoming';
        if (statusBadge) {
          const stText = statusBadge.textContent?.trim().toLowerCase();
          if (stText === 'finalizado' || stText === 'terminado') status = 'Finished';
          else if (stText === 'en vivo' || stText === 'live') status = 'Live';
        }

        calendar.push({
          round,
          race: race.replace('FIA Formula E ', ''),
          dates,
          status,
          winner: ''
        });
      });
    } catch (e) {
      console.error('[DataService] FE calendar error:', e);
    }
    return calendar;
  },

  // === IMSA CALENDAR ===
  async getIMSACalendar(): Promise<CalendarRace[]> {
    try {
      // 1. Try local cache bridge first (most reliable for localhost)
      try {
        const cacheRes = await fetch('/imsa_cache.json');
        if (cacheRes.ok) {
          const cacheData = await cacheRes.json();
          if (cacheData && cacheData.calendar) {
            const cal = cacheData.calendar.map((r: any) => ({
              ...r,
              status: this.calculateIMSAStatus(r.dates)
            }));
            const upcoming = cal.filter((r: any) => r.status === 'Upcoming');
            if (upcoming.length > 0) upcoming[0].status = 'Next';
            return cal;
          }
        }
      } catch (e) {}

      // 2. Fallback to scraping
      const url = 'https://www.imsa.com/weathertech/weathertech-2026-schedule/';
      let html = await this.fetchWithProxy('/api/imsa/weathertech/weathertech-2026-schedule/');
      
      if (!html || html.length < 100) {
        html = await this.fetchWithProxy(url);
      }

      if (!html) return [];
      
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const calendar: CalendarRace[] = [];
      const eventContainers = doc.querySelectorAll('.schedule-item, .event-item');
      
      let round = 1;
      eventContainers.forEach((el) => {
        const titleEl = el.querySelector('.event-title, h2, h3');
        const dateEl = el.querySelector('.event-date, .date');
        
        if (titleEl && dateEl) {
          const race = titleEl.textContent?.trim() || '';
          const dates = dateEl.textContent?.trim() || '';
          
          if (race && dates) {
            calendar.push({ 
              round: round++, 
              race: race, 
              dates: dates, 
              status: this.calculateIMSAStatus(dates), 
              winner: '' 
            });
          }
        }
      });
      
      const upcoming = calendar.filter(r => r.status === 'Upcoming');
      if (upcoming.length > 0) upcoming[0].status = 'Next';
      
      return calendar;
    } catch (e) {
      console.error('[DataService] IMSA calendar error:', e);
      return [];
    }
  },

  calculateIMSAStatus(dateStr: string): CalendarRace['status'] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const months: Record<string, number> = {
      'Jan': 0, 'Ene': 0,
      'Feb': 1,
      'Mar': 2,
      'Apr': 3, 'Abr': 3,
      'May': 4,
      'Jun': 5,
      'Jul': 6,
      'Aug': 7, 'Ago': 7,
      'Set': 8, 'Sep': 8,
      'Oct': 9,
      'Nov': 10,
      'Dec': 11, 'Dic': 11
    };

    const parts = dateStr.split(/[-–]| to /).map(s => s.trim());
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    const parseDatePart = (part: string, fallbackMonth?: number) => {
      const match = part.match(/([A-Z][a-z]{2})\s*(\d+)/);
      if (match) {
        return new Date(currentYear, months[match[1]], parseInt(match[2]));
      }
      const dayMatch = part.match(/(\d+)/);
      if (dayMatch && fallbackMonth !== undefined) {
        return new Date(currentYear, fallbackMonth, parseInt(dayMatch[1]));
      }
      return null;
    };

    if (parts.length >= 2) {
      startDate = parseDatePart(parts[0]);
      endDate = parseDatePart(parts[parts.length - 1], startDate?.getMonth());
      if (!startDate && endDate) startDate = endDate;
    } else {
      startDate = parseDatePart(parts[0]);
      endDate = startDate;
    }

    if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) return 'Upcoming';

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (now > endDate) return 'Finished';
    if (now >= startDate && now <= endDate) return 'Live';
    return 'Upcoming';
  },

  // === NASCAR O'REILLY NEWS ===
  async getNASCARONews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://tobychristie.com/nascar/oreilly-series/');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const elements = doc.querySelectorAll('.elementor-post');
      elements.forEach(container => {
        const linkEl = container.querySelector('.elementor-post__title a');
        const imgEl = container.querySelector('.elementor-post__thumbnail img, .elementor-post__thumbnail__link img');
        
        const title = linkEl?.textContent?.trim();
        const href = linkEl?.getAttribute('href');
        const img = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src');
        
        if (title && href) {
          allNews.push({
            title,
            summary: '',
            link: href,
            source: 'TobyChristie.com',
            category: 'NASCAR O REILLY',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) {
      console.warn('[DataService] NASCARO news error:', e);
    }
    return allNews.filter((v, i, a) => a.findIndex(t => t.title === v.title) === i).slice(0, 15);
  },

  // === NASCAR O'REILLY STANDINGS ===
  async getNASCAROStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy('http://www.espn.com.ar/deporte-motor/posiciones/_/series/xfinity');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const rows = doc.querySelectorAll('tr');
      let pos = 1;
      
      rows.forEach(row => {
        // Skip header rows
        if (row.classList.contains('stathead') || row.classList.contains('colhead')) return;
        
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const driverLink = row.querySelector('a[href*="/piloto/"]');
          const driverName = driverLink?.textContent?.trim();
          
          if (driverName && driverName.length > 1) {
            let points = '0';
            for (let i = 0; i < cells.length; i++) {
              const cellText = cells[i].textContent?.trim() || '';
              if (/^\d+$/.test(cellText) && parseInt(cellText) > 0 && cellText !== String(pos)) {
                points = cellText;
                break;
              }
            }
            
            standings.push({
              pos: String(pos),
              driver: driverName,
              points
            });
            pos++;
          }
        }
      });
    } catch (e) {
      console.error('[DataService] NASCARO standings error:', e);
    }
    return standings;
  },

  // === NASCAR O'REILLY CALENDAR ===
  async getNASCAROCalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy('http://www.espn.com.ar/deporte-motor/calendario/_/series/xfinity');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const now = new Date();
      now.setHours(0,0,0,0);

      const months: Record<string, number> = {
        'ENE': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AGO': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11
      };

      // Get only data rows — skip stathead and colhead by class
      const rows = doc.querySelectorAll('tr.oddrow, tr.evenrow');

      let round = 1;
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;
        
        // === DATE: extract from first cell ===
        // Extract before <br> to prevent merging "feb 14" and "5:00 PM" into "feb 145:00"
        const cellHtml = cells[0]?.innerHTML || '';
        const brMatch = cellHtml.match(/<br\s*\/?>/i);
        const dateHtmlPart = brMatch ? cellHtml.substring(0, brMatch.index) : cellHtml;
        const rawDate = new DOMParser().parseFromString(dateHtmlPart, 'text/html').body.textContent?.trim() || '';
        
        const dateMatch = rawDate.toUpperCase().match(/([A-Z]{3})\s+(\d{1,2})/);
        
        let displayDate = rawDate;
        if (dateMatch) {
          const monthKey = dateMatch[1];
          const dayNum = dateMatch[2];
          // Capitalize first letter only: "Feb 14"
          displayDate = `${monthKey.charAt(0) + monthKey.slice(1).toLowerCase()} ${dayNum}`;
        }
        
        // === RACE NAME: use only the <b> text to avoid doubling with venue ===
        const boldEl = cells[1]?.querySelector('b');
        let raceName = '';
        if (boldEl) {
          raceName = boldEl.textContent?.trim() || '';
        } else {
          // Fallback: take first line
          raceName = (cells[1]?.textContent?.trim() || '').split(/[\n\r]/)[0].trim();
        }
        // Clean prefix
        raceName = raceName
          .replace(/^NASCAR O'Reilly Auto Parts Series at\s*/i, '')
          .replace(/^NASCAR Xfinity Series at\s*/i, '')
          .replace(/^NASCAR O'Reilly Auto Parts Series -\s*/i, '')
          .replace(/^NASCAR Xfinity Series -\s*/i, '')
          .trim();
        
        if (!raceName) return;

        // === STATUS: check results link + date comparison ===
        const resultLinks = cells[3]?.querySelectorAll('a') || [];
        let hasResults = false;
        resultLinks.forEach(a => {
          const text = a.textContent?.toLowerCase() || '';
          if (text.includes('resultado')) hasResults = true;
        });
        
        let status: CalendarRace['status'] = 'Upcoming';
        
        if (dateMatch) {
          const month = months[dateMatch[1]];
          const day = parseInt(dateMatch[2]);
          if (month !== undefined) {
            const raceDate = new Date(now.getFullYear(), month, day);
            raceDate.setHours(0,0,0,0);
            if (raceDate < now) {
              status = 'Finished';
            } else if (raceDate.getTime() === now.getTime()) {
              status = 'Live';
            }
          }
        }
        
        // Override with results link if ESPN says it's done
        if (hasResults) status = 'Finished';
        
        calendar.push({
          round: round++,
          race: raceName,
          dates: displayDate,
          status,
          winner: status === 'Finished' ? '✅ Finalizado' : ''
        });
      });
      
      const nextIdx = calendar.findIndex(r => r.status === 'Upcoming');
      if (nextIdx !== -1) calendar[nextIdx].status = 'Next';
      
    } catch (e) { console.error('[DataService] NASCARO calendar error:', e); }
    return calendar;
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

  // === NASCAR TRUCK NEWS ===
  async getNascarTruckNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://tobychristie.com/nascar/truck-series/');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const elements = doc.querySelectorAll('.elementor-post');
      elements.forEach(container => {
        const linkEl = container.querySelector('.elementor-post__title a');
        const imgEl = container.querySelector('.elementor-post__thumbnail img, .elementor-post__thumbnail__link img');
        
        const title = linkEl?.textContent?.trim();
        const href = linkEl?.getAttribute('href');
        const img = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src');
        
        if (title && href) {
          allNews.push({
            title,
            summary: '',
            link: href,
            source: 'TobyChristie.com',
            category: 'NASCAR TRUCK',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) {
      console.warn('[DataService] NASCAR Truck news error:', e);
    }
    return allNews.filter((v, i, a) => a.findIndex(t => t.title === v.title) === i).slice(0, 15);
  },

  // === NASCAR TRUCK STANDINGS ===
  async getNascarTruckStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy('https://tobychristie.com/2026-nascar-craftsman-truck-series-driver-standings/');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const rows = doc.querySelectorAll('table.tablepress tbody tr');
      rows.forEach(row => {
        const pos = row.querySelector('td.column-1')?.textContent?.trim();
        const name = row.querySelector('td.column-3')?.textContent?.trim();
        const pts = row.querySelector('td.column-4')?.textContent?.trim();
        
        if (pos && name && pts) {
          standings.push({
            pos,
            driver: name,
            points: pts
          });
        }
      });
    } catch (e) {
      console.error('[DataService] NASCAR Truck standings error:', e);
    }
    return standings;
  },

  // === NASCAR TRUCK CALENDAR ===
  async getNascarTruckCalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy('https://tobychristie.com/2026-nascar-craftsman-truck-series-schedule/');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const now = new Date();
      now.setHours(0,0,0,0);
      const currentYear = now.getFullYear();

      const monthsMap: Record<string, number> = {
        'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'MAY': 4, 'JUNE': 5,
        'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11,
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
      };

      const monthsFull = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      const rows = doc.querySelectorAll('table tr');
      let round = 1;
      
      rows.forEach((row, idx) => {
        if (idx === 0) return; // Skip header
        const tds = row.querySelectorAll('td');
        if (tds.length >= 2) {
          const dateStr = tds[0]?.textContent?.trim() || '';
          const raceName = tds[1]?.textContent?.trim() || '';
          
          if (!raceName || raceName.toLowerCase().includes('tba')) return;

          let status: CalendarRace['status'] = 'Upcoming';
          let formattedDate = dateStr;
          
          // TobyChristie format usually like: "Friday, Feb 14 7:30 PM ET" or "Friday, February 13 7:30 PM ET"
          // We need to extract the date and optionally the time
          const dateMatch = dateStr.toUpperCase().match(/(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)?(?:,\s+)?([A-Z]+)\s+(\d{1,2})/);
          const timeMatch = dateStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(ET|EST|EDT)/i);

          if (dateMatch) {
            const monthIdx = monthsMap[dateMatch[1]];
            const day = parseInt(dateMatch[2]);
            if (monthIdx !== undefined) {
              const raceDate = new Date(currentYear, monthIdx, day);
              raceDate.setHours(0,0,0,0);
              
              if (raceDate < now) status = 'Finished';
              else if (raceDate.getTime() === now.getTime()) status = 'Live';
              
              formattedDate = `${day} de ${monthsFull[monthIdx]}`;

              // Handle time conversion to Argentina (ART)
              if (timeMatch) {
                const timeStr = timeMatch[1];
                // Timezone (ET/EST/EDT) is used to determine the offset logic below
                
                // Parse time
                const [h_m, ampm] = timeStr.split(/\s+/);
                let [h, m] = h_m.split(':').map(Number);
                if (ampm === 'PM' && h < 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;

                // Offset logic:
                // EDT (UTC-4) -> ART (UTC-3) is +1 hour
                // EST (UTC-5) -> ART (UTC-3) is +2 hours
                // US DST 2026: March 8 to Nov 1
                const isDST = raceDate >= new Date(2026, 2, 8) && raceDate < new Date(2026, 10, 1);
                const offset = isDST ? 0 : 1; // Subtracted 1 hour as requested by user

                h = (h + offset) % 24;
                const formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                formattedDate += `, ${formattedTime}hs (ARGENTINA)`;
              }
            }
          }

          calendar.push({
            round: round++,
            race: raceName.replace(/\d+$/, '').trim(),
            dates: formattedDate,
            status,
            winner: status === 'Finished' ? '✅ Finalizado' : ''
          });
        }
      });
      
      const nextIdx = calendar.findIndex(r => r.status === 'Upcoming');
      if (nextIdx !== -1) calendar[nextIdx].status = 'Next';
      
    } catch (e) { console.error('[DataService] NASCAR Truck calendar error:', e); }
    return calendar;
  },

  async fetchWithProxy(targetUrl: string, options: RequestInit = {}): Promise<string> {
    const cacheBuster = `t=${Date.now()}`;
    const isServer = typeof window === 'undefined';

    // 1. Target URL processing
    if (targetUrl.startsWith('/')) {
      if (isServer) {
        // Resolve relative Vercel rewrites to their true destinations for Server-side execution
        if (targetUrl.startsWith('/api/vueltarapida/races')) {
            targetUrl = targetUrl.replace('/api/vueltarapida/races', 'https://api.vueltarapida.com/api/races');
        } else if (targetUrl.startsWith('/api/vueltarapida/categories')) {
            targetUrl = targetUrl.replace('/api/vueltarapida/categories', 'https://api.vueltarapida.com/api/categories');
        } else if (targetUrl.startsWith('/api/vueltarapida/circuits')) {
            targetUrl = targetUrl.replace('/api/vueltarapida/circuits', 'https://api.vueltarapida.com/api/circuits');
        } else if (targetUrl.startsWith('/api/espn-json/')) {
            targetUrl = targetUrl.replace('/api/espn-json/', 'https://site.api.espn.com/');
        } else if (targetUrl.startsWith('/api/as/')) {
            targetUrl = targetUrl.replace('/api/as/', 'https://as.com/');
        } else if (targetUrl.startsWith('/api/motorsport/')) {
            targetUrl = targetUrl.replace('/api/motorsport/', 'https://lat.motorsport.com/');
        } else if (targetUrl.startsWith('/api/imsa/')) {
            targetUrl = targetUrl.replace('/api/imsa/', 'https://www.imsa.com/');
        } else if (targetUrl.startsWith('/api/actc/')) {
            targetUrl = targetUrl.replace('/api/actc/', 'https://actc.org.ar/');
        } else if (targetUrl.startsWith('/api/carburando/')) {
            targetUrl = targetUrl.replace('/api/carburando/', 'https://carburando.com/');
        }
      } else {
        // Local/Internal Client Side
        try {
          const res = await fetch(targetUrl, options);
          if (res.ok) return await res.text();
          return '';
        } catch (e) { return ''; }
      }
    }

    const cleanUrl = targetUrl.includes('?') ? `${targetUrl}&${cacheBuster}` : `${targetUrl}?${cacheBuster}`;
    // 2. PRIMARY: Server-side Direct Fetch or Serverless Proxy
    try {
      if (isServer) {
        // In Node.js / Vercel API, we must use absolute URLs and we don't have CORS issues,
        // but we need to mimic a browser to avoid 403 Forbidden.
        const urlObj = new URL(targetUrl);
        const domain = urlObj.origin;
        
        let referer = domain + '/';
        let origin = domain;
        if (targetUrl.includes('vueltarapida.com')) {
          referer = 'https://vueltarapida.com/';
          origin = 'https://vueltarapida.com';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        try {
          const res = await fetch(cleanUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Referer': referer,
              'Origin': origin,
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (res.ok) return await res.text();
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      } else {
        // In Browser, use our relative proxy endpoint
        const serverlessUrl = `/api/proxy?url=${encodeURIComponent(cleanUrl)}`;
        const res = await fetch(serverlessUrl);
        if (res.ok) {
          const text = await res.text();
          // More lenient check for content: if it contains an opening tag or tr.ms-table_row it's likely valid HTML
          if (text && text.length > 20 && (text.includes('<') || text.includes('ms-table_row'))) {
            return text;
          }
        }
      }
      console.warn(`[DataService] Serverless proxy failed or returned 403 for ${targetUrl}`);
    } catch (e) {
      console.warn(`[DataService] Serverless proxy exception:`, e);
    }

    // 3. FALLBACK: Public CORS Proxies (Only in browser)
    if (!isServer) {
      const publicProxies = [
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&t=${Date.now()}`,
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
            if (proxyUrl.includes('/raw')) {
              const text = await res.text();
              if (text.length > 20 && !text.includes('Forbidden') && !text.includes('<title>403')) return text;
            } else {
              const data = await res.json();
              if (data && data.contents) {
                const text = data.contents;
                if (text.length > 20 && !text.includes('Forbidden') && !text.includes('<title>403')) return text;
              }
            }
            continue;
          }
          
          const text = await res.text();
          if (text && text.length > 20 && !text.includes('Forbidden') && !text.includes('<title>403')) {
            return text;
          }
        } catch (e) {}
      }
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
        .replace('https://wec.com', '/api/wec-api')
        .replace('https://tobychristie.com', '/api/tobychristie')
        .replace('https://www.reddit.com', '/api/reddit')
        .replace('https://soymotor.com', '/api/soymotor')
        .replace('https://lat.motorsport.com', '/api/motorsport')
        .replace('https://campeones.com.ar', '/api/campeones');

        if (proxyPath !== targetUrl) {
        // MUST include Referer and User-Agent to bypass upstream validation (F-1738884619)
        const res = await fetch(`${proxyPath}${proxyPath.includes('?') ? '&' : '?'}${cacheBuster}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/134.0.0.0',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://vueltarapida.com/',
            'Origin': 'https://vueltadeinstalacion.vercel.app'
          }
        });
        if (res.ok) return await res.text();
      }
    } catch (e) {}
    throw new Error('All proxy methods failed to bypass 403/CORS');
  },

  // === MotoGP CALENDAR (Motorsport.com) ===
  async getMotoGPCalendar(): Promise<CalendarRace[]> {
    try {
      const html = await this.fetchWithProxy(MotoGP_CALENDAR_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const races: CalendarRace[] = [];
      
      // New structure uses tbody.ms-schedule-table__item for each race
      const items = doc.querySelectorAll('tbody.ms-schedule-table__item');
      items.forEach(item => {
        const isUpcoming = item.classList.contains('ms-schedule-table__item--upcoming');
        const round = item.querySelector('.ms-schedule-table-item-main__round')?.textContent?.trim() || '';
        const raceName = item.querySelector('a.ms-link span')?.textContent?.trim() || 
                           item.querySelector('.ms-schedule-table-item-main__event')?.textContent?.trim() || '';
        
        // Extract ONLY the date part (omit time)
        const dateElem = item.querySelector('msnt-formatted-date');
        const dates = dateElem ? dateElem.textContent?.trim() : item.querySelector('.ms-schedule-table__cell--date')?.textContent?.trim() || '';
        
        const statusText = item.querySelector('.ms-schedule-table__cell--event_status, .ms-schedule-table-item-main__status')?.textContent?.trim() || '';
        
        let status: CalendarRace['status'] = isUpcoming ? 'Upcoming' : 'Finished';
        if (statusText.toLowerCase().includes('en vivo')) status = 'Live';

        if (raceName) {
          races.push({
            round: parseInt(round) || (races.length + 1),
            race: raceName,
            dates, // Clean date without time
            status,
            winner: status === 'Finished' ? '✅ Finalizado' : ''
          });
        }
      });

      let foundNext = false;
      for (const r of races) {
        if (r.status === 'Upcoming' && !foundNext) {
          r.status = 'Next';
          foundNext = true;
        }
      }
      return races;
    } catch (e) {
      console.error('[DataService] MotoGP calendar error:', e);
      return [];
    }
  },

  // === MotoGP STANDINGS (Motorsport.com) ===
  async getMotoGPStandings(): Promise<MotoGPStandings> {
    const standings: MotoGPStandings = { drivers: [], teams: [], constructors: [] };
    
    const parseTable = (html: string, mode: 'drivers' | 'teams' | 'constructors') => {
      const rows: TCStandingRow[] = [];
      if (!html) return rows;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const trs = doc.querySelectorAll('tr.ms-table_row');
      
      trs.forEach(tr => {
        const pos = tr.querySelector('.ms-table_field--pos')?.textContent?.trim() || '';
        const pts = tr.querySelector('.ms-table_field--total_points')?.textContent?.trim() || '0';
        
        let name = '';
        let team = '';
        
        if (mode === 'drivers') {
          name = tr.querySelector('.ms-table_field--driver .name-short')?.textContent?.trim() || '';
          team = tr.querySelector('.ms-table_field--team .name')?.textContent?.trim() || '';
        } else if (mode === 'teams') {
          name = tr.querySelector('.ms-table_field--team .name')?.textContent?.trim() || '';
        } else {
          name = tr.querySelector('.ms-table_field--result_constructor, .ms-table_field--constructor .name')?.textContent?.trim() || '';
        }
        
        if (pos && name && !isNaN(parseInt(pos))) {
          rows.push({ pos, driver: name, points: pts, team: team || undefined });
        }
      });
      return rows;
    };

    try {
      const [driversHtml, teamsHtml, consHtml] = await Promise.all([
        this.fetchWithProxy(MotoGP_DRIVERS_URL),
        this.fetchWithProxy(MotoGP_TEAMS_URL),
        this.fetchWithProxy(MotoGP_CONS_URL)
      ]);
      standings.drivers = parseTable(driversHtml, 'drivers');
      standings.teams = parseTable(teamsHtml, 'teams');
      standings.constructors = parseTable(consHtml, 'constructors');
    } catch (e) { console.error('[DataService] MotoGP standings error:', e); }
    return standings;
  },

  // === MotoGP NEWS (AS.com) ===
  async getMotoGPNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy(MotoGP_NEWS_URL);
      if (!html) throw new Error("Empty response from AS.com");
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // New structure uses div.s
      doc.querySelectorAll('div.s').forEach(art => {
        const titleElem = art.querySelector('h2.s_t a, h3.s_t a, .s_t a');
        const t = titleElem?.textContent?.trim();
        const l = titleElem?.getAttribute('href');
        const img = art.querySelector('img')?.getAttribute('src') || art.querySelector('img')?.getAttribute('data-src');
        
        if (t && l) {
          allNews.push({
            title: t, summary: '',
            link: l.startsWith('/') ? `https://as.com${l}` : l,
            source: 'AS.com',
            category: 'MotoGP',
            imageUrl: img || undefined
          });
        }
      });

      // Fallback to article tags if div.s fails
      if (allNews.length === 0) {
        doc.querySelectorAll('article').forEach(art => {
          const t = art.querySelector('h2, h3')?.textContent?.trim();
          const l = art.querySelector('a')?.getAttribute('href');
          const img = art.querySelector('img')?.getAttribute('src') || art.querySelector('img')?.getAttribute('data-src');
          if (t && l) {
            allNews.push({
              title: t, summary: '',
              link: l.startsWith('/') ? `https://as.com${l}` : l,
              source: 'AS.com',
              category: 'MotoGP',
              imageUrl: img || undefined
            });
          }
        });
      }
    } catch (e) { console.warn('[DataService] AS.com MotoGP news error:', e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i);
  },

  // === F1 ACADEMY NEWS ===
  async getF1AcademyNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy(F1A_NEWS_URL);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('a.ms-item').forEach(art => {
          const t = art.querySelector('.ms-item__title, .title, div:not([class])')?.textContent?.trim() || art.getAttribute('title');
          const l = art.getAttribute('href');
          const img = art.querySelector('img')?.getAttribute('src') || art.querySelector('img')?.getAttribute('data-src');
          if (t && l) {
            allNews.push({
              title: t, summary: '',
              link: l.startsWith('/') ? `https://lat.motorsport.com${l}` : l,
              source: 'Motorsport',
              category: 'F1 Academy',
              imageUrl: img || undefined
            });
          }
        });
      }
    } catch (e) { console.warn('[DataService] F1A news error:', e); }
    return allNews.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i).slice(0, 15);
  },

  // === F1 ACADEMY STANDINGS ===
  async getF1AcademyStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy(F1A_STANDINGS_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const trs = doc.querySelectorAll('tr.ms-table_row');
      trs.forEach(tr => {
        // Skip header rows
        if (tr.querySelector('th')) return;
        
        const pos = tr.querySelector('.ms-table_field--pos')?.textContent?.trim() || '';
        const driverNode = tr.querySelector('.ms-table_field--driver .info .name, .ms-table_field--driver a');
        const teamNode = tr.querySelector('.ms-table_field--driver .info .team');
        
        const driverName = driverNode?.textContent?.trim() || '';
        const teamName = teamNode?.textContent?.trim() || '';
        const pts = tr.querySelector('.ms-table_field--total_points')?.textContent?.trim() || '0';
        
        if (pos && driverName) {
          standings.push({ pos, driver: driverName, team: teamName, points: pts });
        }
      });
    } catch (e) { console.error('[DataService] F1A standings error:', e); }
    return standings;
  },

  // === F1 ACADEMY TEAMS STANDINGS ===
  async getF1AcademyTeams(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const url = 'https://lat.motorsport.com/f1-academy/standings/2026/?type=Team&class=';
      const html = await this.fetchWithProxy(url);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const trs = doc.querySelectorAll('tr.ms-table_row');
      trs.forEach(tr => {
        if (tr.querySelector('th')) return;
        const pos = tr.querySelector('.ms-table_field--pos')?.textContent?.trim() || '';
        const name = tr.querySelector('.ms-table_field--team .name')?.textContent?.trim() || 
                     tr.querySelector('.ms-table_field--team')?.textContent?.trim() || '';
        const pts = tr.querySelector('.ms-table_field--total_points')?.textContent?.trim() || '0';
        if (pos && name) {
          standings.push({ pos, driver: name, points: pts }); // reusing driver field for team name
        }
      });
    } catch (e) { console.error('[DataService] F1A teams error:', e); }
    return standings;
  },

  // === SUPERCARS NEWS ===
  async getSUPERCARSNews(): Promise<NewsItem[]> {
    const news: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy(SUPERCARS_NEWS_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Supercars.com structure: news items are often in <a> tags
      const links = Array.from(doc.querySelectorAll('a[href^="/news/"]'));
      const seen = new Set<string>();

      links.forEach(link => {
        let href = link.getAttribute('href') || '';
        const url = href.startsWith('http') ? href : 'https://www.supercars.com' + href;
        if (seen.has(url)) return;
        seen.add(url);

        const title = link.querySelector('.text-white')?.textContent?.trim() || 
                      link.querySelector('h3')?.textContent?.trim() ||
                      link.textContent?.trim();
        const img = link.querySelector('img')?.getAttribute('src');

        if (title && title.length > 5) {
          news.push({
            title,
            summary: '',
            link: url,
            source: 'Supercars',
            category: 'Supercars',
            imageUrl: img || 'https://www.supercars.com/favicon.ico'
          });
        }
      });
    } catch (e) {
      console.warn('[DataService] Supercars news error:', e);
    }
    return news.slice(0, 15);
  },

  // === SUPERCARS STANDINGS (DRIVERS) ===
  async getSUPERCARSStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy(SUPERCARS_DRIVERS_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('tr.ms-table_row, tbody tr');
      rows.forEach((row, idx) => {
        const posElem = row.querySelector('.ms-table_field--pos') || row.querySelector('td:nth-child(1)');
        const pos = posElem?.textContent?.trim();
        
        // Robust name extraction: targets .name-short if present, 
        // fallback to info-wrapper or generic info div
        const nameElem = row.querySelector('.ms-table_field--driver .name-short') || 
                         row.querySelector('.info-wrapper .name') ||
                         row.querySelector('.info-wrapper span:nth-child(2) span:first-child span') ||
                         row.querySelector('.info');
        const driver = nameElem?.textContent?.trim();
        
        const teamElem = row.querySelector('.ms-table_field--driver .team') || 
                         row.querySelector('.ms-table-link--team') ||
                         row.querySelector('.info-wrapper span:nth-child(2) span:nth-child(2)') ||
                         row.querySelector('td:nth-child(3)');
        const team = teamElem?.textContent?.trim();
        
        const ptsElem = row.querySelector('.ms-table_field--total_points') || 
                        row.querySelector('td.ms-table_field--points') ||
                        row.querySelector('td:nth-child(4)');
        const points = ptsElem?.textContent?.trim();

        // Skip header row if pos or driver contain header text
        if (pos === 'Pos' || driver === 'Piloto' || driver === 'Driver' || driver === 'PILOTOS') return;

        if (driver) {
          standings.push({ 
            pos: pos || (idx + 1).toString(), 
            driver, 
            team: team || '', 
            points: points || '0' 
          });
        }
      });
    } catch (e) { console.error('[DataService] Supercars standings error:', e); }
    return standings;
  },

  // === SUPERCARS STANDINGS (TEAMS) ===
  async getSUPERCARSTeams(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy(SUPERCARS_TEAMS_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('tr.ms-table_row, tbody tr');
      rows.forEach((row, idx) => {
        const posElem = row.querySelector('.ms-table_field--pos') || row.querySelector('td:nth-child(1)');
        const pos = posElem?.textContent?.trim();
        
        const teamElem = row.querySelector('.ms-table_field--team') ||
                         row.querySelector('.info-wrapper .name') ||
                         row.querySelector('.info-wrapper span:nth-child(2)') ||
                         row.querySelector('.info');
        const team = teamElem?.textContent?.trim();
        
        const ptsElem = row.querySelector('.ms-table_field--total_points') || 
                        row.querySelector('td:nth-child(3)');
        const points = ptsElem?.textContent?.trim();
        
        // Skip header row if pos or team contain header text
        if (pos === 'Pos' || team === 'Equipos' || team === 'EQUIPOS') return;

        if (team) {
          standings.push({ 
            pos: pos || (idx + 1).toString(), 
            driver: team, // reusing driver field for team name
            points: points || '0' 
          });
        }
      });
    } catch (e) { console.error('[DataService] Supercars teams error:', e); }
    return standings;
  },

  // === SUPERCARS CALENDAR ===
  async getSUPERCARSCalendar(): Promise<CalendarRace[]> {
    const races: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy(SUPERCARS_CALENDAR_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const items = doc.querySelectorAll('tbody.ms-schedule-table__item');
      items.forEach((item, idx) => {
        const isUpcoming = item.classList.contains('ms-schedule-table__item--upcoming');
        const round = item.querySelector('.ms-schedule-table-item-main__round')?.textContent?.trim() || (idx + 1).toString();
        const raceName = item.querySelector('.ms-schedule-table-item-main__event a.ms-link')?.textContent?.trim() || 
                         item.querySelector('.ms-schedule-table-item-main__event')?.textContent?.trim() || '';
        const dateElem = item.querySelector('.ms-schedule-table-date-period');
        const dates = dateElem?.textContent?.trim() || '';
        
        if (raceName) {
          races.push({
            round: parseInt(round) || (idx + 1),
            race: raceName.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
            dates: dates,
            status: isUpcoming ? 'Upcoming' : 'Finished',
            winner: ''
          });
        }
      });

      // Fallback for simple tr rows if tbody structure differs
      if (races.length === 0) {
        const rows = doc.querySelectorAll('tr.ms-schedule-table-item');
        rows.forEach((row, idx) => {
          const raceName = row.querySelector('.ms-schedule-table-item-main__event a.ms-link')?.textContent?.trim();
          const dates = row.querySelector('.ms-schedule-table-date-period')?.textContent?.trim();
          if (raceName) {
            races.push({
              round: idx + 1,
              race: raceName.trim(),
              dates: dates || '',
              status: 'Upcoming',
              winner: ''
            });
          }
        });
      }
    } catch (e) { console.error('[DataService] Supercars calendar error:', e); }
    return races;
  },

  // === F1 ACADEMY CALENDAR ===
  async getF1AcademyCalendar(): Promise<CalendarRace[]> {
    const races: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy(F1A_CALENDAR_URL);
      if (!html) throw new Error("Empty response from F1 Academy calendar");
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const items = doc.querySelectorAll('tbody.ms-schedule-table__item');
      items.forEach((item, idx) => {
        const raceNameElem = item.querySelector('.ms-schedule-table-item-main__event a.ms-link');
        const raceName = raceNameElem?.textContent?.trim() || 'F1 Academy Event';
        
        const dateElem = item.querySelector('.ms-schedule-table-date--your time, .ms-schedule-table-date--local time, .ms-schedule-table-date--your, .ms-schedule-table-date--local');
        const dateStr = dateElem?.textContent?.trim().replace(/\*/g, '').trim() || '';
        
        const isCancelled = item.classList.contains('ms-schedule-table__item--canceled') || item.textContent?.includes('CANCELADO');
        const isUpcoming = item.classList.contains('ms-schedule-table__item--upcoming');
        
        let status: CalendarRace['status'] = 'Finished';
        if (isCancelled) status = 'Cancelled';
        else if (isUpcoming) status = 'Upcoming';
        
        races.push({
          round: idx + 1,
          race: raceName.toUpperCase(),
          dates: dateStr,
          status,
          winner: status === 'Finished' ? '✅ Finalizado' : ''
        });
      });
    } catch (e) {
      console.error('[DataService] F1 Academy calendar error:', e);
      // Fallback or return empty
    }

    // Find "Next" event (first Upcoming)
    let foundNext = false;
    for (const r of races) {
      if (r.status === 'Upcoming' && !foundNext) {
        r.status = 'Next';
        foundNext = true;
      }
    }

    return races;
  },

  CATEGORY_RESULTS_URLS,

  // === GT WORLD CHALLENGE NEWS ===
  async getGTWCNews(): Promise<NewsItem[]> {
    const news: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy(GTWC_NEWS_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items = Array.from(doc.querySelectorAll('a.article-posts__list-link'));
      const seen = new Set<string>();

      items.forEach(item => {
        let href = item.getAttribute('href') || '';
        const url = href.startsWith('http') ? href : 'https://www.gt-world-challenge.com' + href;
        if (seen.has(url)) return;
        seen.add(url);

        const title = item.querySelector('h3')?.textContent?.trim() || item.textContent?.trim();
        const img = item.querySelector('img')?.getAttribute('src');

        if (title && title.length > 5) {
          news.push({
            title,
            summary: '',
            link: url,
            source: 'GT World Challenge',
            category: 'GTWC',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] GTWC news error:', e); }
    return news.slice(0, 15);
  },

  // === GT WORLD CHALLENGE STANDINGS (MANUFACTURERS) ===
  async getGTWCStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy(GTWC_STANDINGS_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('div.table__scrollable table tr');
      
      rows.forEach((row, idx) => {
        // Skip first 3 rows (headers)
        if (idx < 3) return;
        
        const brand = row.querySelector('td:nth-child(1), .table__field--brand-name')?.textContent?.trim();
        const points = row.querySelector('td:nth-child(2), .table__field--total-points')?.textContent?.trim();
        
        if (brand && points) {
          standings.push({
            pos: (standings.length + 1).toString(),
            driver: brand, // Using driver field for brand name
            team: 'Global Manufacturer',
            points: points || '0'
          });
        }
      });
    } catch (e) { console.error('[DataService] GTWC standings error:', e); }
    return standings;
  },

  // === GT WORLD CHALLENGE CALENDAR ===
  async getGTWCCalendar(): Promise<CalendarRace[]> {
    const races: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy(GTWC_CALENDAR_URL);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items = doc.querySelectorAll('.calendar__summary');
      const now = new Date();
      
      items.forEach((item, idx) => {
        const raceName = item.querySelector('.calendar__race-header')?.textContent?.trim();
        
        const startDay = item.querySelector('.calendar__date-start .calendar__date-number')?.textContent?.trim();
        const startMonth = item.querySelector('.calendar__date-start .calendar__date-month')?.textContent?.trim();
        const startYear = item.querySelector('.calendar__date-start .calendar__date-year')?.textContent?.trim() || now.getFullYear().toString();
        
        const endDay = item.querySelector('.calendar__date-end .calendar__date-number')?.textContent?.trim();
        const endMonth = item.querySelector('.calendar__date-end .calendar__date-month')?.textContent?.trim();
        const endYear = item.querySelector('.calendar__date-end .calendar__date-year')?.textContent?.trim() || startYear;
        
        let dateStr = '';
        if (startDay && startMonth) {
          dateStr = `${startDay} ${startMonth}`;
          if (endDay && endMonth && (endDay !== startDay || endMonth !== startMonth)) {
            dateStr += ` - ${endDay} ${endMonth}`;
          }
        }

        // Status logic based on date
        let status: CalendarRace['status'] = 'Upcoming';
        if (endDay && endMonth) {
          const months: { [key: string]: number } = {
            'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
            'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
            'ENE': 0, 'ABR': 3, 'AGO': 7, 'DIC': 11
          };
          const m = months[endMonth.toUpperCase().substring(0, 3)];
          if (m !== undefined) {
            const raceEndDate = new Date(parseInt(endYear), m, parseInt(endDay), 23, 59, 59);
            if (raceEndDate < now) {
              status = 'Finished';
            }
          }
        }
        
        if (raceName) {
          races.push({
            round: idx + 1,
            race: raceName,
            dates: dateStr,
            status,
            winner: status === 'Finished' ? '✅ Finalizado' : ''
          });
        }
      });
    } catch (e) { console.error('[DataService] GTWC calendar error:', e); }
    return races;
  },

  // === BTCC NEWS ===
  async getBTCCNews(): Promise<NewsItem[]> {
    const news: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://btcc.net/news/');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items = Array.from(doc.querySelectorAll('.wpgb-card'));

      items.forEach(item => {
        const title = item.querySelector('.blogBlockTitle')?.textContent?.trim();
        const link = item.querySelector('.wpgb-card-layer-link')?.getAttribute('href') || 
                     item.querySelector('a')?.getAttribute('href');
        const img = item.querySelector('.wpgb-noscript-img')?.getAttribute('src');

        if (title && link) {
          news.push({
            title,
            summary: '',
            link: link.startsWith('http') ? link : 'https://btcc.net' + link,
            source: 'BTCC Official',
            category: 'BTCC',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] BTCC news error:', e); }
    return news.slice(0, 15);
  },

  // === BTCC CALENDAR ===
  async getBTCCCalendar(): Promise<CalendarRace[]> {
    const races: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy('https://btcc.net/calendar/');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items = doc.querySelectorAll('a.ct-link');
      
      items.forEach((item, idx) => {
        const spans = Array.from(item.querySelectorAll('.innerBoxesBlock .ct-span'));
        const circuit = spans.length > 0 ? spans[spans.length - 1].textContent?.trim() : '';
        
        const dateTexts = Array.from(item.querySelectorAll('.circuitDatesBlock .circuitDatesText'));
        const dateStr = dateTexts.map(d => d.textContent?.trim()).join(' - ');
        
        if (circuit) {
          races.push({
            round: idx + 1,
            race: circuit,
            dates: dateStr,
            status: 'Upcoming', // Default to upcoming unless we find a finished class
            winner: ''
          });
        }
      });
    } catch (e) { console.error('[DataService] BTCC calendar error:', e); }
    return races;
  },

  // === BTCC STANDINGS ===
  async getBTCCStandings(type: string): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    const urls: Record<string, string> = {
      'drivers': 'https://btcc.net/standings/drivers/',
      'manufacturers': 'https://btcc.net/standings/manufacturers-constructors/',
      'teams': 'https://btcc.net/standings/teams/',
      'independent-drivers': 'https://btcc.net/standings/independent-drivers/',
      'independent-teams': 'https://btcc.net/standings/independent-teams/',
      'jack-sears-trophy': 'https://btcc.net/standings/jack-sears-trophy/',
      'goodyear-wingfoot-award': 'https://btcc.net/standings/goodyear-wingfoot-award/'
    };

    try {
      const url = urls[type] || urls['drivers'];
      console.log(`[DataService] Requesting BTCC standings: ${type} from ${url}`);
      const html = await this.fetchWithProxy(url);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('.easy-table tr');

      rows.forEach((row, idx) => {
        if (idx === 0) return; // Skip header
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;

        let pos = cells[0].textContent?.trim() || '';
        let name = '';
        let points = '';

        if (type === 'manufacturers' || type === 'teams' || type === 'independent-teams') {
          // Structure: Pos(0), Team/Manufacturer(1), Total(2)
          name = cells[1]?.textContent?.trim() || '';
          points = cells[2]?.textContent?.trim() || '';
        } else if (type === 'goodyear-wingfoot-award') {
          // Structure: Pos(0), No(1), Driver(2), Total(3)
          name = cells[2]?.textContent?.trim() || '';
          points = cells[3]?.textContent?.trim() || '';
        } else if (type === 'drivers') {
          // Structure: Pos(0), No(1), Driver(2), CL(3), Total(4)
          name = cells[2]?.textContent?.trim() || '';
          points = cells[4]?.textContent?.trim() || '';
        } else {
          // independent-drivers, jack-sears-trophy
          // Structure: Pos(0), No(1), Driver(2), Total(3)
          name = cells[2]?.textContent?.trim() || '';
          points = cells[3]?.textContent?.trim() || '';
        }

        if (name) {
          standings.push({
            pos,
            driver: name,
            team: '',
            points
          });
        }
      });
    } catch (e) { console.error(`[DataService] BTCC standings error (${type}):`, e); }
    return standings;
  },

  // === DTM NEWS ===
  async getDTMNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    
    // Source 1: Motorsport.com (Spanish)
    try {
      const html = await this.fetchWithProxy(DTM_NEWS_URLS[0]);
      if (!html) throw new Error("Empty response from Motorsport.com DTM news");
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Updated selectors for Motorsport.com ms-item structure
      doc.querySelectorAll('a.ms-item, .ms-item').forEach(card => {
        const title = card.querySelector('.ms-item__title, .ms-item_title, h2, h3')?.textContent?.trim() || card.textContent?.trim();
        const link = card.getAttribute('href') || card.querySelector('a')?.getAttribute('href');
        const img = card.querySelector('img')?.getAttribute('data-src') || card.querySelector('img')?.getAttribute('src');
        
        if (title && link && title.length > 10) {
          allNews.push({
            title, 
            summary: '',
            link: link.startsWith('/') ? `https://es.motorsport.com${link}` : link,
            source: 'Motorsport.com',
            category: 'DTM',
            imageUrl: img || undefined
          });
        }
      });
    } catch (e) { console.warn('[DataService] Motorsport DTM news error:', e); }

    // Source 2: DTM Official
    try {
      const html = await this.fetchWithProxy(DTM_NEWS_URLS[1]);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('.news-teaser, .teaser-item, article, h4').forEach(card => {
          const titleElem = card.tagName === 'H4' ? card : card.querySelector('h2, h3, h4, .title');
          const linkElem = card.tagName === 'A' ? card : card.querySelector('a');
          const imgElem = card.querySelector('img');
          
          const title = titleElem?.textContent?.trim();
          const link = linkElem?.getAttribute('href') || card.closest('a')?.getAttribute('href');
          const img = imgElem?.getAttribute('src') || imgElem?.getAttribute('data-src');
          
          if (title && link) {
            allNews.push({
              title, summary: '',
              link: link.startsWith('/') ? `https://www.dtm.com${link}` : link,
              source: 'DTM Official',
              category: 'DTM',
              imageUrl: img ? (img.startsWith('http') ? img : `https://www.dtm.com${img}`) : undefined
            });
          }
        });
      }
    } catch (e) { console.warn('[DataService] DTM Official news error:', e); }

    const seen = new Set<string>();
    return allNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  // === DTM CALENDAR ===
  async getDTMCalendar(): Promise<CalendarRace[]> {
    const races: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy(DTM_CALENDAR_URL);
      if (!html) throw new Error("Empty response from DTM calendar");
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const items = doc.querySelectorAll('tbody.ms-schedule-table__item');
      items.forEach((item, idx) => {
        const raceNameElem = item.querySelector('.ms-schedule-table-item-main__event a.ms-link');
        const raceName = raceNameElem?.textContent?.trim() || 'DTM Event';
        
        const dateElem = item.querySelector('.ms-schedule-table-date--your time, .ms-schedule-table-date--local time, .ms-schedule-table-date--your, .ms-schedule-table-date--local');
        const dateStr = dateElem?.textContent?.trim().replace(/\*/g, '').trim() || '';
        
        const isCancelled = item.classList.contains('ms-schedule-table__item--canceled') || item.textContent?.includes('CANCELADO');
        const isUpcoming = item.classList.contains('ms-schedule-table__item--upcoming');
        
        let status: CalendarRace['status'] = 'Finished';
        if (isCancelled) status = 'Cancelled';
        else if (isUpcoming) status = 'Upcoming';
        
        races.push({
          round: idx + 1,
          race: raceName.toUpperCase(),
          dates: dateStr,
          status,
          winner: status === 'Finished' ? '✅ Finalizado' : ''
        });
      });

      // Status Fix
      let foundNext = false;
      races.forEach(r => {
        if (!foundNext && r.status === 'Upcoming') {
          r.status = 'Next';
          foundNext = true;
        }
      });
    } catch (e) { console.error('[DataService] DTM calendar error:', e); }
    return races;
  },

  // === DTM STANDINGS ===
  async getDTMStandings(type: 'Driver' | 'Team' | 'Constructor' = 'Driver'): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      // Dynamic year: April 26, 2026 threshold
      const now = new Date();
      const threshold = new Date(2026, 3, 26); // April is index 3
      const year = now >= threshold ? 2026 : 2025;
      
      const url = `${DTM_STANDINGS_URL}${year}/?type=${type}&class=.`;
      const html = await this.fetchWithProxy(url);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const rows = doc.querySelectorAll('tr.ms-table_row, tbody tr');
      rows.forEach(row => {
        const posEl = row.querySelector('.ms-table_field--pos') || row.querySelector('td:first-child');
        const pos = posEl?.textContent?.trim() || '';
        if (!pos || isNaN(parseInt(pos))) return;

        const ptsEl = row.querySelector('.ms-table_field--total_points, .ms-table_field--pts') || 
                      row.querySelectorAll('td')[2];
        const points = ptsEl?.textContent?.trim() || '0';
        
        let name = '';
        let team = '';
        
        if (type === 'Driver') {
          const nameCell = row.querySelector('.ms-table_field--driver, td:nth-child(2)');
          if (nameCell) {
            name = nameCell.querySelector('.name-short')?.textContent?.trim() || 
                   nameCell.querySelector('.name')?.textContent?.trim() || 
                   nameCell.textContent?.trim() || '';
            team = nameCell.querySelector('.team')?.textContent?.trim() || '';
            
            if (!team) {
              team = row.querySelector('.ms-table_field--team')?.textContent?.trim() || '';
            }
          }
        } else if (type === 'Team') {
          const nameCell = row.querySelector('.ms-table_field--team, td:nth-child(2)');
          name = nameCell?.querySelector('.name')?.textContent?.trim() || nameCell?.textContent?.trim() || '';
        } else if (type === 'Constructor') {
          const nameCell = row.querySelector('.ms-table_field--result_constructor, .ms-table_field--team, td:nth-child(2)');
          name = nameCell?.textContent?.trim() || '';
        }
        
        if (name) {
          standings.push({
            pos,
            driver: name,
            team: team,
            points: points
          });
        }
      });
    } catch (e) { console.error(`[DataService] DTM standings error (${type}):`, e); }
    return standings;
  },

  formatSFDate(rawDate: string): string {
    if (!rawDate) return '';
    let clean = rawDate.replace(/\*/g, '').trim();
    const parts = clean.split(/\s+/);
    let day = '';
    let monthAbbr = '';
    
    if (parts.length >= 2) {
      const dayPart = parts[0];
      day = dayPart.includes('–') ? dayPart.split('–')[0] : dayPart;
      monthAbbr = parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }

    const months: Record<string, string> = {
      'Jan': 'Enero', 'Feb': 'Febrero', 'Mar': 'Marzo', 'Apr': 'Abril',
      'May': 'Mayo', 'Jun': 'Junio', 'Jul': 'Julio', 'Aug': 'Agosto',
      'Sep': 'Septiembre', 'Oct': 'Octubre', 'Nov': 'Noviembre', 'Dec': 'Diciembre'
    };

    const monthFull = months[monthAbbr] || monthAbbr;
    return day && monthFull ? `${day} ${monthFull}` : clean;
  },

  async getSFCalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy('https://www.autosport.com/super-formula/schedule/2026/');
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const bodies = doc.querySelectorAll('.ms-schedule-table tbody.ms-schedule-table__item');
      
      bodies.forEach((body, idx) => {
        const mainRow = body.querySelector('tr');
        if (!mainRow) return;

        const nameCell = mainRow.querySelector('.ms-schedule-table__cell--main a');
        const dateCell = mainRow.querySelectorAll('.ms-schedule-table__cell')[1];
        
        const race = nameCell?.textContent?.trim() || 'TBA';
        const rawDate = dateCell?.textContent?.trim() || '';
        const dates = this.formatSFDate(rawDate);
        
        let status: CalendarRace['status'] = 'Upcoming';
        if (body.classList.contains('ms-schedule-table__item--complete')) status = 'Finished';
        else if (body.classList.contains('ms-schedule-table__item--open')) status = 'Live';

        calendar.push({
          round: idx + 1,
          race,
          dates,
          status,
          winner: ''
        });
      });
    } catch (e) { console.error('[DataService] SF calendar error:', e); }
    return calendar;
  },

  async getSFStandings(type: 'drivers' | 'teams'): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const now = new Date();
      // April 6, 2026 is the cutoff for the teams URL
      const cutoffDate = new Date('2026-04-06');
      const teamsYear = now >= cutoffDate ? '2026' : '2025';
      
      const url = type === 'drivers' 
        ? 'https://www.autosport.com/super-formula/standings/2026/' 
        : `https://www.autosport.com/super-formula/standings/${teamsYear}/?type=Team&class=`;
        
      const html = await this.fetchWithProxy(url);
      if (!html) return [];
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('table.ms-table--standings tbody tr.ms-table_row');
      
      rows.forEach(row => {
        const pos = row.querySelector('.ms-table_field--pos')?.textContent?.trim() || '';
        const points = row.querySelector('.ms-table_field--total_points')?.textContent?.trim() || '';
        
        let name = '';
        if (type === 'drivers') {
          name = row.querySelector('.ms-table_field--driver .info-wrapper')?.textContent?.trim() || '';
        } else {
          name = row.querySelector('.ms-table_field--team .info-wrapper')?.textContent?.trim() || '';
        }
        
        if (name) {
          standings.push({
            pos,
            driver: name,
            team: '',
            points
          });
        }
      });
    } catch (e) { console.error(`[DataService] SF standings error (${type}):`, e); }
    return standings;
  },

  async getSFNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    // Source 1: Motorsport.com
    try {
      const html = await this.fetchWithProxy('https://es.motorsport.com/super-formula/');
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const items = doc.querySelectorAll('a.ms-item');
        items.forEach(item => {
          const title = item.querySelector('.ms-item__title')?.textContent?.trim();
          const link = (item as HTMLAnchorElement).href;
          const img = item.querySelector('img')?.getAttribute('src');
          if (title && link) {
            allNews.push({
              title,
              summary: '',
              link: link.startsWith('http') ? link : `https://es.motorsport.com${link}`,
              source: 'Motorsport.com',
              category: 'Super Formula',
              imageUrl: img || undefined
            });
          }
        });
      }
    } catch (e) { console.error('[DataService] SF News (Motorsport) error:', e); }

    // Source 2: Autosport.com
    try {
      const html = await this.fetchWithProxy('https://www.autosport.com/super-formula/');
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const items = doc.querySelectorAll('a.ms-item');
        items.forEach(item => {
          const title = item.querySelector('.ms-item__title')?.textContent?.trim();
          const link = (item as HTMLAnchorElement).href;
          const img = item.querySelector('img')?.getAttribute('src');
          if (title && link) {
            allNews.push({
              title,
              summary: '',
              link: link.startsWith('http') ? link : `https://www.autosport.com${link}`,
              source: 'Autosport',
              category: 'Super Formula',
              imageUrl: img || undefined
            });
          }
        });
      }
    } catch (e) { console.error('[DataService] SF News (Autosport) error:', e); }

    return allNews.slice(0, 15);
  },

  formatELMSDate(rawDate: string): string {
    if (!rawDate) return '';
    let clean = rawDate.replace(/\*/g, '').trim();
    // Case 1: "12 APR" or "12 – 13 APR"
    const parts = clean.split(/\s+/);
    let day = '';
    let monthAbbr = '';
    
    if (parts.length >= 2) {
      day = parts[0];
      monthAbbr = parts[parts.length - 1]; // Last part is month
    } else {
      return clean;
    }

    const months: Record<string, string> = {
      'JAN': 'Enero', 'FEB': 'Febrero', 'MAR': 'Marzo', 'APR': 'Abril',
      'MAY': 'Mayo', 'JUN': 'Junio', 'JUL': 'Julio', 'AUG': 'Agosto',
      'SEP': 'Septiembre', 'OCT': 'Octubre', 'NOV': 'Noviembre', 'DEC': 'Diciembre'
    };

    const monthFull = months[monthAbbr.toUpperCase()] || monthAbbr;
    return `${day} ${monthFull}`;
  },

  async getELMSCalendar(): Promise<CalendarRace[]> {
    try {
      const year = new Date().getFullYear();
      const html = await this.fetchWithProxy(`https://www.europeanlemansseries.com/en/season/${year}`);
      const races: CalendarRace[] = [];
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const items = doc.querySelectorAll('a[href*="/en/race/"]');
        
        items.forEach((item) => {
          const href = item.getAttribute('href') || '';
          const slug = href.split('/').pop()?.replace(/-/g, ' ') || '';
          if (slug.toLowerCase().includes('test')) return; // Skip tests
          
          const name = slug.charAt(0).toUpperCase() + slug.slice(1);
          const dateText = item.textContent?.trim().match(/\d+\s+[A-Z]{3}/i)?.[0] || 'TBD';
          
          races.push({
            round: races.length + 1,
            race: name,
            dates: dateText,
            status: 'Upcoming',
            winner: ''
          });
        });
      }
      return races;
    } catch (e) {
      console.error('[DataService] ELMS calendar error:', e);
      return [];
    }
  },

  async getELMSStandings(classIdx: number): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy('https://www.europeanlemansseries.com/en/page/classification-2');
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const collapses = doc.querySelectorAll('.collapse');
        
        if (collapses[classIdx]) {
          const table = collapses[classIdx].querySelector('table');
          if (table) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 3) {
                const pos = cells[0].textContent?.trim() || '';
                const name = cells[2].textContent?.trim() || '';
                const points = cells[cells.length - 1].textContent?.trim() || '';
                if (pos && name && name !== 'N/A') {
                  standings.push({ pos, driver: name, team: '', points });
                }
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('[DataService] ELMS standings error:', e);
    }
    return standings;
  },

  async getELMSNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      // Source 1: Motorsport.com (ES) - news list
      const htmlMs = await this.fetchWithProxy('https://es.motorsport.com/elms/news/');
      if (htmlMs) {
        const doc = new DOMParser().parseFromString(htmlMs, 'text/html');
        const items = doc.querySelectorAll('.ms-item');
        items.forEach(item => {
          const title = item.querySelector('.ms-item__title')?.textContent?.trim();
          const link = item.getAttribute('href') || item.querySelector('a')?.getAttribute('href');
          const img = item.querySelector('img')?.getAttribute('src');
          if (title && link) {
            allNews.push({
              title,
              summary: '',
              link: link.startsWith('http') ? link : `https://es.motorsport.com${link}`,
              source: 'Motorsport.com',
              category: 'ELMS',
              imageUrl: img || undefined
            });
          }
        });
      }
    } catch (e) {
      console.error('[DataService] ELMS news (Motorsport) error:', e);
    }

    try {
      // Source 2: Official ELMS news
      const htmlOf = await this.fetchWithProxy('https://www.europeanlemansseries.com/en/page/news');
      if (htmlOf) {
        const doc = new DOMParser().parseFromString(htmlOf, 'text/html');
        const items = doc.querySelectorAll('a.h3.stretched-link, a.d-block.fs-10.fs-lg-8');
        items.forEach(item => {
          const title = item.textContent?.trim();
          const link = item.getAttribute('href');
          if (title && title.length > 10 && link) {
            allNews.push({
              title,
              summary: '',
              link: link.startsWith('http') ? link : `https://www.europeanlemansseries.com${link}`,
              source: 'ELMS Official',
              category: 'ELMS'
            });
          }
        });
      }
    } catch (e) {
      console.error('[DataService] ELMS news (Official) error:', e);
    }

    return allNews.slice(0, 20);
  },

  async getProcarCalendar(): Promise<CalendarRace[]> {
    return [
      { round: 1, race: 'La Plata', dates: '1 Marzo', status: 'Finished', winner: '' },
      { round: 2, race: 'La Plata', dates: '29 Marzo', status: 'Finished', winner: '' },
      { round: 3, race: 'Toay, La Pampa', dates: '19 Abril', status: 'Upcoming', winner: '' },
      { round: 4, race: 'La Plata', dates: '17 Mayo', status: 'Upcoming', winner: '' },
      { round: 5, race: 'La Plata', dates: '14 Junio', status: 'Upcoming', winner: '' },
      { round: 6, race: 'La Plata', dates: '12 Julio', status: 'Upcoming', winner: '' },
      { round: 7, race: 'La Plata', dates: '16 Agosto', status: 'Upcoming', winner: '' },
      { round: 8, race: 'La Plata', dates: '13 Septiembre', status: 'Upcoming', winner: '' },
      { round: 9, race: 'La Plata', dates: '11 Octubre', status: 'Upcoming', winner: '' },
      { round: 10, race: 'La Plata', dates: '8 Noviembre', status: 'Upcoming', winner: '' }
    ];
  },

  async getProcarStandings(clase: 'A' | 'B'): Promise<TCStandingRow[]> {
    const url = clase === 'A' 
      ? 'https://www.procar4000.com.ar/procar_4000/index.php/2013-01-31-06-54-32/posiciones'
      : 'https://www.procar4000.com.ar/procar_4000/index.php/2013-01-31-07-00-49/posiciones';
    
    const standings: TCStandingRow[] = [];
    try {
      const html = await this.fetchWithProxy(url);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('table tr');
        rows.forEach((row, idx) => {
          if (idx === 0) return; // Skip header
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const pos = cells[0].textContent?.trim() || '';
            const driver = cells[2].textContent?.trim() || '';
            const points = cells[3].textContent?.trim() || '';
            if (pos && driver && points) {
              standings.push({ pos, driver, team: '', points });
            }
          }
        });
      }
    } catch (e) {
      console.error(`[DataService] Procar Standing ${clase} error:`, e);
    }
    return standings;
  },

  async getProcarNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const htmlOf = await this.fetchWithProxy('https://www.procar4000.com.ar/procar_4000/index.php/noticias');
      if (htmlOf) {
        const doc = new DOMParser().parseFromString(htmlOf, 'text/html');
        const items = doc.querySelectorAll('.itemContainer, .catItemView');
        items.forEach(item => {
          const title = item.querySelector('.catItemTitle a')?.textContent?.trim();
          const link = item.querySelector('.catItemTitle a')?.getAttribute('href');
          if (title && link) {
            allNews.push({
              title,
              summary: '',
              link: link.startsWith('http') ? link : `https://www.procar4000.com.ar${link}`,
              source: 'Procar Official',
              category: 'PROCAR4000'
            });
          }
        });
      }
    } catch (e) { console.error('[DataService] Procar Official News error:', e); }

    try {
      const htmlC = await this.fetchWithProxy('https://campeones.com.ar/category/nacionales/procar4000/');
      if (htmlC) {
        const doc = new DOMParser().parseFromString(htmlC, 'text/html');
        const items = doc.querySelectorAll('.elementor-post');
        items.forEach(item => {
          const title = item.querySelector('.elementor-post__title a')?.textContent?.trim();
          const link = item.querySelector('.elementor-post__title a')?.getAttribute('href');
          if (title && link) {
            allNews.push({
              title,
              summary: '',
              link,
              source: 'Campeones',
              category: 'PROCAR4000'
            });
          }
        });
      }
    } catch (e) { console.error('[DataService] Procar Campeones News error:', e); }

    return allNews.slice(0, 20);
  },

  // === WORLD SBK NEWS ===
  async getWorldSBKNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy(WORLDSBK_NEWS_URL);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // The structure often uses .news-item or similar based on research
        const items = doc.querySelectorAll('.news-item, article.news-article, .news-list-item');
        items.forEach(item => {
          const titleElem = item.querySelector('h2, h3, .title, a:not(.image)');
          const title = titleElem?.textContent?.trim();
          const link = titleElem?.tagName === 'A' ? (titleElem as HTMLAnchorElement).getAttribute('href') : item.querySelector('a')?.getAttribute('href');
          const img = item.querySelector('img')?.getAttribute('src') || item.querySelector('img')?.getAttribute('data-src');
          
          if (title && link) {
            allNews.push({
              title,
              summary: '',
              link: link.startsWith('http') ? link : `https://www.worldsbk.com${link}`,
              source: 'WorldSBK.com',
              category: 'WORLD SBK',
              imageUrl: img ? (img.startsWith('http') ? img : `https://www.worldsbk.com${img}`) : undefined
            });
          }
        });
      }
    } catch (e) { console.error('[DataService] World SBK News error:', e); }
    return allNews.slice(0, 15);
  },

  async getWorldSBKCalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy(WORLDSBK_CALENDAR_URL);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('table tr');
        
        rows.forEach((row, idx) => {
          if (idx === 0) return; // Skip header
          const cols = row.querySelectorAll('td');
          if (cols.length >= 4) {
            const roundText = cols[0].textContent?.trim() || `${idx}`;
            const dateText = cols[1].textContent?.trim() || '';
            const circuit = cols[2].textContent?.trim() || '';
            const country = cols[3].textContent?.trim() || '';
            
            // Status check: check for <del> in the first column
            const isFinished = cols[0].querySelector('del') !== null;
            let status: CalendarRace['status'] = isFinished ? 'Finished' : 'Upcoming';
            
            calendar.push({
              round: parseInt(roundText.replace(/[^0-9]/g, '')) || idx,
              race: `${circuit} (${country})`,
              dates: dateText,
              status,
              winner: isFinished ? '✅ Finalizado' : ''
            });
          }
        });

        // Set 'Next' status
        let foundNext = false;
        calendar.forEach(r => {
          if (!foundNext && r.status === 'Upcoming') {
            r.status = 'Next';
            foundNext = true;
          }
        });
      }
    } catch (e) { console.error('[DataService] World SBK Calendar error:', e); }
    return calendar;
  },

  // === WORLD SBK STANDINGS ===
  async getWorldSBKStandings(): Promise<{ drivers: TCStandingRow[], manufacturers: TCStandingRow[] }> {
    const standings = { drivers: [] as TCStandingRow[], manufacturers: [] as TCStandingRow[] };
    try {
      const html = await this.fetchWithProxy(WORLDSBK_RESULTS_URL);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        // Drivers (Default)
        const driverRows = doc.querySelectorAll('#champ-standing-sbk li');
        driverRows.forEach(row => {
          const pos = row.querySelector('.name')?.previousElementSibling?.textContent?.trim() || '';
          const name = row.querySelector('.name')?.textContent?.trim() || '';
          const points = row.querySelector('.points, span:last-child')?.textContent?.trim() || '0';
          
          if (name && !isNaN(parseInt(pos || '1'))) {
            standings.drivers.push({ pos: pos || (standings.drivers.length + 1).toString(), driver: name, points });
          }
        });

        // Manufacturers
        const manufacturerRows = doc.querySelectorAll('#champ-manufacturer-standing-sbk li');
        manufacturerRows.forEach(row => {
          const name = row.querySelector('.builder-name')?.textContent?.trim() || '';
          const points = row.querySelector('.builder-points')?.textContent?.trim() || '0';
          const pos = (standings.manufacturers.length + 1).toString();
          
          if (name) {
            standings.manufacturers.push({ pos, driver: name, points });
          }
        });
      }
    } catch (e) { console.error('[DataService] World SBK Standings error:', e); }
    return standings;
  },

  // === WORLD TCR (WTCR) ===
  async getWTCRNews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy(WTCR_NEWS_URL);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // Corrected selectors from browser research: .teaser-item, .titolonewsteaser a, .datanews
        const items = doc.querySelectorAll('.teaser-item');
        items.forEach(item => {
          const titleEl = item.querySelector('.titolonewsteaser a');
          const title = titleEl?.textContent?.trim();
          const link = titleEl?.getAttribute('href') || item.querySelector('a.zx')?.getAttribute('href');
          const date = item.querySelector('.datanews')?.textContent?.trim() || '';
          const img = item.querySelector('.element-image img')?.getAttribute('src');
          
          if (title && link) {
            allNews.push({
              title,
              summary: date,
              link: link.startsWith('http') ? link : `https://www.fiatcrworldtour.com${link}`,
              source: 'TCR World Tour',
              category: 'WTCR',
              imageUrl: img ? (img.startsWith('http') ? img : `https://www.fiatcrworldtour.com${img}`) : undefined
            });
          }
        });
      }
    } catch (e) { console.error('[DataService] WTCR News error:', e); }
    return allNews.slice(0, 15);
  },

  async getWTCRCalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    try {
      const html = await this.fetchWithProxy(WTCR_EVENTS_URL);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // Final selectors based on visual and subagent research: .wt-event
        const eventBlocks = doc.querySelectorAll('.wt-event');
        
        eventBlocks.forEach((block, idx) => {
          const roundTextRaw = block.querySelector('.indi')?.textContent?.trim() || '';
          const dateText = block.querySelector('.wtthedate')?.textContent?.trim() || '';
          const circuit = block.querySelector('.wtcircuit')?.textContent?.trim() || '';
          
          // Formatting per user request: "Round X y Y - Location"
          let roundText = roundTextRaw.replace(/Rounds?/i, 'Round').replace('&', 'y');
          
          // Clean up circuit name from newlines/extra spaces
          const cleanCircuit = circuit.replace(/\s+/g, ' ').trim();
          
          // Detect regional series from logos
          let seriesSuffix = '';
          const logos = block.querySelectorAll('img');
          logos.forEach(img => {
            const src = img.getAttribute('src') || '';
            const alt = img.getAttribute('alt') || '';
            if (src.includes('TCR_Asia_POS') || alt.includes('Asia')) seriesSuffix = ' (TCR Asia)';
            else if (src.includes('TCR_Mexico_P') || alt.includes('Mexico')) seriesSuffix = ' (TCR South America)';
            else if (src.includes('tcraustralia') || alt.includes('Australia')) seriesSuffix = ' (TCR Australia)';
          });

          if (roundText || cleanCircuit) {
            calendar.push({
              round: idx + 1,
              race: `${roundText}${cleanCircuit ? ' - ' + cleanCircuit : ''}${seriesSuffix}`,
              dates: dateText,
              status: 'Upcoming',
              winner: ''
            });
          }
        });

        // Fallback for different HTML versions if needed
        if (calendar.length === 0) {
          const legacyItems = doc.querySelectorAll('.teaser-item.event');
          legacyItems.forEach((block, idx) => {
            const roundTextRaw = block.querySelector('.indi')?.textContent?.trim() || '';
            const dateText = block.querySelector('.wtthedate')?.textContent?.trim() || '';
            const circuitRaw = block.querySelector('.wtcircuit')?.textContent?.trim() || '';
            const circuit = circuitRaw.replace(/\s+/g, ' ').trim();
            let roundText = roundTextRaw.replace(/Rounds?/i, 'Round').replace('&', 'y');
            calendar.push({
              round: idx + 1,
              race: `${roundText}${circuit ? ' - ' + circuit : ''}`,
              dates: dateText,
              status: 'Upcoming',
              winner: ''
            });
          });
        }

        if (calendar.length > 0) calendar[0].status = 'Next';
      }
    } catch (e) { console.error('[DataService] WTCR Calendar error:', e); }
    return calendar;
  },

  async getWTCRStandings(): Promise<TCStandingRow[]> {
    // Extracted from PDF (2025 Final) as requested by user
    return [
      {"pos": "1", "driver": "Yann Ehrlacher", "team": "Lynk & Co 03 FL TCR", "points": "484"},
      {"pos": "2", "driver": "Thed Björk", "team": "Lynk & Co 03 FL TCR", "points": "460"},
      {"pos": "3", "driver": "Esteban Guerrieri", "team": "Honda Civic Type R FL5 TCR", "points": "385"},
      {"pos": "4", "driver": "Santiago Urrutia", "team": "Lynk & Co 03 FL TCR", "points": "334"},
      {"pos": "5", "driver": "Ma Qing Hua", "team": "Lynk & Co 03 FL TCR", "points": "304"},
      {"pos": "6", "driver": "Néstor Girolami", "team": "Hyundai Elantra N TCR", "points": "299"},
      {"pos": "7", "driver": "Aurélien Comte", "team": "CUPRA Leon VZ TCR", "points": "294"},
      {"pos": "8", "driver": "Norbert Michelisz", "team": "Hyundai Elantra N TCR", "points": "290"},
      {"pos": "9", "driver": "Mikel Azcona", "team": "Hyundai Elantra N TCR", "points": "273"},
      {"pos": "10", "driver": "Ignacio Montenegro", "team": "Honda Civic Type R FL5 TCR", "points": "253"}
    ];
  },

  async getTCRSANews(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];
    try {
      const html = await this.fetchWithProxy('https://campeones.com.ar/category/internacionales/tcr-south-america/');
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const articles = doc.querySelectorAll('article, .post-item, .elementor-post');
        articles.forEach(art => {
          const t = art.querySelector('h1, h2, h3, .title, .entry-title')?.textContent?.trim();
          const p = art.querySelector('p')?.textContent?.trim() || '';
          const a = art.querySelector('a');
          const href = a?.getAttribute('href');
          
          if (t && href && t.length > 10) {
             allNews.push({
               title: t,
               summary: p,
               link: href.startsWith('http') ? href : `https://campeones.com.ar${href}`,
               source: 'Campeones',
               category: 'TCR South America',
             });
          }
        });
      }
    } catch (err) { console.error('[DataService] TCRSA News error:', err); }
    
    // Filter distinct titles
    const seen = new Set<string>();
    return allNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
  },

  async getTCRSACalendar(): Promise<CalendarRace[]> {
    const calendar: CalendarRace[] = [];
    try {
      console.log('[DataService] Fetching TCRSA Calendar from Campeones...');
      const html = await this.fetchWithProxy('https://campeones.com.ar/calendario-2023-tcr-south-america/');
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('table tr');
        rows.forEach((row, idx) => {
          if (idx === 0) return; // Skip header
          const tds = row.querySelectorAll('td');
          if (tds.length >= 4) {
            const dateText = tds[1].textContent?.trim() || '';
            const circuit = tds[3].textContent?.trim() || '';
            
            const cleanDate = dateText.replace(/Fecha|Día/ig, '').trim();
            const cleanCircuit = circuit.replace(/País|Circuito/ig, '').trim();
            
            if (cleanDate && cleanCircuit && !cleanDate.includes('Día')) {
              let status: CalendarRace['status'] = 'Finished';
              
              const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
              const parts = cleanDate.toLowerCase().split(' de ');
              if (parts.length >= 2) {
                const monthIdx = months.findIndex(m => parts[1].includes(m));
                const dayMatch = parts[0].match(/\d+/g);
                if (monthIdx !== -1 && dayMatch) {
                  const day = parseInt(dayMatch[dayMatch.length - 1]);
                  const eventDate = new Date();
                  eventDate.setMonth(monthIdx, day);
                  eventDate.setHours(23, 59, 59, 999);
                  if (new Date() < eventDate) {
                    status = 'Upcoming';
                  }
                }
              }

              calendar.push({
                round: calendar.length + 1,
                race: cleanCircuit,
                dates: cleanDate,
                status,
                winner: ''
              });
            }
          }
        });
        
        let foundNext = false;
        calendar.forEach(c => {
          if (c.status === 'Upcoming' && !foundNext) {
            c.status = 'Next';
            foundNext = true;
          }
        });
      }
    } catch (e) { console.error('[DataService] TCRSA Calendar error:', e); }
    return calendar;
  },

  async getTCRSAStandings(): Promise<TCStandingRow[]> {
    const standings: TCStandingRow[] = [];
    try {
      console.log('[DataService] Fetching TCRSA Standings from Campeones...');
      const html = await this.fetchWithProxy('https://campeones.com.ar/campeonato-2022-tcr-south-america/');
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('table.adc-table tbody tr');
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
            const pos = cells[0]?.textContent?.trim() || '';
            const driver = cells[1]?.textContent?.trim() || '';
            const team = cells[3]?.textContent?.trim() || '';
            const points = cells[5]?.textContent?.trim() || '0';
            
            if (pos && driver && !isNaN(parseInt(pos))) {
              standings.push({
                pos,
                driver,
                team,
                points,
                totalPts: points
              });
            }
          }
        });
      }
    } catch (e) { console.error('[DataService] TCRSA Standings error:', e); }
    return standings;
  }
};

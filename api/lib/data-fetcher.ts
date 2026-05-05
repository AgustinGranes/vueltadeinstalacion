import { parseHTML } from 'linkedom';

const CACHE_TTL = 1000 * 60 * 15; // 15 minutes cache
const cache = new Map<string, { data: any; timestamp: number }>();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchWithHeaders(url: string, referer?: string) {
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
  };
  if (referer) headers['Referer'] = referer;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } catch (e) {
    console.error(`Fetch error for ${url}:`, e);
    return null;
  }
}

export const CATEGORY_RESULTS_URLS: Record<string, string> = {
  'F1': 'https://www.formula1.com/en/results.html/2026/races.html',
  'WRC': 'https://es.motorsport.com/wrc/results/2026',
  'NASCAR': 'https://es.motorsport.com/nascar-cup/results/2026',
  'WEC': 'https://es.motorsport.com/wec/results/2026/',
  'IndyCar': 'https://es.motorsport.com/indycar/results/2026/',
  'TC': 'https://tiempos.actc.org.ar/resultados',
  'TCP': 'https://tiempos.actc.org.ar/resultados',
  'TCM': 'https://tiempos.actc.org.ar/resultados',
  'TC2000': 'https://tc2000.com.ar/carreras.php',
  'IMSA': 'https://lat.motorsport.com/imsa/results/2026',
  'MotoGP': 'https://as.com/resultados/motor/motogp/clasificacion/races/',
  'TCRSA': 'https://southamerica.tcr-series.com/calendario-2026/',
};

export const dataFetcher = {
  async getF1News() {
    const cacheKey = 'f1-news';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    const allNews: any[] = [];
    try {
      const html = await fetchWithHeaders('https://as.com/motor/formula_1/');
      if (html) {
        const { document } = parseHTML(html);
        document.querySelectorAll('article').forEach(art => {
          const t = art.querySelector('h2, h3')?.textContent?.trim();
          const l = art.querySelector('a')?.getAttribute('href');
          if (t && l) {
            allNews.push({
              title: t,
              link: l.startsWith('/') ? `https://as.com${l}` : l,
              source: 'AS.com'
            });
          }
        });
      }
    } catch (e) {}

    cache.set(cacheKey, { data: allNews, timestamp: Date.now() });
    return allNews;
  },

  async getF1Calendar() {
    const cacheKey = 'f1-calendar';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    try {
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard');
      const data = await res.json();
      const races = (data?.leagues?.[0]?.calendar || []).map((entry: any, i: number) => ({
        round: i + 1,
        race: entry.label,
        dates: `${new Date(entry.startDate).toLocaleDateString('es-AR')} - ${new Date(entry.endDate).toLocaleDateString('es-AR')}`,
        status: new Date() > new Date(entry.endDate) ? 'Finished' : 'Upcoming'
      }));
      cache.set(cacheKey, { data: races, timestamp: Date.now() });
      return races;
    } catch (e) {
      return [];
    }
  },

  async getF1Standings() {
    try {
      const res = await fetch('https://site.api.espn.com/apis/v2/sports/racing/f1/standings');
      const data = await res.json();
      const drivers = (data?.children?.[0]?.standings?.entries || []).map((e: any) => ({
        pos: e.stats?.find((s: any) => s.name === 'rank')?.displayValue || '',
        driver: e.athlete?.displayName || '',
        team: e.athlete?.team?.name || '',
        points: e.stats?.find((s: any) => s.name === 'points')?.displayValue || '0'
      }));
      return { drivers };
    } catch (e) {
      return { drivers: [] };
    }
  },

  async getNews(category: string, url: string, source: string) {
    const cacheKey = `news-${category}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    const allNews: any[] = [];
    try {
      const html = await fetchWithHeaders(url);
      if (html) {
        const { document } = parseHTML(html);
        document.querySelectorAll('article, .ms-item, .mod-data').forEach(art => {
          const t = art.querySelector('h2, h3, h4, .ms-item_title, .mod-title')?.textContent?.trim();
          const l = art.querySelector('a')?.getAttribute('href');
          if (t && l && t.length > 10) {
            allNews.push({
              title: t,
              link: l.startsWith('/') ? new URL(l, url).href : l,
              source
            });
          }
        });
      }
    } catch (e) {}

    cache.set(cacheKey, { data: allNews, timestamp: Date.now() });
    return allNews;
  },

  async getWRCStandings() {
    try {
      const html = await fetchWithHeaders('https://es.motorsport.com/wrc/standings/');
      if (!html) return { drivers: [] };
      const { document } = parseHTML(html);
      const rows: any[] = [];
      document.querySelectorAll('tr.ms-table_row').forEach(tr => {
        const pos = tr.querySelector('.ms-table_field--pos')?.textContent?.trim();
        const driver = tr.querySelector('.ms-table_field--driver .name-short')?.textContent?.trim();
        const points = tr.querySelector('.ms-table_field--total_points')?.textContent?.trim();
        if (pos && driver) rows.push({ pos, driver, points });
      });
      return { drivers: rows };
    } catch (e) { return { drivers: [] }; }
  },

  async getWeeklyCalendar() {
    const url = `https://api.vueltarapida.com/api/races`;
    try {
      const res = await fetch(url, { headers: { 'Referer': 'https://vueltarapida.com/' } });
      const data = await res.json();
      return (data || []).map((r: any) => ({
        category: r.category || '',
        event: r.name || '',
        circuit: r.circuit || '',
        date: r.startAt ? new Date(r.startAt).toLocaleString('es-AR') : ''
      }));
    } catch (e) {
      return [];
    }
  }
};

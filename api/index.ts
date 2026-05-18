import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseHTML } from 'linkedom';

// ─── Static Data Maps ────────────────────────────────────────────────────────

const CATEGORY_RESULTS_URLS: Record<string, string> = {
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
  'F2': 'https://lat.motorsport.com/fia-f2/results/2026',
  'F3': 'https://lat.motorsport.com/fiaf3/results/2026',
  'WRC2': 'https://es.motorsport.com/wrc/results/2026',
  'GTWC': 'https://www.gt-world-challenge.com/results',
  'BTCC': 'https://btcc.net/results',
  'DTM': 'https://es.motorsport.com/dtm/results/2026',
  'WorldSBK': 'https://www.worldsbk.com/en/results',
  'SuperFormula': 'https://lat.motorsport.com/superf/results/2026',
};

const CATEGORY_NEWS_URLS: Record<string, { url: string; source: string }> = {
  'F1': { url: 'https://as.com/motor/formula_1/', source: 'AS.com' },
  'WRC': { url: 'https://lat.motorsport.com/wrc/news/', source: 'Motorsport.com' },
  'NASCAR': { url: 'https://lat.motorsport.com/nascar-cup/news/', source: 'Motorsport.com' },
  'WEC': { url: 'https://lat.motorsport.com/wec/news/', source: 'Motorsport.com' },
  'IndyCar': { url: 'https://lat.motorsport.com/indycar/news/', source: 'Motorsport.com' },
  'MotoGP': { url: 'https://as.com/noticias/moto-gp/', source: 'AS.com' },
  'TC': { url: 'https://www.solotc.com.ar/', source: 'SoloTC' },
  'TCP': { url: 'https://www.solotc.com.ar/', source: 'SoloTC' },
  'TCM': { url: 'https://www.solotc.com.ar/', source: 'SoloTC' },
  'TC2000': { url: 'https://tc2000.com.ar/noticias', source: 'TC2000' },
  'IMSA': { url: 'https://lat.motorsport.com/imsa/news/', source: 'Motorsport.com' },
  'F2': { url: 'https://lat.motorsport.com/fia-f2/news/', source: 'Motorsport.com' },
  'F3': { url: 'https://lat.motorsport.com/fiaf3/news/', source: 'Motorsport.com' },
  'GTWC': { url: 'https://lat.motorsport.com/gt-world-challenge-europe/news/', source: 'Motorsport.com' },
  'BTCC': { url: 'https://lat.motorsport.com/btcc/news/', source: 'Motorsport.com' },
  'DTM': { url: 'https://lat.motorsport.com/dtm/news/', source: 'Motorsport.com' },
  'WorldSBK': { url: 'https://lat.motorsport.com/worldsbk/news/', source: 'Motorsport.com' },
  'SuperFormula': { url: 'https://lat.motorsport.com/superf/news/', source: 'Motorsport.com' },
  'WRC2': { url: 'https://lat.motorsport.com/wrc/news/', source: 'Motorsport.com' },
  'TCRSA': { url: 'https://lat.motorsport.com/tcr/news/', source: 'Motorsport.com' },
};

const CATEGORY_STANDINGS_URLS: Record<string, string> = {
  'F1': 'https://site.api.espn.com/apis/v2/sports/racing/f1/standings',
  'WRC': 'https://lat.motorsport.com/wrc/standings/2026/',
  'NASCAR': 'https://lat.motorsport.com/nascar-cup/standings/2026/',
  'WEC': 'https://lat.motorsport.com/wec/standings/2025/',
  'MotoGP': 'https://lat.motorsport.com/motogp/standings/2026/',
  'F2': 'https://lat.motorsport.com/fia-f2/standings/2026/',
  'F3': 'https://lat.motorsport.com/fiaf3/standings/2026/',
};

const CATEGORY_CALENDAR_SOURCES: Record<string, string> = {
  'F1': 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard',
  'MotoGP': 'https://lat.motorsport.com/motogp/schedule/2026/',
  'WRC': 'https://lat.motorsport.com/wrc/schedule/2026/',
  'WEC': 'https://lat.motorsport.com/wec/schedule/2026/',
};

const CATEGORY_LOGOS: Record<string, string> = {
  'F1': 'https://vueltadeinstalacion.vercel.app/F1.svg',
  'WRC': 'https://vueltadeinstalacion.vercel.app/WRC.png',
  'WRC2': 'https://vueltadeinstalacion.vercel.app/WRC2.png',
  'NASCAR': 'https://vueltadeinstalacion.vercel.app/NASCAR.png',
  'WEC': 'https://vueltadeinstalacion.vercel.app/WEC.png',
  'IndyCar': 'https://vueltadeinstalacion.vercel.app/INDY.png',
  'TC': 'https://vueltadeinstalacion.vercel.app/TC.png',
  'TCP': 'https://vueltadeinstalacion.vercel.app/TCP.png',
  'TCM': 'https://vueltadeinstalacion.vercel.app/TCM.png',
  'TC2000': 'https://vueltadeinstalacion.vercel.app/TC2000.png',
  'IMSA': 'https://vueltadeinstalacion.vercel.app/IMSA.png',
  'MotoGP': 'https://vueltadeinstalacion.vercel.app/MOTOGP.png',
  'F2': 'https://vueltadeinstalacion.vercel.app/F2.png',
  'F3': 'https://vueltadeinstalacion.vercel.app/F3.png',
  'GTWC': 'https://vueltadeinstalacion.vercel.app/GT.png',
  'BTCC': 'https://vueltadeinstalacion.vercel.app/BTCC.png',
  'DTM': 'https://vueltadeinstalacion.vercel.app/DTM.png',
  'SuperFormula': 'https://vueltadeinstalacion.vercel.app/SF.png',
  'TCRSA': 'https://vueltadeinstalacion.vercel.app/TCRSA.png',
  'WorldSBK': 'https://vueltadeinstalacion.vercel.app/WORLDSBK.png',
};

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached(key: string) {
  const c = cache.get(key);
  if (c && Date.now() - c.ts < CACHE_TTL) return c.data;
  return null;
}

function setCached(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,*/*', 'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ─── News Scraper ─────────────────────────────────────────────────────────────

async function scrapeNews(category: string): Promise<any[]> {
  const cacheKey = `news-${category}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const info = CATEGORY_NEWS_URLS[category];
  if (!info) return [];

  const html = await fetchHtml(info.url);
  if (!html) return [];

  const { document } = parseHTML(html);
  const news: any[] = [];

  document.querySelectorAll('.ms-item, .ms-item_link, article, [class*="article"], [class*="news"]').forEach((art: any) => {
    const anchor = art.tagName === 'A' ? art : art.querySelector('a');
    const titleEl = art.querySelector('.ms-item_title, .ms-item__title, h2, h3, h4, [class*="title"]');
    const t = titleEl?.textContent?.trim() || anchor?.textContent?.trim();
    const l = anchor?.getAttribute('href');
    const imgEl = art.querySelector('img[src], img[data-src]');
    
    if (t && l && t.length > 10) {
      news.push({
        title: t.split('\n').map((s: string) => s.trim()).filter(Boolean).pop() || t,
        link: l.startsWith('/') ? new URL(l, info.url).href : l,
        image: imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || null,
        source: info.source,
      });
    }
  });

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = news.filter(n => {
    if (seen.has(n.title)) return false;
    seen.add(n.title);
    return true;
  }).slice(0, 20);

  setCached(cacheKey, unique);
  return unique;
}

// ─── Generic Standings & Calendar Scrapers ────────────────────────────────────

async function scrapeStandings(category: string): Promise<any[]> {
  const cacheKey = `standings-${category}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = CATEGORY_STANDINGS_URLS[category];
  if (!url) return [];

  const html = await fetchHtml(url);
  if (!html) return [];

  const { document } = parseHTML(html);
  const rows: any[] = [];
  
  if (url.includes('motorsport.com')) {
    document.querySelectorAll('tr.ms-table_row').forEach((tr: any) => {
      const pos = tr.querySelector('.ms-table_field--pos')?.textContent?.trim();
      const points = tr.querySelector('.ms-table_field--total_points')?.textContent?.trim();
      
      let driver = tr.querySelector('.ms-table_field--driver .name-short')?.textContent?.trim() ||
                   tr.querySelector('.ms-table_field--team .name')?.textContent?.trim() ||
                   tr.querySelector('.ms-table_field--result_constructor')?.textContent?.trim() ||
                   tr.querySelector('.name-short, .name')?.textContent?.trim() ||
                   tr.querySelectorAll('td')[1]?.textContent?.trim() || '';

      if (pos && driver && !isNaN(parseInt(pos))) {
        rows.push({ pos, driver, points: points || '0' });
      }
    });
  }

  setCached(cacheKey, rows);
  return rows;
}

async function scrapeCalendar(category: string): Promise<any[]> {
  const cacheKey = `calendar-${category}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = CATEGORY_CALENDAR_SOURCES[category];
  if (!url) return [];

  const html = await fetchHtml(url);
  if (!html) return [];

  const { document } = parseHTML(html);
  const events: any[] = [];
  
  if (url.includes('motorsport.com')) {
    const tableRows = document.querySelectorAll('tr.ms-table_row');
    tableRows.forEach((tr: any, i: number) => {
      const dateStr = tr.querySelector('.ms-table_field--date')?.textContent?.trim() || '';
      const raceName = tr.querySelector('.ms-table_field--title a')?.textContent?.trim() || '';
      if (dateStr && raceName) {
        events.push({
          round: i + 1,
          race: raceName,
          dates: dateStr,
          status: 'Upcoming'
        });
      }
    });
  }

  setCached(cacheKey, events);
  return events;
}

// ─── F1 Specific Fetchers ─────────────────────────────────────────────────────

async function getF1Calendar() {
  const cached = getCached('f1-calendar');
  if (cached) return cached;
  try {
    const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard');
    const d = await r.json();
    const now = new Date();
    const races = (d?.leagues?.[0]?.calendar || []).map((entry: any, i: number) => ({
      round: i + 1,
      race: entry.label,
      startDate: entry.startDate,
      endDate: entry.endDate,
      status: now > new Date(entry.endDate) ? 'Finished' : now >= new Date(entry.startDate) ? 'Live' : 'Upcoming',
    }));
    setCached('f1-calendar', races);
    return races;
  } catch {
    return [];
  }
}

async function getF1Standings() {
  const cached = getCached('f1-standings');
  if (cached) return cached;
  try {
    const r = await fetch('https://site.api.espn.com/apis/v2/sports/racing/f1/standings');
    const d = await r.json();
    const drivers = (d?.children?.[0]?.standings?.entries || []).map((e: any) => ({
      pos: e.stats?.find((s: any) => s.name === 'rank')?.displayValue || '',
      driver: e.athlete?.displayName || '',
      team: e.athlete?.team?.name || '',
      points: e.stats?.find((s: any) => s.name === 'points')?.displayValue || '0',
    }));
    const constructors = (d?.children?.[1]?.standings?.entries || []).map((e: any) => ({
      pos: e.stats?.find((s: any) => s.name === 'rank')?.displayValue || '',
      team: e.team?.displayName || '',
      points: e.stats?.find((s: any) => s.name === 'points')?.displayValue || '0',
    }));
    const result = { drivers, constructors };
    setCached('f1-standings', result);
    return result;
  } catch {
    return { drivers: [], constructors: [] };
  }
}

async function getWeeklyCalendar() {
  const cached = getCached('weekly');
  if (cached) return cached;
  try {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const r = await fetch(
      `https://api.vueltarapida.com/api/races?minDate=${monday.getTime()}&maxDate=${sunday.getTime()}`,
      { headers: { 'Referer': 'https://vueltarapida.com/', 'Origin': 'https://vueltarapida.com' } }
    );
    const data = await r.json();
    const result = (Array.isArray(data) ? data : []).map((race: any) => ({
      category: race.category || '',
      event: race.name || race.completeName || '',
      circuit: race.circuit || '',
      startDate: race.startAt ? new Date(race.startAt).toISOString() : '',
    }));
    setCached('weekly', result);
    return result;
  } catch {
    return [];
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawPath = (req.url || '/api').split('?')[0];
  const parts = rawPath.replace(/^\/+/, '').split('/').filter(Boolean);
  // parts[0] = 'api', parts[1] = category, parts[2] = type
  const category = (parts[1] || '').toLowerCase();
  const type = (parts[2] || '').toLowerCase();

  try {
    // ── ROOT /api ──────────────────────────────────────────────────────────────
    if (!category) {
      const categories = Object.keys(CATEGORY_RESULTS_URLS).map(cat => ({
        id: cat.toLowerCase(),
        name: cat,
        endpoints: {
          all: `/api/${cat.toLowerCase()}`,
          news: `/api/${cat.toLowerCase()}/news`,
          calendar: `/api/${cat.toLowerCase()}/calendar`,
          standings: `/api/${cat.toLowerCase()}/standings`,
          results_url: CATEGORY_RESULTS_URLS[cat],
        },
      }));
      return res.status(200).json({
        status: 'online',
        api_version: '2.0.0',
        title: 'Vuelta de Instalación — Unified Motorsport API',
        description: 'News, calendars, standings and result links for all motorsport categories.',
        global_endpoints: {
          weekly_calendar: '/api/weekly',
          categories_list: '/api/categories',
        },
        categories,
      });
    }

    // ── /api/weekly ────────────────────────────────────────────────────────────
    if (category === 'weekly') {
      return res.status(200).json({ data: await getWeeklyCalendar() });
    }

    // ── /api/categories ────────────────────────────────────────────────────────
    if (category === 'categories') {
      return res.status(200).json(Object.keys(CATEGORY_RESULTS_URLS));
    }

    // ── Find category key ──────────────────────────────────────────────────────
    const catKey = Object.keys(CATEGORY_RESULTS_URLS).find(
      k => k.toLowerCase() === category
    );

    if (!catKey) {
      return res.status(404).json({ error: 'Category not found', available: Object.keys(CATEGORY_RESULTS_URLS) });
    }

    // ── /api/f1 special (uses ESPN APIs directly) ──────────────────────────────
    if (catKey === 'F1') {
      if (type === 'calendar') {
        return res.status(200).json({ category: 'F1', data: await getF1Calendar() });
      }
      if (type === 'standings') {
        return res.status(200).json({ category: 'F1', data: await getF1Standings() });
      }
      if (type === 'news') {
        const articles = await scrapeNews('F1');
        return res.status(200).json({
          category: 'F1',
          source: CATEGORY_NEWS_URLS['F1']?.source,
          source_url: CATEGORY_NEWS_URLS['F1']?.url,
          count: articles.length,
          data: articles,
        });
      }
      if (type === 'results') {
        return res.status(200).json({ category: 'F1', logo: CATEGORY_LOGOS['F1'] || null, results_url: CATEGORY_RESULTS_URLS['F1'] });
      }
      // Full F1 dump
      const [calendar, standings, news] = await Promise.all([
        getF1Calendar(),
        getF1Standings(),
        scrapeNews('F1'),
      ]);
      return res.status(200).json({
        category: 'Formula 1',
        logo: CATEGORY_LOGOS['F1'] || null,
        results_url: CATEGORY_RESULTS_URLS['F1'],
        news_source: CATEGORY_NEWS_URLS['F1']?.url,
        calendar,
        standings,
        news: news.slice(0, 10),
      });
    }

    // ── /api/<category>/logo ───────────────────────────────────────────────────
    if (type === 'logo') {
      return res.status(200).json({
        category: catKey,
        logo: CATEGORY_LOGOS[catKey] || null,
      });
    }

    // ── /api/<category>/news ───────────────────────────────────────────────────
    if (type === 'news') {
      const articles = await scrapeNews(catKey);
      return res.status(200).json({
        category: catKey,
        source: CATEGORY_NEWS_URLS[catKey]?.source || null,
        source_url: CATEGORY_NEWS_URLS[catKey]?.url || null,
        count: articles.length,
        data: articles,
      });
    }

    // ── /api/<category>/standings ──────────────────────────────────────────────
    if (type === 'standings') {
      const data = await scrapeStandings(catKey);
      return res.status(200).json({
        category: catKey,
        data: data.length > 0 ? data : null,
        source_url: CATEGORY_STANDINGS_URLS[catKey] || null,
      });
    }

    // ── /api/<category>/calendar ───────────────────────────────────────────────
    if (type === 'calendar') {
      const data = await scrapeCalendar(catKey);
      return res.status(200).json({
        category: catKey,
        data: data.length > 0 ? data : null,
        source_url: CATEGORY_CALENDAR_SOURCES[catKey] || null,
      });
    }

    // ── /api/<category>/results ────────────────────────────────────────────────
    if (type === 'results') {
      return res.status(200).json({
        category: catKey,
        results_url: CATEGORY_RESULTS_URLS[catKey],
      });
    }

    // ── /api/<category> (full dump) ────────────────────────────────────────────
    const [news, standingsData, calendarData] = await Promise.all([
      scrapeNews(catKey),
      scrapeStandings(catKey),
      scrapeCalendar(catKey)
    ]);
    
    return res.status(200).json({
      category: catKey,
      logo: CATEGORY_LOGOS[catKey] || null,
      results_url: CATEGORY_RESULTS_URLS[catKey],
      news_source: CATEGORY_NEWS_URLS[catKey]?.url || null,
      news: news.slice(0, 10),
      calendar: calendarData.length > 0 ? calendarData : null,
      standings: standingsData.length > 0 ? standingsData : null,
    });

  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
  }
}

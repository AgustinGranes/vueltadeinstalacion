interface VercelRequest {
  url?: string;
  method?: string;
  query?: Record<string, string | string[]>;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  send: (body: any) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  end: (data?: any) => void;
}

import { parseHTML } from 'linkedom';
import { getTheRacingLineCalendar, setDynamicCookie, getSyncStatus } from './theRacingLine.js';

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
  'F1': { url: 'https://lat.motorsport.com/f1/news/', source: 'Motorsport.com' },
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
  'IndyCar': 'https://es.motorsport.com/indycar/standings/2026/',
  'TC': 'https://tiempos.actc.org.ar/campeonato-de-tc/campeonato',
};

const CATEGORY_CALENDAR_SOURCES: Record<string, string> = {
  'F1': 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard',
  'MotoGP': 'https://lat.motorsport.com/motogp/schedule/2026/',
  'WRC': 'https://www.marca.com/motor/rallies/calendario.html',
  'WEC': 'https://lat.motorsport.com/wec/schedule/2026/',
  'TC': 'https://actc.org.ar/tc/calendario.html',
  'IndyCar': 'https://es.motorsport.com/indycar/schedule/2026/',
  'NASCAR': 'https://lat.motorsport.com/nascar-cup/schedule/2026/?all_event_types=1',
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
  // Disable strict TLS/SSL validation for regional sites with outdated certs
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const urlObj = new URL(url);
    const domain = urlObj.origin;

    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': domain + '/',
        'Origin': domain,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
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

  let html = await fetchHtml(info.url);
  
  // Resilient fallback for F1 (AS.com may block or return empty)
  if (category === 'F1' && (!html || html.length < 200)) {
    html = await fetchHtml('https://lat.motorsport.com/f1/news/');
    if (html) {
      info.source = 'Motorsport.com';
      info.url = 'https://lat.motorsport.com/f1/news/';
    }
  }

  if (!html) return [];

  const { document } = parseHTML(html);
  const news: any[] = [];

  if (category === 'TC' || category === 'TCP' || category === 'TCM') {
    // Ultra-aggressive scraping for SoloTC
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach((link: any) => {
      const h = link.getAttribute('href');
      const t = link.textContent?.trim();
      if (h && t && t.length > 20 && h.length > 20 && 
          !h.includes('/category/') && !h.includes('/author/') && !h.includes('/tag/') &&
          !h.includes('facebook.com') && !h.includes('twitter.com') &&
          t !== 'SoloTC | Turismo Carretera') {
        
        const fullLink = h.startsWith('http') ? h : `https://www.solotc.com.ar${h.startsWith('/') ? '' : '/'}${h}`;
        news.push({
          title: t,
          link: fullLink,
          image: null,
          source: 'SoloTC',
        });
      }
    });

    document.querySelectorAll('h1, h2, h3').forEach((hd: any) => {
      const link = hd.querySelector('a') || hd.closest('a');
      const t = hd.textContent?.trim();
      const l = link?.getAttribute('href');
      if (t && l && t.length > 10 && t !== 'SoloTC | Turismo Carretera') {
        const fullLink = l.startsWith('http') ? l : `https://www.solotc.com.ar${l.startsWith('/') ? '' : '/'}${l}`;
        news.push({
          title: t,
          link: fullLink,
          image: null,
          source: 'SoloTC',
        });
      }
    });
  } else {
    // Standard scraper
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
  }

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

  const rows: any[] = [];

  if (category === 'TC') {
    try {
      // 1. Fetch SoloTC home page to find the latest championship article
      const homeHtml = await fetchHtml('https://www.solotc.com.ar/');
      let standingsUrl = 'https://www.solotc.com.ar/asi-quedo-campeonato-tc-fecha-5-termas-2026/'; // default fallback
      if (homeHtml) {
        const { document: homeDoc } = parseHTML(homeHtml);
        const links = homeDoc.querySelectorAll('a');
        for (const link of links) {
          const href = link.getAttribute('href') || '';
          if (href.includes('campeonato-tc-fecha') || href.includes('asi-quedo-campeonato-tc')) {
            standingsUrl = href;
            break;
          }
        }
      }

      // 2. Fetch the actual standings page
      const html = await fetchHtml(standingsUrl);
      if (html) {
        const { document } = parseHTML(html);
        const table = document.querySelector('table');
        if (table) {
          const trs = table.querySelectorAll('tr');
          trs.forEach((tr: any, idx: number) => {
            if (idx === 0) return; // Skip header
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 3) {
              const posText = tds[0].textContent?.trim().replace('°', '') || '';
              const driverText = tds[1].textContent?.trim() || '';
              const pointsText = tds[tds.length - 1].textContent?.trim() || '0';
              if (posText && driverText && !isNaN(parseInt(posText))) {
                rows.push({
                  pos: posText,
                  driver: driverText,
                  points: pointsText
                });
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('Error fetching/parsing TC standings from SoloTC:', e);
    }
  } else {
    const html = await fetchHtml(url);
    if (html) {
      const { document } = parseHTML(html);
      
      if (url.includes('motorsport.com')) {
        const tableRows = document.querySelectorAll('tr.ms-table_row, table.ms-table tr, table tr');
        tableRows.forEach((tr: any) => {
          const pos = tr.querySelector('.ms-table_field--pos')?.textContent?.trim() ||
                      tr.querySelectorAll('td')[0]?.textContent?.trim().replace('.', '');
          const points = tr.querySelector('.ms-table_field--total_points')?.textContent?.trim() ||
                         tr.querySelectorAll('td')[tr.querySelectorAll('td').length - 1]?.textContent?.trim() || '0';
          
          let driver = tr.querySelector('.ms-table_field--driver .name-short')?.textContent?.trim() ||
                       tr.querySelector('.ms-table_field--team .name')?.textContent?.trim() ||
                       tr.querySelector('.ms-table_field--result_constructor')?.textContent?.trim() ||
                       tr.querySelector('.name-short, .name')?.textContent?.trim() ||
                       tr.querySelectorAll('td')[1]?.textContent?.trim() || '';

          if (pos && driver && !isNaN(parseInt(pos)) && driver.toLowerCase() !== 'piloto' && driver.toLowerCase() !== 'driver') {
            rows.push({ pos, driver: driver.split('\n')[0].trim(), points });
          }
        });
      } else if (url.includes('actc.org.ar') || url.includes('tiempos.actc.org.ar')) {
        const tableRows = document.querySelectorAll('tr');
        tableRows.forEach((tr: any) => {
          let posText = tr.querySelector('.col-pos')?.textContent?.trim();
          let driverText = tr.querySelector('.col-name')?.textContent?.trim();
          let pointsText = tr.querySelector('.col-total')?.textContent?.trim();
          
          if (!posText || !driverText) {
            const cells = tr.querySelectorAll('td');
            if (cells.length >= 3) {
              posText = cells[0].textContent?.trim();
              driverText = cells[1].textContent?.trim();
              pointsText = cells[cells.length - 1].textContent?.trim();
            }
          }

          if (posText && driverText) {
            const cleanPos = posText.replace('.', '').trim();
            if (/^\d+$/.test(cleanPos)) {
              const driver = driverText.split('\n').map((s: string) => s.trim()).filter(Boolean).join(' ');
              rows.push({
                pos: cleanPos,
                driver,
                points: pointsText?.trim() || '0'
              });
            }
          }
        });
      }
    }
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
    // 1. Try to find JSON-LD first (most reliable on Motorsport.com)
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    let foundJsonEvents: any[] = [];
    
    scripts.forEach((script: any) => {
      try {
        const content = script.textContent || '';
        const parsed = JSON.parse(content);
        const potentialEvents = Array.isArray(parsed) ? parsed : (parsed['@graph'] || (parsed.itemListElement?.map((e: any) => e.item) || []));
        potentialEvents.forEach((ev: any) => {
          if (ev?.['@type'] === 'Event' || ev?.['@type'] === 'SportsEvent') {
            foundJsonEvents.push(ev);
          }
        });
      } catch (e) {}
    });

    if (foundJsonEvents.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      // Sort by startDate
      foundJsonEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      foundJsonEvents.forEach((ev: any, idx: number) => {
        const eventName = ev.name
          ?.replace(/,\s*IndyCar\s*-\s*\d{4}/i, '')
          ?.replace(/,\s*NASCAR\s*Cup\s*-\s*\d{4}/i, '')
          ?.replace(/,\s*WEC\s*-\s*\d{4}/i, '')
          ?.trim() || ev.name;

        const startDate = new Date(ev.startDate);
        const endDate = new Date(ev.endDate);
        
        let status = 'Upcoming';
        if (now >= startDate && now <= endDate) {
          status = 'Live';
        } else if (now > endDate) {
          status = 'Finished';
        }
        
        let dates = `${startDate.getDate()} ${shortMonths[startDate.getMonth()]}`;
        if (startDate.getTime() !== endDate.getTime() && startDate.getMonth() !== undefined) {
          dates += ` - ${endDate.getDate()} ${shortMonths[endDate.getMonth()]}`;
        }

        events.push({
          round: idx + 1,
          race: eventName || 'Motorsport Event',
          dates,
          status,
          winner: ev.competitor?.find((c: any) => c.winner)?.name || ''
        });
      });
    }

    // 2. Fallback to table scraping if JSON-LD fails or returned nothing
    if (events.length === 0) {
      const tableRows = document.querySelectorAll('tr.ms-table_row, .ms-schedule-table__item, tr[class*="event-row"]');
      let tempRound = 1;

      tableRows.forEach((tr: any) => {
        const nameEl = tr.querySelector('.ms-table_field--title a, .ms-schedule-table-item-main__event .ms-link, .race-name, .event-name');
        const dateStr = tr.querySelector('.ms-table_field--date')?.textContent?.trim() ||
                        tr.querySelector('.ms-schedule-table-subevent-day__main, .date')?.textContent?.trim() || '';
        
        const raceName = nameEl?.textContent?.trim() || '';
        if (raceName && dateStr) {
          events.push({
            round: tempRound++,
            race: raceName,
            dates: dateStr,
            status: 'Upcoming'
          });
        }
      });
    }
    
    // Set first 'Upcoming' as 'Next'
    let foundNext = false;
    events.forEach(ev => {
      if (ev.status === 'Upcoming' && !foundNext) {
        ev.status = 'Next';
        foundNext = true;
      }
    });
  } else if (url.includes('marca.com')) {
    const tableRows = document.querySelectorAll('table.calendario.motor tbody tr');
    tableRows.forEach((tr: any, i: number) => {
      const dateStr = tr.querySelector('td.fecha-inicio')?.textContent?.trim() || '';
      let raceName = tr.querySelector('td.evento')?.textContent?.trim() || '';
      raceName = raceName.replace(/^WRC\s+/i, '').replace(/\s+\d{4}$/, '').trim();
      const winner = tr.querySelector('td.primero')?.textContent?.trim() || '';
      
      if (dateStr && raceName) {
        events.push({
          round: i + 1,
          race: raceName,
          dates: dateStr,
          status: winner ? 'Finished' : 'Upcoming',
          winner: winner || undefined
        });
      }
    });
    
    // Set first 'Upcoming' as 'Next'
    let foundNext = false;
    events.forEach(ev => {
      if (ev.status === 'Upcoming' && !foundNext) {
        ev.status = 'Next';
        foundNext = true;
      }
    });
  } else if (url.includes('actc.org.ar')) {
    const elements = document.querySelectorAll('.info-race');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const monthsMap: Record<string, number> = {
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 
      'jul': 6, 'ago': 7, 'set': 8, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    };

    elements.forEach((el: any, idx: number) => {
      const dateEl = el.querySelector('.date');
      const dayStr = dateEl?.querySelector('span')?.textContent?.trim() || '';
      const monthYearStr = dateEl?.textContent?.replace(dayStr, '').trim().toLowerCase() || '';
      const dates = dayStr ? `${dayStr} ${monthYearStr}` : '';
      
      let status = 'Upcoming';
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

      events.push({
        round: idx + 1,
        race,
        dates,
        status,
        winner: winner || undefined
      });
    });

    // Set first 'Upcoming' as 'Next'
    let foundNext = false;
    events.forEach(ev => {
      if (ev.status === 'Upcoming' && !foundNext) {
        ev.status = 'Next';
        foundNext = true;
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
    const d: any = await r.json();
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
    const d: any = await r.json();
    const drivers = (d?.children?.[0]?.standings?.entries || []).map((e: any) => ({
      pos: e.stats?.find((s: any) => s.type === 'rank' || s.name === 'rank')?.displayValue || '',
      driver: e.athlete?.displayName || e.athlete?.shortName || '',
      team: e.athlete?.team?.name || e.athlete?.team?.displayName || '',
      points: e.stats?.find((s: any) => s.type === 'points' || s.name === 'points')?.displayValue || '0',
    }));
    const constructors = (d?.children?.[1]?.standings?.entries || []).map((e: any) => ({
      pos: e.stats?.find((s: any) => s.type === 'rank' || s.name === 'rank')?.displayValue || '',
      team: e.team?.displayName || e.team?.name || '',
      points: e.stats?.find((s: any) => s.type === 'points' || s.name === 'points')?.displayValue || '0',
    }));
    const result = { drivers, constructors };
    setCached('f1-standings', result);
    return result;
  } catch {
    return { drivers: [], constructors: [] };
  }
}

export async function getWeeklyCalendar() {
  const cached = getCached('weekly');
  if (cached) return cached;
  try {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 13); // 2-week window (this week + next week)
    sunday.setHours(23, 59, 59, 999);

    const [vrRacesSettled, vrCatSettled, trlSettled] = await Promise.allSettled([
      fetch(
        `https://api.vueltarapida.com/api/races?minDate=${monday.getTime()}&maxDate=${sunday.getTime()}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://vueltarapida.com/',
            'Origin': 'https://vueltarapida.com'
          },
          signal: AbortSignal.timeout(6000)
        }
      ).then(r => r.json()),
      fetch(
        `https://api.vueltarapida.com/api/categories`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://vueltarapida.com/',
            'Origin': 'https://vueltarapida.com'
          },
          signal: AbortSignal.timeout(6000)
        }
      ).then(r => r.json()).catch(() => null),
      getTheRacingLineCalendar({ minDate: monday.getTime(), maxDate: sunday.getTime() })
    ]);

    let categoriesMap: Record<string, any> = {};
    if (vrCatSettled.status === 'fulfilled' && Array.isArray(vrCatSettled.value)) {
      vrCatSettled.value.forEach((c: any) => { if (c.categoryId) categoriesMap[c.categoryId] = c; });
    }

    const vrData: any = vrRacesSettled.status === 'fulfilled' ? vrRacesSettled.value : null;
    const rawRaces = Array.isArray(vrData) ? vrData : (vrData?.races || vrData?.data || []);
    const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

    const ALLOWED_VR_IDS = new Set([
      'fn',
      'f2-arg',
      'f3-metro',
      'tc2000',
      'tc',
      'tcp',
      'tcm',
      'tn3',
      'tnbr',
      'tn2',
      'caa',
      'tp3',
      'tp2',
      'tp1',
      'tcarretera2000',
      'toprace',
      'tcpk'
    ]);

    const ALLOWED_VR_NAMES = new Set([
      'formulanacionalargentina',
      'formulanacional',
      'fna',
      'formula2argentina',
      'formula2arg',
      'f2argentina',
      'f2arg',
      'f2a',
      'formula3metropolitana',
      'f3metropolitana',
      'f3metro',
      'f3m',
      'tc2000',
      'turismocarretera',
      'tc',
      'tcpista',
      'tcp',
      'tcmouras',
      'tcm',
      'turismonacionalc3',
      'turismonacionalclase3',
      'tnc3',
      'tn3',
      'turismonacionalbrasil',
      'turismonacionalbr',
      'tnbr',
      'turismonacionalc2',
      'turismonacionalclase2',
      'tnc2',
      'tn2',
      'copaabarthargentina',
      'copaabarth',
      'abarth',
      'caa',
      'turismopistac3',
      'turismopistaclase3',
      'tpc3',
      'tp3',
      'turismopistac2',
      'turismopistaclase2',
      'tpc2',
      'tp2',
      'turismopistac1',
      'turismopistaclase1',
      'tpc1',
      'tp1',
      'turismocarretera2000',
      'tc2k',
      'toprace',
      'topracev6',
      'trv6',
      'tcpickup',
      'tcpk'
    ]);

    const DISALLOWED_VR_IDS = new Set([
      'f1', 'f2', 'f3', 'f4brasil', 'f4cez', 'f4-spain', 'f4-italian', 'formulae', 'freca',
      'gb3', 'gb4', 'gtwce', 'hfc', 'imsa', 'isleofman', 'indycar', 'indylights', 'moto2', 'moto3',
      'motogp', 'nascarxfinity', 'nascartruck', 'nascarcup', 'nls', 'nascarmex', 'nascarbr',
      'pm1s', 'roc', 'superformula', 'supergt', 'sr', 'stockcarbrazil', 'stocklightbrazil',
      'supercars', 'tcrsa', 'tcrwt', 'wc2026', 'wec', 'wrc', 'wsbk', '24hn', 'alms', 'btcc', 'dtm', 'dakar', 'eurocup3'
    ]);

    const isAllowedVR = (race: any) => {
      const catId = (race.categoryId || '').toLowerCase().trim();
      if (ALLOWED_VR_IDS.has(catId)) return true;
      if (DISALLOWED_VR_IDS.has(catId)) return false;
      const norm = (s: string) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
      const c = norm(race.category);
      const cs = norm(race.categoryShort);
      return ALLOWED_VR_NAMES.has(c) || ALLOWED_VR_NAMES.has(cs);
    };

    const processedRaces: any[] = [];
    for (const race of rawRaces) {
      if (!isAllowedVR(race)) {
        continue;
      }
      const catInfo = categoriesMap[race.categoryId] || {};
      let validSchedules = (race.schedules || []).map((s: any) => {
        const ts = s.startAt || s.start || race.start || race.startAt;
        if (!ts || isNaN(new Date(ts).getTime())) return null;
        const d = new Date(ts);
        const dayStr = `${dayNames[d.getDay()]}. ${d.getDate()}`;
        const rawTime = d.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'America/Argentina/Buenos_Aires'
        });
        const isTimeUnconfirmed = s.confirmed === false || s.time === '--:--' || s.time === '-' || s.time === '';
        return {
          id: s._id || s.id || Math.random().toString(),
          name: s.name || s.title || 'Sesión',
          time: isTimeUnconfirmed ? `${dayStr}, --:--` : `${dayStr}, ${rawTime}`,
          rawTime: isTimeUnconfirmed ? '--:--' : rawTime,
          startAt: d.getTime(),
          confirmed: !isTimeUnconfirmed
        };
      }).filter(Boolean);

      if (validSchedules.length === 0 && (race.start || race.startAt)) {
        const ts = race.start || race.startAt;
        const d = new Date(ts);
        const dayStr = `${dayNames[d.getDay()]}. ${d.getDate()}`;
        validSchedules.push({
          id: race._id || race.id || Math.random().toString(),
          name: race.completeName || race.name || 'Carrera',
          time: `${dayStr}, --:--`,
          rawTime: '--:--',
          startAt: d.getTime(),
          confirmed: false
        });
      }

      if (validSchedules.length === 0) continue;
      validSchedules.sort((a: any, b: any) => a.startAt - b.startAt);

      const eventName = (race.completeName || race.name || '').replace(/\s*[\u2013\u2014-]+\s*$/, '').trim();
      const circuitName = (race.circuit || '').replace(/\s*[\u2013\u2014-]+\s*$/, '').trim();

      processedRaces.push({
        id: race._id || race.id || '',
        categoryId: race.categoryId || '',
        category: catInfo.category || race.category || '',
        categoryShort: catInfo.categoryShort || race.categoryShort || race.category || '',
        categoryColor: catInfo.categoryColor || race.categoryColor || '#ff3b30',
        categoryImage: catInfo.categoryImage || race.categoryImage || (race.categoryId ? `https://api.vueltarapida.com/logos/${race.categoryId}.png` : ''),
        event: eventName,
        circuit: circuitName,
        circuitId: race.circuitId || '',
        earliestSession: validSchedules[0].startAt,
        schedules: validSchedules,
        time: validSchedules[0].time || '--:--',
        platforms: (race.links || []).filter((l: any) => l.displayName || l.platform || l.name).map((l: any) => l.displayName || l.platform || l.name || ''),
        watchLinks: (race.links || []).filter((l: any) => l.link || l.url).map((l: any) => ({
          platform: l.displayName || l.platform || l.name || 'Ver',
          url: l.link || l.url || ''
        }))
      });
    }

    // Merge in The Racing Line events
    const trlEvents = trlSettled.status === 'fulfilled' && Array.isArray(trlSettled.value) ? trlSettled.value : [];
    for (const trl of trlEvents) {
      const trlCat = (trl.category || '').toLowerCase();
      const trlEventName = (trl.event || '').toLowerCase();

      // Find match in processedRaces
      const existing = processedRaces.find(r => {
        const rCat = (r.category || '').toLowerCase();
        const rShort = (r.categoryShort || '').toLowerCase();
        const rEvent = (r.event || '').toLowerCase();
        const catMatch = rCat === trlCat || rShort === (trl.categoryShort || '').toLowerCase() || rCat.includes(trlCat) || trlCat.includes(rCat);
        const eventMatch = rEvent === trlEventName || rEvent.includes(trlEventName) || trlEventName.includes(rEvent);
        return catMatch && eventMatch;
      });

      if (existing) {
        // If TRL has more or equal schedules, merge them
        if (trl.schedules.length >= existing.schedules.length) {
          existing.schedules = trl.schedules;
          existing.earliestSession = trl.earliestSession;
        }
        if (!existing.circuit && trl.circuit) {
          existing.circuit = trl.circuit;
        }
      } else {
        processedRaces.push(trl);
      }
    }

    // Deduplicate identical category + event
    const deduplicatedRaces: any[] = [];
    for (const race of processedRaces) {
      const key = `${race.category}::${race.event}`.toLowerCase();
      const existing = deduplicatedRaces.find(r => `${r.category}::${r.event}`.toLowerCase() === key);
      if (existing) {
        if (race.schedules.length > existing.schedules.length) {
          existing.schedules = race.schedules;
        }
        if (race.watchLinks.length > 0 && existing.watchLinks.length === 0) {
          existing.watchLinks = race.watchLinks;
          existing.platforms = race.platforms;
        }
      } else {
        deduplicatedRaces.push(race);
      }
    }

    deduplicatedRaces.sort((a, b) => a.earliestSession - b.earliestSession);

    // Group by category
    const categoriesGrouped: Record<string, any> = {};
    for (const race of deduplicatedRaces) {
      const catName = race.category || 'Otras';
      if (!categoriesGrouped[catName]) {
        categoriesGrouped[catName] = {
          category: catName,
          categoryShort: race.categoryShort,
          categoryColor: race.categoryColor,
          events: []
        };
      }
      categoriesGrouped[catName].events.push({
        id: race.id,
        event: race.event,
        circuit: race.circuit,
        schedules: race.schedules,
        platforms: race.platforms,
        watchLinks: race.watchLinks
      });
    }

    const output = {
      status: 'success',
      sources: ['vueltarapida', 'theracingline'],
      week_range: {
        from: monday.toLocaleDateString('es-AR'),
        to: sunday.toLocaleDateString('es-AR')
      },
      total_categories: Object.keys(categoriesGrouped).length,
      total_events: deduplicatedRaces.length,
      categories: Object.values(categoriesGrouped),
      data: deduplicatedRaces
    };

    setCached('weekly', output);
    return output;
  } catch (err) {
    console.error('getWeeklyCalendar error:', err);
    return { status: 'error', data: [], categories: [] };
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawPath = (req.url || '/api').split('?')[0];
  const parts = rawPath.replace(/^\/+/, '').split('/').filter(Boolean);
  // parts[0] = 'api', parts[1] = category, parts[2] = type
  const category = (parts[1] || '').toLowerCase();
  const type = (parts[2] || '').toLowerCase();

  const sendJson = (statusCode: number, payload: any) => {
    return res.status(statusCode).send(JSON.stringify(payload, null, 2));
  };

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
      return sendJson(200, {
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
      const weeklyData = await getWeeklyCalendar();
      return sendJson(200, weeklyData);
    }

    // ── /api/sync-status ───────────────────────────────────────────────────────
    if (category === 'sync-status' || (category === 'sync-trl' && req.method === 'GET')) {
      const syncInfo = getSyncStatus();
      return sendJson(200, {
        status: 'success',
        ...syncInfo
      });
    }

    // ── /api/sync-trl ──────────────────────────────────────────────────────────
    if (category === 'sync-trl' || category === 'sync-token') {
      let newCookie = '';
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          newCookie = parsed.cookie || '';
        } catch {
          newCookie = req.body;
        }
      } else if (req.body && typeof req.body === 'object') {
        newCookie = req.body.cookie || '';
      }
      if (!newCookie) {
        newCookie = (req.query?.cookie as string) || '';
      }
      newCookie = newCookie.trim();
      if (newCookie) {
        setDynamicCookie(newCookie);
        setCached('weekly', null as any);
        return sendJson(200, { status: 'success', message: 'The Racing Line token updated successfully' });
      }
      return sendJson(400, { status: 'error', message: 'No cookie provided' });
    }

    // ── /api/racingline ────────────────────────────────────────────────────────
    if (category === 'racingline') {
      const trlData = await getTheRacingLineCalendar();
      return sendJson(200, {
        status: 'success',
        source: 'theracingline.app',
        total_events: trlData.length,
        data: trlData
      });
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
        return sendJson(200, { category: 'F1', results_url: CATEGORY_RESULTS_URLS['F1'] });
      }
      // Full F1 dump
      const [calendar, standings, news] = await Promise.all([
        getF1Calendar(),
        getF1Standings(),
        scrapeNews('F1'),
      ]);
      return sendJson(200, {
        category: 'Formula 1',
        results_url: CATEGORY_RESULTS_URLS['F1'],
        news_source: CATEGORY_NEWS_URLS['F1']?.url,
        calendar,
        standings,
        news: news.slice(0, 10),
      });
    }

    // ── /api/<category>/news ───────────────────────────────────────────────────
    if (type === 'news') {
      const articles = await scrapeNews(catKey);
      return sendJson(200, {
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
      return sendJson(200, {
        category: catKey,
        data: data.length > 0 ? data : null,
        source_url: CATEGORY_STANDINGS_URLS[catKey] || null,
      });
    }

    // ── /api/<category>/calendar ───────────────────────────────────────────────
    if (type === 'calendar') {
      const data = await scrapeCalendar(catKey);
      return sendJson(200, {
        category: catKey,
        data: data.length > 0 ? data : null,
        source_url: CATEGORY_CALENDAR_SOURCES[catKey] || null,
      });
    }

    // ── /api/<category>/results ────────────────────────────────────────────────
    if (type === 'results') {
      return sendJson(200, {
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
    
    return sendJson(200, {
      category: catKey,
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

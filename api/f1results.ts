import type { VercelRequest, VercelResponse } from '@vercel/node';

const SGAI_APIKEY = process.env.SGAI_APIKEY || '';

// Cache in memory (lives as long as the serverless instance is warm)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

interface RaceResult {
  pos: string;
  no: string;
  driver: string;
  team: string;
  laps: string;
  time: string;
  pts: string;
}

interface RaceEntry {
  round: string;
  name: string;
  circuit: string;
  date: string;
  winner?: string;
  winnerTeam?: string;
  results?: RaceResult[];
}

interface ScrapeResponse {
  races?: RaceEntry[];
  results?: RaceResult[];
  [key: string]: any;
}

async function scrape(url: string, prompt: string): Promise<ScrapeResponse> {
  const response = await fetch('https://v2-api.scrapegraphai.com/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SGAI-APIKEY': SGAI_APIKEY,
    },
    body: JSON.stringify({ url, prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ScrapeGraphAI error ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  // SGAI returns { result: {...} } or { data: {...} }
  return (json.result ?? json.data ?? json) as ScrapeResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { type, raceUrl } = req.query;

  try {
    if (type === 'list' || !type) {
      // ---- Fetch season race list ----
      const cacheKey = 'f1-results-list-2026';
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return res.status(200).json(cached.data);
      }

      const data = await scrape(
        'https://www.formula1.com/en/results.html/2026/races.html',
        `Extract the main F1 race results table from this page.
The table contains the list of Grand Prix held in the 2026 season.
For each race row, extract:
- round: the round number (from the first column)
- name: the Grand Prix name (e.g. "Bahrain")
- date: the race date
- winner: the winning driver's name
- car: the winning team/car
- laps: number of laps
- time: the winning time
Return a JSON object with a "races" array.`
      );

      // Robust extraction: find the first array in the response if races/results are missing
      let rawRaces = data.races || data.results || data.data || [];
      if (!Array.isArray(rawRaces)) {
        const anyArray = Object.values(data).find(v => Array.isArray(v));
        if (anyArray) rawRaces = anyArray;
      }

      // Normalize
      const result = {
        races: (rawRaces as any[]).map((r: any, i: number) => ({
          round: r.round ?? String(i + 1),
          name: r.name ?? r.grand_prix ?? r.race ?? r.gp ?? '',
          circuit: r.circuit ?? r.location ?? r.country ?? '',
          date: r.date ?? '',
          winner: r.winner ?? r.driver ?? '',
          winnerTeam: r.winnerTeam ?? r.car ?? r.team ?? r.constructor ?? '',
          resultsUrl: r.resultsUrl ?? r.url ?? null,
        })),
      };

      cache.set(cacheKey, { data: result, ts: Date.now() });
      return res.status(200).json(result);

    } else if (type === 'race' && typeof raceUrl === 'string' && raceUrl) {
      // ---- Fetch specific race result ----
      const decodedUrl = decodeURIComponent(raceUrl);
      const cacheKey = `f1-race-${decodedUrl}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return res.status(200).json(cached.data);
      }

      const data = await scrape(
        decodedUrl,
        `Extract the full race results classification table from this F1 page.
For each driver in the standings, include:
- pos: position (1, 2, 3, etc.)
- no: car number
- driver: full name
- team: team/constructor
- laps: laps completed
- time: total time or gap
- pts: points scored
Return a JSON object with a "results" array.`
      );

      let rawResults = data.results || data.races || data.data || [];
      if (!Array.isArray(rawResults)) {
        const anyArray = Object.values(data).find(v => Array.isArray(v));
        if (anyArray) rawResults = anyArray;
      }

      const result = {
        results: (rawResults as any[]).map((r: any) => ({
          pos: r.pos ?? r.position ?? '',
          no: r.no ?? r.number ?? r.car_no ?? '',
          driver: r.driver ?? r.name ?? r.pilot ?? '',
          team: r.team ?? r.constructor ?? r.car ?? '',
          laps: r.laps ?? '',
          time: r.time ?? r.gap ?? '',
          pts: r.pts ?? r.points ?? '',
        })),
      };

      cache.set(cacheKey, { data: result, ts: Date.now() });
      return res.status(200).json(result);

    } else {
      return res.status(400).json({ error: 'Invalid query parameters. Use ?type=list or ?type=race&raceUrl=...' });
    }
  } catch (err: any) {
    console.error('[f1results]', err);
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
}

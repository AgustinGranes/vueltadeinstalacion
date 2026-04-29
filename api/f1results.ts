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
        'https://www.formula1.com/en/results/2026/races',
        `Extract a list of all Formula 1 races from the results table on this page.
For each race include:
- round: the round number (e.g. "1", "2")
- name: the Grand Prix name (e.g. "Australian Grand Prix")
- circuit: the circuit/country name
- date: the race date as shown
- winner: the winning driver full name (if available)
- winnerTeam: the winning constructor/team (if available)
Return the result as a JSON object: { "races": [ {...}, {...} ] }`
      );

      // Normalize
      const result = {
        races: (data.races || data.results || []).map((r: any, i: number) => ({
          round: r.round ?? String(i + 1),
          name: r.name ?? r.grand_prix ?? r.race ?? '',
          circuit: r.circuit ?? r.country ?? '',
          date: r.date ?? '',
          winner: r.winner ?? r.winning_driver ?? '',
          winnerTeam: r.winnerTeam ?? r.winning_team ?? r.constructor ?? '',
          resultsUrl: r.url ?? null,
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
        `Extract the race results table from this Formula 1 race result page.
For each driver row include:
- pos: finishing position (e.g. "1", "2", "DNF")
- no: car number
- driver: full driver name
- team: constructor/team name
- laps: number of laps completed
- time: time or gap to leader (e.g. "+5.234s" or "1:30:12.456")
- pts: championship points awarded
Return as JSON: { "results": [ {...}, {...} ] }`
      );

      const result = {
        results: (data.results || data.races || []).map((r: any) => ({
          pos: r.pos ?? r.position ?? '',
          no: r.no ?? r.number ?? r.car ?? '',
          driver: r.driver ?? r.name ?? '',
          team: r.team ?? r.constructor ?? r.car_name ?? '',
          laps: r.laps ?? '',
          time: r.time ?? r.gap ?? r.time_gap ?? '',
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

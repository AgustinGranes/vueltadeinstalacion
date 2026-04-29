import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Cache in memory
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour (Gemini data changes less often than a live scrape)

async function callGemini(prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Enable grounding to get latest 2026 F1 data
      tools: [{ google_search_retrieval: {} }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content returned from Gemini');
  
  return JSON.parse(text);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, raceUrl, name } = req.query;

  try {
    if (type === 'list' || !type) {
      const cacheKey = 'f1-list-gemini-2026';
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return res.status(200).json(cached.data);

      const prompt = `Actúa como un experto en Formula 1. Estamos en la temporada 2026. 
Proporciona una lista detallada de todos los Grandes Premios de F1 que se han disputado hasta la fecha hoy (Abril 2026).
Para cada carrera necesito:
- round: número de ronda
- name: nombre oficial del Gran Premio
- circuit: nombre del circuito y país
- date: fecha en que se corrió
- winner: nombre completo del piloto ganador
- winnerTeam: nombre de la escudería ganadora
- resultsUrl: genera un link descriptivo a la página de resultados oficial (o usa uno real si lo conoces)

IMPORTANTE: Devuelve la información exclusivamente en formato JSON con esta estructura:
{
  "races": [
    { "round": "1", "name": "...", "circuit": "...", "date": "...", "winner": "...", "winnerTeam": "...", "resultsUrl": "..." },
    ...
  ]
}`;

      const data = await callGemini(prompt);
      cache.set(cacheKey, { data, ts: Date.now() });
      return res.status(200).json(data);

    } else if (type === 'race') {
      const raceName = name || 'última carrera';
      const cacheKey = `f1-race-gemini-${raceName}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return res.status(200).json(cached.data);

      const prompt = `Proporciona la clasificación final completa y detallada del ${raceName} de Formula 1 de 2026.
Necesito una lista extensa con absolutamente todos los parámetros y estadísticas disponibles para cada piloto que participó:
- pos: posición final (1, 2, 3... o DNF/DNS)
- no: número del monoplaza
- driver: nombre completo del piloto
- team: nombre de la escudería
- laps: vueltas completadas
- time: tiempo total o diferencia con el líder
- pts: puntos obtenidos en este evento
- extra: incluye si hizo la vuelta rápida o algún dato relevante (opcional)

IMPORTANTE: Devuelve la información exclusivamente en formato JSON con esta estructura:
{
  "results": [
    { "pos": "1", "no": "...", "driver": "...", "team": "...", "laps": "...", "time": "...", "pts": "..." },
    ...
  ]
}`;

      const data = await callGemini(prompt);
      cache.set(cacheKey, { data, ts: Date.now() });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Invalid type' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

// Service to fetch and parse sessions from The Racing Line (theracingline.app)

export interface TRLSession {
  id: number | string;
  eventId: number | string;
  eventName: string;
  sessionName: string;
  sessionType: string;
  date: string; // ISO string
  durationMinutes?: number;
  circuit?: {
    name: string;
    layout?: string;
    country?: string;
    emoji?: string;
  };
  series?: {
    id: string;
    name: string;
    shortName: string;
    category?: string;
    color?: number[];
  };
  localDate?: string;
}

export interface StandardRaceEvent {
  id: string;
  category: string;
  categoryShort: string;
  categoryColor: string;
  event: string;
  circuit: string;
  circuitId?: string;
  earliestSession: number;
  schedules: {
    id: string;
    name: string;
    time: string;
    rawTime: string;
    startAt: number;
    confirmed: boolean;
  }[];
  platforms: string[];
  watchLinks: { platform: string; url: string }[];
}

const DEFAULT_COOKIE = 'trl_consent=all; trl_regime=UNKNOWN; trl_gpc=1; sb-auth-auth-token.0=base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWpZeU5qWXhNakU0TFdKaVpXUXRORFJqT1MxaU1UZ3lMVEZtTmpOaFlUUXlNalEyTWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFlXd2lPaUpoWVd3eElpd2lZVzF5SWpwYmV5SnRaWFJvYjJRaU9pSnZZWFYwYUNJc0luUnBiV1Z6ZEdGdGNDSTZNVGM0T0RFME5qQXdNbjFkTENKaGNIQmZiV1YwWVdSaGRHRWlPbnNpY0hKdmRtbGtaWElpT2lKbmIyOW5iR1VpTENKd2NtOTJhV1JsY25NaU9sc2laMjl2WjJ4bElsMTlMQ0poZFdRaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVpXMWhhV3dpT2lKaFozVnpkR2x1WjNKaGJtVnpRR2R0WVdsc0xtTnZiU0lzSW1WNGNDSTZNVGM0T0RJNE56STNNU3dpYVdGMElqb3hOemc0TWpnek5qY3hMQ0pwYzE5aGJtOXVlVzF2ZFhNaU9tWmhiSE5sTENKcGMzTWlPaUpvZEhSd2N6b3ZMMkprZVc5bGRHRm1aRzl2YVdwM2NHOXFaR3AxTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSndhRzl1WlNJNklpSXNJbkp2YkdVaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aWMyVnpjMmx2Ymw5cFpDSTZJamxrTm1Jd1lUZ3hMVGMwTkRjdE5HUTNPUzA0WlRGaUxUYzRNRE0wTnpkbE9UZ3pPU0lzSW5OMVlpSTZJbUZqWWpVeVlqUTJMVFEwTVdZdE5EbGpOQzA1WlRNd0xUTXhOekpqTWpVM056azROaUlzSW5WelpYSmZiV1YwWVdSaGRHRWlPbnNpWVhaaGRHRnlYM1Z5YkNJNkltaDBkSEJ6T2k4dmJHZ3pMbWR2YjJkc1pYVnpaWEpqYjI1MFpXNTBMbU52YlM5aEwwRkRaemh2WTBsNFFWTmlTVWhDZEVwSmJIbHBRVjkyTm5CMmVWQkpNbEp2UlZSTFYzSk5Vek5LUzBNM1ZFNHdTMDFNY0RKQ2MzTkhQWE01Tmkxaklpd2laVzFoYVd3aU9pSmhaM1Z6ZEdsdVozSmhibVZ6UUdkdFlXbHNMbU52YlNJc0ltVnRZV2xzWDNabGNtbG1hV1ZrSWpwMGNuVmxMQ0psZG1WdWRITmZiM0IwWDJsdUlqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkJaM1Z6ZEdsdUlFZHlZVzVsY3lJc0ltbHpjeUk2SW1oMGRIQnpPaTh2WVdOamIzVnVkSE11WjI5dloyeGxMbU52YlNJc0ltMWhjbXRsZEdsdVoxOXZjSFJmYVc0aU9uUnlkV1VzSW01aGJXVWlPaUpCWjNWemRHbHVJRWR5WVc1bGN5SXNJbkJvYjI1bFgzWmxjbWxtYVdWa0lqcG1ZV3h6WlN3aWNHbGpkSFZ5WlNJNkltaDBkSEJ6T2k4dmJHZ3pMbWR2YjJkc1pYVnpaWEpqYjI1MFpXNTBMbU52YlM5aEwwRkRaemh2WTBsNFFWTmlTVWhDZEVwSmJIbHBRVjkyTm5CMmVWQkpNbEp2UlZSTFYzSk5Vek5LUzBNM1ZFNHdTMDFNY0RKQ2MzTkhQWE01Tmkxaklpd2ljSEp2ZG1sa1pYSmZhV1FpT2lJeE1UWTFPRFV3TWpBeU5qWXpORFk0TkRZd09ERWlMQ0p6YVdkdWRYQmZjR3hoZEdadmNtMGlPaUpwYjNNaUxDSnpkV0lpT2lJeE1UWTFPRFV3TWpBeU5qWXpORFk0TkRZd09ERWlMQ0owWlhKdGMxOWhZMk5sY0hSbFpDSTZkSEoxWlgwc0luVnpaWEpmY205c1pTSTZJbUZtWm1sc2FXRjBaU0o5Lm5ScFlCSGN4WjNDdkNLcGdtWXhYQWMxVTJlV2U5T3BCRzZuN3lmMWU2dEoyYWRkS3E3MmpVbE93bEprMnZqdXZDR2ZvRzFkb3pOelk5RDc4c2FzdEVnIiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODgyODcyNzEsInJlZnJlc2hfdG9rZW4iOiJteTRnajNha3JuM2QiLCJ1c2VyIjp7ImlkIjoiYWNiNTJiNDYtNDQxZi00OWM0LTllMzAtMzE3MmMyNTc3OTg2IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJhZ3VzdGluZ3JhbmVzQGdtYWlsLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDctMTlUMTg6NDM6NTguMTg3NjgxWiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wNy0xOVQxODo0Mzo1OC4xODc2ODFaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOC0zMVQwMzoxMzoyMi4wMDE4MDFaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhBU2JJSEJ0SklseWlBX3Y2cHZ5UEkyUm9FVEtXck1TM0pLQzdUTjBLTUxwMkJzc0c9czk2LWMiLCJlbWFpbCI6ImFndXN0aW5ncmFuZXNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImV2ZW50c19vcHRfaW4iOnRydWUsImZ1bGxfbmFtZSI6IkFndXN0aW4gR3JhbmVzIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibWFya2V0aW5nX29wdF9pbiI6dHJ1ZSwibmFtZSI6IkFndXN0aW4gR3JhbmVzIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvb; sb-auth-auth-token.1=nRlbnQuY29tL2EvQUNnOG9jSXhBU2JJSEJ0SklseWlBX3Y2cHZ5UEkyUm9FVEtXck1TM0pLQzdUTjBLTUxwMkJzc0c9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNjU4NTAyMDI2NjM0Njg0NjA4MSIsInNpZ251cF9wbGF0Zm9ybSI6ImlvcyIsInN1YiI6IjExNjU4NTAyMDI2NjM0Njg0NjA4MSIsInRlcm1zX2FjY2VwdGVkIjp0cnVlfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI0ODZhN2I0ZC1mZmQ5LTQ3YWItOThiZS1hYjE2ODQ1NjdhZjUiLCJpZCI6IjExNjU4NTAyMDI2NjM0Njg0NjA4MSIsInVzZXJfaWQiOiJhY2I1MmI0Ni00NDFmLTQ5YzQtOWUzMC0zMTcyYzI1Nzc5ODYiLCJpZGVudGl0eV9kYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJeEFTYklIQnRKSWx5aUFfdjZwdnlQSTJSb0VUS1dyTVMzSktDN1ROMEtNTHAyQnNzRz1zOTYtYyIsImVtYWlsIjoiYWd1c3RpbmdyYW5lc0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiQWd1c3RpbiBHcmFuZXMiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiQWd1c3RpbiBHcmFuZXMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJeEFTYklIQnRKSWx5aUFfdjZwdnlQSTJSb0VUS1dyTVMzSktDN1ROMEtNTHAyQnNzRz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE2NTg1MDIwMjY2MzQ2ODQ2MDgxIiwic3ViIjoiMTE2NTg1MDIwMjY2MzQ2ODQ2MDgxIn0sInByb3ZpZGVyIjoiZ29vZ2xlIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wNy0xOVQxODo0Mzo1OC4xNjkyNTNaIiwiY3JlYXRlZF9hdCI6IjIwMjYtMDctMTlUMTg6NDM6NTguMTY5MzI4WiIsInVwZGF0ZWRfYXQiOiIyMDI2LTA4LTMxVDAzOjEzOjIxLjY2MTI0MloiLCJlbWFpbCI6ImFndXN0aW5ncmFuZXNAZ21haWwuY29tIn1dLCJjcmVhdGVkX2F0IjoiMjAyNi0wNy0xOVQxODo0Mzo1OC4wNDA0OTJaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMDFUMTc6Mjc6NTAuODY3NTIxWiIsImlzX2Fub255bW91cyI6ZmFsc2V9fQ';

let trlCache: { data: TRLSession[]; timestamp: number } | null = null;
const TRL_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export async function fetchTheRacingLineSessions(): Promise<TRLSession[]> {
  const now = Date.now();
  if (trlCache && (now - trlCache.timestamp < TRL_CACHE_TTL) && trlCache.data.length > 0) {
    return trlCache.data;
  }

  const cookie = process.env.TRL_COOKIE || DEFAULT_COOKIE;

  const res = await fetch('https://theracingline.app/home', {
    headers: {
      'cookie': cookie,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`TheRacingLine fetch failed with status ${res.status}`);
  }

  const html = await res.text();

  // Extract all RSC payload chunks from self.__next_f.push
  const rscLines: string[] = [];
  const pushRegex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = pushRegex.exec(html)) !== null) {
    try {
      rscLines.push(JSON.parse('"' + m[1] + '"'));
    } catch {
      rscLines.push(m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    }
  }

  const fullPayload = rscLines.join('\n');
  const sessionBlocks: TRLSession[] = [];
  let cursor = 0;

  while (true) {
    const startIdx = fullPayload.indexOf('{"id":', cursor);
    if (startIdx === -1) break;

    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = startIdx; i < fullPayload.length && i < startIdx + 4000; i++) {
      const ch = fullPayload[i];
      if (inString) {
        if (escape) escape = false;
        else if (ch === '\\') escape = true;
        else if (ch === '"') inString = false;
      } else {
        if (ch === '"') inString = true;
        else if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      const rawChunk = fullPayload.slice(startIdx, endIdx);
      try {
        const obj = JSON.parse(rawChunk);
        if (obj && obj.id && obj.eventName && obj.sessionName && obj.series && obj.series.name) {
          sessionBlocks.push(obj);
        }
      } catch {}
      cursor = endIdx;
    } else {
      cursor = startIdx + 6;
    }
  }

  if (sessionBlocks.length > 0) {
    trlCache = { data: sessionBlocks, timestamp: now };
  }

  return sessionBlocks;
}

/**
 * Normalizes and maps The Racing Line sessions into our app's StandardRaceEvent format
 */
export async function getTheRacingLineCalendar(options?: { minDate?: number; maxDate?: number }): Promise<StandardRaceEvent[]> {
  const sessions = await fetchTheRacingLineSessions();
  const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  const now = Date.now();
  const defaultMin = options?.minDate ?? (now - 24 * 60 * 60 * 1000); // from yesterday
  const defaultMax = options?.maxDate ?? (now + 14 * 24 * 60 * 60 * 1000); // up to 2 weeks ahead

  // Filter sessions in range and valid
  const filteredSessions = sessions.filter(s => {
    if (!s.date) return false;
    const ts = new Date(s.date).getTime();
    if (isNaN(ts)) return false;
    return ts >= defaultMin && ts <= defaultMax;
  });

  // Group sessions by Category + Event
  const eventMap = new Map<string, StandardRaceEvent>();

  for (const s of filteredSessions) {
    const seriesName = (s.series?.name || 'Motorsport').trim();
    const seriesShort = (s.series?.shortName || seriesName).trim();
    const eventName = (s.eventName || seriesName).replace(/\s*[–—-]+\s*$/, '').trim();
    const circuitName = (s.circuit?.name || '').trim();
    const cleanCircuit = circuitName || 'TBA';

    // Color conversion
    let color = '#ff3b30';
    if (s.series?.color && Array.isArray(s.series.color) && s.series.color.length >= 3) {
      const [r, g, b] = s.series.color;
      color = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    const key = `${seriesName}::${eventName}`.toLowerCase();
    const d = new Date(s.date);
    const startAt = d.getTime();
    const dayStr = `${dayNames[d.getDay()]}. ${d.getDate()}`;
    const rawTime = d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires',
    });

    const schedItem = {
      id: String(s.id),
      name: s.sessionName || 'Sesión',
      time: `${dayStr}, ${rawTime}`,
      rawTime,
      startAt,
      confirmed: true,
    };

    if (!eventMap.has(key)) {
      eventMap.set(key, {
        id: `trl-${s.eventId || s.id}`,
        category: seriesName,
        categoryShort: seriesShort,
        categoryColor: color,
        event: eventName,
        circuit: cleanCircuit,
        circuitId: s.circuit?.name ? s.circuit.name.toLowerCase().replace(/\s+/g, '_') : '',
        earliestSession: startAt,
        schedules: [schedItem],
        platforms: [],
        watchLinks: [],
      });
    } else {
      const existing = eventMap.get(key)!;
      existing.schedules.push(schedItem);
      if (startAt < existing.earliestSession) {
        existing.earliestSession = startAt;
      }
    }
  }

  const result = Array.from(eventMap.values());

  // Sort sessions within each event chronologically
  for (const ev of result) {
    ev.schedules.sort((a, b) => a.startAt - b.startAt);
  }

  // Sort events chronologically by their earliest session
  result.sort((a, b) => a.earliestSession - b.earliestSession);

  return result;
}

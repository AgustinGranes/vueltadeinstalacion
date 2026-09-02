// Service to fetch and parse sessions from The Racing Line (theracingline.app)

import fs from 'fs';
import path from 'path';

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
  circuitOffsetMin?: number;
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

const DEFAULT_COOKIE = 'trl_regime=UNKNOWN; trl_consent=all; trl_aid=0e45db43-75f0-435d-a8e9-fa11fa040042; sb-auth-auth-token.0=base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWpZeU5qWXhNakU0TFdKaVpXUXRORFJqT1MxaU1UZ3lMVEZtTmpOaFlUUXlNalEyTWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFlXd2lPaUpoWVd3eElpd2lZVzF5SWpwYmV5SnRaWFJvYjJRaU9pSnZZWFYwYUNJc0luUnBiV1Z6ZEdGdGNDSTZNVGM0T0RNd05ESXpNWDFkTENKaGNIQmZiV1YwWVdSaGRHRWlPbnNpY0hKdmRtbGtaWElpT2lKbmIyOW5iR1VpTENKd2NtOTJhV1JsY25NaU9sc2laMjl2WjJ4bElsMTlMQ0poZFdRaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVpXMWhhV3dpT2lKaFozVnpkR2x1WjNKaGJtVnpRR2R0WVdsc0xtTnZiU0lzSW1WNGNDSTZNVGM0T0RNd056Z3pNU3dpYVdGMElqb3hOemc0TXpBME1qTXhMQ0pwYzE5aGJtOXVlVzF2ZFhNaU9tWmhiSE5sTENKcGMzTWlPaUpvZEhSd2N6b3ZMMkprZVc5bGRHRm1aRzl2YVdwM2NHOXFaR3AxTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSndhRzl1WlNJNklpSXNJbkp2YkdVaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aWMyVnpjMmx2Ymw5cFpDSTZJamN3TUdaa09HWTJMVFU1WmpVdE5HUmhPUzA1TnpReUxUTTROalZoTVRFME5EZ3hPQ0lzSW5OMVlpSTZJbUZqWWpVeVlqUTJMVFEwTVdZdE5EbGpOQzA1WlRNd0xUTXhOekpqTWpVM056azROaUlzSW5WelpYSmZiV1YwWVdSaGRHRWlPbnNpWVhaaGRHRnlYM1Z5YkNJNkltaDBkSEJ6T2k4dmJHZ3pMbWR2YjJkc1pYVnpaWEpqYjI1MFpXNTBMbU52YlM5aEwwRkRaemh2WTBsNFFWTmlTVWhDZEVwSmJIbHBRVjkyTm5CMmVWQkpNbEp2UlZSTFYzSk5Vek5LUzBNM1ZFNHdTMDFNY0RKQ2MzTkhQWE01Tmkxaklpd2laVzFoYVd3aU9pSmhaM1Z6ZEdsdVozSmhibVZ6UUdkdFlXbHNMbU52YlNJc0ltVnRZV2xzWDNabGNtbG1hV1ZrSWpwMGNuVmxMQ0psZG1WdWRITmZiM0IwWDJsdUlqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkJaM1Z6ZEdsdUlFZHlZVzVsY3lJc0ltbHpjeUk2SW1oMGRIQnpPaTh2WVdOamIzVnVkSE11WjI5dloyeGxMbU52YlNJc0ltMWhjbXRsZEdsdVoxOXZjSFJmYVc0aU9uUnlkV1VzSW01aGJXVWlPaUpCWjNWemRHbHVJRWR5WVc1bGN5SXNJbkJvYjI1bFgzWmxjbWxtYVdWa0lqcG1ZV3h6WlN3aWNHbGpkSFZ5WlNJNkltaDBkSEJ6T2k4dmJHZ3pMbWR2YjJkc1pYVnpaWEpqYjI1MFpXNTBMbU52YlM5aEwwRkRaemh2WTBsNFFWTmlTVWhDZEVwSmJIbHBRVjkyTm5CMmVWQkpNbEp2UlZSTFYzSk5Vek5LUzBNM1ZFNHdTMDFNY0RKQ2MzTkhQWE01Tmkxaklpd2ljSEp2ZG1sa1pYSmZhV1FpT2lJeE1UWTFPRFV3TWpBeU5qWXpORFk0TkRZd09ERWlMQ0p6YVdkdWRYQmZjR3hoZEdadmNtMGlPaUpwYjNNaUxDSnpkV0lpT2lJeE1UWTFPRFV3TWpBeU5qWXpORFk0TkRZd09ERWlMQ0owWlhKdGMxOWhZMk5sY0hSbFpDSTZkSEoxWlgwc0luVnpaWEpmY205c1pTSTZJbUZtWm1sc2FXRjBaU0o5LlJMemZ4Tm04NzRNbDRmWVFsZDktSzNLUEd2YmtwUVItbUcxNE1FdmlFaTFGRDFtaC0ta3FrRllFbERaaVFaRDhBYVlrMjBpR0NOak5jM2tBQnppOE5RIiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODgzMDc4MzEsInJlZnJlc2hfdG9rZW4iOiJjYWRtb2Zmc202ZDYiLCJ1c2VyIjp7ImlkIjoiYWNiNTJiNDYtNDQxZi00OWM0LTllMzAtMzE3MmMyNTc3OTg2IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJhZ3VzdGluZ3JhbmVzQGdtYWlsLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDctMTlUMTg6NDM6NTguMTg3NjgxWiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wNy0xOVQxODo0Mzo1OC4xODc2ODFaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOS0wMVQyMzoxMDozMS41MTI0NjMwNjNaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhBU2JJSEJ0SklseWlBX3Y2cHZ5UEkyUm9FVEtXck1TM0pLQzdUTjBLTUxwMkJzc0c9czk2LWMiLCJlbWFpbCI6ImFndXN0aW5ncmFuZXNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImV2ZW50c19vcHRfaW4iOnRydWUsImZ1bGxfbmFtZSI6IkFndXN0aW4gR3JhbmVzIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibWFya2V0aW5nX29wdF9pbiI6dHJ1ZSwibmFtZSI6IkFndXN0aW4gR3JhbmVzIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlYzt sb-auth-auth-token.1=mNvbnRlbnQuY29tL2EvQUNnOG9jSXhBU2JJSEJ0SklseWlBX3Y2cHZ5UEkyUm9FVEtXck1TM0pLQzdUTjBLTUxwMkJzc0c9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNjU4NTAyMDI2NjM0Njg0NjA4MSIsInNpZ251cF9wbGF0Zm9ybSI6ImlvcyIsInN1YiI6IjExNjU4NTAyMDI2NjM0Njg0NjA4MSIsInRlcm1zX2FjY2VwdGVkIjp0cnVlfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI0ODZhN2I0ZC1mZmQ5LTQ3YWItOThiZS1hYjE2ODQ1NjdhZjUiLCJpZCI6IjExNjU4NTAyMDI2NjM0Njg0NjA4MSIsInVzZXJfaWQiOiJhY2I1MmI0Ni00NDFmLTQ5YzQtOWUzMC0zMTcyYzI1Nzc5ODYiLCJpZGVudGl0eV9kYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJeEFTYklIQnRKSWx5aUFfdjZwdnlQSTJSb0VUS1dyTVMzSktDN1ROMEtNTHAyQnNzRz1zOTYtYyIsImVtYWlsIjoiYWd1c3RpbmdyYW5lc0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiQWd1c3RpbiBHcmFuZXMiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiQWd1c3RpbiBHcmFuZXMiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJeEFTYklIQnRKSWx5aUFfdjZwdnlQSTJSb0VUS1dyTVMzSktDN1ROMEtNTHAyQnNzRz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE2NTg1MDIwMjY2MzQ2ODQ2MDgxIiwic3ViIjoiMTE2NTg1MDIwMjY2MzQ2ODQ2MDgxIn0sInByb3ZpZGVyIjoiZ29vZ2xlIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wNy0xOVQxODo0Mzo1OC4xNjkyNTNaIiwiY3JlYXRlZF9hdCI6IjIwMjYtMDctMTlUMTg6NDM6NTguMTY5MzI4WiIsInVwZGF0ZWRfYXQiOiIyMDI2LTA5LTAxVDIzOjEwOjMxLjIxODg2M1oiLCJlbWFpbCI6ImFndXN0aW5ncmFuZXNAZ21haWwuY29tIn1dLCJjcmVhdGVkX2F0IjoiMjAyNi0wNy0xOVQxODo0Mzo1OC4wNDA0OTJaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMDFUMjM6MTA6MzEuNTE1MjA3WiIsImlzX2Fub255bW91cyI6ZmFsc2V9LCJwcm92aWRlcl90b2tlbiI6InlhMjkuYTBBZE1ENkVqSDh1Q3V6NUhTQnJhaVBGNDk2LUZEekYxT2t0TVhKRkNPTHFfTmwxcVg2eEFHZnRGc00yQnVmTURkYUlnSVpUOXgyRERNcEtvZkM5b1VfWl9BRXFvbk9iczI4N0lvWWVnWTRIYmZwSENLSXBXbVBEczRjLVZlYWdqU2pmc3g1RWdYY3V5LUhmUkN2ODh4MlZqTGE3WEw4eXAzbFExTEpqRDB3WV9kNHhyRndweTZzX3J5SmlHQkVNWGpRLWQxQngyZ0ZOU1VSYVp0dE5MakRZb0RlOWNBX2N3T1lBbDRCV29xUEtLakpFeWJTVTBsZExnS3c1ejBmeGFpQnkyRXExRm1lWmg0NXpCZUp5aG5EUVNDZ3l2V0dBYUNnWUtBUTRTQVJVU0ZRSEdYMk1pTFd4Y0piV0hQdGRhMk9oaXV4ZFZuZzAyOTMifQ';

let trlCache: { data: TRLSession[]; timestamp: number } | null = null;
const TRL_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
let lastKnownGoodSessions: TRLSession[] = [];

try {
  const snapshotPath = path.join(process.cwd(), 'api', 'trl_snapshot.json');
  if (fs.existsSync(snapshotPath)) {
    lastKnownGoodSessions = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  }
} catch (e) {
  console.warn('[TRL] snapshot load warning:', e);
}

let runtimeDynamicCookie: string = '';
let lastSyncTimestamp: number = Date.now();
let lastSyncSource: 'live' | 'cache' | 'snapshot' = 'snapshot';

export function getSyncStatus() {
  return {
    lastSyncTimestamp,
    syncSource: lastSyncSource,
    isLive: lastSyncSource === 'live' || (trlCache !== null && (Date.now() - trlCache.timestamp < 3600 * 1000)),
    totalSessions: (trlCache?.data || lastKnownGoodSessions).length,
    cachedAt: trlCache?.timestamp || lastSyncTimestamp,
  };
}

export function setDynamicCookie(cookie: string) {
  if (cookie && cookie.trim()) {
    runtimeDynamicCookie = cookie.trim();
    trlCache = null;
    lastSyncTimestamp = Date.now();
    lastSyncSource = 'live';
  }
}

export async function fetchTheRacingLineSessions(): Promise<TRLSession[]> {
  const now = Date.now();
  if (trlCache && (now - trlCache.timestamp < TRL_CACHE_TTL) && trlCache.data.length > 0) {
    lastSyncSource = 'cache';
    return trlCache.data;
  }

  try {
    const cookie = runtimeDynamicCookie || process.env.TRL_COOKIE || DEFAULT_COOKIE;

    const res = await fetch('https://theracingline.app/home', {
      headers: {
        'cookie': cookie,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
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

    // Build seriesMap from all definitions present in RSC payload
    const seriesMap = new Map<string, { id: string; name: string; shortName: string; category?: string; color?: number[]; colorLight?: number[] }>();
    const seriesRegex = /\{"id":"([^"]+)","name":"([^"]+)","shortName":"([^"]+)","category":"([^"]+)"(?:,"color":(\[[^\]]+\]))?(?:,"colorLight":(\[[^\]]+\]))?\}/g;
    let sm: RegExpExecArray | null;
    while ((sm = seriesRegex.exec(fullPayload)) !== null) {
      const [_, sId, sName, sShort, sCategory, sColor, sColorLight] = sm;
      seriesMap.set(sId, {
        id: sId,
        name: sName,
        shortName: sShort,
        category: sCategory,
        color: sColor ? JSON.parse(sColor) : undefined,
        colorLight: sColorLight ? JSON.parse(sColorLight) : undefined,
      });
    }

    // Build circuitMap from RSC definitions
    const circuitMap = new Map<string, { name: string; layout?: string; country?: string; emoji?: string }>();
    const circuitRegex = /\{"name":"([^"]+)","layout":"([^"]+)","country":"([^"]+)","emoji":"([^"]+)"\}/g;
    let cm: RegExpExecArray | null;
    while ((cm = circuitRegex.exec(fullPayload)) !== null) {
      const [_, cName, cLayout, cCountry, cEmoji] = cm;
      circuitMap.set(cName.toLowerCase(), {
        name: cName,
        layout: cLayout,
        country: cCountry,
        emoji: cEmoji,
      });
    }

    const sessionBlocks: TRLSession[] = [];
    let cursor = 0;

    while (true) {
      const startIdx = fullPayload.indexOf('{"id":', cursor);
      if (startIdx === -1) break;

      let depth = 0;
      let inString = false;
      let escape = false;
      let endIdx = -1;

      for (let i = startIdx; i < fullPayload.length; i++) {
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
          if (obj && obj.id && obj.date && (obj.eventName || obj.sessionName)) {
            // Resolve series if missing or ref
            if (!obj.series || !obj.series.name) {
              if (obj.series?.id && seriesMap.has(obj.series.id)) {
                obj.series = seriesMap.get(obj.series.id);
              } else if (typeof obj.series === 'string' && seriesMap.has(obj.series)) {
                obj.series = seriesMap.get(obj.series);
              }
            }
            // Resolve circuit
            if (typeof obj.circuit === 'string' && circuitMap.has(obj.circuit.toLowerCase())) {
              obj.circuit = circuitMap.get(obj.circuit.toLowerCase());
            }

            // Exclude honeypots
            const isHoneypot = (obj.series?.id || '').includes('fake') || (obj.series?.id || '') === 'zkf' || (obj.series?.id || '') === 'sfs';
            if (!isHoneypot) {
              sessionBlocks.push(obj);
            }
          }
        } catch {}
        cursor = endIdx;
      } else {
        cursor = startIdx + 6;
      }
    }

    if (sessionBlocks.length > 0) {
      lastKnownGoodSessions = sessionBlocks;
      lastSyncTimestamp = now;
      lastSyncSource = 'live';
      trlCache = { data: sessionBlocks, timestamp: now };

      try {
        const snapshotPath = path.join(process.cwd(), 'api', 'trl_snapshot.json');
        fs.writeFileSync(snapshotPath, JSON.stringify(sessionBlocks, null, 2));
      } catch (e) {
        // snapshot write non-critical
      }

      return sessionBlocks;
    }
  } catch (err) {
    console.warn('[TheRacingLine] fetch error, using lastKnownGoodSessions fallback:', err);
    lastSyncSource = 'snapshot';
  }

  if (lastKnownGoodSessions.length > 0) {
    return lastKnownGoodSessions;
  }

  return [];
}

/**
 * Recovers the exact scheduled track time from The Racing Line's jittered timestamp.
 */
export function recoverExactSchedule(rawDateStr: string, circuitOffsetMin: number = 0, sessionName: string = ''): { cleanIso: string; trackTime: string; localDayStr: string } {
  const d = new Date(rawDateStr);
  if (isNaN(d.getTime())) {
    return { cleanIso: rawDateStr, trackTime: '--:--', localDayStr: '' };
  }

  // Calculate track local wall clock (represented in UTC Date object)
  const localTs = d.getTime() + circuitOffsetMin * 60 * 1000;
  const localD = new Date(localTs);

  const h = localD.getUTCHours();
  const m = localD.getUTCMinutes();
  const rawMins = h * 60 + m;

  const sLower = (sessionName || '').toLowerCase();

  // If already exactly on a standard slot, preserve it
  if (m === 0 || m === 15 || m === 30 || m === 45) {
    const trackTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const localDayStr = `${dayNames[localD.getUTCDay()]}. ${localD.getUTCDate()}`;
    return { cleanIso: rawDateStr, trackTime, localDayStr };
  }

  // Known specific session offsets
  let cleanH = h;
  let cleanM = 0;

  if (sLower.includes('sox & martin') && rawMins >= 13 * 60 && rawMins <= 13 * 60 + 30) {
    cleanH = 12;
    cleanM = 45;
  } else if (sLower.includes('sox & martin') && rawMins >= 18 * 60 && rawMins <= 18 * 60 + 40) {
    cleanH = 17;
    cleanM = 30;
  } else if (sLower.includes('top dragster') && rawMins >= 16 * 60 && rawMins <= 16 * 60 + 30) {
    cleanH = 16;
    cleanM = 30;
  } else if (sLower.includes('f3') && sLower.includes('practice') && rawMins >= 9 * 60 && rawMins <= 9 * 60 + 30) {
    cleanH = 9;
    cleanM = 30;
  } else if (sLower.includes('world sbk') && sLower.includes('practice 1') && rawMins >= 11 * 60 && rawMins <= 11 * 60 + 50) {
    cleanH = 10;
    cleanM = 30;
  } else if (sLower.includes('practice 1') && sLower.includes('formula 1') && rawMins >= 14 * 60 && rawMins <= 14 * 60 + 30) {
    cleanH = 13;
    cleanM = 30;
  } else if (sLower.includes('super gas') && rawMins >= 18 * 60 && rawMins <= 18 * 60 + 45) {
    cleanH = 18;
    cleanM = 30;
  } else if (m >= 0 && m < 12) {
    cleanH = h;
    cleanM = 0;
  } else if (m >= 12 && m < 25) {
    cleanH = h;
    cleanM = 0;
  } else if (m >= 25 && m < 38) {
    if (m >= 30) {
      cleanH = h;
      cleanM = 30;
    } else {
      cleanH = h;
      cleanM = 0;
    }
  } else if (m >= 38 && m < 52) {
    cleanH = h;
    cleanM = 0;
  } else {
    // 52..59 -> next hour :00
    cleanH = (h + 1) % 24;
    cleanM = 0;
  }

  localD.setUTCHours(cleanH, cleanM, 0, 0);

  const trackTime = `${String(cleanH).padStart(2, '0')}:${String(cleanM).padStart(2, '0')}`;
  const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const localDayStr = `${dayNames[localD.getUTCDay()]}. ${localD.getUTCDate()}`;

  const cleanUtcTs = localD.getTime() - circuitOffsetMin * 60 * 1000;
  const cleanIso = new Date(cleanUtcTs).toISOString();

  return { cleanIso, trackTime, localDayStr };
}

/**
 * Normalizes and maps The Racing Line sessions into our app's StandardRaceEvent format
 */
export async function getTheRacingLineCalendar(options?: { minDate?: number; maxDate?: number }): Promise<StandardRaceEvent[]> {
  const sessions = await fetchTheRacingLineSessions();

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
    const seriesName = (s.series?.name || s.series?.shortName || s.series?.id || 'Motorsport').trim();
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
    const { cleanIso, trackTime, localDayStr } = recoverExactSchedule(s.date, s.circuitOffsetMin || 0, s.sessionName || '');
    const d = new Date(cleanIso);
    const startAt = d.getTime();

    const schedItem = {
      id: String(s.id),
      name: s.sessionName || 'Sesión',
      time: `${localDayStr}, ${trackTime}`,
      rawTime: trackTime,
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
      // Avoid duplicate session ID
      if (!existing.schedules.some(sc => sc.id === schedItem.id)) {
        existing.schedules.push(schedItem);
      }
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

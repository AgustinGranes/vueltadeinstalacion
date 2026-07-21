export interface WeatherData {
  temperature: number;
  rainChance: number;
  rainfall: number;
  weatherCode: number;
  isDay: boolean;
}

// Memory cache to avoid hitting the API multiple times for the same location
const weatherCache = new Map<string, { timestamp: number, data: any }>();
const CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours

export async function getWeatherForSession(lat: number, long: number, sessionTimestamp: number): Promise<WeatherData | null> {
  if (typeof lat !== 'number' || typeof long !== 'number' || isNaN(lat) || isNaN(long)) {
    return null;
  }

  // Only fetch weather for sessions within the next 7 days and past 2 days (Open-Meteo limits)
  const now = Date.now();
  const daysDiff = (sessionTimestamp - now) / (1000 * 60 * 60 * 24);
  if (daysDiff > 7 || daysDiff < -2) {
    return null;
  }

  const cacheKey = `${lat.toFixed(2)},${long.toFixed(2)}`;
  
  let forecastData = null;
  
  const cached = weatherCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    forecastData = cached.data;
  } else {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&hourly=temperature_2m,precipitation_probability,precipitation,weathercode,is_day&timezone=UTC`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      forecastData = await res.json();
      weatherCache.set(cacheKey, { timestamp: now, data: forecastData });
    } catch (e) {
      console.warn('Failed to fetch weather from Open-Meteo:', e);
      return null;
    }
  }

  if (!forecastData || !forecastData.hourly || !forecastData.hourly.time) return null;

  // Open-Meteo returns hourly data, find the closest hour to our session
  // Format to match Open-Meteo UTC strings: "YYYY-MM-DDTHH:00"
  // Just find the index of the closest time
  let closestIdx = -1;
  let minDiff = Infinity;
  
  for (let i = 0; i < forecastData.hourly.time.length; i++) {
    const timeStr = forecastData.hourly.time[i];
    const hourTimestamp = new Date(timeStr + 'Z').getTime(); // append Z to treat as UTC
    const diff = Math.abs(hourTimestamp - sessionTimestamp);
    
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }

  if (closestIdx === -1) return null;

  return {
    temperature: Math.round(forecastData.hourly.temperature_2m[closestIdx]),
    rainChance: forecastData.hourly.precipitation_probability[closestIdx],
    rainfall: forecastData.hourly.precipitation[closestIdx],
    weatherCode: forecastData.hourly.weathercode[closestIdx],
    isDay: forecastData.hourly.is_day[closestIdx] === 1,
  };
}

export function getWeatherConditionName(code: number): string {
  if (code === 0) return 'Despejado';
  if (code === 1) return 'Mayormente Despejado';
  if (code === 2) return 'Parcialmente Nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Niebla';
  if (code >= 51 && code <= 55) return 'Llovizna';
  if (code === 56 || code === 57) return 'Llovizna Helada';
  if (code >= 61 && code <= 65) return 'Lluvia';
  if (code === 66 || code === 67) return 'Lluvia Helada';
  if (code >= 71 && code <= 77) return 'Nieve';
  if (code >= 80 && code <= 82) return 'Chubascos';
  if (code === 85 || code === 86) return 'Chubascos de Nieve';
  if (code >= 95 && code <= 99) return 'Tormenta';
  return 'Desconocido';
}

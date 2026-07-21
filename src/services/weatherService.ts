export interface WeatherData {
  temperature: number;
  rainChance: number;
  rainfall: number;
  weatherCode: number;
  isDay: boolean;
}

import HARDCODED_COORDS from '../data/circuit_coords.json';

const weatherCache = new Map<string, { timestamp: number, data: any }>();
const geocodeCache = new Map<string, { lat: number, long: number } | null>();
const CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours

// In-flight request maps to deduplicate simultaneous calls
const inFlightGeocodes = new Map<string, Promise<{ lat: number, long: number } | null>>();
const inFlightWeather = new Map<string, Promise<any>>();

export async function getCoordinatesForLocation(locationName: string): Promise<{lat: number, long: number} | null> {
  if (!locationName) return null;
  const key = locationName.toLowerCase().trim();
  
  for (const [circuit, coords] of Object.entries(HARDCODED_COORDS)) {
    if (key.includes(circuit)) return coords;
  }

  if (geocodeCache.has(key)) return geocodeCache.get(key) || null;
  if (inFlightGeocodes.has(key)) return inFlightGeocodes.get(key)!;

  const promise = (async () => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(key)}&count=1&language=es&format=json`;
      const res = await fetch(url);
      if (res.status === 429) throw new Error('Rate limit exceeded');
      if (!res.ok) throw new Error('Geocoding fetch failed');
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const coords = { lat: data.results[0].latitude, long: data.results[0].longitude };
        geocodeCache.set(key, coords);
        return coords;
      }
      // Zero results from valid response
      geocodeCache.set(key, null);
      return null;
    } catch (e) {
      console.warn('Geocoding error:', e);
      // DO NOT cache null on error to allow retries
      return null;
    } finally {
      inFlightGeocodes.delete(key);
    }
  })();

  inFlightGeocodes.set(key, promise);
  return promise;
}

export async function getWeatherForSession(lat: number | undefined, long: number | undefined, sessionTimestamp: number, locationName?: string): Promise<WeatherData | null> {
  let finalLat = lat;
  let finalLong = long;

  if (typeof finalLat !== 'number' || typeof finalLong !== 'number' || isNaN(finalLat) || isNaN(finalLong)) {
    if (locationName) {
      const coords = await getCoordinatesForLocation(locationName);
      if (coords) {
        finalLat = coords.lat;
        finalLong = coords.long;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  const now = Date.now();
  const daysDiff = (sessionTimestamp - now) / (1000 * 60 * 60 * 24);
  if (daysDiff > 14 || daysDiff < -2) {
    return null;
  }

  const cacheKey = `${finalLat.toFixed(2)},${finalLong.toFixed(2)}`;
  let forecastData = null;
  
  const cached = weatherCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    forecastData = cached.data;
  } else if (inFlightWeather.has(cacheKey)) {
    forecastData = await inFlightWeather.get(cacheKey);
  } else {
    const promise = (async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLong}&hourly=temperature_2m,precipitation_probability,precipitation,weathercode,is_day&timezone=UTC&forecast_days=16`;
        const res = await fetch(url);
        if (res.status === 429) throw new Error('Rate limit exceeded');
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        weatherCache.set(cacheKey, { timestamp: Date.now(), data });
        return data;
      } catch (e) {
        console.warn('Weather fetch error:', e);
        return null;
      } finally {
        inFlightWeather.delete(cacheKey);
      }
    })();
    inFlightWeather.set(cacheKey, promise);
    forecastData = await promise;
  }

  if (!forecastData || !forecastData.hourly || !forecastData.hourly.time) return null;

  let closestIdx = -1;
  let minDiff = Infinity;
  
  for (let i = 0; i < forecastData.hourly.time.length; i++) {
    const timeStr = forecastData.hourly.time[i];
    const hourTimestamp = new Date(timeStr + 'Z').getTime();
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

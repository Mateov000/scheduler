import { calculateComfortScore, degreesToCardinal } from './weather/comfortScore';
import { WeatherCondition } from './types';

export const MDP_COORDINATES = {
  lat: -38.0,
  lon: -57.55,
} as const;

const WEATHER_CACHE_KEY = 'mimesa_weather_cache_v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CachedWeather {
  timestamp: number;
  data: WeatherCondition[];
}

/**
 * Generates realistic fallback weather for Mar del Plata for 7 days (168 hours)
 * when offline or when Open-Meteo is unreachable.
 */
export function generateSyntheticMDPWeather(startDate: Date = new Date()): WeatherCondition[] {
  const result: WeatherCondition[] = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  for (let hour = 0; hour < 168; hour++) {
    const timestamp = new Date(start.getTime() + hour * 3600000);
    const dayOfWeek = timestamp.getDay();
    const timeOfDay = timestamp.getHours();

    // Mild spring/autumn in Mar del Plata: 12-22°C
    const tempBase = 16 + 5 * Math.sin(((timeOfDay - 9) / 24) * 2 * Math.PI);
    const temperatureCelsius = Math.round(tempBase * 10) / 10;
    const feelsLikeCelsius = Math.round((tempBase - 1) * 10) / 10;

    // Simulate occasional coastal wind or afternoon sea breeze
    const windSpeedKmh = timeOfDay >= 13 && timeOfDay <= 18 ? 24 : 14;
    const windDirection = timeOfDay >= 14 && timeOfDay <= 19 ? 'SE' : 'NE';

    // Simulate occasional rain on Wednesday
    const isRainDay = dayOfWeek === 3 && timeOfDay >= 10 && timeOfDay <= 16;
    const precipitationProbability = isRainDay ? 0.8 : 0.05;
    const precipitationMm = isRainDay ? 3.5 : 0;

    const comfortScore = calculateComfortScore({
      precipitationProbability,
      precipitationMm,
      windSpeedKmh,
      windDirection,
      feelsLikeCelsius,
    });

    result.push({
      timestamp,
      precipitationProbability,
      precipitationMm,
      windSpeedKmh,
      windDirection,
      temperatureCelsius,
      feelsLikeCelsius,
      comfortScore,
    });
  }

  return result;
}

/**
 * Fetches 7-day hourly weather for Mar del Plata from Open-Meteo, with a 6-hour cache and offline fallback.
 */
export async function fetchMDPWeather(forceRefresh: boolean = false): Promise<WeatherCondition[]> {
  // 1. Check local cache
  if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(WEATHER_CACHE_KEY);
      if (raw) {
        const cached: CachedWeather = JSON.parse(raw);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return cached.data.map((c) => ({
            ...c,
            timestamp: new Date(c.timestamp),
          }));
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }

  // 2. Query Open-Meteo public API
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${MDP_COORDINATES.lat}&longitude=${MDP_COORDINATES.lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=7`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP error: ${response.status}`);
    }

    const json = await response.json();
    const hourly = json.hourly;
    if (!hourly || !Array.isArray(hourly.time)) {
      throw new Error('Invalid Open-Meteo response format');
    }

    const conditions: WeatherCondition[] = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const timestamp = new Date(hourly.time[i]);
      const precipProb = (hourly.precipitation_probability?.[i] ?? 0) / 100;
      const precipitationMm = hourly.precipitation?.[i] ?? 0;
      const windSpeedKmh = hourly.wind_speed_10m?.[i] ?? 15;
      const windDeg = hourly.wind_direction_10m?.[i] ?? 90;
      const windDirection = degreesToCardinal(windDeg);
      const temperatureCelsius = hourly.temperature_2m?.[i] ?? 18;
      const feelsLikeCelsius = hourly.apparent_temperature?.[i] ?? temperatureCelsius;

      const comfortScore = calculateComfortScore({
        precipitationProbability: precipProb,
        precipitationMm,
        windSpeedKmh,
        windDirection,
        feelsLikeCelsius,
      });

      conditions.push({
        timestamp,
        precipitationProbability: precipProb,
        precipitationMm,
        windSpeedKmh,
        windDirection,
        temperatureCelsius,
        feelsLikeCelsius,
        comfortScore,
      });
    }

    // Cache results
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cachePayload: CachedWeather = {
          timestamp: Date.now(),
          data: conditions,
        };
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cachePayload));
      } catch {
        // Storage full or unavailable
      }
    }

    return conditions;
  } catch {
    // Network offline or failed -> Return synthetic MDP weather
    return generateSyntheticMDPWeather();
  }
}

/**
 * Finds the weather condition corresponding to a given date and hour.
 */
export function getWeatherConditionForDate(
  weatherList: WeatherCondition[],
  targetDate: Date
): WeatherCondition {
  const targetTime = targetDate.getTime();
  let closest = weatherList[0];
  let minDiff = Infinity;

  for (const w of weatherList) {
    const diff = Math.abs(new Date(w.timestamp).getTime() - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }

  return closest;
}

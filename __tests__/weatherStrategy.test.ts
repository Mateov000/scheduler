import { describe, expect, it } from 'vitest';
import { defaultParams } from '../src/lib/scheduler/params';
import { computeSC08Penalty } from '../src/lib/scheduler/softConstraints/SC08_goodWeatherForSocial';
import { computeSC08bPenalty } from '../src/lib/scheduler/softConstraints/SC08b_badWeatherForProductivity';
import { Event, WeatherCondition } from '../src/lib/scheduler/types';

describe('Weather Soft Constraints & Golden Rules (Tarea 3.3)', () => {
  const weekStart = new Date(2026, 8, 14, 0, 0, 0);

  it('SC-08: Penalizes good weather windows without social/outdoor activities', () => {
    // 7 days of good weather (comfortScore = 85)
    const weather: WeatherCondition[] = Array.from({ length: 168 }, (_, i) => ({
      timestamp: new Date(weekStart.getTime() + i * 3600000),
      precipitationProbability: 0,
      precipitationMm: 0,
      windSpeedKmh: 10,
      windDirection: 'NE',
      temperatureCelsius: 20,
      feelsLikeCelsius: 20,
      comfortScore: 85,
    }));

    // Empty schedule -> misses good weather opportunity
    const penaltyEmpty = computeSC08Penalty([], weather, defaultParams);
    expect(penaltyEmpty).toBeGreaterThan(0);

    // Schedule with social event during good weather
    const socialEvent: Event = {
      id: 'e_social',
      name: 'Mate en la Rambla',
      category: 'social',
      start: new Date(weekStart.getTime() + 15 * 3600000), // Day 0, 15:00
      duration: 120,
      is_locked: false,
      location: { type: 'exterior_rambla', name: 'Rambla' },
      weatherSensitivity: 'outdoor_full',
      cognitiveLoad: 0,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'test',
      localVersion: 1,
      syncStatus: 'synced',
    };

    const penaltyWithSocial = computeSC08Penalty([socialEvent], weather, defaultParams);
    expect(penaltyWithSocial).toBeLessThan(penaltyEmpty);
  });

  it('SC-08b Golden Rule 1: Never penalizes scheduled social events in bad weather', () => {
    // 7 days of storm (comfortScore = 20)
    const stormWeather: WeatherCondition[] = Array.from({ length: 168 }, (_, i) => ({
      timestamp: new Date(weekStart.getTime() + i * 3600000),
      precipitationProbability: 0.9,
      precipitationMm: 8,
      windSpeedKmh: 45,
      windDirection: 'SE',
      temperatureCelsius: 10,
      feelsLikeCelsius: 6,
      comfortScore: 20,
    }));

    const socialInStorm: Event = {
      id: 'e_social_storm',
      name: 'Café de lluvia con Juani',
      category: 'social',
      start: new Date(weekStart.getTime() + 16 * 3600000),
      duration: 120,
      is_locked: false,
      location: { type: 'cafe_guemes', name: 'Café Güemes' },
      weatherSensitivity: 'none',
      cognitiveLoad: 0,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'test',
      localVersion: 1,
      syncStatus: 'synced',
    };

    // Evaluate SC08b
    const penaltyWithSocial = computeSC08bPenalty([socialInStorm], stormWeather, defaultParams);
    // Even if it's bad weather, social event is respected and not penalized for being social
    expect(penaltyWithSocial).toBeLessThanOrEqual(1.0);
  });
});

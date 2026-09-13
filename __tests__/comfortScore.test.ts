import { describe, expect, it } from 'vitest';
import { canHostAtHome, suggestSocialLocation } from '../src/lib/scheduler/socialEngine';
import { Contact, WeatherCondition } from '../src/lib/scheduler/types';
import { calculateComfortScore, degreesToCardinal } from '../src/lib/scheduler/weather/comfortScore';

describe('Weather ComfortScore & Social Model (Fase 3)', () => {
  it('computes high score (> 85) for mild sunny afternoon with light wind', () => {
    const score = calculateComfortScore({
      precipitationProbability: 0,
      precipitationMm: 0,
      windSpeedKmh: 10,
      windDirection: 'NE',
      feelsLikeCelsius: 20,
    });

    expect(score).toBe(100);
  });

  it('computes low score (< 20) for severe coastal storm with rain and SE gale', () => {
    const score = calculateComfortScore({
      precipitationProbability: 0.9,
      precipitationMm: 12, // heavy rain -> pRain = 1.0
      windSpeedKmh: 50,    // strong wind -> pWind = 1.0 (with kSE = 1.3)
      windDirection: 'SE', // Southeast wind
      feelsLikeCelsius: 3, // cold -> pCold = 0.7
    });

    // 100 - (1 * 40) - (1 * 30) - (0.7 * 30) = 100 - 40 - 30 - 21 = 9
    expect(score).toBeLessThan(20);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('applies the 1.3x SE wind penalty factor for Mar del Plata', () => {
    // 35 km/h wind: raw fraction = (35 - 20) / 25 = 15/25 = 0.6
    const scoreSE = calculateComfortScore({
      precipitationProbability: 0,
      precipitationMm: 0,
      windSpeedKmh: 35,
      windDirection: 'SE',
      feelsLikeCelsius: 18,
    });

    const scoreNW = calculateComfortScore({
      precipitationProbability: 0,
      precipitationMm: 0,
      windSpeedKmh: 35,
      windDirection: 'NW',
      feelsLikeCelsius: 18,
    });

    // SE penalty is higher -> scoreSE must be strictly lower than scoreNW
    expect(scoreSE).toBeLessThan(scoreNW);
  });

  it('converts wind degrees correctly to cardinal directions', () => {
    expect(degreesToCardinal(0)).toBe('N');
    expect(degreesToCardinal(90)).toBe('E');
    expect(degreesToCardinal(135)).toBe('SE');
    expect(degreesToCardinal(180)).toBe('S');
    expect(degreesToCardinal(270)).toBe('W');
  });

  it('strictly restricts home social access to intimate circle (Juani, Juancito)', () => {
    const juani: Contact = {
      id: 'c1',
      name: 'Juani',
      relationshipType: 'amigo_cercano',
    };
    const juancito: Contact = {
      id: 'c2',
      name: 'Juancito',
      relationshipType: 'amigo_cercano',
    };
    const lau: Contact = {
      id: 'c3',
      name: 'Lau',
      relationshipType: 'vinculo_delicado',
      isSensitive: true,
    };
    const casual: Contact = {
      id: 'c4',
      name: 'Compañero Facultad',
      relationshipType: 'conocido',
    };

    expect(canHostAtHome(juani)).toBe(true);
    expect(canHostAtHome(juancito)).toBe(true);
    expect(canHostAtHome(lau)).toBe(false);
    expect(canHostAtHome(casual)).toBe(false);
    expect(canHostAtHome(undefined)).toBe(false);
  });

  it('suggests appropriate locations and NEVER suggests home as casual fallback', () => {
    const casual: Contact = {
      id: 'c5',
      name: 'Martín',
      relationshipType: 'conocido',
      hasPrivateApartment: false,
    };

    const badWeather: WeatherCondition = {
      timestamp: new Date(),
      precipitationProbability: 0.8,
      precipitationMm: 5,
      windSpeedKmh: 35,
      windDirection: 'SE',
      temperatureCelsius: 11,
      feelsLikeCelsius: 9,
      comfortScore: 25,
    };

    const suggested = suggestSocialLocation(casual, badWeather);

    // Must NEVER be home
    expect(suggested.type).not.toBe('casa');
    // Must be an indoor shelter (Aldrey or Güemes)
    expect(['paseo_aldrey', 'cafe_guemes']).toContain(suggested.type);

    // If contact has private apartment
    const contactWithApt: Contact = {
      ...casual,
      hasPrivateApartment: true,
    };
    const suggestedApt = suggestSocialLocation(contactWithApt, badWeather);
    expect(suggestedApt.type).toBe('depto_contacto');
  });
});

import { CardinalDirection } from '../types';

/**
 * Converts wind direction in degrees (0 - 360) to CardinalDirection.
 */
export function degreesToCardinal(degrees: number): CardinalDirection {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'E';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  return 'NW';
}

export interface ComfortScoreInput {
  precipitationProbability: number; // 0.0 to 1.0 (or 0-100 normalized)
  precipitationMm: number;          // mm/h
  windSpeedKmh: number;             // km/h
  windDirection: CardinalDirection | number;
  feelsLikeCelsius: number;         // °C
}

/**
 * Calculates the exact Mar del Plata ComfortScore [0, 100] as specified in §12.3:
 * ComfortScore = 100 - (P_lluvia * 40) - (P_viento * 30) - (P_frio * 30)
 *
 * Where:
 * - P_lluvia = min(1, precipProb / 0.35 + precipMm / 5)
 * - P_viento = k_SE * min(1, max(0, v - 20) / 25), with k_SE = 1.3 if direction in {SE, S, E}, else 1.0
 * - P_frio = min(1, max(0, 10 - feelsLike) / 10)
 */
export function calculateComfortScore(input: ComfortScoreInput): number {
  const precipProb = input.precipitationProbability > 1 ? input.precipitationProbability / 100 : input.precipitationProbability;
  const precipMm = Math.max(0, input.precipitationMm);

  // 1. Rain Penalty (Weight: 40)
  const pRain = Math.min(1, (precipProb / 0.35) + (precipMm / 5));

  // 2. Wind Penalty with Mar del Plata SE factor (Weight: 30)
  const direction: CardinalDirection =
    typeof input.windDirection === 'number'
      ? degreesToCardinal(input.windDirection)
      : input.windDirection;

  const isSouthEast = direction === 'SE' || direction === 'S' || direction === 'E';
  const kSE = isSouthEast ? 1.3 : 1.0;

  const rawWindFraction = Math.max(0, input.windSpeedKmh - 20) / 25;
  const pWind = Math.min(1, kSE * Math.min(1, rawWindFraction));

  // 3. Cold Penalty (Weight: 30)
  const pCold = Math.min(1, Math.max(0, 10 - input.feelsLikeCelsius) / 10);

  // Total Score
  const rawScore = 100 - (pRain * 40) - (pWind * 30) - (pCold * 30);
  return Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));
}

import { LocationType } from './types';

export type TravelMatrix = Record<LocationType, Partial<Record<LocationType, number>>>;

export const defaultTravelMatrix: TravelMatrix = {
  casa: {
    casa: 0,
    rambla_casino: 30,
    ferro_san_juan: 25,
    facultad: 20,
    cafe_guemes: 15,
    paseo_aldrey: 18,
  },
  rambla_casino: {
    casa: 30,
    rambla_casino: 0,
    ferro_san_juan: 20,
    facultad: 25,
    cafe_guemes: 20,
    paseo_aldrey: 22,
  },
  ferro_san_juan: {
    casa: 25,
    rambla_casino: 20,
    ferro_san_juan: 0,
    facultad: 30,
    cafe_guemes: 18,
    paseo_aldrey: 20,
  },
  facultad: {
    casa: 20,
    rambla_casino: 25,
    ferro_san_juan: 30,
    facultad: 0,
    cafe_guemes: 10,
    paseo_aldrey: 12,
  },
  cafe_guemes: {
    casa: 15,
    rambla_casino: 20,
    ferro_san_juan: 18,
    facultad: 10,
    cafe_guemes: 0,
    paseo_aldrey: 5,
  },
  paseo_aldrey: {
    casa: 18,
    rambla_casino: 22,
    ferro_san_juan: 20,
    facultad: 12,
    cafe_guemes: 5,
    paseo_aldrey: 0,
  },
  exterior_rambla: { rambla_casino: 5, casa: 30, cafe_guemes: 15 },
  exterior_plaza: { facultad: 10, casa: 20, cafe_guemes: 15 },
  gym: { casa: 15, cafe_guemes: 10, rambla_casino: 20 },
  depto_contacto: { casa: 20, cafe_guemes: 15 },
  custom: { casa: 30 },
};

export function getTravelTimeMinutes(
  from: LocationType,
  to: LocationType,
  matrix: TravelMatrix = defaultTravelMatrix
): number {
  if (from === to) return 0;
  return matrix[from]?.[to] ?? matrix[to]?.[from] ?? 20;
}

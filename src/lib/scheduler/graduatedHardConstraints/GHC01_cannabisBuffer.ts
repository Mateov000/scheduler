import { ConstraintParams } from '../params';

/**
 * GHC-01 · Buffer Post-Consumo de Cannabis
 *
 * Fórmula cuadrática (§7.2 y §7.3):
 * - Penalidad 0 si bufferMinutes >= target (default: 240 min)
 * - Penalidad cuadrática w_ghc01 * ((target - bufferMinutes) / (target - floor))^2 si floor <= bufferMinutes < target
 * - Penalidad Infinity si bufferMinutes < floor (default: 120 min) o bufferMinutes < 0
 */
export function computeGHC01Penalty(bufferMinutes: number, params: ConstraintParams): number {
  const target = params.cannabis_buffer_target;
  const floor = params.cannabis_buffer_floor;
  const weight = params.w_ghc01;

  if (bufferMinutes < 0 || bufferMinutes < floor) {
    return Infinity;
  }
  if (bufferMinutes >= target) {
    return 0;
  }

  const ratio = (target - bufferMinutes) / (target - floor);
  return weight * Math.pow(ratio, 2);
}

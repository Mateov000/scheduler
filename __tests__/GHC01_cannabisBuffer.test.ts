import { describe, test, expect } from 'vitest';
import { computeGHC01Penalty } from '../src/lib/scheduler/graduatedHardConstraints/GHC01_cannabisBuffer';
import { defaultParams } from '../src/lib/scheduler/params';

describe('GHC-01 · Buffer post-consumo (curva cuadrática)', () => {
  const params = {
    ...defaultParams,
    cannabis_buffer_target: 240,
    cannabis_buffer_floor: 120,
    w_ghc01: 8,
  };

  test('buffer exacto al target → penalidad 0', () => {
    expect(computeGHC01Penalty(240, params)).toBe(0);
  });

  test('buffer mayor al target → penalidad 0', () => {
    expect(computeGHC01Penalty(300, params)).toBe(0);
  });

  test('buffer en el piso exacto → penalidad máxima del rango (8 * 1.0)', () => {
    expect(computeGHC01Penalty(120, params)).toBe(8 * 1.0);
  });

  test('buffer a mitad del rango (180 min) → penalidad cuadrática (8 * 0.25)', () => {
    // (240 - 180) / (240 - 120) = 60 / 120 = 0.5 -> 0.5^2 = 0.25
    expect(computeGHC01Penalty(180, params)).toBeCloseTo(8 * 0.25);
  });

  test('buffer en 3h30 (210 min) → penalidad cuadrática', () => {
    // (240 - 210) / (240 - 120) = 30 / 120 = 0.25 -> 0.25^2 = 0.0625 -> 8 * 0.0625 = 0.5
    expect(computeGHC01Penalty(210, params)).toBeCloseTo(8 * 0.0625);
  });

  test('buffer por debajo del piso (90 min) → penalidad infinita (inválido)', () => {
    expect(computeGHC01Penalty(90, params)).toBe(Infinity);
  });

  test('buffer negativo → siempre inválido', () => {
    expect(computeGHC01Penalty(-10, params)).toBe(Infinity);
  });
});

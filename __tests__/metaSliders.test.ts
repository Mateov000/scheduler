import { describe, test, expect } from 'vitest';
import {
  computeRawMultiplier,
  getMetaSliderMultipliers,
  defaultMetaSliders,
  metaSliderPresets,
} from '../src/lib/scheduler/metaSliders';

describe('Meta-Sliders Logic & Multipliers', () => {
  test('Posición neutra (5) produce multiplicador 1.0', () => {
    expect(computeRawMultiplier(5)).toBe(1.0);
  });

  test('Extremo izquierdo (0) produce multiplicador 0.5', () => {
    expect(computeRawMultiplier(0)).toBe(0.5);
  });

  test('Extremo derecho (10) produce multiplicador 2.0', () => {
    expect(computeRawMultiplier(10)).toBe(2.0);
  });

  test('defaultMetaSliders produce multiplicadores neutrales de 1.0', () => {
    const multipliers = getMetaSliderMultipliers(defaultMetaSliders);
    expect(multipliers['SC-01']).toBeCloseTo(1.0);
    expect(multipliers['SC-02']).toBeCloseTo(1.0);
    expect(multipliers['SC-03']).toBeCloseTo(1.0);
    expect(multipliers['SC-04']).toBeCloseTo(1.0);
    expect(multipliers['SC-15']).toBeCloseTo(1.0);
  });

  test('Preset "semana_examen" prioriza productividad y estudio (SC-01 sube)', () => {
    const examSliders = metaSliderPresets.semana_examen.sliders;
    const multipliers = getMetaSliderMultipliers(examSliders);

    // Con productividad = 1 (muy izquierda), invProd = 2.5 - (0.5 + 0.15) = 1.85 (boost importante)
    expect(multipliers['SC-01']).toBeGreaterThan(1.5);
    expect(multipliers['SC-02']).toBeGreaterThan(1.5);
    // Serendipia y ocio se reducen
    expect(multipliers['SC-15']).toBeLessThan(1.0);
  });

  test('Preset "conocer_gente" potencia serendipia (SC-15)', () => {
    const socialSliders = metaSliderPresets.conocer_gente.sliders;
    const multipliers = getMetaSliderMultipliers(socialSliders);

    expect(multipliers['SC-15']).toBeGreaterThan(1.5);
  });
});

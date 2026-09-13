import { describe, test, expect } from 'vitest';
import { solveMiMesa } from '../src/lib/scheduler/solver';
import { defaultParams } from '../src/lib/scheduler/params';
import { defaultBaseWeights } from '../src/lib/scheduler/scorer';
import { Event, SolverInput, WeatherCondition, Contact } from '../src/lib/scheduler/types';

describe('CSP Solver Integration & Performance Benchmark', () => {
  const weekStart = new Date('2026-09-14T00:00:00.000Z'); // Lunes

  // Crear 168 horas de clima sintético (ComfortScore = 80 estándar, con alguna lluvia puntual)
  const syntheticWeather: WeatherCondition[] = Array.from({ length: 168 }, (_, i) => {
    const ts = new Date(weekStart.getTime() + i * 60 * 60 * 1000);
    return {
      timestamp: ts,
      precipitationProbability: 0.1,
      precipitationMm: 0,
      windSpeedKmh: 15,
      windDirection: 'NE',
      temperatureCelsius: 16,
      feelsLikeCelsius: 16,
      comfortScore: 80,
    };
  });

  const contacts: Contact[] = [
    { id: 'c1', name: 'Juancito', weeklyHoursGoal: 5, relationshipType: 'amigo_cercano' },
    { id: 'c2', name: 'Juani', weeklyHoursGoal: 3, relationshipType: 'amigo_cercano' },
    { id: 'c3', name: 'Lau', relationshipType: 'vinculo_delicado', isSensitive: true },
  ];

  // Construir una agenda representativa de 30 eventos
  const events: Event[] = [
    // 4 Cursadas fijas
    {
      id: 'uni-redes',
      name: 'Redes de Computadoras',
      category: 'cursada',
      start: new Date('2026-09-14T10:00:00.000Z'), // Lun 10:00
      duration: 180,
      is_locked: true,
      location: { type: 'facultad', name: 'Facultad' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 3,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
    {
      id: 'uni-ayds',
      name: 'Análisis y Diseño de Sistemas',
      category: 'cursada',
      start: new Date('2026-09-15T14:00:00.000Z'), // Mar 14:00
      duration: 180,
      is_locked: true,
      location: { type: 'facultad', name: 'Facultad' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 3,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
    {
      id: 'uni-aeec',
      name: 'AEEC',
      category: 'cursada',
      start: new Date('2026-09-16T18:00:00.000Z'), // Mié 18:00
      duration: 120,
      is_locked: true,
      location: { type: 'facultad', name: 'Facultad' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 2,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
    {
      id: 'uni-calsoft',
      name: 'Calidad de Software',
      category: 'cursada',
      start: new Date('2026-09-17T09:00:00.000Z'), // Jue 09:00
      duration: 180,
      is_locked: true,
      location: { type: 'facultad', name: 'Facultad' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 3,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // Turnos de Trabajo
    {
      id: 'work-casino',
      name: 'Turno Casino Rambla',
      category: 'trabajo',
      start: new Date('2026-09-14T14:00:00.000Z'), // Lun 14:00 a 18:00
      duration: 240,
      is_locked: true,
      location: { type: 'rambla_casino', name: 'Rambla Casino' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 1,
      physicalLoad: 2,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
    {
      id: 'work-ferro',
      name: 'Turno Ferro San Juan',
      category: 'trabajo',
      start: new Date('2026-09-18T18:00:00.000Z'), // Vie 18:00 a 01:00 (+1)
      duration: 420,
      is_locked: true,
      location: { type: 'ferro_san_juan', name: 'Ferro San Juan' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 1,
      physicalLoad: 2,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // Bloque de sueño post-ferro (Sábado 01:45 a 09:45 = 480 min)
    {
      id: 'sleep-post-ferro',
      name: 'Sueño reparador post-Ferro',
      category: 'sueno',
      start: new Date('2026-09-19T01:45:00.000Z'),
      duration: 480,
      is_locked: true,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 0,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // Eventos de Batch Cooking
    {
      id: 'cook-1',
      name: 'Batch Cooking Sesión 1',
      category: 'batch_cooking',
      start: new Date('2026-09-15T19:00:00.000Z'),
      duration: 120,
      is_locked: false,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 1,
      physicalLoad: 1,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
    {
      id: 'cook-2',
      name: 'Batch Cooking Sesión 2',
      category: 'batch_cooking',
      start: new Date('2026-09-19T11:00:00.000Z'),
      duration: 120,
      is_locked: false,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 1,
      physicalLoad: 1,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // Bloques de estudio
    {
      id: 'study-redes',
      name: 'Estudio Redes de Computadoras',
      category: 'estudio',
      start: new Date('2026-09-16T10:00:00.000Z'),
      duration: 120,
      is_locked: false,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 3,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
    {
      id: 'study-ayds',
      name: 'Estudio AyDS',
      category: 'estudio',
      start: new Date('2026-09-17T14:00:00.000Z'),
      duration: 120,
      is_locked: false,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 3,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },

    // Salida social con cannabis (GHC-01)
    {
      id: 'social-cannabis',
      name: 'Salida con Juancito',
      category: 'social',
      start: new Date('2026-09-19T18:00:00.000Z'),
      duration: 180,
      is_locked: false,
      contacts: ['Juancito'],
      cannabis_consumed: true,
      location: { type: 'cafe_guemes', name: 'Café Güemes' },
      weatherSensitivity: 'transit_only',
      cognitiveLoad: 0,
      physicalLoad: 0,
      is_sensitive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
    // Evento llegada a casa con 4h de buffer (termina 21:00, llegada a las 01:00 = 240 min)
    {
      id: 'sleep-sat',
      name: 'Sueño noche sábado',
      category: 'sueno',
      start: new Date('2026-09-20T01:00:00.000Z'),
      duration: 480,
      is_locked: true,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 0,
      physicalLoad: 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    },
  ];

  // Añadir 17 eventos adicionales para alcanzar un total de 30 eventos
  for (let i = 0; i < 17; i++) {
    const day = i % 7;
    const hour = 8 + (i % 8);
    const date = new Date(weekStart.getTime() + (day * 24 + hour) * 60 * 60 * 1000);

    events.push({
      id: `filler-event-${i}`,
      name: `Actividad complementaria ${i}`,
      category: i % 3 === 0 ? 'gym' : (i % 3 === 1 ? 'comida' : 'desarrollo_personal'),
      start: date,
      duration: 60,
      is_locked: false,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 1,
      physicalLoad: i % 3 === 0 ? 3 : 0,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'local',
      localVersion: 1,
      syncStatus: 'synced',
    });
  }

  test('Benchmark de rendimiento: resuelve 30 eventos en menos de 50ms', () => {
    const input: SolverInput = {
      schedule: events,
      weather: syntheticWeather,
      params: defaultParams,
      weights: defaultBaseWeights,
      contacts,
    };

    // Warm-up call para compilación JIT
    solveMiMesa({ ...input, schedule: events.slice(0, 5) });

    const result = solveMiMesa(input);

    expect(result.violations).toEqual([]);
    expect(result.solvingTimeMs).toBeLessThan(50);
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.schedule.length).toBeGreaterThanOrEqual(30);
    expect(result.constraintTrace).toBeDefined();
  });

  test('Garantiza que eventos con is_locked no se modifiquen de horario ni duración (HC-02)', () => {
    const input: SolverInput = {
      schedule: events,
      weather: syntheticWeather,
      params: defaultParams,
      weights: defaultBaseWeights,
      contacts,
    };

    const result = solveMiMesa(input);
    const redes = result.schedule.find(e => e.id === 'uni-redes');
    expect(redes).toBeDefined();
    expect(new Date(redes!.start).getTime()).toBe(new Date('2026-09-14T10:00:00.000Z').getTime());
    expect(redes!.duration).toBe(180);
  });

  test('Inserta buffers obligatorios de traslado laboral (HC-05)', () => {
    const input: SolverInput = {
      schedule: events,
      weather: syntheticWeather,
      params: defaultParams,
      weights: defaultBaseWeights,
      contacts,
    };

    const result = solveMiMesa(input);
    const workPreBuffer = result.schedule.find(e => e.id === 'trans-pre-work-casino');
    const workPostBuffer = result.schedule.find(e => e.id === 'trans-post-work-casino');

    expect(workPreBuffer).toBeDefined();
    expect(workPostBuffer).toBeDefined();
    expect(workPreBuffer!.duration).toBe(defaultParams.travel_buffer_casino);
  });
});

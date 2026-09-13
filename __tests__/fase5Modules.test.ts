import { describe, expect, it } from 'vitest';
import { calculateWeeklyBudgetSpend } from '../src/lib/scheduler/economicModel';
import { computeFatigueState } from '../src/lib/scheduler/fatigueTracker';
import { GeminiFlashClient } from '../src/lib/scheduler/llm/geminiClient';
import { NotificationManager } from '../src/lib/scheduler/notificationManager';
import { defaultParams } from '../src/lib/scheduler/params';
import { detectSchedulePatterns, UserActionRecord } from '../src/lib/scheduler/patternLearning';
import { Event } from '../src/lib/scheduler/types';

describe('Fase 5: Intelligent Modules & Analytics', () => {
  it('Fatigue Tracker detects consecutive Ferro shifts and sleep deficit', () => {
    const shift1: Event = {
      id: 'ferro_1',
      name: 'Turno Ferro San Juan 1',
      category: 'trabajo',
      start: new Date(2026, 8, 18, 17, 0, 0), // Friday 17:00
      duration: 480, // 8h
      is_locked: true,
      location: { type: 'ferro_san_juan', name: 'Ferro San Juan' },
      weatherSensitivity: 'none',
      cognitiveLoad: 1,
      physicalLoad: 2,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'test',
      localVersion: 1,
      syncStatus: 'synced',
    };

    const shift2: Event = {
      id: 'ferro_2',
      name: 'Turno Ferro San Juan 2',
      category: 'trabajo',
      start: new Date(2026, 8, 19, 17, 0, 0), // Saturday 17:00 (24h later)
      duration: 480,
      is_locked: true,
      location: { type: 'ferro_san_juan', name: 'Ferro San Juan' },
      weatherSensitivity: 'none',
      cognitiveLoad: 1,
      physicalLoad: 2,
      is_sensitive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'test',
      localVersion: 1,
      syncStatus: 'synced',
    };

    const report = computeFatigueState([shift1, shift2], defaultParams);
    expect(report.consecutiveNightShifts).toBe(2);
    expect(report.isCritical).toBe(true);
    expect(report.recommendedPreset).toBe('Recuperación post-Ferro');
  });

  it('Pattern Learning detects habits with confidence >= 0.75 and N >= 5', () => {
    // 5 observations of study reschedules post-Ferro
    const actions: UserActionRecord[] = [
      { id: '1', actionType: 'rescheduled', category: 'estudio', dayOfWeek: 1, context: 'post_ferro', timestamp: new Date() },
      { id: '2', actionType: 'rescheduled', category: 'estudio', dayOfWeek: 1, context: 'post_ferro', timestamp: new Date() },
      { id: '3', actionType: 'rescheduled', category: 'estudio', dayOfWeek: 1, context: 'post_ferro', timestamp: new Date() },
      { id: '4', actionType: 'rescheduled', category: 'estudio', dayOfWeek: 1, context: 'post_ferro', timestamp: new Date() },
      { id: '5', actionType: 'rescheduled', category: 'estudio', dayOfWeek: 1, context: 'post_ferro', timestamp: new Date() },
    ];

    const suggestions = detectSchedulePatterns(actions);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0.75);
    expect(suggestions[0].observationCount).toBe(5);
  });

  it('Economic Model computes weekly spend in ARS and warns on budget overrun', () => {
    const cafeEvent: Event = {
      id: 'e_cafe',
      name: 'Café en Güemes',
      category: 'social',
      start: new Date(),
      duration: 60,
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

    const summaryUnder = calculateWeeklyBudgetSpend([cafeEvent], 15000);
    expect(summaryUnder.totalEstimatedSpendARS).toBe(8000);
    expect(summaryUnder.isOverBudget).toBe(false);

    const summaryOver = calculateWeeklyBudgetSpend([cafeEvent, cafeEvent], 10000);
    expect(summaryOver.totalEstimatedSpendARS).toBe(16000);
    expect(summaryOver.isOverBudget).toBe(true);
    expect(summaryOver.excessARS).toBe(6000);
  });

  it('Notification Manager enforces priority rules, quiet hours, and privacy masking', () => {
    const manager = new NotificationManager();

    // Critical notification (GHC-01) bypasses quiet hours
    const nightTime = new Date();
    nightTime.setHours(2, 0, 0, 0); // 02:00 AM (Quiet hours)

    const criticalRes = manager.dispatchNotification(
      'Buffer cannabis por vencer',
      'Tu buffer finaliza en 30 min',
      'critical',
      undefined,
      nightTime
    );
    expect(criticalRes.sent).toBe(true);

    // High priority during quiet hours gets suppressed
    const highRes = manager.dispatchNotification(
      'Hora de dormir',
      'Inicia tu ventana de sueño',
      'high',
      undefined,
      nightTime
    );
    expect(highRes.sent).toBe(false);
    expect(highRes.reason).toContain('Modo silencio nocturno activo');

    // Sensitive event gets masked to emoji + time
    const dayTime = new Date();
    dayTime.setHours(15, 0, 0, 0);
    const sensitiveEv: Event = {
      id: 's1',
      name: 'Sesión privada con amigos',
      category: 'recuperacion',
      emoji: '🌿',
      start: dayTime,
      duration: 120,
      is_locked: false,
      location: { type: 'casa', name: 'Casa' },
      weatherSensitivity: 'none',
      cognitiveLoad: 0,
      physicalLoad: 0,
      is_sensitive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId: 'test',
      localVersion: 1,
      syncStatus: 'synced',
    };

    const maskedRes = manager.dispatchNotification(
      sensitiveEv.name,
      'Detalles privados',
      'high',
      sensitiveEv,
      dayTime
    );
    expect(maskedRes.sent).toBe(true);
    expect(maskedRes.notification.title).toContain('🌿');
    expect(maskedRes.notification.title).not.toContain('Sesión privada');
  });

  it('Gemini Flash offline heuristic parser extracts category, duration, and locations', async () => {
    const client = new GeminiFlashClient();

    const casinoParsed = await client.parseNaturalLanguageToEvent('Turno en Casino Rambla de 10 a 16');
    expect(casinoParsed.category).toBe('trabajo');
    expect(casinoParsed.location?.type).toBe('rambla_casino');
    expect(casinoParsed.duration).toBe(360);

    const rambla9h = await client.parseNaturalLanguageToEvent('rambla de 10 a 19');
    expect(rambla9h.category).toBe('trabajo');
    expect(rambla9h.location?.type).toBe('rambla_casino');
    expect(rambla9h.duration).toBe(540);
    expect(rambla9h.start?.getHours()).toBe(10);

    const studyParsed = await client.parseNaturalLanguageToEvent('Estudio para parcial de Redes');
    expect(studyParsed.category).toBe('estudio');
    expect(studyParsed.cognitiveLoad).toBe(3);
  });
});

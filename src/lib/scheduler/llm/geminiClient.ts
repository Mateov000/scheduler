import { Event, EventCategory, Location, WeatherCondition } from '../types';

export interface GeminiConfig {
  apiKey?: string;
  model?: string;
}

export class GeminiFlashClient {
  private apiKey?: string;
  private model: string;

  constructor(config: GeminiConfig = {}) {
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    this.model = config.model || 'gemini-1.5-flash';
  }

  /**
   * Translates natural language strings into structured Event partials.
   * Gracefully falls back to robust local regex/heuristic parser when offline or without API key.
   */
  async parseNaturalLanguageToEvent(
    input: string,
    referenceDate: Date = new Date()
  ): Promise<Partial<Event>> {
    const text = input.trim();

    // If online with API key, we can invoke Gemini Flash endpoint
    if (this.apiKey) {
      try {
        const prompt = `Actúa como un parser de calendario estricto para Mar del Plata, Argentina.
Convierte esta descripción en un objeto JSON con las siguientes propiedades:
- name: string
- category: ('trabajo' | 'cursada' | 'estudio' | 'social' | 'gym' | 'batch_cooking' | 'comida' | 'sueno' | 'traslado' | 'tramites' | 'desarrollo_personal' | 'recuperacion' | 'otro')
- startOffsetDays: number (0 para hoy, 1 para mañana, etc. considerando día de referencia ${referenceDate.toISOString()})
- startHour: number (0 a 23)
- startMinute: number (0, 15, 30, 45)
- duration: number (múltiplo de 15 minutos)
- locationType: ('casa' | 'rambla_casino' | 'ferro_san_juan' | 'facultad' | 'cafe_guemes' | 'paseo_aldrey' | 'gym' | 'exterior_rambla' | 'exterior_plaza' | 'custom')
- locationName: string
- cognitiveLoad: (0, 1, 2, o 3)
- physicalLoad: (0, 1, 2, o 3)
- emoji: string (un único emoji)
- is_sensitive: boolean

Texto a parsear: "${text}"
Devuelve SOLO el JSON sin formato markdown.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            const targetStart = new Date(referenceDate);
            targetStart.setDate(targetStart.getDate() + (parsed.startOffsetDays ?? 0));
            targetStart.setHours(parsed.startHour ?? 12, parsed.startMinute ?? 0, 0, 0);

            return {
              name: parsed.name || text,
              category: parsed.category || 'otro',
              emoji: parsed.emoji || '📅',
              start: targetStart,
              duration: parsed.duration || 60,
              is_locked: false,
              location: {
                type: parsed.locationType || 'custom',
                name: parsed.locationName || parsed.locationType || 'Mar del Plata',
              },
              cognitiveLoad: parsed.cognitiveLoad ?? 1,
              physicalLoad: parsed.physicalLoad ?? 0,
              is_sensitive: parsed.is_sensitive ?? false,
            };
          }
        }
      } catch {
        // Fallback to local heuristic parser
      }
    }

    // --- Offline Heuristic NLU Parser (Deterministic Rule-Based) ---
    return this.heuristicParse(text, referenceDate);
  }

  private heuristicParse(text: string, referenceDate: Date): Partial<Event> {
    const lower = text.toLowerCase();

    let category: EventCategory = 'otro';
    let emoji = '📅';
    let cognitiveLoad: 0 | 1 | 2 | 3 = 1;
    let physicalLoad: 0 | 1 | 2 | 3 = 0;
    let location: Location = { type: 'casa', name: 'Casa' };
    let duration = 60;
    let is_sensitive = false;

    // Detect Category & Details
    if (lower.includes('casino') || lower.includes('rambla')) {
      category = 'trabajo';
      emoji = '🎰';
      location = { type: 'rambla_casino', name: 'Casino Rambla' };
      duration = 360;
      cognitiveLoad = 1;
      physicalLoad = 1;
    } else if (lower.includes('ferro') || lower.includes('san juan')) {
      category = 'trabajo';
      emoji = '🍕';
      location = { type: 'ferro_san_juan', name: 'Ferro San Juan' };
      duration = 480;
      cognitiveLoad = 1;
      physicalLoad = 2;
    } else if (lower.includes('estudio') || lower.includes('estudiar') || lower.includes('parcial') || lower.includes('repasar')) {
      category = 'estudio';
      emoji = '📚';
      location = { type: 'casa', name: 'Casa' };
      duration = 120;
      cognitiveLoad = 3;
    } else if (lower.includes('redes') || lower.includes('ayds') || lower.includes('calsoft') || lower.includes('aeec') || lower.includes('facu') || lower.includes('cursada') || lower.includes('clase')) {
      category = 'cursada';
      emoji = '🎓';
      location = { type: 'facultad', name: 'Facultad de Ingeniería' };
      duration = 120;
      cognitiveLoad = 2;
    } else if (lower.includes('gym') || lower.includes('entrenar') || lower.includes('pesas')) {
      category = 'gym';
      emoji = '💪';
      location = { type: 'gym', name: 'Gimnasio' };
      duration = 60;
      physicalLoad = 3;
      cognitiveLoad = 0;
    } else if (lower.includes('cooking') || lower.includes('cocinar') || lower.includes('viandas')) {
      category = 'batch_cooking';
      emoji = '🍲';
      location = { type: 'casa', name: 'Casa' };
      duration = 120;
      physicalLoad = 1;
      cognitiveLoad = 1;
    } else if (lower.includes('juani') || lower.includes('juancito') || lower.includes('mate') || lower.includes('cafe') || lower.includes('cena')) {
      category = 'social';
      emoji = '🤝';
      location = { type: 'cafe_guemes', name: 'Café Güemes' };
      duration = 90;
      cognitiveLoad = 0;
    } else if (lower.includes('cannabis') || lower.includes('faso') || lower.includes('porro') || lower.includes('privado')) {
      category = 'recuperacion';
      emoji = '🌿';
      is_sensitive = true;
      duration = 120;
      cognitiveLoad = 0;
    }

    // Detect Time (e.g., "14:00", "a las 10", "18 hs")
    let hour = 14;
    let minute = 0;

    const timeMatch = lower.match(/(?:a las\s+)?(\d{1,2})(?::(\d{2})|\s*hs)?/);
    if (timeMatch && timeMatch[1]) {
      const parsedHour = parseInt(timeMatch[1], 10);
      if (parsedHour >= 0 && parsedHour <= 23) {
        hour = parsedHour;
        if (timeMatch[2]) {
          minute = parseInt(timeMatch[2], 10);
        }
      }
    }

    // Detect Day of week
    const targetDate = new Date(referenceDate);
    const dayKeywords: Record<string, number> = {
      domingo: 0,
      lunes: 1,
      martes: 2,
      miercoles: 3,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
      sábado: 6,
    };

    for (const [dayName, dayIndex] of Object.entries(dayKeywords)) {
      if (lower.includes(dayName)) {
        const currentDay = targetDate.getDay();
        let diff = dayIndex - currentDay;
        if (diff < 0) diff += 7;
        targetDate.setDate(targetDate.getDate() + diff);
        break;
      }
    }

    if (lower.includes('mañana')) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    targetDate.setHours(hour, minute, 0, 0);

    return {
      name: text,
      category,
      emoji,
      start: targetDate,
      duration,
      is_locked: false,
      location,
      cognitiveLoad,
      physicalLoad,
      is_sensitive,
    };
  }

  /**
   * SmartScheduleImporter: Parses OCR text extracted from SIU Guaraní or WhatsApp schedule messages into events.
   */
  async smartScheduleImporter(rawText: string, weekStartDate: Date = new Date()): Promise<Partial<Event>[]> {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const results: Partial<Event>[] = [];

    for (const line of lines) {
      if (line.length > 5) {
        const ev = await this.parseNaturalLanguageToEvent(line, weekStartDate);
        if (ev.name) {
          results.push(ev);
        }
      }
    }

    return results;
  }

  /**
   * Generates an empathetic morning briefing summarizing today's key priorities.
   */
  async generateMorningBriefing(
    eventsToday: Event[],
    weatherToday: WeatherCondition,
    score: number
  ): Promise<string> {
    const hoursCount = eventsToday.reduce((acc, e) => acc + e.duration, 0) / 60;
    const weatherSummary =
      weatherToday.comfortScore >= 70
        ? `Lindo clima en Mardel (${weatherToday.temperatureCelsius}°C, ComfortScore: ${weatherToday.comfortScore}). Ideal para aire libre.`
        : `Clima fresco o ventoso (${weatherToday.temperatureCelsius}°C, ComfortScore: ${weatherToday.comfortScore}). Buen día para foco bajo techo.`;

    return `¡Buen día Matu! Hoy tenés ${eventsToday.length} eventos planificados (~${hoursCount.toFixed(1)} horas de actividad). ${weatherSummary} Tu Score de bienestar semanal proyecta ${Math.round(score)} puntos.`;
  }
}

export const geminiClient = new GeminiFlashClient();

import { Event, WeatherCondition } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-08b · Usar Mal Clima para Productividad (Peso default: 4)
 * Si hay ventanas de ComfortScore < comfort_indoor_threshold (default: 40)
 * y tiempo libre sin actividad productiva (estudio, batch cooking), se penaliza.
 * Regla de oro: NUNCA penaliza si hay una actividad social planificada con mal clima.
 */
export function computeSC08bPenalty(
  events: Event[],
  weather: WeatherCondition[],
  params: ConstraintParams
): number {
  const badWeatherSlots = weather.filter(w => w.comfortScore < params.comfort_indoor_threshold);
  if (badWeatherSlots.length === 0) return 0;

  const relevantEvents = events.filter(
    e => e.category === 'social' || e.category === 'estudio' || e.category === 'batch_cooking' || e.category === 'trabajo' || e.category === 'cursada'
  );

  let wastedIndoorSlots = 0;

  for (const slot of badWeatherSlots) {
    const slotTime = new Date(slot.timestamp).getTime();

    // Check if slot has any productive or social event
    const activeEvent = relevantEvents.find(e => {
      const eStart = new Date(e.start).getTime();
      const eEnd = eStart + e.duration * 60 * 1000;
      return slotTime >= eStart && slotTime < eEnd;
    });

    if (!activeEvent) {
      wastedIndoorSlots++;
    }
  }

  return Math.min(1, wastedIndoorSlots / badWeatherSlots.length);
}

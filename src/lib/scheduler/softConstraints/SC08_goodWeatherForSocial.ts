import { Event, WeatherCondition } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-08 · Usar Buen Clima para Social/Outdoor (Proactivo) (Peso default: 7)
 * Penaliza si existen ventanas de ComfortScore > comfort_opportunity_threshold (default: 70)
 * y no hay actividad social u outdoor planificada en ese lapso.
 */
export function computeSC08Penalty(
  events: Event[],
  weather: WeatherCondition[],
  params: ConstraintParams
): number {
  const goodWeatherSlots = weather.filter(w => w.comfortScore >= params.comfort_opportunity_threshold);
  if (goodWeatherSlots.length === 0) return 0;

  const socialOrOutdoor = events.filter(
    e => e.category === 'social' || e.weatherSensitivity === 'outdoor_full' || e.isOpenSocialSlot
  );
  if (socialOrOutdoor.length === 0) return 1;

  let missedOpportunities = 0;

  for (const slot of goodWeatherSlots) {
    const slotTime = new Date(slot.timestamp).getTime();
    const hasSocialOrOutdoor = socialOrOutdoor.some(e => {
      const eStart = new Date(e.start).getTime();
      const eEnd = eStart + e.duration * 60 * 1000;
      return slotTime >= eStart && slotTime < eEnd;
    });

    if (!hasSocialOrOutdoor) {
      missedOpportunities++;
    }
  }

  return Math.min(1, missedOpportunities / goodWeatherSlots.length);
}

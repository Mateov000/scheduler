import { Event, WeatherCondition, Contact, Location } from '../types';
import { ConstraintParams } from '../params';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC08_weatherRelocation(
  events: Event[],
  weather: WeatherCondition[],
  params: ConstraintParams
): HCValidationResult {
  for (const ev of events) {
    if (ev.weatherSensitivity === 'outdoor_full') {
      const evStart = new Date(ev.start).getTime();
      const closestWeather = weather.find(w => Math.abs(new Date(w.timestamp).getTime() - evStart) < 30 * 60 * 1000);

      if (closestWeather && closestWeather.comfortScore < params.weather_extreme_threshold) {
        return {
          satisfied: false,
          reason: `El evento al aire libre "${ev.name}" coincide con clima extremo (ComfortScore: ${closestWeather.comfortScore} < ${params.weather_extreme_threshold}) y debe reubicarse en un destino indoor.`,
        };
      }
    }
  }

  return { satisfied: true };
}

export function getIndoorFallbackLocation(event: Event, contacts: Contact[]): Location {
  // Prioridad: depto_contacto si el acompañante tiene depto -> cafe_guemes -> paseo_aldrey
  const companion = contacts.find(c => event.contacts?.includes(c.id) || event.contacts?.includes(c.name));
  if (companion?.hasPrivateApartment) {
    return { type: 'depto_contacto', name: `Depto de ${companion.name}` };
  }
  return { type: 'cafe_guemes', name: 'Café Güemes' };
}

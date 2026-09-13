import { Event, Contact } from '../types';

/**
 * SC-03 · Metas de Horas Semanales por Contacto (Peso default: 6)
 * Penaliza no alcanzar las metas semanales acordadas con amigos (Juancito: 5h, Juani: 3h).
 */
export function computeSC03Penalty(events: Event[], contacts: Contact[]): number {
  const contactsWithGoals = contacts.filter(c => c.weeklyHoursGoal && c.weeklyHoursGoal > 0);
  if (contactsWithGoals.length === 0) return 0;

  let totalDeficitRatio = 0;

  for (const contact of contactsWithGoals) {
    const goalMinutes = (contact.weeklyHoursGoal ?? 0) * 60;
    const spentMinutes = events
      .filter(e => e.category === 'social' && (e.contacts?.includes(contact.id) || e.contacts?.includes(contact.name)))
      .reduce((sum, e) => sum + e.duration, 0);

    if (spentMinutes < goalMinutes) {
      totalDeficitRatio += (goalMinutes - spentMinutes) / goalMinutes;
    }
  }

  return Math.min(1, totalDeficitRatio / contactsWithGoals.length);
}

import { Event, Contact } from '../types';

/**
 * SC-06 · Disponibilidad de Contactos al Proponer Encuentros (Peso default: 3)
 * Penaliza proponer encuentros que solapen con los busySlots de un contacto.
 * Principio P1: Nunca bloquea — solo informa y sugiere.
 */
export function computeSC06Penalty(events: Event[], contacts: Contact[]): number {
  let overlapDuration = 0;
  let totalSocialDuration = 0;

  const socialEvents = events.filter(e => e.category === 'social' && e.contacts && e.contacts.length > 0);

  for (const ev of socialEvents) {
    totalSocialDuration += ev.duration;
    const evDay = new Date(ev.start).getDay();
    const evStartMin = new Date(ev.start).getHours() * 60 + new Date(ev.start).getMinutes();
    const evEndMin = evStartMin + ev.duration;

    for (const contactId of ev.contacts ?? []) {
      const contact = contacts.find(c => c.id === contactId || c.name === contactId);
      if (contact?.busySlots) {
        for (const slot of contact.busySlots) {
          if (slot.dayOfWeek === evDay) {
            const [sh, sm] = slot.start.split(':').map(Number);
            const [eh, em] = slot.end.split(':').map(Number);
            const slotStartMin = sh * 60 + sm;
            const slotEndMin = eh * 60 + em;

            const overlap = Math.max(0, Math.min(evEndMin, slotEndMin) - Math.max(evStartMin, slotStartMin));
            overlapDuration += overlap;
          }
        }
      }
    }
  }

  if (totalSocialDuration === 0) return 0;
  return Math.min(1, overlapDuration / totalSocialDuration);
}

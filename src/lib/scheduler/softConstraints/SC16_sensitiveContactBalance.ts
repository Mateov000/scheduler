import { Event, Contact } from '../types';
import { ConstraintParams } from '../params';

/**
 * SC-16 · Equilibrio con Vínculo Delicado — Lau (Peso default: 0 / inactiva)
 * Opcional: Penaliza semanas con más de sensitive_contact_weekly_limit (default: 2)
 * encuentros con el contacto marcado como sensible (isSensitive: true o nombre "Lau").
 */
export function computeSC16Penalty(events: Event[], contacts: Contact[], params: ConstraintParams): number {
  const sensitiveContact = contacts.find(c => c.isSensitive || c.name.toLowerCase().includes('lau'));
  if (!sensitiveContact) return 0;

  const encounters = events.filter(
    e => e.category === 'social' && (e.contacts?.includes(sensitiveContact.id) || e.contacts?.includes(sensitiveContact.name))
  ).length;

  const limit = params.sensitive_contact_weekly_limit;
  if (encounters <= limit) return 0;

  // Curva suave de penalización: un encuentro extra no es grave, dos ya penaliza más
  const excess = encounters - limit;
  return Math.min(1, Math.pow(excess / 3, 1.5));
}

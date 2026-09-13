import { Event } from './types';

/**
 * Formats a JavaScript Date into an iCalendar UTC string: YYYYMMDDTHHMMSSZ
 */
export function formatIcalDate(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');

  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters for iCalendar text fields according to RFC 5545.
 */
function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant .ics string from an array of events,
 * strictly enforcing privacy masking on sensitive events (Principio P4).
 */
export function generateIcalCalendar(events: Event[], calendarName: string = 'MiMesa'): string {
  const now = new Date();
  const dtstamp = formatIcalDate(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MiMesa//Scheduler v1.1//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcalText(calendarName)}`,
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
  ];

  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(start.getTime() + event.duration * 60000);

    const dtstart = formatIcalDate(start);
    const dtend = formatIcalDate(end);
    const uid = event.is_sensitive
      ? `evt_opaque_${Math.abs(event.id.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0))}@mimesa.scheduler`
      : `${event.id}@mimesa.scheduler`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);

    if (event.is_sensitive) {
      // Sensitive event: Mask completely to "Ocupado" or displayAlias
      const publicTitle = event.displayAlias || 'Ocupado';
      lines.push(`SUMMARY:${escapeIcalText(publicTitle)}`);
      lines.push('DESCRIPTION:');
      lines.push('LOCATION:');
      lines.push('CLASS:PRIVATE');
    } else {
      const summary = event.emoji ? `${event.emoji} ${event.name}` : event.name;
      lines.push(`SUMMARY:${escapeIcalText(summary)}`);

      const descParts: string[] = [];
      if (event.category) descParts.push(`Categoría: ${event.category}`);
      if (event.contacts && event.contacts.length > 0) {
        descParts.push(`Contactos: ${event.contacts.join(', ')}`);
      }
      lines.push(`DESCRIPTION:${escapeIcalText(descParts.join('\n'))}`);

      const locationName = event.location?.name || event.location?.type || '';
      lines.push(`LOCATION:${escapeIcalText(locationName)}`);
      lines.push('CLASS:PUBLIC');
    }

    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser download of the generated .ics file.
 */
export function downloadIcsFile(calendarContent: string, filename: string = 'mimesa-semana.ics'): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([calendarContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { Event } from '../types';
import { HCValidationResult } from './HC01_noOverlap';

export function validateHC07_universitySchedule(originalEvents: Event[], proposedEvents: Event[]): HCValidationResult {
  const uniCourses = originalEvents.filter(e => e.category === 'cursada');

  const proposedMap = new Map(proposedEvents.map(e => [e.id, e]));

  for (const course of uniCourses) {
    const prop = proposedMap.get(course.id);
    if (!prop) {
      return {
        satisfied: false,
        reason: `La cursada universitaria "${course.name}" (${course.id}) no puede ser eliminada.`,
      };
    }
    if (
      new Date(course.start).getTime() !== new Date(prop.start).getTime() ||
      course.duration !== prop.duration
    ) {
      return {
        satisfied: false,
        reason: `La cursada universitaria "${course.name}" tiene horario inamovible durante el cuatrimestre.`,
      };
    }
  }

  return { satisfied: true };
}

import { DayOfWeek, Event, RecurrenceException, RecurrencePattern } from './types';

/**
 * Checks if two dates refer to the same calendar day (Year, Month, Date).
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Expands a RecurrencePattern into concrete Event instances within a given planning window [windowStart, windowEnd].
 */
export function expandRecurrencePattern(
  pattern: RecurrencePattern,
  baseEvent: Event,
  windowStart: Date,
  windowEnd: Date
): Event[] {
  const expanded: Event[] = [];
  const baseStart = new Date(baseEvent.start);
  const baseDuration = baseEvent.duration;
  const baseHours = baseStart.getHours();
  const baseMinutes = baseStart.getMinutes();

  let occurrenceIndex = 0;
  const cursor = new Date(pattern.startDate);
  // Normalize cursor to start of day for iteration
  cursor.setHours(0, 0, 0, 0);

  const endLimit = pattern.until ? new Date(Math.min(pattern.until.getTime(), windowEnd.getTime())) : new Date(windowEnd);
  endLimit.setHours(23, 59, 59, 999);

  // We loop day by day from startDate up to endLimit
  const currentDay = new Date(pattern.startDate);
  currentDay.setHours(0, 0, 0, 0);

  const startDayTime = new Date(pattern.startDate).setHours(0, 0, 0, 0);

  while (currentDay <= endLimit) {
    if (pattern.occurrenceCount && occurrenceIndex >= pattern.occurrenceCount) {
      break;
    }

    let isMatch = false;
    const dayOfWeek = currentDay.getDay() as DayOfWeek;

    switch (pattern.frequency) {
      case 'daily': {
        isMatch = true;
        break;
      }
      case 'weekly': {
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          isMatch = pattern.daysOfWeek.includes(dayOfWeek);
        } else {
          isMatch = dayOfWeek === (new Date(pattern.startDate).getDay() as DayOfWeek);
        }
        break;
      }
      case 'biweekly': {
        const daysDiff = Math.floor((currentDay.getTime() - startDayTime) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(daysDiff / 7);
        if (weekIndex % 2 === 0) {
          if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
            isMatch = pattern.daysOfWeek.includes(dayOfWeek);
          } else {
            isMatch = dayOfWeek === (new Date(pattern.startDate).getDay() as DayOfWeek);
          }
        }
        break;
      }
      case 'monthly': {
        isMatch = currentDay.getDate() === new Date(pattern.startDate).getDate();
        break;
      }
    }

    if (isMatch) {
      occurrenceIndex++;

      // Check if within window
      const occStart = new Date(currentDay);
      occStart.setHours(baseHours, baseMinutes, 0, 0);
      const occEnd = new Date(occStart.getTime() + baseDuration * 60000);

      // Check for exceptions
      const exception = pattern.exceptions.find((ex) => isSameDay(new Date(ex.date), occStart));

      if (exception?.type === 'skip') {
        // Skip this occurrence
      } else {
        let finalStart = occStart;
        let finalDuration = baseDuration;
        let isException = false;
        let overrides: Partial<Event> = {};

        if (exception) {
          isException = true;
          if (exception.type === 'reschedule') {
            if (exception.override?.start) {
              finalStart = new Date(exception.override.start);
            }
            if (exception.override?.duration !== undefined) {
              finalDuration = exception.override.duration;
            }
          } else if (exception.type === 'modify') {
            overrides = exception.override ?? {};
            if (overrides.start) finalStart = new Date(overrides.start);
            if (overrides.duration !== undefined) finalDuration = overrides.duration;
          }
        }

        // Only include if occurrence falls within [windowStart, windowEnd]
        if (finalStart >= windowStart && finalStart <= windowEnd) {
          const dateStr = finalStart.toISOString().slice(0, 10);
          const eventInstance: Event = {
            ...baseEvent,
            ...overrides,
            id: `${baseEvent.id}_occ_${dateStr}_${occurrenceIndex}`,
            start: finalStart,
            duration: finalDuration,
            recurrenceId: pattern.id,
            isRecurrenceException: isException,
            exceptionFor: isException ? occStart : undefined,
          };
          expanded.push(eventInstance);
        }
      }
    }

    // Advance 1 day
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return expanded;
}

/**
 * Adds or replaces an exception in a RecurrencePattern.
 */
export function addRecurrenceException(
  pattern: RecurrencePattern,
  exception: RecurrenceException
): RecurrencePattern {
  const existingIndex = pattern.exceptions.findIndex((ex) =>
    isSameDay(new Date(ex.date), new Date(exception.date))
  );

  const updatedExceptions = [...pattern.exceptions];
  if (existingIndex >= 0) {
    updatedExceptions[existingIndex] = exception;
  } else {
    updatedExceptions.push(exception);
  }

  return {
    ...pattern,
    exceptions: updatedExceptions,
  };
}

/**
 * Removes an exception from a RecurrencePattern for a given date.
 */
export function removeRecurrenceException(
  pattern: RecurrencePattern,
  date: Date
): RecurrencePattern {
  return {
    ...pattern,
    exceptions: pattern.exceptions.filter((ex) => !isSameDay(new Date(ex.date), date)),
  };
}

/**
 * Splits a recurrence pattern into two:
 * 1. The original pattern is terminated just before splitDate.
 * 2. A new pattern is created starting at splitDate with optional new event properties.
 *
 * Used for "Edit from this event forward".
 */
export function splitPatternAtDate(
  pattern: RecurrencePattern,
  baseEvent: Event,
  splitDate: Date,
  newEventOverrides: Partial<Event> = {}
): {
  updatedOriginalPattern: RecurrencePattern;
  newPattern: RecurrencePattern;
  newBaseEvent: Event;
} {
  // Original pattern terminates at end of day before splitDate
  const untilDate = new Date(splitDate);
  untilDate.setDate(untilDate.getDate() - 1);
  untilDate.setHours(23, 59, 59, 999);

  const updatedOriginalPattern: RecurrencePattern = {
    ...pattern,
    until: untilDate,
    exceptions: pattern.exceptions.filter((ex) => new Date(ex.date) <= untilDate),
  };

  const newPatternId = `${pattern.id}_split_${splitDate.toISOString().slice(0, 10)}`;
  const newPattern: RecurrencePattern = {
    ...pattern,
    id: newPatternId,
    startDate: new Date(splitDate),
    exceptions: pattern.exceptions
      .filter((ex) => new Date(ex.date) >= splitDate)
      .map((ex) => ({ ...ex })),
  };

  const newBaseEvent: Event = {
    ...baseEvent,
    ...newEventOverrides,
    id: `${baseEvent.id}_split_${splitDate.toISOString().slice(0, 10)}`,
    recurrenceId: newPatternId,
    start: new Date(splitDate),
  };

  return {
    updatedOriginalPattern,
    newPattern,
    newBaseEvent,
  };
}

/**
 * Business Hours Utility
 * Checks if a date/time falls within business hours and calculates next business hour.
 * Uses client timezone for proper local time handling.
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { getDay, setHours, setMinutes, addDays, startOfDay } from 'date-fns';

/**
 * Day-specific business hours configuration
 */
export interface DayHours {
  start: string; // HH:mm format (e.g., '09:00')
  end: string;   // HH:mm format (e.g., '18:00')
  closed?: boolean;
}

/**
 * Weekly business hours configuration
 * Each day is optional; if not specified, day is considered closed
 */
export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

// Map day of week (0-6, Sunday=0) to day name
const dayNames: (keyof BusinessHours)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Parse time string (HH:mm) into hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Convert hours and minutes to minutes since midnight
 */
function toMinutesSinceMidnight(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

/**
 * Check if a given date/time falls within business hours
 *
 * @param date The date to check (UTC or local)
 * @param businessHours The business hours config from client config
 * @param timezone The client's timezone (e.g., 'America/New_York')
 * @returns true if within business hours
 *
 * @example
 * // 10am Monday in New York - within business hours
 * const monday10am = new Date('2024-01-15T15:00:00Z'); // 10am EST
 * const businessHours = { monday: { start: '09:00', end: '18:00' } };
 * isWithinBusinessHours(monday10am, businessHours, 'America/New_York'); // true
 *
 * @example
 * // 2am Monday in New York - outside business hours
 * const monday2am = new Date('2024-01-15T07:00:00Z'); // 2am EST
 * isWithinBusinessHours(monday2am, businessHours, 'America/New_York'); // false
 *
 * @example
 * // Sunday - closed
 * const sunday = new Date('2024-01-14T15:00:00Z');
 * const hours = { sunday: { start: '00:00', end: '00:00', closed: true } };
 * isWithinBusinessHours(sunday, hours, 'America/New_York'); // false
 */
export function isWithinBusinessHours(
  date: Date,
  businessHours: BusinessHours,
  timezone: string
): boolean {
  // Convert to client timezone
  const zonedDate = toZonedTime(date, timezone);

  // Get day of week and current time
  const dayOfWeek = getDay(zonedDate);
  const dayName = dayNames[dayOfWeek];
  const dayConfig = businessHours[dayName];

  // If no config for this day or explicitly closed, return false
  if (!dayConfig || dayConfig.closed) {
    return false;
  }

  // Parse business hours
  const startTime = parseTime(dayConfig.start);
  const endTime = parseTime(dayConfig.end);

  // Get current time in minutes since midnight
  const currentHours = zonedDate.getHours();
  const currentMinutes = zonedDate.getMinutes();
  const currentTimeMinutes = toMinutesSinceMidnight(currentHours, currentMinutes);

  // Convert start/end to minutes
  const startMinutes = toMinutesSinceMidnight(startTime.hours, startTime.minutes);
  const endMinutes = toMinutesSinceMidnight(endTime.hours, endTime.minutes);

  // Check if current time is within range
  return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
}

/**
 * Get the next available business hour if currently outside hours
 *
 * @param date The starting date
 * @param businessHours The business hours config
 * @param timezone The client's timezone
 * @returns The next Date when business hours begin (in UTC)
 *
 * @example
 * // Called on Sunday - returns Monday 9am
 * const sunday = new Date('2024-01-14T15:00:00Z'); // Sunday 10am EST
 * const hours = {
 *   sunday: { start: '00:00', end: '00:00', closed: true },
 *   monday: { start: '09:00', end: '18:00' }
 * };
 * getNextBusinessHour(sunday, hours, 'America/New_York');
 * // Returns Date representing Monday 9am EST (14:00 UTC)
 *
 * @example
 * // Called at 7am Monday - returns 9am same day
 * const monday7am = new Date('2024-01-15T12:00:00Z'); // 7am EST
 * const hours = { monday: { start: '09:00', end: '18:00' } };
 * getNextBusinessHour(monday7am, hours, 'America/New_York');
 * // Returns Date representing Monday 9am EST
 */
export function getNextBusinessHour(
  date: Date,
  businessHours: BusinessHours,
  timezone: string
): Date {
  // Convert to client timezone for day/time operations
  let zonedDate = toZonedTime(date, timezone);

  // Try up to 8 days to find next open day (in case all days are closed, avoid infinite loop)
  for (let daysAhead = 0; daysAhead < 8; daysAhead++) {
    const checkDate = daysAhead === 0 ? zonedDate : addDays(startOfDay(zonedDate), daysAhead);
    const dayOfWeek = getDay(checkDate);
    const dayName = dayNames[dayOfWeek];
    const dayConfig = businessHours[dayName];

    // Skip if day is closed or not configured
    if (!dayConfig || dayConfig.closed) {
      continue;
    }

    const startTime = parseTime(dayConfig.start);
    const endTime = parseTime(dayConfig.end);

    // For today (daysAhead === 0), check if we can still make it
    if (daysAhead === 0) {
      const currentHours = zonedDate.getHours();
      const currentMinutes = zonedDate.getMinutes();
      const currentTimeMinutes = toMinutesSinceMidnight(currentHours, currentMinutes);
      const startMinutes = toMinutesSinceMidnight(startTime.hours, startTime.minutes);
      const endMinutes = toMinutesSinceMidnight(endTime.hours, endTime.minutes);

      // If current time is before end of business hours
      if (currentTimeMinutes < endMinutes) {
        // If before start, return start time today
        if (currentTimeMinutes < startMinutes) {
          const resultZoned = setMinutes(setHours(zonedDate, startTime.hours), startTime.minutes);
          return fromZonedTime(resultZoned, timezone);
        }
        // If within hours, return current time (already in business hours)
        return date;
      }
      // If past end time, continue to next day
      continue;
    }

    // For future days, return start of business hours on that day
    const futureDateStart = startOfDay(addDays(zonedDate, daysAhead));
    const resultZoned = setMinutes(setHours(futureDateStart, startTime.hours), startTime.minutes);
    return fromZonedTime(resultZoned, timezone);
  }

  // If no open days found in the next week, return original date as fallback
  // This handles the edge case where all days are marked closed
  return date;
}

/**
 * Check if a message type requires business hours restriction
 * Confirmations can be sent anytime, marketing/nurture only during business hours
 */
export function requiresBusinessHours(messageType: string): boolean {
  // Confirmations and reminders can be sent 24/7
  const anytimeTypes = ['confirmation', 'reminder_24h', 'reminder_1h'];

  // Marketing and nurture messages only during business hours
  return !anytimeTypes.includes(messageType);
}

const DAY_IN_MS = 86_400_000;
export const MIN_ARCHIVE_DATE = '1940-01-01';
export const MAX_FORECAST_DAYS_AHEAD = 15;
export const RECENT_PAST_DAYS = 92;

export function todayIso(): string {
  const now = new Date();
  return toIsoDate(now);
}

export function addDaysIso(date: string, days: number): string {
  const parsed = parseIsoDate(date);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return toIsoDate(parsed);
}

export function differenceInCalendarDays(date: string, referenceDate: string): number {
  const target = parseIsoDate(date).getTime();
  const reference = parseIsoDate(referenceDate).getTime();
  return Math.round((target - reference) / DAY_IN_MS);
}

export function formatSelectedDate(date: string): string {
  const parsed = parseIsoDate(date);
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'long',
    timeZone: 'UTC'
  }).format(parsed);
}

function parseIsoDate(value: string): Date {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return date;
}

function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

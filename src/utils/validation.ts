import {
  MAX_FORECAST_DAYS_AHEAD,
  MIN_ARCHIVE_DATE,
  addDaysIso,
  todayIso
} from './date';
import type { WeatherQuery } from '../types/weather';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateWeatherQuery(query: WeatherQuery): void {
  if (!Number.isFinite(query.latitude) || query.latitude < -90 || query.latitude > 90) {
    throw new ValidationError('Latitude must be a number between -90 and 90.');
  }

  if (!Number.isFinite(query.longitude) || query.longitude < -180 || query.longitude > 180) {
    throw new ValidationError('Longitude must be a number between -180 and 180.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
    throw new ValidationError('Please select a valid date.');
  }

  const today = todayIso();
  const latestAllowedDate = addDaysIso(today, MAX_FORECAST_DAYS_AHEAD);

  if (query.date < MIN_ARCHIVE_DATE) {
    throw new ValidationError(`Historical data is available from ${MIN_ARCHIVE_DATE}.`);
  }

  if (query.date > latestAllowedDate) {
    throw new ValidationError(`Forecasts are available up to ${latestAllowedDate}.`);
  }
}

import type {
  OpenMeteoErrorResponse,
  OpenMeteoResponse,
  WeatherDataSource,
  WeatherQuery,
  WeatherResult
} from '../types/weather';
import { RECENT_PAST_DAYS, differenceInCalendarDays, todayIso } from '../utils/date';
import { validateWeatherQuery } from '../utils/validation';

const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive';

export class WeatherApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

export async function getHourlyTemperatures(
  query: WeatherQuery,
  signal?: AbortSignal
): Promise<WeatherResult> {
  validateWeatherQuery(query);

  const source = selectDataSource(query.date);
  const url = buildOpenMeteoUrl(query, source);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    signal
  });

  const payload = (await response.json()) as OpenMeteoResponse | OpenMeteoErrorResponse;

  if (!response.ok || isOpenMeteoError(payload)) {
    const reason = isOpenMeteoError(payload)
      ? payload.reason
      : `Open-Meteo returned HTTP ${response.status}.`;
    throw new WeatherApiError(reason);
  }

  const hours = payload.hourly.time.flatMap((time, index) => {
    const temperature = payload.hourly.temperature_2m[index];
    return temperature == null ? [] : [{ time, temperature }];
  });

  if (hours.length === 0) {
    throw new WeatherApiError('No hourly temperature data was returned for this request.');
  }

  return {
    latitude: payload.latitude,
    longitude: payload.longitude,
    timezone: payload.timezone,
    timezoneAbbreviation: payload.timezone_abbreviation,
    elevation: payload.elevation,
    temperatureUnit: payload.hourly_units.temperature_2m,
    source,
    hours
  };
}

export function selectDataSource(date: string): WeatherDataSource {
  const daysFromToday = differenceInCalendarDays(date, todayIso());
  return daysFromToday >= -RECENT_PAST_DAYS ? 'forecast' : 'archive';
}

function buildOpenMeteoUrl(query: WeatherQuery, source: WeatherDataSource): string {
  const endpoint = source === 'forecast' ? FORECAST_ENDPOINT : ARCHIVE_ENDPOINT;
  const url = new URL(endpoint);

  url.search = new URLSearchParams({
    latitude: String(query.latitude),
    longitude: String(query.longitude),
    hourly: 'temperature_2m',
    start_date: query.date,
    end_date: query.date,
    timezone: 'auto',
    temperature_unit: 'celsius'
  }).toString();

  return url.toString();
}

function isOpenMeteoError(
  payload: OpenMeteoResponse | OpenMeteoErrorResponse
): payload is OpenMeteoErrorResponse {
  return 'error' in payload && payload.error === true;
}

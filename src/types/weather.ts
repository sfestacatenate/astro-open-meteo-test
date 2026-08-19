export interface WeatherQuery {
  latitude: number;
  longitude: number;
  date: string;
}

export interface HourlyTemperature {
  time: string;
  temperature: number;
}

export type WeatherDataSource = 'forecast' | 'archive';

export interface WeatherResult {
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneAbbreviation: string;
  elevation: number;
  temperatureUnit: string;
  source: WeatherDataSource;
  hours: HourlyTemperature[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly_units: {
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: Array<number | null>;
  };
}

export interface OpenMeteoErrorResponse {
  error: true;
  reason: string;
}

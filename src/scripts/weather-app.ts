import { getHourlyTemperatures } from '../services/open-meteo';
import { renderTemperatureChart } from './temperature-chart';
import type { HourlyTemperature, WeatherQuery, WeatherResult } from '../types/weather';
import {
  MAX_FORECAST_DAYS_AHEAD,
  MIN_ARCHIVE_DATE,
  addDaysIso,
  formatSelectedDate,
  todayIso
} from '../utils/date';

export function initWeatherApp(): void {
  const form = getRequiredElement<HTMLFormElement>('[data-weather-form]');
  const dateInput = getRequiredElement<HTMLInputElement>('input[name="date"]');
  const submitButton = getRequiredElement<HTMLButtonElement>('[data-submit-button]');
  const results = getRequiredElement<HTMLElement>('[data-results]');
  const resultsTitle = getRequiredElement<HTMLElement>('[data-results-title]');
  const resultsMeta = getRequiredElement<HTMLElement>('[data-results-meta]');
  const temperatureList = getRequiredElement<HTMLElement>('[data-temperature-list]');
  const temperatureChart = getRequiredElement<SVGSVGElement>('[data-temperature-chart]');
  const errorBox = getRequiredElement<HTMLElement>('[data-error]');

  const today = todayIso();
  dateInput.value = today;
  dateInput.min = MIN_ARCHIVE_DATE;
  dateInput.max = addDaysIso(today, MAX_FORECAST_DAYS_AHEAD);

  let activeController: AbortController | undefined;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    activeController?.abort();
    activeController = new AbortController();

    hideError(errorBox);
    results.hidden = true;
    setLoading(submitButton, true);

    try {
      const query = readQuery(form);
      const weather = await getHourlyTemperatures(query, activeController.signal);
      renderResults(weather, query.date, resultsTitle, resultsMeta, temperatureList, temperatureChart);
      results.hidden = false;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      showError(errorBox, getErrorMessage(error));
    } finally {
      setLoading(submitButton, false);
    }
  });
}

function readQuery(form: HTMLFormElement): WeatherQuery {
  const formData = new FormData(form);

  return {
    latitude: Number(formData.get('latitude')),
    longitude: Number(formData.get('longitude')),
    date: String(formData.get('date') ?? '')
  };
}

function renderResults(
  result: WeatherResult,
  selectedDate: string,
  titleElement: HTMLElement,
  metaElement: HTMLElement,
  listElement: HTMLElement,
  chartElement: SVGSVGElement
): void {
  titleElement.textContent = formatSelectedDate(selectedDate);
  metaElement.textContent = `${result.timezone} · ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)} · ${result.source}`;
  listElement.replaceChildren(...result.hours.map((hour) => createTemperatureRow(hour, result.temperatureUnit)));
  renderTemperatureChart(chartElement, result.hours, result.temperatureUnit);
}

function createTemperatureRow(hour: HourlyTemperature, unit: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'temperature-row';

  const time = document.createElement('time');
  time.dateTime = hour.time;
  time.textContent = formatHour(hour.time);

  const temperature = document.createElement('strong');
  temperature.textContent = `${hour.temperature.toFixed(1)} ${unit}`;

  row.append(time, temperature);
  return row;
}

function formatHour(value: string): string {
  const timePart = value.split('T')[1];
  return timePart?.slice(0, 5) ?? value;
}

function setLoading(button: HTMLButtonElement, isLoading: boolean): void {
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Loading…' : 'Get temperatures';
}

function showError(element: HTMLElement, message: string): void {
  element.textContent = message;
  element.hidden = false;
}

function hideError(element: HTMLElement): void {
  element.hidden = true;
  element.textContent = '';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

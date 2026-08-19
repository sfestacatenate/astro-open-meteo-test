import type { HourlyTemperature } from '../types/weather';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const WIDTH = 760;
const HEIGHT = 360;
const MARGIN = {
  top: 24,
  right: 24,
  bottom: 58,
  left: 64
};
const Y_TICK_COUNT = 5;
const X_LABEL_INTERVAL = 3;

interface ChartPoint {
  x: number;
  y: number;
  hour: HourlyTemperature;
}

export function renderTemperatureChart(
  svg: SVGSVGElement,
  hours: HourlyTemperature[],
  temperatureUnit: string
): void {
  svg.replaceChildren();

  appendAccessibleText(svg, temperatureUnit);

  if (hours.length === 0) {
    return;
  }

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const temperatures = hours.map(({ temperature }) => temperature);
  const scale = createTemperatureScale(Math.min(...temperatures), Math.max(...temperatures));

  const xForIndex = (index: number): number => {
    if (hours.length === 1) {
      return MARGIN.left + plotWidth / 2;
    }

    return MARGIN.left + (index / (hours.length - 1)) * plotWidth;
  };

  const yForTemperature = (temperature: number): number =>
    MARGIN.top + ((scale.max - temperature) / (scale.max - scale.min)) * plotHeight;

  const points: ChartPoint[] = hours.map((hour, index) => ({
    x: xForIndex(index),
    y: yForTemperature(hour.temperature),
    hour
  }));

  const gridGroup = createSvgElement('g', { class: 'chart-grid' });
  const axisGroup = createSvgElement('g', { class: 'chart-axes' });
  const dataGroup = createSvgElement('g', { class: 'chart-data' });

  renderYAxis(gridGroup, axisGroup, scale.min, scale.max, temperatureUnit, yForTemperature);
  renderXAxis(axisGroup, hours, xForIndex);
  renderLine(dataGroup, points, temperatureUnit);

  svg.append(gridGroup, axisGroup, dataGroup);
}

function renderYAxis(
  gridGroup: SVGGElement,
  axisGroup: SVGGElement,
  min: number,
  max: number,
  unit: string,
  yForTemperature: (temperature: number) => number
): void {
  const ticks = createTicks(min, max, Y_TICK_COUNT);
  const plotRight = WIDTH - MARGIN.right;

  for (const tick of ticks) {
    const y = yForTemperature(tick);

    gridGroup.append(
      createSvgElement('line', {
        class: 'chart-grid-line',
        x1: MARGIN.left,
        x2: plotRight,
        y1: y,
        y2: y
      })
    );

    const label = createSvgElement('text', {
      class: 'chart-axis-tick chart-axis-tick--y',
      x: MARGIN.left - 12,
      y,
      'text-anchor': 'end',
      'dominant-baseline': 'middle'
    });
    label.textContent = formatTemperatureTick(tick);
    axisGroup.append(label);
  }

  axisGroup.append(
    createSvgElement('line', {
      class: 'chart-axis-line',
      x1: MARGIN.left,
      x2: MARGIN.left,
      y1: MARGIN.top,
      y2: HEIGHT - MARGIN.bottom
    })
  );

  const axisLabel = createSvgElement('text', {
    class: 'chart-axis-label',
    x: 18,
    y: MARGIN.top + (HEIGHT - MARGIN.top - MARGIN.bottom) / 2,
    transform: `rotate(-90 18 ${MARGIN.top + (HEIGHT - MARGIN.top - MARGIN.bottom) / 2})`,
    'text-anchor': 'middle'
  });
  axisLabel.textContent = `Temperature (${unit})`;
  axisGroup.append(axisLabel);
}

function renderXAxis(
  axisGroup: SVGGElement,
  hours: HourlyTemperature[],
  xForIndex: (index: number) => number
): void {
  const axisY = HEIGHT - MARGIN.bottom;

  axisGroup.append(
    createSvgElement('line', {
      class: 'chart-axis-line',
      x1: MARGIN.left,
      x2: WIDTH - MARGIN.right,
      y1: axisY,
      y2: axisY
    })
  );

  hours.forEach((hour, index) => {
    const isLast = index === hours.length - 1;
    const hourValue = Number.parseInt(formatHour(hour.time).slice(0, 2), 10);
    const shouldRenderLabel = index === 0 || isLast || hourValue % X_LABEL_INTERVAL === 0;

    if (!shouldRenderLabel) {
      return;
    }

    const x = xForIndex(index);

    axisGroup.append(
      createSvgElement('line', {
        class: 'chart-axis-mark',
        x1: x,
        x2: x,
        y1: axisY,
        y2: axisY + 5
      })
    );

    const label = createSvgElement('text', {
      class: 'chart-axis-tick chart-axis-tick--x',
      x,
      y: axisY + 22,
      'text-anchor': 'middle'
    });
    label.textContent = formatHour(hour.time);
    axisGroup.append(label);
  });

  const axisLabel = createSvgElement('text', {
    class: 'chart-axis-label',
    x: MARGIN.left + (WIDTH - MARGIN.left - MARGIN.right) / 2,
    y: HEIGHT - 10,
    'text-anchor': 'middle'
  });
  axisLabel.textContent = 'Hour';
  axisGroup.append(axisLabel);
}

function renderLine(
  dataGroup: SVGGElement,
  points: ChartPoint[],
  temperatureUnit: string
): void {
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  dataGroup.append(
    createSvgElement('path', {
      class: 'chart-line',
      d: pathData,
      fill: 'none'
    })
  );

  for (const point of points) {
    const marker = createSvgElement('circle', {
      class: 'chart-point',
      cx: point.x,
      cy: point.y,
      r: 4,
      tabindex: 0
    });

    const title = createSvgElement('title');
    title.textContent = `${formatHour(point.hour.time)} — ${point.hour.temperature.toFixed(1)} ${temperatureUnit}`;
    marker.append(title);
    dataGroup.append(marker);
  }
}

function appendAccessibleText(svg: SVGSVGElement, temperatureUnit: string): void {
  const title = createSvgElement('title', { id: 'temperature-chart-title' });
  title.textContent = 'Hourly temperature chart';

  const description = createSvgElement('desc', { id: 'temperature-chart-description' });
  description.textContent = `Line chart with hour of the day on the horizontal axis and temperature in ${temperatureUnit} on the vertical axis.`;

  svg.append(title, description);
}

function createTemperatureScale(minTemperature: number, maxTemperature: number): { min: number; max: number } {
  if (minTemperature === maxTemperature) {
    return {
      min: Math.floor(minTemperature - 1),
      max: Math.ceil(maxTemperature + 1)
    };
  }

  const padding = Math.max((maxTemperature - minTemperature) * 0.12, 0.5);
  const rawMin = minTemperature - padding;
  const rawMax = maxTemperature + padding;
  const step = niceStep((rawMax - rawMin) / (Y_TICK_COUNT - 1));

  return {
    min: Math.floor(rawMin / step) * step,
    max: Math.ceil(rawMax / step) * step
  };
}

function createTicks(min: number, max: number, count: number): number[] {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + step * index);
}

function niceStep(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function formatTemperatureTick(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function formatHour(value: string): string {
  const timePart = value.split('T')[1];
  return timePart?.slice(0, 5) ?? value;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes: Record<string, string | number> = {}
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }

  return element;
}

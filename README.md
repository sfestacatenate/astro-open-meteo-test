# Open-Meteo Hourly Temperature

A small Astro + TypeScript application that retrieves hourly temperatures for a geographic coordinate and a selected date using the Open-Meteo APIs.

The project intentionally focuses on one use case rather than presenting a weather dashboard: **latitude + longitude + date → hourly temperatures**.

## Features

- Latitude and longitude input with validation
- Date selection
- Hourly `temperature_2m` values in Celsius
- Responsive SVG line chart with hour on the X axis and temperature on the Y axis
- Automatic timezone resolution for the requested coordinates
- Forecast data for recent/future dates
- Historical Weather API fallback for older dates
- Request cancellation with `AbortController`
- Loading and error states
- Responsive, dependency-light UI
- Strict TypeScript configuration

## Tech stack

- [Astro](https://astro.build/)
- TypeScript
- Native Fetch API
- [Open-Meteo](https://open-meteo.com/)

No client UI framework or charting library is used. Astro's client-side TypeScript is enough for the small amount of interactivity required by this application, while the chart is rendered with native SVG.

## Project structure

```text
src/
├── components/
│   ├── TemperatureChart.astro
│   ├── TemperatureResults.astro
│   └── WeatherSearchForm.astro
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   └── index.astro
├── scripts/
│   ├── temperature-chart.ts
│   └── weather-app.ts
├── services/
│   └── open-meteo.ts
├── styles/
│   └── global.css
├── types/
│   └── weather.ts
└── utils/
    ├── date.ts
    └── validation.ts
```

### Responsibilities

- **components**: markup and presentation boundaries
- **scripts**: browser orchestration, DOM updates, and the dependency-free SVG chart renderer
- **services**: communication with Open-Meteo
- **types**: application and API contracts
- **utils**: reusable date and validation logic

This separation keeps API-specific details out of the UI and makes the core logic easier to test or replace later.

## Open-Meteo requests

For recent dates and forecasts, the application uses:

```text
https://api.open-meteo.com/v1/forecast
```

For older historical dates, it uses:

```text
https://archive-api.open-meteo.com/v1/archive
```

Both requests ask only for:

```text
hourly=temperature_2m
start_date=YYYY-MM-DD
end_date=YYYY-MM-DD
timezone=auto
temperature_unit=celsius
```

`timezone=auto` is important because the selected date is interpreted in the local timezone of the requested coordinates.

## Getting started

### Requirements

- Node.js 22.12 or newer
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Design decisions

### Why no React/Svelte/Vue?

The page has a single form and a single dynamic result list. Adding a UI framework would increase the dependency and runtime surface without providing much value for this use case.

### Why is the API client separate from the UI?

The service exposes a domain-oriented function:

```ts
getHourlyTemperatures(query)
```

The browser script does not need to know endpoint URLs or Open-Meteo response details. This keeps responsibilities clear and makes future changes easier.

### Why native SVG instead of a charting library?

The visualization is intentionally small: one time series with 24-ish points. Native SVG keeps the bundle dependency-light, stays crisp at different resolutions, and makes the rendering logic easy to inspect in a public repository.

### Why are requests cancelled?

Submitting a new query aborts the previous one. This prevents a slower old request from replacing the result of a newer request.

### Why not assume exactly 24 rows?

The application renders every timestamp returned by the API instead of assuming a fixed number of hours. This is safer around timezone and daylight-saving transitions.

## Possible next steps

Good extensions that preserve the small scope of the project:

- Celsius/Fahrenheit selector
- Browser geolocation button
- URL query parameters for shareable searches
- Unit tests for validation and endpoint selection
- End-to-end tests
- A server-side proxy if a future API requires secrets

## Data source

Weather data is provided by Open-Meteo. Check Open-Meteo's current usage terms before deploying the application for commercial use.

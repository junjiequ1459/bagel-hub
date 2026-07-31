import { state } from '../core/state';

export const $ = (id: string) => document.getElementById(id) as HTMLElement;

export const DOM = {
    cityInput: document.getElementById('city-input') as HTMLInputElement,
    searchBtn: document.getElementById('search-btn') as HTMLButtonElement,
    searchOverlay: $('search-overlay'),
    cityBtn: $('tab-search'),
    cityLabel: $('city-label'),
    hubChip: $('hub-chip'),
    unitBtn: $('unit-btn'),
    dictateBtn: $('dictate-btn'),
    locateBtn: $('locate-btn'),
    chipDay: $('chip-day'),
    chipMonth: $('chip-month'),
    chipWeekday: $('chip-weekday'),
    chipDate: $('chip-date'),
    chipTime: $('chip-time'),
    dateTrigger: $('date-trigger') as HTMLButtonElement,
    dateMenu: $('date-menu'),
    temperature: $('temperature'),
    weatherDesc: $('weather-desc'),
    windSummary: $('wind-summary'),
    humiditySummary: $('humidity-summary'),
    msgText: $('msg-text'),
    currentCard: $('current-card'),
    todayRange: $('today-range'),
    todayDesc: $('today-desc'),
    todayIcon: $('today-icon'),
    primaryDayLabel: $('primary-day-label'),
    tomorrowRange: $('tomorrow-range'),
    tomorrowDesc: $('tomorrow-desc'),
    tomorrowIcon: $('tomorrow-icon'),
    secondaryDayLabel: $('secondary-day-label'),
    headSunrise: $('head-sunrise'),
    headSunset: $('head-sunset'),
    hourlyScroll: $('hourly-scroll'),
    dailyScroll: $('daily-scroll'),
    dailyForecastHeading: $('daily-forecast-heading'),
    envSkyline: $('env-skyline'),
    skylineOverlay: $('skyline-overlay'),

    // detail view
    // detail view
    contentWeather: $('content-weather'),
    contentDetails: $('content-details'),
    tabWeather: $('tab-weather'),
    tabDetails: $('tab-details'),
    updatedAt: $('updated-at'),
    feelsLike: $('feels-like'),
    uvIndex: $('uv-index'),
    humidity: $('humidity'),
    pressure: $('pressure'),
    windDetail: $('wind-detail'),
    visibility: $('visibility'),
    airQualityTile: $('air-quality-tile'),
    airQualityScore: $('air-quality-score'),
    airQualityLabel: $('air-quality-label'),
    windGustTile: $('wind-gust-tile'),
    windGust: $('wind-gust'),
    windGustState: $('wind-gust-state'),
    cloudCover: $('cloud-cover'),
    dewPointTile: $('dew-point-tile'),
    dewPoint: $('dew-point'),
    dewPointModal: $('dew-point-modal'),
    dewPointModalClose: $('dew-modal-close') as HTMLButtonElement,
    dewPointModalLocation: $('dew-modal-location'),
    dewPointDetailCurrent: $('dew-detail-current'),
    dewPointDetailDate: $('dew-detail-date'),
    dewPointDetailComfort: $('dew-detail-comfort'),
    dewPointDetailSummary: $('dew-detail-summary'),
    dewPointCurrentHumidity: $('dew-current-humidity'),
    dewPointHourly: $('dew-hourly'),
    dewPointDailySummary: $('dew-daily-summary'),
    dewPointComparisonCopy: $('dew-comparison-copy'),
    dewPointComparison: $('dew-comparison'),
    sunshineDuration: $('sunshine-duration'),
    sunshineTile: $('sunshine-tile') as HTMLButtonElement,
    sunModal: $('sun-modal'),
    sunSheet: $('sun-sheet'),
    sunClose: $('sun-close') as HTMLButtonElement,
    sunDate: $('sun-date'),
    firstLight: $('first-light'),
    lastLight: $('last-light'),
    sunriseDetail: $('sunrise-detail'),
    sunsetDetail: $('sunset-detail'),
    totalDaylight: $('total-daylight'),
    longestDaylight: $('longest-daylight'),
    sunriseAverages: $('sunrise-averages'),
    rainPeak: $('rain-peak'),
    rainHourly: $('rain-hourly'),
    sunrise: $('sunrise'),
    sunset: $('sunset'),
    arcDashed: $('arc-dashed'),
    arcSolid: $('arc-solid'),
    arcFill: $('arc-fill'),
    arcSun: $('arc-sun')
};

export const airQualityModal = $('air-quality-modal') as HTMLDivElement;

export const airQualityClose = $('aq-modal-close') as HTMLButtonElement;

export const airQualityHero = $('aq-hero');

export const airQualityScaleMarker = $('aq-map-current');

export const airQualityMap = $('aq-map');

export const airQualityMapTiles = $('aq-map-tiles');

export const airQualityMapCanvas = $('aq-map-canvas') as HTMLCanvasElement;

export const airQualityMapStatus = $('aq-map-status');

export const airQualityMapMarker = airQualityMap.querySelector<HTMLElement>('.aq-map-marker')!;

export const windMapModal = $('wind-map-modal') as HTMLDivElement;

export const windCanvas = $('wind-canvas') as HTMLCanvasElement;

export const windMapClose = $('wind-map-close');

export const windMapInfo = $('wind-map-info');

export const windTiles = $('wind-tiles') as HTMLDivElement;

export const windBadge = $('wind-loc-badge');

export const windBadgeDir = $('wind-badge-dir');

export const windBadgeSpeed = $('wind-badge-speed');

export const windLayersBtn = $('wind-layers-btn');

export const windLayersMenu = $('wind-layers-menu');
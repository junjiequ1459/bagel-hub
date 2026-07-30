// Weather — illustrated-scene mini-app for the Bagel Hub.
// Data: Open-Meteo (no API key required).

const $ = (id: string) => document.getElementById(id) as HTMLElement;

const DOM = {
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

interface ForecastResponse {
    timezone?: string;
    current: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        is_day: number;
        weather_code: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
        surface_pressure: number;
        dew_point_2m: number;
        cloud_cover: number;
        wind_gusts_10m: number;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
        is_day: number[];
        uv_index: number[];
        visibility: number[];
        wind_speed_10m: number[];
        wind_direction_10m: number[];
        precipitation_probability: number[];
        relative_humidity_2m: number[];
        apparent_temperature: number[];
        surface_pressure: number[];
        cloud_cover: number[];
        dew_point_2m: number[];
        wind_gusts_10m: number[];
    };
    daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        sunrise: string[];
        sunset: string[];
        precipitation_probability_max: number[];
        uv_index_max: number[];
        wind_speed_10m_max: number[];
        wind_direction_10m_dominant: number[];
        sunshine_duration: number[];
    };
}

interface AirQualityResponse {
    current?: {
        us_aqi?: number;
        pm2_5?: number;
        pm10?: number;
        carbon_monoxide?: number;
        nitrogen_dioxide?: number;
        sulphur_dioxide?: number;
        ozone?: number;
    };
}

interface AirQualityMapPoint {
    lat: number;
    lon: number;
    aqi: number;
}

interface HistoricalSunResponse {
    daily?: {
        time: string[];
        sunrise: string[];
        sunset: string[];
    };
}

let currentData: ForecastResponse | null = null;
let currentLat = 0;
let currentLon = 0;
let currentLocName: string = '';
let currentAirQuality: AirQualityResponse | null = null;
let currentSunHistory: HistoricalSunResponse | null | undefined = undefined;
let selectedDayIndex = 0;
let currentCoords: { lat: number; lon: number } | null = null;
let airQualityMapPoints: AirQualityMapPoint[] = [];
let airQualityMapCacheKey = '';
let airQualityMapRequestId = 0;
let weatherRequestId = 0;
let tempUnit: 'C' | 'F' = (localStorage.getItem('tempUnit') as 'C' | 'F') || 'C';

import skylinesData from './skylines/index.json';

const skylineSvgMap = import.meta.glob<string>('./skylines/*.svg', { query: '?raw', import: 'default', eager: true });

let skylinesByCity: Record<string, string> = {};
Object.entries(skylinesData).forEach(([key, name]) => {
    skylinesByCity[(name as string).toLowerCase()] = key;
});
skylinesByCity['nyc'] = 'new-york';
skylinesByCity['new york city'] = 'new-york';
skylinesByCity['la'] = 'los-angeles';
skylinesByCity['washington dc'] = 'washington-dc';
skylinesByCity['washington, d.c.'] = 'washington-dc';
skylinesByCity['dc'] = 'washington-dc';
skylinesByCity['rio'] = 'rio-de-janeiro';

const getSkylineId = (cityName: string): string | undefined => {
    if (!cityName) return undefined;
    const norm = cityName.toLowerCase().trim();
    if (skylinesByCity[norm]) return skylinesByCity[norm];
    for (const [name, key] of Object.entries(skylinesByCity)) {
        if (norm.includes(name) || name.includes(norm)) {
            return key;
        }
    }
    return undefined;
};

const getTemp = (c: number) => tempUnit === 'F' ? c * 9/5 + 32 : c;

// WMO weather codes → description + emoji icons
const WEATHER_CODES: Record<number, { desc: string; day: string; night: string }> = {
    0:  { desc: 'Clear', day: '☀️', night: '🌙' },
    1:  { desc: 'Mostly Clear', day: '🌤️', night: '🌙' },
    2:  { desc: 'Partly Cloudy', day: '⛅', night: '☁️' },
    3:  { desc: 'Overcast', day: '☁️', night: '☁️' },
    45: { desc: 'Fog', day: '🌫️', night: '🌫️' },
    48: { desc: 'Freezing Fog', day: '🌫️', night: '🌫️' },
    51: { desc: 'Light Drizzle', day: '🌦️', night: '🌧️' },
    53: { desc: 'Drizzle', day: '🌧️', night: '🌧️' },
    55: { desc: 'Heavy Drizzle', day: '🌧️', night: '🌧️' },
    56: { desc: 'Freezing Drizzle', day: '🌧️', night: '🌧️' },
    57: { desc: 'Freezing Drizzle', day: '🌧️', night: '🌧️' },
    61: { desc: 'Light Rain', day: '🌦️', night: '🌧️' },
    63: { desc: 'Rain', day: '🌧️', night: '🌧️' },
    65: { desc: 'Heavy Rain', day: '🌧️', night: '🌧️' },
    66: { desc: 'Freezing Rain', day: '🌧️', night: '🌧️' },
    67: { desc: 'Freezing Rain', day: '🌧️', night: '🌧️' },
    71: { desc: 'Light Snow', day: '🌨️', night: '🌨️' },
    73: { desc: 'Snow', day: '🌨️', night: '🌨️' },
    75: { desc: 'Heavy Snow', day: '❄️', night: '❄️' },
    77: { desc: 'Snow Grains', day: '❄️', night: '❄️' },
    80: { desc: 'Light Showers', day: '🌦️', night: '🌧️' },
    81: { desc: 'Showers', day: '🌧️', night: '🌧️' },
    82: { desc: 'Heavy Showers', day: '⛈️', night: '⛈️' },
    85: { desc: 'Snow Showers', day: '🌨️', night: '🌨️' },
    86: { desc: 'Heavy Snow Showers', day: '❄️', night: '❄️' },
    95: { desc: 'Thunderstorm', day: '⛈️', night: '⛈️' },
    96: { desc: 'Thunderstorm', day: '⛈️', night: '⛈️' },
    99: { desc: 'Severe Thunderstorm', day: '⛈️', night: '⛈️' }
};

const getWeather = (code: number) => WEATHER_CODES[code] || { desc: 'Unknown', day: '❔', night: '❔' };
const getIcon = (code: number, isDay: boolean) => (isDay ? getWeather(code).day : getWeather(code).night);

// ---- helpers ----

const sceneTheme = (code: number, isDay: boolean): string => {
    const suffix = isDay ? 'day' : 'night';
    if (code <= 1) return `theme-clear-${suffix}`;
    if (code <= 3 || code === 45 || code === 48) return `theme-cloudy-${suffix}`;
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return `theme-snow-${suffix}`;
    return `theme-rain-${suffix}`; // drizzle, rain, showers, storms
};

const weatherSceneClass = (code: number): string => {
    if (code >= 95) return 'weather-storm';
    if (code === 45 || code === 48) return 'weather-fog';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'weather-snow';
    if (code >= 51) return 'weather-rain';
    if (code >= 2) return 'weather-cloudy';
    return 'weather-clear';
};

const setTheme = (code: number, isDay: boolean, windSpeed: number) => {
    document.body.className = document.body.className
        .split(' ')
        .filter((c) => c && !c.startsWith('theme-') && !c.startsWith('weather-'))
        .concat(sceneTheme(code, isDay), weatherSceneClass(code))
        .join(' ');

    const cloudDuration = Math.max(11, Math.min(42, 42 - windSpeed * 0.55));
    document.documentElement.style.setProperty('--cloud-duration', `${cloudDuration.toFixed(1)}s`);
    document.documentElement.style.setProperty('--cloud-front-duration', `${(cloudDuration * 0.72).toFixed(1)}s`);
    const windmillDuration = Math.max(1.5, 20 - windSpeed * 0.6);
    document.documentElement.style.setProperty('--wind-speed', `${windmillDuration.toFixed(1)}s`);
};

const compass = (deg: number): string =>
    ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];

const beaufort = (kmh: number): number => {
    const limits = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
    for (let i = 0; i < limits.length; i++) if (kmh < limits[i]) return i;
    return 12;
};

const beaufortName = (level: number): string => {
    const names = ['Calm', 'Light Air', 'Light Breeze', 'Gentle Breeze', 'Moderate Breeze', 'Fresh Breeze', 'Strong Breeze', 'High Wind', 'Gale', 'Strong Gale', 'Storm', 'Violent Storm', 'Hurricane'];
    return names[Math.min(Math.max(0, level), 12)] || 'Calm';
};

const clock = (iso: string): string => iso.slice(11, 16);

const minutesFromIso = (iso: string): number => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
const clockFromMinutes = (minutes: number): string => {
    const value = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
};
const durationLabel = (minutes: number): string => `${Math.floor(minutes / 60)} hr ${Math.round(minutes % 60)} min`;
const timeLabel = (minutes: number): string => {
    const value = ((Math.round(minutes) % 1440) + 1440) % 1440;
    const hour = Math.floor(value / 60);
    return `${hour % 12 || 12}:${String(value % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

// Civil twilight (sun at -6°) provides the familiar "first/last light" times.
// We anchor it to the API sunrise/sunset so the displayed clock stays in the location's timezone.
const civilTwilightOffset = (date: string, latitude: number): number => {
    const day = Math.floor((Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) - Date.UTC(Number(date.slice(0, 4)), 0, 0)) / 86400000);
    const declination = 23.44 * Math.sin((2 * Math.PI * (284 + day)) / 365) * Math.PI / 180;
    const lat = latitude * Math.PI / 180;
    const hourAngle = (altitude: number) => Math.acos(Math.max(-1, Math.min(1, (Math.sin(altitude * Math.PI / 180) - Math.sin(lat) * Math.sin(declination)) / (Math.cos(lat) * Math.cos(declination)))));
    return Math.max(0, (hourAngle(-6) - hourAngle(-0.833)) * 180 / Math.PI * 4);
};

const timezoneOffsetMinutes = (date: string, timezone?: string): number => {
    if (!timezone) return 0;
    const instant = new Date(`${date}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(instant);
    const part = (type: string) => Number(parts.find((item) => item.type === type)?.value || 0);
    return (Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute')) - instant.getTime()) / 60000;
};

const solarTimes = (date: string, latitude: number, longitude: number, timezone?: string) => {
    const year = Number(date.slice(0, 4));
    const day = Math.floor((Date.UTC(year, Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) - Date.UTC(year, 0, 0)) / 86400000);
    const gamma = (2 * Math.PI / 365) * (day - 1);
    const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
    const lat = latitude * Math.PI / 180;
    const hourAngle = Math.acos(Math.max(-1, Math.min(1, Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(declination)) - Math.tan(lat) * Math.tan(declination)))) * 180 / Math.PI;
    const offset = timezoneOffsetMinutes(date, timezone);
    return { sunrise: 720 - 4 * (longitude + hourAngle) - equation + offset, sunset: 720 - 4 * (longitude - hourAngle) - equation + offset };
};

const uvLabel = (uv: number): string => {
    if (uv < 3) return 'Low';
    if (uv < 6) return 'Moderate';
    if (uv < 8) return 'High';
    if (uv < 11) return 'Very High';
    return 'Extreme';
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dateParts = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return { y, m, d, weekday: WEEKDAYS[wd], month: MONTHS[m - 1] };
};

const nowHourIndex = (data: ForecastResponse): number => {
    const key = `${data.current.time.slice(0, 13)}:00`;
    const i = data.hourly.time.findIndex((t) => t >= key);
    return i < 0 ? 0 : i;
};

const dayHourStartIndex = (data: ForecastResponse, dayIndex: number): number => {
    if (dayIndex === 0) return nowHourIndex(data);
    const date = data.daily.time[dayIndex];
    const i = data.hourly.time.findIndex((time) => time.startsWith(`${date}T00`));
    return i < 0 ? Math.min(dayIndex * 24, data.hourly.time.length - 1) : i;
};

const representativeHourIndex = (data: ForecastResponse, dayIndex: number): number => {
    if (dayIndex === 0) return nowHourIndex(data);
    const date = data.daily.time[dayIndex];
    const noon = data.hourly.time.findIndex((time) => time.startsWith(`${date}T12`));
    return noon < 0 ? dayHourStartIndex(data, dayIndex) : noon;
};

const dayLabel = (data: ForecastResponse, dayIndex: number): string => {
    if (dayIndex === 0) return 'Today';
    if (dayIndex === 1) return 'Tomorrow';
    const p = dateParts(data.daily.time[dayIndex]);
    return `${p.weekday.slice(0, 3)}, ${p.month.slice(0, 3)} ${p.d}`;
};

// ---- header / chips ----

const renderHeader = (data: ForecastResponse, name: string) => {
    DOM.cityLabel.textContent = name;

    document.title = `Weather — ${name}`;

    const p = dateParts(data.daily.time[selectedDayIndex]);
    DOM.chipDay.textContent = String(p.d);
    DOM.chipMonth.textContent = p.month.slice(0, 3);
    DOM.chipWeekday.textContent = p.weekday;
    DOM.chipDate.textContent = `${p.month.slice(0, 3)} ${p.d}`;
    updateLocationClock();
};

const updateLocationClock = () => {
    const timezone = currentData?.timezone;
    try {
        DOM.chipTime.textContent = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            hourCycle: 'h23',
            minute: '2-digit'
        }).format(new Date());
    } catch {
        DOM.chipTime.textContent = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            hourCycle: 'h23',
            minute: '2-digit'
        }).format(new Date());
    }
};

window.setInterval(updateLocationClock, 30000);

// ---- current card ----

const radarMessage = (data: ForecastResponse, dayIndex: number, code: number): string => {
    const prob = data.daily.precipitation_probability_max[dayIndex];
    if (code >= 95) return dayIndex === 0
        ? 'Thunderstorms nearby — stay indoors if you can'
        : 'Thunderstorms expected — keep plans flexible';
    if (code >= 51 && code <= 82) return dayIndex === 0
        ? 'Rain is falling — grab an umbrella before heading out'
        : 'Rain expected — plan to bring an umbrella';
    if (prob >= 70) return 'Rain likely — keep an umbrella handy';
    if (prob >= 30) return 'Showers possible later — the radar is watching the sky';
    return 'No rain expected — enjoy the day';
};

const renderCurrent = (data: ForecastResponse) => {
    const { current, daily } = data;
    const h = representativeHourIndex(data, selectedDayIndex);
    const isToday = selectedDayIndex === 0;
    const code = isToday ? current.weather_code : data.hourly.weather_code[h];
    const temperature = isToday ? current.temperature_2m : data.hourly.temperature_2m[h];
    const windSpeed = isToday ? current.wind_speed_10m : data.hourly.wind_speed_10m[h];
    const windDirection = isToday ? current.wind_direction_10m : data.hourly.wind_direction_10m[h];
    const humidity = isToday ? current.relative_humidity_2m : data.hourly.relative_humidity_2m[h];
    const w = getWeather(code);

    DOM.temperature.textContent = String(Math.round(getTemp(temperature)));
    DOM.weatherDesc.textContent = w.desc;
    DOM.windSummary.textContent = `${compass(windDirection)} Wind Level ${beaufort(windSpeed)}`;
    DOM.humiditySummary.textContent = `Humidity ${Math.round(humidity)}%`;
    DOM.msgText.textContent = radarMessage(data, selectedDayIndex, code);

    DOM.todayRange.textContent = `${Math.round(getTemp(daily.temperature_2m_max[selectedDayIndex]))}°/${Math.round(getTemp(daily.temperature_2m_min[selectedDayIndex]))}°`;
    DOM.todayDesc.textContent = getWeather(daily.weather_code[selectedDayIndex]).desc;
    DOM.todayIcon.textContent = getIcon(daily.weather_code[selectedDayIndex], true);
    DOM.primaryDayLabel.textContent = dayLabel(data, selectedDayIndex);

    const nextDayIndex = selectedDayIndex + 1;
    if (nextDayIndex < daily.time.length) {
        DOM.tomorrowRange.textContent = `${Math.round(getTemp(daily.temperature_2m_max[nextDayIndex]))}°/${Math.round(getTemp(daily.temperature_2m_min[nextDayIndex]))}°`;
        DOM.tomorrowDesc.textContent = getWeather(daily.weather_code[nextDayIndex]).desc;
        DOM.tomorrowIcon.textContent = getIcon(daily.weather_code[nextDayIndex], true);
        DOM.secondaryDayLabel.textContent = dayLabel(data, nextDayIndex);
    } else {
        DOM.tomorrowRange.textContent = '—';
        DOM.tomorrowDesc.textContent = 'End of forecast';
        DOM.tomorrowIcon.textContent = '·';
        DOM.secondaryDayLabel.textContent = 'Next day';
    }

    DOM.headSunrise.textContent = clock(daily.sunrise[selectedDayIndex]);
    DOM.headSunset.textContent = clock(daily.sunset[selectedDayIndex]);
};

// ---- hourly strip with temperature curve ----

const svgEl = (tag: string) => document.createElementNS('http://www.w3.org/2000/svg', tag);

const buildCurve = (
    values: number[], colWidth: number, height: number, pad: number, color: string, activeIndex: number
): SVGSVGElement => {
    const svg = svgEl('svg') as SVGSVGElement;
    const width = values.length * colWidth;
    svg.setAttribute('class', 'chart-svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1);
    const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

    const points = values.map((v, i) => `${i * colWidth + colWidth / 2},${y(v).toFixed(1)}`).join(' ');
    const line = svgEl('polyline');
    line.setAttribute('points', points);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    svg.appendChild(line);

    values.forEach((v, i) => {
        const dot = svgEl('circle');
        dot.setAttribute('cx', String(i * colWidth + colWidth / 2));
        dot.setAttribute('cy', y(v).toFixed(1));
        dot.setAttribute('r', '3.5');
        dot.setAttribute('fill', i === activeIndex ? color : '#ffffff');
        dot.setAttribute('stroke', color);
        dot.setAttribute('stroke-width', '2');
        svg.appendChild(dot);
    });
    return svg;
};

const renderHourly = (data: ForecastResponse) => {
    const { hourly } = data;
    const start = dayHourStartIndex(data, selectedDayIndex);
    const count = Math.min(24, hourly.time.length - start);
    const isDesktop = window.matchMedia('(min-width: 760px)').matches;

    let COL = 96;
    if (isDesktop && DOM.hourlyScroll) {
        const containerWidth = DOM.hourlyScroll.clientWidth || 1080;
        COL = Math.max(96, Math.floor(containerWidth / 7));
    }

    const temps: number[] = [];
    const cols = document.createElement('div');
    cols.className = 'cols';

    for (let k = 0; k < count; k++) {
        const i = start + k;
        temps.push(getTemp(hourly.temperature_2m[i]));

        const col = document.createElement('div');
        col.className = 'col hour-col';
        if (isDesktop) {
            col.style.width = `${COL}px`;
            col.style.minWidth = `${COL}px`;
        }

        const t = document.createElement('div');
        t.className = 'c-temp';
        t.textContent = `${Math.round(getTemp(hourly.temperature_2m[i]))}°`;

        const gap = document.createElement('div');
        gap.style.height = '64px';

        const icon = document.createElement('div');
        icon.className = 'c-icon';
        icon.textContent = getIcon(hourly.weather_code[i], hourly.is_day[i] === 1);

        const cond = document.createElement('div');
        cond.className = 'c-cond';
        cond.textContent = getWeather(hourly.weather_code[i]).desc;

        const sub = document.createElement('div');
        sub.className = 'c-sub';
        sub.innerHTML = `${compass(hourly.wind_direction_10m[i])} wind<br>Level ${beaufort(hourly.wind_speed_10m[i])}`;

        const time = document.createElement('div');
        const isNow = selectedDayIndex === 0 && k === 0;
        time.className = 'c-time' + (isNow ? ' now' : '');
        time.textContent = isNow ? 'Now' : `${hourly.time[i].slice(11, 13)}:00`;

        col.append(t, gap, icon, cond, sub, time);
        cols.appendChild(col);
    }

    DOM.hourlyScroll.innerHTML = '';
    const band = document.createElement('div');
    band.className = 'band';
    
    band.appendChild(cols);
    DOM.hourlyScroll.appendChild(band);

    if (DOM.contentWeather.hidden || cols.children.length === 0) {
        DOM.hourlyScroll.scrollLeft = 0;
        return;
    }

    const firstCol = cols.children[0] as HTMLElement;
    const gapEl = firstCol.children[1] as HTMLElement;
    const gapTop = gapEl.offsetTop;

    const chart = buildCurve(temps, COL, 64, 12, '#3d8bf2', 0);
    chart.style.position = 'absolute';
    chart.style.top = `${gapTop}px`;
    
    band.insertBefore(chart, cols);
    if (!isDesktop) {
        DOM.hourlyScroll.scrollLeft = 0;
    }
};

// ---- 15-day strip ----

const renderDaily = (data: ForecastResponse) => {
    const { daily } = data;
    const n = daily.time.length;
    const isDesktop = window.matchMedia('(min-width: 760px)').matches;

    if (DOM.dailyForecastHeading) {
        DOM.dailyForecastHeading.textContent = '15-Day Forecast';
    }

    let COL = 108;
    if (isDesktop && DOM.dailyScroll) {
        const containerWidth = DOM.dailyScroll.clientWidth || 1080;
        COL = Math.max(108, Math.floor(containerWidth / 7));
    }

    const cols = document.createElement('div');
    cols.className = 'cols';

    for (let i = 0; i < n; i++) {
        const col = document.createElement('div');
        col.className = 'col day-col';
        if (isDesktop) {
            col.style.width = `${COL}px`;
            col.style.minWidth = `${COL}px`;
        }
        col.classList.toggle('selected-day', i === selectedDayIndex);
        col.setAttribute('role', 'button');
        col.setAttribute('tabindex', '0');
        col.setAttribute(
            'aria-label',
            `${dayLabel(data, i)}, ${getWeather(daily.weather_code[i]).desc}, high ${Math.round(getTemp(daily.temperature_2m_max[i]))} degrees, low ${Math.round(getTemp(daily.temperature_2m_min[i]))} degrees. Click to select date.`
        );

        const selectDay = () => {
            selectedDayIndex = i;
            renderSelectedDay(data);
        };

        col.addEventListener('click', selectDay);
        col.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectDay();
            }
        });

        const p = dateParts(daily.time[i]);
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : p.weekday.slice(0, 3);

        const week = document.createElement('div');
        week.className = 'd-week';
        week.textContent = label;

        const date = document.createElement('div');
        date.className = 'd-date';
        date.textContent = `${String(p.m).padStart(2, '0')}/${String(p.d).padStart(2, '0')}`;

        const icon = document.createElement('div');
        icon.className = 'c-icon';
        icon.textContent = getIcon(daily.weather_code[i], true);

        const cond = document.createElement('div');
        cond.className = 'c-cond';
        cond.textContent = getWeather(daily.weather_code[i]).desc;

        const tempsRow = document.createElement('div');
        tempsRow.className = 'c-temp-row';

        const hi = document.createElement('span');
        hi.className = 'c-temp';
        hi.textContent = `${Math.round(getTemp(daily.temperature_2m_max[i]))}°`;

        const sep = document.createElement('span');
        sep.className = 'c-temp-sep';
        sep.textContent = '/';

        const lo = document.createElement('span');
        lo.className = 'c-temp c-temp-lo';
        lo.textContent = `${Math.round(getTemp(daily.temperature_2m_min[i]))}°`;

        tempsRow.append(hi, sep, lo);

        const subEl = document.createElement('div');
        subEl.className = 'c-sub';
        subEl.innerHTML = `${compass(daily.wind_direction_10m_dominant[i])} wind<br>Level ${beaufort(daily.wind_speed_10m_max[i])}`;

        col.append(week, date, icon, cond, tempsRow, subEl);
        cols.appendChild(col);
    }

    DOM.dailyScroll.innerHTML = '';
    const band = document.createElement('div');
    band.className = 'band';

    band.appendChild(cols);
    DOM.dailyScroll.appendChild(band);
};



// ---- detail view ----

const advice = (data: ForecastResponse): string => {
    const hi = data.daily.temperature_2m_max[selectedDayIndex];
    const code = data.daily.weather_code[selectedDayIndex];
    if (code >= 95) return 'Thunderstorms expected — best to stay indoors and unplug sensitive electronics.';
    if (code >= 51 && code <= 82) return 'Wet weather expected — waterproof shoes and an umbrella will serve you well.';
    if (hi >= 30) return 'Hot weather — light summer clothing like short sleeves and shorts recommended.';
    if (hi >= 22) return 'Comfortable and warm — a t-shirt or light shirt is all you need.';
    if (hi >= 12) return 'A bit cool — bring a light jacket or sweater for the breeze.';
    if (hi >= 2) return 'Cold today — a warm coat and layers are recommended.';
    return 'Freezing conditions — bundle up with a heavy coat, hat, and gloves.';
};

const renderSunArc = (data: ForecastResponse) => {
    // Quadratic curve P0(15,72) P1(110,-26) P2(205,72)
    const P0 = { x: 15, y: 72 };
    const P1 = { x: 110, y: -26 };
    const P2 = { x: 205, y: 72 };
    const pt = (t: number) => ({
        x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x,
        y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y
    });

    const full = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`;
    DOM.arcDashed.setAttribute('d', full);

    const sunrise = data.daily.sunrise[selectedDayIndex];
    const sunset = data.daily.sunset[selectedDayIndex];
    const sunriseMin = parseInt(sunrise.slice(11, 13), 10) * 60 + parseInt(sunrise.slice(14, 16), 10);
    const sunsetMin = parseInt(sunset.slice(11, 13), 10) * 60 + parseInt(sunset.slice(14, 16), 10);
    const nowMin = parseInt(data.current.time.slice(11, 13), 10) * 60 + parseInt(data.current.time.slice(14, 16), 10);
    const frac = selectedDayIndex === 0
        ? Math.max(0, Math.min(1, (nowMin - sunriseMin) / Math.max(sunsetMin - sunriseMin, 1)))
        : 0.5;

    // approximate partial curve with line segments
    const steps = 24;
    const upto = Math.max(1, Math.round(frac * steps));
    let solid = `M ${P0.x} ${P0.y}`;
    let last = P0;
    for (let s = 1; s <= upto; s++) {
        const p = pt((s / steps) * frac * (steps / upto)); // even spacing to frac
        solid += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        last = { x: p.x, y: p.y };
    }
    DOM.arcSolid.setAttribute('d', solid);
    DOM.arcFill.setAttribute('d', `${solid} L ${last.x.toFixed(1)} 72 L ${P0.x} 72 Z`);

    const sunVisible = selectedDayIndex > 0 || data.current.is_day === 1;
    DOM.arcSun.setAttribute('cx', sunVisible ? last.x.toFixed(1) : '-20');
    DOM.arcSun.setAttribute('cy', sunVisible ? last.y.toFixed(1) : '-20');
};

const renderDaylightDetails = (data: ForecastResponse) => {
    const { daily } = data;
    const sunrise = minutesFromIso(daily.sunrise[selectedDayIndex]);
    const sunset = minutesFromIso(daily.sunset[selectedDayIndex]);
    const total = Math.max(0, sunset - sunrise);
    const offset = currentCoords ? civilTwilightOffset(daily.time[selectedDayIndex], currentCoords.lat) : 30;
    DOM.sunDate.textContent = selectedDayIndex === 0 ? 'Today' : dayLabel(data, selectedDayIndex);
    DOM.firstLight.textContent = timeLabel(sunrise - offset);
    DOM.lastLight.textContent = timeLabel(sunset + offset);
    DOM.totalDaylight.textContent = durationLabel(total);
    DOM.sunriseDetail.textContent = timeLabel(sunrise);
    DOM.sunsetDetail.textContent = timeLabel(sunset);
    DOM.sunrise.textContent = timeLabel(sunrise);
    DOM.sunset.textContent = timeLabel(sunset);

    if (currentSunHistory === undefined) {
        DOM.longestDaylight.textContent = 'Loading location-based historical averages…';
        DOM.sunriseAverages.innerHTML = '<div class="sunrise-averages-loading">Loading yearly sunrise and sunset data…</div>';
        return;
    }
    if (!currentSunHistory?.daily) {
        DOM.longestDaylight.textContent = 'Historical daylight data unavailable';
        DOM.sunriseAverages.innerHTML = '<div class="sunrise-averages-loading">Unable to load yearly sunrise and sunset data for this location.</div>';
        return;
    }

    const history = currentSunHistory.daily;
    const monthly = MONTHS.map((month, monthIndex) => {
        const values = history.time.reduce<{ sunrise: number[]; sunset: number[] }>((result, date, index) => {
            if (Number(date.slice(5, 7)) === monthIndex + 1) {
                result.sunrise.push(minutesFromIso(history.sunrise[index]));
                result.sunset.push(minutesFromIso(history.sunset[index]));
            }
            return result;
        }, { sunrise: [], sunset: [] });
        return {
            month: month.slice(0, 3),
            sunrise: values.sunrise.reduce((sum, value) => sum + value, 0) / Math.max(values.sunrise.length, 1),
            sunset: values.sunset.reduce((sum, value) => sum + value, 0) / Math.max(values.sunset.length, 1)
        };
    });
    const longestIndex = history.time.reduce((best, _, index) => {
        const duration = minutesFromIso(history.sunset[index]) - minutesFromIso(history.sunrise[index]);
        const bestDuration = minutesFromIso(history.sunset[best]) - minutesFromIso(history.sunrise[best]);
        return duration > bestDuration ? index : best;
    }, 0);
    const longestDate = dateParts(history.time[longestIndex]);
    DOM.longestDaylight.textContent = `Longest daylight: ${durationLabel(minutesFromIso(history.sunset[longestIndex]) - minutesFromIso(history.sunrise[longestIndex]))} ${longestDate.month.slice(0, 3)} ${longestDate.d}`;

    const earliest = Math.min(...monthly.map((item) => item.sunrise));
    const latest = Math.max(...monthly.map((item) => item.sunset));
    const scale = Math.max(1, latest - earliest);
    DOM.sunriseAverages.innerHTML = '';
    monthly.forEach(({ month, sunrise: monthSunrise, sunset: monthSunset }) => {
        const row = document.createElement('div');
        row.className = 'sunrise-average-row';
        const start = ((monthSunrise - earliest) / scale) * 100;
        const span = ((monthSunset - monthSunrise) / scale) * 100;
        row.innerHTML = `<strong>${month}</strong><time>${timeLabel(monthSunrise)}</time><span class="sunrise-average-track"><i style="--sun-start:${start}%;--sun-span:${span}%"></i></span><time>${timeLabel(monthSunset)}</time>`;
        DOM.sunriseAverages.appendChild(row);
    });
};

const getAirQualityBand = (aqi: number) => {
    if (aqi <= 50) {
        return {
            label: 'Good',
            level: 'good',
            color: '#45a86d',
            soft: '#e5f5eb',
            description: 'The air is clear for most people.',
            advice: 'Enjoy normal outdoor activities. Air pollution is expected to pose little or no risk.'
        };
    }
    if (aqi <= 100) {
        return {
            label: 'Moderate',
            level: 'moderate',
            color: '#d4a72c',
            soft: '#fff4ce',
            description: 'Air quality is acceptable for most people.',
            advice: 'People who are unusually sensitive to air pollution may want to reduce long or intense outdoor activity.'
        };
    }
    if (aqi <= 150) {
        return {
            label: 'Unhealthy for sensitive groups',
            level: 'caution',
            color: '#e67f2d',
            soft: '#ffead8',
            description: 'Some people may feel effects from the air.',
            advice: 'Children, older adults, and people with heart or lung conditions should shorten intense outdoor activity.'
        };
    }
    if (aqi <= 200) {
        return {
            label: 'Unhealthy',
            level: 'high',
            color: '#df554f',
            soft: '#ffe3e1',
            description: 'The air may affect everyone.',
            advice: 'Reduce prolonged or heavy outdoor exertion. Sensitive groups should consider moving activities indoors.'
        };
    }
    if (aqi <= 300) {
        return {
            label: 'Very unhealthy',
            level: 'severe',
            color: '#8d5aa4',
            soft: '#eee2f3',
            description: 'Health effects are more likely for everyone.',
            advice: 'Avoid strenuous outdoor activity. Keep windows closed if outdoor air is noticeably smoky or irritating.'
        };
    }
    return {
        label: 'Hazardous',
        level: 'severe',
        color: '#7c384d',
        soft: '#f0dfe4',
        description: 'The air presents a serious health risk.',
        advice: 'Stay indoors with cleaner filtered air when possible and follow guidance from local health officials.'
    };
};

const airQualityModal = $('air-quality-modal') as HTMLDivElement;
const airQualityClose = $('aq-modal-close') as HTMLButtonElement;
const airQualityHero = $('aq-hero');
const airQualityScaleMarker = $('aq-map-current');
document.body.appendChild(airQualityModal);

const setPollutant = (valueId: string, barId: string, raw: number | undefined, scaleMax: number) => {
    const value = $(valueId);
    const bar = $(barId);
    if (!Number.isFinite(raw)) {
        value.textContent = '—';
        bar.style.setProperty('--pollutant-level', '0%');
        return;
    }

    const number = raw as number;
    value.textContent = number >= 100 ? String(Math.round(number)) : number.toFixed(1);
    bar.style.setProperty('--pollutant-level', `${Math.min(100, Math.max(2, number / scaleMax * 100))}%`);
};

const renderAirQualityDetail = (data: AirQualityResponse | null) => {
    const current = data?.current;
    const aqi = current?.us_aqi;
    $('aq-modal-location').textContent = currentLocName || 'Current conditions';

    if (!Number.isFinite(aqi)) {
        $('aq-detail-score').textContent = '—';
        $('aq-detail-category').textContent = 'Unavailable';
        $('aq-detail-description').textContent = 'Air-quality data is not available right now.';
        $('aq-detail-advice').textContent = 'Try again after refreshing the weather for this location.';
        airQualityHero.style.setProperty('--aq-progress', '0%');
        airQualityScaleMarker.hidden = true;
    } else {
        const rounded = Math.round(aqi as number);
        const band = getAirQualityBand(rounded);
        $('aq-detail-score').textContent = String(rounded);
        $('aq-detail-category').textContent = band.label;
        $('aq-detail-description').textContent = band.description;
        $('aq-detail-advice').textContent = band.advice;
        airQualityModal.style.setProperty('--aq-color', band.color);
        airQualityModal.style.setProperty('--aq-soft', band.soft);
        airQualityHero.style.setProperty('--aq-progress', `${Math.min(100, rounded / 3)}%`);
        airQualityScaleMarker.textContent = String(rounded);
        airQualityScaleMarker.style.setProperty('--aq-position', `${Math.min(98, Math.max(2, rounded / 5))}%`);
        airQualityScaleMarker.hidden = false;
    }

    setPollutant('aq-pm25', 'aq-pm25-bar', current?.pm2_5, 75);
    setPollutant('aq-pm10', 'aq-pm10-bar', current?.pm10, 150);
    setPollutant('aq-ozone', 'aq-ozone-bar', current?.ozone, 200);
    setPollutant('aq-no2', 'aq-no2-bar', current?.nitrogen_dioxide, 200);
    setPollutant('aq-co', 'aq-co-bar', current?.carbon_monoxide, 10000);
    setPollutant('aq-so2', 'aq-so2-bar', current?.sulphur_dioxide, 350);
};

const renderAirQualityDetailLoading = () => {
    $('aq-modal-location').textContent = currentLocName || 'Updating location';
    $('aq-detail-score').textContent = '—';
    $('aq-detail-category').textContent = 'Updating';
    $('aq-detail-description').textContent = `Loading air quality for ${currentLocName || 'this location'}.`;
    $('aq-detail-advice').textContent = 'The latest pollutant levels and health guidance will appear shortly.';
    airQualityModal.style.setProperty('--aq-color', '#3d8bf2');
    airQualityModal.style.setProperty('--aq-soft', '#e7f2ff');
    airQualityHero.style.setProperty('--aq-progress', '0%');
    airQualityScaleMarker.hidden = true;
    setPollutant('aq-pm25', 'aq-pm25-bar', undefined, 75);
    setPollutant('aq-pm10', 'aq-pm10-bar', undefined, 150);
    setPollutant('aq-ozone', 'aq-ozone-bar', undefined, 200);
    setPollutant('aq-no2', 'aq-no2-bar', undefined, 200);
    setPollutant('aq-co', 'aq-co-bar', undefined, 10000);
    setPollutant('aq-so2', 'aq-so2-bar', undefined, 350);
};

const renderAirQuality = (data: AirQualityResponse | null) => {
    currentAirQuality = data;
    if (!airQualityModal.hidden) renderAirQualityDetail(data);
    if (selectedDayIndex !== 0) {
        DOM.airQualityScore.textContent = '—';
        DOM.airQualityLabel.textContent = 'Current day only';
        DOM.airQualityTile.dataset.level = 'unknown';
        return;
    }

    const aqi = data?.current?.us_aqi;
    const pm25 = data?.current?.pm2_5;

    if (!Number.isFinite(aqi)) {
        DOM.airQualityScore.textContent = '—';
        DOM.airQualityLabel.textContent = 'Unavailable';
        DOM.airQualityTile.dataset.level = 'unknown';
        return;
    }

    const rounded = Math.round(aqi as number);
    const band = getAirQualityBand(rounded);
    const tileLabel = rounded <= 100 ? band.label : rounded <= 150 ? 'Sensitive groups' : band.label;

    DOM.airQualityScore.textContent = String(rounded);
    DOM.airQualityLabel.textContent = Number.isFinite(pm25)
        ? `${tileLabel} · PM2.5 ${Math.round(pm25 as number)}`
        : tileLabel;
    DOM.airQualityTile.dataset.level = band.level;
};

const renderRainDetails = (data: ForecastResponse) => {
    const start = dayHourStartIndex(data, selectedDayIndex);
    const count = Math.min(24, data.hourly.time.length - start);
    const probabilities = data.hourly.precipitation_probability.slice(start, start + count);
    const peak = probabilities.length ? Math.max(...probabilities) : 0;

    DOM.rainPeak.textContent = `Peak ${Math.round(peak)}%`;
    DOM.rainHourly.innerHTML = '';

    probabilities.forEach((rawProbability, offset) => {
        const probability = Number.isFinite(rawProbability) ? Math.max(0, Math.min(100, rawProbability)) : 0;
        const isNow = selectedDayIndex === 0 && offset === 0;
        const time = isNow ? 'Now' : data.hourly.time[start + offset].slice(11, 13);
        const item = document.createElement('div');
        item.className = 'rain-hour';
        item.setAttribute('role', 'listitem');
        item.setAttribute('aria-label', `${time === 'Now' ? 'Now' : `${time}:00`}: ${Math.round(probability)} percent chance of rain`);
        item.style.setProperty('--rain-height', `${Math.max(3, probability)}%`);

        const chance = document.createElement('strong');
        chance.className = 'rain-chance';
        chance.textContent = `${Math.round(probability)}%`;

        const track = document.createElement('span');
        track.className = 'rain-bar-track';
        const fill = document.createElement('span');
        fill.className = 'rain-bar-fill';
        track.appendChild(fill);

        const hour = document.createElement('span');
        hour.className = 'rain-time';
        hour.textContent = time === 'Now' ? time : `${time}:00`;

        item.append(chance, track, hour);
        DOM.rainHourly.appendChild(item);
    });
};

const dewPointComfort = (dewPointC: number) => {
    if (dewPointC < 10) {
        return {
            label: 'Dry air',
            summary: 'The air should feel dry and comfortable.',
            level: 'unknown',
            color: '#3d8bf2',
            soft: '#e7f2ff'
        };
    }
    if (dewPointC < 16) {
        return {
            label: 'Comfortable moisture',
            summary: 'The air should feel comfortable for most people.',
            level: 'good',
            color: '#2aa87d',
            soft: '#e6f7ef'
        };
    }
    if (dewPointC < 19) {
        return {
            label: 'Slightly humid',
            summary: 'You may begin to notice extra moisture in the air.',
            level: 'moderate',
            color: '#b98514',
            soft: '#fff4d9'
        };
    }
    if (dewPointC < 22) {
        return {
            label: 'Muggy',
            summary: 'The air will feel humid, especially during activity.',
            level: 'caution',
            color: '#d56516',
            soft: '#ffeadb'
        };
    }
    return {
        label: 'Very humid',
        summary: 'The air will feel very muggy and moisture-heavy.',
        level: 'severe',
        color: '#cf4c56',
        soft: '#ffe7e9'
    };
};

const dewPointDayIndices = (data: ForecastResponse, dayIndex: number): number[] => {
    const date = data.daily.time[dayIndex];
    const indices: number[] = [];
    data.hourly.time.forEach((time, index) => {
        if (time.startsWith(date)) indices.push(index);
    });
    return indices;
};

const averageValues = (values: number[]): number =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const renderDewPointDetails = (data: ForecastResponse) => {
    const representativeIndex = representativeHourIndex(data, selectedDayIndex);
    const isToday = selectedDayIndex === 0;
    const dewPointC = isToday ? data.current.dew_point_2m : data.hourly.dew_point_2m[representativeIndex];
    const humidity = isToday ? data.current.relative_humidity_2m : data.hourly.relative_humidity_2m[representativeIndex];
    const comfort = dewPointComfort(dewPointC);
    const dayIndices = dewPointDayIndices(data, selectedDayIndex);
    const dayDewPoints = dayIndices.map((index) => data.hourly.dew_point_2m[index]).filter(Number.isFinite);
    const dayHumidity = dayIndices.map((index) => data.hourly.relative_humidity_2m[index]).filter(Number.isFinite);
    const minDew = dayDewPoints.length ? Math.min(...dayDewPoints) : dewPointC;
    const maxDew = dayDewPoints.length ? Math.max(...dayDewPoints) : dewPointC;
    const averageHumidity = averageValues(dayHumidity);

    DOM.dewPointModalLocation.textContent = currentLocName || 'Current conditions';
    DOM.dewPointDetailCurrent.textContent = `${Math.round(getTemp(dewPointC))}°`;
    DOM.dewPointDetailDate.textContent = dayLabel(data, selectedDayIndex);
    DOM.dewPointDetailComfort.textContent = comfort.label;
    DOM.dewPointDetailSummary.textContent = comfort.summary;
    DOM.dewPointCurrentHumidity.textContent = `Humidity ${Math.round(humidity)}%`;
    DOM.dewPointDailySummary.textContent =
        `${dayLabel(data, selectedDayIndex)}, average humidity is ${Math.round(averageHumidity)}%. ` +
        `The dew point ranges from ${Math.round(getTemp(minDew))}° to ${Math.round(getTemp(maxDew))}°.`;
    DOM.dewPointTile.dataset.level = comfort.level;
    DOM.dewPointModal.style.setProperty('--dew-accent', comfort.color);
    DOM.dewPointModal.style.setProperty('--dew-soft', comfort.soft);

    const hourlyStart = dayHourStartIndex(data, selectedDayIndex);
    const hourlyCount = Math.min(24, data.hourly.time.length - hourlyStart);
    const hourlyDewPoints = data.hourly.dew_point_2m.slice(hourlyStart, hourlyStart + hourlyCount);
    const chartMin = hourlyDewPoints.length ? Math.min(...hourlyDewPoints) : dewPointC;
    const chartMax = hourlyDewPoints.length ? Math.max(...hourlyDewPoints) : dewPointC;
    const chartRange = Math.max(4, chartMax - chartMin);
    DOM.dewPointHourly.replaceChildren();

    hourlyDewPoints.forEach((hourlyDewPoint, offset) => {
        const index = hourlyStart + offset;
        const isNow = isToday && offset === 0;
        const item = document.createElement('div');
        item.className = 'dew-hour';
        item.setAttribute('role', 'listitem');
        item.setAttribute(
            'aria-label',
            `${isNow ? 'Now' : `${data.hourly.time[index].slice(11, 16)}`}: dew point ${Math.round(getTemp(hourlyDewPoint))} degrees, humidity ${Math.round(data.hourly.relative_humidity_2m[index])} percent`
        );

        const value = document.createElement('strong');
        value.textContent = `${Math.round(getTemp(hourlyDewPoint))}°`;
        const track = document.createElement('span');
        track.className = 'dew-hour-track';
        const fill = document.createElement('span');
        fill.className = 'dew-hour-fill';
        fill.style.setProperty('--dew-height', `${25 + ((hourlyDewPoint - chartMin) / chartRange) * 70}%`);
        track.appendChild(fill);
        const humidityLabel = document.createElement('span');
        humidityLabel.className = 'dew-hour-humidity';
        humidityLabel.textContent = `${Math.round(data.hourly.relative_humidity_2m[index])}% RH`;
        const time = document.createElement('span');
        time.className = 'dew-hour-time';
        time.textContent = isNow ? 'Now' : data.hourly.time[index].slice(11, 16);
        item.append(value, track, humidityLabel, time);
        DOM.dewPointHourly.appendChild(item);
    });

    const comparisonIndex = selectedDayIndex < data.daily.time.length - 1
        ? selectedDayIndex + 1
        : Math.max(0, selectedDayIndex - 1);
    const comparisonIndices = dewPointDayIndices(data, comparisonIndex);
    const selectedAverage = averageValues(dayDewPoints);
    const comparisonAverage = averageValues(
        comparisonIndices.map((index) => data.hourly.dew_point_2m[index]).filter(Number.isFinite)
    );
    const selectedLabel = dayLabel(data, selectedDayIndex);
    const comparisonLabel = dayLabel(data, comparisonIndex);
    const difference = selectedAverage - comparisonAverage;
    const comparisonDescription = Math.abs(difference) < 0.5
        ? `The average dew point is about the same as ${comparisonLabel.toLowerCase()}.`
        : `The average dew point is ${Math.abs(Math.round(getTemp(selectedAverage) - getTemp(comparisonAverage)))}° ${difference > 0 ? 'higher' : 'lower'} than ${comparisonLabel.toLowerCase()}.`;
    DOM.dewPointComparisonCopy.textContent = comparisonDescription;
    DOM.dewPointComparison.replaceChildren();

    [
        { label: selectedLabel, value: selectedAverage },
        { label: comparisonLabel, value: comparisonAverage }
    ].forEach(({ label, value }) => {
        const row = document.createElement('div');
        row.className = 'dew-comparison-row';
        const rowLabel = document.createElement('span');
        rowLabel.className = 'dew-comparison-label';
        rowLabel.textContent = label;
        const track = document.createElement('span');
        track.className = 'dew-comparison-track';
        const fill = document.createElement('span');
        fill.className = 'dew-comparison-fill';
        fill.style.setProperty('--dew-width', `${Math.min(100, Math.max(8, ((value + 20) / 50) * 100))}%`);
        track.appendChild(fill);
        const rowValue = document.createElement('strong');
        rowValue.textContent = `${Math.round(getTemp(value))}°`;
        row.append(rowLabel, track, rowValue);
        DOM.dewPointComparison.appendChild(row);
    });
};

const renderDetail = (data: ForecastResponse) => {
    const { current, daily } = data;
    const h = representativeHourIndex(data, selectedDayIndex);
    const isToday = selectedDayIndex === 0;

    DOM.updatedAt.textContent = isToday
        ? `Updated ${clock(current.time)}`
        : `Midday forecast · ${dayLabel(data, selectedDayIndex)}`;
    
    const apparentTemperature = isToday ? current.apparent_temperature : data.hourly.apparent_temperature[h];
    const humidity = isToday ? current.relative_humidity_2m : data.hourly.relative_humidity_2m[h];
    const pressure = isToday ? current.surface_pressure : data.hourly.surface_pressure[h];
    const windSpeed = isToday ? current.wind_speed_10m : data.hourly.wind_speed_10m[h];
    const windDirection = isToday ? current.wind_direction_10m : data.hourly.wind_direction_10m[h];
    const cloudCover = isToday ? current.cloud_cover : data.hourly.cloud_cover[h];
    const dewPoint = isToday ? current.dew_point_2m : data.hourly.dew_point_2m[h];
    const windGust = isToday ? current.wind_gusts_10m : data.hourly.wind_gusts_10m[h];

    DOM.feelsLike.textContent = `${Math.round(getTemp(apparentTemperature))}°`;
    DOM.uvIndex.textContent = uvLabel(data.hourly.uv_index[h]);
    DOM.humidity.textContent = `${Math.round(humidity)}%`;
    DOM.pressure.textContent = `${Math.round(pressure)} hPa`;
    DOM.windDetail.textContent = `${compass(windDirection)} Level ${beaufort(windSpeed)}`;
    DOM.cloudCover.textContent = `${Math.round(cloudCover)}%`;
    DOM.dewPoint.textContent = `${Math.round(getTemp(dewPoint))}°`;
    DOM.dewPointTile.dataset.level = dewPointComfort(dewPoint).level;
    DOM.sunshineDuration.textContent = `${(daily.sunshine_duration[selectedDayIndex] / 3600).toFixed(1)} hr`;

    const gust = Math.round(windGust);
    const gustBand = gust < 40
        ? { label: 'Low', level: 'good' }
        : gust < 60
            ? { label: 'Use caution', level: 'moderate' }
            : gust < 80
                ? { label: 'Strong gusts', level: 'high' }
                : { label: 'High wind warning', level: 'severe' };
    DOM.windGust.textContent = `${gust} km/h`;
    DOM.windGustState.textContent = gustBand.label;
    DOM.windGustTile.dataset.level = gustBand.level;

    const visKm = data.hourly.visibility[h] / 1000;
    DOM.visibility.textContent = visKm >= 10 ? `${Math.round(visKm)} km` : `${visKm.toFixed(1)} km`;

    renderDaylightDetails(data);
    if (!DOM.dewPointModal.hidden) renderDewPointDetails(data);
    renderAirQuality(currentAirQuality);
    renderRainDetails(data);
    renderSunArc(data);
};

const setDateMenuOpen = (open: boolean) => {
    DOM.dateMenu.hidden = !open;
    DOM.dateTrigger.setAttribute('aria-expanded', String(open));
};

const renderDateMenu = (data: ForecastResponse) => {
    DOM.dateMenu.innerHTML = '';

    data.daily.time.forEach((date, index) => {
        const p = dateParts(date);
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'date-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(index === selectedDayIndex));
        option.setAttribute(
            'aria-label',
            `${dayLabel(data, index)}, ${getWeather(data.daily.weather_code[index]).desc}, high ${Math.round(getTemp(data.daily.temperature_2m_max[index]))} degrees, low ${Math.round(getTemp(data.daily.temperature_2m_min[index]))} degrees`
        );

        const day = document.createElement('span');
        day.className = 'date-option-day';
        day.textContent = String(p.d);

        const copy = document.createElement('span');
        copy.className = 'date-option-copy';
        const title = document.createElement('span');
        title.className = 'date-option-title';
        title.textContent = dayLabel(data, index);
        const sub = document.createElement('span');
        sub.className = 'date-option-sub';
        sub.textContent = `${p.month} ${p.d}`;
        copy.append(title, sub);

        const weather = document.createElement('span');
        weather.className = 'date-option-weather';
        const icon = document.createElement('span');
        icon.className = 'date-option-icon';
        icon.textContent = getIcon(data.daily.weather_code[index], true);
        const range = document.createElement('span');
        range.className = 'date-option-range';
        range.textContent = `${Math.round(getTemp(data.daily.temperature_2m_max[index]))}° / ${Math.round(getTemp(data.daily.temperature_2m_min[index]))}°`;
        weather.append(icon, range);

        option.append(day, copy, weather);
        option.addEventListener('click', () => {
            selectedDayIndex = index;
            renderSelectedDay(data);
            setDateMenuOpen(false);
            DOM.dateTrigger.focus();
        });
        DOM.dateMenu.appendChild(option);
    });
};

const renderSelectedDay = (data: ForecastResponse) => {
    const h = representativeHourIndex(data, selectedDayIndex);
    const isToday = selectedDayIndex === 0;
    const code = isToday ? data.current.weather_code : data.hourly.weather_code[h];
    const windSpeed = isToday ? data.current.wind_speed_10m : data.hourly.wind_speed_10m[h];
    const isDay = isToday ? data.current.is_day === 1 : true;

    setTheme(code, isDay, windSpeed);
    renderHeader(data, currentLocName);
    renderCurrent(data);
    renderHourly(data);
    renderDaily(data);
    renderDetail(data);
    renderDateMenu(data);
    DOM.dateTrigger.setAttribute('aria-label', `Choose forecast date. Selected ${dayLabel(data, selectedDayIndex)}`);
};

// ---- air quality detail and nearby map ----

const airQualityMap = $('aq-map');
const airQualityMapTiles = $('aq-map-tiles');
const airQualityMapCanvas = $('aq-map-canvas') as HTMLCanvasElement;
const airQualityMapStatus = $('aq-map-status');
const airQualityMapMarker = airQualityMap.querySelector<HTMLElement>('.aq-map-marker')!;
let airQualityMapView: { zoom: number; topLeftX: number; topLeftY: number } | null = null;
let airQualityMapState = { latitude: 0, longitude: 0, zoom: 8, panX: 0, panY: 0 };
let airQualityResizeTimer: number | undefined;
let airQualityMapRenderFrame: number | null = null;

const longitudeToPixel = (longitude: number, zoom: number) =>
    ((longitude + 180) / 360) * (2 ** zoom) * 256;

const latitudeToPixel = (latitude: number, zoom: number) => {
    const bounded = Math.max(-85.0511, Math.min(85.0511, latitude));
    const radians = bounded * Math.PI / 180;
    return (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * (2 ** zoom) * 256;
};

const aqiRgb = (aqi: number): [number, number, number] => {
    if (aqi <= 50) return [69, 168, 109];
    if (aqi <= 100) return [230, 189, 61];
    if (aqi <= 150) return [239, 141, 50];
    if (aqi <= 200) return [232, 93, 87];
    if (aqi <= 300) return [156, 99, 179];
    return [124, 56, 77];
};

const renderAirQualityMapTiles = (latitude: number, longitude: number, resetView = false) => {
    const rect = airQualityMap.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    if (
        resetView ||
        airQualityMapState.latitude !== latitude ||
        airQualityMapState.longitude !== longitude
    ) {
        airQualityMapState = {
            latitude,
            longitude,
            zoom: rect.width < 600 ? 7 : 8,
            panX: 0,
            panY: 0
        };
    }

    const zoom = airQualityMapState.zoom;
    const centerX = longitudeToPixel(longitude, zoom);
    const centerY = latitudeToPixel(latitude, zoom);
    const topLeftX = centerX - rect.width / 2 - airQualityMapState.panX;
    const topLeftY = centerY - rect.height / 2 - airQualityMapState.panY;
    const startX = Math.floor(topLeftX / 256);
    const endX = Math.floor((topLeftX + rect.width) / 256);
    const startY = Math.floor(topLeftY / 256);
    const endY = Math.floor((topLeftY + rect.height) / 256);
    const tileCount = 2 ** zoom;

    airQualityMapView = { zoom, topLeftX, topLeftY };
    airQualityMapTiles.innerHTML = '';

    for (let tileY = startY; tileY <= endY; tileY++) {
        if (tileY < 0 || tileY >= tileCount) continue;
        for (let tileX = startX; tileX <= endX; tileX++) {
            const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
            const image = document.createElement('img');
            image.alt = '';
            image.decoding = 'async';
            image.draggable = false;
            image.src = `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`;
            image.style.left = `${tileX * 256 - topLeftX}px`;
            image.style.top = `${tileY * 256 - topLeftY}px`;
            airQualityMapTiles.appendChild(image);
        }
    }

    airQualityMapMarker.style.left = `${centerX - topLeftX}px`;
    airQualityMapMarker.style.top = `${centerY - topLeftY}px`;
};

const drawAirQualityHeatMap = (points: AirQualityMapPoint[]) => {
    const rect = airQualityMap.getBoundingClientRect();
    const view = airQualityMapView;
    if (!view || rect.width < 1 || rect.height < 1) return;

    const dpr = window.devicePixelRatio || 1;
    airQualityMapCanvas.width = Math.round(rect.width * dpr);
    airQualityMapCanvas.height = Math.round(rect.height * dpr);
    const context = airQualityMapCanvas.getContext('2d');
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.globalCompositeOperation = 'source-over';

    points.forEach((point) => {
        const x = longitudeToPixel(point.lon, view.zoom) - view.topLeftX;
        const y = latitudeToPixel(point.lat, view.zoom) - view.topLeftY;
        const radius = Math.max(90, Math.min(rect.width, rect.height) * 0.34);
        const [r, g, b] = aqiRgb(point.aqi);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.58)`);
        gradient.addColorStop(0.48, `rgba(${r}, ${g}, ${b}, 0.34)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        context.fillStyle = gradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });
};

const renderAirQualityMapViewport = () => {
    const { latitude, longitude } = airQualityMapState;
    renderAirQualityMapTiles(latitude, longitude);
    const currentAqi = currentAirQuality?.current?.us_aqi;
    const points = airQualityMapPoints.length > 0
        ? airQualityMapPoints
        : Number.isFinite(currentAqi)
            ? [{ lat: latitude, lon: longitude, aqi: currentAqi as number }]
            : [];
    drawAirQualityHeatMap(points);
};

const scheduleAirQualityMapRender = () => {
    if (airQualityMapRenderFrame !== null) return;
    airQualityMapRenderFrame = requestAnimationFrame(() => {
        airQualityMapRenderFrame = null;
        renderAirQualityMapViewport();
    });
};

const resetAirQualityMap = () => {
    if (!currentCoords) return;
    renderAirQualityMapTiles(currentCoords.lat, currentCoords.lon, true);
    drawAirQualityHeatMap(airQualityMapPoints);
};

let airQualityPointerId: number | null = null;
let airQualityPointerX = 0;
let airQualityPointerY = 0;

airQualityMap.addEventListener('pointerdown', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a')) return;
    airQualityPointerId = event.pointerId;
    airQualityPointerX = event.clientX;
    airQualityPointerY = event.clientY;
    airQualityMap.setPointerCapture(event.pointerId);
    airQualityMap.classList.add('is-dragging', 'is-interacting');
});

airQualityMap.addEventListener('pointermove', (event) => {
    if (event.pointerId !== airQualityPointerId) return;
    const dx = event.clientX - airQualityPointerX;
    const dy = event.clientY - airQualityPointerY;
    airQualityPointerX = event.clientX;
    airQualityPointerY = event.clientY;
    airQualityMapState.panX += dx;
    airQualityMapState.panY += dy;
    scheduleAirQualityMapRender();
});

const finishAirQualityMapDrag = (event: PointerEvent) => {
    if (event.pointerId !== airQualityPointerId) return;
    airQualityPointerId = null;
    airQualityMap.classList.remove('is-dragging');
};

airQualityMap.addEventListener('pointerup', finishAirQualityMapDrag);
airQualityMap.addEventListener('pointercancel', finishAirQualityMapDrag);

airQualityMap.addEventListener('keydown', (event) => {
    const panStep = 48;
    if (event.key === 'ArrowLeft') airQualityMapState.panX += panStep;
    else if (event.key === 'ArrowRight') airQualityMapState.panX -= panStep;
    else if (event.key === 'ArrowUp') airQualityMapState.panY += panStep;
    else if (event.key === 'ArrowDown') airQualityMapState.panY -= panStep;
    else if (event.key === 'Home' || event.key === '0') {
        event.preventDefault();
        resetAirQualityMap();
        return;
    } else return;

    event.preventDefault();
    airQualityMap.classList.add('is-interacting');
    scheduleAirQualityMapRender();
});

const fetchAirQualityMap = async (latitude: number, longitude: number) => {
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    if (airQualityMapCacheKey === cacheKey && airQualityMapPoints.length > 0) {
        airQualityMapStatus.textContent = `${airQualityMapPoints.length} nearby readings`;
        drawAirQualityHeatMap(airQualityMapPoints);
        return;
    }

    const requestId = ++airQualityMapRequestId;
    airQualityMapStatus.textContent = 'Loading nearby air…';
    const latitudeOffsets = [-1.1, -0.55, 0, 0.55, 1.1];
    const longitudeScale = Math.max(0.35, Math.cos(latitude * Math.PI / 180));
    const longitudeOffsets = latitudeOffsets.map((offset) => offset / longitudeScale);
    const locations: Array<{ lat: number; lon: number }> = [];

    latitudeOffsets.forEach((latOffset) => {
        longitudeOffsets.forEach((lonOffset) => {
            locations.push({ lat: latitude + latOffset, lon: longitude + lonOffset });
        });
    });

    const params = [
        `latitude=${locations.map((location) => location.lat.toFixed(4)).join(',')}`,
        `longitude=${locations.map((location) => location.lon.toFixed(4)).join(',')}`,
        'current=us_aqi'
    ].join('&');

    try {
        const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
        if (!response.ok) throw new Error(`Air quality map request failed (${response.status})`);
        const payload = await response.json() as AirQualityResponse | AirQualityResponse[];
        if (requestId !== airQualityMapRequestId) return;
        const responses = Array.isArray(payload) ? payload : [payload];
        airQualityMapPoints = responses
            .map((result, index) => ({
                lat: locations[index]?.lat,
                lon: locations[index]?.lon,
                aqi: result.current?.us_aqi
            }))
            .filter((point): point is AirQualityMapPoint =>
                Number.isFinite(point.lat) && Number.isFinite(point.lon) && Number.isFinite(point.aqi)
            );
        airQualityMapCacheKey = cacheKey;

        if (airQualityMapPoints.length === 0) throw new Error('No nearby air quality readings');
        airQualityMapStatus.textContent = `${airQualityMapPoints.length} nearby readings`;
        drawAirQualityHeatMap(airQualityMapPoints);
    } catch (error) {
        if (requestId !== airQualityMapRequestId) return;
        console.error('Error fetching air quality map:', error);
        const currentAqi = currentAirQuality?.current?.us_aqi;
        const fallback = Number.isFinite(currentAqi)
            ? [{ lat: latitude, lon: longitude, aqi: currentAqi as number }]
            : [];
        airQualityMapStatus.textContent = 'Nearby layer unavailable';
        drawAirQualityHeatMap(fallback);
    }
};

const refreshOpenAirQualityMap = () => {
    if (airQualityModal.hidden || !currentCoords) return;
    const { lat, lon } = currentCoords;
    requestAnimationFrame(() => {
        renderAirQualityMapTiles(lat, lon, true);
        const currentAqi = currentAirQuality?.current?.us_aqi;
        if (Number.isFinite(currentAqi)) {
            drawAirQualityHeatMap([{ lat, lon, aqi: currentAqi as number }]);
        } else {
            drawAirQualityHeatMap([]);
        }
        void fetchAirQualityMap(lat, lon);
    });
};

const openAirQualityDetails = () => {
    if (!currentCoords) return;
    renderAirQualityDetail(currentAirQuality);
    airQualityModal.hidden = false;
    document.body.classList.add('modal-open');
    airQualityModal.focus({ preventScroll: true });
    refreshOpenAirQualityMap();
};

const closeAirQualityDetails = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    airQualityModal.hidden = true;
    document.body.classList.remove('modal-open');
};

DOM.airQualityTile.addEventListener('click', openAirQualityDetails);
DOM.airQualityTile.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAirQualityDetails();
    }
});
airQualityClose.addEventListener('click', closeAirQualityDetails);
airQualityModal.addEventListener('click', (e) => {
    if (e.target === airQualityModal) closeAirQualityDetails();
});
window.addEventListener('resize', () => {
    if (airQualityModal.hidden || !currentCoords) return;
    window.clearTimeout(airQualityResizeTimer);
    airQualityResizeTimer = window.setTimeout(() => {
        if (!currentCoords) return;
        renderAirQualityMapTiles(currentCoords.lat, currentCoords.lon);
        drawAirQualityHeatMap(airQualityMapPoints);
    }, 120);
});

// ---- wind flow map ----

const windMapModal = $('wind-map-modal') as HTMLDivElement;
const windCanvas = $('wind-canvas') as HTMLCanvasElement;
const windMapClose = $('wind-map-close');
const windMapInfo = $('wind-map-info');
// Re-parent the modal to <body>: ancestors with transform/backdrop-filter would
// otherwise trap position:fixed and make the modal lay out inside the page.
document.body.appendChild(windMapModal);

const windTiles = $('wind-tiles') as HTMLDivElement;
const windBadge = $('wind-loc-badge');
const windBadgeDir = $('wind-badge-dir');
const windBadgeSpeed = $('wind-badge-speed');
let windAnimId: number | null = null;

let windZoom = 6;         // continuous zoom (pinch/wheel), MIN..MAX
let tileZoom = 6;         // integer zoom the current tiles are fetched at
const MIN_ZOOM = 3;
const MAX_ZOOM = 10;
const TILE = 256;
const tileScale = () => 2 ** (windZoom - tileZoom);
const GRID_N = 5;         // 5x5 sample grid of real forecasts around the location
const GRID_DLAT = 2;      // grid spacing in degrees
const GRID_DLON = 2.5;

interface WindParticle {
    x: number; y: number;
    age: number; maxAge: number;
    speed: number;
    gustPhase: number;
}

// ---- real regional wind field (5x5 grid of Open-Meteo forecasts) ----

interface WindGridCache {
    key: string;
    lats: number[];   // north -> south
    lons: number[];   // west -> east
    speeds: number[][];
    dirs: number[][];
    temps: number[][];
    precip: number[][];
}
let windGridCache: WindGridCache | null = null;
let airGridCache: { key: string; aqi: Array<Array<number | null>> } | null = null;

const computeGridBounds = (lat: number, lon: number) => {
    const dpp = 360 / (TILE * 2 ** windZoom);
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const rect = windCanvas?.parentElement?.getBoundingClientRect() || { width: 800, height: 600 };
    const spanLat = Math.max(3, (rect.height * dpp * cosLat * 1.35) / 2);
    const spanLon = Math.max(4, (rect.width * dpp * 1.35) / 2);

    const lats: number[] = [];
    const lons: number[] = [];
    for (let i = 0; i < GRID_N; i++) {
        const t = i / (GRID_N - 1);
        lats.push(+(lat + spanLat * (1 - 2 * t)).toFixed(3));
        lons.push(+(lon - spanLon + 2 * spanLon * t).toFixed(3));
    }
    return { lats, lons };
};

const fetchWindGrid = async (lat: number, lon: number): Promise<void> => {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)},z${windZoom}`;
    if (windGridCache?.key === key) return;
    const { lats, lons } = computeGridBounds(lat, lon);
    const la: number[] = [];
    const lo: number[] = [];
    for (const a of lats) for (const b of lons) { la.push(a); lo.push(b); }
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${la.join(',')}&longitude=${lo.join(',')}` +
            '&hourly=wind_speed_10m,wind_direction_10m,temperature_2m,precipitation&forecast_days=7&timezone=auto'
        );
        const json = await res.json();
        const arr: Array<{ hourly: { wind_speed_10m: number[]; wind_direction_10m: number[]; temperature_2m: number[]; precipitation: number[] } }> =
            Array.isArray(json) ? json : [json];
        if (arr.length !== GRID_N * GRID_N) return; // unexpected shape — keep uniform flow
        windGridCache = {
            key, lats, lons,
            speeds: arr.map((p) => p.hourly.wind_speed_10m),
            dirs: arr.map((p) => p.hourly.wind_direction_10m),
            temps: arr.map((p) => p.hourly.temperature_2m),
            precip: arr.map((p) => p.hourly.precipitation),
        };
    } catch {
        /* map falls back to uniform flow */
    }
};

// u = eastward, v = northward flow components (km/h) for one forecast hour
const gridUV = (h: number): { u: Float32Array; v: Float32Array } | null => {
    if (!windGridCache) return null;
    const n = windGridCache.speeds.length;
    const u = new Float32Array(n);
    const v = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const spd = windGridCache.speeds[i][h] ?? 0;
        const toRad = (((windGridCache.dirs[i][h] ?? 0) + 180) * Math.PI) / 180; // blowing toward
        u[i] = spd * Math.sin(toRad);
        v[i] = spd * Math.cos(toRad);
    }
    return { u, v };
};

// ---- map tile background (CARTO light, tinted blue in CSS), pannable ----

// ---- Map Overlay (Windy API Embed) ----
type MapLayer = 'wind' | 'precip' | 'temp';
let mapLayer: MapLayer = 'wind';

const windLayersBtn = $('wind-layers-btn');
const windLayersMenu = $('wind-layers-menu');

const LAYER_TITLES: Record<MapLayer, string> = {
    wind: 'Wind Flow',
    precip: 'Rain & Thunder',
    temp: 'Temperature Map',
};

const updateBadgeForLayer = () => {
    if (!currentData) return;
    const h = representativeHourIndex(currentData, selectedDayIndex);
    const isToday = selectedDayIndex === 0;

    const titleEl = windMapModal.querySelector('.wind-map-title h2');
    if (titleEl) {
        titleEl.textContent = LAYER_TITLES[mapLayer] || 'Weather Map';
    }

    const infoCity = $('wind-info-city');
    const infoSpeed = $('wind-info-speed');
    const infoDir = $('wind-info-dir');
    const infoGusts = $('wind-info-gusts');
    const infoDesc = $('wind-info-desc');

    const cityName = DOM.cityLabel?.textContent || 'Current Location';
    if (infoCity) infoCity.textContent = cityName;

    if (mapLayer === 'wind') {
        const speed = isToday ? currentData.current.wind_speed_10m : currentData.hourly.wind_speed_10m[h];
        const dir = isToday ? currentData.current.wind_direction_10m : currentData.hourly.wind_direction_10m[h];
        const gust = isToday ? currentData.current.wind_gusts_10m : currentData.hourly.wind_gusts_10m[h];
        const bLevel = beaufort(speed);
        const bDesc = beaufortName(bLevel);
        if (infoSpeed) infoSpeed.textContent = `${Math.round(speed)} km/h`;
        if (infoDir) infoDir.textContent = compass(dir);
        if (infoGusts) infoGusts.textContent = `Gusts ${Math.round(gust)} km/h`;
        if (infoDesc) infoDesc.textContent = bDesc;
    } else if (mapLayer === 'temp') {
        const temp = isToday ? currentData.current.temperature_2m : currentData.hourly.temperature_2m[h];
        const displayTemp = `${Math.round(getTemp(temp))}°`;
        if (infoSpeed) infoSpeed.textContent = displayTemp;
        if (infoDir) infoDir.textContent = tempUnit === 'C' ? '°C' : '°F';
        if (infoGusts) infoGusts.textContent = 'Air Temperature';
        if (infoDesc) infoDesc.textContent = 'Live Temperature';
    } else if (mapLayer === 'precip') {
        const prob = isToday ? (currentData.daily.precipitation_probability_max[0] ?? 0) : (currentData.hourly.precipitation_probability[h] ?? 0);
        const valStr = `${prob}%`;
        if (infoSpeed) infoSpeed.textContent = valStr;
        if (infoDir) infoDir.textContent = 'Radar';
        if (infoGusts) infoGusts.textContent = 'Precipitation Chance';
        if (infoDesc) infoDesc.textContent = prob > 30 ? 'Rain Expected' : 'Low Rain Chance';
    }
};

const updateWindyMap = () => {
    const windyIframe = $('windy-iframe') as HTMLIFrameElement;
    if (!windyIframe) return;

    const overlayMap: Record<MapLayer, string> = {
        wind: 'wind',
        temp: 'temp',
        precip: 'rain',
    };

    const overlay = overlayMap[mapLayer] || 'wind';
    const lat = currentLat.toFixed(3);
    const lon = currentLon.toFixed(3);
    const tempUnitParam = tempUnit === 'F' ? '%C2%B0F' : '%C2%B0C';

    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%25&height=100%25&zoom=6&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=${tempUnitParam}&radarRange=-1`;

    if (windyIframe.src !== url) {
        windyIframe.src = url;
    }
};

const applyMapLayer = () => {
    if (windMapModal.hidden) return;
    updateBadgeForLayer();
    updateWindyMap();
};

const syncLayerMenu = () => {
    windLayersMenu.querySelectorAll('button').forEach((b) =>
        b.classList.toggle('active', b.dataset.layer === mapLayer));
    windLayersMenu.hidden = true;
};

const setMapLayer = (l: MapLayer) => {
    mapLayer = l;
    syncLayerMenu();
    applyMapLayer();
};

const openWindMap = (initialLayer: MapLayer = 'wind') => {
    if (!currentData) return;
    windMapModal.hidden = false;
    document.body.classList.add('wind-map-open');

    const h = representativeHourIndex(currentData, selectedDayIndex);
    const isToday = selectedDayIndex === 0;
    const speed = isToday ? currentData.current.wind_speed_10m : currentData.hourly.wind_speed_10m[h];
    const dir = isToday ? currentData.current.wind_direction_10m : currentData.hourly.wind_direction_10m[h];
    const gust = isToday ? currentData.current.wind_gusts_10m : currentData.hourly.wind_gusts_10m[h];
    const cityName = DOM.cityLabel?.textContent || 'Current Location';

    windMapInfo.textContent = `${cityName} · ${Math.round(speed)} km/h ${compass(dir)} · Gusts ${Math.round(gust)} km/h`;
    lastWind = { speed, dir, gust, hour: h };
    mapLayer = initialLayer;
    syncLayerMenu();
    applyMapLayer();
};

let lastWind: { speed: number; dir: number; gust: number; hour: number } | null = null;
window.addEventListener('resize', () => {
    if (!windMapModal.hidden && lastWind) {
        applyMapLayer();
    }
});

const closeWindMap = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    windMapModal.hidden = true;
    document.body.classList.remove('wind-map-open');
    if (windAnimId) {
        cancelAnimationFrame(windAnimId);
        windAnimId = null;
    }
};


DOM.windGustTile.addEventListener('click', () => openWindMap('wind'));
DOM.windGustTile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openWindMap('wind');
    }
});
windMapClose.addEventListener('click', closeWindMap);
windMapModal.addEventListener('click', (e) => {
    if (e.target === windMapModal) closeWindMap();
});

// -- map panning + pinch zoom --
window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || windMapModal.hidden) return;
    if (!windLayersMenu.hidden) {
        windLayersMenu.hidden = true;
        return;
    }
    closeWindMap();
});

// -- layer menu --
windLayersBtn.addEventListener('click', () => {
    windLayersMenu.hidden = !windLayersMenu.hidden;
});
windLayersMenu.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => setMapLayer((b as HTMLElement).dataset.layer as MapLayer));
});

const openDewPointDetails = () => {
    if (!currentData) return;
    renderDewPointDetails(currentData);
    DOM.dewPointModal.hidden = false;
    document.body.classList.add('modal-open');
    DOM.dewPointModal.focus({ preventScroll: true });
};

const closeDewPointDetails = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    DOM.dewPointModal.hidden = true;
    document.body.classList.remove('modal-open');
};

document.body.appendChild(DOM.dewPointModal);

DOM.dewPointTile.addEventListener('click', openDewPointDetails);
DOM.dewPointTile.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        openDewPointDetails();
    }
});
DOM.dewPointModalClose.addEventListener('click', closeDewPointDetails);
DOM.dewPointModal.addEventListener('click', (e) => {
    if (e.target === DOM.dewPointModal) closeDewPointDetails();
});

const closeSunDetails = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    DOM.sunModal.hidden = true;
    document.body.classList.remove('modal-open');
};

document.body.appendChild(DOM.sunModal);

const openSunModal = () => {
    if (currentData) renderDaylightDetails(currentData);
    DOM.sunModal.hidden = false;
    document.body.classList.add('modal-open');
    DOM.sunSheet.focus({ preventScroll: true });
};

DOM.sunshineTile.addEventListener('click', openSunModal);
DOM.sunshineTile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSunModal();
    }
});
DOM.sunClose.addEventListener('click', closeSunDetails);
DOM.sunModal.addEventListener('click', (e) => {
    if (e.target === DOM.sunModal) closeSunDetails();
});

// ---- view switching ----

let savedWindowScrollY = 0;
let savedDailyScrollLeft = 0;

function showDetail() {
    if (!DOM.contentWeather.hidden) {
        savedWindowScrollY = window.scrollY;
        if (DOM.dailyScroll) {
            savedDailyScrollLeft = DOM.dailyScroll.scrollLeft;
        }
    }
    DOM.contentWeather.hidden = true;
    DOM.contentDetails.hidden = false;
    DOM.tabWeather.classList.remove('active');
    DOM.tabDetails.classList.add('active');
    document.body.classList.add('detail-mode');
    window.scrollTo(0, 0);
}

function showMain() {
    DOM.contentDetails.hidden = true;
    DOM.contentWeather.hidden = false;
    DOM.tabDetails.classList.remove('active');
    DOM.tabWeather.classList.add('active');
    document.body.classList.remove('detail-mode');

    if (currentData) {
        renderHourly(currentData);
        renderDaily(currentData);
    }

    window.scrollTo(0, savedWindowScrollY);
    if (DOM.dailyScroll) {
        DOM.dailyScroll.scrollLeft = savedDailyScrollLeft;
    }
}

// Desktop opens on the compact weather overview; mobile keeps its existing startup behavior.
if (window.matchMedia('(min-width: 760px)').matches) {
    showMain();
}

// ---- data ----

const setLoading = (isLoading: boolean) => {
    document.body.classList.toggle('loading', isLoading);
};

const fetchWeather = async (lat: number, lon: number, name: string, env: 'city' | 'suburb' | 'rural' | 'skyline' | 'none' = 'rural', skylineId?: string) => {
    const requestId = ++weatherRequestId;
    currentLat = lat;
    currentLon = lon;
    try {
        localStorage.setItem('lastWeatherLoc', JSON.stringify({ lat, lon, name, env, skylineId }));
        setLoading(true);
        DOM.airQualityScore.textContent = '--';
        DOM.airQualityLabel.textContent = 'Loading…';
        DOM.airQualityTile.dataset.level = 'unknown';
        currentSunHistory = undefined;

        const airQualityParams = [
            `latitude=${lat}`,
            `longitude=${lon}`,
            'current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
            'timezone=auto'
        ].join('&');
        const airQualityRequest = fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airQualityParams}`)
            .then(async (airResponse) => {
                if (!airResponse.ok) throw new Error(`Air quality request failed (${airResponse.status})`);
                return airResponse.json() as Promise<AirQualityResponse>;
            })
            .catch((error) => {
                console.error('Error fetching air quality:', error);
                return null;
            });

        const historicalYear = new Date().getFullYear() - 1;
        const historicalParams = [
            `latitude=${lat}`,
            `longitude=${lon}`,
            'daily=sunrise,sunset',
            `start_date=${historicalYear}-01-01`,
            `end_date=${historicalYear}-12-31`,
            'timezone=auto'
        ].join('&');
        const sunHistoryRequest = fetch(`https://archive-api.open-meteo.com/v1/archive?${historicalParams}`)
            .then(async (response) => {
                if (!response.ok) throw new Error(`Historical sun request failed (${response.status})`);
                return response.json() as Promise<HistoricalSunResponse>;
            })
            .catch((error) => {
                console.error('Error fetching historical sun data:', error);
                return null;
            });

        const params = [
            `latitude=${lat}`,
            `longitude=${lon}`,
            'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,dew_point_2m,cloud_cover',
            'hourly=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,uv_index,visibility,surface_pressure,cloud_cover,dew_point_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability',
            'daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,sunshine_duration,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_direction_10m_dominant',
            'forecast_days=15',
            'timezone=auto'
        ].join('&');
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
        const data: ForecastResponse = await res.json();
        if (requestId !== weatherRequestId) return;
        
        currentData = data;
        currentCoords = { lat, lon };
        currentLocName = name;
        currentEnv = env;
        currentAirQuality = null;
        airQualityMapPoints = [];
        airQualityMapCacheKey = '';
        selectedDayIndex = 0;
        
        if (env === 'skyline' && skylineId) {
            const rawSvg = skylineSvgMap[`./skylines/${skylineId}.svg`];
            if (rawSvg) {
                let svgStr = rawSvg.replace('<svg ', '<svg width="1920" height="350" x="0" y="250" preserveAspectRatio="xMidYMax meet" ');
                DOM.envSkyline.innerHTML = svgStr;
            }
        }
        
        updateEnv();

        renderSelectedDay(data);
        DOM.airQualityScore.textContent = '--';
        DOM.airQualityLabel.textContent = 'Loading…';
        if (!airQualityModal.hidden) {
            renderAirQualityDetailLoading();
            airQualityMapStatus.textContent = 'Loading nearby air…';
            refreshOpenAirQualityMap();
        }
        void airQualityRequest.then((airQuality) => {
            if (requestId === weatherRequestId) renderAirQuality(airQuality);
        });
        void sunHistoryRequest.then((history) => {
            if (requestId !== weatherRequestId) return;
            currentSunHistory = history;
            if (currentData) renderDaylightDetails(currentData);
        });
    } catch (error) {
        if (requestId !== weatherRequestId) return;
        console.error('Error fetching weather:', error);
        DOM.cityLabel.textContent = 'Unavailable';
        DOM.weatherDesc.textContent = '—';
        DOM.msgText.textContent = 'Weather unavailable — check your connection and try again';
    } finally {
        if (requestId === weatherRequestId) setLoading(false);
    }
};

const searchCity = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
        setLoading(true);
        const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            const displayName = loc.admin1 ? `${loc.name}, ${loc.admin1}` : loc.name;
            const pop = loc.population || 0;
            const skylineId = getSkylineId(loc.name) || getSkylineId(displayName) || getSkylineId(query);
            const env = skylineId ? 'skyline' : (pop > 500000 ? 'city' : (pop > 50000 ? 'suburb' : 'rural'));
            await fetchWeather(loc.latitude, loc.longitude, displayName, env, skylineId);
        } else {
            DOM.msgText.textContent = `No results for “${trimmed}” — try a different search`;
            setLoading(false);
        }
    } catch (error) {
        console.error('Error geocoding:', error);
        DOM.msgText.textContent = 'Search failed — check your connection and try again';
        setLoading(false);
    }
};

const getUserLocation = (fallbackToNewYork = false) => {
    if (!navigator.geolocation) {
        if (fallbackToNewYork) searchCity('New York');
        return;
    }
    setLoading(true);
    DOM.cityLabel.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude: lat, longitude: lon } = position.coords;
            let locationName = 'My Location';
            let env: 'city' | 'suburb' | 'rural' | 'skyline' | 'none' = 'rural';
            let skylineId: string | undefined = undefined;
            
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                if (res.ok) {
                    const data = await res.json();
                    const cityVal = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
                    locationName = cityVal || 'My Location';
                    
                    skylineId = cityVal ? getSkylineId(cityVal) : undefined;
                    if (skylineId) {
                        env = 'skyline';
                    } else if (data.address?.city) env = 'city';
                    else if (data.address?.town || data.address?.suburb) env = 'suburb';
                    else env = 'rural';
                }
            } catch (err) {
                console.error('Reverse geocoding failed:', err);
            }

            await fetchWeather(lat, lon, locationName, env, skylineId);
        },
        (error) => {
            console.error('Geolocation error:', error);
            if (fallbackToNewYork) {
                searchCity('New York');
            } else {
                DOM.cityLabel.textContent = 'Weather';
                DOM.msgText.textContent = 'Location unavailable — allow access or search for a city';
                setLoading(false);
            }
        },
        fallbackToNewYork ? { timeout: 5000 } : undefined
    );
};

// ---- events ----

const toggleSearch = (show: boolean) => {
    if (show) {
        setDateMenuOpen(false);
        DOM.cityInput.value = '';
        DOM.searchOverlay.classList.add('active');
        // Small delay ensures display/visibility styles are fully applied before focusing
        setTimeout(() => DOM.cityInput.focus(), 50);
    } else {
        DOM.searchOverlay.classList.remove('active');
    }
};

DOM.dateTrigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!currentData) return;
    const shouldOpen = DOM.dateMenu.hidden;
    setDateMenuOpen(shouldOpen);
    if (shouldOpen) {
        const selected = DOM.dateMenu.querySelector<HTMLElement>('[aria-selected="true"]');
        selected?.scrollIntoView({ block: 'nearest' });
    }
});

DOM.cityBtn.addEventListener('click', () => toggleSearch(!DOM.searchOverlay.classList.contains('active')));
const submitSearch = () => {
    searchCity(DOM.cityInput.value);
    toggleSearch(false);
};
DOM.searchBtn.addEventListener('click', submitSearch);
DOM.cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitSearch();
    }
});
document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (DOM.searchOverlay.classList.contains('active')) {
        if (!DOM.searchOverlay.contains(target) && !DOM.cityBtn.contains(target)) {
            toggleSearch(false);
        }
    }
    if (!DOM.dateMenu.hidden && !DOM.dateMenu.contains(target) && !DOM.dateTrigger.contains(target)) {
        setDateMenuOpen(false);
    }
});
document.addEventListener('keydown', (e) => {
    const isSearchActive = DOM.searchOverlay.classList.contains('active');
    if (e.key === 'Escape') {
        if (!airQualityModal.hidden) closeAirQualityDetails();
        if (!DOM.dewPointModal.hidden) closeDewPointDetails();
        if (!DOM.sunModal.hidden) closeSunDetails();
        if (isSearchActive) toggleSearch(false);
        if (!DOM.dateMenu.hidden) {
            setDateMenuOpen(false);
            DOM.dateTrigger.focus();
        }
    } else if (e.key === 'Enter' && !isSearchActive) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'A') {
            e.preventDefault();
            toggleSearch(true);
        }
    }
});
DOM.locateBtn.addEventListener('click', () => getUserLocation(false));

DOM.dictateBtn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return;
    
    const city = DOM.cityLabel.textContent;
    const temp = DOM.temperature.textContent;
    const desc = DOM.weatherDesc.textContent;
    
    if (city === 'Loading…' || temp === '--' || !city) return;

    window.speechSynthesis.cancel(); // Stop any currently playing speech

    const rangeText = DOM.todayRange.textContent || '';
    const parts = rangeText.replace(/°/g, '').split('/');
    const high = parts[0];
    const low = parts[1];
    
    const text = `Currently in ${city}, it is ${temp} degrees and ${desc}. ` +
                 (high && low ? `Today's high will be ${high} with a low of ${low}.` : '');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // slightly slower for better enunciation
    window.speechSynthesis.speak(utterance);
});

DOM.currentCard.addEventListener('click', showDetail);
DOM.currentCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') showDetail();
});
DOM.tabDetails.addEventListener('click', showDetail);
DOM.tabWeather.addEventListener('click', showMain);

DOM.hubChip.addEventListener('click', (e) => {
    if (document.body.classList.contains('detail-mode')) {
        e.preventDefault();
        showMain();
    }
});

DOM.unitBtn.textContent = `°${tempUnit}`;
DOM.unitBtn.addEventListener('click', () => {
    tempUnit = tempUnit === 'C' ? 'F' : 'C';
    localStorage.setItem('tempUnit', tempUnit);
    DOM.unitBtn.textContent = `°${tempUnit}`;
    if (currentData) {
        renderSelectedDay(currentData);
    }
});

const envs = ['rural', 'suburb', 'city', 'skyline', 'none'];
let currentEnv: 'city'|'suburb'|'rural'|'skyline'|'none' = 'none';

const updateEnv = () => {
    $('env-rural').style.display = currentEnv === 'rural' ? 'block' : 'none';
    $('env-suburb').style.display = currentEnv === 'suburb' ? 'block' : 'none';
    $('env-city').style.display = currentEnv === 'city' ? 'block' : 'none';
    DOM.envSkyline.style.display = currentEnv === 'skyline' ? 'block' : 'none';
};
updateEnv();

const bootLoc = localStorage.getItem('lastWeatherLoc');
if (bootLoc) {
    try {
        const { lat, lon, name, env, skylineId } = JSON.parse(bootLoc);
        fetchWeather(lat, lon, name, env || 'rural', skylineId);
    } catch (e) {
        searchCity('New York');
    }
} else {
    searchCity('New York');
    fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
            const lat = parseFloat(data.latitude);
            const lon = parseFloat(data.longitude);
            const city = data.city || 'My Location';
            if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
                fetchWeather(lat, lon, city);
            }
        })
        .catch(() => {});
}

let forecastResizeTimer: number | undefined;
window.addEventListener('resize', () => {
    window.clearTimeout(forecastResizeTimer);
    forecastResizeTimer = window.setTimeout(() => {
        if (currentData) {
            renderHourly(currentData);
            renderDaily(currentData);
        }
    }, 150);
});

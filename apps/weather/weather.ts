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
    envSkyline: $('env-skyline'),

    // detail view
    // detail view
    contentWeather: $('content-weather'),
    contentDetails: $('content-details'),
    tabWeather: $('tab-weather'),
    tabDetails: $('tab-details'),
    detailAdvice: $('detail-advice'),
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
    dewPoint: $('dew-point'),
    sunshineDuration: $('sunshine-duration'),
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
    };
}

let currentData: ForecastResponse | null = null;
let currentLocName: string = '';
let currentAirQuality: AirQualityResponse | null = null;
let selectedDayIndex = 0;
let tempUnit: 'C' | 'F' = (localStorage.getItem('tempUnit') as 'C' | 'F') || 'C';

let skylinesByCity: Record<string, string> = {};
fetch('./skylines/index.json')
    .then(r => r.json())
    .then(data => {
        Object.entries(data).forEach(([key, name]) => {
            skylinesByCity[(name as string).toLowerCase()] = key;
        });
    })
    .catch(e => console.error('Failed to load skylines', e));

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

const clock = (iso: string): string => iso.slice(11, 16);

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
};

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
    const COL = 96;

    const temps: number[] = [];
    const cols = document.createElement('div');
    cols.className = 'cols';

    for (let k = 0; k < count; k++) {
        const i = start + k;
        temps.push(getTemp(hourly.temperature_2m[i]));

        const col = document.createElement('div');
        col.className = 'col hour-col';

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
    DOM.hourlyScroll.scrollLeft = 0;
};

// ---- 15-day strip with high/low curves ----

const renderDaily = (data: ForecastResponse) => {
    const { daily } = data;
    const n = daily.time.length;
    const COL = 108;

    const cols = document.createElement('div');
    cols.className = 'cols';

    for (let i = 0; i < n; i++) {
        const col = document.createElement('div');
        col.className = 'col day-col';
        col.classList.toggle('selected-day', i === selectedDayIndex);
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

        const hi = document.createElement('div');
        hi.className = 'c-temp';
        hi.textContent = `${Math.round(getTemp(daily.temperature_2m_max[i]))}°`;

        const gap = document.createElement('div');
        gap.style.height = '104px';

        const lo = document.createElement('div');
        lo.className = 'c-temp';
        lo.style.color = 'var(--ink-2)';
        lo.textContent = `${Math.round(getTemp(daily.temperature_2m_min[i]))}°`;

        const nightIcon = document.createElement('div');
        nightIcon.className = 'c-icon';
        nightIcon.textContent = getIcon(daily.weather_code[i], false);

        const sub = document.createElement('div');
        sub.className = 'c-sub';
        sub.innerHTML = `${compass(daily.wind_direction_10m_dominant[i])} wind<br>Level ${beaufort(daily.wind_speed_10m_max[i])}`;

        col.append(week, date, icon, cond, hi, gap, lo, nightIcon, sub);
        cols.appendChild(col);
    }

    DOM.dailyScroll.innerHTML = '';
    const band = document.createElement('div');
    band.className = 'band';

    band.appendChild(cols);
    DOM.dailyScroll.appendChild(band);

    if (DOM.contentWeather.hidden || cols.children.length === 0) {
        DOM.dailyScroll.scrollLeft = 0;
        return;
    }

    const firstCol = cols.children[0] as HTMLElement;
    const gapEl = firstCol.children[5] as HTMLElement;
    const gapTop = gapEl.offsetTop;

    const hiChart = buildCurve(daily.temperature_2m_max.map(getTemp), COL, 52, 10, '#ff9500', -1);
    hiChart.style.position = 'absolute';
    hiChart.style.top = `${gapTop}px`;
    
    const loChart = buildCurve(daily.temperature_2m_min.map(getTemp), COL, 52, 10, '#3d8bf2', -1);
    loChart.style.position = 'absolute';
    loChart.style.top = `${gapTop + 52}px`;

    band.insertBefore(hiChart, cols);
    band.insertBefore(loChart, cols);
    DOM.dailyScroll.scrollLeft = 0;
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

const renderAirQuality = (data: AirQualityResponse | null) => {
    currentAirQuality = data;
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
    const band = rounded <= 50
        ? { label: 'Good', level: 'good' }
        : rounded <= 100
            ? { label: 'Moderate', level: 'moderate' }
            : rounded <= 150
                ? { label: 'Sensitive groups', level: 'caution' }
                : rounded <= 200
                    ? { label: 'Unhealthy', level: 'high' }
                    : { label: 'Very unhealthy', level: 'severe' };

    DOM.airQualityScore.textContent = String(rounded);
    DOM.airQualityLabel.textContent = Number.isFinite(pm25)
        ? `${band.label} · PM2.5 ${Math.round(pm25 as number)}`
        : band.label;
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

const renderDetail = (data: ForecastResponse) => {
    const { current, daily } = data;
    const h = representativeHourIndex(data, selectedDayIndex);
    const isToday = selectedDayIndex === 0;

    DOM.detailAdvice.textContent = advice(data);
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

    DOM.sunrise.textContent = clock(daily.sunrise[selectedDayIndex]);
    DOM.sunset.textContent = clock(daily.sunset[selectedDayIndex]);
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

// ---- view switching ----

const showDetail = () => {
    DOM.contentWeather.hidden = true;
    DOM.contentDetails.hidden = false;
    DOM.tabWeather.classList.remove('active');
    DOM.tabDetails.classList.add('active');
    document.body.classList.add('detail-mode');
};

const showMain = () => {
    DOM.contentDetails.hidden = true;
    DOM.contentWeather.hidden = false;
    DOM.tabDetails.classList.remove('active');
    DOM.tabWeather.classList.add('active');
    document.body.classList.remove('detail-mode');
    if (currentData) {
        renderHourly(currentData);
        renderDaily(currentData);
    }
};

// ---- data ----

const setLoading = (isLoading: boolean) => {
    document.body.classList.toggle('loading', isLoading);
};

const fetchWeather = async (lat: number, lon: number, name: string, env: 'city' | 'suburb' | 'rural' | 'skyline' | 'none' = 'rural', skylineId?: string) => {
    try {
        localStorage.setItem('lastWeatherLoc', JSON.stringify({ lat, lon, name, env, skylineId }));
        setLoading(true);
        DOM.airQualityScore.textContent = '--';
        DOM.airQualityLabel.textContent = 'Loading…';
        DOM.airQualityTile.dataset.level = 'unknown';

        const airQualityParams = [
            `latitude=${lat}`,
            `longitude=${lon}`,
            'current=us_aqi,pm2_5',
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
        
        currentData = data;
        currentLocName = name;
        currentEnv = env;
        currentAirQuality = null;
        selectedDayIndex = 0;
        
        if (env === 'skyline' && skylineId) {
            try {
                const svgRes = await fetch(`./skylines/${skylineId}.svg`);
                if (svgRes.ok) {
                    let svgStr = await svgRes.text();
                    svgStr = svgStr.replace('<svg ', '<svg width="1920" height="350" x="0" y="250" preserveAspectRatio="xMidYMax meet" ');
                    DOM.envSkyline.innerHTML = svgStr;
                }
            } catch (e) {
                console.error('Failed to fetch skyline SVG', e);
            }
        }
        
        updateEnv();

        renderSelectedDay(data);
        DOM.airQualityScore.textContent = '--';
        DOM.airQualityLabel.textContent = 'Loading…';
        void airQualityRequest.then(renderAirQuality);
    } catch (error) {
        console.error('Error fetching weather:', error);
        DOM.cityLabel.textContent = 'Unavailable';
        DOM.weatherDesc.textContent = '—';
        DOM.msgText.textContent = 'Weather unavailable — check your connection and try again';
    } finally {
        setLoading(false);
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
            const sName = loc.name.toLowerCase();
            const skylineId = skylinesByCity[sName];
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
                    
                    if (cityVal && skylinesByCity[cityVal.toLowerCase()]) {
                        env = 'skyline';
                        skylineId = skylinesByCity[cityVal.toLowerCase()];
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
DOM.searchBtn.addEventListener('click', () => {
    searchCity(DOM.cityInput.value);
    toggleSearch(false);
});
DOM.cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchCity(DOM.cityInput.value);
        toggleSearch(false);
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
        getUserLocation(true);
    }
} else {
    // First load: Use IP-based location to bypass browser hardware GPS restrictions during prerender!
    fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
            const lat = parseFloat(data.latitude);
            const lon = parseFloat(data.longitude);
            const city = data.city || 'My Location';
            fetchWeather(lat, lon, city);
        })
        .catch(() => {
            getUserLocation(true); // fallback to hardware GPS if IP lookup fails
        });
}

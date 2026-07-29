// Weather — illustrated-scene mini-app for the Bagel Hub.
// Data: Open-Meteo (no API key required).

const $ = (id: string) => document.getElementById(id) as HTMLElement;

const DOM = {
    cityInput: document.getElementById('city-input') as HTMLInputElement,
    searchBtn: document.getElementById('search-btn') as HTMLButtonElement,
    searchCancel: document.getElementById('search-cancel') as HTMLButtonElement,
    searchOverlay: $('search-overlay'),
    cityBtn: $('tab-search'),
    cityLabel: $('city-label'),
    locateBtn: $('locate-btn'),
    chipDay: $('chip-day'),
    chipMonth: $('chip-month'),
    chipWeekday: $('chip-weekday'),
    chipDate: $('chip-date'),
    temperature: $('temperature'),
    weatherDesc: $('weather-desc'),
    windSummary: $('wind-summary'),
    humiditySummary: $('humidity-summary'),
    msgText: $('msg-text'),
    currentCard: $('current-card'),
    todayRange: $('today-range'),
    todayDesc: $('today-desc'),
    todayIcon: $('today-icon'),
    tomorrowRange: $('tomorrow-range'),
    tomorrowDesc: $('tomorrow-desc'),
    tomorrowIcon: $('tomorrow-icon'),
    headSunrise: $('head-sunrise'),
    headSunset: $('head-sunset'),
    hourlyScroll: $('hourly-scroll'),
    dailyScroll: $('daily-scroll'),
    lifeDate: $('life-date'),
    lifeSub: $('life-sub'),
    tipGood: $('tip-good'),
    tipWarn: $('tip-warn'),
    idxClothing: $('idx-clothing'),
    idxCold: $('idx-cold'),
    idxUv: $('idx-uv'),
    idxCarwash: $('idx-carwash'),
    idxComfort: $('idx-comfort'),
    // detail view
    viewMain: $('view-main'),
    viewDetail: $('view-detail'),
    backBtn: $('back-btn'),
    tabWeather: $('tab-weather'),
    tabDetails: $('tab-details'),
    detailCity: $('detail-city'),
    detailTemp: $('detail-temp'),
    detailIcon: $('detail-icon'),
    detailCond: $('detail-cond'),
    detailAdvice: $('detail-advice'),
    updatedAt: $('updated-at'),
    feelsLike: $('feels-like'),
    uvIndex: $('uv-index'),
    humidity: $('humidity'),
    pressure: $('pressure'),
    windDetail: $('wind-detail'),
    visibility: $('visibility'),
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
    };
}

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

// ---- header / chips ----

const renderHeader = (data: ForecastResponse, name: string) => {
    DOM.cityLabel.textContent = name;
    DOM.detailCity.textContent = name;
    document.title = `Weather — ${name}`;

    const p = dateParts(data.current.time);
    DOM.chipDay.textContent = String(p.d);
    DOM.chipMonth.textContent = p.month.slice(0, 3);
    DOM.chipWeekday.textContent = p.weekday;
    DOM.chipDate.textContent = `${p.month.slice(0, 3)} ${p.d}`;
    DOM.lifeDate.textContent = `${p.month} ${p.d}`;
    DOM.lifeSub.textContent = `${p.month.slice(0, 3)} ${p.d} | ${p.weekday}`;
};

// ---- current card ----

const radarMessage = (data: ForecastResponse): string => {
    const prob = data.daily.precipitation_probability_max[0];
    const code = data.current.weather_code;
    if (code >= 95) return 'Thunderstorms nearby — stay indoors if you can';
    if (code >= 51 && code <= 82) return 'Rain is falling — grab an umbrella before heading out';
    if (prob >= 70) return 'Rain likely today — keep an umbrella handy';
    if (prob >= 30) return 'Showers possible later — the radar is watching the sky';
    return 'No rain expected — enjoy the day';
};

const renderCurrent = (data: ForecastResponse) => {
    const { current, daily } = data;
    const w = getWeather(current.weather_code);
    DOM.temperature.textContent = String(Math.round(current.temperature_2m));
    DOM.weatherDesc.textContent = w.desc;
    DOM.windSummary.textContent = `${compass(current.wind_direction_10m)} Wind Level ${beaufort(current.wind_speed_10m)}`;
    DOM.humiditySummary.textContent = `Humidity ${current.relative_humidity_2m}%`;
    DOM.msgText.textContent = radarMessage(data);

    DOM.todayRange.textContent = `${Math.round(daily.temperature_2m_max[0])}°/${Math.round(daily.temperature_2m_min[0])}°`;
    DOM.todayDesc.textContent = getWeather(daily.weather_code[0]).desc;
    DOM.todayIcon.textContent = getIcon(daily.weather_code[0], true);
    DOM.tomorrowRange.textContent = `${Math.round(daily.temperature_2m_max[1])}°/${Math.round(daily.temperature_2m_min[1])}°`;
    DOM.tomorrowDesc.textContent = getWeather(daily.weather_code[1]).desc;
    DOM.tomorrowIcon.textContent = getIcon(daily.weather_code[1], true);

    DOM.headSunrise.textContent = clock(daily.sunrise[0]);
    DOM.headSunset.textContent = clock(daily.sunset[0]);
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
    const start = nowHourIndex(data);
    const count = Math.min(24, hourly.time.length - start);
    const COL = 72;

    const temps: number[] = [];
    const cols = document.createElement('div');
    cols.className = 'cols';

    for (let k = 0; k < count; k++) {
        const i = start + k;
        temps.push(hourly.temperature_2m[i]);

        const col = document.createElement('div');
        col.className = 'col hour-col';

        const t = document.createElement('div');
        t.className = 'c-temp';
        t.textContent = `${Math.round(hourly.temperature_2m[i])}°`;

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
        time.className = 'c-time' + (k === 0 ? ' now' : '');
        time.textContent = k === 0 ? 'Now' : `${hourly.time[i].slice(11, 13)}:00`;

        col.append(t, gap, icon, cond, sub, time);
        cols.appendChild(col);
    }

    DOM.hourlyScroll.innerHTML = '';
    const band = document.createElement('div');
    band.className = 'band';
    const chart = buildCurve(temps, COL, 64, 12, '#3d8bf2', 0);
    chart.style.position = 'absolute';
    chart.style.top = '34px';
    band.appendChild(chart);
    band.appendChild(cols);
    DOM.hourlyScroll.appendChild(band);
    DOM.hourlyScroll.scrollLeft = 0;
};

// ---- 15-day strip with high/low curves ----

const renderDaily = (data: ForecastResponse) => {
    const { daily } = data;
    const n = daily.time.length;
    const COL = 88;

    const cols = document.createElement('div');
    cols.className = 'cols';

    for (let i = 0; i < n; i++) {
        const col = document.createElement('div');
        col.className = 'col day-col';
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
        hi.textContent = `${Math.round(daily.temperature_2m_max[i])}°`;

        const gap = document.createElement('div');
        gap.style.height = '104px';

        const lo = document.createElement('div');
        lo.className = 'c-temp';
        lo.style.color = 'var(--ink-2)';
        lo.textContent = `${Math.round(daily.temperature_2m_min[i])}°`;

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

    // header rows above the charts occupy ~118px; hi label ~24px
    const hiChart = buildCurve(daily.temperature_2m_max, COL, 52, 10, '#ff9500', -1);
    hiChart.style.position = 'absolute';
    hiChart.style.top = '142px';
    const loChart = buildCurve(daily.temperature_2m_min, COL, 52, 10, '#3d8bf2', -1);
    loChart.style.position = 'absolute';
    loChart.style.top = '194px';

    band.append(hiChart, loChart, cols);
    DOM.dailyScroll.appendChild(band);
    DOM.dailyScroll.scrollLeft = 0;
};

// ---- life index ----

const renderLife = (data: ForecastResponse) => {
    const { current, daily } = data;
    const t = current.temperature_2m;
    const hi = daily.temperature_2m_max[0];
    const lo = daily.temperature_2m_min[0];
    const rainProb = daily.precipitation_probability_max[0];
    const uv = daily.uv_index_max[0];

    DOM.idxClothing.textContent = hi >= 32 ? 'Very Hot' : hi >= 26 ? 'Hot' : hi >= 18 ? 'Mild' : hi >= 8 ? 'Jacket' : 'Cold';
    DOM.idxCold.textContent = hi - lo >= 10 || (rainProb >= 60 && t < 15) ? 'Likely' : 'Low';
    DOM.idxUv.textContent = uvLabel(uv);
    DOM.idxCarwash.textContent = rainProb >= 40 ? 'Not Ideal' : 'Good';
    DOM.idxComfort.textContent =
        t >= 30 ? (current.relative_humidity_2m >= 60 ? 'Muggy' : 'Hot')
        : t >= 20 ? 'Warm'
        : t >= 12 ? 'Pleasant'
        : t >= 5 ? 'Cool' : 'Cold';

    if (rainProb >= 50) {
        DOM.tipGood.textContent = 'Good day for indoor plans';
        DOM.tipWarn.textContent = 'Carry an umbrella when out';
    } else if (uv >= 8) {
        DOM.tipGood.textContent = 'Great weather for going out';
        DOM.tipWarn.textContent = 'Strong UV — wear sunscreen';
    } else if (hi >= 33) {
        DOM.tipGood.textContent = 'Evening walks recommended';
        DOM.tipWarn.textContent = 'Stay hydrated in the heat';
    } else {
        DOM.tipGood.textContent = 'Great day for outdoor plans';
        DOM.tipWarn.textContent = 'Check back for radar updates';
    }
};

// ---- detail view ----

const advice = (data: ForecastResponse): string => {
    const hi = data.daily.temperature_2m_max[0];
    const code = data.current.weather_code;
    if (code >= 95) return 'Thunderstorms expected — best to stay indoors and unplug sensitive electronics.';
    if (code >= 51 && code <= 82) return 'Wet weather today — waterproof shoes and an umbrella will serve you well.';
    if (hi >= 30) return 'Hot today — light summer clothing like short sleeves and shorts recommended.';
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

    const sunriseMin = parseInt(data.daily.sunrise[0].slice(11, 13), 10) * 60 + parseInt(data.daily.sunrise[0].slice(14, 16), 10);
    const sunsetMin = parseInt(data.daily.sunset[0].slice(11, 13), 10) * 60 + parseInt(data.daily.sunset[0].slice(14, 16), 10);
    const nowMin = parseInt(data.current.time.slice(11, 13), 10) * 60 + parseInt(data.current.time.slice(14, 16), 10);
    const frac = Math.max(0, Math.min(1, (nowMin - sunriseMin) / Math.max(sunsetMin - sunriseMin, 1)));

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

    const sunVisible = data.current.is_day === 1;
    DOM.arcSun.setAttribute('cx', sunVisible ? last.x.toFixed(1) : '-20');
    DOM.arcSun.setAttribute('cy', sunVisible ? last.y.toFixed(1) : '-20');
};

const renderDetail = (data: ForecastResponse) => {
    const { current, daily } = data;
    const h = nowHourIndex(data);
    const w = getWeather(current.weather_code);

    DOM.detailTemp.textContent = String(Math.round(current.temperature_2m));
    DOM.detailIcon.textContent = getIcon(current.weather_code, current.is_day === 1);
    DOM.detailCond.textContent = w.desc;
    DOM.detailAdvice.textContent = advice(data);
    DOM.updatedAt.textContent = clock(current.time);

    DOM.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°`;
    DOM.uvIndex.textContent = uvLabel(data.hourly.uv_index[h]);
    DOM.humidity.textContent = `${current.relative_humidity_2m}%`;
    DOM.pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;
    DOM.windDetail.textContent = `${compass(current.wind_direction_10m)} Level ${beaufort(current.wind_speed_10m)}`;
    const visKm = data.hourly.visibility[h] / 1000;
    DOM.visibility.textContent = visKm >= 10 ? `${Math.round(visKm)} km` : `${visKm.toFixed(1)} km`;

    DOM.sunrise.textContent = clock(daily.sunrise[0]);
    DOM.sunset.textContent = clock(daily.sunset[0]);
    renderSunArc(data);
};

// ---- view switching ----

const showDetail = () => {
    DOM.viewMain.hidden = true;
    DOM.viewDetail.hidden = false;
    document.body.classList.add('detail-mode');
    DOM.tabWeather.classList.remove('active');
    DOM.tabDetails.classList.add('active');
    window.scrollTo(0, 0);
};

const showMain = () => {
    DOM.viewDetail.hidden = true;
    DOM.viewMain.hidden = false;
    document.body.classList.remove('detail-mode');
    DOM.tabDetails.classList.remove('active');
    DOM.tabWeather.classList.add('active');
    window.scrollTo(0, 0);
};

// ---- data ----

const setLoading = (isLoading: boolean) => {
    document.body.classList.toggle('loading', isLoading);
};

const fetchWeather = async (lat: number, lon: number, name: string) => {
    try {
        setLoading(true);
        const params = [
            `latitude=${lat}`,
            `longitude=${lon}`,
            'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure',
            'hourly=temperature_2m,weather_code,is_day,uv_index,visibility,wind_speed_10m,wind_direction_10m',
            'daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_direction_10m_dominant',
            'forecast_days=15',
            'timezone=auto'
        ].join('&');
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
        const data: ForecastResponse = await res.json();

        setTheme(
            data.current.weather_code,
            data.current.is_day === 1,
            data.current.wind_speed_10m
        );
        renderHeader(data, name);
        renderCurrent(data);
        renderHourly(data);
        renderDaily(data);
        renderLife(data);
        renderDetail(data);
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
            await fetchWeather(loc.latitude, loc.longitude, displayName);
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

const getUserLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    DOM.cityLabel.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude: lat, longitude: lon } = position.coords;
            let locationName = 'My Location';
            try {
                // Reverse geocode to get actual city name
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                if (res.ok) {
                    const data = await res.json();
                    locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'My Location';
                }
            } catch (err) {
                console.error('Reverse geocoding failed:', err);
            }
            fetchWeather(lat, lon, locationName);
        },
        (error) => {
            console.error('Geolocation error:', error);
            DOM.cityLabel.textContent = 'Weather';
            DOM.msgText.textContent = 'Location unavailable — allow access or search for a city';
            setLoading(false);
        }
    );
};

// ---- events ----

const toggleSearch = (show: boolean) => {
    DOM.searchOverlay.hidden = !show;
    if (show) DOM.cityInput.focus();
};

DOM.cityBtn.addEventListener('click', () => toggleSearch(DOM.searchOverlay.hidden));
DOM.searchCancel.addEventListener('click', () => toggleSearch(false));
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
DOM.locateBtn.addEventListener('click', getUserLocation);

DOM.currentCard.addEventListener('click', showDetail);
DOM.currentCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') showDetail();
});
DOM.tabDetails.addEventListener('click', showDetail);
DOM.tabWeather.addEventListener('click', showMain);
DOM.backBtn.addEventListener('click', showMain);

searchCity('Tokyo');

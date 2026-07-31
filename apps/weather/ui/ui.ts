import { ForecastResponse, AirQualityResponse } from '../core/types';
import { MONTHS } from '../core/constants';
import { getTemp, getWeather, getIcon, compass, beaufort, clock, minutesFromIso, durationLabel, timeLabel, civilTwilightOffset, uvLabel, dateParts, dayHourStartIndex, representativeHourIndex, dayLabel } from '../core/utils';
import { $, DOM, airQualityModal, airQualityHero, airQualityScaleMarker } from './dom';
import { setTheme } from './theme';
import { refreshOpenAirQualityMap } from '../map/map';
import { state } from '../core/state';

export const renderHeader = (data: ForecastResponse, name: string) => {
    DOM.cityLabel.textContent = name;

    document.title = `Weather — ${name}`;

    const p = dateParts(data.daily.time[state.selectedDayIndex]);
    DOM.chipDay.textContent = String(p.d);
    DOM.chipMonth.textContent = p.month.slice(0, 3);
    DOM.chipWeekday.textContent = p.weekday;
    DOM.chipDate.textContent = `${p.month.slice(0, 3)} ${p.d}`;
    updateLocationClock();
};

export const updateLocationClock = () => {
    const timezone = state.currentData?.timezone;
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

export const radarMessage = (data: ForecastResponse, dayIndex: number, code: number): string => {
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

export const renderCurrent = (data: ForecastResponse) => {
    const { current, daily } = data;
    const h = representativeHourIndex(data, state.selectedDayIndex);
    const isToday = state.selectedDayIndex === 0;
    const code = isToday ? current.weather_code : data.hourly.weather_code[h];
    const temperature = isToday ? current.temperature_2m : data.hourly.temperature_2m[h];
    const windSpeed = isToday ? current.wind_speed_10m : data.hourly.wind_speed_10m[h];
    const windDirection = isToday ? current.wind_direction_10m : data.hourly.wind_direction_10m[h];
    const humidity = isToday ? current.relative_humidity_2m : data.hourly.relative_humidity_2m[h];
    const w = getWeather(code);

    DOM.temperature.textContent = String(Math.round(getTemp(temperature, state.tempUnit)));
    DOM.weatherDesc.textContent = w.desc;
    DOM.windSummary.textContent = `${compass(windDirection)} Wind Level ${beaufort(windSpeed)}`;
    DOM.humiditySummary.textContent = `Humidity ${Math.round(humidity)}%`;
    DOM.msgText.textContent = radarMessage(data, state.selectedDayIndex, code);

    DOM.todayRange.textContent = `${Math.round(getTemp(daily.temperature_2m_max[state.selectedDayIndex], state.tempUnit))}°/${Math.round(getTemp(daily.temperature_2m_min[state.selectedDayIndex], state.tempUnit))}°`;
    DOM.todayDesc.textContent = getWeather(daily.weather_code[state.selectedDayIndex]).desc;
    DOM.todayIcon.textContent = getIcon(daily.weather_code[state.selectedDayIndex], true);
    DOM.primaryDayLabel.textContent = dayLabel(data, state.selectedDayIndex);

    const nextDayIndex = state.selectedDayIndex + 1;
    if (nextDayIndex < daily.time.length) {
        DOM.tomorrowRange.textContent = `${Math.round(getTemp(daily.temperature_2m_max[nextDayIndex], state.tempUnit))}°/${Math.round(getTemp(daily.temperature_2m_min[nextDayIndex], state.tempUnit))}°`;
        DOM.tomorrowDesc.textContent = getWeather(daily.weather_code[nextDayIndex]).desc;
        DOM.tomorrowIcon.textContent = getIcon(daily.weather_code[nextDayIndex], true);
        DOM.secondaryDayLabel.textContent = dayLabel(data, nextDayIndex);
    } else {
        DOM.tomorrowRange.textContent = '—';
        DOM.tomorrowDesc.textContent = 'End of forecast';
        DOM.tomorrowIcon.textContent = '·';
        DOM.secondaryDayLabel.textContent = 'Next day';
    }

    DOM.headSunrise.textContent = clock(daily.sunrise[state.selectedDayIndex]);
    DOM.headSunset.textContent = clock(daily.sunset[state.selectedDayIndex]);
};

export const svgEl = (tag: string) => document.createElementNS('http://www.w3.org/2000/svg', tag);

export const buildCurve = (
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

export const renderHourly = (data: ForecastResponse) => {
    const { hourly } = data;
    const start = dayHourStartIndex(data, state.selectedDayIndex);
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
        temps.push(getTemp(hourly.temperature_2m[i], state.tempUnit));

        const col = document.createElement('div');
        col.className = 'col hour-col';
        if (isDesktop) {
            col.style.width = `${COL}px`;
            col.style.minWidth = `${COL}px`;
        }

        const t = document.createElement('div');
        t.className = 'c-temp';
        t.textContent = `${Math.round(getTemp(hourly.temperature_2m[i], state.tempUnit))}°`;

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
        const isNow = state.selectedDayIndex === 0 && k === 0;
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

export const renderDaily = (data: ForecastResponse) => {
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
        col.classList.toggle('selected-day', i === state.selectedDayIndex);
        col.setAttribute('role', 'button');
        col.setAttribute('tabindex', '0');
        col.setAttribute(
            'aria-label',
            `${dayLabel(data, i)}, ${getWeather(daily.weather_code[i]).desc}, high ${Math.round(getTemp(daily.temperature_2m_max[i], state.tempUnit))} degrees, low ${Math.round(getTemp(daily.temperature_2m_min[i], state.tempUnit))} degrees. Click to select date.`
        );

        const selectDay = () => {
            state.selectedDayIndex = i;
            renderSelectedDay(data);
        };

        col.addEventListener('click', selectDay);
        col.addEventListener('keydown', (e: any) => {
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
        hi.textContent = `${Math.round(getTemp(daily.temperature_2m_max[i], state.tempUnit))}°`;

        const sep = document.createElement('span');
        sep.className = 'c-temp-sep';
        sep.textContent = '/';

        const lo = document.createElement('span');
        lo.className = 'c-temp c-temp-lo';
        lo.textContent = `${Math.round(getTemp(daily.temperature_2m_min[i], state.tempUnit))}°`;

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

export const advice = (data: ForecastResponse): string => {
    const hi = data.daily.temperature_2m_max[state.selectedDayIndex];
    const code = data.daily.weather_code[state.selectedDayIndex];
    if (code >= 95) return 'Thunderstorms expected — best to stay indoors and unplug sensitive electronics.';
    if (code >= 51 && code <= 82) return 'Wet weather expected — waterproof shoes and an umbrella will serve you well.';
    if (hi >= 30) return 'Hot weather — light summer clothing like short sleeves and shorts recommended.';
    if (hi >= 22) return 'Comfortable and warm — a t-shirt or light shirt is all you need.';
    if (hi >= 12) return 'A bit cool — bring a light jacket or sweater for the breeze.';
    if (hi >= 2) return 'Cold today — a warm coat and layers are recommended.';
    return 'Freezing conditions — bundle up with a heavy coat, hat, and gloves.';
};

export const renderSunArc = (data: ForecastResponse) => {
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

    const sunrise = data.daily.sunrise[state.selectedDayIndex];
    const sunset = data.daily.sunset[state.selectedDayIndex];
    const sunriseMin = parseInt(sunrise.slice(11, 13), 10) * 60 + parseInt(sunrise.slice(14, 16), 10);
    const sunsetMin = parseInt(sunset.slice(11, 13), 10) * 60 + parseInt(sunset.slice(14, 16), 10);
    const nowMin = parseInt(data.current.time.slice(11, 13), 10) * 60 + parseInt(data.current.time.slice(14, 16), 10);
    const frac = state.selectedDayIndex === 0
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

    const sunVisible = state.selectedDayIndex > 0 || data.current.is_day === 1;
    DOM.arcSun.setAttribute('cx', sunVisible ? last.x.toFixed(1) : '-20');
    DOM.arcSun.setAttribute('cy', sunVisible ? last.y.toFixed(1) : '-20');
};

export const renderDaylightDetails = (data: ForecastResponse) => {
    const { daily } = data;
    const sunrise = minutesFromIso(daily.sunrise[state.selectedDayIndex]);
    const sunset = minutesFromIso(daily.sunset[state.selectedDayIndex]);
    const total = Math.max(0, sunset - sunrise);
    const offset = state.currentCoords ? civilTwilightOffset(daily.time[state.selectedDayIndex], state.currentCoords.lat) : 30;
    DOM.sunDate.textContent = state.selectedDayIndex === 0 ? 'Today' : dayLabel(data, state.selectedDayIndex);
    DOM.firstLight.textContent = timeLabel(sunrise - offset);
    DOM.lastLight.textContent = timeLabel(sunset + offset);
    DOM.totalDaylight.textContent = durationLabel(total);
    DOM.sunriseDetail.textContent = timeLabel(sunrise);
    DOM.sunsetDetail.textContent = timeLabel(sunset);
    DOM.sunrise.textContent = timeLabel(sunrise);
    DOM.sunset.textContent = timeLabel(sunset);

    if (state.currentSunHistory === undefined) {
        DOM.longestDaylight.textContent = 'Loading location-based historical averages…';
        DOM.sunriseAverages.innerHTML = '<div class="sunrise-averages-loading">Loading yearly sunrise and sunset data…</div>';
        return;
    }
    if (!state.currentSunHistory?.daily) {
        DOM.longestDaylight.textContent = 'Historical daylight data unavailable';
        DOM.sunriseAverages.innerHTML = '<div class="sunrise-averages-loading">Unable to load yearly sunrise and sunset data for this location.</div>';
        return;
    }

    const history = state.currentSunHistory.daily;
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

export const getAirQualityBand = (aqi: number) => {
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

export const setPollutant = (valueId: string, barId: string, raw: number | undefined, scaleMax: number) => {
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

export const renderAirQualityDetail = (data: AirQualityResponse | null) => {
    const current = data?.current;
    const aqi = current?.us_aqi;
    $('aq-modal-location').textContent = state.currentLocName || 'Current conditions';

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

export const renderAirQualityDetailLoading = () => {
    $('aq-modal-location').textContent = state.currentLocName || 'Updating location';
    $('aq-detail-score').textContent = '—';
    $('aq-detail-category').textContent = 'Updating';
    $('aq-detail-description').textContent = `Loading air quality for ${state.currentLocName || 'this location'}.`;
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

export const renderAirQuality = (data: AirQualityResponse | null) => {
    state.currentAirQuality = data;
    if (!airQualityModal.hidden) renderAirQualityDetail(data);
    if (state.selectedDayIndex !== 0) {
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

export const renderRainDetails = (data: ForecastResponse) => {
    const start = dayHourStartIndex(data, state.selectedDayIndex);
    const count = Math.min(24, data.hourly.time.length - start);
    const probabilities = data.hourly.precipitation_probability.slice(start, start + count);
    const peak = probabilities.length ? Math.max(...probabilities) : 0;

    DOM.rainPeak.textContent = `Peak ${Math.round(peak)}%`;
    DOM.rainHourly.innerHTML = '';

    probabilities.forEach((rawProbability, offset) => {
        const probability = Number.isFinite(rawProbability) ? Math.max(0, Math.min(100, rawProbability)) : 0;
        const isNow = state.selectedDayIndex === 0 && offset === 0;
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

export const dewPointComfort = (dewPointC: number) => {
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

export const dewPointDayIndices = (data: ForecastResponse, dayIndex: number): number[] => {
    const date = data.daily.time[dayIndex];
    const indices: number[] = [];
    data.hourly.time.forEach((time, index) => {
        if (time.startsWith(date)) indices.push(index);
    });
    return indices;
};

export const averageValues = (values: number[]): number =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export const renderDewPointDetails = (data: ForecastResponse) => {
    const representativeIndex = representativeHourIndex(data, state.selectedDayIndex);
    const isToday = state.selectedDayIndex === 0;
    const dewPointC = isToday ? data.current.dew_point_2m : data.hourly.dew_point_2m[representativeIndex];
    const humidity = isToday ? data.current.relative_humidity_2m : data.hourly.relative_humidity_2m[representativeIndex];
    const comfort = dewPointComfort(dewPointC);
    const dayIndices = dewPointDayIndices(data, state.selectedDayIndex);
    const dayDewPoints = dayIndices.map((index) => data.hourly.dew_point_2m[index]).filter(Number.isFinite);
    const dayHumidity = dayIndices.map((index) => data.hourly.relative_humidity_2m[index]).filter(Number.isFinite);
    const minDew = dayDewPoints.length ? Math.min(...dayDewPoints) : dewPointC;
    const maxDew = dayDewPoints.length ? Math.max(...dayDewPoints) : dewPointC;
    const averageHumidity = averageValues(dayHumidity);

    DOM.dewPointModalLocation.textContent = state.currentLocName || 'Current conditions';
    DOM.dewPointDetailCurrent.textContent = `${Math.round(getTemp(dewPointC, state.tempUnit))}°`;
    DOM.dewPointDetailDate.textContent = dayLabel(data, state.selectedDayIndex);
    DOM.dewPointDetailComfort.textContent = comfort.label;
    DOM.dewPointDetailSummary.textContent = comfort.summary;
    DOM.dewPointCurrentHumidity.textContent = `Humidity ${Math.round(humidity)}%`;
    DOM.dewPointDailySummary.textContent =
        `${dayLabel(data, state.selectedDayIndex)}, average humidity is ${Math.round(averageHumidity)}%. ` +
        `The dew point ranges from ${Math.round(getTemp(minDew, state.tempUnit))}° to ${Math.round(getTemp(maxDew, state.tempUnit))}°.`;
    DOM.dewPointTile.dataset.level = comfort.level;
    DOM.dewPointModal.style.setProperty('--dew-accent', comfort.color);
    DOM.dewPointModal.style.setProperty('--dew-soft', comfort.soft);

    const hourlyStart = dayHourStartIndex(data, state.selectedDayIndex);
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
            `${isNow ? 'Now' : `${data.hourly.time[index].slice(11, 16)}`}: dew point ${Math.round(getTemp(hourlyDewPoint, state.tempUnit))} degrees, humidity ${Math.round(data.hourly.relative_humidity_2m[index])} percent`
        );

        const value = document.createElement('strong');
        value.textContent = `${Math.round(getTemp(hourlyDewPoint, state.tempUnit))}°`;
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

    const comparisonIndex = state.selectedDayIndex < data.daily.time.length - 1
        ? state.selectedDayIndex + 1
        : Math.max(0, state.selectedDayIndex - 1);
    const comparisonIndices = dewPointDayIndices(data, comparisonIndex);
    const selectedAverage = averageValues(dayDewPoints);
    const comparisonAverage = averageValues(
        comparisonIndices.map((index) => data.hourly.dew_point_2m[index]).filter(Number.isFinite)
    );
    const selectedLabel = dayLabel(data, state.selectedDayIndex);
    const comparisonLabel = dayLabel(data, comparisonIndex);
    const difference = selectedAverage - comparisonAverage;
    const comparisonDescription = Math.abs(difference) < 0.5
        ? `The average dew point is about the same as ${comparisonLabel.toLowerCase()}.`
        : `The average dew point is ${Math.abs(Math.round(getTemp(selectedAverage, state.tempUnit) - getTemp(comparisonAverage, state.tempUnit)))}° ${difference > 0 ? 'higher' : 'lower'} than ${comparisonLabel.toLowerCase()}.`;
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
        rowValue.textContent = `${Math.round(getTemp(value, state.tempUnit))}°`;
        row.append(rowLabel, track, rowValue);
        DOM.dewPointComparison.appendChild(row);
    });
};

export const renderDetail = (data: ForecastResponse) => {
    const { current, daily } = data;
    const h = representativeHourIndex(data, state.selectedDayIndex);
    const isToday = state.selectedDayIndex === 0;

    DOM.updatedAt.textContent = isToday
        ? `Updated ${clock(current.time)}`
        : `Midday forecast · ${dayLabel(data, state.selectedDayIndex)}`;
    
    const apparentTemperature = isToday ? current.apparent_temperature : data.hourly.apparent_temperature[h];
    const humidity = isToday ? current.relative_humidity_2m : data.hourly.relative_humidity_2m[h];
    const pressure = isToday ? current.surface_pressure : data.hourly.surface_pressure[h];
    const windSpeed = isToday ? current.wind_speed_10m : data.hourly.wind_speed_10m[h];
    const windDirection = isToday ? current.wind_direction_10m : data.hourly.wind_direction_10m[h];
    const cloudCover = isToday ? current.cloud_cover : data.hourly.cloud_cover[h];
    const dewPoint = isToday ? current.dew_point_2m : data.hourly.dew_point_2m[h];
    const windGust = isToday ? current.wind_gusts_10m : data.hourly.wind_gusts_10m[h];

    DOM.feelsLike.textContent = `${Math.round(getTemp(apparentTemperature, state.tempUnit))}°`;
    DOM.uvIndex.textContent = uvLabel(data.hourly.uv_index[h]);
    DOM.humidity.textContent = `${Math.round(humidity)}%`;
    DOM.pressure.textContent = `${Math.round(pressure)} hPa`;
    DOM.windDetail.textContent = `${compass(windDirection)} Level ${beaufort(windSpeed)}`;
    if (DOM.cloudCover) DOM.cloudCover.textContent = `${Math.round(cloudCover)}%`;
    DOM.dewPoint.textContent = `${Math.round(getTemp(dewPoint, state.tempUnit))}°`;
    DOM.dewPointTile.dataset.level = dewPointComfort(dewPoint).level;
    DOM.sunshineDuration.textContent = `${(daily.sunshine_duration[state.selectedDayIndex] / 3600).toFixed(1)} hr`;

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
    renderAirQuality(state.currentAirQuality);
    renderRainDetails(data);
    renderSunArc(data);
};

export const setDateMenuOpen = (open: boolean) => {
    DOM.dateMenu.hidden = !open;
    DOM.dateTrigger.setAttribute('aria-expanded', String(open));
};

export const renderDateMenu = (data: ForecastResponse) => {
    DOM.dateMenu.innerHTML = '';

    data.daily.time.forEach((date, index) => {
        const p = dateParts(date);
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'date-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(index === state.selectedDayIndex));
        option.setAttribute(
            'aria-label',
            `${dayLabel(data, index)}, ${getWeather(data.daily.weather_code[index]).desc}, high ${Math.round(getTemp(data.daily.temperature_2m_max[index], state.tempUnit))} degrees, low ${Math.round(getTemp(data.daily.temperature_2m_min[index], state.tempUnit))} degrees`
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
        range.textContent = `${Math.round(getTemp(data.daily.temperature_2m_max[index], state.tempUnit))}° / ${Math.round(getTemp(data.daily.temperature_2m_min[index], state.tempUnit))}°`;
        weather.append(icon, range);

        option.append(day, copy, weather);
        option.addEventListener('click', () => {
            state.selectedDayIndex = index;
            renderSelectedDay(data);
            setDateMenuOpen(false);
            DOM.dateTrigger.focus();
        });
        DOM.dateMenu.appendChild(option);
    });
};

export const renderSelectedDay = (data: ForecastResponse) => {
    const h = representativeHourIndex(data, state.selectedDayIndex);
    const isToday = state.selectedDayIndex === 0;
    const code = isToday ? data.current.weather_code : data.hourly.weather_code[h];
    const windSpeed = isToday ? data.current.wind_speed_10m : data.hourly.wind_speed_10m[h];
    const isDay = isToday ? data.current.is_day === 1 : true;

    setTheme(code, isDay, windSpeed);
    renderHeader(data, state.currentLocName);
    renderCurrent(data);
    renderHourly(data);
    renderDaily(data);
    renderDetail(data);
    renderDateMenu(data);
    DOM.dateTrigger.setAttribute('aria-label', `Choose forecast date. Selected ${dayLabel(data, state.selectedDayIndex)}`);
};

export const openAirQualityDetails = () => {
    if (!state.currentCoords) return;
    renderAirQualityDetail(state.currentAirQuality);
    airQualityModal.hidden = false;
    document.body.classList.add('modal-open');
    airQualityModal.focus({ preventScroll: true });
    refreshOpenAirQualityMap();
};

export const closeAirQualityDetails = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    airQualityModal.hidden = true;
    document.body.classList.remove('modal-open');
};

export const openDewPointDetails = () => {
    if (!state.currentData) return;
    renderDewPointDetails(state.currentData);
    DOM.dewPointModal.hidden = false;
    document.body.classList.add('modal-open');
    DOM.dewPointModal.focus({ preventScroll: true });
};

export const closeDewPointDetails = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    DOM.dewPointModal.hidden = true;
    document.body.classList.remove('modal-open');
};

export const closeSunDetails = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    DOM.sunModal.hidden = true;
    document.body.classList.remove('modal-open');
};

export const openSunModal = () => {
    if (state.currentData) renderDaylightDetails(state.currentData);
    DOM.sunModal.hidden = false;
    document.body.classList.add('modal-open');
    DOM.sunSheet.focus({ preventScroll: true });
};

export const setLoading = (isLoading: boolean) => {
    document.body.classList.toggle('loading', isLoading);
};

export const toggleSearch = (show: boolean) => {
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
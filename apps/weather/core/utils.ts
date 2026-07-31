import { ForecastResponse } from './types';
import { WEATHER_CODES, MONTHS, WEEKDAYS } from './constants';

;

export const getTemp = (c: number, tempUnit: 'C' | 'F') => tempUnit === 'F' ? c * 9/5 + 32 : c;

export const getWeather = (code: number) => WEATHER_CODES[code] || { desc: 'Unknown', day: '❔', night: '❔' };

export const getIcon = (code: number, isDay: boolean) => (isDay ? getWeather(code).day : getWeather(code).night);

export const sceneTheme = (code: number, isDay: boolean): string => {
    const suffix = isDay ? 'day' : 'night';
    if (code <= 1) return `theme-clear-${suffix}`;
    if (code <= 3 || code === 45 || code === 48) return `theme-cloudy-${suffix}`;
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return `theme-snow-${suffix}`;
    return `theme-rain-${suffix}`; // drizzle, rain, showers, storms
};

export const weatherSceneClass = (code: number): string => {
    if (code >= 95) return 'weather-storm';
    if (code === 45 || code === 48) return 'weather-fog';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'weather-snow';
    if (code >= 51) return 'weather-rain';
    if (code >= 2) return 'weather-cloudy';
    return 'weather-clear';
};

export const compass = (deg: number): string =>
    ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];

export const beaufort = (kmh: number): number => {
    const limits = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
    for (let i = 0; i < limits.length; i++) if (kmh < limits[i]) return i;
    return 12;
};

export const beaufortName = (level: number): string => {
    const names = ['Calm', 'Light Air', 'Light Breeze', 'Gentle Breeze', 'Moderate Breeze', 'Fresh Breeze', 'Strong Breeze', 'High Wind', 'Gale', 'Strong Gale', 'Storm', 'Violent Storm', 'Hurricane'];
    return names[Math.min(Math.max(0, level), 12)] || 'Calm';
};

export const clock = (iso: string): string => iso.slice(11, 16);

export const minutesFromIso = (iso: string): number => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));

export const clockFromMinutes = (minutes: number): string => {
    const value = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
};

export const durationLabel = (minutes: number): string => `${Math.floor(minutes / 60)} hr ${Math.round(minutes % 60)} min`;

export const timeLabel = (minutes: number): string => {
    const value = ((Math.round(minutes) % 1440) + 1440) % 1440;
    const hour = Math.floor(value / 60);
    return `${hour % 12 || 12}:${String(value % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

export const civilTwilightOffset = (date: string, latitude: number): number => {
    const day = Math.floor((Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) - Date.UTC(Number(date.slice(0, 4)), 0, 0)) / 86400000);
    const declination = 23.44 * Math.sin((2 * Math.PI * (284 + day)) / 365) * Math.PI / 180;
    const lat = latitude * Math.PI / 180;
    const hourAngle = (altitude: number) => Math.acos(Math.max(-1, Math.min(1, (Math.sin(altitude * Math.PI / 180) - Math.sin(lat) * Math.sin(declination)) / (Math.cos(lat) * Math.cos(declination)))));
    return Math.max(0, (hourAngle(-6) - hourAngle(-0.833)) * 180 / Math.PI * 4);
};

export const timezoneOffsetMinutes = (date: string, timezone?: string): number => {
    if (!timezone) return 0;
    const instant = new Date(`${date}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(instant);
    const part = (type: string) => Number(parts.find((item) => item.type === type)?.value || 0);
    return (Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute')) - instant.getTime()) / 60000;
};

export const solarTimes = (date: string, latitude: number, longitude: number, timezone?: string) => {
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

export const uvLabel = (uv: number): string => {
    if (uv < 3) return 'Low';
    if (uv < 6) return 'Moderate';
    if (uv < 8) return 'High';
    if (uv < 11) return 'Very High';
    return 'Extreme';
};

export const dateParts = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return { y, m, d, weekday: WEEKDAYS[wd], month: MONTHS[m - 1] };
};

export const nowHourIndex = (data: ForecastResponse): number => {
    const key = `${data.current.time.slice(0, 13)}:00`;
    const i = data.hourly.time.findIndex((t) => t >= key);
    return i < 0 ? 0 : i;
};

export const dayHourStartIndex = (data: ForecastResponse, dayIndex: number): number => {
    if (dayIndex === 0) return nowHourIndex(data);
    const date = data.daily.time[dayIndex];
    const i = data.hourly.time.findIndex((time) => time.startsWith(`${date}T00`));
    return i < 0 ? Math.min(dayIndex * 24, data.hourly.time.length - 1) : i;
};

export const representativeHourIndex = (data: ForecastResponse, dayIndex: number): number => {
    if (dayIndex === 0) return nowHourIndex(data);
    const date = data.daily.time[dayIndex];
    const noon = data.hourly.time.findIndex((time) => time.startsWith(`${date}T12`));
    return noon < 0 ? dayHourStartIndex(data, dayIndex) : noon;
};

export const dayLabel = (data: ForecastResponse, dayIndex: number): string => {
    if (dayIndex === 0) return 'Today';
    if (dayIndex === 1) return 'Tomorrow';
    const p = dateParts(data.daily.time[dayIndex]);
    return `${p.weekday.slice(0, 3)}, ${p.month.slice(0, 3)} ${p.d}`;
};
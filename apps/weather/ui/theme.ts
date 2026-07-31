import { sceneTheme, weatherSceneClass } from '../core/utils';
import { $, DOM } from './dom';
import { state } from '../core/state';

export const getSkylineId = (cityName: string): string | undefined => {
    if (!cityName) return undefined;
    const norm = cityName.toLowerCase().trim();
    if (state.skylinesByCity[norm]) return state.skylinesByCity[norm];

    const parts = norm.split(/[\s,.-]+/).filter(Boolean);
    for (const part of parts) {
        if (state.skylinesByCity[part]) {
            return state.skylinesByCity[part];
        }
    }

    for (const [name, key] of Object.entries(state.skylinesByCity)) {
        if (name.length >= 3 && norm.includes(name)) {
            return key;
        }
    }
    return undefined;
};

export const skylineSvgMap = import.meta.glob<string>('../skylines/*.svg', { query: '?raw', import: 'default', eager: true });

export const setTheme = (code: number, isDay: boolean, windSpeed: number) => {
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

export const updateEnv = () => {
    $('env-rural').style.display = state.currentEnv === 'rural' ? 'block' : 'none';
    $('env-suburb').style.display = state.currentEnv === 'suburb' ? 'block' : 'none';
    $('env-city').style.display = state.currentEnv === 'city' ? 'block' : 'none';
    DOM.envSkyline.style.display = state.currentEnv === 'skyline' ? 'block' : 'none';
};
import { ForecastResponse, AirQualityResponse, HistoricalSunResponse } from '../core/types';
import { $, DOM, airQualityModal, airQualityMapStatus } from '../ui/dom';
import { getSkylineId, skylineSvgMap, updateEnv } from '../ui/theme';
import { refreshOpenAirQualityMap } from '../map/map';
import { renderDaylightDetails, renderAirQualityDetailLoading, renderAirQuality, renderSelectedDay, setLoading, toggleSearch } from '../ui/ui';
import { state } from '../core/state';

export const fetchWeather = async (lat: number, lon: number, name: string, env: 'city' | 'suburb' | 'rural' | 'skyline' | 'none' = 'rural', skylineId?: string) => {
    const requestId = ++state.weatherRequestId;
    state.currentLat = lat;
    state.currentLon = lon;
    try {
        localStorage.setItem('lastWeatherLoc', JSON.stringify({ lat, lon, name, env, skylineId }));
        setLoading(true);
        DOM.airQualityScore.textContent = '--';
        DOM.airQualityLabel.textContent = 'Loading…';
        DOM.airQualityTile.dataset.level = 'unknown';
        state.currentSunHistory = undefined;

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
        if (requestId !== state.weatherRequestId) return;
        
        state.currentData = data;
        state.currentCoords = { lat, lon };
        state.currentLocName = name;
        state.currentEnv = env;
        state.currentAirQuality = null;
        state.airQualityMapPoints = [];
        state.airQualityMapCacheKey = '';
        state.selectedDayIndex = 0;
        
        if (env === 'skyline' && skylineId) {
            const rawSvg = skylineSvgMap[`../skylines/${skylineId}.svg`];
            if (rawSvg) {
                const innerContent = rawSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
                DOM.envSkyline.innerHTML = `<svg x="-250" y="-200" width="500" height="200" viewBox="0 0 400 160" preserveAspectRatio="xMidYMax meet">${innerContent}</svg>`;
                DOM.skylineOverlay.innerHTML = '';
                DOM.skylineOverlay.hidden = true;
            } else {
                DOM.envSkyline.innerHTML = '';
                DOM.skylineOverlay.innerHTML = '';
                DOM.skylineOverlay.hidden = true;
            }
        } else {
            DOM.envSkyline.innerHTML = '';
            DOM.skylineOverlay.innerHTML = '';
            DOM.skylineOverlay.hidden = true;
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
            if (requestId === state.weatherRequestId) renderAirQuality(airQuality);
        });
        void sunHistoryRequest.then((history) => {
            if (requestId !== state.weatherRequestId) return;
            state.currentSunHistory = history;
            if (state.currentData) renderDaylightDetails(state.currentData);
        });
    } catch (error) {
        if (requestId !== state.weatherRequestId) return;
        console.error('Error fetching weather:', error);
        DOM.cityLabel.textContent = 'Unavailable';
        DOM.weatherDesc.textContent = '—';
        DOM.msgText.textContent = 'Weather unavailable — check your connection and try again';
    } finally {
        if (requestId === state.weatherRequestId) setLoading(false);
    }
};

export const searchCity = async (query: string) => {
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

export const getUserLocation = (fallbackToNewYork = false) => {
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

export const submitSearch = () => {
    searchCity(DOM.cityInput.value);
    toggleSearch(false);
};
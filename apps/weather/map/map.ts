import { AirQualityResponse, AirQualityMapPoint } from '../core/types';
import { getTemp, compass, beaufort, beaufortName, representativeHourIndex } from '../core/utils';
import { $, DOM, airQualityModal, airQualityMap, airQualityMapTiles, airQualityMapCanvas, airQualityMapStatus, airQualityMapMarker, windMapModal, windCanvas, windMapInfo, windLayersMenu } from '../ui/dom';
import { state } from '../core/state';

export const longitudeToPixel = (longitude: number, zoom: number) =>
    ((longitude + 180) / 360) * (2 ** zoom) * 256;

export const latitudeToPixel = (latitude: number, zoom: number) => {
    const bounded = Math.max(-85.0511, Math.min(85.0511, latitude));
    const radians = bounded * Math.PI / 180;
    return (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * (2 ** zoom) * 256;
};

export const aqiRgb = (aqi: number): [number, number, number] => {
    if (aqi <= 50) return [69, 168, 109];
    if (aqi <= 100) return [230, 189, 61];
    if (aqi <= 150) return [239, 141, 50];
    if (aqi <= 200) return [232, 93, 87];
    if (aqi <= 300) return [156, 99, 179];
    return [124, 56, 77];
};

export const renderAirQualityMapTiles = (latitude: number, longitude: number, resetView = false) => {
    const rect = airQualityMap.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    if (
        resetView ||
        state.airQualityMapState.latitude !== latitude ||
        state.airQualityMapState.longitude !== longitude
    ) {
        state.airQualityMapState = {
            latitude,
            longitude,
            zoom: rect.width < 600 ? 7 : 8,
            panX: 0,
            panY: 0
        };
    }

    const zoom = state.airQualityMapState.zoom;
    const centerX = longitudeToPixel(longitude, zoom);
    const centerY = latitudeToPixel(latitude, zoom);
    const topLeftX = centerX - rect.width / 2 - state.airQualityMapState.panX;
    const topLeftY = centerY - rect.height / 2 - state.airQualityMapState.panY;
    const startX = Math.floor(topLeftX / 256);
    const endX = Math.floor((topLeftX + rect.width) / 256);
    const startY = Math.floor(topLeftY / 256);
    const endY = Math.floor((topLeftY + rect.height) / 256);
    const tileCount = 2 ** zoom;

    state.airQualityMapView = { zoom, topLeftX, topLeftY };
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

export const drawAirQualityHeatMap = (points: AirQualityMapPoint[]) => {
    const rect = airQualityMap.getBoundingClientRect();
    const view = state.airQualityMapView;
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

export const renderAirQualityMapViewport = () => {
    const { latitude, longitude } = state.airQualityMapState;
    renderAirQualityMapTiles(latitude, longitude);
    const currentAqi = state.currentAirQuality?.current?.us_aqi;
    const points = state.airQualityMapPoints.length > 0
        ? state.airQualityMapPoints
        : Number.isFinite(currentAqi)
            ? [{ lat: latitude, lon: longitude, aqi: currentAqi as number }]
            : [];
    drawAirQualityHeatMap(points);
};

export const scheduleAirQualityMapRender = () => {
    if (state.airQualityMapRenderFrame !== null) return;
    state.airQualityMapRenderFrame = requestAnimationFrame(() => {
        state.airQualityMapRenderFrame = null;
        renderAirQualityMapViewport();
    });
};

export const resetAirQualityMap = () => {
    if (!state.currentCoords) return;
    renderAirQualityMapTiles(state.currentCoords.lat, state.currentCoords.lon, true);
    drawAirQualityHeatMap(state.airQualityMapPoints);
};

export const finishAirQualityMapDrag = (event: PointerEvent) => {
    if (event.pointerId !== state.airQualityPointerId) return;
    state.airQualityPointerId = null;
    airQualityMap.classList.remove('is-dragging');
};

export const fetchAirQualityMap = async (latitude: number, longitude: number) => {
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    if (state.airQualityMapCacheKey === cacheKey && state.airQualityMapPoints.length > 0) {
        airQualityMapStatus.textContent = `${state.airQualityMapPoints.length} nearby readings`;
        drawAirQualityHeatMap(state.airQualityMapPoints);
        return;
    }

    const requestId = ++state.airQualityMapRequestId;
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
        if (requestId !== state.airQualityMapRequestId) return;
        const responses = Array.isArray(payload) ? payload : [payload];
        state.airQualityMapPoints = responses
            .map((result, index) => ({
                lat: locations[index]?.lat,
                lon: locations[index]?.lon,
                aqi: result.current?.us_aqi
            }))
            .filter((point): point is AirQualityMapPoint =>
                Number.isFinite(point.lat) && Number.isFinite(point.lon) && Number.isFinite(point.aqi)
            );
        state.airQualityMapCacheKey = cacheKey;

        if (state.airQualityMapPoints.length === 0) throw new Error('No nearby air quality readings');
        airQualityMapStatus.textContent = `${state.airQualityMapPoints.length} nearby readings`;
        drawAirQualityHeatMap(state.airQualityMapPoints);
    } catch (error) {
        if (requestId !== state.airQualityMapRequestId) return;
        console.error('Error fetching air quality map:', error);
        const currentAqi = state.currentAirQuality?.current?.us_aqi;
        const fallback = Number.isFinite(currentAqi)
            ? [{ lat: latitude, lon: longitude, aqi: currentAqi as number }]
            : [];
        airQualityMapStatus.textContent = 'Nearby layer unavailable';
        drawAirQualityHeatMap(fallback);
    }
};

export const refreshOpenAirQualityMap = () => {
    if (airQualityModal.hidden || !state.currentCoords) return;
    const { lat, lon } = state.currentCoords;
    requestAnimationFrame(() => {
        renderAirQualityMapTiles(lat, lon, true);
        const currentAqi = state.currentAirQuality?.current?.us_aqi;
        if (Number.isFinite(currentAqi)) {
            drawAirQualityHeatMap([{ lat, lon, aqi: currentAqi as number }]);
        } else {
            drawAirQualityHeatMap([]);
        }
        void fetchAirQualityMap(lat, lon);
    });
};

export const MIN_ZOOM = 3;

export const MAX_ZOOM = 10;

export const TILE = 256;

export const tileScale = () => 2 ** (state.windZoom - state.tileZoom);

export const GRID_N = 5;         // 5x5 sample grid of real forecasts around the location

export const GRID_DLAT = 2;      // grid spacing in degrees

export const GRID_DLON = 2.5;

export const computeGridBounds = (lat: number, lon: number) => {
    const dpp = 360 / (TILE * 2 ** state.windZoom);
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

export const fetchWindGrid = async (lat: number, lon: number): Promise<void> => {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)},z${state.windZoom}`;
    if (state.windGridCache?.key === key) return;
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
        state.windGridCache = {
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

export const gridUV = (h: number): { u: Float32Array; v: Float32Array } | null => {
    if (!state.windGridCache) return null;
    const n = state.windGridCache.speeds.length;
    const u = new Float32Array(n);
    const v = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const spd = state.windGridCache.speeds[i][h] ?? 0;
        const toRad = (((state.windGridCache.dirs[i][h] ?? 0) + 180) * Math.PI) / 180; // blowing toward
        u[i] = spd * Math.sin(toRad);
        v[i] = spd * Math.cos(toRad);
    }
    return { u, v };
};

export type MapLayer = 'wind' | 'precip' | 'temp';

export const LAYER_TITLES: Record<MapLayer, string> = {
    wind: 'Wind Flow',
    precip: 'Rain & Thunder',
    temp: 'Temperature Map',
};

export const updateBadgeForLayer = () => {
    if (!state.currentData) return;
    const h = representativeHourIndex(state.currentData, state.selectedDayIndex);
    const isToday = state.selectedDayIndex === 0;

    const titleEl = windMapModal.querySelector('.wind-map-title h2');
    if (titleEl) {
        titleEl.textContent = LAYER_TITLES[state.mapLayer] || 'Weather Map';
    }

    const infoCity = $('wind-info-city');
    const infoSpeed = $('wind-info-speed');
    const infoDir = $('wind-info-dir');
    const infoGusts = $('wind-info-gusts');
    const infoDesc = $('wind-info-desc');

    const cityName = DOM.cityLabel?.textContent || 'Current Location';
    if (infoCity) infoCity.textContent = cityName;

    if (state.mapLayer === 'wind') {
        const speed = isToday ? state.currentData.current.wind_speed_10m : state.currentData.hourly.wind_speed_10m[h];
        const dir = isToday ? state.currentData.current.wind_direction_10m : state.currentData.hourly.wind_direction_10m[h];
        const gust = isToday ? state.currentData.current.wind_gusts_10m : state.currentData.hourly.wind_gusts_10m[h];
        const bLevel = beaufort(speed);
        const bDesc = beaufortName(bLevel);
        if (infoSpeed) infoSpeed.textContent = `${Math.round(speed)} km/h`;
        if (infoDir) infoDir.textContent = compass(dir);
        if (infoGusts) infoGusts.textContent = `Gusts ${Math.round(gust)} km/h`;
        if (infoDesc) infoDesc.textContent = bDesc;
    } else if (state.mapLayer === 'temp') {
        const temp = isToday ? state.currentData.current.temperature_2m : state.currentData.hourly.temperature_2m[h];
        const displayTemp = `${Math.round(getTemp(temp, state.tempUnit))}°`;
        if (infoSpeed) infoSpeed.textContent = displayTemp;
        if (infoDir) infoDir.textContent = state.tempUnit === 'C' ? '°C' : '°F';
        if (infoGusts) infoGusts.textContent = 'Air Temperature';
        if (infoDesc) infoDesc.textContent = 'Live Temperature';
    } else if (state.mapLayer === 'precip') {
        const prob = isToday ? (state.currentData.daily.precipitation_probability_max[0] ?? 0) : (state.currentData.hourly.precipitation_probability[h] ?? 0);
        const valStr = `${prob}%`;
        if (infoSpeed) infoSpeed.textContent = valStr;
        if (infoDir) infoDir.textContent = 'Radar';
        if (infoGusts) infoGusts.textContent = 'Precipitation Chance';
        if (infoDesc) infoDesc.textContent = prob > 30 ? 'Rain Expected' : 'Low Rain Chance';
    }
};

export const updateWindyMap = () => {
    const windyIframe = $('windy-iframe') as HTMLIFrameElement;
    if (!windyIframe) return;

    const overlayMap: Record<MapLayer, string> = {
        wind: 'wind',
        temp: 'temp',
        precip: 'rain',
    };

    const overlay = overlayMap[state.mapLayer] || 'wind';
    const lat = state.currentLat.toFixed(3);
    const lon = state.currentLon.toFixed(3);
    const tempUnitParam = state.tempUnit === 'F' ? '%C2%B0F' : '%C2%B0C';

    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%25&height=100%25&zoom=6&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=${tempUnitParam}&radarRange=-1`;

    if (windyIframe.src !== url) {
        windyIframe.src = url;
    }
};

export const applyMapLayer = () => {
    if (windMapModal.hidden) return;
    updateBadgeForLayer();
    updateWindyMap();
};

export const syncLayerMenu = () => {
    windLayersMenu.querySelectorAll('button').forEach((b) =>
        b.classList.toggle('active', b.dataset.layer === state.mapLayer));
    windLayersMenu.hidden = true;
};

export const setMapLayer = (l: MapLayer) => {
    state.mapLayer = l;
    syncLayerMenu();
    applyMapLayer();
};

window.addEventListener('blur', () => {
    setTimeout(() => {
        const windyIframe = $('windy-iframe');
        if (document.activeElement === windyIframe) {
            window.focus();
            if (windMapModal && !windMapModal.hidden) {
                windMapModal.focus();
            }
        }
    }, 0);
});

export const openWindMap = (initialLayer: MapLayer = 'wind') => {
    if (!state.currentData) return;
    windMapModal.hidden = false;
    document.body.classList.add('wind-map-open');

    const h = representativeHourIndex(state.currentData, state.selectedDayIndex);
    const isToday = state.selectedDayIndex === 0;
    const speed = isToday ? state.currentData.current.wind_speed_10m : state.currentData.hourly.wind_speed_10m[h];
    const dir = isToday ? state.currentData.current.wind_direction_10m : state.currentData.hourly.wind_direction_10m[h];
    const gust = isToday ? state.currentData.current.wind_gusts_10m : state.currentData.hourly.wind_gusts_10m[h];
    const cityName = DOM.cityLabel?.textContent || 'Current Location';

    windMapInfo.textContent = `${cityName} · ${Math.round(speed)} km/h ${compass(dir)} · Gusts ${Math.round(gust)} km/h`;
    state.lastWind = { speed, dir, gust, hour: h };
    state.mapLayer = initialLayer;
    syncLayerMenu();
    applyMapLayer();
};

export const closeWindMap = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    windMapModal.hidden = true;
    document.body.classList.remove('wind-map-open');
    if (state.windAnimId) {
        cancelAnimationFrame(state.windAnimId);
        state.windAnimId = null;
    }
};
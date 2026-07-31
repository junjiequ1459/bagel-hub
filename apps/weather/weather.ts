import { clock } from './core/utils';
import { $, DOM, airQualityModal, airQualityClose, airQualityMap, windMapModal, windMapClose, windLayersBtn, windLayersMenu } from './ui/dom';
import { updateEnv } from './ui/theme';
import { renderAirQualityMapTiles, drawAirQualityHeatMap, scheduleAirQualityMapRender, resetAirQualityMap, finishAirQualityMapDrag, MapLayer, applyMapLayer, setMapLayer, openWindMap, closeWindMap } from './map/map';
import { updateLocationClock, renderHourly, renderDaily, setDateMenuOpen, renderSelectedDay, openAirQualityDetails, closeAirQualityDetails, openDewPointDetails, closeDewPointDetails, closeSunDetails, openSunModal, toggleSearch } from './ui/ui';
import { fetchWeather, searchCity, getUserLocation, submitSearch } from './api/api';
import { state } from './core/state';

// Weather — illustrated-scene mini-app for the Bagel Hub.
// Data: Open-Meteo (no API key required).








import skylinesData from './skylines/index.json';



Object.entries(skylinesData).forEach(([key, name]) => {
    state.skylinesByCity[(name as string).toLowerCase()] = key;
});
state.skylinesByCity['nyc'] = 'new-york';
state.skylinesByCity['new york city'] = 'new-york';
state.skylinesByCity['la'] = 'los-angeles';
state.skylinesByCity['washington dc'] = 'washington-dc';
state.skylinesByCity['washington, d.c.'] = 'washington-dc';
state.skylinesByCity['dc'] = 'washington-dc';
state.skylinesByCity['rio'] = 'rio-de-janeiro';



// WMO weather codes → description + emoji icons


// ---- helpers ----









// Civil twilight (sun at -6°) provides the familiar "first/last light" times.
// We anchor it to the API sunrise/sunset so the displayed clock stays in the location's timezone.










// ---- header / chips ----



window.setInterval(updateLocationClock, 30000);

// ---- current card ----



// ---- hourly strip with temperature curve ----




// ---- 15-day strip ----




// ---- detail view ----





document.body.appendChild(airQualityModal);














// ---- air quality detail and nearby map ----











airQualityMap.addEventListener('pointerdown', (event: any) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a')) return;
    state.airQualityPointerId = event.pointerId;
    state.airQualityPointerX = event.clientX;
    state.airQualityPointerY = event.clientY;
    airQualityMap.setPointerCapture(event.pointerId);
    airQualityMap.classList.add('is-dragging', 'is-interacting');
});

airQualityMap.addEventListener('pointermove', (event: any) => {
    if (event.pointerId !== state.airQualityPointerId) return;
    const dx = event.clientX - state.airQualityPointerX;
    const dy = event.clientY - state.airQualityPointerY;
    state.airQualityPointerX = event.clientX;
    state.airQualityPointerY = event.clientY;
    state.airQualityMapState.panX += dx;
    state.airQualityMapState.panY += dy;
    scheduleAirQualityMapRender();
});


airQualityMap.addEventListener('pointerup', finishAirQualityMapDrag);
airQualityMap.addEventListener('pointercancel', finishAirQualityMapDrag);

airQualityMap.addEventListener('keydown', (event: any) => {
    const panStep = 48;
    if (event.key === 'ArrowLeft') state.airQualityMapState.panX += panStep;
    else if (event.key === 'ArrowRight') state.airQualityMapState.panX -= panStep;
    else if (event.key === 'ArrowUp') state.airQualityMapState.panY += panStep;
    else if (event.key === 'ArrowDown') state.airQualityMapState.panY -= panStep;
    else if (event.key === 'Home' || event.key === '0') {
        event.preventDefault();
        resetAirQualityMap();
        return;
    } else return;

    event.preventDefault();
    airQualityMap.classList.add('is-interacting');
    scheduleAirQualityMapRender();
});





DOM.airQualityTile.addEventListener('click', openAirQualityDetails);
DOM.airQualityTile.addEventListener('keydown', (event: any) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAirQualityDetails();
    }
});
airQualityClose.addEventListener('click', closeAirQualityDetails);
airQualityModal.addEventListener('click', (e: any) => {
    if (e.target === airQualityModal) closeAirQualityDetails();
});
window.addEventListener('resize', () => {
    if (airQualityModal.hidden || !state.currentCoords) return;
    window.clearTimeout(state.airQualityResizeTimer);
    state.airQualityResizeTimer = window.setTimeout(() => {
        if (!state.currentCoords) return;
        renderAirQualityMapTiles(state.currentCoords.lat, state.currentCoords.lon);
        drawAirQualityHeatMap(state.airQualityMapPoints);
    }, 120);
});

// ---- wind flow map ----

// Re-parent the modal to <body>: ancestors with transform/backdrop-filter would
// otherwise trap position:fixed and make the modal lay out inside the page.
document.body.appendChild(windMapModal);




// ---- real regional wind field (5x5 grid of Open-Meteo forecasts) ----




// u = eastward, v = northward flow components (km/h) for one forecast hour

// ---- map tile background (CARTO light, tinted blue in CSS), pannable ----

// ---- Map Overlay (Windy API Embed) ----









window.addEventListener('resize', () => {
    if (!windMapModal.hidden && state.lastWind) {
        applyMapLayer();
    }
});



DOM.windGustTile.addEventListener('click', () => openWindMap('wind'));
DOM.windGustTile.addEventListener('keydown', (e: any) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openWindMap('wind');
    }
});
windMapClose.addEventListener('click', closeWindMap);
windMapModal.addEventListener('click', (e: any) => {
    if (e.target === windMapModal) closeWindMap();
});

// -- map panning + pinch zoom --
window.addEventListener('keydown', (e: any) => {
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



document.body.appendChild(DOM.dewPointModal);

DOM.dewPointTile.addEventListener('click', openDewPointDetails);
DOM.dewPointTile.addEventListener('keydown', (event: any) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        openDewPointDetails();
    }
});
DOM.dewPointModalClose.addEventListener('click', closeDewPointDetails);
DOM.dewPointModal.addEventListener('click', (e: any) => {
    if (e.target === DOM.dewPointModal) closeDewPointDetails();
});


document.body.appendChild(DOM.sunModal);


DOM.sunshineTile.addEventListener('click', openSunModal);
DOM.sunshineTile.addEventListener('keydown', (e: any) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSunModal();
    }
});
DOM.sunClose.addEventListener('click', closeSunDetails);
DOM.sunModal.addEventListener('click', (e: any) => {
    if (e.target === DOM.sunModal) closeSunDetails();
});

// ---- scroll-spy: highlight tab based on visible section ----

const scrollSpySections = [
    { id: 'content-weather', tab: DOM.tabWeather },
];

const activateTab = (tab: HTMLElement) => {
    DOM.tabWeather.classList.remove('active');
    tab.classList.add('active');
};

// Use IntersectionObserver to detect which section occupies most of the viewport
const spyObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            const match = scrollSpySections.find(s => s.id === entry.target.id);
            if (match) activateTab(match.tab);
        }
    }
}, { threshold: [0.3, 0.5, 0.7] });

scrollSpySections.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) spyObserver.observe(el);
});

// Tab clicks scroll to the relevant section
DOM.tabWeather.addEventListener('click', () => {
    const el = document.getElementById('content-weather');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
});


// Current card click scrolls to details instead of switching views
DOM.currentCard.addEventListener('click', () => {
    const el = document.getElementById('content-details');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
DOM.currentCard.addEventListener('keydown', (e: any) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const el = document.getElementById('content-details');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

// ---- events ----

DOM.dateTrigger.addEventListener('click', (event: any) => {
    event.stopPropagation();
    if (!state.currentData) return;
    const shouldOpen = DOM.dateMenu.hidden;
    setDateMenuOpen(shouldOpen);
    if (shouldOpen) {
        const selected = DOM.dateMenu.querySelector<HTMLElement>('[aria-selected="true"]');
        selected?.scrollIntoView({ block: 'nearest' });
    }
});

DOM.cityBtn.addEventListener('click', () => toggleSearch(!DOM.searchOverlay.classList.contains('active')));
DOM.cityLabel.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSearch(!DOM.searchOverlay.classList.contains('active'));
});
DOM.searchBtn.addEventListener('click', submitSearch);
DOM.cityInput.addEventListener('keydown', (e: any) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitSearch();
    }
});
document.addEventListener('click', (e: any) => {
    const target = e.target as Node;
    if (DOM.searchOverlay.classList.contains('active')) {
        if (!DOM.searchOverlay.contains(target) && !DOM.cityBtn.contains(target) && !DOM.cityLabel.contains(target)) {
            toggleSearch(false);
        }
    }
    if (!DOM.dateMenu.hidden && !DOM.dateMenu.contains(target) && !DOM.dateTrigger.contains(target)) {
        setDateMenuOpen(false);
    }
});
document.addEventListener('keydown', (e: any) => {
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

    window.speechSynthesis.cancel();

    const rangeText = DOM.todayRange.textContent || '';
    const parts = rangeText.replace(/°/g, '').split('/');
    const high = parts[0];
    const low = parts[1];
    
    const text = `Currently in ${city}, it is ${temp} degrees and ${desc}. ` +
                 (high && low ? `Today's high will be ${high} with a low of ${low}.` : '');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
});

DOM.unitBtn.textContent = `°${state.tempUnit}`;
DOM.unitBtn.addEventListener('click', () => {
    state.tempUnit = state.tempUnit === 'C' ? 'F' : 'C';
    localStorage.setItem('tempUnit', state.tempUnit);
    DOM.unitBtn.textContent = `°${state.tempUnit}`;
    if (state.currentData) {
        renderSelectedDay(state.currentData);
    }
});

const envs = ['rural', 'suburb', 'city', 'skyline', 'none'];

updateEnv();

// Always detect location from IP on load
fetch('https://get.geojs.io/v1/ip/geo.json')
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(data => {
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        const city = data.city || 'My Location';
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
            fetchWeather(lat, lon, city);
        } else {
            searchCity('New York');
        }
    })
    .catch(() => searchCity('New York'));

window.addEventListener('resize', () => {
    window.clearTimeout(state.forecastResizeTimer);
    state.forecastResizeTimer = window.setTimeout(() => {
        if (state.currentData) {
            renderHourly(state.currentData);
            renderDaily(state.currentData);
        }
    }, 150);
});

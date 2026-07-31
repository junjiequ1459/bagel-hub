export interface ForecastResponse {
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

export interface AirQualityResponse {
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

export interface AirQualityMapPoint {
    lat: number;
    lon: number;
    aqi: number;
}

export interface HistoricalSunResponse {
    daily?: {
        time: string[];
        sunrise: string[];
        sunset: string[];
    };
}

export interface WindParticle {
    x: number; y: number;
    age: number; maxAge: number;
    speed: number;
    gustPhase: number;
}

export interface WindGridCache {
    key: string;
    lats: number[];   // north -> south
    lons: number[];   // west -> east
    speeds: number[][];
    dirs: number[][];
    temps: number[][];
    precip: number[][];
}
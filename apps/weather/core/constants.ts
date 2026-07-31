export const WEATHER_CODES: Record<number, { desc: string; day: string; night: string }> = {
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

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
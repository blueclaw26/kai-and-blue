// Weather Dashboard - weather.js

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather interpretation codes → emoji + Japanese text
const WEATHER_MAP = {
  0:  { icon: '☀️', text: '快晴' },
  1:  { icon: '🌤️', text: 'ほぼ晴れ' },
  2:  { icon: '⛅', text: '一部曇り' },
  3:  { icon: '☁️', text: '曇り' },
  45: { icon: '🌫️', text: '霧' },
  48: { icon: '🌫️', text: '着氷性の霧' },
  51: { icon: '🌧️', text: '小雨' },
  53: { icon: '🌧️', text: '雨' },
  55: { icon: '🌧️', text: '強い雨' },
  56: { icon: '🌧️', text: '着氷性の霧雨' },
  57: { icon: '🌧️', text: '強い着氷性の霧雨' },
  61: { icon: '🌧️', text: '小雨' },
  63: { icon: '🌧️', text: '雨' },
  65: { icon: '🌧️', text: '大雨' },
  66: { icon: '🌧️', text: '着氷性の雨' },
  67: { icon: '🌧️', text: '強い着氷性の雨' },
  71: { icon: '🌨️', text: '小雪' },
  73: { icon: '🌨️', text: '雪' },
  75: { icon: '❄️', text: '大雪' },
  77: { icon: '❄️', text: '霧雪' },
  80: { icon: '🌧️', text: 'にわか雨' },
  81: { icon: '🌧️', text: 'にわか雨' },
  82: { icon: '🌧️', text: '激しいにわか雨' },
  85: { icon: '🌨️', text: 'にわか雪' },
  86: { icon: '❄️', text: '激しいにわか雪' },
  95: { icon: '⛈️', text: '雷雨' },
  96: { icon: '⛈️', text: '雹を伴う雷雨' },
  99: { icon: '⛈️', text: '激しい雹を伴う雷雨' },
};

function getWeather(code) {
  return WEATHER_MAP[code] || { icon: '🌡️', text: '不明' };
}

// State
let useCelsius = true;
let weatherData = null;

// DOM elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const unitToggle = document.getElementById('unit-toggle');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const contentEl = document.getElementById('weather-content');
const cityNameEl = document.getElementById('city-name');
const countryEl = document.getElementById('country');
const currentIconEl = document.getElementById('current-icon');
const currentTempEl = document.getElementById('current-temp');
const currentConditionEl = document.getElementById('current-condition');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const lastUpdatedEl = document.getElementById('last-updated');
const forecastCardsEl = document.getElementById('forecast-cards');

// Temperature conversion
function toFahrenheit(c) {
  return (c * 9 / 5) + 32;
}

function formatTemp(c) {
  if (useCelsius) return `${Math.round(c)}°C`;
  return `${Math.round(toFahrenheit(c))}°F`;
}

// Show/hide helpers
function showLoading() {
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  contentEl.classList.add('hidden');
}

function showError(msg) {
  loadingEl.classList.add('hidden');
  errorEl.classList.remove('hidden');
  contentEl.classList.add('hidden');
  errorEl.textContent = msg;
}

function showContent() {
  loadingEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  contentEl.classList.remove('hidden');
}

// Geocoding
async function geocodeCity(name) {
  const res = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=1`);
  if (!res.ok) throw new Error('Geocoding API error');
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('CITY_NOT_FOUND');
  }
  const r = data.results[0];
  return {
    name: r.name,
    country: r.country || '',
    latitude: r.latitude,
    longitude: r.longitude,
  };
}

// Forecast
async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    timezone: 'auto',
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error('Forecast API error');
  return res.json();
}

// Render
function renderWeather(city, data) {
  weatherData = { city, data };

  const cur = data.current;
  const w = getWeather(cur.weather_code);

  cityNameEl.textContent = city.name;
  countryEl.textContent = city.country;
  currentIconEl.textContent = w.icon;
  currentTempEl.textContent = formatTemp(cur.temperature_2m);
  currentConditionEl.textContent = w.text;
  feelsLikeEl.textContent = formatTemp(cur.apparent_temperature);
  humidityEl.textContent = `${cur.relative_humidity_2m}%`;
  windSpeedEl.textContent = `${cur.wind_speed_10m} km/h`;

  const now = new Date();
  lastUpdatedEl.textContent = `最終更新: ${now.toLocaleString('ja-JP')}`;

  // Forecast
  forecastCardsEl.innerHTML = '';
  const daily = data.daily;
  for (let i = 0; i < daily.time.length; i++) {
    const date = new Date(daily.time[i] + 'T00:00:00');
    const dw = getWeather(daily.weather_code[i]);
    const dayName = i === 0 ? '今日' : date.toLocaleDateString('ja-JP', { weekday: 'short', month: 'numeric', day: 'numeric' });

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <span class="forecast-date">${dayName}</span>
      <span class="forecast-icon">${dw.icon}</span>
      <div class="forecast-temps">
        <span class="temp-high">${formatTemp(daily.temperature_2m_max[i])}</span>
        <span class="temp-low">${formatTemp(daily.temperature_2m_min[i])}</span>
      </div>
    `;
    forecastCardsEl.appendChild(card);
  }

  showContent();
}

// Main search
async function searchCity(name) {
  if (!name.trim()) return;
  showLoading();
  try {
    const city = await geocodeCity(name);
    const data = await fetchForecast(city.latitude, city.longitude);
    renderWeather(city, data);
    localStorage.setItem('weather-last-city', name.trim());
  } catch (err) {
    if (err.message === 'CITY_NOT_FOUND') {
      showError(`「${name}」が見つかりませんでした。別の都市名をお試しください。`);
    } else {
      showError('天気データの取得に失敗しました。しばらくしてからもう一度お試しください。');
    }
  }
}

// Unit toggle
function toggleUnit() {
  useCelsius = !useCelsius;
  unitToggle.textContent = useCelsius ? '°C' : '°F';
  if (weatherData) {
    renderWeather(weatherData.city, weatherData.data);
  }
}

// Events
searchBtn.addEventListener('click', () => searchCity(cityInput.value));
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchCity(cityInput.value);
});
unitToggle.addEventListener('click', toggleUnit);

// Init
const lastCity = localStorage.getItem('weather-last-city') || 'Tokyo';
cityInput.value = lastCity;
searchCity(lastCity);

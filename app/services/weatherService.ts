import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BASE_URL = 'https://api.open-meteo.com/v1';

export interface WeatherData {
  temperature: number;
  condition: string;
  isDay: boolean;
}

export const getWeather = async (): Promise<WeatherData | null> => {
  try {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    // Fetch weather data from Open-Meteo
    const response = await fetch(
      `${BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code`
    );
    const data = await response.json();

    return {
      temperature: Math.round(data.current.temperature_2m),
      condition: getWeatherCondition(data.current.weather_code),
      isDay: data.current.is_day === 1,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};

// Helper function to convert Open-Meteo weather codes to conditions
const getWeatherCondition = (code: number): string => {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'clear';
};

// Helper function to get the appropriate icon name
export const getWeatherIcon = (condition: string, isDay: boolean): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch (condition) {
    case 'clear':
      return isDay ? 'weather-sunny' : 'weather-night';
    case 'partly-cloudy':
      return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
    case 'cloudy':
      return 'weather-cloudy';
    case 'rain':
      return 'weather-rainy';
    case 'snow':
      return 'weather-snowy';
    case 'thunderstorm':
      return 'weather-lightning-rainy';
    default:
      return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
  }
}; 
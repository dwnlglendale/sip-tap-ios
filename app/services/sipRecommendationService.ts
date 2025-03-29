import { WeatherData } from './weatherService';
import { PersonalizationData } from '../contexts/PersonalizationContext';

interface SipRecommendation {
  amount: number;
  message: string;
  urgency: 'low' | 'medium' | 'high';
}

// Constants for sip calculations
const BASE_SIP_SIZE = 250; // ml
const TEMPERATURE_MULTIPLIERS = {
  COLD: { threshold: 10, multiplier: 0.8 },
  NORMAL: { threshold: 25, multiplier: 1.0 },
  WARM: { threshold: 30, multiplier: 1.2 },
  HOT: { threshold: 35, multiplier: 1.5 },
};

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.0,
  active: 1.2,
  athlete: 1.5,
};

export const calculateNextSip = (
  weather: WeatherData | null,
  personalization: PersonalizationData,
  currentIntake: number
): SipRecommendation => {
  // If no personalization data, return default recommendation
  if (!personalization.dailyGoal || !personalization.activityLevel) {
    return {
      amount: BASE_SIP_SIZE,
      message: 'Take a standard sip to stay hydrated',
      urgency: 'medium',
    };
  }

  // Calculate temperature multiplier
  let temperatureMultiplier = 1.0;
  if (weather) {
    const { temperature } = weather;
    if (temperature <= TEMPERATURE_MULTIPLIERS.COLD.threshold) {
      temperatureMultiplier = TEMPERATURE_MULTIPLIERS.COLD.multiplier;
    } else if (temperature <= TEMPERATURE_MULTIPLIERS.NORMAL.threshold) {
      temperatureMultiplier = TEMPERATURE_MULTIPLIERS.NORMAL.multiplier;
    } else if (temperature <= TEMPERATURE_MULTIPLIERS.WARM.threshold) {
      temperatureMultiplier = TEMPERATURE_MULTIPLIERS.WARM.multiplier;
    } else {
      temperatureMultiplier = TEMPERATURE_MULTIPLIERS.HOT.multiplier;
    }
  }

  // Get activity multiplier
  const activityMultiplier = ACTIVITY_MULTIPLIERS[personalization.activityLevel];

  // Calculate recommended sip size
  const recommendedSip = Math.round(
    BASE_SIP_SIZE * temperatureMultiplier * activityMultiplier
  );

  // Calculate progress towards daily goal
  const progressPercentage = (currentIntake / personalization.dailyGoal) * 100;

  // Determine urgency and message based on progress and weather
  let urgency: 'low' | 'medium' | 'high' = 'medium';
  let message = '';

  if (weather) {
    const { temperature, condition } = weather;
    
    if (progressPercentage < 30) {
      urgency = 'high';
      message = temperature > 30 
        ? 'High temperature! Take a larger sip to stay hydrated'
        : 'You\'re behind on your daily goal. Time to catch up!';
    } else if (progressPercentage < 60) {
      urgency = 'medium';
      message = temperature > 25
        ? 'Warm weather - keep up your hydration!'
        : 'Stay on track with your hydration goal';
    } else {
      urgency = 'low';
      message = temperature > 30
        ? 'Hot weather - maintain your hydration'
        : 'Great progress! Keep it up!';
    }
  } else {
    message = progressPercentage < 50
      ? 'Stay on track with your hydration goal'
      : 'Keep up the good work!';
  }

  return {
    amount: recommendedSip,
    message,
    urgency,
  };
}; 
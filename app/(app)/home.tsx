import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useColorScheme } from 'react-native';
import { usePersonalization } from '../contexts/PersonalizationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { getWeather, getWeatherIcon, WeatherData } from '../services/weatherService';

const QUICK_ADD_OPTIONS = [
  { amount: 250, label: '250ml' },
  { amount: 500, label: '500ml' },
  { amount: 750, label: '750ml' },
  { amount: 0, label: 'Custom', icon: 'plus' as const },
];

interface DailyProgress {
  currentIntake: number;
  streakDays: number;
  lastGoalReached: string;
}

// Constants for environmental impact calculations
const BOTTLE_SIZE = 500; // Standard water bottle size in ml
const ML_PER_TREE = 100000; // Plant one tree for every 100L of water (10 bottles saved)

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { data } = usePersonalization();
  const [progress, setProgress] = useState<DailyProgress>({
    currentIntake: 0,
    streakDays: 0,
    lastGoalReached: '',
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    loadDailyProgress();
    loadWeather();
  }, []);

  // Add focus effect to reload progress when returning from custom log
  useFocusEffect(
    React.useCallback(() => {
      loadDailyProgress();
    }, [])
  );

  const loadDailyProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedProgress = await AsyncStorage.getItem('dailyProgress');
      const progressData = storedProgress ? JSON.parse(storedProgress) : {};

      // Reset progress if it's a new day
      if (progressData.date !== today) {
        setProgress({
          currentIntake: 0,
          streakDays: progressData.streakDays || 0,
          lastGoalReached: progressData.lastGoalReached || '',
        });
      } else {
        setProgress({
          currentIntake: progressData.currentIntake || 0,
          streakDays: progressData.streakDays || 0,
          lastGoalReached: progressData.lastGoalReached || '',
        });
      }
    } catch (error) {
      console.error('Error loading daily progress:', error);
    }
  };

  const loadWeather = async () => {
    const weatherData = await getWeather();
    if (weatherData) {
      setWeather(weatherData);
    }
  };

  const handleQuickAdd = async (amount: number) => {
    if (amount === 0) {
      // Navigate to custom log screen
      router.push('/(app)/custom-log');
      return;
    }

    const newIntake = progress.currentIntake + amount;
    const dailyGoal = data.dailyGoal || 2500;

    // Check if goal is reached for the first time
    const isGoalReached = newIntake >= dailyGoal;
    const isFirstTimeExceeding = isGoalReached && progress.currentIntake < dailyGoal;
    const today = new Date().toISOString().split('T')[0];

    // Update streak if goal is reached
    let newStreakDays = progress.streakDays;
    if (isGoalReached && progress.lastGoalReached !== today) {
      newStreakDays = progress.streakDays + 1;
    }

    const updatedProgress = {
      date: today,
      currentIntake: newIntake,
      streakDays: newStreakDays,
      lastGoalReached: isGoalReached ? today : progress.lastGoalReached,
    };

    try {
      await AsyncStorage.setItem('dailyProgress', JSON.stringify(updatedProgress));
      setProgress({
        currentIntake: newIntake,
        streakDays: newStreakDays,
        lastGoalReached: updatedProgress.lastGoalReached,
      });

      // Show celebration if exceeding goal for the first time
      if (isFirstTimeExceeding) {
        console.log('Showing celebration for first time exceeding goal');
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const dailyGoal = data.dailyGoal || 2500;
  const progressPercentage = Math.min(progress.currentIntake / dailyGoal, 1);

  // In the component
  const bottlesSaved = Math.floor(progress.currentIntake / BOTTLE_SIZE);
  const treesPlanted = Math.floor(progress.currentIntake / ML_PER_TREE);

  // Get hydration recommendation based on temperature
  const getHydrationTip = (temp?: number): string => {
    if (!temp) return 'Stay hydrated!';
    if (temp >= 30) return 'High temperature! Remember to drink more water!';
    if (temp >= 25) return 'Warm weather - keep up your water intake!';
    if (temp <= 10) return 'Even in cold weather, stay hydrated!';
    return 'Stay hydrated throughout the day!';
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDarkMode ? colors.secondary.black : colors.secondary.white }
    ]}>
      <ScrollView style={styles.scrollView}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <Text style={[
                styles.greeting,
                { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
              ]}>Hi, {data.username || 'there'}</Text>
              <View style={styles.streakContainer}>
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons name="fire" size={16} color={colors.accent.purple} />
                  <Text style={styles.streakText}>{progress.streakDays} Day Streak!</Text>
                </View>
                {__DEV__ && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={async () => {
                      try {
                        await AsyncStorage.clear();
                        console.log('Storage cleared');
                        loadDailyProgress();
                      } catch (error) {
                        console.error('Error clearing storage:', error);
                      }
                    }}
                  >
                    <MaterialCommunityIcons name="refresh" size={12} color={colors.neutral.lightGray} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <MaterialCommunityIcons name="account" size={24} color={colors.accent.purple} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.ecoImpact}>
            <MaterialCommunityIcons name="leaf" size={16} color={colors.accent.green} />
            <Text style={styles.ecoText}>
              {bottlesSaved} Bottles Saved | {treesPlanted} Trees Planted
            </Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.circularProgress}>
            <Text style={styles.progressPercentage}>{Math.round(progressPercentage * 100)}%</Text>
            <Text style={styles.progressLabel}>
              {progress.currentIntake}ml / {dailyGoal}ml
            </Text>
          </View>
          <Text style={[
            styles.aiMessage,
            { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
          ]}>
            {progressPercentage >= 1 
              ? "Great job! You've reached your goal for today!" 
              : "Keep going! You're doing great!"}
          </Text>
        </View>

        {/* Quick Add Section */}
        <View style={styles.quickAddSection}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
          ]}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            {QUICK_ADD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.amount}
                style={[
                  styles.quickAddButton,
                  { backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.lightBlue }
                ]}
                onPress={() => handleQuickAdd(option.amount)}
              >
                {option.icon ? (
                  <MaterialCommunityIcons name={option.icon} size={24} color={colors.accent.purple} />
                ) : (
                  <Text style={styles.quickAddAmount}>{option.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder Section */}
        <View style={styles.reminderSection}>
          <View style={[
            styles.reminderCard,
            { backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.lightBlue }
          ]}>
            <View style={styles.reminderInfo}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={colors.accent.purple} />
              <Text style={[
                styles.reminderText,
                { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
              ]}>Next sip in {data.nextReminder || '30 mins'}</Text>
            </View>
            <View style={styles.weatherInfo}>
              <MaterialCommunityIcons 
                name={weather ? getWeatherIcon(weather.condition, weather.isDay) as any : 'weather-partly-cloudy'} 
                size={24} 
                color={colors.accent.purple} 
              />
              <Text style={[
                styles.weatherText,
                { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
              ]}>
                {weather ? `${weather.temperature}°C - ${getHydrationTip(weather.temperature)}` : 'Loading weather...'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[
        styles.bottomNav,
        { backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.white }
      ]}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home" size={24} color={colors.accent.purple} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="chart-bar" size={24} color={colors.neutral.lightGray} />
          <Text style={styles.navLabel}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={colors.neutral.lightGray} />
          <Text style={styles.navLabel}>Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.neutral.lightGray} />
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      <CelebrationOverlay
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20, // Reduced from 60 since we're using SafeAreaView
  },
  userSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: 4,
    color: colors.accent.purple,
    fontWeight: '500',
  },
  profileButton: {
    padding: 8,
  },
  ecoImpact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ecoText: {
    marginLeft: 4,
    color: colors.accent.green,
    fontSize: 12,
  },
  progressSection: {
    alignItems: 'center',
    padding: 20,
  },
  circularProgress: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondary.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.accent.purple,
  },
  progressLabel: {
    fontSize: 16,
    color: colors.neutral.darkGray,
  },
  aiMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  quickAddSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAddAmount: {
    color: colors.accent.purple,
    fontWeight: '500',
  },
  reminderSection: {
    padding: 20,
  },
  reminderCard: {
    padding: 16,
    borderRadius: 12,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderText: {
    marginLeft: 8,
    fontSize: 16,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherText: {
    marginLeft: 8,
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  navItem: {
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
    color: colors.neutral.darkGray,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
}); 
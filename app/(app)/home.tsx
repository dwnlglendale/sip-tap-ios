import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, getThemeColors } from '../theme/colors';
import { useColorScheme } from 'react-native';
import { usePersonalization } from '../contexts/PersonalizationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { getWeather, getWeatherIcon, WeatherData } from '../services/weatherService';
import WaterProgress from '../components/WaterProgress';
import { calculateNextSip } from '../services/sipRecommendationService';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabase';

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
  bottlesSaved?: number;
}

// Constants for environmental impact calculations
const BOTTLE_SIZE = 500; // Standard water bottle size in ml
const ML_PER_TREE = 100000; // Plant one tree for every 100L of water (10 bottles saved)

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = getThemeColors(isDarkMode);
  const { data } = usePersonalization();
  const { user } = useAuth();
  const [progress, setProgress] = useState<DailyProgress>({
    currentIntake: 0,
    streakDays: 0,
    lastGoalReached: '',
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [sipRecommendation, setSipRecommendation] = useState<{
    amount: number;
    message: string;
    urgency: 'low' | 'medium' | 'high';
  } | null>(null);
  const [selectedBottleType, setSelectedBottleType] = useState<'reusable' | 'plastic'>('reusable');
  const [bottlesSaved, setBottlesSaved] = useState(0);

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

  // Update sip recommendation when weather or progress changes
  useEffect(() => {
    const dailyGoal = data.dailyGoal;
    const currentProgressPercentage = dailyGoal ? progress.currentIntake / dailyGoal : 0;
    
    // Only show recommendation if goal hasn't been reached yet
    if (dailyGoal !== null && data.activityLevel && currentProgressPercentage < 1) {
      const recommendation = calculateNextSip(weather, data, progress.currentIntake);
      setSipRecommendation(recommendation);
    } else {
      // Clear recommendation when goal is reached
      setSipRecommendation(null);
    }
  }, [weather, progress.currentIntake, data.dailyGoal, data.activityLevel]);

  const loadDailyProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedProgress = await AsyncStorage.getItem('dailyProgress');
      const progressData = storedProgress ? JSON.parse(storedProgress) : {};

      // Check if we need to reset the streak
      if (progressData.lastGoalReached) {
        const lastGoalDate = new Date(progressData.lastGoalReached);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        // If last goal was not yesterday, reset streak
        if (lastGoalDate.getTime() < yesterday.getTime()) {
          progressData.streakDays = 0;
        }
      }

      // Reset progress if it's a new day
      if (progressData.date !== today) {
        // Save the reset progress to AsyncStorage
        const resetProgress = {
          date: today,
          currentIntake: 0,
          streakDays: progressData.streakDays || 0,
          lastGoalReached: progressData.lastGoalReached || '',
        };
        await AsyncStorage.setItem('dailyProgress', JSON.stringify(resetProgress));
        setProgress(resetProgress);
      } else {
        setProgress({
          currentIntake: progressData.currentIntake || 0,
          streakDays: progressData.streakDays || 0,
          lastGoalReached: progressData.lastGoalReached || '',
        });
        setBottlesSaved(progressData.bottlesSaved || 0);
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

  const handleQuickAdd = async (amount: number, bottleType: 'reusable' | 'plastic' = selectedBottleType) => {
    if (amount === 0) {
      router.push('/(app)/custom-log');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const storedProgress = await AsyncStorage.getItem('dailyProgress');
      const progressData = storedProgress ? JSON.parse(storedProgress) : {};
      
      const newIntake = (progressData.currentIntake || 0) + amount;
      const dailyGoal = data.dailyGoal;
      
      // Check if goal is reached for the first time today
      const isGoalReached = dailyGoal !== null && newIntake >= dailyGoal;
      const isFirstTimeReachingGoal = isGoalReached && progressData.lastGoalReached !== today;

      // Update streak if goal is reached for the first time today
      let newStreakDays = progressData.streakDays || 0;
      if (isFirstTimeReachingGoal) {
        // Check if the last goal was reached yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (progressData.lastGoalReached === yesterdayStr) {
          // If last goal was yesterday, increment streak
          newStreakDays = (progressData.streakDays || 0) + 1;
        } else if (progressData.lastGoalReached !== today) {
          // If last goal was not yesterday or today, reset streak to 1
          newStreakDays = 1;
        }
      }

      // Calculate bottles saved only if using reusable bottle
      let newBottlesSaved = progressData.bottlesSaved || 0;
      if (bottleType === 'reusable') {
        newBottlesSaved += Math.floor(amount / BOTTLE_SIZE);
      }
      
      const updatedProgress = {
        date: today,
        currentIntake: newIntake,
        streakDays: newStreakDays,
        lastGoalReached: isGoalReached ? today : (progressData.lastGoalReached || ''),
        bottlesSaved: newBottlesSaved,
      };

      console.log('Updated Progress:', updatedProgress);

      // Save to AsyncStorage for immediate UI updates
      await AsyncStorage.setItem('dailyProgress', JSON.stringify(updatedProgress));
      await AsyncStorage.setItem(`dailyProgress_${today}`, JSON.stringify(updatedProgress));
      
      // Save to database if user is authenticated
      if (user) {
        try {
          // Log the water intake
          await supabaseService.logWater(user.id, amount);
          
          // Update daily progress in database
          await supabaseService.upsertDailyProgress({
            user_id: user.id,
            date: today,
            current_intake: newIntake,
            goal_reached: isGoalReached,
            streak_days: newStreakDays,
          });
          
          console.log('Data saved to database successfully');
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Continue with local storage if database fails
        }
      }
      
      setProgress(updatedProgress);
      setBottlesSaved(newBottlesSaved);

      // Show celebration if exceeding goal for the first time
      if (isFirstTimeReachingGoal) {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const dailyGoal = data.dailyGoal || 2500;
  const progressPercentage = Math.min(progress.currentIntake / dailyGoal, 1);

  // Calculate trees planted based on bottles saved
  const treesPlanted = Math.floor(bottlesSaved * BOTTLE_SIZE / ML_PER_TREE);

  // Get hydration recommendation based on temperature
  const getHydrationTip = (temp?: number): string => {
    if (!temp) return 'Stay hydrated!';
    if (temp >= 30) return 'High temperature! Remember to drink more water!';
    if (temp >= 25) return 'Warm weather - keep up your water intake!';
    if (temp <= 10) return 'Even in cold weather, stay hydrated!';
    return 'Stay hydrated throughout the day!';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <Text style={[styles.greeting, { color: theme.text }]}>
                Hi, {data.username || 'there'}
              </Text>
              <View style={styles.streakContainer}>
                <View style={[styles.streakBadge, { backgroundColor: theme.accent + '20' }]}>
                  <MaterialCommunityIcons name="fire" size={16} color={theme.accent} />
                  <Text style={[styles.streakText, { color: theme.accent }]}>
                    {progress.streakDays} Day Streak!
                  </Text>
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
                    <MaterialCommunityIcons name="refresh" size={12} color={theme.textDisabled} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.ecoImpact}>
            <MaterialCommunityIcons name="leaf" size={16} color={theme.accent} />
            <Text style={[styles.ecoText, { color: theme.text }]}>
              {bottlesSaved} Bottles Saved | {treesPlanted} Trees Planted
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Progress Section */}
          <View style={styles.progressSection}>
            <WaterProgress
              percentage={progressPercentage}
              size={200}
              currentAmount={progress.currentIntake}
              goalAmount={dailyGoal}
            />
            <Text style={[styles.aiMessage, { color: theme.text }]}>
              {progressPercentage >= 1 
                ? "Great job! You've reached your goal for today!" 
                : "Keep going! You're doing great!"}
            </Text>
          </View>

          {/* Weather and Recommendation Section */}
          <View style={styles.infoSection}>
            {weather && (
              <View style={styles.weatherSection}>
                <MaterialCommunityIcons 
                  name={getWeatherIcon(weather.condition, weather.isDay)} 
                  size={24} 
                  color={theme.text} 
                />
                <Text style={[styles.weatherText, { color: theme.text }]}>
                  {weather.temperature}°C - {getHydrationTip(weather.temperature)}
                </Text>
              </View>
            )}

            {sipRecommendation && progressPercentage < 1 && (
              <View style={styles.recommendationSection}>
                <View style={styles.recommendationHeader}>
                  <MaterialCommunityIcons 
                    name="water" 
                    size={24} 
                    color={theme.primary} 
                  />
                  <Text style={[styles.recommendationTitle, { color: theme.text }]}>
                    Recommended Sip
                  </Text>
                </View>
                <Text style={[styles.recommendationAmount, { color: theme.primary }]}>
                  {sipRecommendation.amount}ml
                </Text>
                <Text style={[styles.recommendationMessage, { color: theme.textSecondary }]}>
                  {sipRecommendation.message}
                </Text>
              </View>
            )}

            {progressPercentage >= 1 && (
              <View style={styles.goalReachedSection}>
                <View style={styles.goalReachedHeader}>
                  <MaterialCommunityIcons 
                    name="trophy" 
                    size={24} 
                    color={colors.accent.green} 
                  />
                  <Text style={[styles.goalReachedTitle, { color: theme.text }]}>
                    Goal Achieved! 🎉
                  </Text>
                </View>
                <Text style={[styles.goalReachedMessage, { color: theme.textSecondary }]}>
                  You've reached your daily hydration goal! Keep up the great work and stay hydrated throughout the day.
                </Text>
              </View>
            )}
          </View>

          {/* Quick Add Section */}
          <View style={styles.quickAddSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Add</Text>
            
            {/* Bottle Type Tabs */}
            <View style={styles.bottleTypeTabs}>
              <TouchableOpacity
                style={styles.bottleTypeTab}
                onPress={() => setSelectedBottleType('reusable')}
              >
                <MaterialCommunityIcons 
                  name="recycle" 
                  size={20} 
                  color={selectedBottleType === 'reusable' ? theme.accent : theme.textSecondary} 
                />
                <Text style={[
                  styles.bottleTypeLabel,
                  { 
                    color: selectedBottleType === 'reusable' ? theme.accent : theme.textSecondary,
                    fontWeight: selectedBottleType === 'reusable' ? 'bold' : 'normal',
                  }
                ]}>
                  Reusable
                </Text>
                {selectedBottleType === 'reusable' && (
                  <View style={[styles.tabIndicator, { backgroundColor: theme.accent }]} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.bottleTypeTab}
                onPress={() => setSelectedBottleType('plastic')}
              >
                <MaterialCommunityIcons 
                  name="bottle-soda" 
                  size={20} 
                  color={selectedBottleType === 'plastic' ? theme.accent : theme.textSecondary} 
                />
                <Text style={[
                  styles.bottleTypeLabel,
                  { 
                    color: selectedBottleType === 'plastic' ? theme.accent : theme.textSecondary,
                    fontWeight: selectedBottleType === 'plastic' ? 'bold' : 'normal',
                  }
                ]}>
                  Plastic
                </Text>
                {selectedBottleType === 'plastic' && (
                  <View style={[styles.tabIndicator, { backgroundColor: theme.accent }]} />
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Add Buttons */}
            <View style={[
              styles.quickAddContainer,
              { 
                borderColor: selectedBottleType === 'reusable' ? colors.accent.green : theme.accent,
                backgroundColor: selectedBottleType === 'reusable' ? colors.accent.green + '05' : theme.accent + '05'
              }
            ]}>
              <View style={styles.quickAddHeader}>
                <MaterialCommunityIcons 
                  name={selectedBottleType === 'reusable' ? 'recycle' : 'bottle-soda'} 
                  size={16} 
                  color={selectedBottleType === 'reusable' ? colors.accent.green : theme.accent} 
                />
                <Text style={[
                  styles.quickAddHeaderText,
                  { color: selectedBottleType === 'reusable' ? colors.accent.green : theme.accent }
                ]}>
                  {selectedBottleType === 'reusable' ? 'Reusable Bottle' : 'Plastic Bottle'} Options
                </Text>
              </View>
              <View style={styles.quickAddButtons}>
                {QUICK_ADD_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.quickAddButton,
                      { 
                        backgroundColor: selectedBottleType === 'reusable' 
                          ? colors.accent.green + '20' 
                          : theme.accent + '20' 
                      }
                    ]}
                    onPress={() => handleQuickAdd(option.amount, selectedBottleType)}
                  >
                    {option.icon ? (
                      <MaterialCommunityIcons 
                        name={option.icon} 
                        size={24} 
                        color={selectedBottleType === 'reusable' ? colors.accent.green : theme.accent} 
                      />
                    ) : (
                      <Text style={[
                        styles.quickAddAmount, 
                        { color: selectedBottleType === 'reusable' ? colors.accent.green : theme.accent }
                      ]}>
                        {option.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bottle Type Info */}
            <View style={styles.bottleTypeInfo}>
              <Text style={[styles.bottleTypeInfoText, { color: theme.textSecondary }]}>
                {selectedBottleType === 'reusable' 
                  ? '🌱 Using reusable bottles helps save plastic and the environment!'
                  : '💧 Every drop counts towards your hydration goal!'}
              </Text>
            </View>
          </View>

          {/* Stats Section */}
          
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home" size={24} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.text }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(app)/stats')}
        >
          <MaterialCommunityIcons name="chart-bar" size={24} color={theme.textDisabled} />
          <Text style={[styles.navLabel, { color: theme.text }]}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={theme.textDisabled} />
          <Text style={[styles.navLabel, { color: theme.text }]}>Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={theme.textDisabled} />
          <Text style={[styles.navLabel, { color: theme.text }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {showCelebration && (
        <CelebrationOverlay 
          visible={showCelebration}
          onClose={() => setShowCelebration(false)}
          username={data.username}
          streakDays={progress.streakDays}
          bottlesSaved={bottlesSaved}
        />
      )}
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  userSection: {
    flex: 1,
  },
  userInfo: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  streakText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
  },
  ecoImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
  },
  ecoText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    padding: 20,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  aiMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  infoSection: {
    gap: 24,
    marginBottom: 32,
  },
  weatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  weatherText: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
  },
  recommendationSection: {
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recommendationAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendationMessage: {
    fontSize: 16,
    lineHeight: 24,
  },
  goalReachedSection: {
    padding: 16,
    backgroundColor: colors.accent.green + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.green,
  },
  goalReachedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalReachedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  goalReachedMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickAddSection: {
    marginBottom: 32,
  },
  quickAddContainer: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  quickAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  quickAddHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottleTypeTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 24,
  },
  bottleTypeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  bottleTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 2,
  },
  bottleTypeInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.neutral.lightGray + '20',
    borderRadius: 8,
  },
  bottleTypeInfoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddButton: {
    width: '48%',
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
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
  },
}); 
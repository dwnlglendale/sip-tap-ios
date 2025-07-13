import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, getThemeColors } from '../theme/colors';
import { useColorScheme } from 'react-native';
import { usePersonalization } from '../contexts/PersonalizationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabase';

const { width } = Dimensions.get('window');

interface DailyProgress {
  currentIntake: number;
  streakDays: number;
  lastGoalReached: string;
  date: string;
}

interface WeeklyStats {
  totalIntake: number;
  averageIntake: number;
  goalReachedDays: number;
  bestDay: number;
}

interface WeeklyChartData {
  day: string;
  intake: number;
  goal: number;
  date: string;
  isToday: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_goal',
    title: 'First Goal',
    description: 'Reach your daily goal for the first time',
    icon: 'trophy',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Reach your goal 3 days in a row',
    icon: 'fire',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Reach your goal 7 days in a row',
    icon: 'fire',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'streak_30',
    title: 'Hydration Master',
    description: 'Reach your goal 30 days in a row',
    icon: 'crown',
    unlocked: false,
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'bottles_10',
    title: 'Eco Warrior',
    description: 'Save 10 plastic bottles',
    icon: 'recycle',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'bottles_100',
    title: 'Ocean Protector',
    description: 'Save 100 plastic bottles',
    icon: 'fish',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
  },
];

const TIME_PERIODS = [
  { id: 'today', label: 'Today', icon: 'calendar-today' },
  { id: 'week', label: 'This Week', icon: 'calendar-week' },
  { id: 'month', label: 'This Month', icon: 'calendar-month' },
];

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = getThemeColors(isDarkMode);
  const { data } = usePersonalization();
  const { user } = useAuth();
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [currentProgress, setCurrentProgress] = useState<DailyProgress>({
    currentIntake: 0,
    streakDays: 0,
    lastGoalReached: '',
    date: '',
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalIntake: 0,
    averageIntake: 0,
    goalReachedDays: 0,
    bestDay: 0,
  });
  const [achievements, setAchievements] = useState(ACHIEVEMENTS);
  const [totalBottlesSaved, setTotalBottlesSaved] = useState(0);
  const [totalTreesPlanted, setTotalTreesPlanted] = useState(0);
  const [weeklyChartData, setWeeklyChartData] = useState<WeeklyChartData[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnims = useRef(ACHIEVEMENTS.map(() => new Animated.Value(0.8))).current;

  useEffect(() => {
    loadStats();
    animateEntrance();
  }, []);

  useEffect(() => {
    updateAchievements();
  }, [currentProgress, totalBottlesSaved]);

  // Reload stats when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Stats screen focused - reloading stats');
      loadStats();
    }, [])
  );

  // Refresh weekly chart when current progress changes
  useEffect(() => {
    if (currentProgress.currentIntake > 0) {
      console.log('Current progress changed - refreshing weekly chart');
      generateWeeklyChartData(currentProgress);
    }
  }, [currentProgress.currentIntake]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate achievements
    ACHIEVEMENTS.forEach((_, index) => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const loadStats = async () => {
    try {
      console.log('Loading stats...');
      
      let currentProgressData = {
        currentIntake: 0,
        streakDays: 0,
        lastGoalReached: '',
        date: '',
      };
      
      // Try to load from database first if user is authenticated
      if (user) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data: dbProgress, error: dbError } = await supabaseService.getOrCreateDailyProgress(user.id, today);
          
          if (dbProgress && !dbError) {
            currentProgressData = {
              currentIntake: dbProgress.current_intake,
              streakDays: dbProgress.streak_days,
              lastGoalReached: dbProgress.goal_reached ? today : '',
              date: today,
            };
            console.log('Loaded current progress from database:', currentProgressData);
          } else {
            console.log('Database load failed, falling back to AsyncStorage:', dbError);
          }
        } catch (dbError) {
          console.error('Error loading from database:', dbError);
        }
      }
      
      // Fallback to AsyncStorage if database failed or user not authenticated
      if (currentProgressData.currentIntake === 0) {
        const storedProgress = await AsyncStorage.getItem('dailyProgress');
        if (storedProgress) {
          currentProgressData = JSON.parse(storedProgress);
          console.log('Loaded current progress from AsyncStorage:', currentProgressData);
        } else {
          console.log('No stored progress found');
        }
      }
      
      setCurrentProgress(currentProgressData);
      
      // Calculate total bottles saved and trees planted
      const bottlesSaved = Math.floor(currentProgressData.currentIntake / 500);
      const treesPlanted = Math.floor(currentProgressData.currentIntake / 100000);
      setTotalBottlesSaved(bottlesSaved);
      setTotalTreesPlanted(treesPlanted);

      // Load weekly stats (simplified - in a real app you'd store historical data)
      const weeklyData = await AsyncStorage.getItem('weeklyStats');
      if (weeklyData) {
        setWeeklyStats(JSON.parse(weeklyData));
      } else {
        // Generate mock weekly data for demonstration
        const mockWeeklyStats: WeeklyStats = {
          totalIntake: currentProgressData.currentIntake * 7,
          averageIntake: currentProgressData.currentIntake,
          goalReachedDays: Math.min(currentProgressData.streakDays, 7),
          bestDay: Math.max(currentProgressData.currentIntake, 2500),
        };
        setWeeklyStats(mockWeeklyStats);
      }

      // Generate weekly chart data with the loaded current progress
      await generateWeeklyChartData(currentProgressData);

      // Load achievements
      const storedAchievements = await AsyncStorage.getItem('achievements');
      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      } else {
        // Update achievements based on current progress
        updateAchievements();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updateAchievements = () => {
    const updatedAchievements = ACHIEVEMENTS.map(achievement => {
      let progress = 0;
      
      switch (achievement.id) {
        case 'first_goal':
          progress = currentProgress.lastGoalReached ? 1 : 0;
          break;
        case 'streak_3':
          progress = Math.min(currentProgress.streakDays, 3);
          break;
        case 'streak_7':
          progress = Math.min(currentProgress.streakDays, 7);
          break;
        case 'streak_30':
          progress = Math.min(currentProgress.streakDays, 30);
          break;
        case 'bottles_10':
          progress = Math.min(totalBottlesSaved, 10);
          break;
        case 'bottles_100':
          progress = Math.min(totalBottlesSaved, 100);
          break;
      }

      return {
        ...achievement,
        progress,
        unlocked: progress >= achievement.maxProgress,
      };
    });

    setAchievements(updatedAchievements);
    AsyncStorage.setItem('achievements', JSON.stringify(updatedAchievements));
  };

  const getPeriodStats = () => {
    switch (selectedPeriod) {
      case 'today':
        return {
          intake: currentProgress.currentIntake,
          goal: data.dailyGoal || 2500,
          percentage: Math.min(currentProgress.currentIntake / (data.dailyGoal || 2500), 1),
        };
      case 'week':
        return {
          intake: weeklyStats.totalIntake,
          goal: (data.dailyGoal || 2500) * 7,
          percentage: Math.min(weeklyStats.totalIntake / ((data.dailyGoal || 2500) * 7), 1),
        };
      case 'month':
        return {
          intake: weeklyStats.totalIntake * 4, // Simplified
          goal: (data.dailyGoal || 2500) * 30,
          percentage: Math.min((weeklyStats.totalIntake * 4) / ((data.dailyGoal || 2500) * 30), 1),
        };
      default:
        return { intake: 0, goal: 2500, percentage: 0 };
    }
  };

  const generateWeeklyChartData = async (currentProgressData?: DailyProgress) => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData: WeeklyChartData[] = [];
    
    // Use passed current progress data or fall back to state
    const progressData = currentProgressData || currentProgress;
    
    console.log('Generating weekly chart data with progress:', progressData);
    
    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const isToday = i === 0;
      
      // Try to load actual data from storage
      let intake = 0;
      if (isToday) {
        intake = progressData.currentIntake;
        console.log(`Today (${dateString}): ${intake}ml from current progress`);
      } else {
        // Try to load from database first if user is authenticated
        if (user) {
          try {
            const { data: dbProgress, error: dbError } = await supabaseService.getDailyProgress(user.id, dateString);
            if (dbProgress && !dbError) {
              intake = dbProgress.current_intake;
              console.log(`${dateString} (${dayName}): ${intake}ml from database`);
            } else {
              // Fallback to AsyncStorage
              const historicalData = await AsyncStorage.getItem(`dailyProgress_${dateString}`);
              if (historicalData) {
                const parsedData = JSON.parse(historicalData);
                intake = parsedData.currentIntake || 0;
                console.log(`${dateString} (${dayName}): ${intake}ml from AsyncStorage`);
              } else {
                // Generate realistic mock data if no data exists
                const baseIntake = data.dailyGoal || 2500;
                const randomFactor = 0.6 + Math.random() * 0.8; // 60% to 140% of goal
                intake = Math.floor(baseIntake * randomFactor);
                console.log(`${dateString} (${dayName}): ${intake}ml from mock data`);
              }
            }
          } catch (dbError) {
            console.error('Error loading from database:', dbError);
            // Fallback to AsyncStorage
            const historicalData = await AsyncStorage.getItem(`dailyProgress_${dateString}`);
            if (historicalData) {
              const parsedData = JSON.parse(historicalData);
              intake = parsedData.currentIntake || 0;
              console.log(`${dateString} (${dayName}): ${intake}ml from AsyncStorage fallback`);
            } else {
              // Generate realistic mock data if no data exists
              const baseIntake = data.dailyGoal || 2500;
              const randomFactor = 0.6 + Math.random() * 0.8;
              intake = Math.floor(baseIntake * randomFactor);
              console.log(`${dateString} (${dayName}): ${intake}ml from mock data fallback`);
            }
          }
        } else {
          // Load historical data from AsyncStorage only if not authenticated
          try {
            const historicalData = await AsyncStorage.getItem(`dailyProgress_${dateString}`);
            if (historicalData) {
              const parsedData = JSON.parse(historicalData);
              intake = parsedData.currentIntake || 0;
              console.log(`${dateString} (${dayName}): ${intake}ml from AsyncStorage`);
            } else {
              // Generate realistic mock data if no historical data exists
              const baseIntake = data.dailyGoal || 2500;
              const randomFactor = 0.6 + Math.random() * 0.8; // 60% to 140% of goal
              intake = Math.floor(baseIntake * randomFactor);
              console.log(`${dateString} (${dayName}): ${intake}ml from mock data`);
            }
          } catch (error) {
            console.error('Error loading historical data:', error);
            // Fallback to mock data
            const baseIntake = data.dailyGoal || 2500;
            const randomFactor = 0.6 + Math.random() * 0.8;
            intake = Math.floor(baseIntake * randomFactor);
            console.log(`${dateString} (${dayName}): ${intake}ml from fallback mock data`);
          }
        }
      }
      
      weeklyData.push({
        day: dayName,
        intake,
        goal: data.dailyGoal || 2500,
        date: dateString,
        isToday,
      });
    }
    
    console.log('Final weekly data:', weeklyData);
    setWeeklyChartData(weeklyData);
  };

  const periodStats = getPeriodStats();

  const WeeklyChart = () => {
    const maxIntake = Math.max(...weeklyChartData.map(d => d.intake), data.dailyGoal || 2500);
    const weeklyTotal = weeklyChartData.reduce((sum, day) => sum + day.intake, 0);
    const weeklyAverage = Math.round(weeklyTotal / 7);
    const goalReachedDays = weeklyChartData.filter(day => day.intake >= day.goal).length;
    
    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.chartHeader}>
          <MaterialCommunityIcons name="chart-bar" size={24} color={theme.accent} />
          <Text style={[styles.chartTitle, { color: theme.text }]}>Weekly Intake</Text>
        </View>
        
        {/* Weekly Summary */}
        <View style={[styles.weeklySummary, { backgroundColor: theme.background + '40' }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{weeklyTotal}ml</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{weeklyAverage}ml</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Average</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{goalReachedDays}/7</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Goal Days</Text>
          </View>
        </View>
        
        <View style={styles.chartContent}>
          {weeklyChartData.map((dayData, index) => {
            const percentage = maxIntake > 0 ? dayData.intake / maxIntake : 0;
            const goalPercentage = maxIntake > 0 ? dayData.goal / maxIntake : 0;
            const isGoalReached = dayData.intake >= dayData.goal;
            
            return (
              <View key={dayData.date} style={styles.chartBarContainer}>
                {/* Day Label */}
                <Text style={[
                  styles.chartDayLabel,
                  { 
                    color: dayData.isToday ? theme.accent : theme.textSecondary,
                    fontWeight: dayData.isToday ? 'bold' : 'normal',
                  }
                ]}>
                  {dayData.day}
                </Text>
                
                {/* Bar Container */}
                <View style={styles.chartBarWrapper}>
                  {/* Goal line */}
                  <View 
                    style={[
                      styles.goalLine,
                      { 
                        bottom: `${goalPercentage * 100}%`,
                        backgroundColor: theme.textSecondary + '40',
                      }
                    ]} 
                  />
                  
                  {/* Bar */}
                  <Animated.View
                    style={[
                      styles.chartBar,
                      {
                        height: `${percentage * 100}%`,
                        backgroundColor: dayData.isToday 
                          ? (isGoalReached ? colors.accent.green : colors.accent.orange)
                          : (isGoalReached ? colors.accent.green + '80' : theme.accent + '80'),
                        borderColor: dayData.isToday 
                          ? (isGoalReached ? colors.accent.green : colors.accent.orange)
                          : (isGoalReached ? colors.accent.green + '40' : theme.accent + '40'),
                      }
                    ]}
                  />
                </View>
                
                {/* Value and Check Icon Container */}
                <View style={styles.chartValueContainer}>
                  <Text style={[
                    styles.chartValue,
                    { 
                      color: isGoalReached ? colors.accent.green : theme.textSecondary,
                      fontWeight: isGoalReached ? 'bold' : 'normal',
                    }
                  ]}>
                    {dayData.intake}ml
                  </Text>
                  
                  {isGoalReached && (
                    <MaterialCommunityIcons 
                      name="check-circle" 
                      size={10} 
                      color={colors.accent.green} 
                      style={styles.goalCheck}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent.orange }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.accent + '80' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Other Days</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent.green }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Goal Reached</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: theme.textSecondary + '40' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Daily Goal</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Your Stats</Text>
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => {
                  console.log('Manual refresh pressed');
                  loadStats();
                }}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
            <View style={styles.placeholder} />
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Track your hydration journey
          </Text>
        </Animated.View>

        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          {TIME_PERIODS.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.id 
                    ? theme.accent 
                    : theme.surface,
                }
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <MaterialCommunityIcons 
                name={period.icon as any} 
                size={20} 
                color={selectedPeriod === period.id ? theme.background : theme.text} 
              />
              <Text style={[
                styles.periodLabel,
                { color: selectedPeriod === period.id ? theme.background : theme.text }
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Chart */}
        {selectedPeriod === 'week' && <WeeklyChart />}

        {/* Main Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Progress Card */}
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="water" size={24} color={theme.accent} />
              <Text style={[styles.statTitle, { color: theme.text }]}>Water Intake</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {periodStats.intake}ml
            </Text>
            <Text style={[styles.statGoal, { color: theme.textSecondary }]}>
              Goal: {periodStats.goal}ml
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${periodStats.percentage * 100}%`,
                    backgroundColor: theme.accent,
                  }
                ]} 
              />
            </View>
          </View>

          {/* Streak Card */}
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="fire" size={24} color={colors.accent.orange} />
              <Text style={[styles.statTitle, { color: theme.text }]}>Current Streak</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {currentProgress.streakDays} days
            </Text>
            <Text style={[styles.statSubtext, { color: theme.textSecondary }]}>
              Keep it going!
            </Text>
          </View>

          {/* Environmental Impact */}
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="leaf" size={24} color={colors.accent.green} />
              <Text style={[styles.statTitle, { color: theme.text }]}>Bottles Saved</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {totalBottlesSaved}
            </Text>
            <Text style={[styles.statSubtext, { color: theme.textSecondary }]}>
              {totalTreesPlanted} trees planted
            </Text>
          </View>

          {/* Weekly Average */}
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color={theme.accent} />
              <Text style={[styles.statTitle, { color: theme.text }]}>Weekly Average</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {weeklyStats.averageIntake}ml
            </Text>
            <Text style={[styles.statSubtext, { color: theme.textSecondary }]}>
              {weeklyStats.goalReachedDays}/7 days
            </Text>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Unlock achievements by staying hydrated
          </Text>
          
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <Animated.View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  {
                    backgroundColor: achievement.unlocked ? theme.accent + '20' : theme.surface,
                    borderColor: achievement.unlocked ? theme.accent : theme.border,
                    transform: [{ scale: scaleAnims[index] }],
                  }
                ]}
              >
                <View style={[
                  styles.achievementIcon,
                  { 
                    backgroundColor: achievement.unlocked 
                      ? theme.accent 
                      : theme.textDisabled + '20' 
                  }
                ]}>
                  <MaterialCommunityIcons
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.unlocked ? theme.background : theme.textDisabled}
                  />
                </View>
                <Text style={[
                  styles.achievementTitle,
                  { color: achievement.unlocked ? theme.accent : theme.text }
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  { color: theme.textSecondary }
                ]}>
                  {achievement.description}
                </Text>
                <View style={styles.achievementProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                          backgroundColor: achievement.unlocked ? theme.accent : theme.textDisabled,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[
                    styles.progressText,
                    { color: theme.textSecondary }
                  ]}>
                    {achievement.progress}/{achievement.maxProgress}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statGoal: {
    fontSize: 12,
    marginBottom: 8,
  },
  statSubtext: {
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  achievementsGrid: {
    gap: 12,
  },
  achievementCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    minWidth: 30,
  },
  // Chart styles
  chartContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weeklySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    height: 220,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 4,
  },
  chartBarWrapper: {
    width: 28,
    height: 140,
    position: 'relative',
    marginVertical: 8,
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    borderWidth: 1,
    position: 'absolute',
    bottom: 0,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  chartDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  chartValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  chartValue: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  goalCheck: {
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLine: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 12,
  },
}); 
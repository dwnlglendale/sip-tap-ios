import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, getThemeColors } from '../theme/colors';
import { useColorScheme } from 'react-native';
import { usePersonalization } from '../contexts/PersonalizationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

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
      loadStats();
    }, [])
  );

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
      // Load current progress
      const storedProgress = await AsyncStorage.getItem('dailyProgress');
      if (storedProgress) {
        const progressData = JSON.parse(storedProgress);
        setCurrentProgress(progressData);
        
        // Calculate total bottles saved and trees planted
        const bottlesSaved = Math.floor(progressData.currentIntake / 500);
        const treesPlanted = Math.floor(progressData.currentIntake / 100000);
        setTotalBottlesSaved(bottlesSaved);
        setTotalTreesPlanted(treesPlanted);
      }

      // Load weekly stats (simplified - in a real app you'd store historical data)
      const weeklyData = await AsyncStorage.getItem('weeklyStats');
      if (weeklyData) {
        setWeeklyStats(JSON.parse(weeklyData));
      } else {
        // Generate mock weekly data for demonstration
        const mockWeeklyStats: WeeklyStats = {
          totalIntake: currentProgress.currentIntake * 7,
          averageIntake: currentProgress.currentIntake,
          goalReachedDays: Math.min(currentProgress.streakDays, 7),
          bestDay: Math.max(currentProgress.currentIntake, 2500),
        };
        setWeeklyStats(mockWeeklyStats);
      }

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

  const periodStats = getPeriodStats();

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
}); 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseService } from './supabase';

export interface MigrationStatus {
  dailyProgress: boolean;
  achievements: boolean;
  userPreferences: boolean;
}

export const dataMigrationService = {
  // Check if user has data in AsyncStorage that needs migration
  async checkMigrationNeeded(): Promise<MigrationStatus> {
    try {
      const [dailyProgress, achievements, userPreferences] = await Promise.all([
        AsyncStorage.getItem('dailyProgress'),
        AsyncStorage.getItem('achievements'),
        AsyncStorage.getItem('userPreferences'),
      ]);

      return {
        dailyProgress: !!dailyProgress,
        achievements: !!achievements,
        userPreferences: !!userPreferences,
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        dailyProgress: false,
        achievements: false,
        userPreferences: false,
      };
    }
  },

  // Migrate daily progress data from AsyncStorage to database
  async migrateDailyProgress(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storedProgress = await AsyncStorage.getItem('dailyProgress');
      if (!storedProgress) {
        return { success: true }; // Nothing to migrate
      }

      const progressData = JSON.parse(storedProgress);
      const today = new Date().toISOString().split('T')[0];

      // Migrate current day's progress
      if (progressData.date === today) {
        const { error } = await supabaseService.upsertDailyProgress({
          user_id: userId,
          date: progressData.date,
          current_intake: progressData.currentIntake || 0,
          goal_reached: progressData.lastGoalReached === progressData.date,
          streak_days: progressData.streakDays || 0,
        });

        if (error) {
          console.error('Error migrating daily progress:', error);
          return { success: false, error: error.message };
        }
      }

      // Migrate historical data (last 7 days)
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const historicalData = await AsyncStorage.getItem(`dailyProgress_${dateString}`);
        if (historicalData) {
          const historicalProgress = JSON.parse(historicalData);
          
          const { error } = await supabaseService.upsertDailyProgress({
            user_id: userId,
            date: historicalProgress.date,
            current_intake: historicalProgress.currentIntake || 0,
            goal_reached: historicalProgress.lastGoalReached === historicalProgress.date,
            streak_days: historicalProgress.streakDays || 0,
          });

          if (error) {
            console.error(`Error migrating historical progress for ${dateString}:`, error);
          }
        }
      }

      // Clear migrated data from AsyncStorage
      await AsyncStorage.multiRemove([
        'dailyProgress',
        'dailyProgress_2024-01-01', // Example date, will be cleaned up
        'dailyProgress_2024-01-02',
        'dailyProgress_2024-01-03',
        'dailyProgress_2024-01-04',
        'dailyProgress_2024-01-05',
        'dailyProgress_2024-01-06',
        'dailyProgress_2024-01-07',
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error migrating daily progress:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Migrate achievements data from AsyncStorage to database
  async migrateAchievements(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storedAchievements = await AsyncStorage.getItem('achievements');
      if (!storedAchievements) {
        // Initialize default achievements if none exist
        const { error } = await supabaseService.initializeUserAchievements(userId);
        if (error) {
          console.error('Error initializing achievements:', error);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      const achievements = JSON.parse(storedAchievements);
      
      // Migrate each achievement
      for (const achievement of achievements) {
        const { error } = await supabaseService.upsertAchievement({
          user_id: userId,
          achievement_type: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          unlocked: achievement.unlocked,
          progress: achievement.progress,
          max_progress: achievement.maxProgress,
        });

        if (error) {
          console.error(`Error migrating achievement ${achievement.id}:`, error);
        }
      }

      // Clear migrated data from AsyncStorage
      await AsyncStorage.removeItem('achievements');

      return { success: true };
    } catch (error) {
      console.error('Error migrating achievements:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Migrate user preferences from AsyncStorage to database
  async migrateUserPreferences(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storedPreferences = await AsyncStorage.getItem('userPreferences');
      if (!storedPreferences) {
        return { success: true }; // Nothing to migrate
      }

      const preferences = JSON.parse(storedPreferences);
      
      // Update user profile with preferences
      const { error } = await supabaseService.updateUserProfile(userId, {
        username: preferences.username,
        weight: preferences.weight || 0,
        activity_level: preferences.activityLevel || 'sedentary',
        daily_goal: preferences.dailyGoal || 2500,
        reminder_mode: preferences.reminderMode || 'smart',
        manual_reminders: preferences.manualReminders || [],
        eco_choice: preferences.ecoChoice || 'skip',
      });

      if (error) {
        console.error('Error migrating user preferences:', error);
        return { success: false, error: error.message };
      }

      // Clear migrated data from AsyncStorage
      await AsyncStorage.removeItem('userPreferences');

      return { success: true };
    } catch (error) {
      console.error('Error migrating user preferences:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Perform complete migration
  async performMigration(userId: string): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Migrate daily progress
    const dailyProgressResult = await this.migrateDailyProgress(userId);
    if (!dailyProgressResult.success) {
      errors.push(`Daily Progress: ${dailyProgressResult.error}`);
    }

    // Migrate achievements
    const achievementsResult = await this.migrateAchievements(userId);
    if (!achievementsResult.success) {
      errors.push(`Achievements: ${achievementsResult.error}`);
    }

    // Migrate user preferences
    const preferencesResult = await this.migrateUserPreferences(userId);
    if (!preferencesResult.success) {
      errors.push(`User Preferences: ${preferencesResult.error}`);
    }

    return {
      success: errors.length === 0,
      errors,
    };
  },
}; 
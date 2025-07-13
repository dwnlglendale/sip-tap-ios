import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
// In production, these should be stored in environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL' || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ Supabase configuration error:');
  console.error('   Missing or invalid environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('   - EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  console.error('');
  console.error('   Please create a .env file in your project root with:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
  console.error('');
  console.error('   Then restart your development server.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface User {
  id: string;
  email?: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  weight: number;
  activity_level: 'sedentary' | 'active' | 'athlete';
  daily_goal: number;
  reminder_mode: 'smart' | 'manual';
  manual_reminders?: string[];
  eco_choice: 'bottles' | 'trees' | 'skip';
  created_at: string;
  updated_at: string;
}

export interface DailyProgress {
  id: string;
  user_id: string;
  date: string;
  current_intake: number;
  goal_reached: boolean;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  max_progress: number;
  unlocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount: number;
  logged_at: string;
  created_at: string;
}

// Helper functions for database operations
export const supabaseService = {
  // User authentication
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { user: null, error };
    }
  },

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error };
    } catch (error) {
      console.error('Error getting session:', error);
      return { session: null, error };
    }
  },

  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      return { data, error };
    } catch (error) {
      console.error('Error refreshing session:', error);
      return { data: null, error };
    }
  },

  // User profile management
  async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single();
    return { data, error };
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Daily progress management
  async getDailyProgress(userId: string, date: string) {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    return { data, error };
  },

  async createDailyProgress(progress: Omit<DailyProgress, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('daily_progress')
      .insert([progress])
      .select()
      .single();
    return { data, error };
  },

  async updateDailyProgress(id: string, updates: Partial<DailyProgress>) {
    const { data, error } = await supabase
      .from('daily_progress')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async upsertDailyProgress(progress: Omit<DailyProgress, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('daily_progress')
      .upsert([progress], { onConflict: 'user_id,date' })
      .select()
      .single();
    return { data, error };
  },

  // Get weekly progress data for charts
  async getWeeklyProgress(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    return { data, error };
  },

  // Get or create daily progress (with fallback to water_logs calculation)
  async getOrCreateDailyProgress(userId: string, date: string) {
    // First try to get existing daily progress
    const { data: existingProgress, error: getError } = await this.getDailyProgress(userId, date);
    
    if (existingProgress) {
      return { data: existingProgress, error: null };
    }

    // If no daily progress exists, calculate from water logs
    const { data: waterLogs, error: logsError } = await supabase
      .from('water_logs')
      .select('amount')
      .eq('user_id', userId)
      .gte('logged_at', `${date}T00:00:00`)
      .lt('logged_at', `${date}T23:59:59`);

    if (logsError) {
      return { data: null, error: logsError };
    }

    const totalIntake = waterLogs?.reduce((sum, log) => sum + log.amount, 0) || 0;
    
    // Get user's daily goal
    const { data: profile } = await this.getUserProfile(userId);
    const dailyGoal = profile?.daily_goal || 2500;
    const goalReached = totalIntake >= dailyGoal;

    // Create daily progress record
    const newProgress = {
      user_id: userId,
      date,
      current_intake: totalIntake,
      goal_reached: goalReached,
      streak_days: 0, // Will be calculated separately
    };

    const { data: createdProgress, error: createError } = await this.createDailyProgress(newProgress);
    return { data: createdProgress, error: createError };
  },

  // Water logging
  async logWater(userId: string, amount: number) {
    const { data, error } = await supabase
      .from('water_logs')
      .insert([{
        user_id: userId,
        amount,
        logged_at: new Date().toISOString(),
      }])
      .select()
      .single();
    return { data, error };
  },

  async getWaterLogs(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startDate)
      .lte('logged_at', endDate)
      .order('logged_at', { ascending: false });
    return { data, error };
  },

  // Achievements
  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  async createAchievement(achievement: Omit<Achievement, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('achievements')
      .insert([achievement])
      .select()
      .single();
    return { data, error };
  },

  async updateAchievement(id: string, updates: Partial<Achievement>) {
    const { data, error } = await supabase
      .from('achievements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async upsertAchievement(achievement: Omit<Achievement, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('achievements')
      .upsert([achievement], { onConflict: 'user_id,achievement_type' })
      .select()
      .single();
    return { data, error };
  },

  // Initialize default achievements for a user
  async initializeUserAchievements(userId: string) {
    const defaultAchievements = [
      {
        user_id: userId,
        achievement_type: 'first_goal',
        title: 'First Goal',
        description: 'Reach your daily goal for the first time',
        icon: 'trophy',
        unlocked: false,
        progress: 0,
        max_progress: 1,
      },
      {
        user_id: userId,
        achievement_type: 'streak_3',
        title: '3-Day Streak',
        description: 'Reach your goal 3 days in a row',
        icon: 'fire',
        unlocked: false,
        progress: 0,
        max_progress: 3,
      },
      {
        user_id: userId,
        achievement_type: 'streak_7',
        title: 'Week Warrior',
        description: 'Reach your goal 7 days in a row',
        icon: 'fire',
        unlocked: false,
        progress: 0,
        max_progress: 7,
      },
      {
        user_id: userId,
        achievement_type: 'streak_30',
        title: 'Hydration Master',
        description: 'Reach your goal 30 days in a row',
        icon: 'crown',
        unlocked: false,
        progress: 0,
        max_progress: 30,
      },
      {
        user_id: userId,
        achievement_type: 'bottles_10',
        title: 'Eco Warrior',
        description: 'Save 10 plastic bottles',
        icon: 'recycle',
        unlocked: false,
        progress: 0,
        max_progress: 10,
      },
      {
        user_id: userId,
        achievement_type: 'bottles_100',
        title: 'Ocean Protector',
        description: 'Save 100 plastic bottles',
        icon: 'fish',
        unlocked: false,
        progress: 0,
        max_progress: 100,
      },
    ];

    const { data, error } = await supabase
      .from('achievements')
      .upsert(defaultAchievements, { onConflict: 'user_id,achievement_type' })
      .select();
    
    return { data, error };
  },

  // Statistics
  async getWeeklyStats(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    return { data, error };
  },

  async getMonthlyStats(userId: string, year: number, month: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    return { data, error };
  },
}; 
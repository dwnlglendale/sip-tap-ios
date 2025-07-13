import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, supabaseService, UserProfile } from '../services/supabase';
import { dataMigrationService } from '../services/dataMigration';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const clearSession = async () => {
    try {
      console.log('Clearing session...');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const checkUser = async () => {
    try {
      console.log('Checking user session...');
      
      // Check if Supabase is properly configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Supabase not configured - skipping session check');
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 10000)
      );
      
      const sessionCheckPromise = (async () => {
        // First check if there's an existing session
        const { session, error: sessionError } = await supabaseService.getSession();
        
        if (sessionError || !session) {
          console.log('No existing session found - user needs to sign in');
          setUser(null);
          setProfile(null);
          return;
        }

        // If session exists, get the user immediately (skip refresh for speed)
        const { user, error } = await supabaseService.getCurrentUser();
        
        if (error) {
          console.error('Error getting current user:', error);
          
          // Handle specific JWT errors
          if (error.message?.includes('User from sub claim in JWT does not exist')) {
            console.log('JWT user mismatch detected, clearing invalid session');
            await clearSession();
            return;
          }
          
          // For other errors, try to clear the session
          await clearSession();
        } else if (user) {
          setUser(user);
          // Load profile in background without waiting
          loadUserProfile(user.id).catch(error => {
            console.error('Background profile loading error:', error);
          });
          
          // Check and perform data migration if needed
          checkAndMigrateData(user.id).catch(error => {
            console.error('Data migration error:', error);
          });
        } else {
          console.log('No user found in session');
          await clearSession();
        }
      })();
      
      await Promise.race([sessionCheckPromise, timeoutPromise]);
      
    } catch (error) {
      console.error('Error checking user:', error);
      // Clear any invalid session and continue
      await clearSession();
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const checkAndMigrateData = async (userId: string) => {
    try {
      console.log('Checking for data migration...');
      const migrationStatus = await dataMigrationService.checkMigrationNeeded();
      
      if (migrationStatus.dailyProgress || migrationStatus.achievements || migrationStatus.userPreferences) {
        console.log('Migration needed, performing data migration...');
        const result = await dataMigrationService.performMigration(userId);
        
        if (result.success) {
          console.log('Data migration completed successfully');
        } else {
          console.error('Data migration failed:', result.errors);
        }
      } else {
        console.log('No migration needed');
      }
    } catch (error) {
      console.error('Error during data migration check:', error);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);
      const { data, error } = await supabaseService.getUserProfile(userId);
      
      if (error) {
        // If profile doesn't exist, create it
        if (error.message?.includes('0 rows') || error.message?.includes('JSON object requested')) {
          console.log('Profile not found, creating default profile...');
          const defaultProfile = {
            user_id: userId,
            username: 'User',
            weight: 0,
            activity_level: 'sedentary' as const,
            daily_goal: 2500,
            reminder_mode: 'smart' as const,
            eco_choice: 'skip' as const,
          };
          
          const { data: newProfile, error: createError } = await supabaseService.createUserProfile(defaultProfile);
          if (createError) {
            console.error('Error creating default profile:', createError);
            // If we can't create a profile, the user might not exist in the database
            // Clear the session to force re-authentication
            console.log('Profile creation failed, clearing session');
            await clearSession();
            setProfile(null);
          } else {
            console.log('Default profile created successfully');
            setProfile(newProfile);
          }
        } else {
          console.error('Unexpected error loading profile:', error);
          // For other errors, try to clear the session
          await clearSession();
          setProfile(null);
        }
      } else {
        console.log('Profile loaded successfully');
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Clear session on any profile loading error
      await clearSession();
      setProfile(null);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log('Signing up user:', email);
      const { data, error } = await supabaseService.signUp(email, password, username);
      if (error) throw error;
      
      // Create user profile after successful signup (fallback if trigger fails)
      if (data.user) {
        try {
          const profileData = {
            user_id: data.user.id,
            username,
            weight: 0,
            activity_level: 'sedentary' as const,
            daily_goal: 2500,
            reminder_mode: 'smart' as const,
            eco_choice: 'skip' as const,
          };
          
          const { error: profileError } = await supabaseService.createUserProfile(profileData);
          if (profileError) {
            console.warn('Trigger failed, manually creating profile:', profileError);
            // Don't throw error here, just log it
          }
          
          await loadUserProfile(data.user.id);
        } catch (profileError) {
          console.warn('Error creating profile:', profileError);
          // Don't fail the signup if profile creation fails
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email);
      const { data, error } = await supabaseService.signIn(email, password);
      if (error) throw error;
      
      if (data.user) {
        await loadUserProfile(data.user.id);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      const { error } = await supabaseService.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };
    
    try {
      const { data, error } = await supabaseService.updateUserProfile(user.id, updates);
      if (error) throw error;
      
      setProfile(data);
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    clearSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
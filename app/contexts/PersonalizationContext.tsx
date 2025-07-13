import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabaseService } from '../services/supabase';

export interface PersonalizationData {
  username?: string;
  nextReminder?: string;
  temperature?: number;
  // Hydration Goal Data
  weight: string;
  activityLevel: 'sedentary' | 'active' | 'athlete' | null;
  dailyGoal: number | null;

  // Reminder Preferences
  reminderMode: 'smart' | 'manual' | null;
  manualReminders?: string[]; // Time slots for manual reminders

  // Gamification Preferences
  streakGoal?: number;

  // Eco-Friendly Preferences
  ecoChoice: 'bottles' | 'trees' | 'skip' | null;
}

interface PersonalizationContextType {
  data: PersonalizationData;
  updateData: (updates: Partial<PersonalizationData>) => void;
}

const defaultData: PersonalizationData = {
  weight: '',
  activityLevel: null,
  dailyGoal: null,
  reminderMode: null,
  ecoChoice: null,
};

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [data, setData] = useState<PersonalizationData>(defaultData);

  // Load user profile data when user changes
  useEffect(() => {
    if (profile) {
      setData({
        username: profile.username,
        weight: profile.weight.toString(),
        activityLevel: profile.activity_level,
        dailyGoal: profile.daily_goal,
        reminderMode: profile.reminder_mode,
        manualReminders: profile.manual_reminders || [],
        ecoChoice: profile.eco_choice,
      });
    } else {
      setData(defaultData);
    }
  }, [profile]);

  const updateData = async (updates: Partial<PersonalizationData>) => {
    if (!user) return;

    // Update local state immediately
    setData(current => ({
      ...current,
      ...updates,
    }));

    // Update Supabase profile
    try {
      const profileUpdates: any = {};
      
      if (updates.username !== undefined) profileUpdates.username = updates.username;
      if (updates.weight !== undefined) profileUpdates.weight = parseFloat(updates.weight) || 0;
      if (updates.activityLevel !== undefined) profileUpdates.activity_level = updates.activityLevel;
      if (updates.dailyGoal !== undefined) profileUpdates.daily_goal = updates.dailyGoal;
      if (updates.reminderMode !== undefined) profileUpdates.reminder_mode = updates.reminderMode;
      if (updates.manualReminders !== undefined) profileUpdates.manual_reminders = updates.manualReminders;
      if (updates.ecoChoice !== undefined) profileUpdates.eco_choice = updates.ecoChoice;

      await supabaseService.updateUserProfile(user.id, profileUpdates);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <PersonalizationContext.Provider value={{ data, updateData }}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
} 
import React, { createContext, useContext, useState } from 'react';

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
  const [data, setData] = useState<PersonalizationData>(defaultData);

  const updateData = (updates: Partial<PersonalizationData>) => {
    setData(current => ({
      ...current,
      ...updates,
    }));
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
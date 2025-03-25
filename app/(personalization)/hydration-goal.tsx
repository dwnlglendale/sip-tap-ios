import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';

// Types
type ActivityLevel = 'sedentary' | 'active' | 'athlete';

interface ActivityOption {
  label: string;
  value: ActivityLevel;
  description: string;
}

// Constants
const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    label: 'Sedentary',
    value: 'sedentary',
    description: 'Little to no exercise, desk job',
  },
  {
    label: 'Active',
    value: 'active',
    description: 'Regular exercise, moderate activity',
  },
  {
    label: 'Athlete',
    value: 'athlete',
    description: 'Intensive training, high activity',
  },
];

export default function HydrationGoal() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // State
  const [weight, setWeight] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);

  // Calculate daily water goal (in ml)
  const calculateDailyGoal = () => {
    if (!weight || !selectedActivity) return;

    const weightInKg = parseFloat(weight);
    let multiplier = 30; // Base multiplier

    // Adjust multiplier based on activity level
    switch (selectedActivity) {
      case 'active':
        multiplier = 35;
        break;
      case 'athlete':
        multiplier = 40;
        break;
      default:
        multiplier = 30;
    }

    const goal = weightInKg * multiplier;
    setDailyGoal(Math.round(goal));
  };

  // Recalculate goal whenever weight or activity changes
  useEffect(() => {
    calculateDailyGoal();
  }, [weight, selectedActivity]);

  const handleNext = () => {
    // Here you would typically save the goal to your app's state management
    // For now, we'll just navigate to the next screen
    router.push('/(personalization)/preferences');
  };

  return (
    <ScrollView 
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? colors.secondary.black : colors.secondary.white }
      ]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
        ]}>Set Your Hydration Goal</Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
        ]}>Let's personalize your daily water intake</Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={[
          styles.label,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
        ]}>Your Weight (kg)</Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.white,
              color: isDarkMode ? colors.neutral.white : colors.neutral.black,
              borderColor: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray,
            }
          ]}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="Enter your weight"
          placeholderTextColor={isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray}
        />
      </View>

      <View style={styles.activitySection}>
        <Text style={[
          styles.label,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
        ]}>Activity Level</Text>
        {ACTIVITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.activityOption,
              {
                backgroundColor: selectedActivity === option.value 
                  ? colors.accent.purple 
                  : isDarkMode 
                    ? colors.neutral.darkGray 
                    : colors.secondary.white,
                borderColor: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray,
              }
            ]}
            onPress={() => setSelectedActivity(option.value)}
          >
            <Text style={[
              styles.activityLabel,
              { 
                color: selectedActivity === option.value 
                  ? colors.secondary.white 
                  : isDarkMode 
                    ? colors.neutral.white 
                    : colors.neutral.black,
              }
            ]}>{option.label}</Text>
            <Text style={[
              styles.activityDescription,
              { 
                color: selectedActivity === option.value 
                  ? colors.secondary.white 
                  : isDarkMode 
                    ? colors.neutral.lightGray 
                    : colors.neutral.darkGray,
              }
            ]}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {dailyGoal && (
        <View style={styles.goalSection}>
          <Text style={[
            styles.goalTitle,
            { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
          ]}>Your Daily Goal</Text>
          <Text style={[
            styles.goalAmount,
            { color: colors.primary.main }
          ]}>{dailyGoal}ml</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          { opacity: (!weight || !selectedActivity) ? 0.5 : 1 }
        ]}
        onPress={handleNext}
        disabled={!weight || !selectedActivity}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  inputSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  activitySection: {
    marginBottom: 30,
  },
  activityOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
  },
  goalSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  goalTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  goalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.accent.purple,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.secondary.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
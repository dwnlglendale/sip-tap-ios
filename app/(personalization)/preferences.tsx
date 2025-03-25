import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Types
type ReminderMode = 'smart' | 'manual';

interface ReminderOption {
  label: string;
  value: ReminderMode;
  description: string;
  icon: string; // MaterialCommunityIcons name
}

// Constants
const REMINDER_OPTIONS: ReminderOption[] = [
  {
    label: 'Smart Mode',
    value: 'smart',
    description: 'AI suggests reminders based on your schedule, weather, and activity patterns',
    icon: 'brain', // AI/smart icon
  },
  {
    label: 'Manual Mode',
    value: 'manual',
    description: 'Set your own fixed reminder intervals throughout the day',
    icon: 'clock-time-four', // Clock icon
  },
];

export default function Preferences() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [selectedMode, setSelectedMode] = useState<ReminderMode | null>(null);
  
  // Animation values for each option
  const scaleAnims = useRef(REMINDER_OPTIONS.map(() => new Animated.Value(1))).current;
  const rotateAnims = useRef(REMINDER_OPTIONS.map(() => new Animated.Value(0))).current;

  const handleOptionPress = (value: ReminderMode, index: number) => {
    // Reset all animations
    REMINDER_OPTIONS.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(scaleAnims[i], {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnims[i], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Animate the selected option
    Animated.parallel([
      Animated.spring(scaleAnims[index], {
        toValue: 1.02,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnims[index], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedMode(value);
  };

  const handleNext = () => {
    if (selectedMode === 'manual') {
      router.push('/(personalization)/manual-reminders');
    } else {
      // Navigate to gamification instead of main app
      router.push('/(personalization)/gamification');
    }
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
        ]}>Smart Hydration</Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
        ]}>Choose how you want to receive hydration reminders</Text>
      </View>

      <View style={styles.optionsSection}>
        {REMINDER_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.value}
            style={[
              styles.reminderOptionContainer,
              {
                transform: [
                  { scale: scaleAnims[index] },
                  {
                    rotate: rotateAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '1deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.reminderOption,
                {
                  backgroundColor: selectedMode === option.value 
                    ? colors.accent.purple 
                    : isDarkMode 
                      ? colors.neutral.darkGray 
                      : colors.secondary.white,
                  borderColor: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray,
                }
              ]}
              onPress={() => handleOptionPress(option.value, index)}
            >
              <View style={styles.optionHeader}>
                <MaterialCommunityIcons
                  name={option.icon}
                  size={24}
                  color={
                    selectedMode === option.value
                      ? colors.secondary.white
                      : colors.accent.purple
                  }
                  style={styles.icon}
                />
                <Text style={[
                  styles.optionLabel,
                  { 
                    color: selectedMode === option.value 
                      ? colors.secondary.white 
                      : isDarkMode 
                        ? colors.neutral.white 
                        : colors.neutral.black,
                  }
                ]}>{option.label}</Text>
              </View>
              <Text style={[
                styles.optionDescription,
                { 
                  color: selectedMode === option.value 
                    ? colors.secondary.white 
                    : isDarkMode 
                      ? colors.neutral.lightGray 
                      : colors.neutral.darkGray,
                }
              ]}>{option.description}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { opacity: !selectedMode ? 0.5 : 1 }
        ]}
        onPress={handleNext}
        disabled={!selectedMode}
      >
        <Text style={styles.buttonText}>
          {selectedMode === 'manual' ? 'Set My Own Reminders' : 'Enable Smart Hydration'}
        </Text>
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
  optionsSection: {
    marginBottom: 30,
  },
  reminderOptionContainer: {
    marginBottom: 12,
  },
  reminderOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    marginLeft: 32, // Aligns with text after icon
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
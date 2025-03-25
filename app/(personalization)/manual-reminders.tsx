import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Switch } from 'react-native';
import { colors } from '../theme/colors';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TimeSlot {
  id: string;
  time: string;
  label: string;
  icon: string;
}

const DEFAULT_REMINDERS: TimeSlot[] = [
  { id: 'morning', time: '8:00 AM', label: 'Morning', icon: 'weather-sunny' },
  { id: 'noon', time: '12:00 PM', label: 'Noon', icon: 'weather-sunny' },
  { id: 'afternoon', time: '3:00 PM', label: 'Afternoon', icon: 'weather-partly-cloudy' },
  { id: 'evening', time: '6:00 PM', label: 'Evening', icon: 'weather-night' },
];

export default function ManualReminders() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [enabledReminders, setEnabledReminders] = useState<string[]>(['morning', 'noon', 'afternoon']);
  
  // Animation values for each reminder
  const slideAnims = useRef(DEFAULT_REMINDERS.map(() => new Animated.Value(-50))).current;
  const fadeAnims = useRef(DEFAULT_REMINDERS.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    // Animate reminders in sequence
    DEFAULT_REMINDERS.forEach((_, index) => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.spring(slideAnims[index], {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.timing(fadeAnims[index], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, []);

  const toggleReminder = (id: string) => {
    setEnabledReminders(current => 
      current.includes(id)
        ? current.filter(r => r !== id)
        : [...current, id]
    );
  };

  const handleNext = () => {
    // Navigate to gamification after setting reminders
    router.push('/(personalization)/gamification');
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
        ]}>Set Your Reminders</Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
        ]}>Choose when you'd like to receive hydration reminders</Text>
      </View>

      <View style={styles.remindersSection}>
        {DEFAULT_REMINDERS.map((reminder, index) => (
          <Animated.View
            key={reminder.id}
            style={[
              styles.reminderContainer,
              {
                opacity: fadeAnims[index],
                transform: [{ translateX: slideAnims[index] }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.reminderCard,
                {
                  backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.white,
                  borderColor: enabledReminders.includes(reminder.id)
                    ? colors.accent.purple
                    : isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray,
                }
              ]}
              onPress={() => toggleReminder(reminder.id)}
              activeOpacity={0.8}
            >
              <View style={styles.reminderContent}>
                <View style={styles.reminderInfo}>
                  <MaterialCommunityIcons
                    name={reminder.icon}
                    size={24}
                    color={enabledReminders.includes(reminder.id)
                      ? colors.accent.purple
                      : colors.neutral.lightGray}
                    style={styles.icon}
                  />
                  <View>
                    <Text style={[
                      styles.reminderLabel,
                      { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
                    ]}>{reminder.label}</Text>
                    <Text style={[
                      styles.reminderTime,
                      { color: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray }
                    ]}>{reminder.time}</Text>
                  </View>
                </View>
                <Switch
                  value={enabledReminders.includes(reminder.id)}
                  onValueChange={() => toggleReminder(reminder.id)}
                  trackColor={{ false: colors.neutral.lightGray, true: colors.accent.purple }}
                  thumbColor={colors.secondary.white}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { opacity: enabledReminders.length > 0 ? 1 : 0.5 }
        ]}
        onPress={handleNext}
        disabled={enabledReminders.length === 0}
      >
        <Text style={styles.buttonText}>Continue</Text>
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
  remindersSection: {
    marginBottom: 30,
  },
  reminderContainer: {
    marginBottom: 12,
  },
  reminderCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  reminderTime: {
    fontSize: 14,
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
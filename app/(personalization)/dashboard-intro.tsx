import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePersonalization } from '../contexts/PersonalizationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const FEATURES: Feature[] = [
  {
    id: 'logging',
    title: 'Quick Drink Logging',
    description: 'Track your water intake with just one tap',
    icon: 'water',
  },
  {
    id: 'reminders',
    title: 'Smart Reminders & Streaks',
    description: 'Stay on track and build healthy habits',
    icon: 'fire',
  },
  {
    id: 'insights',
    title: 'Hydration Insights',
    description: 'Get personalized recommendations based on your habits',
    icon: 'chart-line',
  },
];

export default function DashboardIntro() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { data } = usePersonalization();

  // Animation values
  const fadeAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(FEATURES.map(() => new Animated.Value(100))).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animate features in sequence
    FEATURES.forEach((_, index) => {
      Animated.sequence([
        Animated.delay(index * 400),
        Animated.parallel([
          Animated.spring(fadeAnims[index], {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnims[index], {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Animate the button
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleStart = async () => {
    try {
      console.log('Saving preferences and navigating to main app...');
      // Save all personalization data to AsyncStorage
      await AsyncStorage.setItem('userPreferences', JSON.stringify(data));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      console.log('Preferences saved successfully');
      
      // Navigate to the main app
      console.log('Navigating to home screen...');
      router.replace('/(app)/home');
      console.log('Navigation command executed');
    } catch (error) {
      console.error('Error during navigation:', error);
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
        ]}>Welcome to Your Dashboard</Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
        ]}>Here's what you can do with SipTap</Text>
      </View>

      <View style={styles.featuresSection}>
        {FEATURES.map((feature, index) => (
          <Animated.View
            key={feature.id}
            style={[
              styles.featureCard,
              {
                backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.white,
                opacity: fadeAnims[index],
                transform: [{ translateX: slideAnims[index] }],
              },
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.accent.purple }]}>
              <MaterialCommunityIcons
                name={feature.icon}
                size={28}
                color={colors.secondary.white}
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={[
                styles.featureTitle,
                { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
              ]}>{feature.title}</Text>
              <Text style={[
                styles.featureDescription,
                { color: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray }
              ]}>{feature.description}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
        >
          <MaterialCommunityIcons
            name="play-circle"
            size={24}
            color={colors.secondary.white}
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Start Tracking</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  featuresSection: {
    marginBottom: 40,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.accent.purple,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: colors.secondary.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
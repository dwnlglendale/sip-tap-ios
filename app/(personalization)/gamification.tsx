import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StreakLevel {
  name: string;
  days: number;
  icon: string;
  emoji: string;
  color: string;
}

const STREAK_LEVELS: StreakLevel[] = [
  {
    name: 'Beginner',
    days: 14,
    icon: 'fire',
    emoji: '🔥',
    color: colors.accent.green,
  },
  {
    name: 'Hydration Hero',
    days: 60,
    icon: 'lightning-bolt',
    emoji: '⚡',
    color: '#FFB700', // Gold color
  },
  {
    name: 'Elite Hydrator',
    days: 180,
    icon: 'diamond-stone',
    emoji: '💎',
    color: '#00B4D8', // Cyan color
  },
  {
    name: 'Hydration Master',
    days: 365,
    icon: 'trophy',
    emoji: '🏆',
    color: '#9B5DE5', // Purple color
  },
];

export default function Gamification() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Animation values for each streak level
  const fadeAnims = useRef(STREAK_LEVELS.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(STREAK_LEVELS.map(() => new Animated.Value(50))).current;
  const scaleAnims = useRef(STREAK_LEVELS.map(() => new Animated.Value(0.95))).current;

  useEffect(() => {
    // Animate each streak level with a staggered delay
    STREAK_LEVELS.forEach((_, index) => {
      Animated.sequence([
        Animated.delay(index * 200), // Stagger each animation
        Animated.parallel([
          Animated.spring(fadeAnims[index], {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnims[index], {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnims[index], {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, []);

  const handleContinue = () => {
    router.push('/(personalization)/eco-friendly');
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
        ]}>Track Your Progress</Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
        ]}>Stay motivated with streaks and achievements</Text>
      </View>

      <View style={styles.streaksSection}>
        {STREAK_LEVELS.map((level, index) => (
          <Animated.View
            key={level.name}
            style={[
              styles.streakCard,
              {
                backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.white,
                borderColor: level.color,
                opacity: fadeAnims[index],
                transform: [
                  { translateX: slideAnims[index] },
                  { scale: scaleAnims[index] },
                ],
              },
            ]}
          >
            <View style={styles.streakHeader}>
              <View style={[styles.iconContainer, { backgroundColor: level.color }]}>
                <MaterialCommunityIcons
                  name={level.icon}
                  size={24}
                  color={colors.secondary.white}
                />
              </View>
              <View style={styles.streakInfo}>
                <Text style={[
                  styles.streakName,
                  { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
                ]}>
                  {level.name} {level.emoji}
                </Text>
                <Text style={[
                  styles.streakDays,
                  { color: level.color }
                ]}>
                  {level.days} day streak
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.leaderboardPreview}>
        <MaterialCommunityIcons
          name="trophy-outline"
          size={24}
          color={colors.accent.purple}
          style={styles.leaderboardIcon}
        />
        <Text style={[
          styles.leaderboardText,
          { color: isDarkMode ? colors.neutral.black : colors.neutral.darkGray }
        ]}>
          Compete with friends and track your progress on the leaderboard
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleContinue}
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
  streaksSection: {
    marginBottom: 30,
  },
  streakCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  streakDays: {
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.secondary.lightBlue,
    borderRadius: 12,
    marginBottom: 30,
  },
  leaderboardIcon: {
    marginRight: 12,
  },
  leaderboardText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
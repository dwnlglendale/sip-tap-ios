import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, useColorScheme, Animated } from 'react-native';
import { colors } from './theme/colors';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Animation values for each word
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tapSlideAnim = useRef(new Animated.Value(100)).current;
  const tapFadeAnim = useRef(new Animated.Value(0)).current;
  const thriveSlideAnim = useRef(new Animated.Value(100)).current;
  const thriveFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // First word animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Second word animation with delay
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(tapFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(tapSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Third word animation with delay
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(thriveFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(thriveSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    // Save onboarding completion status
    AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    // Navigate to username screen
    router.push('/(personalization)/username');
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? colors.secondary.black : colors.secondary.white }
    ]}>
      <View style={styles.content}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={[
            styles.title,
            { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
          ]}>Welcome to SipTap</Text>
          <View style={styles.subtitleContainer}>
            <Animated.Text style={[
              styles.subtitle,
              { 
                color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}>Sip.</Animated.Text>
            <Animated.Text style={[
              styles.subtitle,
              { 
                color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray,
                opacity: tapFadeAnim,
                transform: [{ translateX: tapSlideAnim }],
              }
            ]}> Tap.</Animated.Text>
            <Animated.Text style={[
              styles.subtitle,
              { 
                color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray,
                opacity: thriveFadeAnim,
                transform: [{ translateX: thriveSlideAnim }],
              }
            ]}> Thrive.</Animated.Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 35,
    textAlign: 'center',
  },
  features: {
    width: width * 0.8,
    marginBottom: 40,
  },
  featureText: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.accent.purple,
    paddingHorizontal: '35%',
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  buttonText: {
    color: colors.secondary.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
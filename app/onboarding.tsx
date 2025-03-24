import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, useColorScheme } from 'react-native';
import { colors } from './theme/colors';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleGetStarted = async () => {
    try {
      // Comment out saving for testing
      /*
      console.log('Saving onboarding status...');
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      console.log('Onboarding status saved successfully');
      */
      router.replace('/');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
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
          <Text style={[
            styles.subtitle,
            { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
          ]}>Sip. Tap. Thrive</Text>
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
  subtitle: {
    fontSize: 35,
    marginBottom: 40,
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
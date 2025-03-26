import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { usePersonalization } from '../contexts/PersonalizationContext';

export default function Username() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { updateData } = usePersonalization();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }
    
    updateData({ username: username.trim() });
    router.push('/(personalization)/hydration-goal');
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
        ]}>What's your name?</Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray }
        ]}>We'll use this to personalize your experience</Text>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.white,
              color: isDarkMode ? colors.neutral.white : colors.neutral.black,
              borderColor: error ? colors.accent.red : colors.neutral.lightGray,
            }
          ]}
          placeholder="Enter your name"
          placeholderTextColor={isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray}
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setError('');
          }}
          autoFocus
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { opacity: username.trim() ? 1 : 0.5 }
        ]}
        onPress={handleNext}
        disabled={!username.trim()}
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: 40,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    color: colors.accent.red,
    marginTop: 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.accent.purple,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.secondary.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
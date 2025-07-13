import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePersonalization } from '../contexts/PersonalizationContext';

interface EcoOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  impact: string;
}

const ECO_OPTIONS: EcoOption[] = [
  {
    id: 'bottles',
    title: 'Track Plastic Bottle Reduction',
    description: 'Mark when you drink from a reusable bottle & track plastic waste saved!',
    icon: 'recycle',
    impact: '🌊 Save our oceans from plastic waste',
  },
  {
    id: 'trees',
    title: 'Plant Trees with Hydration',
    description: 'Your hydration streaks help fund tree-planting initiatives.',
    icon: 'tree',
    impact: '🌱 Help grow forests worldwide',
  },
  {
    id: 'skip',
    title: 'Skip for Now',
    description: 'You can always enable eco-tracking later',
    icon: 'chevron-right',
    impact: '',
  },
];

export default function EcoFriendly() {
  const { data, updateData } = usePersonalization();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Animation values
  const fadeAnims = useRef(ECO_OPTIONS.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(ECO_OPTIONS.map(() => new Animated.Value(50))).current;
  const impactCounterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate options in sequence
    ECO_OPTIONS.forEach((_, index) => {
      Animated.sequence([
        Animated.delay(index * 200),
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

    // Animate impact counter
    Animated.spring(impactCounterAnim, {
      toValue: 1,
      tension: 30,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleOptionSelect = (id: string) => {
    console.log('Option selected:', id);
    setSelectedOption(id);
  };

  const handleNext = () => {
    console.log('handleNext called');
    console.log('Selected option:', selectedOption);
    try {
      console.log('Attempting to navigate to dashboard-intro...');
      router.push('/(personalization)/dashboard-intro');
      console.log('Navigation command executed');
    } catch (error) {
      console.error('Navigation error:', error);
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
        ]}>
          {data.username ? `Eco-Friendly Hydration, ${data.username}` : 'Eco-Friendly Hydration'}
        </Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? colors.neutral.white : colors.neutral.darkGray }
        ]}>Every sip makes an impact! Join our eco-friendly initiative.</Text>
      </View>

      <Animated.View style={[
        styles.impactCard,
        {
          backgroundColor: colors.secondary.lightBlue,
          opacity: impactCounterAnim,
          transform: [{ scale: impactCounterAnim }],
        }
      ]}>
        <MaterialCommunityIcons
          name="earth"
          size={24}
          color={colors.accent.green}
          style={styles.earthIcon}
        />
        <Text style={styles.impactText}>
          SipTap users have helped plant 1,234 trees & saved 52,000 plastic bottles!
        </Text>
      </Animated.View>

      <View style={styles.optionsSection}>
        {ECO_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.id}
            style={[
              styles.optionContainer,
              {
                opacity: fadeAnims[index],
                transform: [{ translateY: slideAnims[index] }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: selectedOption === option.id 
                    ? colors.accent.green 
                    : isDarkMode 
                      ? colors.neutral.darkGray 
                      : colors.secondary.white,
                  borderColor: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray,
                }
              ]}
              onPress={() => handleOptionSelect(option.id)}
            >
              <View style={styles.optionHeader}>
                <MaterialCommunityIcons
                  name={option.icon}
                  size={24}
                  color={selectedOption === option.id
                    ? colors.secondary.white
                    : colors.accent.green}
                  style={styles.icon}
                />
                <Text style={[
                  styles.optionTitle,
                  { 
                    color: selectedOption === option.id 
                      ? colors.secondary.white 
                      : isDarkMode 
                        ? colors.neutral.white 
                        : colors.neutral.black,
                  }
                ]}>{option.title}</Text>
              </View>
              <Text style={[
                styles.optionDescription,
                { 
                  color: selectedOption === option.id 
                    ? colors.secondary.white 
                    : isDarkMode 
                      ? colors.neutral.lightGray 
                      : colors.neutral.darkGray,
                }
              ]}>{option.description}</Text>
              {option.impact && (
                <Text style={[
                  styles.impactNote,
                  { 
                    color: selectedOption === option.id 
                      ? colors.secondary.white 
                      : colors.accent.green,
                  }
                ]}>{option.impact}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { opacity: selectedOption ? 1 : 0.5 }
        ]}
        onPress={handleNext}
        disabled={!selectedOption}
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
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  earthIcon: {
    marginRight: 12,
  },
  impactText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral.darkGray,
  },
  optionsSection: {
    marginBottom: 30,
  },
  optionContainer: {
    marginBottom: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  optionDescription: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 36,
  },
  impactNote: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 36,
  },
  button: {
    backgroundColor: colors.accent.green,
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
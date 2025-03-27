import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Modal, Dimensions, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePersonalization } from '../contexts/PersonalizationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CelebrationOverlay from '../components/CelebrationOverlay';

const { width } = Dimensions.get('window');

interface Recommendation {
  amount: number;
  label: string;
  icon: string;
  description: string;
  isRare?: boolean;
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    amount: 100,
    label: 'Small Sip',
    icon: 'water',
    description: 'Perfect for a quick refresh',
  },
  {
    amount: 250,
    label: 'Standard Glass',
    icon: 'glass-water',
    description: 'A typical serving size',
  },
  {
    amount: 500,
    label: 'Water Bottle',
    icon: 'bottle-water',
    description: 'A full water bottle',
  },
  {
    amount: 750,
    label: 'Large Bottle',
    icon: 'bottle-water-plus',
    description: 'A larger water bottle',
  },
  {
    amount: 1000,
    label: 'Mega Hydration',
    icon: 'water-pump',
    description: 'A full liter of water',
    isRare: true,
  },
];

export default function CustomLog() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { data, updateData } = usePersonalization();
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [showRareAnimation, setShowRareAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.5)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;
  const rareScaleAnim = useRef(new Animated.Value(1)).current;
  const rareRotateAnim = useRef(new Animated.Value(0)).current;

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  const handleRecommendationPress = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setAmount(recommendation.amount.toString());
    
    // Animate the selection
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    // Check for rare recommendation
    if (recommendation.isRare) {
      setShowRareAnimation(true);
      Animated.sequence([
        Animated.timing(rareRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(rareScaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(rareScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleSave = async () => {
    const numericAmount = parseInt(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    // Save to AsyncStorage
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedProgress = await AsyncStorage.getItem('dailyProgress');
      const progressData = storedProgress ? JSON.parse(storedProgress) : {};
      
      const updatedProgress = {
        date: today,
        currentIntake: (progressData.currentIntake || 0) + numericAmount,
        streakDays: progressData.streakDays || 0,
        lastGoalReached: progressData.lastGoalReached || '',
      };

      await AsyncStorage.setItem('dailyProgress', JSON.stringify(updatedProgress));

      // Check if user exceeded their daily goal for the first time
      const isFirstTimeExceeding = updatedProgress.currentIntake > data.dailyGoal && 
                                 (progressData.currentIntake || 0) <= data.dailyGoal;

      console.log('Custom log check:', {
        currentIntake: updatedProgress.currentIntake,
        previousIntake: progressData.currentIntake || 0,
        dailyGoal: data.dailyGoal,
        isFirstTimeExceeding
      });

      if (isFirstTimeExceeding) {
        console.log('Showing celebration for first time exceeding goal');
        setShowCelebration(true);
      } else {
        // Show success animation only if not showing celebration
        setShowSuccess(true);
        Animated.parallel([
          Animated.spring(successScaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Error saving custom log:', error);
    }

    // Reset after animation
    setTimeout(() => {
      setShowSuccess(false);
      setAmount('');
      setSelectedRecommendation(null);
      setShowRareAnimation(false);
      successScaleAnim.setValue(0.5);
      successOpacityAnim.setValue(0);
    }, 1500);
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDarkMode ? colors.secondary.black : colors.secondary.white }
    ]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color={isDarkMode ? colors.neutral.white : colors.neutral.black} 
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[
              styles.title,
              { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
            ]}>Custom Log</Text>
            <Text style={[
              styles.subtitle,
              { color: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray }
            ]}>Log your water intake</Text>
          </View>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.white,
                color: isDarkMode ? colors.neutral.white : colors.neutral.black,
                borderColor: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray,
              }
            ]}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            placeholder="Enter amount in ml"
            placeholderTextColor={isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray}
          />
          <TouchableOpacity
            style={[
              styles.saveButton,
              { opacity: amount ? 1 : 0.5 }
            ]}
            onPress={handleSave}
            disabled={!amount}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
          ]}>Quick Add</Text>
          <View style={styles.recommendationsGrid}>
            {RECOMMENDATIONS.map((recommendation) => (
              <Animated.View
                key={recommendation.amount}
                style={[
                  styles.recommendationCard,
                  {
                    backgroundColor: isDarkMode ? colors.neutral.darkGray : colors.secondary.white,
                    transform: [
                      { scale: recommendation.isRare ? rareScaleAnim : scaleAnim },
                      { rotate: recommendation.isRare ? rareRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }) : '0deg' },
                    ],
                  }
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleRecommendationPress(recommendation)}
                  style={styles.recommendationContent}
                >
                  <MaterialCommunityIcons
                    name={recommendation.icon as any}
                    size={24}
                    color={colors.accent.purple}
                  />
                  <Text style={[
                    styles.recommendationLabel,
                    { color: isDarkMode ? colors.neutral.white : colors.neutral.black }
                  ]}>{recommendation.label}</Text>
                  <Text style={[
                    styles.recommendationAmount,
                    { color: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray }
                  ]}>{recommendation.amount}ml</Text>
                  <Text style={[
                    styles.recommendationDescription,
                    { color: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray }
                  ]}>{recommendation.description}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
      >
        <View style={styles.successModal}>
          <Animated.View
            style={[
              styles.successContent,
              {
                transform: [{ scale: successScaleAnim }],
                opacity: successOpacityAnim,
              }
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={64}
              color={colors.accent.green}
            />
            <Text style={styles.successText}>Logged Successfully!</Text>
          </Animated.View>
        </View>
      </Modal>

      <CelebrationOverlay
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    position: 'relative',
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
    flexDirection: 'row',
    marginBottom: 30,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: colors.accent.purple,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.secondary.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recommendationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recommendationCard: {
    width: (width - 60) / 2,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationContent: {
    alignItems: 'center',
  },
  recommendationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  recommendationAmount: {
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  successModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    backgroundColor: colors.secondary.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  successText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent.green,
  },
}); 
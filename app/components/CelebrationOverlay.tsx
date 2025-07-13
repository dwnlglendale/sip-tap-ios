import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useColorScheme } from 'react-native';

const { width, height } = Dimensions.get('window');

interface CelebrationOverlayProps {
  visible: boolean;
  onClose: () => void;
  username?: string;
  streakDays?: number;
  bottlesSaved?: number;
}

export default function CelebrationOverlay({ visible, onClose, username, streakDays, bottlesSaved }: CelebrationOverlayProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start celebration animation sequence
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start();
      // Auto close after 5 seconds
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  // Share achievement
  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just hit my hydration goal${username ? ' as ' + username : ''}! ${streakDays ? `🔥 ${streakDays} day streak!` : ''} ${bottlesSaved ? `Saved ${bottlesSaved} bottles!` : ''} #SipTap`,
      });
    } catch (error) {
      // ignore
    }
  };

  // Simple confetti (animated circles)
  const confettiColors = [colors.accent.purple, colors.accent.green, '#FFD700', '#00B4D8', '#FF6F61'];
  const confetti = Array.from({ length: 18 }).map((_, i) => {
    const left = Math.random() * (width * 0.8 - 20);
    const delay = Math.random() * 400;
    const color = confettiColors[i % confettiColors.length];
    return (
      <Animated.View
        key={i}
        style={{
          position: 'absolute',
          left,
          top: 0,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          opacity: confettiAnim,
          transform: [
            {
              translateY: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 220 + Math.random() * 60],
              }),
            },
            {
              rotate: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${Math.random() * 360}deg`],
              }),
            },
          ],
        }}
      />
    );
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: isDarkMode ? colors.secondary.black : colors.secondary.white,
          },
        ]}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close celebration">
          <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? colors.neutral.white : colors.neutral.black} />
        </TouchableOpacity>
        {/* Confetti */}
        <View style={styles.confettiContainer}>{confetti}</View>
        {/* Main Icon */}
        <MaterialCommunityIcons
          name="trophy"
          size={72}
          color={colors.accent.purple}
          style={{ marginBottom: 12 }}
        />
        {/* Personalized Message */}
        <Text style={[styles.title, { color: isDarkMode ? colors.neutral.white : colors.neutral.black }]}>Congratulations{username ? `, ${username}` : ''}!</Text>
        <Text style={[styles.message, { color: isDarkMode ? colors.neutral.lightGray : colors.neutral.darkGray }]}>You reached your hydration goal! 🥤</Text>
        {/* Stats */}
        <View style={styles.statsRow}>
          {typeof streakDays === 'number' && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={24} color={colors.accent.green} />
              <Text style={styles.statText}>{streakDays} day streak</Text>
            </View>
          )}
          {typeof bottlesSaved === 'number' && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="bottle-soda" size={24} color={colors.accent.purple} />
              <Text style={styles.statText}>{bottlesSaved} bottles saved</Text>
            </View>
          )}
        </View>
        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} accessibilityLabel="Share achievement">
          <MaterialCommunityIcons name="share-variant" size={22} color={colors.secondary.white} />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    width: width * 0.85,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    overflow: 'visible',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 6,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  statText: {
    fontSize: 14,
    marginTop: 4,
    color: colors.neutral.darkGray,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.purple,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 8,
  },
  shareText: {
    color: colors.secondary.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 
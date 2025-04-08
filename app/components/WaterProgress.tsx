import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Svg, Path, Circle, G, Defs, ClipPath } from 'react-native-svg';
import { colors, getThemeColors } from '../theme/colors';
import { useColorScheme } from 'react-native';

interface WaterProgressProps {
  percentage: number;
  size: number;
  currentAmount: number;
  goalAmount: number;
}

export default function WaterProgress({ percentage, size, currentAmount, goalAmount }: WaterProgressProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = getThemeColors(isDarkMode);

  // Animation values
  const waveOffset = useRef(new Animated.Value(0)).current;
  const bubbleY1 = useRef(new Animated.Value(0)).current;
  const bubbleY2 = useRef(new Animated.Value(0)).current;
  const bubbleY3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous wave animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveOffset, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(waveOffset, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bubble animations
    const animateBubble = (bubble: Animated.Value) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubble, {
            toValue: -size,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateBubble(bubbleY1);
    setTimeout(() => animateBubble(bubbleY2), 1000);
    setTimeout(() => animateBubble(bubbleY3), 2000);
  }, []);

  const waterHeight = size * (1 - percentage);
  const radius = size / 2;

  const AnimatedPath = Animated.createAnimatedComponent(Path);
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id="clip">
            <Circle cx={radius} cy={radius} r={radius - 10} />
          </ClipPath>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - 10}
          fill={colors.secondary.lightBlue}
          opacity={0.3}
        />

        <G clipPath="url(#clip)">
          {/* Base wave */}
          <AnimatedPath
            d={`M 0 ${waterHeight} 
                C ${size * 0.25} ${waterHeight - 10}, 
                  ${size * 0.75} ${waterHeight + 10}, 
                  ${size} ${waterHeight} 
                L ${size} ${size} 
                L 0 ${size} Z`}
            fill="#4A90E2"
            opacity={0.8}
          />
          {/* Overlay wave with offset */}
          <AnimatedPath
            d={`M 0 ${waterHeight + 5} 
                C ${size * 0.25} ${waterHeight - 5}, 
                  ${size * 0.75} ${waterHeight + 15}, 
                  ${size} ${waterHeight + 5} 
                L ${size} ${size} 
                L 0 ${size} Z`}
            fill="#5C9CE6"
            opacity={0.6}
          />

          {/* Bubbles */}
          <AnimatedCircle
            cx={radius - 20}
            cy={size}
            r={4}
            fill="white"
            opacity={0.8}
            transform={[{ translateY: bubbleY1 }]}
          />
          <AnimatedCircle
            cx={radius}
            cy={size}
            r={3}
            fill="white"
            opacity={0.6}
            transform={[{ translateY: bubbleY2 }]}
          />
          <AnimatedCircle
            cx={radius + 20}
            cy={size}
            r={5}
            fill="white"
            opacity={0.7}
            transform={[{ translateY: bubbleY3 }]}
          />
        </G>
      </Svg>

      {/* Progress text */}
      <View style={[styles.textContainer, { width: size, height: size }]}>
        <Animated.Text style={[styles.percentage, { color: isDarkMode ? theme.accent : '#2C3E50' }]}>
          {Math.round(percentage * 100)}%
        </Animated.Text>
        <Animated.Text style={[styles.amount, { color: isDarkMode ? theme.accent : '#34495E' }]}>
          {currentAmount}ml / {goalAmount}ml
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  amount: {
    fontSize: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
}); 
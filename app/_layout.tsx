import { Stack, Redirect, Slot, useRouter, useSegments } from "expo-router";
import { colors } from "./theme/colors";
import { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  // TESTING FLAG: Set to true to force onboarding, false to use actual status
  const FORCE_ONBOARDING = true;
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(!FORCE_ONBOARDING);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!FORCE_ONBOARDING) {
      checkOnboardingStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const inOnboarding = segments[0] === "onboarding";
      const inPersonalization = segments[0] === "(personalization)";
      const inApp = segments[0] === "(app)";
      
      // Only redirect to onboarding if we're not in onboarding, personalization, or app
      if (!hasCompletedOnboarding && !inOnboarding && !inPersonalization && !inApp) {
        router.replace("/onboarding");
      }
    }
  }, [hasCompletedOnboarding, segments, isLoading]);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('hasCompletedOnboarding');
      console.log('Onboarding status:', value);
      setHasCompletedOnboarding(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.secondary.white }} />;
  }

  return (
    <SafeAreaProvider>
      <PersonalizationProvider>
        <Slot />
      </PersonalizationProvider>
    </SafeAreaProvider>
  );
}

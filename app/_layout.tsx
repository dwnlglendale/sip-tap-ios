import { Stack, Redirect, Slot, useRouter, useSegments } from "expo-router";
import { colors } from "./theme/colors";
import { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  // Force hasCompletedOnboarding to false for testing
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Comment out the actual check for testing
    // checkOnboardingStatus();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const inOnboarding = segments[0] === "onboarding";
      const inPersonalization = segments[0] === "(personalization)";
      
      // Only redirect to onboarding if we're not in onboarding or personalization
      if (!hasCompletedOnboarding && !inOnboarding && !inPersonalization) {
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

  return <Slot />;
}

import { Stack, Redirect, Slot, useRouter, useSegments } from "expo-router";
import { colors } from "./theme/colors";
import { useEffect, useState, useRef } from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function NavigationHandler() {
  const { user, profile, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingReason, setLoadingReason] = useState('Initializing...');
  const [isMounted, setIsMounted] = useState(false);
  const hasNavigated = useRef(false);
  // Check actual onboarding status from AsyncStorage
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Set mounted state after initial render with a delay
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
    }, 500); // Wait 500ms for everything to be ready

    return () => clearTimeout(mountTimer);
  }, []);

  // Add a fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Navigation timeout - forcing loading to false');
      setLoadingReason('Timeout reached - forcing continue');
      setIsLoading(false);
    }, 20000); // 20 second timeout

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setLoadingReason('Checking onboarding status...');
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // Only navigate after component is mounted, onboarding check is complete, and auth is not loading
    if (isMounted && !isLoading && !authLoading && !hasNavigated.current) {
      setLoadingReason('Determining navigation...');
      const inAuth = segments[0] === "(auth)";
      const inOnboarding = segments[0] === "onboarding";
      const inPersonalization = segments[0] === "(personalization)";
      const inApp = segments[0] === "(app)";
      
      console.log('Navigation state:', {
        user: user?.email,
        profile: profile?.username,
        hasCompletedOnboarding,
        currentSegment: segments[0],
        inAuth,
        inOnboarding,
        inPersonalization,
        inApp,
        authLoading,
        isMounted
      });
      
      if (!user) {
        // User not authenticated - redirect to auth
        if (!inAuth) {
          console.log('Redirecting to login - no user');
          hasNavigated.current = true;
          router.replace("/(auth)/login");
        }
      } else {
        // User authenticated - check onboarding
        if (!hasCompletedOnboarding && !inOnboarding && !inPersonalization && !inApp) {
          console.log('Redirecting to onboarding - user exists but no onboarding');
          hasNavigated.current = true;
          router.replace("/onboarding");
        } else if (hasCompletedOnboarding && !inApp) {
          console.log('Redirecting to home - user authenticated and onboarded');
          hasNavigated.current = true;
          router.replace("/(app)/home");
        }
      }
    }
  }, [user, profile, hasCompletedOnboarding, segments, isLoading, authLoading, isMounted]);

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

  if (isLoading || authLoading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.secondary.white,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <Text style={{ 
          color: colors.neutral.darkGray, 
          fontSize: 18, 
          marginBottom: 10,
          textAlign: 'center'
        }}>
          Loading...
        </Text>
        <Text style={{ 
          color: colors.text.secondary, 
          fontSize: 14,
          textAlign: 'center'
        }}>
          {loadingReason}
        </Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PersonalizationProvider>
          <NavigationHandler />
        </PersonalizationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

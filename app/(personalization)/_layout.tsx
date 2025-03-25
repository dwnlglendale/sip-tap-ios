import { Stack } from "expo-router";
import { colors } from "../theme/colors";

export default function PersonalizationLayout() {
  return (
    <Stack
      screenOptions={{
        title: "Personalization",
        headerStyle: {
          backgroundColor: colors.accent.purple,
        },
        headerTintColor: colors.secondary.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.secondary.white,
        },
      }}
    />
  );
} 
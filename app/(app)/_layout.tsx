import { Stack } from "expo-router";
import { colors } from "../theme/colors";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.secondary.white,
        },
      }}
    />
  );
} 
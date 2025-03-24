import { Stack } from "expo-router";
import { colors } from "../theme/colors";

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        title: "SipTap",
        headerStyle: {
          backgroundColor: colors.primary.main,
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
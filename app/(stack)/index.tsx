import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to SipTap!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary.white,
  },
  text: {
    color: colors.neutral.darkGray,
    fontSize: 16,
  },
}); 
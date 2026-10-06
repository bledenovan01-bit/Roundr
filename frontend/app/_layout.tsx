import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { LogBox, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";

import { loadPreferences } from "@/src/store/preferences";
import { loadStore } from "@/src/store/session-store";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";

// Disable logbox so end users see the app in Expo Go, agents still work.
LogBox.ignoreAllLogs(true);

// Keep the splash while fonts load so the giant chrono type never flashes system.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "BarlowCondensed-Bold": require("../assets/fonts/BarlowCondensed-Bold.ttf"),
    "Manrope-Medium": require("../assets/fonts/Manrope-Medium.ttf"),
    "Manrope-Bold": require("../assets/fonts/Manrope-Bold.ttf"),
    "ManropeRefined-Medium": require("../assets/fonts/ManropeRefined-Medium.ttf"),
    "ManropeRefined-Bold": require("../assets/fonts/ManropeRefined-Bold.ttf"),
  });

  const [storeReady, setStoreReady] = useState(false);
  useEffect(() => {
    Promise.all([loadStore(), loadPreferences()]).finally(() => setStoreReady(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && storeReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, storeReady]);

  if ((!fontsLoaded && !fontError) || !storeReady) {
    // Return an empty black view while splash is still up.
    return <View style={{ flex: 1, backgroundColor: "#010a0b" }} />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#010a0b" }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#010a0b" },
                animation: "slide_from_right",
              }}
            />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

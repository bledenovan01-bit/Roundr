// App level error boundary, mounted once in app/_layout.tsx. A render crash
// shows a reload screen instead of a blank app; the error is also logged so
// it shows up in the Metro output. Do not mount additional boundaries.

import { reloadAppAsync } from "expo";
import { Component, type ErrorInfo, type PropsWithChildren, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles } from "@/src/theme";

type ErrorBoundaryState = { error: Error | null };

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary] render crash:", error, info.componentStack ?? "");
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return <SafeAreaProvider><ErrorFallback error={this.state.error} resetError={this.resetError} /></SafeAreaProvider>;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [showDetails, setShowDetails] = useState(false);

  const handleReload = async () => {
    try {
      await reloadAppAsync();
    } catch {
      // Reload is unavailable in some environments; retry the render instead.
      resetError();
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingLeft: insets.left + 24, paddingRight: insets.right + 24 }]} testID="error-fallback">
      <View style={styles.content}>
        <Text style={styles.title}>Une erreur est survenue</Text>
        <Text style={styles.message}>Recharge l’application pour continuer.</Text>
        {__DEV__ ? <Text style={styles.devMessage}>{error.message}</Text> : null}
        <Pressable
          onPress={handleReload}
          testID="error-fallback-reload"
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Recharger</Text>
        </Pressable>
        {__DEV__ ? (
          <Pressable testID="error-fallback-details" onPress={() => setShowDetails((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: showDetails }} aria-expanded={showDetails} style={styles.detailsButton}>
            <Text style={styles.detailsToggle}>{showDetails ? "Masquer les détails" : "Afficher les détails"}</Text>
          </Pressable>
        ) : null}
      </View>
      {__DEV__ && showDetails ? (
        <ScrollView nestedScrollEnabled style={styles.details} contentContainerStyle={styles.detailsContent}>
          <Text selectable style={styles.detailsText}>
            {error.stack ?? error.message}
          </Text>
        </ScrollView>
      ) : null}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  container: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    justifyContent: "center",
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
  },
  devMessage: {
    color: colors.error,
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.brandPrimary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 180,
    minHeight: 44,
    maxWidth: "100%",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.onBrandPrimary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  detailsToggle: {
    color: colors.muted,
    fontSize: 13,
    textDecorationLine: "underline",
    paddingVertical: 8,
  },
  detailsButton: { minHeight: 44, justifyContent: "center" },
  details: {
    marginTop: 16,
    maxHeight: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  detailsContent: {
    padding: 12,
  },
  detailsText: {
    color: colors.onSurfaceSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
}));



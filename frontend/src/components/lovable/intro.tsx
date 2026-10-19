import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lovable, lovableFont, withAlpha } from "@/src/visual/lovable";
import { LovableBackground } from "./background";
import { LovableButton } from "./button";
import { Wordmark } from "./wordmark";

export function LovableIntro({ onStart }: { onStart: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;
  const logoSize = height <= 640 ? 40 : Math.min(60, Math.max(44, width * 0.13));
  const titleSize = Math.min(36, Math.max(28, width * 0.085));
  return <View testID="welcome-screen" style={styles.screen}>
    <LovableBackground intro />
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.pitch}>
      <View style={styles.box} /><View style={styles.half} /><View style={[styles.circle, landscape && styles.landscapeCircle]} />
    </View>
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingLeft: 26 + insets.left, paddingRight: 26 + insets.right, paddingTop: insets.top }]}>
      <Wordmark size={logoSize} testID="intro-wordmark" />
      <Text testID="intro-title" accessibilityRole="header" style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.12, letterSpacing: -titleSize * 0.02 }]}>Plus de jeu.{"\n"}Moins d&apos;organisation.</Text>
      {!landscape && height > 640 ? <Text testID="intro-description" style={styles.description}>Chrono, rotations, tournois et classements : Roundr gère le match pour que vous profitiez du terrain.</Text> : null}
    </ScrollView>
    <View testID="intro-dock" style={[styles.dock, { paddingTop: landscape ? 8 : 12, paddingLeft: 20 + insets.left, paddingRight: 20 + insets.right, paddingBottom: Math.max(landscape ? 10 : 16, insets.bottom) }]}>
      <LovableButton label="Commencer" testID="welcome-start" onPress={onStart} landscape={landscape} />
    </View>
  </View>;
}

const line = { borderColor: withAlpha(lovable.primary, 0.16), borderWidth: 1 };
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lovable.background },
  pitch: { position: "absolute", left: "8%", right: "8%", top: "7%", height: "52%", borderRadius: 18, ...line },
  box: { position: "absolute", left: "33%", top: -1, width: "34%", height: "16%", ...line, borderTopWidth: 0 },
  half: { position: "absolute", left: -1, right: -1, top: "55%", borderTopWidth: 1, borderColor: line.borderColor },
  circle: { position: "absolute", left: "35%", top: "55%", width: "30%", aspectRatio: 1, transform: [{ translateY: "-50%" }], borderRadius: 999, ...line },
  // The reference's more-specific landscape selector wins over its later 30% rule.
  landscapeCircle: { left: "44%", width: "12%" },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "flex-end", gap: 10, paddingBottom: 22 },
  title: { fontFamily: lovableFont.extrabold, color: lovable.foreground, includeFontPadding: false },
  description: { fontFamily: lovableFont.regular, color: lovable.muted, fontSize: 14, lineHeight: 21.7, maxWidth: 307.44, marginTop: 2, includeFontPadding: false },
  dock: { alignItems: "center" },
});

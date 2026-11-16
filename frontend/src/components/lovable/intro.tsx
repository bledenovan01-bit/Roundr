import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand, lovableFont } from "@/src/visual/lovable";
import { LovableButton } from "./button";
import { PitchPhoto } from "./pitch-photo";
import { Wordmark } from "./wordmark";

// Welcome screen: the night pitch behind the logo, the promise and one action.
// Always dark, in both themes: the text sits on the photo.
export function LovableIntro({ onStart }: { onStart: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;
  const logoSize = landscape ? 40 : height <= 640 ? 44 : Math.min(64, Math.max(48, width * 0.15));
  const titleSize = landscape ? 22 : Math.min(30, Math.max(22, width * 0.068));
  return <View testID="welcome-screen" style={styles.screen}>
    {/* The photo fills the lower part; the veil keeps the upper text area dark. */}
    <PitchPhoto shade="top" position="bottom" style={landscape ? undefined : { top: "34%" }} />
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingLeft: 26 + insets.left, paddingRight: 26 + insets.right, paddingTop: insets.top + (landscape ? 16 : height * 0.2) }]}>
      <Wordmark size={logoSize} testID="intro-wordmark" onPhoto raiseBall />
      <Text testID="intro-title" accessibilityRole="header" style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.25 }]}>Plus de jeu.{"\n"}Moins d&apos;organisation.</Text>
    </ScrollView>
    <View testID="intro-dock" style={[styles.dock, { paddingTop: landscape ? 8 : 12, paddingLeft: 20 + insets.left, paddingRight: 20 + insets.right, paddingBottom: Math.max(landscape ? 10 : 16, insets.bottom) }]}>
      <LovableButton label="Commencer" testID="welcome-start" onPress={onStart} landscape={landscape} onPhoto />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.ink },
  scroll: { flex: 1 },
  content: { flexGrow: 1, gap: 14, paddingBottom: 22 },
  title: { fontFamily: lovableFont.semibold, color: brand.paper, includeFontPadding: false },
  dock: { alignItems: "center" },
});

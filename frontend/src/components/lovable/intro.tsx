import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand, lovableFont, withAlpha } from "@/src/visual/lovable";
import { LovableButton } from "./button";
import { Wordmark } from "./wordmark";

// Validated intro photo (1024 × 1536), extracted unchanged from the mockup PDF.
const INTRO_PHOTO = require("../../../assets/images/roundr-intro-hd.png");

// Welcome screen: the night pitch fills the screen, its dark sky holds the
// logo and the promise, the big ball stays in the foreground. Always dark, in
// both themes: the text is interface laid over the photo.
export function LovableIntro({ onStart }: { onStart: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;
  const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));
  // Proportions of the validated mockup (screen 230 pt wide: logo 42, slogan 18.6, text 11).
  const logoSize = landscape ? 40 : height <= 640 ? 44 : clamp(44, width * 0.17, 68);
  const titleSize = landscape ? 22 : clamp(24, width * 0.08, 32);
  const detailSize = landscape ? 15 : clamp(15, width * 0.045, 18);
  return <View testID="welcome-screen" style={styles.screen}>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Image testID="intro-photo" source={INTRO_PHOTO} contentFit="cover" contentPosition={landscape ? "bottom" : "center"} style={StyleSheet.absoluteFill} transition={0} />
      {/* Landscape only: the text sits beside the ball, so darken the left side. */}
      {landscape ? <LinearGradient colors={[withAlpha(brand.ink, 0.92), withAlpha(brand.ink, 0.6), withAlpha(brand.ink, 0)]} locations={[0, 0.45, 0.8]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} /> : null}
    </View>
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingLeft: 26 + insets.left, paddingRight: 26 + insets.right, paddingTop: insets.top + (landscape ? 16 : height * 0.17) }]}>
      <Wordmark size={logoSize} testID="intro-wordmark" onPhoto />
      <Text testID="intro-title" accessibilityRole="header" maxFontSizeMultiplier={1.3} style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.2 }]}>{"Plus de jeu.\nMoins d’organisation."}</Text>
      <Text testID="intro-details" maxFontSizeMultiplier={1.5} style={[styles.details, { fontSize: detailSize, lineHeight: detailSize * 1.36, maxWidth: landscape ? 360 : 340 }]}>Du coup d’envoi au dernier but, garde le fil du match.</Text>
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
  title: { fontFamily: lovableFont.extrabold, color: brand.paper, includeFontPadding: false },
  // #d3ddd5: secondary text of the mockup, still above 12:1 on the dark sky.
  details: { fontFamily: "ManropeRefined-Bold", color: "#d3ddd5" },
  dock: { alignItems: "center" },
});

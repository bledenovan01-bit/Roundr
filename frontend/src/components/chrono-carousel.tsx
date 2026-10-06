import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, ScrollView, Text, View } from "react-native";
import type { Notice } from "@/src/domain/live-notices";
import { fontFamily, makeStyles } from "@/src/theme";

export type NoticeContent = { cue: Notice; time: string; matchup: string; badge: string; preparation: string; locked: boolean; onPress: () => void };

export function ChronoCarousel({ children, notice }: { children: React.ReactNode; notice?: NoticeContent }) {
  const styles = useStyles();
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [offset] = useState(() => new Animated.Value(0));
  const manualReturn = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { sub.remove(); if (manualReturn.current) clearTimeout(manualReturn.current); };
  }, []);
  const cue = notice?.cue ?? "chrono";
  useEffect(() => {
    const index = cue === "next" ? 1 : cue === "warmup" ? 2 : 0;
    if (manualReturn.current) clearTimeout(manualReturn.current);
    scroll.current?.scrollTo({ x: width * index, animated: !reduceMotion });
    offset.setValue(reduceMotion || index === 0 ? 0 : 36);
    Animated.timing(offset, { toValue: 0, duration: reduceMotion ? 0 : 320, useNativeDriver: true }).start();
  }, [cue, width, reduceMotion, offset]);
  const go = (index: number) => {
    setPage(index);
    scroll.current?.scrollTo({ x: width * index, animated: !reduceMotion });
    if (manualReturn.current) clearTimeout(manualReturn.current);
    if (index !== 0) manualReturn.current = setTimeout(() => {
      scroll.current?.scrollTo({ x: 0, animated: !reduceMotion }); setPage(0);
    }, 8_000);
  };
  return <View testID="chrono-carousel" onLayout={e => setWidth(e.nativeEvent.layout.width)}>
    <ScrollView ref={scroll} horizontal pagingEnabled scrollEnabled={!!notice && !notice.locked} showsHorizontalScrollIndicator={false}
      scrollEventThrottle={32} onScroll={e => { if (width) setPage(Math.round(e.nativeEvent.contentOffset.x / width)); }}
      onScrollEndDrag={() => { if (manualReturn.current) clearTimeout(manualReturn.current); manualReturn.current = setTimeout(() => { scroll.current?.scrollTo({x:0, animated:!reduceMotion}); setPage(0); }, 8_000); }}>
      <View accessibilityElementsHidden={page !== 0} importantForAccessibility={page !== 0 ? "no-hide-descendants" : "auto"} style={{ width: width || undefined, minHeight: 170 }} testID="chrono-page">{children}</View>
      {notice ? (["next", "warmup"] as const).map((kind, i) => <Animated.View key={kind} accessibilityElementsHidden={page !== i+1} importantForAccessibility={page !== i+1 ? "no-hide-descendants" : "auto"} style={{ width, justifyContent: "center", transform: [{ translateY: offset }] }}>
        <Text style={styles.compactTime} accessibilityLabel={`Chronomètre ${notice.time}`}>{notice.time}</Text>
        <Pressable testID={`notice-${kind}`} accessibilityRole="button" accessibilityLabel={kind === "next" ? "Voir les prochains matchs" : "Équipes à l’échauffement"}
          disabled={notice.locked || page !== i + 1} onPress={notice.onPress} style={styles.card}>
          <Text style={styles.eyebrow}>{kind === "next" ? "PROCHAIN MATCH" : "À L’ÉCHAUFFEMENT"}</Text>
          <Text style={styles.title}>{kind === "next" ? notice.matchup : notice.preparation}</Text>
          <Text style={styles.badge}>{notice.badge}</Text>
        </Pressable>
      </Animated.View>) : null}
    </ScrollView>
    {notice ? <View style={styles.dots}>{["Chronomètre", "Prochain match", "Échauffement"].map((label, i) => <Pressable key={label} testID={`chrono-tab-${i}`} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: page === i, disabled: notice.locked }} disabled={notice.locked} onPress={() => go(i)} style={styles.dotButton}><View style={[styles.dot, page === i && styles.active]} /></Pressable>)}</View> : null}
  </View>;
}
const useStyles = makeStyles(c => ({
  compactTime: { fontFamily: fontFamily.textBold, fontSize: 32, lineHeight: 44, color: c.onSurface, textAlign: "center", fontVariant: ["tabular-nums"], marginBottom: 8 },
  card: { minHeight: 140, padding: 18, gap: 12, borderRadius: 20, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, justifyContent: "center" },
  eyebrow: { fontFamily: fontFamily.textBold, color: c.muted, fontSize: 10, letterSpacing: 1.2 },
  title: { fontFamily: fontFamily.textBold, color: c.onSurface, fontSize: 18, lineHeight: 25 },
  badge: { fontFamily: fontFamily.text, color: c.brandPrimary, fontSize: 12 },
  dots: { flexDirection: "row", justifyContent: "center" },
  dotButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.border },
  active: { width: 18, backgroundColor: c.brandPrimary },
}));

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import type { ScrollViewInstance } from "react-native";
import type { Notice } from "@/src/domain/live-notices";
import { ChronoRing } from "./chrono-ring";
import { fontFamily, makeStyles } from "@/src/theme";

export type NoticeContent = { cue: Notice; time: string; matchup: string; badge: string; preparation: string; locked: boolean; onPress: () => void; standingsLabel: string };

export function ChronoCarousel({ children, notice, locked=false, time, caption, status, progress }: { children: React.ReactNode; notice?: NoticeContent; locked?:boolean; time:string; caption:string; status:string; progress:number }) {
  const styles = useStyles();
  const scroll = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [offset] = useState(() => new Animated.Value(0));
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const manualReturn = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centered = useRef(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { sub.remove(); if (manualReturn.current) clearTimeout(manualReturn.current); };
  }, []);
  // Vue par défaut = chrono numérique (page 0), fixée une seule fois à la
  // première mesure de largeur. N'interfère jamais avec la navigation manuelle
  // ni avec les notifications (qui passent par la bannière, pas le carrousel).
  useEffect(() => {
    if (!width || centered.current) return;
    centered.current = true;
    scroll.current?.scrollTo({ x: 0, animated: false });
    setPage(0);
  }, [width]);
  const labels=["Chronomètre", "Chronomètre circulaire", ...(notice?["Prochain match"]:[])];
  // Réf. Lovable + correctif Phase 2 : le carrousel ne défile JAMAIS
  // automatiquement sur une notification, et la vue "Échauffement" a été
  // RETIRÉE (l'échauffement passe uniquement par la bannière temporaire verte).
  // Seule la vue "Prochain match" reste accessible manuellement.
  const go = (index: number) => {
    setPage(index);
    scroll.current?.scrollTo({ x: width * index, animated: !reduceMotion });
    if (manualReturn.current) clearTimeout(manualReturn.current);
    if (index >= 2) manualReturn.current = setTimeout(() => {
      scroll.current?.scrollTo({ x: 0, animated: !reduceMotion }); setPage(0);
    }, 8_000);
  };
  return <View testID="chrono-carousel" onLayout={e => setWidth(e.nativeEvent.layout.width)}>
    <ScrollView ref={scroll} horizontal pagingEnabled scrollEnabled={!locked} showsHorizontalScrollIndicator={false}
      scrollEventThrottle={32} onScroll={e => { if (width) setPage(Math.round(e.nativeEvent.contentOffset.x / width)); }}
      onScrollEndDrag={e => { if (manualReturn.current) clearTimeout(manualReturn.current); if (width && Math.round(e.nativeEvent.contentOffset.x/width)>=2) manualReturn.current = setTimeout(() => { scroll.current?.scrollTo({x:0, animated:!reduceMotion}); setPage(0); }, 8_000); }}>
      <View accessibilityElementsHidden={page !== 0} importantForAccessibility={page !== 0 ? "no-hide-descendants" : "auto"} style={{ width: width || undefined, minHeight: 170 }} testID="chrono-page">{children}</View>
      <View style={{width, minHeight:170, justifyContent:"center"}} accessibilityElementsHidden={page!==1} importantForAccessibility={page!==1?"no-hide-descendants":"auto"} testID="chrono-ring-page"><ChronoRing time={time} caption={caption} status={status} progress={progress} size={Math.min(230,Math.max(140,Math.min(screenWidth-56,screenHeight>screenWidth?230:screenHeight-190)))}/></View>
      {notice ? (["next"] as const).map((kind, i) => <Animated.View key={kind} accessibilityElementsHidden={page !== i+2} importantForAccessibility={page !== i+2 ? "no-hide-descendants" : "auto"} style={{ width, justifyContent: "center", transform: [{ translateY: offset }] }}>
        <Text style={styles.compactTime} accessibilityLabel={`Chronomètre ${notice.time}`}>{notice.time}</Text>
        <Pressable testID={`notice-${kind}`} accessibilityRole="button" accessibilityLabel="Voir les prochains matchs"
          disabled={notice.locked || page !== i + 2} onPress={notice.onPress} style={styles.card}>
          <Text style={styles.eyebrow}>PROCHAIN MATCH</Text>
          <Text style={styles.title}>{notice.matchup}</Text>
          <Text style={styles.badge}>{notice.badge}</Text>
          <Text style={styles.badge}>{notice.standingsLabel}</Text>
        </Pressable>
      </Animated.View>) : null}
    </ScrollView>
    <View style={styles.dots}>{labels.map((label, i) => <Pressable key={label} testID={`chrono-tab-${i}`} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: page === i, disabled: locked }} disabled={locked} onPress={() => go(i)} style={styles.dotButton}><View style={[styles.dot, page === i && styles.active]} /></Pressable>)}</View>
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

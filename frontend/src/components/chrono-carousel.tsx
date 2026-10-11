import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import type { Notice } from "@/src/domain/live-notices";
import { ChronoRing } from "./chrono-ring";
import { fontFamily, makeStyles } from "@/src/theme";
import { getPreferences, setPreferences, usePreferences } from "@/src/store/preferences";

export type NoticeContent = { cue: Notice; time: string; matchup: string; following?: string; badge: string; preparation: string; locked: boolean; onPress: () => void; standingsLabel: string };

export function ChronoCarousel({ children, notice, locked=false, time, caption, status, progress }: { children: React.ReactNode; notice?: NoticeContent; locked?:boolean; time:string; caption:string; status:string; progress:number }) {
  const styles = useStyles();
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const preference = usePreferences().chronoStyle;
  const [page, setPage] = useState(() => getPreferences().chronoStyle === "ring" ? 1 : 0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [offset] = useState(() => new Animated.Value(0));
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const manualReturn = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnToChrono = () => {
    const index = getPreferences().chronoStyle === "ring" ? 1 : 0;
    scroll.current?.scrollTo({ x: width * index, animated: !reduceMotion });
    setPage(index);
  };
  const remember = (index: number) => {
    if (index < 2) {
      const chronoStyle = index === 1 ? "ring" : "classic";
      if (getPreferences().chronoStyle !== chronoStyle) void setPreferences({ chronoStyle });
    }
  };
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { sub.remove(); if (manualReturn.current) clearTimeout(manualReturn.current); };
  }, []);
  const cue = notice?.cue ?? "chrono";
  const hasNotice = !!notice;
  const labels=["Chronomètre", "Chronomètre circulaire", ...(notice?["Prochain match","Échauffement"]:[])];
  useEffect(() => {
    const index = hasNotice && cue === "next" ? 2 : hasNotice && cue === "warmup" ? 3 : getPreferences().chronoStyle === "ring" ? 1 : 0;
    if (manualReturn.current) clearTimeout(manualReturn.current);
    scroll.current?.scrollTo({ x: width * index, animated: !reduceMotion });
    offset.setValue(reduceMotion || index === 0 ? 0 : 36);
    Animated.timing(offset, { toValue: 0, duration: reduceMotion ? 0 : 320, useNativeDriver: true }).start();
  }, [cue, width, reduceMotion, offset, hasNotice]);
  useEffect(() => {
    if (cue !== "chrono") return;
    scroll.current?.scrollTo({ x: width * (preference === "ring" ? 1 : 0), animated: !reduceMotion });
  }, [preference, width, cue, reduceMotion]);
  const go = (index: number) => {
    remember(index);
    setPage(index);
    scroll.current?.scrollTo({ x: width * index, animated: !reduceMotion });
    if (manualReturn.current) clearTimeout(manualReturn.current);
    if (index >= 2) manualReturn.current = setTimeout(returnToChrono, 8_000);
  };
  return <View testID="chrono-carousel" onLayout={e => setWidth(e.nativeEvent.layout.width)}>
    <ScrollView ref={scroll} horizontal pagingEnabled scrollEnabled={!locked} showsHorizontalScrollIndicator={false}
      scrollEventThrottle={32} onScroll={e => { if (width) setPage(Math.round(e.nativeEvent.contentOffset.x / width)); }}
      onMomentumScrollEnd={e => {
        if (!width) return;
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setPage(index);
        if (manualReturn.current) clearTimeout(manualReturn.current);
        // Automatic announcements must not change the saved chrono view.
        if (index < 2) remember(index);
        else manualReturn.current = setTimeout(returnToChrono, 8_000);
      }}>
      <View accessibilityElementsHidden={page !== 0} importantForAccessibility={page !== 0 ? "no-hide-descendants" : "auto"} style={{ width: width || undefined, minHeight: 170 }} testID="chrono-page">{children}</View>
      <View style={{width, minHeight:170, justifyContent:"center"}} accessibilityElementsHidden={page!==1} importantForAccessibility={page!==1?"no-hide-descendants":"auto"} testID="chrono-ring-page"><ChronoRing time={time} caption={caption} status={status} progress={progress} size={Math.min(190,Math.max(140,Math.min(screenWidth-56,screenHeight>screenWidth?190:screenHeight-190)))}/></View>
      {notice ? (["next", "warmup"] as const).map((kind, i) => <Animated.View key={kind} accessibilityElementsHidden={page !== i+2} importantForAccessibility={page !== i+2 ? "no-hide-descendants" : "auto"} style={{ width, justifyContent: "center", transform: [{ translateY: offset }] }}>
        <Text style={styles.compactTime} accessibilityLabel={`Chronomètre ${notice.time}`}>{notice.time}</Text>
        <Pressable testID={`notice-${kind}`} accessibilityRole="button" accessibilityLabel={kind === "next" ? "Voir les prochains matchs" : "Équipes à l’échauffement"}
          disabled={notice.locked || page !== i + 2} onPress={notice.onPress} style={styles.card}>
          <Text style={styles.eyebrow}>{kind === "next" ? "PROCHAIN MATCH" : "À L’ÉCHAUFFEMENT"}</Text>
          <Text style={styles.title}>{kind === "next" ? notice.matchup : notice.preparation}</Text>
          <Text style={styles.badge}>{notice.badge}</Text>
          {kind === "next" && notice.following ? <Text style={styles.following}>Puis : {notice.following}</Text> : null}
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
  following: {fontFamily:fontFamily.text,color:c.muted,fontSize:12,lineHeight:18},
  dots: { flexDirection: "row", justifyContent: "center" },
  dotButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.border },
  active: { width: 18, backgroundColor: c.brandPrimary },
}));

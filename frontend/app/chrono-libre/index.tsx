import { FreeStorageNotice } from "@/src/components/free-storage-notice";
import { prepareFreeTimer } from "@/src/features/prepare-free-timer";
// Chrono libre — Hub "Type de chrono" (Phase 3, réf. Lovable).
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { DesignScreen } from "@/src/components/design-screen";
import { defaultConfig } from "@/src/domain/free-timer";
import { useStore } from "@/src/store/session-store";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";

export default function ChronoLibreHub() {
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const freePresets = useStore(s => s.freePresets);
  const active = useStore(s => s.freeTimer);

  const startStopwatch = () => {
    prepareFreeTimer(defaultConfig("stopwatch"), () => router.push("/chrono-libre/run"));
  };



  return (
    <DesignScreen testID="chrono-libre-hub" title="Chrono libre" subtitle="Type de chrono" onBack={() => router.replace("/")}>
      <FreeStorageNotice />
      <Text style={styles.intro}>Choisissez votre chrono. Les équipes sont facultatives.</Text>
      {active ? (
        <Pressable testID="free-resume" accessibilityRole="button" onPress={() => router.push("/chrono-libre/run")} style={[styles.row, { borderColor: colors.brandPrimary }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.brandTertiary }]}><MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.brandPrimary} /></View>
          <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.rowTitle}>Reprendre le chrono en cours</Text><Text style={styles.rowDetail}>{active.config.kind === "stopwatch" ? "Chronomètre" : active.config.kind === "countdown" ? "Compte à rebours" : "Intervalles"}</Text></View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurface} />
        </Pressable>
      ) : null}
      <ToolRow testID="tool-stopwatch" icon="timer-outline" title="Chronomètre" detail="Départ à 00:00, tours, sans durée limite." onPress={startStopwatch} />
      <ToolRow testID="tool-countdown" icon="timer-sand" title="Compte à rebours" detail="Durée personnalisée, fin automatique à zéro." onPress={() => router.push("/chrono-libre/countdown")} />
      <ToolRow testID="tool-interval" icon="sync" title="Intervalles" detail="Périodes, repos et répétitions enchaînés." onPress={() => router.push("/chrono-libre/interval")} />
      <ToolRow testID="tool-presets" icon="bookmark-check-outline" title="Mes chronos" detail={freePresets.length ? `${freePresets.length} chrono${freePresets.length > 1 ? "s" : ""} enregistré${freePresets.length > 1 ? "s" : ""}` : "Aucun chrono enregistré pour l'instant"} onPress={() => router.push("/chrono-libre/presets")} tint />
    </DesignScreen>
  );
}

const ToolRow = ({ icon, title, detail, onPress, tint, testID }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; title: string; detail: string; onPress: () => void; tint?: boolean; testID: string }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, tint && { backgroundColor: colors.brandTertiary }]}>
        <MaterialCommunityIcons name={icon} size={22} color={tint ? colors.brandPrimary : colors.onSurface} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
    </Pressable>
  );
};

const useStyles = makeStyles(c => ({
  intro: { fontFamily: fontFamily.text, fontSize: 13, lineHeight: 19, color: c.muted },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  pressed: { opacity: 0.85 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  rowTitle: { fontFamily: fontFamily.textBold, fontSize: 15, color: c.onSurface },
  rowDetail: { fontFamily: fontFamily.text, fontSize: 12, lineHeight: 17, color: c.muted, marginTop: 2 },
}));

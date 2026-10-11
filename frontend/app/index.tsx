import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModeCard } from "@/src/components/mode-card";
import { GAME_MODES } from "@/src/data/modes";
import { useStore } from "@/src/store/session-store";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const session = useStore(s => s.session);
  const saveError = useStore(s => s.saveError);
  const [showWelcome,setShowWelcome]=useState<boolean|null>(null);
  useEffect(()=>{AsyncStorage.getItem("roundr.welcome.v1").then(value=>setShowWelcome(value!=="seen"),()=>setShowWelcome(false));},[]);
  const enter=()=>{setShowWelcome(false);AsyncStorage.setItem("roundr.welcome.v1","seen").catch(()=>{});};
  if(showWelcome===null && session?.status!=="active") return <View style={styles.root}/>;
  if(showWelcome && session?.status!=="active") return <ImageBackground testID="welcome-screen" source={require("../assets/images/pitch-night.png")} resizeMode="cover" style={[styles.welcome,safeSides]}>
    <LinearGradient colors={["rgba(1,10,11,0.25)","rgba(1,10,11,0.82)",colors.surface]} locations={[0,0.55,1]} style={[styles.welcomeContent,{paddingTop:insets.top+24,paddingBottom:insets.bottom+28}]}>
      <Text style={styles.welcomeBrand}>Roundr<Text style={{color:colors.brandPrimary}}>.</Text></Text>
      <View style={styles.welcomeBottom}><Text style={styles.welcomeTitle}>Plus de jeu.{"\n"}Moins d’organisation.</Text><Text style={styles.welcomeDetail}>Un match, un tournoi, des équipes. Tout est prêt pour jouer.</Text><Pressable testID="welcome-start" onPress={enter} accessibilityRole="button" accessibilityLabel="Commencer" style={styles.welcomeButton}><Text style={styles.welcomeButtonText}>Commencer</Text><MaterialCommunityIcons name="arrow-right" size={24} color={colors.onBrandPrimary}/></Pressable></View>
    </LinearGradient>
  </ImageBackground>;
  return <View testID="home-screen" style={[styles.root, safeSides, {paddingTop:insets.top}]}>
    <ScrollView showsVerticalScrollIndicator={false} testID="home-scroll" contentContainerStyle={[layoutStyles.content, styles.content, { paddingTop: 20, paddingBottom: insets.bottom + 20 }]}>
      <ImageBackground source={require("../assets/images/pitch-night.png")} resizeMode="cover" imageStyle={styles.heroImage} style={styles.hero}>
        <View testID="home-header" style={styles.header}><Text testID="home-wordmark" style={styles.logo}>Roundr<Text style={{ color: colors.brandPrimary }}>.</Text></Text></View>
        <Text testID="home-slogan" style={styles.slogan}>Plus de jeu. Moins d’organisation.</Text>
        <Text style={styles.heroTitle}>Choisis ton mode</Text>
      </ImageBackground>
      {saveError ? <Text style={{ color: colors.error }}>{saveError}</Text> : null}
      <View testID="modes-section" style={styles.modes}>{GAME_MODES.map((mode, index) => <ModeCard key={mode.id} index={index} testID={`mode-card-${mode.id}`} title={mode.title} description={mode.description} iconName={mode.icon} accent={colors[mode.accent]} dominant={index===0} onPress={() => router.push(`/config/${mode.id}` as never)} />)}</View>
      {session?.status === "active" ? <Pressable testID="resume-session-card" accessibilityRole="button" accessibilityLabel="Reprendre la session" onPress={() => router.push("/live")} style={styles.resume}><MaterialCommunityIcons name="play-circle-outline" size={36} color={colors.brandPrimary}/><View style={{flex:1}}><Text style={styles.resumeTitle}>Reprendre la session en cours</Text><Text style={styles.resumeDetail}>{GAME_MODES.find(m => m.id === session.mode)?.title}</Text></View><MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurface}/></Pressable> : null}
      <Pressable testID="mode-card-team-builder" accessibilityRole="button" onPress={() => router.push("/team-builder")} style={styles.teamBuilder}><MaterialCommunityIcons name="account-group" size={20} color={colors.brandPrimary}/><Text style={styles.teamBuilderText}>Faire les équipes</Text><MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted}/></Pressable>
      <Pressable testID="home-settings-link" onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel="Paramètres" style={styles.teamBuilder}><MaterialCommunityIcons name="cog-outline" size={20} color={colors.brandPrimary}/><Text testID="home-settings-link-label" style={styles.teamBuilderText}>Paramètres</Text><MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted}/></Pressable>
    </ScrollView>
  </View>;
}
const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface },
  welcome: {flex:1,backgroundColor:c.surface},
  welcomeContent: {flex:1,paddingHorizontal:24,justifyContent:"space-between"},
  welcomeBrand: {fontFamily:fontFamily.textBold,fontSize:34,color:c.onSurface},
  welcomeBottom: {gap:16},
  welcomeTitle: {fontFamily:fontFamily.textBold,fontSize:38,lineHeight:45,color:c.onSurface},
  welcomeDetail: {fontFamily:fontFamily.text,fontSize:15,lineHeight:22,color:c.onSurfaceTertiary,marginBottom:14},
  welcomeButton: {backgroundColor:c.brandPrimary,minHeight:56,borderRadius:16,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:12},
  welcomeButtonText: {fontFamily:fontFamily.textBold,fontSize:16,color:c.onBrandPrimary},
  content: { flexGrow: 1, paddingHorizontal: 18, gap: 12 },
  hero: { paddingTop: 4, paddingBottom: 6, minHeight: 118, justifyContent: "flex-end" },
  heroImage: { opacity: 0.28, borderRadius: 16 },
  header: { alignItems: "flex-start" },
  logo: { fontFamily: fontFamily.textBold, fontSize: 38, lineHeight: 45, letterSpacing: -1.4, color: c.onSurface },
  slogan: { fontFamily: fontFamily.text, fontSize: 12, color: c.muted },
  heroTitle: { fontFamily: fontFamily.textBold, fontSize: 25, marginTop: 18, color: c.onSurface },
  modes: { gap: 10 },
  resume: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.surfaceSecondary },
  resumeTitle: { fontFamily: fontFamily.textBold, fontSize: 13, color: c.onSurface },
  resumeDetail: { fontFamily: fontFamily.text, fontSize: 11, color: c.muted, marginTop: 2 },
  teamBuilder: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderRadius: 14, borderColor: c.border, borderWidth: 1 },
  teamBuilderText: { flex: 1, fontFamily: fontFamily.textBold, fontSize: 13, color: c.onSurface },
}));

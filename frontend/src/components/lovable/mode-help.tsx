import { StyleSheet, Text, View } from "react-native";
import { MatchAction, MatchSheet } from "./match-ui";
import { lovable, lovableFont, themed } from "@/src/visual/lovable";

export type ModeId = "classique" | "maracana" | "cup" | "survie" | "custom";

// Three plain answers per mode: who plays, how it runs, when it stops.
const HELP: Record<ModeId, { title: string; lines: [string, string][] }> = {
  classique: { title: "Match classique", lines: [
    ["Pour qui", "Deux équipes."],
    ["Comment", "Un match au chrono, en une période ou deux mi-temps, avec le score."],
    ["Fin", "Au bout du temps, ou dès qu'une équipe atteint le nombre de buts choisi."],
  ] },
  maracana: { title: "Maracana", lines: [
    ["Pour qui", "De 3 à 8 équipes, sur un seul terrain."],
    ["Comment", "Deux équipes jouent, les autres attendent. Après chaque match, Roundr fait tourner : rotation classique ou le gagnant reste."],
    ["Fin", "Quand tu arrêtes la session. Le classement compte tous les matchs joués."],
  ] },
  cup: { title: "Cup", lines: [
    ["Pour qui", "De 4 à 32 équipes."],
    ["Comment", "Des poules d'abord, puis les meilleures équipes passent en matchs à élimination."],
    ["Fin", "Après la finale. Le palmarès est rangé dans Tournois joués."],
  ] },
  survie: { title: "Survie", lines: [
    ["Pour qui", "De 2 à 32 équipes."],
    ["Comment", "Matchs à élimination directe : l'équipe qui perd est éliminée."],
    ["Fin", "Après la finale. Le palmarès est rangé dans Tournois joués."],
  ] },
  custom: { title: "Chrono libre", lines: [
    ["Pour qui", "Avec ou sans équipes : entraînement, foot à 5, fractionné."],
    ["Comment", "Chronomètre, compte à rebours ou intervalles (jeu, repos, séries)."],
    ["Fin", "À zéro pour un compte à rebours, sinon quand tu l'arrêtes."],
  ] },
};

export function ModeHelpSheet({ mode, onClose }: { mode: ModeId; onClose: () => void }) {
  const help = HELP[mode];
  return <MatchSheet dismissOnBackdrop label={`Comment fonctionne ${help.title}`} onClose={onClose}>
    <Text accessibilityRole="header" style={styles.title}>{help.title}</Text>
    <View style={styles.lines}>
      {help.lines.map(([label, text]) => <View key={label} style={styles.line}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>)}
    </View>
    <MatchAction label="Compris" kind="secondary" onPress={onClose} />
  </MatchSheet>;
}

const styles = themed(() => StyleSheet.create({
  title: { fontFamily: lovableFont.extrabold, fontSize: 20, lineHeight: 28, color: lovable.foreground, textAlign: "center" },
  lines: { gap: 12 },
  line: { gap: 2 },
  label: { fontFamily: lovableFont.extrabold, fontSize: 13, lineHeight: 18, color: lovable.primary },
  text: { fontFamily: lovableFont.regular, fontSize: 15, lineHeight: 22, color: lovable.foreground },
}));

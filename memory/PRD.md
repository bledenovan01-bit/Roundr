# Roundr V0 — PRD

## Vision
Application mobile 100% hors ligne pour organiser des sessions de football amateur. Un seul organisateur, un seul téléphone, un seul terrain. Promesse : "Plus de jeu. Moins d'organisation."

## Cible
- Organisateur seul, en train de jouer, main mouillée/sale
- Utilisation sur le terrain, en plein soleil, tel posé au sol/banc
- Config < 30 secondes, lisibilité à distance (2-5m)

## Stack
- React Native + Expo SDK 57 (Expo Go compatible)
- Expo Router (file-based, stack navigation)
- AsyncStorage pour la persistance locale
- Reanimated + Gesture Handler pour animations
- MaterialCommunityIcons (@react-native-vector-icons)
- Polices : Barlow Condensed Bold (chrono/titres) + Manrope Medium/Bold (texte)
- Pas de backend, pas de cloud, pas de comptes

## Design system
Défini par mobile_design_agent (personnalité "7 Dark-First Utility") dans `/app/design_guidelines.json`.
- Fond noir pur, accent orange haute visibilité (#FF5000)
- Touch targets 56pt+ (60pt+ CTAs), score buttons 100pt+
- Pas de glassmorphism (illisible en plein soleil)
- Chrono géant Barlow Condensed 140pt, tabular-nums
- Haptics agressifs (impactHeavy sur score, impactMedium sur timer)

## Séquence prompts (roadmap)
- **Prompt 00** ✅ Audit existant, registre écarts (bootstrap Expo trouvé, remplacé)
- **Prompt 01** ✅ Accueil (E01) + composants visuels partagés
- Prompt 02 ⏳ Moteur chrono commun
- Prompt 03 ⏳ Sauvegarde/restauration locale (AsyncStorage)
- Prompt 04 ⏳ Match Classique bout en bout
- Prompt 05 ⏳ Sons + validation mobile
- Prompt 06 ⏳ Conditions de fin + correction scores
- Prompt 07 ⏳ Custom + Mes chronos
- Prompt 08 ⏳ Résultats/classements partagés
- Prompt 09 ⏳ Maracana
- Prompt 10 ⏳ Élimination/TAB/Survie
- Prompt 11-12 ⏳ Cup poules + finales
- Prompt 13 ⏳ Transitions
- Prompt 14 ⏳ Résumés + carte de partage
- Prompt 15 ⏳ Recette

## Écrans livrés (V0 sprint 01)
- E01 Accueil : logo Roundr, tagline, section "Reprendre la session" (conditionnelle), 5 cartes modes (Classique, Maracana, Cup, Survie, Custom), section "Mes chronos" (empty state)
- Écran config placeholder par mode (`/config/[mode]`)
- Écran live placeholder (`/live`)

## Composants partagés
- `ModeCard` : carte mode avec icône, titre, description
- `ResumeCard` : carte "reprendre la session" en brand orange
- `PresetPill` : pill horizontale pour presets Custom
- `PrimaryButton` : bouton CTA 60pt (variants primary/secondary/ghost)

## Hors périmètre V0 (rappel)
Comptes utilisateurs, cloud, sync multi-organisateurs, stats par joueur, multi-terrains, notifications push, arbitrage assisté, IA.

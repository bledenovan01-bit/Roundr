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
- **Prompt 02** ✅ Moteur chrono commun (pure state machine + hook React + démo /live)
- **Prompt 03** ✅ Sauvegarde/restauration locale (`src/store/session-store.ts`, AsyncStorage, advance() unique au retour, sauvegarde illisible conservée à part)
- **Prompt 04** ✅ Match Classique bout en bout (config → live → résumé, C02–C04, C21)
- **Prompt 05** ✅ Sons WAV synthétisés (`assets/sounds`, expo-audio mixWithOthers, C19 dédup, pas de rafale) — NON TESTÉ sur téléphone
- **Prompt 06** ✅ Cases de fin indépendantes, buts seul (C06), correction C16 (`correctLast`)
- **Prompt 07** ✅ Custom (split C05) + Mes chronos (`/presets`, C23)
- **Prompt 08** ✅ Classements 3/1/0 (`src/domain/standings.ts`, C13, ex æquo)
- **Prompt 09** ✅ Maracana (`src/domain/maracana.ts`, MA-01..05, C07–C10, extension 2 min, ajout d'équipe)
- **Prompt 10** ✅ Élimination/TAB/Survie (`src/domain/bracket.ts`, exemptions, petite finale, C11, C15)
- **Prompt 11-12** ✅ Cup poules + qualification + finales (`src/domain/cup.ts`, C12–C15, choix explicite ex æquo)
- **Prompt 13** ✅ Préparation par paliers (`src/domain/preparation.ts`, C18) + transitions E07
- **Prompt 14** ✅ Résumés (`src/domain/summary.ts`) + carte PNG (react-native-view-shot + expo-sharing)
- **Prompt 15** ⏳ Recette : tests moteur `scripts/test-domain.ts` (tous verts) ; tests téléphone (audio, arrière-plan, mode avion) NON TESTÉS — protocole à exécuter par l'utilisateur

## Identité visuelle (maquettes fournies)
Fond quasi noir #0B0F0D, cartes #161B19, accent vert néon #3DF27C, accents par mode (vert/bleu/violet/orange/gris), anneau de progression autour du chrono.

### Alignement maquettes (passe visuelle)
- Accueil : wordmark « Roundr. » seul (point vert), tagline, titres de section en gros bold blanc (« Choisis ton mode », « Mes chronos »), carte « Reprendre la session en cours » sombre avec cercle play vert + badge « En cours », carte « Mes chronos » pleine (plus de bordure pointillée), pied de page tagline capitales espacées + wordmark.
- Live : anneau vert néon (halo translucide + repère de tête), label « TEMPS RESTANT » capitales espacées, scores Barlow Condensed 68, boutons +1 bordés de la couleur d'équipe, carte « Prochain match » avec maillots + VS, pied de page marque.
- L'anneau reste vert (brandPrimary) quel que soit le mode ; la couleur de mode sert à l'icône d'en-tête et aux tuiles de l'accueil.

## Architecture
- `src/chrono/engine.ts` : machine à états temps (Date.now())
- `src/domain/*` : types, session (moteur de session pur, `advance(session, now)` idempotent), maracana, bracket, cup, standings, summary, validate, preparation
- `src/store/session-store.ts` : store externe + persistance + déclenchement des sons par diff d'état
- Écrans : `/` accueil, `/config/[mode]`, `/live` (E03–E07 + TAB + choix ex æquo), `/standings` (E08), `/summary` (E09/E11), `/presets` (E10)

## Limites connues / conventions à confirmer
- Croisements de phase finale : défaut C15 (extrêmes), pas d'édition manuelle en V0
- Tirage manuel = ordre des équipes dans la config (pas de placement case par case)
- Audio écran verrouillé / arrière-plan : non garanti, à tester sur build
- Renommage preset : Alert.prompt iOS ; Android passe par l'écran d'édition

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


## Refonte visuelle + nouveautés (sprint visuel)
- Refonte visuelle sans changement fonctionnel : Accueil, configs, Live (ring plus épais/piste discrète, score agrandi, glow "Fin du match"), switches custom, tuiles sélectionnables, séparateurs/titres de sections
- Fond photo terrain nocturne sombre et subtil sur l'accueil (`assets/images/pitch-night.png`)
- Extension du style : Classement, Résumé, Mes chronos, configs Cup/Survie
- NOUVEAUTÉ Chrono géant : affichage plein écran du chrono depuis l'écran live (`src/components/giant-chrono.tsx`) — Modal, temps lisible à plusieurs mètres, pause/reprise + fermeture sans régression
- NOUVEAUTÉ Couleurs de maillot : sélection d'une couleur par équipe en config avant le coup d'envoi, reflétée en live (jersey + bouton +1)
- Validation : tests unitaires domaine + chrono OK ; non-régression front testing_agent 13/13 OK
- À valider sur device réel (non testable en preview web) : lisibilité extérieure, audio WAV natif, partage PNG natif, Alert.alert destructifs

## Passe typographique ciblée — en attente d'avis visuel
- Demande : uniquement tailles, hiérarchie, graisses et interlignage, à partir des captures jointes. Périmètre : Accueil, Live commun, configuration Match classique, configuration Maracana. Ne pas étendre aux autres écrans sans validation utilisateur.
- Références consultées : `application_sportive_roundr_sur_terrain_nocturne.png`, `interface_de_match_de_football_sur_smartphone.png`, `présentation_cinématique_de_l_app_roundr.png` (assets du projet).
- Cause du texte trop fin : les deux fichiers Manrope nommés Medium/Bold sont des polices variables dont la graisse par défaut est 200 (ExtraLight). Deux instances statiques locales 500/700 ont été générées depuis la fonte embarquée avec des noms internes distincts. Aucun téléchargement de police, aucune intégration.
- Architecture de présentation : `src/typography-preview.ts` fournit les alias `ManropeRefined-Medium/Bold` et un contexte opt-in. Chargement dans `app/_layout.tsx`. Contexte actif uniquement pour Live et les configs classique/Maracana ; composants exclusifs à l'accueil utilisent les nouveaux alias directement. Tokens globaux, fontes d'origine, configuration Cup/Survie/Custom, Résumé, Classement, Mes chronos et composant Chrono Géant conservés.
- Échelle : chrono live 104pt au lieu de 73,7pt à largeur390 (environ +41%), adaptable aux petits écrans et formats longs ; scores environ70pt, adaptés aux nombres de plusieurs chiffres ; titres32pt ; modes23pt ; sections18pt ; libellés17pt ; CTA principal20pt ; sous-titres/aides12–13pt. Manrope conserve sa famille, Barlow Condensed Bold reste utilisé pour le chrono et les scores.
- Mise en page : aucun changement de cartes, anneau, navigation, icônes, paddings ou marges. Seuls les textes longs peuvent revenir à la ligne (cartes d'accueil/reprise et équipes) ; CTA Live compact16pt à320. Aucun changement de logique, moteur, règles, stockage, réseau ou données utilisateur.
- Vérification : rapport `/app/test_reports/iteration_4.json` — tests domaine/chrono et TypeScript OK, flux pause/reprise, buts/correction, retour/reprise, chrono géant et configurations OK, confinement typographique confirmé sur Cup. Troncatures mineures signalées corrigées ensuite et revérifiées en captures à320 : textes complets, noms jusqu'à18 caractères, score10, CTA complet, aucun débordement horizontal. Captures finales des quatre écrans à390 produites.
- Incident ponctuel d'aperçu pendant QA : contrôle de diagnostic effectué, service/public URL sains, aucune modification d'infrastructure nécessaire. Doublons de testID observés uniquement sur les écrans empilés pendant la navigation Expo, pas dans un même écran ; assertions ciblées sur l'écran actif.

### Suite (ne pas implémenter sans demande)
- P0 : recueillir l'avis utilisateur sur ces quatre écrans.
- P1 : appliquer la hiérarchie validée aux autres écrans seulement après accord.
- P2 : vérifier le rendu natif et la lisibilité sur le terrain ; audio/partage natifs restent dans la recette téléphone existante.

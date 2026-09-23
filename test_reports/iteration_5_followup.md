# Suivi de l'audit responsive — contrôles manuels après iteration_5

## Périmètre
Présentation responsive uniquement, aucune modification des règles, moteurs,
stockage, effets de navigation, fontes, couleurs ou orientation native.
Matrice initiale de l'agent : 320×568, 360×800, 390×844, 430×932,
568×320, 844×390. Tous les écrans V0 et plusieurs états live couverts.

## Trois observations corrigées et revérifiées
1. **Live paysage 568×320** : anneau et chiffres inchangés (268 / 104pt).
   Navigation et équipes dans une colonne à côté du chrono, plutôt qu'un en-tête
   au-dessus. Avec noms longs et score12–10 : arène x16/y8/268×268 ; équipes
   x300 et434/y81,5/118×182 ; tous ces éléments dans le premier écran.
2. **Champ de preset et pied CTA en hauteur réduite** : séparation de8pt entre
   la zone défilante et le pied. Contrôle à320×400 : écart mesuré8,375pt,
   champ modifiable, contenu jamais masqué par le CTA.
3. **Accueil320 avec reprise** : métadonnées sur toute la largeur de la carte,
   chevron regroupé avec le titre sur les cartes de modes. Sous-titre de reprise
   largeur254pt ; description Match classique largeur178pt, tient sur une ligne.
   Aucun changement de taille, graisse ou contraste ; captures après animation.

## Accessibilité vérifiée après le contrôle initial
- La version embarquée de React Native Web ignore `accessibilityState` alors
  que les alias `aria-*` sont reconnus sur le web et déclarés par React Native.
- Ajout des alias checked/disabled/busy/expanded/hidden en complément des
  informations natives existantes ; choix exclusifs annoncés comme radios.
- Vérifié : interrupteur de sauvegarde false→true→false, un seul changement
  par appui ; champ visible/invisible selon l'état ; objectif1 coché et3 décoché.
- Tailles tactiles44pt minimum pour les contrôles concernés, swatches compris.

## Résumé réellement rempli
- Session Custom créée par l'UI, objectif1 but, noms longs, but marqué et session
  archivée par la logique existante (pas de fixture pour ce contrôle).
- Résumé consulté via sa route profonde existante après le défaut de navigation
  décrit ci-dessous. À320×568,390×844,568×320 : headline/statistiques contenus
  dans la bordure ; boutons après la carte ; aucun débordement horizontal.

## Défaut préexistant hors périmètre — NON MODIFIÉ
- La fin automatique d'une session simple peut retourner à l'accueil au lieu du
  résumé. Reproduit avec Custom, objectif1, but+1.
- Diagnostic read-only : effet de navigation identique au baseline535bec5.
  `archiveSession()` vide la session, relance l'effet dépendant de session et
  le second `router.replace('/')` écrase celui vers `/summary`.
- Les changements responsive n'ont pas touché cet effet, le store ou le moteur.
- Ne pas présenter le parcours automatique de fin comme validé. Le résumé
  archivé existe et son rendu responsive est vérifié indépendamment.
- Correction à autoriser séparément, l'utilisateur ayant exclu les changements
  fonctionnels et de navigation du présent audit.

## Limites de preuve
- Clavier réel, VoiceOver/TalkBack, encoches/safe areas physiques, audio/partage
  natifs et confirmations Alert.alert demandent un appareil réel.
- Choix d'égalité Cup : disposition revue dans le code et règles couvertes par
  les tests de domaine ; progression complète de ce parcours non exercée par QA.
- Orientation native portrait conservée ; paysage vérifié en aperçu et pour le
  composant Chrono Géant, déjà compatible paysage.

## Contrôles de code
TypeScript, lint, tests de domaine et moteur chrono passent après les correctifs.
Le rapport initial iteration_5 est conservé tel quel pour tracer les observations.
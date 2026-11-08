# Améliorations UX — écran allumé, glissement du carrousel, roulettes de durée

Base : `cd2f0fb` (`codex/roundr-v0-final-fixes`). Branche : `codex/roundr-ux-ameliorations`.
Aucune modification des moteurs de chronométrage, des règles, des sons, des sauvegardes ni des identifiants.
Aucune nouvelle dépendance. Tout reste compatible avec Expo Go SDK 58.

## 1. Bouton « Écran » dans les commandes du chrono

- **Emplacement.** Premier bouton de la barre inférieure, pendant un match (Classique, Maracana, Cup, Survie) et pendant le Chrono libre, avant Fin / Relancer (ou Réinitialiser, Tour, Passer) / Pause.
- **Synchronisation.** Le bouton lit et écrit la préférence `keepAwake`, la même que l'interrupteur des Paramètres. Les deux affichent toujours le même état, et le choix est enregistré comme avant. Le mécanisme de maintien de l'écran (`useRuntimeKeepAwake`) n'est pas modifié.
- **États.**
  - Activé : soleil vert, bordure verte.
  - Désactivé : lune, style secondaire Lovable.
  - Désactivé (grisé) quand les commandes sont verrouillées.
- **Accessibilité.** Interrupteur (`switch`) « Maintenir l'écran allumé » avec son état coché.
- **Largeur.** Fixe et compacte (56 pt en portrait) pour préserver la largeur des commandes existantes.

## 2. Glissement horizontal entre les vues du carrousel

- **Cause.** L'ancien glissement (`PanResponder`) était capté sur iOS par le défilement vertical de la page. Il est remplacé par le gestionnaire de gestes natif (`react-native-gesture-handler`, déjà présent et inclus dans Expo Go).
- **Comportement.**
  - Le contenu suit le doigt, puis se cale sur la vue suivante ou précédente avec l'animation existante de 350 ms, ou revient en place.
  - Il change de vue à partir d'un cinquième de la largeur, ou d'un geste rapide.
  - Il avance d'une seule vue à la fois, avec une résistance aux extrémités.
  - Un mouvement vertical laisse défiler la page.
- **Écrans concernés.** Carrousel du match (numérique, circulaire, suivant ou tournoi, musique) et cadran du Chrono libre (numérique, analogique, circulaire).
- **Préservé.**
  - Le tap sur le chrono (temps restant ou écoulé), l'appui long (chrono géant), les points et les onglets.
  - Un tap qui termine un glissement est ignoré, pour ne pas basculer l'affichage par erreur.
  - Verrouillage des commandes et « réduire les animations ».

## 3. Roulettes de durée personnalisée

- **Emplacement.** Carte « Durée » du compte à rebours (Chrono libre). Les trois compteurs +/− (heures, minutes, secondes) sont remplacés par trois roulettes façon Minuteur iPhone : h, min et s.
- **Raccourcis.** Les puces 1, 5, 10, 15 et 30 min sont conservées et déplacent les roulettes.
- **Limites et données.** Mêmes limites qu'avant : 0–23 h, 0–59 min, 0–59 s. Mêmes champs du brouillon (`cd.h`, `cd.m`, `cd.s`). Les configurations enregistrées sont inchangées.
- **Comportement.**
  - Défilement aimanté sur la ligne centrale.
  - Toucher une valeur la sélectionne.
  - Retour haptique léger à chaque cran, s'il est autorisé dans les réglages.
  - Avec VoiceOver, chaque roulette est un élément réglable : balayer vers le haut ou le bas.
- **Hors périmètre.** Les durées des matchs restent en minutes entières et les intervalles gardent leurs compteurs. Le cahier des charges détaillé annoncé n'a pas été reçu ; extension possible sur demande.

## Tests automatisés

- `scripts/test-ux-improvements.ts`, ajouté au runner `npm test`, couvre :
  - les règles du glissement ;
  - la garde contre le tap après glissement ;
  - le câblage du bouton sur la même préférence que les Paramètres ;
  - le maintien de l'écran inchangé ;
  - les calculs des roulettes et les mêmes limites et champs.
- **Exécuté localement :** `npm test` (toutes les suites), `tsc --noEmit`, `eslint app src --max-warnings 0`, `test:syntax`, `expo-doctor` (20/20), `expo export --platform all`.
- **Contrôle visuel web (375 × 812).** Roulettes (puce, toucher, défilement), bouton Écran synchronisé, glissement dans le match et le Chrono libre, aucun basculement parasite.

## Recette native sur iPhone

Résultats communiqués par le propriétaire le 8 novembre 2026. Commit testé : `8e9c595`, iPhone physique, Expo Go SDK 58, serveur Expo en mode production via tunnel.

**Résultat : 5/5 validés, aucune anomalie identifiée sur ces fonctionnalités.**

| Contrôle | Résultat |
| --- | --- |
| Bouton « Écran » | OK |
| Glissement du carrousel Match | OK |
| Glissement du carrousel Chrono libre | OK |
| Roulettes de durée | OK |
| Barre inférieure | OK |

Ces résultats valident fonctionnellement les trois améliorations dans Expo Go. Ils ne couvrent pas une application autonome compilée et signée : le comportement de ces fonctions reste à confirmer sur un vrai build iOS.

## Liste de contrôle iPhone d'origine

1. **Glissement :** passer d'une vue à l'autre sur le match et le Chrono libre, sans déclencher le tap ni le chrono géant. Défilement vertical de la page toujours possible en commençant sur le carrousel.
2. **Glissement et iOS :** le geste « retour » depuis le bord gauche reste utilisable ; il est désactivé quand les commandes sont verrouillées, comme avant.
3. **Bouton Écran :** activer pendant un chrono, attendre plus longtemps que le délai de verrouillage d'iOS, vérifier que l'écran reste allumé. Désactiver et vérifier la mise en veille. Contrôler l'état dans Paramètres.
4. **Roulettes :** défilement fluide et aimanté, retour haptique, VoiceOver (balayer vers le haut ou le bas), clavier absent, paysage.
5. **Petits écrans (iPhone SE) :** lisibilité de « Réinitialiser » dans la barre à quatre boutons. Le texte se réduit automatiquement s'il manque de place.

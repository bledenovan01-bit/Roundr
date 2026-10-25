# Roundr — chronomètres mobiles et identité sonore

Base exacte vérifiée localement et sur GitHub : branche
`codex/roundr-lovable-phase-5a`, commit
`4650ae5a70739ad633a5bc47d5957d0f186b14c3`.
Branche corrective : `codex/roundr-mobile-chrono-audio`.
PR en brouillon à destination de cette branche de référence ; aucune fusion.

## Affichage

Les quatre modes de match partagent `MatchDigits`. Le Chrono libre utilise
`FreeDigits`. Les deux rendus plaçaient les chiffres et le suffixe dans une
rangée sans contrainte de largeur, avec une hauteur de ligne égale à la taille
de police. Le cadran du Chrono libre utilisait 36 px même dans un anneau de
122 px : une longue valeur débordait du cadran (voir 320 × 568, Circulaire).
La mise à l'échelle native du texte ne résout pas ce cas dans React Native Web.

Le composant de présentation partagé mesure la largeur disponible, réserve la
place du suffixe et réduit la taille uniquement si nécessaire. La hauteur de
ligne de 1,35 laisse une marge aux glyphes Manrope ; le cadran réserve 82 % de
son diamètre aux chiffres. Les ratios existants des centièmes restent 42 %
dans les matchs/cadrans et 50 % dans le numérique libre. Les chiffres restent
sur une seule ligne avec leur texte accessible complet. La police, les couleurs,
les cartes, maillots, scores et boutons restent ceux de la version validée.
Le chrono géant reçoit également une hauteur de ligne suffisante et une largeur
bornée par son groupe. Le format reste `MM:SS.cc` ; les heures déjà prises en
charge dans le Chrono libre sont conservées.

Comparaison visuelle effectuée avec les captures Lovable archivées de
`docs/phase3a-visuel/classic-ready-ring-lovable-portrait.jpg` et
`docs/phase4b-visuel/raw/sw-hours-P-lovable.jpg`, référence
`roundr-mockup/v0-lovable-final`, `1c59720`. Les états ne sont pas identiques :
ces archives servent à comparer identité visuelle, proportions et hiérarchie,
pas à prétendre à une égalité pixel par pixel. Les paires avant/après de la
[galerie](index.html) utilisent, elles, les mêmes états déterministes et formats.

## Audio

Les cinq originaux précis ont été retrouvés dans Téléchargements. Leurs pages
Freesound affichent CC0 ; les liens, auteurs, empreintes et découpes exactes sont
dans [SOURCES.md](../../frontend/assets/sounds/SOURCES.md) et
`official-manifest.json`. Les extraits courts ont été choisis explicitement
pendant cette intervention. Sifflet : 0,8 s ; but : 4 s ; alerte : 0,552 s ;
transition : 0,265 s ; fin du libre : 0,610 s.

Les cinq clés de préférences restent stables. Le contexte au point d'appel
distingue les ressources partagées : `gong` devient Hint pour une fin de période
ou une transition libre, et reste Digital Interface pour les alertes temporelles ;
`final` reste Metal Whistle en match et devient le double Hint en fin du libre.
Les autres sons sélectionnés par l'utilisateur restent des choix alternatifs.
Le double Hint est un seul WAV : deux copies PCM exactes séparées par 80 ms,
un seul appel applicatif. Aucun événement, condition, priorité ou garde-fou
d'activation n'a été ajouté ou supprimé. Volume, préférences, musique et
coexistence audio sont conservés.

**E1 est embarqué et vérifié, mais sans déclenchement.** Aucun événement sonore
de confirmation n'existe dans cette base. L'activer demanderait de définir un
nouvel événement, interdit par le périmètre de cette intervention.

## Vérifications exécutées

| Contrôle final | Résultat |
|---|---|
| TypeScript, `tsc --noEmit` | Réussi |
| ESLint app/src et nouveau test, `--max-warnings 0` | Réussi, 0 avertissement |
| Analyse syntaxique existante | Réussie |
| Ensemble des 22 suites existantes + nouveau contrôle audio | Réussi |
| Export Expo web, Android et iOS | Réussi, SDK 57 conservé |
| Sept WAV : HTTP, décodage Web Audio, play et fin de lecture | 7/7 réussis dans Edge local |
| Intégrité SHA-256, PCM16 stéréo 44,1 kHz, D2 exact | Réussie |
| Cinq modes, 320×568, 360×640, 390×844, 568×320, 844×390 | 25 cas par version |
| Numérique, circulaire, analogique libre, géant de match | 75 captures par version, 150 au total |
| Rotation portrait → paysage → portrait, cinq modes | Temps, scores et octets persistés inchangés |

Les captures sont réalisées dans une copie isolée, avec les véritables composants
Expo, des données de test déterministes, les animations réduites et l'horloge
figée. Les routes de test ne sont pas dans `frontend/app` de production.
Les cinq modes ne produisent aucune erreur JavaScript pendant ces parcours.
La mesure finale ne détecte aucun dépassement horizontal des enfants de la
rangée de chiffres. Les images ont été inspectées sur les cas portrait étroits,
circulaires, longs et géant paysage.

Les premiers contrôles du nouveau test audio ont échoué : quatre avertissements
ESLint sur `require`, et TypeScript sur `__dirname`/`Buffer`. Le test a été adapté
à la convention des suites existantes, puis les contrôles complets ont été
relancés avec succès. Les journaux initiaux restent dans `checks-initial`, les
résultats finaux dans `checks/results.json`. Des essais de capture ont rencontré
un navigateur Playwright absent puis un accès serveur local indisponible ; la
série finale a été refaite avec Edge installé et un serveur isolé commun.

## Limites et recette physique à réaliser avant fusion

L'export Android/iOS valide le bundling, pas l'exécution sur appareil.
Aucun build EAS, aucune modification Emergent, aucune migration SDK 58.
Les moteurs de chrono, durées, règles, migrations et schémas de sauvegarde ne
sont pas modifiés ; seul le choix de ressource audio au point de lecture change.

- Sur un petit téléphone Android et un iPhone : ouvrir les cinq modes, les vues
  numériques/circulaires, l'analogique libre et le géant ; vérifier les chiffres
  avec centièmes, les noms longs, les scores et les boutons après rotation.
- Vérifier la pause/reprise, une fin de période, un but, un départ, les alertes
  prévues, une transition libre et la fin du libre (double Hint une seule fois).
- Vérifier sons OFF, interrupteur de séance, volume, choix alternatifs par
  événement, mode silencieux, interruption et musique externe. Vérifier
  l'absence de nouveaux sons sur les confirmations et la préparation `next`.
- Recharger une séance existante : temps/scores/préférences conservés ; tester
  également les tailles de texte système et les zones sûres réelles.

Commits séparés : `bdacbc3` (visuel), `874e6ef` (audio), puis preuves de validation.

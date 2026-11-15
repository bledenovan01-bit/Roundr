# Maquette fusionnée Lovable / Krono — thème clair, logo, accueil

> Suite de la PR #32 : voir le [rapport des retouches et de la recette](retouches/rapport.md)
> pour la correction du thème sans remontage, les cartes de score, le logo vérifié
> sur le PDF et les captures finales. Le présent document conserve le bilan initial.

Branche `claude/roundr-maquette-fusion`, basée sur `main` (`bcdeb90`). Les
retouches de `docs/v0-polish-final/rapport.md` sont conservées (chrono qui occupe
la hauteur libre, retours visuels, tutoiement). Aucune règle métier, aucun
calcul de chrono, aucune sauvegarde ni aucun son n'est modifié.

Références : `Roundr-fusion-Lovable-Krono.png` (composition), planche Krono
(terrain de nuit). Le PDF `Roundr-logo-et-typographie.pdf` n'a pas pu être
affiché sur le poste (aucun convertisseur PDF) : le logo et l'icône ont été
repris de la planche de fusion, qui les montre tous les deux.

## 1. Ce qui change

### Thème clair

- Paramètres → Apparence → Sombre / Clair. Sombre par défaut. Le choix est
  enregistré avec les autres préférences et appliqué dès le démarrage.
- Les couleurs sont lues par rôle dans une palette unique
  (`src/visual/lovable.ts`), changée d'un bloc. Le sombre est la palette Lovable
  inchangée ; le clair reprend le fond blanc cassé, les surfaces claires, le
  texte foncé et un vert plus profond pour les commandes.
- Les deux thèmes couvrent tous les écrans, y compris l'historique, les
  classements, les réglages, les fenêtres, les bannières et la barre d'état.
- Au changement d'apparence, chaque écran est reconstruit ; la navigation, la
  session et les chronos vivent en dehors et ne sont pas touchés.

### Logo et ressources

- Logo « Roundr » avec le petit ballon vert à la place du point, sur l'accueil,
  l'introduction et le splash. Le ballon garde son vert dans les deux thèmes.
- Icône de l'app (« r » et ballon), icône adaptative Android, splash et favicon
  régénérés par `frontend/scripts/generate-brand-assets.cjs`, à partir de la
  police Manrope ExtraBold du projet. Couleurs `#020909`, `#EDF3F0`, `#6CE182`.
- Photo du terrain de nuit : `assets/images/pitch-night.jpg`, recadrée dans la
  planche Krono. Le logo, les textes et les boutons restent des composants.

### Accueil et introduction

- Introduction : terrain et ballon en fond, logo, « Plus de jeu. Moins
  d'organisation. », bouton « Commencer ». Toujours sombre, dans les deux thèmes.
- Accueil : bandeau photo avec le logo et « Lance tes matchs, gère les scores et
  les rotations. », roue dentée vers les paramètres, « Choisis ton mode », cinq
  modes avec tuile colorée, « Reprendre » sous les modes quand une session
  existe, puis « Faire les équipes » et « Historique ».

### Match

- Portrait : le chrono passe au-dessus du score. Paysage : chrono à gauche,
  scores à droite, commandes en bas. Même logique en Chrono libre.
- Un bouton −1 visible à côté de chaque +1 : une erreur de but se corrige en un
  appui. L'appui long sur +1 et l'appui sur le score fonctionnent toujours.
- Carrousel, indicateurs, bannières, sons et carte Musique : inchangés.

### Fin de session

- Match classique : grand score sur le terrain de nuit, équipes, résultat, puis
  « Partager le résumé », « Rejouer » et « Retour à l'accueil ».
- Le partage ouvre la feuille de partage du téléphone avec un texte construit à
  partir du résumé déjà calculé par l'app (`buildSummary`). Un match joué sans
  score n'est pas annoncé comme un match nul.
- Cup et Survie : le palmarès reçoit la même action « Partager le résumé ».

### Rotation Maracana

Déjà conforme : résultat, équipes qui restent, sortent et entrent (issues du
moteur de rotation), prochaine affiche, classement. En lancement manuel,
« Lancer le prochain match » ouvre l'écran prêt à jouer et « Démarrer » lance
le chrono (`launchNext` sans démarrage immédiat) ; les lancements automatique et
différé sont inchangés.

## 2. Écarts volontaires par rapport à la maquette

| Point | Maquette | Livré | Raison |
| --- | --- | --- | --- |
| Description de Survie | « Le vainqueur reste sur le terrain. » | « Tu gagnes, tu restes. Sinon, dehors. » | Survie est une élimination directe ; la phrase de la maquette décrit plutôt le Maracana |
| Carte « Reprendre » | Titre « Reprendre la session » et une ligne | Titre, état, équipes, temps et action | Contenu existant conservé ; les tests de reprise s'appuient dessus |
| Scores en match | Deux cartes séparées avec −1 / +1 | Le tableau de score existant, avec −1 ajouté | Réutilisation du composant validé ; même accès en un appui |
| Rotation Maracana | Écran plein | Fenêtre existante | Même contenu ; comportement de lancement déjà validé |
| Vue par défaut du match | Circulaire | Numérique (inchangé) | Les conditions d'affichage du carrousel devaient être conservées |
| Fin de session | Un seul écran | Match classique refait ; palmarès Cup/Survie et fin de Maracana gardent leur écran, avec le partage ajouté au palmarès | Leurs contenus sont propres à chaque mode |

## 3. Vérifications

| Contrôle | Résultat |
| --- | --- |
| `npm run typecheck` | Aucune erreur |
| `npm test` (32 suites, dont `test-theme.ts`) | Tout passe |
| ESLint (`app`, `src`) | Aucune erreur |
| `expo-doctor` | 20/20 |
| Export des bundles web, Android et iOS | Réussi |
| Tests navigateur de la CI, rejoués en local (5 suites) | Passent, avec une réserve ci-dessous |

**Réserve sur deux suites navigateur.** Les scénarios qui cliquent les durées du
compte à rebours (« 1 min », « 15 min »…) lisent l’état du bouton juste après le
clic. Sur ce poste, cette lecture arrive parfois avant la mise à jour de
l’écran et le scénario échoue, de façon intermittente. Le même défaut se
reproduit à l’identique sur `main` : ce n’est pas une régression de cette
branche. Avec un délai de 0,4 s après le clic, les deux suites passent en
entier (21 et 16 scénarios). La CI de la PR, plus rapide, fera foi.

`test-theme.ts` vérifie : deux palettes complètes, contraste des textes et des
commandes dans chaque thème, thème sombre par défaut, choix enregistré et
restauré, valeur inconnue ignorée, et qu'un match en cours (score, phase,
chrono) est strictement identique après plusieurs changements de thème.

Recette visuelle dans un navigateur (Chrome, 390 × 844, 320 × 568, 844 × 390),
dans les deux thèmes : introduction, accueil avec et sans session,
configuration du Match classique, match, rotation Maracana, Chrono libre, fin
de session, Cup, Survie, paramètres. Aucune erreur console.

## 4. Captures (`captures/`)

| Écran | Sombre | Clair |
| --- | --- | --- |
| Accueil | `accueil-sombre.jpg` | `accueil-clair.jpg` |
| Accueil avec session | `accueil-session-sombre.jpg` | `accueil-session-clair.jpg` |
| Configuration | `configuration-sombre.jpg` | `configuration-clair.jpg` |
| Match | `match-sombre.jpg` | `match-clair.jpg` |
| Match en paysage | `match-paysage-sombre.jpg` | `match-paysage-clair.jpg` |
| Rotation Maracana | `rotation-sombre.jpg` | `rotation-clair.jpg` |
| Fin de session | `fin-de-session-sombre.jpg` | `fin-de-session-clair.jpg` |
| Chrono libre | `chrono-libre-sombre.jpg` | `chrono-libre-clair.jpg` |
| Paramètres | `parametres-sombre.jpg` | `parametres-clair.jpg` |

Aussi : `introduction.jpg`, `introduction-paysage.jpg`,
`match-petit-ecran-sombre.jpg`, `cup-sombre.jpg`, `survie-clair.jpg`.

## 5. Limites

- **Photo du terrain** : la seule source est la planche Krono, où la zone utile
  fait environ 250 pixels de large. Agrandie quatre fois, elle est floue de
  près. Un voile sombre la couvre partout, ce qui atténue le défaut, mais il
  faudrait la photo d'origine en haute définition avant publication.
- **Logo** : repris de la planche de fusion et non du PDF. Les proportions du
  ballon sont à comparer au PDF.
- **Aucun test sur téléphone.** Tout a été vérifié dans un navigateur.
- **Changement de thème** : l'écran est reconstruit, donc ses états passagers
  (verrouillage des commandes, vue du carrousel de match, fenêtre ouverte) sont
  remis à zéro. La session, le score et le chrono sont conservés.
- **Partage** : la feuille de partage native n'a pas pu être essayée ; dans un
  navigateur sans partage, le texte est copié.
- **Splash** : il reste sombre dans les deux thèmes (il s'affiche avant la
  lecture des préférences).

## 6. À essayer sur téléphone

1. Netteté de la photo sur l'introduction, l'accueil et la fin de session.
2. Icône de l'app, icône adaptative Android et splash (nouveau build requis).
3. Passage sombre ↔ clair depuis les Paramètres pendant un match : le chrono et
   le score continuent ; puis fermer et rouvrir l'app.
4. Barre d'état lisible dans les deux thèmes.
5. Lisibilité en plein soleil du thème clair : chrono, score, boutons.
6. Boutons −1 et +1 : taille au doigt, surtout sur petit écran.
7. Paysage : chrono à gauche, scores à droite.
8. « Partager le résumé » : feuille de partage et texte reçu.
9. Couleurs d'équipe claires (jaune, vert clair) sur fond clair.
10. Fenêtres de rotation, de classement et de correction en thème clair.

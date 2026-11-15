# Retouches PR #32 — recette et corrections

Base distante vérifiée le 14 novembre 2026 par le connecteur GitHub et `git fetch` :
`4f9afa41d7d92fc9ade5f18350280a37e80ddb8e`, branche
`claude/roundr-maquette-fusion`. PR ouverte, non fusionnée.

## Modifications locales

- Suppression du Fragment indexé par le thème. Les écrans souscrivent aux changements
  de palette sans remplacer leur identité React, y compris les routes conservées
  dans la pile de navigation.
- Deux cartes de score, commandes −1/+1 d'au moins 44 × 44, noms sur deux lignes.
  Paysage : chrono à gauche, cartes à droite. La vue numérique reste initiale.
- Cercle agrandi dans la hauteur disponible en portrait, statut intégré au cadran.
- Rotation Maracana : résultat dans sa carte, rôles des équipes puis prochain duel.
  Action manuelle toujours reliée à `launchNext`, suivie de la lecture explicite.
- Fin de Maracana reliée au résumé archivé et au partage calculé par `buildSummary`.
  La recette a révélé une redirection concurrente vers l'accueil lors de
  l'archivage : le composant de route conserve maintenant son écran pendant
  la navigation vers le résumé, au lieu de monter le mode historique de secours.
- Ballon extrait des tracés vectoriels de la première page du PDF validé : mêmes
  panneaux pour le composant et les assets. Rayon/texte : 0,132 pour le mot complet,
  0,16 pour l'icône ; Manrope ExtraBold, espacement naturel. Assets régénérés.
- Tests de durées : attente de `aria-pressed=true`, sans sommeil arbitraire.

## Photo

Ressources examinées : planches Krono et fusion, deux autres compositions Roundr
des téléchargements, archives de maquettes et ancien fond du dépôt. Aucun original
plus net du terrain avec ballon trouvé. Photo conservée sans réencodage :
`pitch-night.jpg`, 1016 × 700, issue d'un recadrage utile de **254 × 175 pixels**
dans la planche Krono 1536 × 1024. L'agrandissement n'ajoute pas de détail.

## Vérifications réalisées et restantes

Tests métier/persistance : les 32 suites passent après adaptation de l'assertion
qui exigeait auparavant le Fragment défectueux. Syntaxe : 135 fichiers, zéro erreur.
Typecheck et ESLint (`app`, `src`) repassés après les derniers changements : zéro
erreur, commandes terminées avec le code 0. Syntaxe des scripts navigateur et de
génération des assets également vérifiée.

Nouvelle suite `reproduction/browser.cjs` ajoutée à la CI. Les cinq parcours ont
passé dans Chrome, sans erreur JavaScript :

1. Nouvel utilisateur, match simple, ajout puis retrait d'un but en un appui.
   Retour des paramètres avec vue circulaire et affichage du temps écoulé.
   Le même nœud d'écran reste monté ; chrono 18 → 25 s pendant les paramètres,
   score, phase et horodatage de départ identiques. Passage sombre → clair →
   sombre → clair, pause conservée à 25 s, verrouillage des commandes vérifié.
2. Maracana manuel sombre : résultat, équipes restée/sortie/entrée et prochain
   duel vérifiés contre le moteur. Prochain match prêt, encore arrêté après
   11 s ; seule la lecture lance le chrono. Deux matchs archivés et partagés.
3. Même parcours Maracana en clair.
4. Lancement automatique : le match suivant démarre automatiquement.
5. Lancement différé : le match suivant démarre à 30 s, pas à 29 s.

Les résumés sont comparés au texte réellement copié dans le presse-papiers,
après normalisation CRLF/LF de Windows. `navigator.share` est désactivé dans ce
test uniquement pour exercer le repli navigateur ; aucune validation de feuille
native n'est revendiquée.

Les suites V0 finale (21 scénarios) et recette 2 (16) passent. Les boutons de durée
sont testés avec un appui de 50 ms et une attente explicite de l'état sélectionné
sur le bouton courant, sans délai fixe après le clic. L'ancien test utilisait un
clic instantané puis lisait immédiatement l'état. Les attentes du carrousel
lisent `aria-current` et les mesures paysage attendent la disposition effective.

Expo Doctor : **20/20**. Exports JavaScript web, Android et iOS : réussis.
Le contrôle de rendu des cinq modes passe ses **78 cas**, sans erreur JavaScript
ni attribut SVG invalide (avertissement web connu sur le pilote natif d'Animated).
Les autres suites passent également : 41 scénarios fonctionnels (alertes,
carrousel dont Musique, commandes et reprise), 36 vérifications audio et
10 parcours de focus/édition/rotation. Total navigateur : **207 scénarios**,
dont les cinq nouveaux parcours. Vérification finale terminée le 15 novembre 2026.

## Captures finales

Captures dans `captures/`, prises à 390 × 844, 320 × 568 et 844 × 390 :

| Écran | Sombre | Clair |
| --- | --- | --- |
| Accueil | [capture](captures/accueil-sombre.png) | [capture](captures/accueil-clair.png) |
| Chrono circulaire | [capture](captures/match-circulaire-sombre.png) | [capture](captures/match-circulaire-clair.png) |
| Petit écran | [capture](captures/match-petit-ecran-sombre.png) | [capture](captures/match-petit-ecran-clair.png) |
| Paysage | [capture](captures/match-paysage-sombre.png) | [capture](captures/match-paysage-clair.png) |
| Rotation | [capture](captures/rotation-sombre.png) | [capture](captures/rotation-clair.png) |
| Résumé Maracana | [capture](captures/fin-maracana-sombre.png) | [capture](captures/fin-maracana-clair.png) |

Aussi : [introduction](captures/introduction.png),
[configuration](captures/configuration-sombre.png),
[paramètres](captures/parametres-clair.png),
[résultat classique](captures/fin-classique-clair.png).
Les captures d'échecs intermédiaires ont été retirées du dossier livré.

Premier commit local de conservation : `5617b46`. Les corrections de recette et
les captures finales sont publiées à sa suite sur la même branche de la PR #32.
Le résultat de la CI du dernier commit est consultable sur la PR ; il est distinct
des contrôles locaux ci-dessus. Aucun merge ni build natif.

## Téléphone

Restent à vérifier sur appareil : masque et netteté de l'icône, splash au démarrage
réel, zones tactiles et gestes, lisibilité du cercle et des couleurs d'équipe,
rotation paysage, continuité via Paramètres et feuille de partage native. Les
captures navigateur ne valident pas ces comportements natifs.

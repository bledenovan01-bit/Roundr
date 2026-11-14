# Retouches PR #32 — travail en cours

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

Nouvelle suite `reproduction/browser.cjs` ajoutée à la CI : parcours neuf, correction
de but, carrousel circulaire et temps écoulé conservés via Paramètres, pause,
verrouillage, deux thèmes, petits écrans/paysage, partage et trois politiques de
lancement Maracana. **Cette suite n'est pas encore validée.** Sa première exécution
s'est arrêtée sur une attente de sélection qui omettait `aria-current` ; cette
attente a été corrigée. La relance n'a pas été exécutée : le contrôle automatique
d'autorisation a atteint sa limite d'utilisation.

Les captures actuellement présentes sont intermédiaires ; le fichier `FAILED-*`
documente cet arrêt de test, pas une validation du match. Il reste à rejouer la
nouvelle suite, les suites navigateur du dépôt, Expo Doctor et les exports des
trois plateformes, puis à inspecter et remplacer les captures finales.

**Aucun commit de ces retouches publié à ce stade. Aucun merge ni build natif.**

## Téléphone

Restent à vérifier sur appareil : masque et netteté de l'icône, splash au démarrage
réel, zones tactiles et gestes, lisibilité du cercle et des couleurs d'équipe,
rotation paysage, continuité via Paramètres et feuille de partage native. Les
captures navigateur ne valident pas ces comportements natifs.

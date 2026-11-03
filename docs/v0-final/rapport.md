# Corrections de fin de recette V0

Base exacte : `accbea8adb3d8112062d1751176851e1b445ab3c`, tête de la PR #19 vérifiée le 3 novembre 2026. Branche dédiée : `codex/roundr-v0-final-fixes`, PR empilée sur `codex/roundr-expo-sdk58`. Aucune fusion, aucun build EAS.

## Signalements et comportement attendu

| N° | Reproduction et cause | Correction ciblée |
| --- | --- | --- |
| 1 | Ouvrir « Enregistrer dans Mes chronos » : nom initial vide, erreur immédiatement affichée. | Afficher l'erreur après interaction ou sortie du champ. Enregistrer reste désactivé tant que le nom est vide. Réinitialiser l'état de validation à chaque ouverture. |
| 2 | Finir Cup/Survie puis consulter le tableau ou le panneau de fin : interruption toujours proposée. | Masquer l'interruption quand la projection du tournoi est complète ou que la session n'est plus active. Préserver palmarès, résultats, corrections et archivage. |
| 3 | Arrêter un match chronométré après 12,345 secondes : la projection force zéro alors que le moteur conserve 12 345 ms. | Lire le chrono déjà figé de la phase, calculer son temps restant et conserver la nature de la dernière phase. Aucun changement du moteur, de la sauvegarde ou du temps joué. |
| 4 | À 320 px, les cinq durées rapides occupent trois lignes : le calcul depuis la fenêtre surestime l'espace intérieur de la carte. | Répartition flexible dans la largeur réelle de la carte, avec retour à la ligne. Mêmes durées, couleurs, actions et composants. |
| 5 | Ouvrir Intervalles avec une période : réglage « Repos entre périodes » visible mais inutilisé par la séquence. | Masquer ce réglage tant qu'il n'y a qu'une période. Conserver sa valeur et le repos entre séries : aucune réécriture des configurations existantes. |
| 6 | Ajouter un seul joueur : carte « 1 joueur », résumé « 1 joueurs ». La reprise d'une liste d'un joueur utilise aussi le pluriel. | Comptage commun : « 0 joueur », « 1 joueur », « 2 joueurs », y compris l'accord d'« enregistré ». |
| 7 | Projection d'un compte à rebours expiré avant son tick : reprise encore proposée. Le catalogue propose aussi de reprendre un état déjà marqué terminé. | Projeter l'expiration à l'accueil sans mutation ni écriture et exclure les états terminés du catalogue. Garder les chronos réellement en pause accessibles et les données disponibles pour consulter/relancer. |
| 8 | Cadrans numérique/circulaire montés simultanément : doublons digits, centièmes et statut. Score du panneau de fin dupliqué avec celui de l'écran. | Suffixes stables par cadran/panneau. Contrôle DOM de l'unicité de tous les `data-testid` dans les 78 états existants et dans la recette ciblée. |

## Arrêt manuel : analyse et limites de reproduction

`endManual` fige déjà `chrono.accumulatedMs`, annule `runningSince` et comptabilise la phase dans `playedMs`. `finishMatch` conserve la phase précédente. Le total joué peut contenir plusieurs périodes : l'utiliser comme durée de la dernière période serait incorrect. La correction de `matchProjection` lit uniquement le chrono figé, sans modifier l'objet ni ses données persistées. Elle conserve le décompte d'une prolongation et le temps croissant d'un golden goal/temps additionnel.

Une fin naturelle conserve `00:00`. Une fin manuelle de première mi-temps continue de suivre la transition métier existante, sans terminer artificiellement tout le match. La barre reste à 100 % pour un match terminé. Le chronomètre libre en pause conserve déjà son temps : ce cas n'est pas défectueux. Son action « Fin » conserve le flux de confirmation et de suppression existant.

Pour le n°7, un état **déjà marqué terminé** n'était pas repris à l'accueil ; le chargement du store avance également un compte à rebours expiré. Une reprise persistante de cet état après rechargement n'est donc pas reproduite. Le défaut confirmé à l'accueil concerne la projection d'un état encore `running` dont l'échéance est dépassée, avant le prochain tick. Le défaut du catalogue est indépendant et reproductible avec `finished: true`.

## Recette et tests

- Nouvelle suite `frontend/scripts/test-v0-final.ts`, exécutée par `npm test` : quatre modes de match, arrêt manuel figé après sérialisation/restauration, seconde mi-temps, fin naturelle, compte à rebours expiré sans tick, pause conservée, expiration d'intervalles, absence de mutation, gagnant qui reste, premier à deux buts, lancement manuel/automatique du suivant, golden goal et tirages équilibrés sans perte ni doublon.
- Recette navigateur `reproduction/browser.cjs` : validation réelle du nom et enregistrement, une/deux périodes, ajout et tirage de cinq joueurs nommés, accueil expiré/pausé, catalogue terminé, Cup/Survie terminés (tableau et panneau de fin), six largeurs de 320 à 844 px, rotation des cinq écrans avec comparaison des données persistées.
- Le banc existant vérifie désormais les identifiants uniques dans ses 78 états. La CI exécute aussi la nouvelle recette ciblée, en plus des rendus, commandes à horloge contrôlée, contrôles mobiles et aperçus audio existants.
- `reproduction/baseline.cjs` compare avec une exportation inchangée de `accbea8`. Il produit captures et observations JSON des défauts initiaux. `reproduction/local.cjs` lance Metro et les navigateurs dans le même environnement Windows.

Les résultats exécutés et les liens des jobs sont publiés dans la PR. Les exports CI sont des bundles JavaScript, pas des builds EAS ni une validation physique Android/iPhone. Le paysage est testé dans le navigateur, y compris la rotation réelle de la fenêtre ; la rotation native reste à vérifier sur appareil.

## Périmètre conservé

Aucun fichier du domaine, du store, des préférences, des sons, des assets validés, du manifeste audio, de `package.json`, du lockfile, de la configuration Expo/EAS ou du SDK n'est modifié. Les sept sons et leurs déclencheurs sont conservés. Les seules modifications visuelles sont la disposition des durées et la visibilité/validation des éléments signalés.

## Incidents de validation

La première fixture de test Cup utilisait trop peu d'équipes ; elle a été corrigée avant validation, ainsi que les types des fixtures. L'installation locale a utilisé le lockfile figé de la base. Le premier lancement navigateur était empêché par le sandbox Windows, puis le serveur et le navigateur étaient séparés par leurs environnements ; le lanceur commun résout cela. `expo lint` local nécessitait `yarnpkg`, absent du PATH ; un essai `npx` a échoué sur DNS. Le lint applicatif a été exécuté directement avec la configuration ESLint existante sur `src` et `app`, périmètre par défaut d'Expo. Un essai ESLint sur tout le dossier incluait des scripts historiques hors de ce périmètre et signalait 23 erreurs/22 avertissements préexistants ; aucun nettoyage hors sujet n'est inclus.

> Finalisation sportive : les deux écarts ci-dessous sont désormais corrigés pour les nouvelles compétitions. Voir [le rapport avant/après et la compatibilité des sauvegardes](../phase3b-finalisation/rapport.md). Ce rapport visuel conserve les constats du checkpoint 39db251.

# Roundr — Phase 3B : Cup et Survie

La branche `codex/roundr-lovable-phase-3b` part exactement de `d2e1b8840bf934c6d8a9b2b17691e5529c845bd8`. La cible est `codex/roundr-lovable-phase-3a`. La référence Lovable reste `v0-lovable-final`, commit `1c59720dc5b180d5b1bacfaf935902b4053895fa`, examinée dans une copie Git propre et laissée intacte. Aucune fusion, modification de main, publication ou construction EAS payante.

## Écrans et parcours

| Parcours | Travail livré | Preuves |
|---|---|---|
| Accueil Cup | Synthèse, premier/prochain match, onglets Matchs/Poules/Tableau, préparation manuelle | Galerie `cup-start`, `cup-preview` |
| Poules et qualifications | Classements, ex æquo, qualifiés, choix explicite à la coupure, aperçu du tableau | `cup-groups`, `cup-qualified`, `cup-decision` ; tests comparés au moteur figé |
| Phases finales | Quarts, demies, finale, petite finale ; participants connus/inconnus, exemptions, résultats | Cup à 16 équipes ; Survie à 5 et 8 équipes ; `survie-semis`, `survie-small-final`, `survie-final` |
| Matchs Cup/Survie | Composants Phase 3A réutilisés : scores/maillots, chronos numérique/circulaire, centièmes, restant/écoulé, protections et annonces | `cup-ready`, `cup-paused`, `cup-ring`, `cup-elapsed`, `cup-info`, variantes Survie |
| Transitions | Résultat, progression, prochain match ; manuel, automatique et différé | `cup-result`, `cup-auto`, `survie-auto`, `survie-delay` ; tests des trois politiques |
| Départages | Choisir/préparer la prolongation ou le Golden goal sans démarrer ; saisie des TAB refusant un score nul | Variantes `extra-choice`, `extra-ready`, `shootout`, `golden-ready` des deux modes |
| Corrections | Modification d’un résultat ancien, recalcul selon sa politique existante ; annulation des seuls résultats dépendant d’un nouveau qualifié | `cup-correction` ; tests sur Cup et Survie complètes |
| Palmarès et interruption | Champion, podium, statistiques, tableaux, résultats, nom, historique, reprise/rejeu | `cup-palmares`, `survie-palmares`, `survie-stop`, interaction d’archivage |
| Cup à un seul qualifié | Aucun match final inventé à l’écran ; le premier qualifié gagne | Annexe : la référence plante après le choix ; critères du champion comparés au moteur réel Lovable |

La [galerie](index.html) contient **64 paires**, soit 32 états à **390 × 844** et **844 × 390**. Les 128 captures originales comparables sont jointes avec dimensions et empreintes dans [manifest.json](manifest.json). Les équipes, scores, paramètres et vues sont identiques dans chaque paire. Le cas supplémentaire à un qualifié est isolé dans une annexe non comparable : le rendu Lovable devient vide après un RangeError. Il est exclu du compte des paires valides. Le cadrage est placé en début d’écran ; les parties défilantes et toutes les combinaisons possibles ne constituent pas une couverture visuelle exhaustive. Les colonnes lointaines des grands tableaux nécessitent encore un examen par défilement sur appareil.

Les captures proviennent des composants de référence inchangés et des composants Expo réels, dans deux laboratoires isolés. Les horloges sont figées et les animations réduites pour éviter de comparer des instants différents. Les données de démonstration, routes QA et changements d’horloge sont exclus des sources et exports de production. L’oracle de tests est le fichier pur Lovable exact, protégé par SHA-256 et une règle de fins de ligne LF.

## Sauvegardes et compatibilité

Le nouveau test a reproduit un défaut : après une correction et un échec d’écriture de l’historique, un redémarrage considérait l’ancienne archive comme à jour. La reprise réconcilie maintenant la session courante durable avec son archive, conserve le nom/date de cette archive et retente son écriture. Une ancienne copie du dernier résumé ne peut pas remplacer une archive corrigée plus récente. L’erreur reste visible tant que l’écriture n’a pas réussi.

Si une correction rouvre un tableau, le palmarès précédent reste conservé et est explicitement signalé comme antérieur jusqu’à la nouvelle finalisation. Aucun résultat indépendant n’est supprimé. Un second test a reproduit un mauvais ordre visuel des exemptions : le tableau ne trie plus ses cases selon l’ordre de lancement des matchs, ce qui conserve les positions Lovable des équipes. Les données et l’ordre sportif des rencontres restent inchangés. Les valeurs brutes invalides restent conservées et une copie dont l’écriture échoue n’est jamais annoncée comme sauvegardée.

Une régression supplémentaire couvre la correction d’un résultat après préparation de la rencontre suivante. Cette rencontre sans résultat est remise dans le planning avant de retirer son chrono préparé ; elle ne peut plus rester marquée « live » sans séance et être sautée. Le test a échoué avant correction, puis passe pour Cup et Survie, y compris après redémarrage du stockage.

Les nouveaux champs sont facultatifs. Les anciennes séances gardent leurs paramètres, critères de qualification et comportement temporel ; une correction ne les fait pas basculer implicitement dans le nouveau parcours de préparation. Un rejeu crée une nouvelle compétition, avec les paramètres conservés, et conserve l’archive précédente.

## Défaut confirmé dans la référence figée

Après un choix explicite de qualifié dans une Cup à un seul qualifié, l’archivage Lovable appelle `br.outcome("K2-0")` alors que le tableau a une taille de 1. La résolution récursive cherche une finale inexistante et déclenche **RangeError: Maximum call stack size exceeded**. Le navigateur rend alors un écran vide. Le test caractérise cette erreur dans le module figé exact ; la trace réelle du navigateur figure dans `annexes/lovable-single-qualifier-error.json`.

Expo garde le comportement métier déjà validé en Phase 2B : champion désigné parmi les qualifiés, pas de finale artificielle, archivage possible. Aucun correctif n’a été appliqué à Lovable. Cette variante ne peut donc pas recevoir une validation visuelle de fidélité après le choix ; elle est présentée séparément, avec cette limite explicite.

## Règles comparées : décisions explicites avant alignement supplémentaire

| Cas | Lovable figé | Expo actuel | Conséquence et suite proposée |
|---|---|---|---|
| Cup nouvelle, poule terminée | Points ; mini-classement complet : points, différence et buts ; différence/buts/victoires globaux | Même politique `lovable`, déjà raccordée en Phase 2B | Matrice de qualifications/tableaux vérifiée contre le vrai moteur figé. Aucun changement de critères dans cette phase. |
| Anciennes Cup sans politique `lovable` | Mini-classement complet incluant sa différence de buts et ses buts | Confrontations directes en points puis différence/buts/victoires globaux | Le qualifié peut changer. Exemple : t1–t2 3–0, t2–t3 2–0, t1–t3 0–1, t1–t4 1–0, t2–t4 10–0, t3–t4 1–0 : Lovable/nouvelle Cup placent t1 premier, l’ancien moteur t2. **Conservé pour les sauvegardes existantes ; toute conversion demande une décision explicite.** |
| Anciennes Cup : comparaison entre poules et tableau | Performance moyenne par match et placement des têtes de série ; meilleurs suivants selon option | Ancienne politique de repêchage/placement ; moyenne seulement si tailles différentes | Qualifiés ou adversaires potentiellement différents. Politique ancienne conservée ; pas de migration sportive silencieuse. |
| Poule aller-retour incomplète | Ignore la confrontation directe tant que toutes les confrontations prévues entre les ex æquo ne sont pas jouées | Peut déjà appliquer le mini-classement dès qu’un aller complet existe | Classement **provisoire** différent ; qualifications indisponibles tant que les poules ne sont pas terminées. Contre-exemple automatisé conservé. Proposer l’alignement séparément. |
| Prolongation avec objectif de buts activé | Désactive l’objectif de buts pendant la prolongation ; son temps ou la fin manuelle tranche avant les TAB | L’objectif natif reste actif et peut arrêter la prolongation avant son terme | Écart fonctionnel réel, pouvant changer le résultat. Test de caractérisation explicite. **À arbitrer avant fusion ; aucune modification silencieuse.** |
| Survie : tableau et exemptions | Placement, exemptions, petite finale si prévue | Politique de tournoi Phase 2B conservée | Comparaison de compétitions terminées à 2/3/5/8/16/32 équipes, avec les options applicables : concordance dans la matrice testée. |

Pour les poules de même taille entièrement jouées, diviser tous les totaux par un même nombre de matchs ne change pas le classement final : les différences héritées portent surtout sur le repêchage automatique et le placement, en plus du mini-classement décrit ci-dessus.

La préparation des nouvelles prolongations est désormais explicite, comme dans Lovable : choisir/préparer ne lance pas le chrono. Les anciennes séances gardent leur comportement antérieur. Après une correction d’un résultat, les lancements automatiques/différés sont suspendus et demandent une nouvelle préparation explicite, conformément à la protection native déjà validée : une ancienne échéance ne peut pas lancer une mauvaise confrontation. Ouvrir une fenêtre de correction/arrêt met également le délai en pause ; annuler la fenêtre ne le relance pas silencieusement.

## Interactions réellement manipulées dans le navigateur

- Correction Cup : modifier puis fermer laisse 2–0 ; modifier puis enregistrer donne 3–0. Le parcours de résultat est conservé. Un chargement de la vraie route `/live`, sans réexécuter le semeur QA, restaure 3–0.
- Après préparation du match 2, retour au tableau puis correction du résultat du match 1 : la même confrontation Panthères–Tigers reste proposée. Sa nouvelle préparation puis le rechargement de la vraie route /live conservent Match 2/12, 0–0, 10:00 et Démarrer.
- « Lancer le prochain match » prépare la deuxième rencontre à 0–0 et 10:00, avec bouton Démarrer et chrono arrêté.
- La vue Tournoi sélectionnée est restée visible après **38,227 secondes** d’horloge réelle, sans retour automatique au chrono.
- TAB Survie : 0–0 refusé, saisie 1–0 acceptée, score de jeu conservé à 0–0, vainqueur et palmarès corrects.
- Le nom « Survie — test de reprise » est enregistré puis retrouvé dans l’historique après finalisation et rechargement de la vraie route `/history`.
- Interrompre puis Continuer conserve l’accueil du tournoi ; Interrompre définitivement ouvre le résumé « Tournoi interrompu ».
- Égalité parfaite : choix explicite de Les Renards, confirmation et accès au palmarès ; aucune finale artificielle dans une Cup à un qualifié côté Expo. Le même choix fait planter la référence Lovable, ce qui interdit de valider visuellement son état suivant.

Les confirmations système Relancer/Fin/Rejouer ne sont **pas déclarées validées par manipulation native** dans cette phase. Les tests antérieurs de callbacks restent exécutés. Les annonces de 4,5 secondes et l’absence d’autodéfilement restent couvertes par les régressions Phase 3A ; leur durée n’a pas été remesurée dans un match Cup réel sur téléphone.

## Contrôles automatisés

Exécution locale dans une copie isolée des mêmes sources, dépendances Expo **57.0.30**, TypeScript **6.0.3**, Node **24.19.0**. GitHub utilise Node 22. Aucun fichier QA n’est inclus dans les exports de production.

| Contrôle | Résultat local |
|---|---|
| Métier et sauvegardes | 18 suites exécutées, toutes réussies, dont les deux nouvelles suites Phase 3B |
| Syntaxe TypeScript | 99 fichiers analysés, 0 erreur |
| TypeScript `tsc --noEmit` | Réussi |
| ESLint application et nouveaux tests/helpers | 0 erreur / 0 avertissement après correction d’un usage de `__dirname` non déclaré dans le nouvel oracle |
| Lint Expo sans corrections | Réussi ; la première tentative, bloquée par l’écriture du cache utilisateur, est conservée dans les journaux puis relancée avec le cache isolé |
| Exports Android, iOS et web | Réussis localement ; bundles Hermes Android/iOS et export web, **pas des applications signées/installées** |

Journaux dans [controles/](controles/). Les fichiers contenant « before » ou « initial-environment-error » conservent les échecs reproduits avant correction ou les problèmes de cache local ; ils ne sont pas les résultats finaux. Les anciens scripts ne sont pas présentés comme entièrement remis au niveau ESLint ; aucune règle ni contrôle GitHub n’est désactivé. Le workflow est simplement raccordé à la branche Phase 3B et aux PR vers Phase 3A. Les résultats GitHub du commit exact sont indiqués dans la PR et le bilan de livraison, sans les déduire des contrôles locaux.

Les tests ajoutés couvrent la matrice Cup/Survie, poules/KO, exemptions, choix de qualification, petites finales, durées par tour, extra/TAB/Golden, préparation/reprise, trois politiques de lancement, corrections dépendantes/indépendantes, reprise des archives après échec/redémarrage, vieux résumés, données rejetées et copies impossibles. Les protections du Chrono libre restent exécutées sans migration ou changement de ce mode.

## Écarts visuels et adaptations natives à examiner

Les composants respectent les gabarits, textes et tokens de la référence. La vue Tournoi conserve le débordement de la référence en paysage afin de ne pas tronquer sa progression. Les intitulés inconnus du tableau, les exemptions et les badges restent distincts. Les en-têtes et boutons déjà validés ne sont pas reconstruits.

Des différences mineures de métrique/anticrénelage des polices restent possibles. Dans certains accueils Cup, le bouton texte conserve une cible native de 44 px là où le rendu web Lovable est plus compact, avec un décalage vertical d’environ 8 px ; le contenu et l’ordre restent identiques. Les boutons de fermeture et les contrôles de score gardent des zones tactiles utilisables. Les zones sûres et le grand texte peuvent provoquer une disposition sur une colonne pour rester accessibles.

Les captures n’ont pas fait l’objet d’un verdict automatique de correspondance pixel par pixel. Les écrans sont à soumettre à votre validation visuelle. Le contrôle musical natif de la musique déjà diffusée reste à réaliser ; aucun lecteur de démonstration ne le remplace.

## Recette iPhone / Android avant fusion

1. Démarrer une Cup avec poules puis une Survie à 5 équipes ; vérifier exemptions, qualifiés, petite finale et finale en portrait/paysage, encoche et barre système.
2. Préparer une rencontre puis une prolongation/Golden goal : le temps reste arrêté jusqu’à Démarrer. Tester manuel, automatique et délai avec pause/annulation.
3. Mettre en pause avec un score, fermer complètement l’application hors ligne, rouvrir : mêmes équipes, score et temps. Refaire pendant un délai, un choix de prolongation et des TAB.
4. Corriger un ancien résultat : Annuler conserve les données ; confirmer conserve les résultats indépendants et annule les rencontres devenues incompatibles. Contrôler le palmarès antérieur puis la nouvelle finalisation.
5. Terminer/renommer, revenir à l’accueil, fermer et rouvrir : historique unique, nom et résultats conservés. Rejouer sans effacer l’archive.
6. Tester verrouillage, appuis longs, boutons Retour/Fin/Relancer/Rejouer, notifications/sons, appel entrant, écran éteint et reprise en arrière-plan.
7. Défiler dans les grands tableaux et résumés, utiliser les modales en paysage et avec grand texte/clavier, vérifier VoiceOver/TalkBack et les zones tactiles.

**Arrêt après la Phase 3B.** PR en brouillon vers Phase 3A ; validation visuelle, arbitrages sportifs ci-dessus et essais physiques restent nécessaires. Aucun travail sur le Chrono libre ni phase suivante.

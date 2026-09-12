# ROUNDR — Cahier des charges fonctionnel V0

Version 1.0 — 12 septembre 2026  
Destination : conception, implémentation et recette dans le projet Emergent existant.  
Source : conversation « ROUNDR », identifiant `6a9493c8-4488-83eb-9400-0fbfb63d615e`, depuis les premiers échanges sous le nom Krono jusqu’à la validation des écrans de fin.

## 0. Statut et mode d’emploi

Ce document consolide les décisions de la conversation. Il distingue trois statuts :

- **V — Validé** : demande explicite ou proposition acceptée dans la conversation. Les exigences sans autre marqueur ont ce statut.
- **C — Convention proposée** : précision nécessaire à une implémentation déterministe, mais non tranchée dans la conversation. Une proposition concrète figure au §16 ; elle ne doit pas être présentée comme une décision déjà validée.
- **R — Rectification** : correction d’un exemple incohérent, sans changement du principe fonctionnel validé.

Les décisions explicites de l’utilisateur priment sur les reformulations de l’assistant. Les décisions récentes remplacent les anciennes lorsqu’elles les contredisent explicitement. Une omission dans une synthèse récente ne suffit pas à supprimer une option précédemment demandée. Les exemples chiffrés de résultats ne sont jamais des données à afficher en production.

Le socle et les règles V sont prêts à construire. Les conventions C forment un profil d’implémentation proposé, isolable dans le code ; elles restent à confirmer avant de déclarer la recette produit définitive. Les prompts associés demandent de documenter toute convention utilisée.

Livrable complémentaire : `ROUNDR_V0_Prompts_Emergent.md`. Ce cahier des charges est la référence ; les prompts découpent le travail sans remplacer ses règles.

## 1. Vision et objectif de la V0

**Promesse : « Plus de jeu. Moins d’organisation. »**

Roundr est une application mobile de chronométrage et d’organisation des sessions de football amateur : foot entre amis, Five et football de rue. Le temps est le point d’entrée ; les scores, rotations et tournois servent à fluidifier le jeu.

**Objectif V0 : un seul organisateur, avec un seul téléphone et un seul terrain, peut gérer une session complète sans autre outil.** Il choisit un mode, règle l’essentiel, lance le chrono, saisit les scores lorsque nécessaires et déclenche les matchs suivants. Roundr applique les règles et conserve la session localement.

Objectifs d’usage :

- Lancer une configuration courante en moins de 30 secondes.
- Atteindre le chrono en 3 à 5 actions dans un parcours rapide avec réglages proposés ; la personnalisation de 32 équipes n’est pas incluse dans cette cible.
- Lire d’abord le temps, puis le score et les équipes, puis les prochains participants.
- Pouvoir réaliser toute la session hors connexion après installation.
- Faire 5 à 10 sessions terrain avant de considérer la V0 validée. Mesure principale : l’organisateur choisit-il de réutiliser Roundr lors de la session suivante ?

L’optimisation automatique d’un créneau disponible, le contrôle partagé et les profils joueurs appartiennent à la vision future. Ils ne sont pas des prérequis de la V0.

## 2. Principes UX et identité visuelle

### UX-01 — Temps d’abord

Dans les configurations : durée, règles de temps, organisation du format, puis identité des équipes. Le chrono reste l’élément dominant du live. L’objectif de lisibilité à plusieurs mètres est une intention terrain à vérifier sur téléphone, pas une garantie pour tous les appareils à 5 mètres.

### UX-02 — Un écran de configuration par mode

Parcours commun : **Accueil → configuration du mode → Lancer → live**. Aucun écran d’explication obligatoire entre la carte du mode et sa configuration. Aucun écran séparé pour renseigner les équipes. Les champs optionnels se déplient sur place.

Un écran peut défiler. Les réglages avancés restent repliés. Pas de prévisualisation de programme obligatoire, de tutoriel bloquant ou de compte à créer.

### UX-03 — Actions de terrain

Grandes zones tactiles, contraste fort, textes courts, pas de geste caché indispensable. Deux commandes principales sur le live : **Pause / Reprendre** et **Fin du match**. Les boutons de score +1 s’ajoutent lorsque le score est actif. La correction du score et les classements restent secondaires.

La confirmation « Terminer le match ? — Annuler / Terminer » est conservée pour éviter les fins accidentelles. Les autres confirmations se limitent aux pertes de données ou opérations réellement ambiguës.

### UX-04 — Identité

Nom produit : **Roundr**. Direction validée : noir, anthracite, vert néon, typographie large, esthétique sportive sobre, street et premium. Une seule famille de composants pour les cinq modes. Les maquettes validées restent les références visuelles si disponibles dans le projet Emergent.

Les couleurs exactes, polices, tailles et icône finale ne sont pas figées par ce document : ne pas présenter des valeurs inventées comme issues des maquettes. Conserver les éléments satisfaisants du projet existant. Le texte fonctionnel de la V0 est en français (**C01**).

## 3. Périmètre fonctionnel

| Mode | Participants | Structure | Score | Fin au temps / objectif de buts |
|---|---|---|---|---|
| Match classique | 2 équipes | 1 période ou 2 mi-temps | Facultatif | Temps, avec additionnel optionnel |
| Maracana | 3 à 8 équipes | Rotation continue | Obligatoire | Cases indépendantes Temps / Premier à X buts |
| Cup | 4 à 32 équipes | Poules puis élimination | Obligatoire | Cases indépendantes Temps / Premier à X buts |
| Survie | 2 à 32 équipes | Élimination directe | Obligatoire | Cases indépendantes Temps / Premier à X buts |
| Custom | Chrono libre, 2 équipes si utilisées | 1, 2, 3, 4 périodes ou plus | Facultatif, obligatoire si objectif de buts | Cases indépendantes Temps / Premier à X buts |

Survie n’est pas un mode « le gagnant reste ». Ce mécanisme appartient à Maracana à 3 équipes.

Fonctions communes : pause/reprise, sons désactivables, correction de score, sauvegarde locale, restauration, résultats et partage. Classements pour Maracana et les poules de Cup ; tableaux pour Cup et Survie ; presets personnels pour Custom.

## 4. Parcours et catalogue des écrans

| ID | Écran / état | Contenu et actions attendus |
|---|---|---|
| E01 | Accueil | Roundr ; cinq grandes cartes ; Match classique en premier et dominant ; Mes chronos ; Reprendre la session si elle existe |
| E02 | Configuration | Un écran adapté au mode ; options conditionnelles ; CTA Lancer |
| E03 | Live commun | Mode, numéro de match si pertinent, phase/période, énorme chrono, équipes/score, prochain match, préparation, pause/reprise, fin |
| E04 | Pause manuelle | Temps figé, état Pause visible, Reprendre ; aucun nouvel écran obligatoire |
| E05 | Pause entre périodes | Période terminée, durée de pause, période suivante ; reprise selon C04 |
| E06 | Départage | Prolongation, golden goal ou saisie TAB selon la règle configurée |
| E07 | Transition | Résultat, équipes sortantes/entrantes si pertinent, prochaine affiche, Lancer le prochain match ; lien Classement/Tableau |
| E08 | Classement / tableau | Vue secondaire ; résultats, progression et équipes ; retour au live ou à la transition sans modifier l’état du chrono |
| E09 | Fin de session | Résumé adapté au mode, détails secondaires, nouvelle session, accueil, partage |
| E10 | Mes chronos | Presets Custom locaux ; lancement et gestion simple, détails au §12 |
| E11 | Carte de résultat | Aperçu de la carte générée, partage système, annuler/revenir |

Le bouton **Lancer** de la configuration crée la session et démarre le premier match ; ne pas imposer une deuxième validation de démarrage. En revanche, chaque match suivant est lancé manuellement depuis E07. Aucune durée de transition n’est imposée.

L’accès à un tableau pendant le live ne met pas implicitement le match en pause (**C03**). Une nouvelle session ne doit pas écraser silencieusement une session active (**C03**).

## 5. Configurations des cinq modes

### 5.1 Match classique — MC

| Ordre | Champ | Valeurs / comportement |
|---|---|---|
| 1 | Durée totale de jeu | 10 / 30 / 45 / 90 min / Personnalisée minute par minute |
| 2 | Format | 1 période / 2 mi-temps |
| 3 | Pause | Visible si 2 mi-temps ; choix prédéfinis ; liste finale à préciser, proposition C02 |
| 4 | Temps additionnel | ON/OFF ; configuré avant le match |
| 5 | Score | ON/OFF |
| 6 | Sons / alertes | ON/OFF |
| 7 | Ajouter les équipes | OFF par défaut ; ON déplie noms et couleurs |
| 8 | Lancer le match | Action principale |

Sans personnalisation : Équipe A / Équipe B. Aucun module de préparation ou d’échauffement.

La durée choisie est le total de jeu hors pause : 90 min en 2 périodes = 45 + pause + 45 ; 30 min = 15 + pause + 15 ; 45 min = 22:30 + pause + 22:30. Le score reste cumulé entre les périodes.

Arrêt automatique : fin à zéro sur la dernière période. Additionnel : passage en `+00:01`, `+00:02`… jusqu’à la fin manuelle. L’application du réglage aux périodes intermédiaires est précisée par **C04**, car la conversation ne l’a pas fixé.

L’objectif « premier à X buts » n’est pas ajouté à Match classique : les derniers écrans validés ne le retiennent pas, et l’utilisateur avait préféré réserver cet usage aux autres formats.

### 5.2 Maracana — MA

| Ordre | Champ | Valeurs / comportement |
|---|---|---|
| 1 | Durée des matchs | 7 / 8 / 10 min / Personnalisée |
| 2 | Fin du match | ☑ Au temps ; ☐ Premier à X buts ; cases indépendantes |
| 3 | Nombre de buts | Visible uniquement si objectif actif : 1 / 2 / 3 / 5 / Personnalisé |
| 4 | Nombre d’équipes | 3 à 8 |
| 5 | Personnaliser les équipes | OFF par défaut ; noms/couleurs dépliés si ON |
| 6 | Sons / alertes | ON par défaut |
| 7 | Lancer la session | Action principale |

Sans personnalisation : Équipe 1, Équipe 2… Score obligatoire sans interrupteur. Préparation automatique, sans réglage supplémentaire. Une durée commune à tous les matchs ; pas de configuration des rotations.

**MA-01 — Trois équipes.** A et B jouent, C attend. Le vainqueur reste, le perdant sort et C entre. En cas de nul, l’équipe présente depuis le plus longtemps de façon consécutive sort. Conserver la présence consécutive réelle, pas seulement le nombre de victoires. Égalité de présence initiale : **C07**.

**MA-02 — 0–0 à trois équipes.** À la fin du temps réglementaire, ajouter une unique extension de 2 minutes. Si le score reste 0–0 après ces 2 minutes, enregistrer le nul et appliquer la rotation normale. Le scénario ancien décrivait une fin dès le premier but pendant cette extension ; l’interaction avec un objectif X plus élevé est explicitée en **C06**.

**MA-03 — Quatre à huit équipes.** Les deux équipes sortent après chaque match ; deux équipes en attente entrent. Tout nul est accepté sans extension. L’ordre doit être automatique ; son algorithme exact n’était pas figé (**C08**). Ne jamais faire rejouer immédiatement une des deux équipes qui vient de sortir.

**MA-04 — Ajout en cours de session.** Conserver la possibilité évoquée dans le cadrage Street/Maracana : ajouter une équipe sans recommencer, jusqu’à 8 équipes, avec zéro match et zéro point. Commande secondaire, hors des actions principales du live. La proposition avait été incluse dans le récapitulatif V0 puis omise des synthèses : ce document la conserve, sans ajouter de retrait d’équipe. Modalités à la transition et passage de 3 à 4 : **C09**.

**MA-05 — Fin de session.** Rotation continue, sans durée globale imposée et sans optimisation de créneau. Prévoir « Terminer la session » depuis la transition, avec confirmation (**C10**). Arrêter un match et arrêter une session sont deux actions distinctes.

### 5.3 Cup — CU

| Ordre | Champ | Valeurs / comportement |
|---|---|---|
| 1 | Durée des matchs de poule | 7 / 8 / 10 min / Personnalisée |
| 2 | Fin du match | Cases indépendantes Au temps / Premier à X buts ; temps actif par défaut |
| 3 | Nombre de buts | Conditionnel, mêmes valeurs que Maracana |
| 4 | Nombre d’équipes | 4 à 32 |
| 5 | Poules | Nombre recommandé, modifiable ; répartition cohérente |
| 6 | Format | Aller simple / Aller-retour |
| 7 | Qualification | Recommandation automatique ; nombre de qualifiés modifiable |
| 8 | Égalité en phase finale | TAB directs / Prolongation + TAB / Golden goal |
| 9 | Durée de prolongation | Visible si concernée ; 2 min par défaut |
| 10 | Match pour la 3e place | ON/OFF |
| 11 | Personnaliser les équipes | OFF ; si ON, noms et couleurs |
| 12 | Répartition | Aléatoire par défaut ; manuelle disponible dans la section dépliée |
| 13 | Options avancées | Additionnel en poules ; durées par tour ; croisements de phase finale |
| 14 | Sons / alertes | ON par défaut |
| 15 | Lancer le tournoi | Action principale |

**CU-01 — Structure assistée.** À 8 équipes, proposer 2 poules de 4, 2 qualifiés par poule, demi-finales puis finale. À 12 équipes, conserver l’exemple récent : 3 poules de 4, 2 qualifiés par poule et 2 meilleurs troisièmes, puis quarts. La recommandation générale et le calcul des meilleurs troisièmes sont détaillés en **C12–C14**.

**CU-02 — Poules.** En aller simple, chaque paire se rencontre une fois ; en aller-retour, deux fois. Pour une poule de n équipes, cela représente n(n−1)/2 ou n(n−1) rencontres. Un seul match à la fois, sur un terrain. Ordre automatique déterministe et conservé à la restauration (**C12**).

**CU-03 — Résultats.** Nul autorisé en poule. Barème 3/1/0. Option de temps additionnel ouverte explicitement demandée par l’utilisateur : elle reste disponible, repliée et OFF par défaut (**C02**). Dans ce cas, à zéro, le chrono monte en positif jusqu’à fin manuelle. Si l’objectif X est aussi actif, l’atteindre termine le match avant ou pendant l’additionnel. Le libellé de configuration doit expliquer cette exception à la fin automatique au temps.

**CU-04 — Qualifications.** À la fin des poules, calculer les qualifiés et générer le tableau. Afficher la phase terminée et les équipes qualifiées dans une transition courte. Une égalité parfaite ne peut pas être résolue arbitrairement pour remplir une place : **C13–C14**.

**CU-05 — Croisements.** Conserver le choix demandé par l’utilisateur. Proposition par défaut pour 2 poules et 2 qualifiés : A1–B2 et B1–A2. Permettre l’ajustement des croisements dans la section avancée avant lancement, sans doublon de place qualifiée. Ne pas réintroduire un second parcours obligatoire. Spécification générale : **C15**.

**CU-06 — Durées par tour.** Même durée que les poules par défaut ; option avancée pour quarts, demi-finales, finale et tours supplémentaires applicables. Cette option a été demandée explicitement ; la conserver malgré son omission des écrans simplifiés. Petite finale : durée des demi-finales proposée (**C15**).

**CU-07 — Phase finale.** Un gagnant doit être déterminé selon la règle de nul choisie. Les gagnants avancent une seule fois. Les perdants des demi-finales disputent la petite finale si activée. Fin complète après la finale et la petite finale lorsqu’elle existe ; ordre proposé : petite finale avant finale (**C15**).

### 5.4 Survie — SU

Configuration : durée 7 / 8 / 10 min / Personnalisée ; cases Au temps / Premier à X buts ; objectif conditionnel ; 2 à 32 équipes ; règle de nul ; durée de prolongation si nécessaire ; petite finale ON/OFF ; personnalisation OFF ; tirage Aléatoire / Manuel ; sons ON ; Lancer le tournoi.

Une section avancée conserve les durées par tour héritées de Cup. L’ancien cadrage les incluait ; une reformulation récente suggère de les repousser sans décision explicite de retrait. Elles sont donc conservées discrètement, avec ce point de périmètre signalé dans **C15**.

**SU-01.** Générer un tableau à élimination directe sans poule et sans classement par points.

**SU-02.** Gérer les exemptions automatiquement. Pour N équipes, prendre la plus petite puissance de 2 P supérieure ou égale à N ; prévoir P−N places exemptées, sans match entre deux places vides. Exemple : 10 équipes → tableau de 16 places, **6 exemptions**, 2 matchs préliminaires, puis 8 équipes en quarts. **R01 : l’exemple ancien « 2 équipes exemptées » était incorrect.** Une exemption n’est ni un match joué, ni un but, ni une victoire jouée.

**SU-03.** En tirage manuel, l’organisateur attribue les équipes aux places du tableau, sans doublon ; en aléatoire, l’app génère puis conserve le tirage. Aucun nouveau tirage lors d’une réouverture. Les règles communes d’élimination et de petite finale de Cup s’appliquent.

**SU-04.** Résumé « Dernière équipe en jeu » / champion. Afficher le nombre réel de victoires dans ce tournoi si souhaité. **R02 : ne pas coder “5 victoires consécutives” en dur ni transformer Survie en winner-stays.**

### 5.5 Custom — CT

| Ordre | Champ | Valeurs / comportement |
|---|---|---|
| 1 | Durée totale | Libre, minute par minute |
| 2 | Nombre de périodes | 1 / 2 / 3 / 4+ ; saisie entière au-delà |
| 3 | Répartition | Automatique ou personnalisée par période |
| 4 | Pauses | Durée entre périodes ; masquée avec une période |
| 5 | Fin du match | Cases Au temps / Premier à X buts |
| 6 | Nombre de buts | Visible si objectif actif |
| 7 | Temps additionnel | Option du cadrage Custom antérieur, visible si fin au temps active |
| 8 | Score | ON/OFF ; activé et requis si objectif de buts |
| 9 | Ajouter les équipes | OFF ; champs dépliés si ON |
| 10 | Sons / alertes | ON/OFF |
| 11 | Sauvegarder comme preset | OFF/ON ; nom demandé si ON |
| 12 | Lancer | Action principale |

36 min / 3 périodes propose 12 + 12 + 12 ; l’utilisateur peut choisir 10 + 10 + 16. La somme des périodes doit égaler le total ; les pauses sont exclues. Le score est cumulé sur toute la session, sans remise à zéro entre périodes. Pas de tournoi, de rotation, ni de préparation automatique.

Arrondis et limites : **C05**. Comportement sans limite de temps : **C06**. Presets : §12.

## 6. Moteur chrono commun — CH

### CH-01 — Une seule logique de temps

Un moteur partagé par les cinq modes, avec les états : prêt, jeu, pause manuelle, pause entre périodes, attente de reprise, additionnel ouvert, prolongation limitée, golden goal, attente TAB, match terminé, transition, session terminée.

La configuration et le moteur de mode décident des transitions. Aucun écran ne possède sa propre copie indépendante du temps ou du score.

### CH-02 — Calcul fiable

Calculer le temps à partir des instants de départ/reprise et de la durée active cumulée ; l’actualisation visuelle ne sert qu’à afficher. Ne pas dépendre du nombre d’exécutions d’un compte à rebours seconde par seconde.

Pause : figer le temps actif. Reprise : repartir exactement du temps sauvegardé. Les pauses manuelles ne font pas partie du temps joué. Le retour d’arrière-plan doit reconstruire l’état attendu, y compris un zéro franchi, sans prolonger artificiellement le match.

Convention de recette **C17** : écart affiché maximal d’une seconde au retour après 10 minutes d’arrière-plan ; changement manuel de l’horloge système à tester et traiter sans temps négatif incohérent.

### CH-03 — Trois notions distinctes

| Notion | Fonctionnement |
|---|---|
| Temps additionnel ouvert | À zéro, compte croissant +00:01… ; arrêt manuel ; Classique, Custom et option poules Cup |
| Prolongation limitée | Nouvelle phase décomptée, durée connue ; 2 min par défaut pour Cup/Survie ; résultat ou TAB ensuite |
| Golden goal | Premier but supplémentaire gagne ; aucune limite fixée dans la conversation ; compteur croissant proposé C11 |

L’extension Maracana 0–0 est un cas métier distinct de 2 minutes, pas l’additionnel libre du Match classique.

### CH-04 — Début, fin et son final

Lancer affiche immédiatement le live et démarre le jeu. À la vraie fin du match : arrêter le moteur du match, conserver durée et résultat, émettre trois coups de sifflet si les sons sont actifs, puis afficher la transition ou le résumé.

Ne pas émettre le sifflet final à zéro si l’on entre dans l’additionnel, une extension ou un départage. Une fin de période intermédiaire n’est pas une fin de match. Un but décisif, un zéro et un appui manuel presque simultanés ne doivent produire qu’un résultat et une seule progression.

### CH-05 — Fin manuelle

Le bouton reste accessible durant le jeu. Demander une confirmation courte. En cas d’annulation, le temps n’est pas perdu ; proposition : le chrono continue pendant la confirmation (**C03**).

Si le match à élimination est nul, « Terminer » arrête le jeu courant et conduit au départage prévu ; il ne choisit pas de gagnant. Le protocole de fin anticipée de tournoi est une convention distincte (**C10**).

### CH-06 — Cases de fin et validation

- Au temps seul : zéro met fin au temps réglementaire, puis applique l’éventuelle règle d’extension/additionnel/départage du mode.
- Premier à X seul : fin dès que le score cumulé d’une équipe atteint X ; aucun arrêt automatique à une durée masquée.
- Les deux : première condition atteinte, sous réserve du traitement de zéro explicitement configuré.
- Au moins une condition active ; sinon empêcher Lancer et afficher une explication locale (**C06**).
- X est un entier strictement positif. Un objectif de buts impose un score actif.
- Pas de boutons +30 s / +1 min / −30 s pendant le match.

## 7. Scores, résultats et départages — SC

### SC-01 — Saisie

+1 directement sous chaque équipe. Correction dans une commande secondaire accessible ; pas de score négatif. Score absent et commandes masquées si OFF, sans inventer un résultat 0–0 à la fin.

Le score d’un match est cumulé sur ses périodes et sa prolongation. Les tirs au but sont séparés. Les scores saisis ne sont pas attribués à des joueurs.

**C16 — Correction après une fin automatique.** Avant de lancer le match suivant, permettre de corriger le dernier résultat. Si le but qui a atteint X est annulé, restaurer le match à son instant de fin, en pause, puis permettre Reprendre. Recalculer résultat, points et prochaines équipes. Après démarrage d’un match dépendant, ne pas offrir une correction rétroactive qui invalide silencieusement le tableau ; cette édition historique n’est pas requise en V0.

### SC-02 — Classement

Maracana et chaque poule de Cup : victoire 3 points, nul 1, défaite 0.

Ordre validé : **points → confrontation directe → différence de buts → buts marqués → nombre de victoires → ex æquo**.

Afficher au minimum équipe, matchs joués et points ; les détails comprennent V/N/D, buts pour, buts contre et différence. Le classement se met à jour après un résultat finalisé, pas à chaque but live. En Maracana, les points restent bruts : aucune normalisation par match n’a été validée.

La comparaison à plusieurs équipes et l’absence de confrontation sont précisées en **C13**. L’ordre d’affichage stable d’équipes ex æquo ne crée pas un rang sportif différent.

### SC-03 — Nul en élimination

Règle sélectionnée avant tournoi, appliquée automatiquement :

- **TAB directs** : ouvrir la saisie de départage.
- **Prolongation + TAB** : jouer la durée configurée (2 min par défaut). Si un vainqueur se dégage à son terme, il avance ; sinon passer aux TAB. Un but ne termine pas automatiquement une prolongation ordinaire, sauf objectif X encore applicable (**C11**).
- **Golden goal** : premier but supplémentaire = victoire.

La saisie TAB reste minimale en V0 : résultat de séance et vainqueur, sans profils de tireurs ni simulation obligatoire tir par tir (**C11**). Impossible de valider une séance nulle. Exemple : 1–1, TAB 4–3 ; conserver 1–1 comme score de jeu, afficher le vainqueur aux TAB, compter 2 buts de jeu et non 9.

## 8. Prochain match et préparation — PR

### PR-01 — Destinataires

Uniquement Maracana, Cup et Survie. Information visuelle/sonore sur le téléphone de l’organisateur ; aucun envoi aux joueurs. Aucun chrono d’échauffement obligatoire avant le premier match. Employer « Préparez-vous » / « Réactivation », pas une promesse de préparation sportive optimale.

### PR-02 — Paliers issus de la conversation

La durée du **prochain match** détermine l’avance de préparation :

| Durée du prochain match | Prévenir avant la fin prévue du match courant |
|---|---|
| 5–8 min | 3 min |
| 9–12 min | 4 min |
| 13–20 min | 5 min |
| 21–30 min | 7 min |
| 31–45 min | 10 min |
| 46–90 min | 10–15 min, valeur exacte non tranchée |

Rappel à 1 minute : « Vous jouez juste après ». La logique par paliers remplace l’ancienne suggestion de 25 %. Ce sont des règles produit ; le tableau ne constitue pas une recommandation officielle FIFA/UEFA. Aucune attribution officielle n’est à afficher sans source adaptée.

Les durées sous 5 min, au-dessus de 90 min, les adversaires inconnus et le mode buts seul sont couverts par **C18**. Si une fin anticipée aux buts est possible, ne pas promettre une heure exacte : « Ensuite… » ou « Préparez-vous ».

### PR-03 — Affiche inconnue

À 3 équipes en Maracana, l’équipe en attente est connue mais l’adversaire dépend du résultat. Afficher « Ensuite : Verts contre l’équipe qui reste ». En Cup/Survie, utiliser « Vainqueur du match 3 » si nécessaire. Ne pas annoncer une équipe comme qualifiée avant le résultat.

Préparer le bon destinataire sans interrompre le match ni voler la place du chrono. Si une extension change la fin prévue, actualiser le message ; éviter les répétitions sonores inutiles.

## 9. Audio et comportement mobile — AU

Alertes de temps : mi-parcours, puis 3 min, 2 min, 1 min, 30 s, uniquement lorsque ces seuils existent. À la vraie fin : 3 coups de sifflet. Sons désactivables ; le retour visuel reste disponible.

Les annonces et sifflets doivent rester audibles par-dessus la musique externe ; celle-ci continue et n’est pas arrêtée durablement. Pas d’intégration Spotify/Apple Music, de connexion à un compte musical, de lecteur ou de bibliothèque musicale Roundr.

**C19 — Précisions audio.** Sons/voix fournis localement ; pas de synthèse nécessitant Internet. Seuils évalués par période chronométrée ; fusionner deux alertes simultanées (mi-parcours = 3 min, par exemple). Ne pas rejouer en rafale les seuils manqués lors d’un retour d’arrière-plan. Conserver les seuils déjà émis après restauration.

La justesse du chrono après verrouillage est une exigence. L’émission audio exacte écran verrouillé ou application terminée n’est pas établie par la conversation : faire un essai sur les plateformes cibles et documenter les limites réelles. Ne pas assimiler la réussite d’une prévisualisation web à celle d’une build téléphone. Si le socle choisi ne permet pas une exigence, la signaler avant de poursuivre une implémentation qui la masquerait.

## 10. Sauvegarde locale et hors-ligne — OF

**OF-01.** Après installation, accueil, configuration, équipes, matchs, chronos, audio, rotations, classements, tableaux, presets, restauration et génération des cartes fonctionnent sans Internet.

**OF-02.** Sauvegarder la session en cours : configuration, équipes et identifiants, matchs/résultats, scores, état temporel, période, phase, file de rotation, ancienneté terrain, tirage/tableau, qualifications, alertes déjà émises. La restauration retrouve aussi une pause, une transition, une prolongation ou une saisie TAB.

**OF-03.** Toute mutation utile doit être persistée. Une fermeture accidentelle ne doit pas effacer le dernier score validé. Reconstituer le chrono au retour ; si le temps s’est écoulé pendant l’absence, traiter la bonne transition une seule fois. Ne jamais lancer en cascade des matchs suivants sans action de l’organisateur.

**OF-04.** Le partage de la carte utilise le système du téléphone. Sa création et son aperçu restent locaux ; l’envoi effectif via une application tierce dépend de cette application et de sa connexion. Annuler le partage ne modifie aucun résultat.

**C20.** Une seule session active locale ; conserver aussi le dernier résumé terminé jusqu’à son remplacement explicite. Pas de bibliothèque historique complète obligatoire. Si une sauvegarde ne peut pas être lue ou écrite, informer sans annoncer une sauvegarde réussie ; préserver les presets et données encore lisibles.

## 11. Transitions et fins — FI

### FI-01 — Fin de match simple

« Match terminé », score seulement si actif, durée de jeu réelle, puis **Rejouer**, **Nouveau match**, **Retour accueil**, **Partager le résultat**.

Rejouer réutilise configuration et équipes, mais remet à zéro le score et le temps dans une nouvelle session (**C21**). Nouveau match rouvre la configuration. Aucun résultat de démonstration prérempli.

### FI-02 — Entre les matchs

Résultat bref, prochain match, indication « Préparez-vous », **Lancer le prochain match**. En Maracana, préciser qui sort et qui entre. Classement/Tableau en accès secondaire. Aucun compte à rebours ni lancement automatique imposé.

### FI-03 — Fin de session complète

| Mode | Premier niveau | Détails secondaires |
|---|---|---|
| Maracana | Session terminée ; premier(s) du classement et points ; matchs, buts, temps joué | Classement complet, résultats et bilan des équipes |
| Cup | Champion ; finale et score, indication TAB si nécessaire | Tableau final ; podium si petite finale ; résultats, bilan des équipes |
| Survie | Dernière équipe en jeu ; nom du champion | Tableau ; victoires réellement jouées ; podium éventuel, résultats |
| Custom | Session terminée ; temps joué ; périodes ; score si actif | Nouvelle session / preset / partage |

Ex æquo en tête de Maracana : afficher les équipes concernées sans fabriquer un vainqueur unique. Cup/Survie : les équipes éliminées au même tour ne reçoivent pas de classement exhaustif artificiel. Distinguer les places déterminées et les tours atteints.

Définitions proposées (**C21**) : « temps joué » = somme des phases de jeu effectivement chronométrées, additionnel/prolongation inclus, pauses et attente exclus ; « durée de session » = temps entre lancement et fin, pauses comprises ; nombre de matchs = matchs terminés réellement joués, exemptions exclues ; buts = buts de jeu, TAB exclus. Sans score actif, ne pas afficher de total de buts. En Custom interrompu, afficher périodes réellement achevées / prévues.

### FI-04 — Carte de partage

Générer une image Roundr à partir des résultats réels : nom du mode, score ou vainqueur(s), chiffres utiles selon le mode, identité noir/vert. Ne pas inclure de données individuelles inexistantes. Accès au partage système ; solution locale d’enregistrement si nécessaire (**C22**). Aucune publication automatique, aucun réseau social intégré.

## 12. Presets personnels — PS

Custom peut enregistrer un preset nommé localement. Il apparaît dans **Mes chronos** et permet de relancer facilement la même configuration. Un preset contient des réglages, jamais l’état d’un match en cours ni des scores.

Les premières propositions prévoyaient lancement, modification, duplication, renommage et suppression. Elles n’ont pas été explicitement retirées ; conserver une gestion secondaire légère, sans écran complexe. Une copie est indépendante de l’original. La suppression d’un preset ne détruit pas une session déjà lancée à partir de lui (**C23**).

La modification d’un preset n’altère pas rétroactivement la session active. Proposition : mémoriser les noms/couleurs si renseignés ; tous les temps et scores repartent à zéro au lancement (**C23**).

## 13. Données fonctionnelles minimales

Cette section fixe les responsabilités nécessaires, sans imposer une bibliothèque ou une base distante.

| Objet | Informations indispensables |
|---|---|
| Configuration | Mode, durées/périodes, pauses, fin au temps, cible de buts, score, sons, règle de nul, options du tournoi |
| Équipe | Identifiant stable, nom, couleur ; aucun profil joueur |
| Session | Identifiant, configuration figée, état, dates, équipes, match actif, résultats, dernière sauvegarde |
| Match | Équipes ou places à résoudre, phase/tour/poule, statut, score de jeu, résultat TAB distinct, motif de fin, durée jouée |
| État chrono | Phase, état pause/course, temps actif cumulé, instant de référence, durée cible, alertes consommées |
| Rotation Maracana | Équipes sur terrain, attente, ordre stable, présence consécutive, historique des rencontres |
| Tournoi | Poules, ordre des matchs, places qualifiées, tableau et dépendances gagnants/perdants, exemptions |
| Preset | Identifiant, nom, configuration réutilisable |
| Résumé | Données calculées depuis les résultats ; pas de statistiques inventées |

Invariants : aucun match contre soi-même ; une équipe à une seule place du même tour ; score entier non négatif ; résultat traité une seule fois ; aucun perdant ne progresse ; un seul match actif ; durée totale cohérente ; tirage persistant ; pas de gagnant implicite sur un nul éliminatoire.

## 14. Éléments hors V0

### Explicitement reportés ou exclus

- Comptes, authentification, backend/cloud, synchronisation entre téléphones, QR code/lien pour rejoindre.
- Co-organisateurs, capitaines, contrôle distant, notifications sur les téléphones des joueurs.
- Profils, buteurs, passes, MVP, statistiques individuelles, ELO/rating, statistiques historiques de joueurs.
- Smart Team Builder : composition des équipes à partir de joueurs, équilibrage par niveau, postes et historique. Le tirage des équipes déjà créées pour Cup/Survie reste bien en V0.
- Optimisation nombre d’équipes + terrains + temps disponible ; formats Intensif/Équilibré/Long ; adaptation automatique à la fin du créneau.
- Gestion intelligente de la préparation selon historique physique et attente ; le rappel simple par paliers reste en V0.
- Mode « dernière action » jusqu’à sortie du ballon.
- Plusieurs terrains simultanés ; sports autres que le football ; mode Championnat supplémentaire.
- Réseau social, communauté, amis, chat, feed, défis et recherche de parties.
- Intégrations musicales natives Spotify/Apple Music ; la coexistence audio externe reste en V0.
- Paiements, abonnements, réservation de terrains, marketplace et cartes géographiques.

### Non requis pour la V0, sans prétendre à un refus explicite

Logo définitif et logos d’équipes ; statistiques détaillées sur le live ; historique illimité de sessions ; traduction multilingue ; modification rétroactive d’un tournoi déjà avancé ; retrait/remplacement d’une équipe en tournoi ; détection automatique des buts.

Ne pas réintroduire les huit anciens presets Krono, les transitions automatiques ou le score facultatif en tournoi depuis les premiers prompts : ils ont été remplacés par les cinq modes et les règles plus récentes.

## 15. Arbitrages de consolidation et traçabilité

Les identifiants ci-dessous renvoient aux tours de la conversation source, utilisables pour retrouver les décisions.

| Sujet | Source repère | Traitement retenu |
|---|---|---|
| 5 modes et noms | `392ceeb1-9983-4da2-932e-579e94d21cf6` | Classique, Maracana, Cup, Survie, Custom |
| V0 un organisateur, exclusions | `e2f007a4-eb00-45bb-8fcb-994275e6edc4` | Un téléphone, un terrain, local |
| Équipes après temps ; écran unique | `c38d8828-9fdd-4cb5-905a-3ce4621953f8`, `5c2de9b4-d812-4518-b0b9-0fb1351036b4` | Champs dépliés dans configuration |
| Cases indépendantes de fin | `b357a484-b065-47ae-8fb1-9e6f92f1d2be` | Remplace radios / troisième option combinée |
| Maracana et ajout d’équipe | `a9b3c0b1-67a5-4032-8145-2d27d305f8ef` | Règles 3/4+ ; ajout conservé ; algorithme précis proposé |
| Maracana 4+ sans extension | `3af9f037-9770-4a90-8876-0f8a1a0b8bb6` | Nul enregistré directement |
| Cup options explicites | `aa269e22-f9c1-419d-9ae8-979621cf6e80` | Additionnel en poules, croisements, durées par tour conservés |
| Cup écran assisté | `68d5a59c-3bb7-41a6-b884-15a849339acb` | Recommandations 8 et 12 équipes ; options avancées repliées |
| Survie hérite de Cup | `eef44ad6-e75e-49f2-81c0-87daa51e6523` | Élimination seule ; choix des durées signalé |
| Scores/classements | `2a7bb9bb-e881-49d9-b574-89d2a3d07a34`, validation `ed8dc9ee-57f8-473a-a31b-66990eca6aac` | 3/1/0 ; critères complets ; ex æquo |
| Nul éliminatoire | `13196d99-c855-4613-b7a6-0e0fe8540270` | Choix avant tournoi ; 2 min par défaut si prolongation |
| Préparation | `a6f0916b-884c-4dff-9a1b-24c2c3f9883a`, `e4148284-7919-41a8-a85d-53e51386d9a9` | Paliers ; multi-équipes seulement ; pas de module initial imposé |
| Socle chrono | `08e01ba6-fedc-4a40-95f9-015111470f61`, validation `e3761ff2-0688-4c0e-b6ef-3dc46320d2e0` | Pause, horodatages, restauration, musique externe |
| Live | `a109bab1-0738-425c-a0e0-61b213750a30`, validation `de2aa6d3-2737-4ad5-8588-ee419cb062ef` | Composant commun, chrono dominant |
| Custom | `c8acc49d-ad0f-45a5-b879-d51d270719ba`, `b61d7bf4-2cee-487a-9ba7-7d6db24046c6` | Additionnel antérieur + cases buts récentes ; conflit rendu explicite |
| Résultats et partage | `730aeb46-9cfa-4ab5-9902-ea13a6f7d325`, validation `5166c02c-35c4-400a-b3c0-29a8c03f94eb` | Cartes simples dès V0 |

L’historique textuel a été parcouru jusqu’au début. Les anciennes discussions de naming, de coûts, de concurrence et de modèles économiques ne sont pas des règles d’implémentation. Aucune capacité actuelle d’Emergent ni aucun tarif n’est garanti ici. Les images de maquettes générées ne sont pas intégralement exposées dans la lecture textuelle ; la conformité visuelle exacte devra s’appuyer sur celles présentes dans le projet.

## 16. Conventions proposées pour rendre le build déterministe

Ces propositions complètent le cahier des charges ; elles ne constituent pas une validation utilisateur. Les paramètres métier doivent être centralisés pour permettre leur ajustement sans réécriture des écrans.

| ID | Point non totalement tranché | Proposition exploitable |
|---|---|---|
| C01 | Langue initiale | Français uniquement en V0 |
| C02 | Valeurs préremplies | Classique 10 min, 1 période, score ON, additionnel OFF ; multi-équipes 8 min, MA 3 équipes, CU 8, SU 8 ; Custom 30 min/1 période, score ON ; sons ON partout ; petite finale OFF ; nul éliminatoire +2 min puis TAB ; aucune personnalisation obligatoire. Pause classique 5/10/15 min, 15 proposée à 90 min et 5 sinon ; Custom pause 3 min modifiable |
| C03 | Navigation et confirmation | Ouvrir une vue secondaire ou une confirmation n’arrête pas le chrono ; pause seulement explicite. Une session active à la fois ; avertir avant remplacement. Conserver le brouillon en revenant de la configuration |
| C04 | Périodes et additionnel | Périodes intermédiaires arrêtées à zéro ; pause chronométrée ensuite ; à sa fin, attendre « Lancer la période suivante ». Additionnel seulement sur dernière période. Pause de durée zéro conduit directement à l’attente de reprise. Pas de sifflet final intermédiaire |
| C05 | Limites et division Custom | Total entier en minutes >0 ; périodes entières >0 ; chaque période au moins 1 seconde ; pause ≥0 ; X entier >0. Division en secondes, reliquat d’une seconde attribué aux premières périodes. Une modification manuelle doit conserver la somme ; afficher l’écart et bloquer le lancement sinon. Ne pas fixer de plafond commercial arbitraire |
| C06 | Buts seul et extension MA | Si Au temps OFF : chrono de jeu croissant, pas d’expiration ni de prolongation 0–0 ; durée/périodes masquées, Custom limité à une période dans ce sous-format. Pour MA3 0–0 au temps : extension unique de 2 min à but décisif, même si X>1 ; afficher cette règle avant lancement. Autres formats : additionnel ouvert possible seulement avec Au temps ON |
| C07 | Nul avec même ancienneté | Premier nul MA3 avec entrées simultanées : sort l’équipe au plus petit ordre initial. Ordre persisté, affichage de l’équipe sortante ; aucune loterie à chaque restauration |
| C08 | Rotation MA4+ | Exclure les deux sortantes. Parmi les équipes en attente, choisir la paire qui minimise d’abord la somme des matchs joués, puis la confrontation la moins répétée, puis l’attente la plus ancienne, puis l’ordre initial. À 4 équipes, accepter l’alternance AB/CD imposée par la sortie des deux ; varier les adversaires nécessiterait une autre règle |
| C09 | Ajout en Maracana | Ajouter uniquement à la transition, avant génération définitive du match suivant. Préserver le résultat précédent, initialiser à zéro et intégrer à l’attente. Lors du passage 3→4, appliquer la rotation 4+ dès le prochain match : les deux dernières équipes sortent. Pas d’ajout au-delà de 8 |
| C10 | Fin de session | MA s’arrête depuis la transition sur demande ; pas de créneau global. Pour arrêter en plein jeu, finaliser d’abord le match. Cup/Survie : sortie anticipée possible avec mention « Tournoi interrompu », aucun champion inventé ; conserver les résultats réels |
| C11 | Départage | TAB : saisir deux nombres entiers non négatifs et distincts, confirmer ; pas de nombre de tirs réglementaire imposé. Golden goal : compteur croissant sans limite, +1 décisif. En prolongation ordinaire, objectif X toujours actif ; sinon jouer jusqu’au terme. Une fin manuelle à égalité conserve l’obligation de départager |
| C12 | Recommandation Cup générale | Conserver 8 et 12 comme exemples prioritaires. Pour les autres N de 4 à 32, sélectionner un nombre de poules puissance de 2, au moins 2 équipes par poule, tailles équilibrées, taille moyenne la plus proche de 4 ; égalité résolue vers le plus petit nombre de poules. Proposer 2 qualifiés/poule. Exemples : 4→1×4 ; 6→2×3 ; 16→4×4 ; 32→8×4. Poules modifiables entre 1 et floor(N/2), tailles différant d’au plus 1. Qualifiés par poule ≤ taille de la plus petite poule ; total final puissance de 2 entre 2 et 32, ou complément annoncé de meilleurs suivants. Refuser toute configuration impossible avec explication. Calendrier par rondes de poules, en alternant les poules, sans match contre soi-même |
| C13 | Confrontations directes | Pour les équipes à égalité de points, calculer les points gagnés entre elles. Si leur mini-groupe est incomplet ou les nombres de rencontres entre paires inégaux, ignorer ce critère. Puis différence générale, buts généraux, victoires générales. Pour trois équipes ou plus, une seule comparaison du mini-groupe initial, sans recalcul récursif. Si égalité parfaite, ex æquo |
| C14 | Qualification ex æquo / meilleurs suivants | Entre poules de même taille : points, différence, buts, victoires ; pas de confrontation inexistante. Si tailles différentes, comparer points/match, différence/match, buts/match, victoires/match, avant ex æquo. Si égalité à la coupure, demander à l’organisateur de désigner le(s) qualifié(s) parmi les ex æquo ; tracer ce choix, sans modifier leur classement. Aucun choix silencieux par identifiant |
| C15 | Tableau Cup et durées | Définir les croisements par places de qualification avant lancement ; recommandation A1/B2, B1/A2 à 8. Autres formats : ordonner les places par rang de poule, puis lettre de poule, ajouter les meilleurs suivants ; apparier les extrêmes ; permettre la modification manuelle. Ne pas promettre d’éviter toutes les retrouvailles. Durées par tour conservées en Cup et proposées conservées en Survie ; petite finale à durée demi-finale ; petite finale avant finale, indisponible sans deux demi-finales jouées |
| C16 | Correction et finalisation | Correction du dernier match avant le suivant ; recalcul atomique des agrégats et de la suite. Annulation d’un but décisif : retour en pause au temps de fin sauvegardé. Pas de réédition d’anciens matchs dont les dépendances sont déjà jouées |
| C17 | Fiabilité temporelle | Tolérance de recette ≤1 s sur l’affichage ; sauvegarde aux changements d’état et de score ; vérifier arrière-plan, verrouillage, fermeture et horloge système sur téléphone |
| C18 | Paliers incomplets | 1–4 min : alerte à min(2 min, durée disponible), donc parfois dès le début ; 46–90 min : 15 min ; >90 : 15 min. Si le seuil dépasse le temps du match courant, prévenir dès que le prochain participant est connu. Buts seul : afficher « Ensuite / Préparez-vous » sans délai annoncé ni rappel chronométré. Rappel 1 min uniquement si échéance temporelle connue |
| C19 | Audio précis | Alertes locales par période, seuils dédupliqués, pas de rafale au retour ; priorité à l’état actuel et au sifflet final si pertinent. Pas de garantie sonore après fermeture forcée sans preuve sur la plateforme |
| C20 | Conservation locale | Une session active + dernier résumé ; presets séparés. Signaler une erreur de sauvegarde, ne pas effacer une sauvegarde lisible pour en créer une vide |
| C21 | Résumés et rejouer | Temps joué hors pauses/attente ; TAB exclus des buts ; exemptions exclues des matchs/victoires. Rejouer crée une nouvelle session avec mêmes paramètres/équipes et compteurs remis à zéro |
| C22 | Carte partageable | Image PNG locale en format portrait ; texte et chiffres adaptés au mode ; aperçu, partage système et enregistrement local si nécessaire. Aucune publication automatique |
| C23 | Gestion presets | Lancer, modifier, renommer, dupliquer, supprimer ; copies indépendantes ; une session lancée garde sa copie de configuration ; noms/couleurs conservés si renseignés |

**Points les plus sensibles à confirmer avant recette finale : C04, C06, C08, C12–C15.** Ils touchent aux règles sportives ou au planning. Ils peuvent être implémentés comme profil proposé pour rendre le prototype testable, mais doivent rester explicitement identifiés dans le bilan Emergent.

## 17. Critères d’acceptation et scénarios de recette

Les scénarios marqués C testent le profil proposé, pas une décision historique. Les autres testent le périmètre validé. Chaque résultat doit être noté : réussi, échoué ou non testé, avec appareil/version pour les tests mobiles.

| ID | Scénario | Résultat attendu |
|---|---|---|
| AC01 | Ouvrir l’app, choisir Classique, garder paramètres rapides, lancer | Live en 3–5 actions et moins de 30 s ; pas de compte ni écran d’explication |
| AC02 | Activer Ajouter les équipes | Noms/couleurs apparaissent dans le même écran ; OFF utilise les noms génériques |
| AC03 | Classique 90 min, 2 périodes | 45 + pause + 45, score cumulé, pas 90 min par période |
| AC04 | Classique 45 min, 2 périodes | Chaque période vaut 22:30 |
| AC05 | Mettre pause à 06:42, attendre 20 s, reprendre | Reprise à 06:42, aucun temps joué pendant la pause |
| AC06 | Classique additionnel OFF, fin dernière période | Arrêt à zéro, trois sifflets si ON, résultat enregistré une fois |
| AC07 | Classique additionnel ON | À zéro, +00:01… sans sifflet final ; arrêt manuel confirmé puis trois sifflets |
| AC08 | Annuler Fin du match | Retour au match avec temps cohérent, aucun résultat créé |
| AC09 | Score OFF | Aucun +1, aucun score de résultat inventé ; chrono fonctionnel |
| AC10 | Corriger un score de 0 | Impossible de passer sous zéro |
| AC11 | 8 min ET premier à 3 ; score passe de 2–1 à 3–1 à 04:20 de jeu | Fin immédiate, durée réelle 04:20 ; pas d’attente du zéro |
| AC12 | Même format, 2–1 au terme | Fin au temps ; résultat 2–1 |
| AC13 | Décocher les deux règles (C06) | Lancer bloqué, message local clair |
| AC14 | Buts seul, laisser passer la durée auparavant sélectionnée (C06) | Aucune fin fantôme ; compteur croissant jusqu’à X |
| AC15 | Custom score OFF puis objectif X actif (C06) | Score activé/requis ; impossible de lancer un objectif sans saisie score |
| AC16 | MA3 : A bat B, C attend | A reste ; B sort ; C entre ; prochain match A–C |
| AC17 | MA3 : A déjà présent, C nouvel entrant, match nul 1–1 | A sort ; C reste ; équipe en attente entre |
| AC18 | MA3 : 0–0 au terme | Extension 2 min une seule fois ; 0–0 à son terme = nul et rotation |
| AC19 | But pendant extension MA3 (C06) | Fin immédiate ; pas de seconde extension |
| AC20 | MA4/5/7/8 : match nul | Deux sortantes exclues de l’affiche suivante, pas de prolongation, pas d’équipe dupliquée |
| AC21 | Plusieurs rotations MA5 et MA7 (C08) | Toujours deux équipes en attente choisies selon l’ordre déterministe ; mêmes choix après restauration |
| AC22 | Ajouter la quatrième équipe à une transition (C09) | Résultats conservés, nouvelle équipe à 0 ; prochaine rotation suit MA4+ |
| AC23 | Ajouter une neuvième équipe | Ajout refusé ; session existante inchangée |
| AC24 | MA : une victoire, un nul, une défaite pour A | 4 points, 3 matchs ; classement appliqué dans l’ordre validé |
| AC25 | Trois équipes parfaitement ex æquo (C13) | Ex æquo affichés ; pas de faux départage alphabétique |
| AC26 | Cup 8 équipes recommandé | 2×4 ; 12 matchs de poule en aller simple ; 4 qualifiés ; 2 demies + finale |
| AC27 | Cup 8, aller-retour | 24 matchs de poule, chaque paire exactement deux fois |
| AC28 | Cup 12 recommandé (C12/C14) | 3×4 ; 18 matchs de poule ; 6 directs + 2 meilleurs troisièmes ; 7 matchs éliminatoires hors petite finale |
| AC29 | Cup poule nulle à zéro, additionnel OFF | 1 point à chaque équipe ; aucun TAB |
| AC30 | Cup poules additionnel ON | Compte positif à zéro ; nul admis à fin manuelle ; objectif X prioritaire s’il est atteint |
| AC31 | Cup : égalité parfaite pour dernière place qualifiée (C14) | Choix explicite parmi ex æquo ; aucun qualifié arbitraire ; tableau ensuite cohérent |
| AC32 | Cup : configuration de qualification impossible (C12) | Explication avant lancement, aucun tableau incomplet généré |
| AC33 | Cup : croisement A1–B2 / B1–A2 | Bonnes équipes affectées une fois les rangs connus |
| AC34 | Élimination : nul, règle +2 min puis TAB | Prolongation 2 min ; si toujours nul, attente TAB ; pas d’avancement prématuré |
| AC35 | Élimination : 1–1, TAB 4–3 (C11) | A avance ; résultat distingue jeu et TAB ; total buts de jeu =2 |
| AC36 | Golden goal | Premier +1 supplémentaire clôt le match et fait avancer le vainqueur une seule fois |
| AC37 | Survie N=2/3/10/32 | N−1 matchs joués hors petite finale ; 10 équipes =6 exemptions ; jamais de match contre une place vide |
| AC38 | Petite finale ON avec 8 équipes | Deux perdants des demies s’affrontent ; aucun impact sur les places de finale |
| AC39 | Survie 2 équipes, option petite finale (C15) | Option indisponible ; un seul match, un champion |
| AC40 | Custom 36 min/3 périodes, puis 10+10+16 | Total 36 min de jeu ; pauses exclues ; trois périodes cohérentes |
| AC41 | Custom somme 35 min pour total 36 (C05) | Erreur visible, lancement bloqué |
| AC42 | Sauvegarder, dupliquer, modifier un preset (C23) | Persistance locale ; copie indépendante ; aucun score hérité |
| AC43 | Prochain match 8 min, match courant arrive à 3 min restantes | Préparez-vous ; rappel à 1 min ; aucun nouvel écran bloquant |
| AC44 | MA3 / adversaire futur inconnu | Message avec équipe en attente ou place du vainqueur ; aucune fausse affiche certaine |
| AC45 | Objectif de buts atteint avant alerte prévue | Transition correcte ; aucune alerte périmée après fin |
| AC46 | Sons OFF | Aucune annonce/sifflet ; mêmes états et messages visuels |
| AC47 | Musique externe active sur téléphone | Musique non interrompue durablement ; annonces audibles ; noter résultat par plateforme |
| AC48 | Arrière-plan 10 min, puis retour (C17) | Chrono reconstitué à ≤1 s ; si fini, une seule fin et aucun prochain match lancé seul |
| AC49 | Fermer et rouvrir pendant pause/transition/prolongation/TAB | État et score restaurés ; pas de nouveau tirage ni doublon de points |
| AC50 | Mode avion du lancement au résumé | Configuration, audio, jeu, rotations, résultats, presets et carte fonctionnels |
| AC51 | But décisif et zéro quasi simultanés | Un seul résultat, un seul sifflet final, une seule progression |
| AC52 | Annuler le dernier but décisif avant match suivant (C16) | Résultat corrigé, points recalculés, match restauré en pause au temps exact |
| AC53 | Partager puis annuler | Carte conforme aux données ; annulation sans changement de résultat |
| AC54 | Résumé avec exemptions et TAB | Ni exemptions comptées comme matchs/victoires jouées, ni TAB additionnés aux buts |
| AC55 | Rejouer (C21) | Même configuration, nouvelle session, compteurs zéro |
| AC56 | Tournoi interrompu (C10) | Mention Interrompu ; aucun champion fictif |
| AC57 | Installation sans ancien réseau puis usage offline | Après installation complète, aucun écran dépendant d’un serveur ou d’une police distante |
| AC58 | 5–10 sessions avec utilisateurs terrain | Compréhension sans explication, création rapide, relevé des incidents et volonté de réutilisation |

### Porte de sortie V0

Tous les parcours V fonctionnent de bout en bout ; aucun défaut de temps, perte de score, rotation invalide ou qualification incorrecte connu. Les conventions sensibles sont confirmées ou révisées. Les tests sur téléphone sont distincts des tests automatiques et les limites audio sont documentées. La validation terrain porte sur l’usage réel, pas seulement sur l’apparence des écrans.

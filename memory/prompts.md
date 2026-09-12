# ROUNDR V0 — Prompts Emergent séquencés

Version 1.0 — 12 septembre 2026.

## Comment les utiliser

Joindre d’abord **ROUNDR_V0_Cahier_des_charges.md** au projet Emergent existant. Envoyer le prompt 00, puis un seul prompt à la fois, dans l’ordre. Chaque étape doit livrer une modification fonctionnelle vérifiée avant de passer à la suivante. Ne pas coller tous les prompts dans une même demande de génération.

Les références §, AC et C renvoient au cahier des charges. Les prompts sont courts parce que ce document reste la source complète des règles. Si Emergent perd ce contexte, joindre à nouveau le cahier des charges avant de continuer.

**Statut des conventions :** les C sont des propositions identifiées, pas des décisions déjà validées dans la conversation. Le profil proposé permet d’obtenir un prototype testable. Il doit être recensé dans un registre de décisions et confirmé ou ajusté avant validation produit finale. Ne pas laisser Emergent inventer d’autres règles silencieusement.

| Étape | Livrable | Dépend de |
|---|---|---|
| 00 | Audit de l’existant et registre des écarts | Cahier des charges |
| 01 | Accueil et composants visuels | 00 |
| 02 | Moteur de temps et état de session | 00 |
| 03 | Sauvegarde et restauration | 02 |
| 04 | Match classique complet | 01–03 |
| 05 | Audio et premier essai mobile | 04 |
| 06 | Conditions de fin et score robuste | 04 |
| 07 | Custom et presets | 06 |
| 08 | Classements communs | 06 |
| 09 | Maracana | 08 |
| 10 | Élimination, TAB et Survie | 06 |
| 11 | Cup : configuration et poules | 08, 10 |
| 12 | Cup : qualification et phases finales | 11 |
| 13 | Préparation dynamique et transitions | 09, 10, 12 |
| 14 | Résumés et partage | 07, 13 |
| 15 | Recette complète et build terrain | Toutes |

## Prompt 00 — Auditer le projet existant

```text
Nous poursuivons le projet existant sous le nom Roundr. Lis le fichier joint ROUNDR_V0_Cahier_des_charges.md avant toute modification. Il remplace les anciens prompts Krono lorsqu’ils se contredisent.

Inspecte les écrans, le moteur chrono, les données et la cible mobile actuels. Identifie ce qui peut être conservé, ce qui contredit la spécification et ce qui manque. Préserve les parties satisfaisantes. Ne reconstruis pas l’application entière.

Produis un plan de modifications correspondant aux étapes 01–15 et un registre séparant règles validées V, conventions proposées C et rectifications R. Pour le prototype, utilise le profil C du §16 en le signalant comme provisoire ; n’invente aucune autre règle sportive.

La V0 fonctionne localement, sans compte, backend, cloud ni service payant requis à l’usage. Vérifie que la cible existante permet une build téléphone et l’usage hors ligne. Si ce point bloque, explique précisément le problème avant toute migration. Ne publie rien et n’ajoute aucune fonctionnalité de roadmap.
```

**Sortie attendue :** état des lieux précis, architecture existante reconnue, écarts et conventions listés. Aucune réécriture aveugle.

## Prompt 01 — Accueil et composants de terrain

```text
Implémente uniquement le socle visuel Roundr selon les §2 et 4 du cahier des charges. Conserve la direction validée : noir, anthracite, vert néon, grands chiffres et grandes cibles tactiles. Réutilise les maquettes disponibles dans le projet ; n’invente pas une nouvelle identité.

Accueil : cinq cartes, Match classique dominant puis Maracana, Cup, Survie, Custom ; Mes chronos ; reprise conditionnelle d’une session active. Chaque carte mène directement à une configuration unique avec options dépliables sur place. Prépare les composants communs : durée, cases de fin indépendantes, noms/couleurs, CTA, live, transition.

Pas de compte, tutoriel obligatoire, écran d’explication intermédiaire ni statistiques sur le live. Ne simule pas de résultats comme s’ils étaient réels. Les fonctions encore absentes doivent être identifiées dans ton bilan.

Vérifie sur petit écran la hiérarchie et les zones tactiles. Rapporte les composants modifiés et les écarts restants.
```

**Sortie attendue :** navigation cohérente, base des configurations et du live, sans annoncer que les modes sont déjà fonctionnels.

## Prompt 02 — Moteur chrono commun

```text
Implémente le moteur partagé décrit aux §6 et 13. Un seul état de session et de chrono alimente tous les écrans. Le temps se calcule à partir d’instants et de temps actif cumulé, jamais en comptant les rafraîchissements de l’interface.

Gère prêt, jeu, pause/reprise, fin de période, pause entre périodes, attente de reprise, additionnel ouvert, fin de match et transition. Prépare les états prolongation, golden goal et TAB sans implémenter encore les tournois. Suis C04 pour le comportement provisoire des périodes.

Une fin ne doit s’exécuter qu’une fois, même si zéro et action utilisateur arrivent ensemble. Le prochain match ne démarre jamais tout seul. Distingue durée de jeu et pauses.

Teste pause/reprise, franchissement de zéro, additionnel et retour d’une longue absence simulée. Utilise une horloge contrôlable dans les tests pour éviter d’attendre plusieurs minutes. Donne les résultats réels des tests et les limites restantes.
```

**Sortie attendue :** moteur indépendant des écrans, base de AC05–08 et AC51 vérifiée.

## Prompt 03 — Sauvegarde et restauration locales

```text
Ajoute la persistance locale selon le §10, les objets du §13 et C20. Sauvegarde chaque changement utile de configuration, score, phase et chrono. Prépare la conservation des rotations, tirages et alertes sans dépendance serveur.

Au retour après fermeture, restaure le bon état. Si le chrono tournait, reconstitue le temps ; s’il était en pause, conserve la pause. Si zéro a été dépassé, traite la fin une fois et attends l’organisateur pour la suite. N’efface jamais silencieusement une sauvegarde illisible ou une session existante.

Branche Reprendre la session sur l’accueil. Sépare presets et session active. Signale une erreur de sauvegarde au lieu d’afficher un faux succès.

Vérifie AC48–50 pour les états déjà implémentés, ainsi que fermeture immédiate après une saisie de score. Indique séparément tests simulés et tests réellement faits sur téléphone.
```

**Sortie attendue :** reprise fiable dès le début du build ; tests tournoi encore non applicables explicitement notés.

## Prompt 04 — Match classique de bout en bout

```text
Construis le mode Match classique selon le §5.1 et les §4, 6, 7 et 11. Une seule configuration : 10/30/45/90 min ou durée personnalisée, 1 ou 2 périodes, pause conditionnelle, additionnel, score, sons et équipes facultatives.

La durée est totale hors pause : 45 min en deux périodes = 22:30 + pause + 22:30. Pas d’échauffement ni de premier à X buts dans ce mode. Lancer démarre directement le live commun. Affiche +1 et correction secondaire si score actif. Confirme la fin manuelle.

Fin : résultat réel, durée jouée, Rejouer, Nouveau match, Accueil. Rejouer crée une session neuve. Applique C02–C04 et C21 en les conservant comme conventions proposées.

Vérifie AC01–10 et AC55. Ne passe pas aux autres modes tant que création, jeu, pause, restauration et fin ne fonctionnent pas ensemble.
```

**Sortie attendue :** premier parcours réellement jouable, pas seulement une maquette.

## Prompt 05 — Sons et validation mobile précoce

```text
Implémente l’audio local des §6 et 9 : mi-parcours, 3/2/1 min, 30 s, et trois coups de sifflet à la vraie fin. Sons OFF supprime tous les sons mais conserve les états visuels. Respecte C19 : seuils dédupliqués, aucune rafale au retour d’arrière-plan, pas de sifflet final au début de l’additionnel.

Les annonces doivent coexister avec la musique externe, sans intégrer Spotify/Apple Music ni arrêter durablement la lecture. Aucun son ou service vocal ne doit nécessiter Internet.

Prépare un premier essai sur téléphone : musique active, mode avion, arrière-plan, écran verrouillé, retour dans l’app. Vérifie AC46–48 et AC50 sur les fonctions existantes. Si tu ne peux pas tester un appareil, marque NON TESTÉ et fournis le protocole exact. Ne garantis pas l’audio après fermeture forcée sans preuve.
```

**Sortie attendue :** audio fonctionnel et première détection des limites mobiles, avant les moteurs complexes.

## Prompt 06 — Conditions de fin et correction des scores

```text
Construis les règles partagées Au temps / Premier à X buts du §6, règle CH-06, pour Maracana, Cup, Survie et Custom. Deux cases indépendantes, au moins une active. Si objectif actif : X entier positif et score obligatoire. Les deux conditions peuvent être actives ; traite une seule fin. Préserve les exceptions explicites d’additionnel et de départage.

Applique C06 au mode buts seul : compteur croissant, aucune expiration cachée. Prépare une correction du dernier résultat avant le match suivant selon C16. Annuler un but décisif doit restaurer le match en pause au bon instant ; aucune duplication de résultat.

Ne change pas la configuration du Match classique. Teste AC10–15, AC51 et AC52 au niveau du moteur. Distingue un résultat de jeu d’un futur résultat TAB. Donne le bilan et les conventions utilisées.
```

**Sortie attendue :** logique de fin testée avant son utilisation dans les rotations et tableaux.

## Prompt 07 — Custom et Mes chronos

```text
Implémente Custom selon les §5.5 et 12 : durée totale, 1/2/3/4+ périodes, division automatique ou durées personnalisées, pauses, conditions de fin, additionnel, score, équipes facultatives, sons et sauvegarde nommée.

36 min en 3 périodes propose 12/12/12 et accepte 10/10/16. Les pauses sont exclues du total. Respecte C04–C06 pour les arrondis, validations, périodes et buts seul. Aucun moteur de tournoi ou préparation dans Custom.

Mes chronos permet lancement, modification, renommage, duplication indépendante et suppression selon C23. Un preset ne contient aucun score ni état actif. Modifier un preset n’altère pas une session lancée.

Teste AC15, AC40–42, restauration d’un Custom en deuxième période et lancement d’un preset en mode avion. Rapporte ce qui est réellement vérifié.
```

**Sortie attendue :** Custom complet et presets locaux réutilisables.

## Prompt 08 — Résultats et classements partagés

```text
Implémente le calcul des classements du §7.2 pour Maracana et Cup : victoire 3, nul 1, défaite 0 ; points, confrontation directe, différence de buts, buts marqués, victoires, puis ex æquo.

Applique C13 pour les mini-groupes et confrontations incomplètes. Affiche les véritables ex æquo, même si un ordre stable est utilisé à l’écran. Recalcule depuis les résultats finalisés, pas depuis les buts live. Les corrections ne doivent pas additionner deux fois les points. Sépare les résultats TAB et les buts de jeu.

Construis une vue secondaire lisible avec équipe, matchs, points et détail V/N/D, BP, BC, différence. Ne la place pas sur le live principal.

Teste AC24–25, des égalités à deux et trois équipes, plusieurs confrontations et un résultat corrigé. Fournis les exemples et résultats attendus/observés.
```

**Sortie attendue :** classement déterministe, réutilisable et vérifié indépendamment de Cup.

## Prompt 09 — Maracana

```text
Implémente Maracana selon le §5.2 : 3–8 équipes, score obligatoire, durée commune, fin au temps et/ou X buts, noms/couleurs optionnels, transition manuelle.

À trois : gagnant reste, perdant sort ; nul = plus ancienne présence consécutive sort ; 0–0 au temps = une extension de 2 min. Applique les conventions identifiées C06–C07 pour le but décisif et l’égalité d’ancienneté initiale.

À quatre ou plus : les deux sortantes sont exclues du prochain match ; nul sans extension. Utilise C08 pour choisir la paire suivante. Ajoute une équipe à la transition jusqu’à 8 selon C09, sans perdre les résultats. Arrêt de session selon C10.

Branche classements, sauvegarde de la rotation et affiche suivante, sans adversaire inventé à trois équipes. Teste AC16–24, notamment 3→4 équipes et restauration. Ne prétends pas optimiser un créneau disponible.
```

**Sortie attendue :** rotation complète et continue, règles proposées clairement répertoriées.

## Prompt 10 — Élimination, TAB et Survie

```text
Implémente le moteur éliminatoire commun puis Survie (§5.4 et §7.3) : 2–32 équipes, tirage manuel/aléatoire persistant, exemptions, gagnants vers le tour suivant, petite finale optionnelle et durées par tour selon C15.

Corrige l’ancien exemple : 10 équipes signifie 6 exemptions dans un tableau de 16, puis 2 matchs préliminaires. Une exemption ne compte ni comme match joué ni comme victoire jouée.

En cas de nul : TAB directs, prolongation configurable (2 min par défaut) puis TAB, ou golden goal. Respecte C11, saisie TAB distincte du score de jeu et aucune qualification avant départage. Survie est une élimination directe, jamais un mode gagnant-reste.

Teste AC34–39 et AC51 sur 2, 3, 10 et 32 équipes. Vérifie restauration pendant prolongation/TAB et absence de double avancement. Ne construis pas encore les poules Cup.
```

**Sortie attendue :** tournoi Survie complet ; moteur réutilisable par Cup.

## Prompt 11 — Cup : configuration et poules

```text
Implémente les configurations et poules de Cup selon §5.3 CU-01 à CU-03 et C12. Un écran : 4–32 équipes, durée, cases de fin, nombre de poules recommandé mais modifiable, aller simple/retour, qualification proposée, équipes et options avancées.

Conserve l’additionnel ouvert optionnel en poules, demandé explicitement dans le cadrage ; OFF par défaut. Avec objectif X actif, un but atteignant X termine le match, même pendant l’additionnel. Le nul de poule ne déclenche pas de TAB.

Génère chaque confrontation une fois en aller simple et deux fois en aller-retour, sur un terrain. Persiste l’ordre. Branche résultats et classements par poule, en préparant les places de qualification sans les résoudre prématurément.

Teste AC26–30 pour la partie poules, AC32 et les répartitions non divisibles. Vérifie 8 et 12 équipes ainsi que 5, 7 et 32. Note la recommandation générale C12 comme proposée.
```

**Sortie attendue :** poules jouables, pas de phase finale fictive.

## Prompt 12 — Cup : qualifications et finale

```text
Termine Cup selon CU-04 à CU-07 et C13–C15. Résous les places qualifiées seulement lorsque les matchs de poule requis sont finalisés. Pour 8 équipes : A1–B2 et B1–A2 par défaut. Pour 12 : 6 directs plus 2 meilleurs troisièmes vers les quarts.

Une égalité parfaite à la coupure nécessite le choix explicite de l’organisateur parmi les ex æquo ; elle ne devient pas un classement inventé. Les croisements restent modifiables avant tournoi, sans doublon de place. Branche les durées par tour, la petite finale et le moteur éliminatoire existant.

Affiche une transition simple entre poules et phase finale. Teste AC28 et AC31–38 de bout en bout, dont une égalité de qualification, un nul en finale et une correction avant le match dépendant. Vérifie sauvegarde/restauration au changement de phase et aucune double qualification.
```

**Sortie attendue :** Cup complète jusqu’au champion, sans cas de qualification silencieusement arbitraire.

## Prompt 13 — Préparation et transitions communes

```text
Ajoute la préparation dynamique des §8 et 11 : uniquement Maracana/Cup/Survie, sur le téléphone organisateur. Utilise les paliers de durée du prochain match et C18 pour les plages incomplètes. Rappel à une minute si fin temporelle connue. Aucune préparation obligatoire avant le premier match.

Affiche correctement les adversaires encore inconnus. À trois en Maracana : équipe en attente contre l’équipe qui reste. En buts seul, aucun faux délai exact. Annule les alertes périmées lorsqu’un match finit avant le temps prévu.

Harmonise les transitions : score final, qui sort/entre si pertinent, prochaine affiche, Lancer le prochain match, lien secondaire Classement/Tableau. Aucun démarrage automatique.

Teste AC43–45 et les seuils avec un prochain tour plus long. Vérifie que préparation, correction ou consultation du tableau n’altèrent pas le temps actif. Garde le chrono dominant.
```

**Sortie attendue :** enchaînements lisibles, sans fausse promesse sur l’heure du prochain match.

## Prompt 14 — Résumés et cartes de partage

```text
Finalise les résumés et le partage selon §11 et C21–C22. Classique : score si actif, durée, Rejouer/Nouveau match/Accueil. Maracana : premier(s), points, matchs, buts et temps joué. Cup/Survie : champion, finale, tableau et podium si réel. Custom : durée, périodes, score si actif.

Calcule les chiffres depuis les données : pauses hors temps joué, TAB hors buts, exemptions hors matchs et victoires jouées. Ne force pas un champion si session interrompue ou un vainqueur unique si Maracana ex æquo.

Génère une carte PNG locale noir/vert avec aperçu et partage système. Pas de backend, lien public ni publication automatique. Annuler le partage ne change aucun résultat.

Teste AC53–56, score OFF, noms longs et grands scores. Vérifie génération en mode avion et carte conforme au résumé. Rapporte les résultats réellement observés.
```

**Sortie attendue :** fin de chaque mode cohérente, résultat exportable localement.

## Prompt 15 — Recette finale et version terrain

```text
Exécute la recette du §17 du cahier des charges Roundr V0. Utilise les tests déjà écrits ; complète seulement les cas métier ou mobiles encore non couverts. Corrige les défauts bloquants sans ajouter de fonctionnalités.

Produis une matrice AC01–AC58 : réussi, échoué ou non testé, preuve et appareil si pertinent. Ne marque pas les tests téléphone comme réussis à partir d’une simulation. Vérifie particulièrement temps, restauration, rotation 3/4/7 équipes, Cup 12 et qualification ex æquo, Survie 10, score décisif corrigé, audio avec musique, verrouillage et mode avion.

Livre une build installable pour test privé ou les instructions exactes pour la produire, sans publication publique. Recense les conventions C encore non confirmées, les limitations et les bugs restants. La V0 n’est pas déclarée validée avant arbitrage des conventions sensibles et 5–10 sessions terrain.

Fournis enfin un protocole terrain court : temps de création, compréhension du live, incidents, perte de données, enchaînements et intention de réutiliser l’app. Aucun faux résultat de test utilisateur.
```

**Sortie attendue :** version testable, couverture de recette transparente et liste précise des derniers points à trancher.

## Prompt de correction ciblée — À réutiliser si une étape échoue

```text
Corrige uniquement le problème suivant dans Roundr : [décrire le défaut observé].

Référence : [règle du cahier des charges et critère AC].
Reproduction : [configuration, actions, état constaté].
Résultat attendu : [comportement exact].

Identifie la cause, corrige-la au bon niveau partagé et vérifie le scénario de reproduction ainsi que les cas directement affectés. Préserve les règles des autres modes. N’ajoute pas de nouvelle fonctionnalité et ne refais pas les écrans sans nécessité. Termine par : correction apportée, vérifications réellement faites, éventuelles limites.
```

## Contrôle avant de passer à l’étape suivante

L’étape doit être utilisable, les règles citées respectées et les tests ciblés réussis. Une belle capture d’écran ne prouve ni la sauvegarde, ni le chrono en arrière-plan, ni les qualifications. Conserver les points non testés dans le bilan ; ne pas les oublier lors de l’étape 15.

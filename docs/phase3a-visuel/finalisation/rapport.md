# Roundr — Finalisation Phase 3A / PR #9

La direction visuelle validée est conservée. Complément depuis 8110eec9678dc10067f15ff502e959b9d64c24d5, sur codex/roundr-lovable-phase-3a, vers codex/roundr-lovable-phase-2b. Référence Lovable : 1c59720dc5b180d5b1bacfaf935902b4053895fa. Aucune fusion, aucune Phase 3B, aucun build payant.

## Corrections limitées

- Les trois annonces de rotation restent entièrement lisibles en paysage : suppression de l’ellipse dans cette orientation et ordre de superposition du libellé « Reste ». Le texte peut dépasser dans les espacements, comme dans Lovable. Police, corps, couleurs, cartes et maillots conservés.
- Une marge technique de 1 px sur la largeur totale mesurée évite qu’un arrondi de LayoutEvent fasse passer une carte sur la ligne suivante. Écart par carte inférieur ou égal à 0,5 px. Les trois colonnes et la grille de quatre cartes en deux rangées restent en place ; hauteurs conservées. Aucun changement des styles portrait.
- L’appel Relancer est extrait dans une fonction testable, sans changer la boîte native/web ni les callbacks. Aucune mutation avant la réponse affirmative. Aucun changement des moteurs, règles, configurations ou stockage.

## Relancer : portée exacte des vérifications

La nouvelle suite exécute le véritable adaptateur Alert de Roundr, avec seulement sa frontière système simulée dans le test. Pour Classique et Maracana, chemins web/iOS/Android : Annuler conserve la même session, le score, la période, le chrono, le mode restant/écoulé et les octets sauvegardés ; rechargement identique. Le Classique est testé dans sa deuxième mi-temps. Confirmer réinitialise une fois le même match, score 0–0, première période prête, chrono arrêté ; équipes, matchs et rotation conservés ; rechargement vérifié.

Ce test ne remplace pas une manipulation de la boîte réelle. Essais réels : navigateur intégré, puis Chrome ; ouverture réelle de Relancer sur un match en pause à 1–0. Chrome a bien exposé un dialogue de type confirm. L’outil a ensuite bloqué sur Input.dispatchMouseEvent / Emulation.setFocusEmulationEnabled lors de sa fermeture ; le résultat après Annuler n’a pas pu être relu et le parcours Confirmer n’a pas pu être achevé. La tentative par le contrôle Windows n’a pas permis une observation stable de la fenêtre. **Annuler et Confirmer dans les boîtes réelles restent à valider sur téléphone.** Aucune boîte de production n’a été remplacée par une imitation pour déclarer cet essai réussi.

## Interactions effectivement réalisées

Un laboratoire isolé utilise les composants et le store réels avec Date.now normal. Il prépare les états par les fonctions publiques du moteur ; son bandeau d’inspection est visible. Il est absent du dépôt applicatif et des trois exports de production. Les captures de comparaison utilisent séparément les états figés habituels : elles ne prouvent ni les animations ordinaires ni les comportements sur téléphone.

| Vérification | Résultat |
| --- | --- |
| Carrousel manuel | Cadran encore sélectionné après 53 248 ms, session inchangée. Aucun retour après huit secondes ni défilement automatique observé. |
| Annonce contextuelle | Retrait complet observé après environ 4 836 ms, sans quitter le cadran. La règle de 4 500 ms est aussi couverte par le test déterministe ; fondu et précision d’observation expliquent une durée visible légèrement supérieure. |
| Prochain match manuel | Bouton réellement actionné : stage ready, runningSince null, score 0–0. Le chrono ne part pas. |
| Rechargement | Session strictement identique, score 1–0 et 12 345 ms accumulées conservés en pause. |
| Accueil puis reprise | Retour réel à l’accueil, rechargement, Reprendre le match : session strictement identique. Retour non destructif direct, conforme à Lovable ; aucune nouvelle confirmation ajoutée. |
| Fin / Terminer la session | Présence des confirmations et mutation limitée au bouton positif vérifiées dans le code ; fonctions métier couvertes par les suites existantes. Manipulation réelle de ces boîtes non validée dans cet environnement. |

Les mesures brutes sont dans interactions.json. Le laboratoire accélère uniquement la préparation initiale des scénarios ; il n’altère pas les confirmations. Les autres comportements non manipulés ne sont pas déclarés validés.

## Comparaisons et portrait

Galerie : six paires Lovable/Expo, trois scénarios (victoire avec gagnant reste, nul avec une sortie, nul avec deux sorties), chacun à 390 × 844 et 844 × 390. Dimensions des douze captures contrôlées. Les planches portrait et paysage ont été examinées. Les libellés complets sont visibles ; les noms d’équipe gardent leur ellipse prévue par la référence. Pas de reconstruction des autres écrans.

Le portrait a également été recapturé sur l’export antérieur et l’export corrigé. Pas de changement de disposition constaté ; les styles de la branche portrait restent identiques. Les images ne sont pas strictement identiques pixel par pixel (écarts de fondu/rendu consignés dans portrait-regression.json) : aucune identité de pixels n’est revendiquée. Les mesures DOM hors capture ne sont conservées que pour le paysage à 844 px ; les portraits sont documentés par les captures rendues aux dimensions vérifiées.

## Contrôles exécutés sur les sources finales

| Contrôle | Résultat |
| --- | --- |
| Métier et sauvegardes | 16 suites, code 0, dont la nouvelle suite de confirmations et les tests de fiabilité antérieurs. |
| Syntaxe | 96 fichiers TypeScript, 0 erreur. |
| TypeScript | tsc --noEmit, code 0. Une erreur de typage dans le nouveau test a été corrigée avant ce résultat final. |
| ESLint | Application app/src et les deux tests Phase 3A, --max-warnings 0 : code 0. Lint Expo sans corrections automatiques : code 0. |
| Android / iOS / web | Expo export --platform all : code 0, trois bundles produits. Ni APK ni application signée/installée sur appareil. |

Les journaux, commandes et empreintes sont joints. Le lint global historique des anciens scripts n’est pas présenté comme corrigé : le périmètre standard du dépôt reste inchangé, aucune règle ou vérification désactivée. Les résultats CI du nouveau commit doivent être lus sur la PR ; ce rapport distingue ces résultats des vérifications locales.

## Avant fusion / feuille de route conservée

1. Sur iPhone et Android : Relancer → Annuler (temps, score, période inchangés), puis Relancer → confirmer (match prêt à zéro, chrono arrêté). Fin et Terminer la session → Annuler puis confirmer. Vérifier aussi la reprise hors ligne après fermeture.
2. Vérifier verrouillage, appuis longs (+1/−1 et grand chrono), gestes de retour, zones sûres, grande police, notifications, sons/vibrations, veille, appels et interruptions. Les exports et simulations ne valent pas une validation sur appareils.
3. Prévoir le véritable contrôle natif de la musique déjà diffusée sur le téléphone ; aucun lecteur simulé n’est ajouté.
4. Garder explicite la différence de départage : classement natif avec confrontation directe, différence de buts, buts marqués et victoires, au-delà du tri points/différence de buts de Lovable. Aucune règle sportive modifiée sans décision du propriétaire.

PR #9 à conserver en brouillon, sans fusion. Attendre la validation de cette finalisation ; ne pas commencer la Phase 3B.

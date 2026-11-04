# Seconde recette Emergent V0

Base : `03d9c65`, tête vérifiée de la PR #20. SDK 58 conservé. Aucun build EAS ni fusion.

## Tabata et 30/30 : défaut fonctionnel préexistant, pas une régression du moteur

La comparaison exécutable de `accbea8` (avant PR #20), `03d9c65` et des corrections est conservée dans `evidence/interval-history.json`. Le script `reproduction/interval-history.cjs` extrait et exécute les objets réellement définis par les boutons rapides ; il vérifie aussi que l'adaptateur `configFromDraft` et le moteur n'ont pas changé.

L'éditeur représente une liste de périodes répétée `d.reps` fois. L'adaptateur en fait `reps = periods.length` et `sets = d.reps`. `restMs` s'applique entre périodes à l'intérieur d'une série ; `restBetweenSetsMs` s'applique entre répétitions de cette série. Une période unique répétée huit fois a donc besoin de récupération entre répétitions.

Avant et après les premières corrections de PR #20, les boutons rapides affectaient 10/30 s à `rest`, mais forçaient `repRest: 0`. Le moteur exécutait correctement ces paramètres : huit efforts sans récupération. Masquer le réglage inutilisé entre périodes n'a pas supprimé de récupération : elle était déjà absente. Les anciens `INTERVAL_PRESETS` du domaine, non utilisés par ces boutons, étaient correctement configurés : huit efforts et sept récupérations.

| Programme | Avant PR #20 et à `03d9c65` | Correction des boutons rapides |
| --- | --- | --- |
| Tabata | 8 × 20 s, aucune récupération, 160 s | 8 × 20 s + 7 × 10 s, 230 s |
| 30/30 | 8 × 30 s, aucune récupération, 240 s | 8 × 30 s + 7 × 30 s, 450 s |

Roundr termine après le dernier effort ; il ne prévoit pas de repos final. Ce comportement existant est conservé : 3 min 50 et 7 min 30, respectivement. Aucune période de récupération supplémentaire n'est inventée après le huitième effort.

Le bouton rapide affecte désormais la récupération au champ réellement exécuté entre répétitions. Le réglage s'appelle « Repos entre répétitions » avec une période unique, reste visible quand les répétitions sont actives et permet des ajustements de 5 s. Le repos entre périodes reste masqué quand il est sans effet. Le résumé décrit le repos réellement actif, plutôt qu'une valeur inutilisée.

Aucun moteur, schéma de stockage, session en cours ou preset enregistré n'est réécrit. Un ancien chrono nommé « Tabata » avec zéro récupération conserve exactement ses paramètres : le nom ne permet pas de deviner l'intention de l'utilisateur. L'utilisateur peut choisir le programme rapide corrigé et l'enregistrer explicitement.

Les suites existantes de configuration et stockage couvrent les quinze segments, leurs transitions automatiques et manuelles, la pause au milieu de chaque effort/récupération, la restauration, la reprise, la dernière milliseconde et le dernier effort, ainsi que l'enregistrement/relecture et la conservation des anciens octets. Les 26 suites sont conservées.

## Tableau de recette

| Point | Statut et origine | Cause et traitement | Tests réalisés |
| --- | --- | --- | --- |
| Tabata / 30-30 | Corrigé ; défaut fonctionnel préexistant à PR #20 | Récupération affectée au mauvais champ pour une période répétée. Correction des boutons, libellé du repos actif et résumé ; moteur inchangé. | Comparaison de trois révisions ; huit efforts/sept récupérations ; quinze transitions dans les deux modes ; pauses, JSON/restauration, sauvegarde/relecture ; clics réels, pause pendant le repos, rechargement, reprise et fin du huitième effort. |
| En-tête et noms à 320 × 568 | Corrigé ; préexistant | Titre de 221 px dans 176 px ; noms de 127/128 px dans 75 px. Titre compact et sous-titre/noms sur deux lignes seulement sur écran étroit. | Mesures DOM avant/après et captures avec Olympique Lyonnais / Paris Saint-Germain ; plus de dépassement du titre ni des noms. |
| Accords Cup/Survie | Corrigé sur les cas reproduits ; préexistant | Pluriels forcés pour une rencontre, un match joué, un but et un qualifié. Formateurs communs pour les comptes de matchs/rencontres. | Survie à deux équipes : « 1 rencontre », « 0/1 match » ; résumé d'une finale avec un but ; Cup avec un qualifié ; comptes 0/1/2. |
| Durées rapides | Correction précédente complétée ; étirement introduit par le premier ajustement PR #20 | `flexGrow` étirait la dernière ligne : 30 min occupait 290 px à 360 px, contre 66,5 px pour les autres boutons. Largeurs égales mesurées dans le conteneur, bornées à 96 px, retour à la ligne centré. | Cinq boutons à 320/360/390/430 px : largeurs identiques, valeurs et sélection inchangées. |
| Identifiant « Nom du chrono » | Ajout ciblé ; absence préexistante | Champ accessible par son nom, sans testID dans le parcours Lovable. Ajout de `free-save-name` sans changement des handlers ni de validation. | Identifiant unique dans la modale, enregistrement réel des deux programmes ; contrôle des doublons DOM. |
| Paysage 568 × 320 | Conforme ; comportement préexistant conservé | Le contenu vertical défile et les commandes restent fixes. Aucune correction de mise en page nécessaire. | Défilement réel : chrono entièrement accessible au-dessus des commandes, avant/après. |
| Chrono libre sans équipes à 844 × 390 | Amélioration visuelle retenue ; préexistant, sans panne fonctionnelle | Colonne gauche vide : chrono de 397 px décalé à droite. Centrage de 520 px uniquement quand équipes, informations et tours sont absents ; deux colonnes conservées dès qu'elles sont utiles. | Chronomètre et compte à rebours sans équipes : centre à 422 px, commandes visibles ; tests existants avec équipes et rotations conservés. |

Le cas littéral « 1 match de poule » n'est pas reproduit avec une configuration Cup valide actuelle : le minimum est quatre équipes. Le formateur est néanmoins vérifié au singulier, et une Cup valide à deux poules garde « 2 matchs de poule ». Aucun problème n'est attribué arbitrairement à l'aperçu Emergent : les défauts reproduits sont expliqués par le code et les mesures Expo Web.

## Validation et conservation du périmètre

Seize scénarios navigateur ciblés complètent la recette existante dans GitHub Actions. Les assertions vérifient la géométrie réellement rendue, les contrôles accessibles, les configurations effectivement enregistrées et les transitions du runtime. Le workflow conserve tous ses contrôles précédents et ajoute cette étape ; les captures sont publiées dans l'artefact `roundr-web-regression`.

Commandes de validation : les 26 suites `npm test`, `npm run typecheck`, `npm run test:syntax`, `npm run lint`, `npx expo-doctor`, et `expo export --platform all --max-workers 2`. Les résultats du commit final sont indiqués dans les [checks de la PR #20](https://github.com/bledenovan01-bit/Roundr/pull/20/checks). Les tests web/exports ne remplacent pas les tests natifs prévus ensuite.

Les fichiers du moteur temporel, de stockage, des préférences, des sept sons et de leurs déclencheurs restent inchangés. Aucune dépendance, configuration Expo/EAS ou règle de tournoi n'est modifiée. Le changement métier porte uniquement sur les paramètres appliqués lors du choix explicite des deux programmes rapides.

## Preuves et incidents de test

- `evidence/interval-history.json` : paramètres et séquences exécutés par révision.
- `evidence/before-ui.json`, `before-landscape.json`, `after-ui.json` : mesures et résultats ; captures représentatives dans le même dossier.
- Le premier banc de reproduction a tenté une Cup à deux équipes : le validateur l'a refusée avant chargement. Cette fixture invalide a été remplacée par une Cup valide à quatre équipes ; elle n'est pas comptée comme une anomalie applicative ni comme un test réussi.

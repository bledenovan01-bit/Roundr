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

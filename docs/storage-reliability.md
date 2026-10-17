# Sauvegardes et migrations — correctif V0

Base : `94489163f0bb0792af090abba860d3dc50c28427`.
Branche : `codex/roundr-storage-reliability`.

## Protocole

- Toutes les écritures, y compris les copies brutes et les suppressions après archivage, partagent une file. Le marqueur n'est écrit qu'après la réussite de l'enregistrement des chronos.
- Le marqueur v2 conserve les identifiants de migration traités. Une suppression ultérieure reste donc une suppression ; elle ne provoque pas une nouvelle importation.
- Si ce marqueur échoue encore, supprimer un chrono importé attend d'abord son enregistrement durable. En cas de nouvel échec, la suppression est refusée et le chrono reste présent : il ne pourra pas être réimporté contre le choix de l'utilisateur.
- Un ancien marqueur sans cette preuve propose une récupération explicite des éléments absents. « Garder ma liste » enregistre le refus, sans supprimer les presets Custom originaux. Les éléments déjà présents, renommés ou modifiés ne sont pas remplacés.
- Les erreurs de lecture ou les listes invalides empêchent la migration. Elles ne valent jamais liste vide. Les lectures simultanées partagent une promesse ; les mutations pendant le chargement sont refusées sans changer l'état ni le disque. Les nouvelles tentatives ne relisent que les ressources bloquées.
- Les données rejetées restent à leur emplacement d'origine. Une copie brute est tentée sous une clé `.corrupt` ; une ancienne copie différente n'est jamais remplacée. Pour une session unique, une création explicite redevient possible seulement après la réussite de cette copie. Une liste de presets illisible reste bloquée pour éviter d'effacer des éléments inconnus.
- Une copie échouée n'est jamais annoncée comme conservée. Une erreur d'écriture ne disparaît qu'après une écriture réussie de la même ressource, et non après un succès sans rapport. Le bouton de nouvelle tentative rejoue les dernières opérations encore pertinentes.
- La validation du chrono libre contrôle sa configuration, sa séquence dérivée, son index, les durées, les horodatages, les états, les tours et les scores. Seule une séquence `steps` absente peut être reconstruite : aucune valeur temporelle, aucun tour ni aucun score manquant n'est inventé. Les séquences sont bornées avant allocation (les limites de l'interface actuelle restent acceptées).
- Chronomètre, compte à rebours, intervalles et lancement d'un preset passent par la même confirmation si une séance non terminée contient une progression, des tours ou des scores. Annuler ou fermer la confirmation ne déclenche aucune écriture.

## Vérifications automatisées

Depuis `frontend`, avec les dépendances installées :

```sh
node scripts/run-domain-tests.cjs
node scripts/check-syntax.cjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js . --no-cache
```

`test-storage-reliability.ts` simule les pannes de lecture, d'écriture et de copie, une coupure entre données et marqueur, les anciens marqueurs, les données absentes/invalides, les réparations limitées, les mutations concurrentes, la confirmation du remplacement et les erreurs persistantes. Le test historique attend `flushStorage()` plutôt qu'une temporisation de 80 ms.

Les contrôles GitHub sont déclenchés sur cette branche et sur les PR vers `main`. Les contrôles existants, dont l'export Android/iOS/web, restent actifs. Un contrôle lint séparé expose aussi les défauts préexistants ; aucun échec n'est ignoré.

## Recette à exécuter sur iPhone ET Android

1. En mode avion, lancer le chronomètre, enregistrer plusieurs tours, puis le mettre en pause. Fermer complètement l'application et la rouvrir : retrouver exactement le temps en pause et les tours. Refaire avec un compte à rebours « Avec équipes » pour vérifier les scores. Pour chaque outil, refaire avec le chrono en marche et vérifier le temps recalculé depuis les horodatages.
2. Mettre à jour une installation de test contenant des presets Custom. Vérifier les originaux, les nouveaux chronos et les chronos déjà renommés. Fermer/rouvrir plusieurs fois : aucun doublon. Sur une installation contenant un ancien marqueur ambigu, tester séparément « Récupérer » et « Garder ma liste », puis rouvrir.
3. Avec une séance contenant des tours ou des scores, tenter chacun des quatre parcours de création. Annuler : reprendre la même séance, puis fermer/rouvrir et vérifier sa sauvegarde. Confirmer : retrouver une séance neuve. Un chrono neuf sans progression ne doit pas provoquer de confirmation.
4. Si le stockage de l'appareil peut être rendu indisponible dans un environnement de test, vérifier le message d'échec puis réessayer après rétablissement. Ne pas utiliser de vraies données pour ces simulations.

Ces essais natifs ne sont pas remplacés par les tests automatisés et ne sont pas déclarés effectués par ce correctif.

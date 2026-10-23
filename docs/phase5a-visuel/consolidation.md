# Plan de consolidation — aucune fusion effectuée

État distant relu le 23 octobre 2026, et non déduit seulement des noms de branches. `main` est toujours à `94489163f0bb0792af090abba860d3dc50c28427`. C’est aussi l’ancêtre commun avec la chaîne actuelle. Les PR #5 à #12 sont ouvertes, en brouillon et non fusionnées au moment du contrôle.

| PR | Branche | Base cible vérifiée | Tête vérifiée | État |
|---|---|---|---|---|
| #5 | codex/roundr-storage-reliability | main | 62e8c13 | Brouillon, non fusionnée |
| #6 | codex/roundr-lovable-phase-1 | codex/roundr-native-preview | 4dd401d | Brouillon, non fusionnée |
| #7 | codex/roundr-lovable-phase-2a | codex/roundr-lovable-phase-1 | 3135323 | Brouillon, non fusionnée |
| #8 | codex/roundr-lovable-phase-2b | codex/roundr-lovable-phase-2a | db2256c | Brouillon, non fusionnée |
| #9 | codex/roundr-lovable-phase-3a | codex/roundr-lovable-phase-2b | d2e1b88 | Brouillon, non fusionnée |
| #10 | codex/roundr-lovable-phase-3b | codex/roundr-lovable-phase-3a | 9461e2f | Brouillon, non fusionnée |
| #11 | codex/roundr-lovable-phase-4a | codex/roundr-lovable-phase-3b | 1c9e30b | Brouillon, non fusionnée |
| #12 | codex/roundr-lovable-phase-4b | codex/roundr-lovable-phase-4a | f8cf757 | Brouillon, non fusionnée |

La branche Phase 5A part exactement de `f8cf75717ccccfd648d2291d458ee79a5a4da2be` et contient donc déjà toutes ces phases. La nouvelle PR doit cibler `codex/roundr-lovable-phase-4b` et rester en brouillon. Le numéro et le commit final sont fournis dans la livraison.

## Vérifications de présence

- Le commit de fiabilité `62e8c13214746562a26369bda260d1e8d5adce4e` est un ancêtre de HEAD. Les tests de copie brute, migration Custom, ancien marqueur ambigu, annulation/remplacement durable et file d’écritures sont toujours exécutés.
- La préparation EAS `86826c7` et le commit preview `8fc43c1` sont des ancêtres. `frontend/app.json` et `frontend/eas.json` sont identiques au preview `8fc43c1` ; aucun changement de signature, compte ou identifiant n’est introduit.
- Le profil `preview` est en distribution interne, sans client de développement ; Android demande un APK, iOS un appareil physique Release (pas simulateur). `requireCommit` reste vrai. Aucun `submit` ou build distant automatique n’est ajouté.
- La configuration hérite encore de `slug`/`scheme` « frontend » et de l’identifiant `com.emergent.demoprevue.vnvemd`. Ne pas en inventer un autre. Valider l’identité/projet Expo, les droits du compte et la stratégie de signature avant distribution ; une nouvelle identité crée un autre espace de stockage sur téléphone. L’utilisateur n’a signalé que des essais Expo Go/navigateur.
- La configuration EAS est présente, mais **aucune résolution actuelle de compte, signature, quota, certificat ni compilation EAS n’a été exécutée** dans Phase 5A. Les anciens résultats Expo Doctor/prébuild du document `native-preview.md` restent des résultats historiques.
- Les quatre moteurs sportifs, l’horloge commune, le moteur libre, les magasins et les migrations ne sont pas modifiés par Phase 5A. Les versions de règles Cup/Survie pour sauvegardes anciennes/nouvelles sont préservées.

`ascendance.json` donne les commits complets testés par `git merge-base --is-ancestor`. Les têtes/base des PR sont dans `pr-dependances.json`. Les sorties de tests actuelles figurent dans `controles/`.

## Plan recommandé après validation, à exécuter dans une mission distincte

1. **Figer les références revues** : relire les têtes distantes, vérifier l’arbre propre, conserver les branches, exporter les données de test utiles. Faire approuver le commit exact retenu après validation visuelle et recette mobile.
2. **Créer une branche de consolidation depuis la dernière Phase 5A approuvée.** Elle possède déjà tous les ancêtres. Il n’est pas nécessaire de rejouer les changements de chaque PR par cherry-pick.
3. **Comparer cette branche à main** : relire main au moment de l’opération. S’il est inchangé, la différence est toute la chaîne validée. S’il a avancé, intégrer ces commits sur la branche de consolidation avec résolution et nouvelle validation, sans écraser ni réécrire main ou les branches synchronisées.
4. **Ouvrir une seule PR globale de consolidation vers main**, initialement en brouillon. Inclure explicitement la fiabilité, EAS et toutes les phases : la PR #6 vise native-preview, donc la simple liste des PR visuelles ne suffit pas à intégrer ces commits intermédiaires dans main. Conserver l’historique des commits pour éviter de casser l’ascendance des PR empilées.
5. **Relancer toute la CI et la recette sur le commit retenu**, notamment migration réelle d’anciennes données, panne simulée, reprise hors ligne, ancienne/nouvelle politique sportive, sons et interruptions. Examiner la différence globale, y compris les documents et assets.
6. **Demander l’accord de fusion de cette PR globale.** Aucune fusion n’est autorisée par cette mission. Après fusion approuvée et vérification de l’ascendance, traiter les anciennes PR comme remplacées, avec références croisises ; leur fermeture ou suppression de branches serait une action distincte à confirmer. Ne pas lancer de squash/rebase/force-push sur les branches publiées.

L’autre voie, fusionner la pile du bas vers le haut, demanderait aussi une PR pour l’étape native-preview et une revalidation des bases à chaque fois. Elle est plus facile à mal ordonner. Ne pas fusionner les PR hautes directement vers main ni cumuler cherry-picks et merges de la même phase.

## Conditions restantes

Validation Phase 5A ; tests physiques ; identité/signature Expo de test ; accord sur une éventuelle facture EAS ; compte Apple Developer actif pour la distribution iOS ad hoc. La décision 30/30 et le périmètre musical sont distincts, pas des fonctionnalités présentées comme déjà opérationnelles. Aucune branche de consolidation, fusion ou publication n’est créée dans cette mission.

# Roundr — Phase 5A : Paramètres et audit transversal

Base exacte : `f8cf75717ccccfd648d2291d458ee79a5a4da2be`. Référence : `roundr-mockup`, tag `v0-lovable-final`, commit `1c59720dc5b180d5b1bacfaf935902b4053895fa`. Audit du 23 octobre 2026. Branche : `codex/roundr-lovable-phase-5a`, PR cible Phase 4B. La livraison précise le commit final et le résultat GitHub séparément.

## Résultat et décision validée

Les Paramètres utilisent maintenant les fondations Lovable déjà approuvées : en-tête, cartes, Manrope, interrupteurs 50 × 30, textes, bouton d’introduction et grille paysage. Les cibles tactiles sont étendues sans agrandir visuellement les interrupteurs. L’option écran éveillé conserve son choix enregistré et son défaut natif désactivé ; elle n’est pas forcée à `true` pour imiter le défaut du prototype.

L’utilisateur a choisi **un écran principal fidèle et un accès aux réglages avancés**. Cet accès est un bouton de 44 × 44 dans l’emplacement droit de l’en-tête, nommé « Réglages avancés » pour l’accessibilité. Cela préserve les positions des quatre cartes, y compris en paysage. Le volume, les six sons par événement, les annonces de préparation, le défaut historique de temps additionnel et l’assistance sont conservés dans cette vue secondaire. Aucun réglage n’est supprimé.

Le texte du temps additionnel a été corrigé : le défaut ne concerne que les anciennes configurations personnalisées. Les nouveaux formats conservent leur propre réglage au lancement ; aucun changement sportif n’a été introduit pour étendre artificiellement cette préférence.

Depuis un match ou un Chrono libre, une carte présente le libellé, le temps et la durée en lecture seule. Le bouton « Retour au match » ou « Retour à la session » reprend le bon parcours, même si un chrono libre et un match natif coexistent. L’origine est transmise explicitement par les quatre points d’entrée existants. « Revoir l’introduction » conserve les séances et ramène à l’accueil après « Commencer ».

Les options Maracana de rotation et de nul présentes dans les Paramètres Lovable sont raccordées. Elles changent uniquement la politique pour les finalisations à venir ; les résultats, files et transitions déjà figés, le chrono, les scores et les sauvegardes ne sont pas reconstruits. Le moteur existant reste responsable des transitions. La règle « deux équipes sortent » n’est présentée qu’en gagnant-reste avec au moins quatre équipes.

## Comparaisons visuelles nouvelles

[Galerie](index.html) : **14 paires, 28 originaux**, 390 × 844 et 844 × 390. Dans chaque paire, même état et mêmes valeurs, défilement initial à zéro. Les originaux ne sont ni redimensionnés ni retouchés ; seules des légendes sont ajoutées aux images côte à côte. `manifest.json` donne dimensions et SHA-256, plus les empreintes des 111 fichiers app/src identiques à la copie Expo rendue.

| État | Vérification directe | Écart/adaptation |
|---|---|---|
| Général, trois options activées | Cartes, en-tête, styles et grille P/L | Accès avancé natif en haut à droite |
| Trois options désactivées | Piste sombre et position du curseur P/L | Interrupteur local corrigé sans toucher aux autres écrans |
| Match classique, pause à 14:15 | Résumé, durée de période 900 s, retour P/L | Champ natif non modifiable, erreurs visibles |
| Chronomètre libre, pause à 00:45 | Libellé complet, durée 0 s comme la référence, retour P/L | Stockage libre séparé du match natif |
| Maracana, 4 équipes, 8 min | Résumé à 07:15, rotation P/L | Politique raccordée au moteur natif existant |
| Gagnant reste, règle de nul | Apparition de la carte et choix P/L | Aucune réécriture des résultats passés |
| Revoir l’introduction | Écran complet P/L issu des composants validés | Sources de l’introduction inchangées |
| Réglages avancés | Trois captures Expo : P, L, assistance après défilement | Aucun équivalent Lovable ; aucune fausse paire |

Les petits écarts de rastérisation de police/SVG et l’icône de lecture pleine des boutons partagés natifs restent visibles. Le contenu défile quand la hauteur manque ; le CTA reste accessible avec les zones sûres. Aucune nouvelle équivalence pixel par pixel n’est annoncée.

## Audit transversal : preuves et limites

L’audit combine lecture actuelle des routes/composants et des sources figées, contrôles automatisés exécutés à nouveau, parcours réels dans le navigateur, et galeries antérieures déjà validées par l’utilisateur. **Une inspection de code ou une ancienne capture n’est pas une nouvelle validation visuelle.** Les contrôles ci-dessous ne sont pas une répétition exhaustive de tous les états sportifs dans le navigateur.

| Parcours | Preuves actuelles | Résultat / reste à vérifier |
|---|---|---|
| Introduction | Nouvelle comparaison P/L depuis Paramètres ; sources inchangées | Fidélité conservée ; lecture de l’intro ne supprime pas la séance |
| Accueil | Navigation réelle P/L, cinq accès et liens secondaires ; reprise après intro | Pas de lien Mes chronos ajouté à l’accueil ; coexistence de deux reprises native volontaire |
| Classique | Accès P/L ; création réelle à 30 min / deux mi-temps ; tests Phase 2A | Paramètres et règles approuvés conservés |
| Maracana | Accès P/L ; nouvelles cartes Paramètres ; restauration du choix rotation/nul | Choix de configuration et lancement manuel/auto/différé testés dans les suites existantes |
| Cup / Survie, configuration | Accès et retours réels P/L ; tests Phase 2B | Tirage, qualifications, exemptions, durées et Golden goal restent inchangés |
| Faire les équipes | Ajout réel de quatre noms, tirage, validation et import Classique ; tests composition | Déplacements/limites/copies couvertes automatiquement ; pas de nouvelle revue visuelle de tous les tirages |
| Import dans les autres modes | Sources partagées et suites d’import/validation, configurations P/L accessibles | Pas de nouvelle exécution manuelle de chaque import dans chaque mode |
| Matchs Classique / Maracana | Match réellement lancé et scoré, passage Paramètres/retour ; suites 3A | Carrousels manuels, confirmations et horodatages préservés ; pas de nouvelle galerie des cadrans |
| Cup / Survie en compétition | Sources inchangées ; suites 3B métier/stockage et politique de règles versionnée | Poules, phases finales, départages, Golden goal, résultat corrigé et archivage testés automatiquement ; pas de nouvelle finale complète jouée en navigateur |
| Classements / palmarès | Tests sportifs actuels et rapport de finalisation 3B | Nouvelles compétitions suivent Lovable ; anciennes gardent leurs règles. Un seul qualifié reçoit le titre sans finale artificielle |
| Chrono libre, trois outils | Accès P/L et retours réels des trois configurations ; 60 programmes d’intervalles de l’oracle | Configurations/moteur inchangés ; 30/30 conservé à 4 min |
| Mes chronos | Accès/retour P/L, état vide ; suites durables 4A | Enregistrer/éditer/nouveau/supprimer : tests réexécutés ; pas de nouvelle revue visuelle de chaque fenêtre |
| Chrono libre en marche | Retour réel vers 00:45 en pause puis rechargement ; suites 4B | Temps/tours/scores/vues et annulation conservés dans les tests ; pas de nouvelle galerie des cadrans |
| Historique | Lien et état vide réels en paysage, sources approuvées inchangées ; tests d’archive/récupération | Données locales uniquement, aucune synchronisation promise ; pas de nouvelle compétition archivée manuellement |
| Paramètres | Nouvelles 14 comparaisons, réglages avancés, préférences après rechargement | Volume 35 % et son de début Gong conservés. Valeur ARIA du volume corrigée (0–100, valeur réelle) |
| Navigation P/L | 18 points d’ouverture de configurations consignés dans `interactions/audit-navigation.json`, retours effectifs | Aucune route manquante constatée sur ce périmètre. Gestes système et clavier natifs non testés |
| Musique | Sources des matchs affichent « Contrôle musical indisponible » ; chrono libre sans lecteur simulé | Fonction non opérationnelle, étude séparée ; aucun bouton de lecture factice ajouté |

Pas de bouton avec gestionnaire vide trouvé dans les sources applicatives auditées. Les contrôles désactivés avant démarrage, import incompatible, validation invalide ou sauvegarde en cours le restent intentionnellement. Les liens d’assistance pointent vers les formulaires GitHub existants, avec erreur d’ouverture visible ; aucun ticket n’a été envoyé et une connexion GitHub peut être nécessaire.

## Fiabilité et compatibilité

Les moteurs `src/domain`, `src/chrono`, les magasins de sauvegarde/migration et les schémas de données existants ne sont pas modifiés. `settings-state.ts` ne fournit que des projections/choix futurs de configuration. Les préférences utilisent les clés et la file d’écriture existantes. Aucune annonce de succès n’est ajoutée à une modification optimiste ; une écriture refusée reste signalée. Les anciens presets, récupérations explicites, valeurs brutes rejetées, confirmations de remplacement et ordonnancement restent couverts par les suites réexécutées.

Les résultats déjà figés d’une rotation ne changent pas lorsqu’on choisit une autre règle dans les Paramètres. Ce comportement est testé avec des références identiques pour le chrono, la file, les matchs, la sauvegarde pré-finale et le lancement en attente. Les anciens moteurs de tournoi et leur version de règles restent intacts.

## Contrôles exécutés

| Contrôle local final | Résultat |
|---|---|
| Tests métier et sauvegardes | 22 suites réussies, dont les 21 suites précédentes |
| Syntaxe | 111 fichiers TypeScript, zéro erreur |
| TypeScript | Code 0 |
| ESLint app/src et nouveau test, zéro avertissement autorisé | Code 0 ; aucune règle désactivée |
| Export de production Android / iOS / web | Tous réussis, code 0 |
| Miroir des captures | 111 sources app/src identiques au dépôt |
| Appareils physiques / APK ou IPA signé | Non exécutés |

Journaux : `controles/`. Les premiers essais du nouveau test ont révélé un import manquant, corrigé avant la dernière exécution complète réussie. Le lint étendu à tous les anciens scripts n’a pas été réexécuté ; aucune disparition de leur dette historique n’est revendiquée. Le workflow conserve ses trois jobs et ajoute seulement les déclenchements Phase 5A/PR vers Phase 4B.

Les écrans de test utilisent une horloge fixe et des données dédiées sur deux origines localhost ; la dernière page Expo de test fige aussi l’horloge après rechargement. Cela rend les captures reproductibles, sans valider une interruption système ou la précision chronométrique d’un appareil. Les calculs d’interruption sont testés séparément par horodatages dans les suites métier.

## Points avant distribution / consolidation

1. Valider cette galerie et les comportements Paramètres.
2. Exécuter la [recette physique](recette-mobile.md), notamment zones sûres, gros caractères, voix, clavier, maintien éveillé, sons et interruptions.
3. Valider les identifiants/projet Expo de test hérités d’Emergent et les accès/signatures avant tout build ; l’absence de compte Apple Developer payant signalée auparavant empêche de présumer une IPA ad hoc disponible.
4. Arbitrer séparément [musique et 30/30](musique-et-30-30.md).
5. Suivre le [plan de consolidation](consolidation.md) après accord. Aucune fusion, publication, modification de main, migration de clé ni build payant dans cette phase.

Arrêt après Phase 5A.

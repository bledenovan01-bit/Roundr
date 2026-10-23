# Roundr — Phase 4A à valider

Mise à jour : consulter les [retouches finales et leurs cinq comparaisons ciblées](retouches/rapport.md), qui complètent les captures initiales ci-dessous, notamment pour les espacements paysage et le focus naturel de la fenêtre.

Base Expo : `9461e2fcb0855c469993b6bce07c0187959cc5cc`, branche `codex/roundr-lovable-phase-4a`. Référence : Lovable `v0-lovable-final`, commit `1c59720dc5b180d5b1bacfaf935902b4053895fa`. Cible de la PR : `codex/roundr-lovable-phase-3b`. Aucune fusion, modification de main ou construction payante.

## Parcours livrés

| Parcours | Fonctionnement raccordé | Comparaisons |
|---|---|---|
| Hub | Trois outils, Mes chronos, navigation et reprise native conservée | Portrait et paysage |
| Chronomètre | Écran de configuration avant préparation, tours conservés | Portrait et paysage |
| Compte à rebours | 1/5/10/15/30 minutes, heures/minutes/secondes, signal, refus d'une durée nulle | Valeur initiale et erreur, deux orientations |
| Intervalles | 1 à 12 périodes individuelles, suppression, repos, répétitions, programmes rapides, passage manuel/automatique, signaux, total | Initial, 4 × 10 min, manuel, douze périodes et résumé, deux orientations |
| Équipes | 2 à 8 équipes, noms, palette, scores facultatifs, import de composition | Deux/huit équipes, palette ouverte et import, deux orientations |
| Mes chronos | État vide, liste, lancement, modification du nom/réglages, mise à jour, copie distincte, suppression confirmée | Liste, édition et fenêtres, deux orientations |

La [galerie](index.html) contient 38 paires : 19 états à 390 × 844 et 844 × 390. Les originaux non redimensionnés, dimensions et empreintes sont dans `raw/` et `manifest.json`. Les paires ajoutent uniquement une légende au-dessus des deux captures. Les miniatures servent au contrôle, pas à mesurer les dimensions.

## Sauvegardes et compatibilité

- Une configuration enregistrée reste distincte de la séance active : elle ne contient ni temps parcouru, ni tours, ni scores.
- Les mutations des configurations sont sérialisées. L'écran n'annonce leur succès et la liste en mémoire ne change qu'après l'écriture réussie. Une écriture refusée conserve la liste précédente ; une relance générique du stockage ne réalise pas ultérieurement une suppression abandonnée. L'erreur reste visible jusqu'à la réussite de l'opération concernée.
- Le format des nouveaux intervalles ajoute `periodsMs`. Son absence conserve exactement l'ancienne construction des étapes et les anciennes durées. L'ouverture de l'éditeur réalise une adaptation explicite en mémoire, sans réécrire la sauvegarde. Les réglages natifs antérieurs d'affichage et de son sont conservés.
- Les anciens programmes dépassant les limites de l'éditeur Lovable restent lançables, renommables et copiables avec leurs valeurs originales. Leurs durées ne sont pas tronquées pour les faire entrer artificiellement dans les nouvelles limites.
- Les anciennes paires de scores restent acceptées. Les nouvelles configurations avec équipes gardent de deux à huit scores, validés selon le nombre d'équipes. Relancer remet chaque score à zéro sans réduire leur nombre.
- Les données rejetées restent brutes. Une restauration invalide bloque le remplacement silencieux ; la récupération demande une confirmation explicite et utilise la protection de copie existante, dont l'échec d'écriture reste une erreur.
- Tous les lancements utilisent la protection de remplacement existante. Les tests vérifient qu'annuler conserve exactement l'objet actif et les octets enregistrés, pour les trois outils et les configurations enregistrées.

Deux défauts ont été reproduits avant correction : des périodes de 5 et 10 secondes produisaient deux étapes de 5 secondes ; une configuration apparaissait déjà enregistrée pendant une écriture encore bloquée. Les traces sont dans `controles/before-*.txt`.

## Particularité de la référence conservée

Dans le code Lovable figé, les programmes 30/30 et Tabata contiennent une seule période par série. Le repos entre périodes ne s'applique donc pas entre ces séries ; leur repos entre séries est nul. Le résumé donne respectivement 4 minutes et 2 minutes 40. Ce comportement est reproduit et comparé à un oracle exécutant la source figée, sans correction spontanée. Les anciens programmes Expo gardent leur ancienne durée, notamment 7 minutes 30 pour l'ancien 30/30.

Arbitrage fonctionnel obligatoire avant publication : le programme rapide 30/30 actuel dure **4 minutes sans repos intercalé**. Décider séparément du maintien de ce comportement ou d'une évolution du programme et de son libellé. Aucune modification de cette règle dans la présente PR.

## Contrôles réellement exécutés

| Contrôle local | Résultat |
|---|---|
| Tests métier et sauvegardes | 20 suites réussies, dont les 18 suites existantes |
| Nouvel oracle intervalles Lovable | 60 combinaisons, durées individuelles, repos, séries, total, horodatages et passage manuel |
| Syntaxe | 103 fichiers TypeScript, zéro erreur |
| TypeScript `tsc --noEmit` | Code de sortie 0 |
| ESLint app/src et nouveaux scripts, zéro avertissement autorisé | Code de sortie 0 |
| Lint officiel Expo, sans correction automatique | Code de sortie 0 |
| Export Android | Réussi, bundle Hermes |
| Export iOS | Réussi, bundle Hermes |
| Export web | Réussi |

Journaux dans `controles/`. Exécution dans une copie isolée avec les dépendances existantes : Node 24.19, TypeScript 6.0.3 et Expo 57.0.30. GitHub utilise Node 22 ; son résultat doit être consulté sur le commit final de la PR. Aucun contrôle désactivé pour obtenir ces résultats. Les exports ne sont pas des builds signés et ne prouvent pas une validation sur téléphone.

## Interactions web et limites

Création, modification, enregistrement comme nouveau, rechargement, suppression annulée puis confirmée et persistance après rechargement ont été exercés dans le navigateur sur des données de test isolées. L'import de trois équipes, leur lancement, les tours et le score de la troisième équipe ont aussi été exercés. Les annexes sont dans `interactions/`.

La confirmation système de remplacement n'a pas pu être validée fidèlement par ce navigateur : l'interaction est absorbée par l'environnement. L'annulation est couverte par des tests du véritable garde avec Alert simulée, sans que cela constitue un essai de la fenêtre sur appareil. Elle reste obligatoire dans la recette native.

Les animations de fenêtre reprennent le fondu et le déplacement de la référence et respectent la réduction des animations. Les captures utilisent la réduction des animations et une horloge fixe pour comparer des états stables ; elles ne constituent pas une validation des animations natives.

## Écarts et adaptations à examiner

- De petites différences de métriques de texte, de bordure et de quelques pixels subsistent entre le rendu DOM de Lovable et React Native Web. La galerie expose ces différences ; aucune équivalence pixel par pixel n'est annoncée.
- La fenêtre de modification montre une différence de focus du champ en web ; vérifier également le clavier sur appareil.
- Les cibles tactiles utilisent des zones d'appui étendues lorsqu'un contrôle visuel est plus petit que 44 points. Les zones sûres et le défilement sont conservés.
- Une ligne de reprise peut apparaître avec une séance active : elle préserve le parcours de reprise natif et n'apparaît pas dans les captures sans séance.
- L'écran d'exécution reçoit uniquement l'intégration nécessaire des noms, couleurs et scores de deux à huit équipes. Ses cadrans, carrousels, commandes et présentation générale ne sont pas repris dans ce lot : ils relèvent de la Phase 4B.

## Recette iPhone et Android avant validation native

1. Hors ligne, préparer un ancien chrono puis un nouveau programme à plusieurs durées, démarrer, ajouter tours et scores, fermer complètement l'application et reprendre. Contrôler temps, période, tours et chaque score.
2. Depuis chaque outil et Mes chronos, tenter de remplacer une séance avec progression. Annuler : même séance et même sauvegarde après fermeture. Confirmer : nouvelle configuration et message cohérents.
3. Créer, renommer, copier, supprimer une configuration ; fermer et rouvrir après chaque opération. Vérifier les anciens presets et les erreurs de stockage avec un environnement de test contrôlé.
4. Tester douze périodes, repos, répétitions et transitions manuelles/automatiques ; signal de fin et notifications au premier plan, en arrière-plan et après interruption audio.
5. Tester deux à huit équipes, import, couleurs, noms longs et scores désactivés. Vérifier la conservation des valeurs quand on revient dans la configuration.
6. Tourner le téléphone avec clavier et fenêtre ouverts. Contrôler les zones sûres, les boutons accessibles, le défilement, VoiceOver/TalkBack, taille de police et réduction des animations.

Arrêt après la Phase 4A. Validation visuelle utilisateur et essais physiques restent nécessaires avant la Phase 4B.

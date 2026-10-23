# Phase 3B — Finalisation sportive de la PR #10

Base du correctif : 39db25177d2a5ddb965b023e19dd5af95764edbc. Référence figée : roundr-mockup@1c59720dc5b180d5b1bacfaf935902b4053895fa.

Le rendu validé est conservé. Aucun style, texte, écran ou parcours graphique n'est reconstruit. Le changement dans history-summary transmet uniquement la version des règles au calcul du classement.

## Comparaison avant/après

| Situation identique | Expo avant / sauvegarde ancienne | Nouvelle compétition après correctif | Lovable |
|---|---|---|---|
| Poule aller-retour : premier aller terminé, retours non joués, trois équipes à égalité de points | Mini-classement prématuré : t1 en tête | Critères globaux : t2 en tête tant que leurs confrontations prévues ne sont pas toutes terminées | t2 |
| Toutes les confrontations des ex æquo terminées | Mini-classement selon la politique déjà enregistrée | Confrontation particulière : points, différence de buts, buts ; puis critères globaux inchangés | Même ordre, comparé au module figé |
| Cup/Survie, 1–1 en fin de temps réglementaire, objectif 2 buts ; but en prolongation classique | Arrêt immédiat à 2–1 | 2–1, prolongation toujours en cours ; victoire à la fin de la durée si le score reste inchangé | Pas d'objectif de buts en prolongation |
| Égalisation à 2–2 durant cette prolongation | L'ancien objectif peut avoir déjà terminé la rencontre | Fin de la durée puis tirs au but ; score de jeu et tirs au but séparés | Même comportement |
| Golden goal, premier but | Fin immédiate | Fin immédiate ; inchangé | Fin immédiate |
| Cup à un seul qualifié | Champion et archivage sans finale artificielle | Inchangé, test conservé | Plantage de la référence volontairement non reproduit |

Les comparaisons sportives sont des tests exécutés contre le module Lovable figé (empreinte contrôlée par la suite), pas des captures ni une nouvelle validation visuelle. La galerie de la Phase 3B reste la référence du rendu approuvé.

## Anciennes sauvegardes

Un champ facultatif de session, sportingRules: "lovable-final-v1", est ajouté uniquement par createTournamentSession, point d'entrée des nouvelles Cup/Survie et du bouton Rejouer. Il est distinct des anciens tournamentPolicy et tournamentView : leur présence dans une sauvegarde du commit 39db251 ne suffit pas à activer les nouvelles règles.

- Champ absent : aucune migration, aucune insertion au chargement, règles antérieures conservées (y compris l'arrêt sur objectif en prolongation). Le test recharge des sessions Cup et Survie portant déjà les anciens marqueurs et contrôle les octets sauvegardés inchangés.
- Champ présent : conservé à la reprise, dans l'archive et lors d'une correction de résultat. Les classements d'écran, d'historique, de qualification et les recalculs après correction reçoivent la même politique.
- Valeur inconnue : restauration refusée, valeur brute conservée, erreur visible et copie de secours suivant le mécanisme de fiabilité existant ; test de stockage réel simulé ajouté.
- Rejouer crée une autre compétition avec les nouvelles règles ; l'ancienne session et son palmarès ne sont pas convertis. Aucun bouton de conversion rétroactive ajouté.
- Les compétitions plus anciennes sans politique Lovable conservent aussi leurs anciens critères, repêchages et placements. Les moteurs Classique, Maracana et Chrono libre ne changent pas.

## Tests

Les nouveaux tests échouent avant les correctifs : t1 au lieu de t2 (before.txt), puis état finished au lieu de extra avec le moteur de session de 39db251 dans le miroir de validation (before-overtime.txt). Aucune réinitialisation du dépôt n'a été utilisée.

Contrôles locaux exécutés :

| Contrôle | Résultat |
|---|---|
| Tests métier et stockage | 18 suites réussies |
| Analyse syntaxique TypeScript | 99 fichiers, 0 erreur |
| TypeScript --noEmit | Réussi, code 0 |
| ESLint app/src et les deux suites modifiées, max-warnings 0 | 0 erreur, 0 avertissement |
| Lint Expo officiel, --fix=false | Réussi |
| Export Android | Réussi, bundle Hermes produit |
| Export iOS | Réussi, bundle Hermes produit |
| Export web | Réussi, index et bundle produits |

Journaux dans controles/. Les fichiers before constituent des preuves de défaut avant correction et non des échecs du contrôle final. Les fichiers vides TypeScript/ESLint correspondent à une exécution réussie sans diagnostic. Environnement local Node 24.19.0, Expo 57.0.30, TypeScript 6.0.3 ; validation sur miroir des sources, dépendances existantes, aucune nouvelle dépendance. Aucun contrôle ni règle désactivé.

Couverture conservée et étendue : Cup/Survie 2 à 32 équipes selon le mode, poules/finales, exemptions, qualifiés, mini-classements provisoires/définitifs, reprise des marqueurs, anciens critères, prolongation de 60 s plus 60 s (120000 ms réellement jouées), égalisation, tirs au but, Golden goal, lancement manuel/auto/différé et annulation, correction des tours dépendants, archivage idempotent et échecs d'écriture. Un qualifié unique reste champion et archivé.

## Avant fusion et tests sur téléphone

PR #10 à conserver en brouillon, sans fusion. La Phase 4 n'est pas commencée. Les exports locaux ne sont ni des builds signés ni des tests iPhone/Android.

Sur chaque téléphone : reprendre hors ligne une ancienne compétition puis une nouvelle ; vérifier à 1–1 avec objectif 2 buts que seule la nouvelle continue à 2–1 en prolongation ; égaliser et vérifier la transition aux TAB ; vérifier le premier but Golden goal ; fermer/reprendre durant la prolongation et contrôler durée/score ; finaliser et retrouver un seul palmarès. Conserver la recette précédente pour notifications, verrouillage, appuis longs, interruptions et zones sûres. Le contrôle musical natif réel reste à traiter séparément.

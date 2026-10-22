# Roundr — Phase 2B : validation proposée

Cup, Survie et Faire les équipes reprennent les configurations et les composants de la référence Lovable figée. Cette livraison attend votre validation visuelle avant toute autre phase.

## Références et périmètre

- Lovable : tag v0-lovable-final, commit 1c59720dc5b180d5b1bacfaf935902b4053895fa.
- Base Expo : 31353238d4b4f2ff41d381f71f35bccf66481ae6, branche codex/roundr-lovable-phase-2a.
- Nouvelle branche : codex/roundr-lovable-phase-2b ; PR en brouillon vers la Phase 2A. Aucun changement de main, aucune fusion.
- Les PR #5, #6 et #7 sont conservées en brouillon et non fusionnées ; leurs commits sont inchangés lors de la vérification du 22 octobre 2026.
- Introduction, accueil, configurations Classique et Maracana : aucun nouveau design. Les propriétés des composants partagés conservent leurs anciens défauts.

## Vérification préalable de la Phase 2A

Cinq comparaisons supplémentaires dans preflight/ : une composition réellement enregistrée depuis chaque interface ; import Classique autorisé, noms et couleurs copiés, modification du formulaire puis réimport sans altérer la composition ; refus Maracana avec deux équipes et explication accessible. Portrait et paysage. Aucun écart significatif nécessitant une correction de la PR #7. Écarts mineurs observés : espace icône/texte 8 px contre 10 px, et anciennes couleurs propres au créateur natif. Le nouvel écran de création utilise maintenant les couleurs Lovable ; importer une ancienne composition conserve ses couleurs.

## Configurations raccordées

| Parcours | Comportements disponibles |
| --- | --- |
| Cup | 8 équipes, 10 min initiales, 2 poules et 2 qualifiés ; durée personnalisée ; temps/buts combinables ; répartition automatique ou selon l’ordre ; aller simple/retour ; meilleurs suivants ou tableau réduit ; départage explicite des égalités parfaites ; additionnel en poules ; petite finale ; prolongation, tirs au but, Golden goal ; durées par tour ; noms, 28 couleurs, ordre et import. |
| Survie | 8 équipes, 8 min initiales ; 2 à 32 équipes ; exemptions ; tirage aléatoire ou ordre manuel ; temps/buts ; départages ; petite finale conditionnelle ; durées par tour ; lancement manuel, immédiat ou après délai ; équipes et sons de séance effectifs. |
| Faire les équipes | Choix explicite nouvelle/reprise ; noms ou nombre (2–60), 2–8 équipes ; ajout, édition, suppression, doublons ; tirage équilibré ; déplacement manuel ; blocage des équipes vides ; noms/couleurs ; confirmation du remplacement ; sauvegarde après réussite de l’écriture ; reprise et import. |

Toutes les options affichées sont raccordées. Cup suit le réglage sonore global comme la référence, sans inventer de carte Sons locale. Le lancement automatique et après délai utilise le moteur à horodatages existant ; il reste piloté même hors de l’écran de match. Annuler un délai reste effectif après redémarrage.

Les nouvelles compétitions portent tournamentPolicy=lovable : répartition intercalée, ordre du tableau et politique de qualification de la référence. Les anciennes sauvegardes sans ce marqueur conservent leurs règles. Le classement et l’historique utilisent les mêmes critères de mini-classement que la qualification uniquement pour ces nouvelles Cup ; aucune refonte visuelle des résultats. Une Cup avec un seul qualifié termine sans inventer de finale.

## Sauvegardes et compositions

Le format de stockage des préférences garde sa clé existante, roundr.preferences.v1. L’enregistrement de la composition est sérialisé dans un seul JSON ; la confirmation de succès apparaît seulement après réussite de l’écriture. En cas d’échec, l’ancienne composition demeure et l’erreur de cette opération reste visible. Un changement de réglage sans rapport n’efface pas cette erreur. Lecture concurrente, sauvegardes rapprochées et modification de l’objet fourni sont testées.

Une valeur illisible ou invalide reste brute et bloque le remplacement tant qu’une relecture n’aboutit pas. Les compositions anciennes restent reprises/importables sans réécriture automatique ; une simple ancienne liste de joueurs peut être récupérée par un choix explicite, sans répartition inventée. Cette variante de compatibilité est couverte par les tests métier ; elle n’a pas de comparaison Lovable.

## Preuves visuelles et écarts

- 59 paires, soit 118 captures de cette phase ; plus 5 paires préalables Phase 2A.
- Portrait 390 × 844 et paysage 844 × 390 ; la carte de choix après enregistrement dispose d’une paire portrait supplémentaire. Les cas sont construits par interactions réelles, sans injection de stockage.
- Tous les champs comparés ont les mêmes valeurs. Mesures de cartes disponibles : écart maximal 0.063 px hors exception Golden goal. 0 paires n’ont pas de carte à mesurer ; les champs, états et images restent disponibles. Les captures paysage ont été reprises après la reconnexion du navigateur, puis contrôlées dans des planches comparatives pour éviter les images prises pendant un défilement.
- Golden goal : champ Durée de prolongation masqué dans Expo sur votre instruction. Lovable affichait une durée sans effet ; le premier but termine toujours le match, sans limite. Écart volontaire d’environ 66–67 px dans les cartes concernées selon le rendu du navigateur.
- Les boîtes de confirmation et de succès sont comparées en portrait et paysage ; mesure du panneau intérieur, pas du conteneur modal plein écran. Quelques dixièmes de pixel peuvent provenir de l’animation d’ouverture de la référence.
- Des écarts de lissage des textes et d’arrondi sous-pixel restent possibles entre DOM et React Native Web. Les relevés ne constituent pas une identité de pixels.
- Adaptations natives : zones sûres, défilement et clavier ; cibles tactiles élargies ; toucher un nom pour le modifier conserve la capacité native précédente. Les lecteurs d’écran et boutons de retour doivent encore être essayés sur téléphone.
- Le CTA de lancement conserve la navigation native vers le match prêt. La refonte du hub de tournoi et des écrans de match/résultat Lovable est hors de ce lot ; leur fidélité visuelle n’est pas déclarée validée ici.

## Contrôles exécutés

| Contrôle | Résultat obtenu |
| --- | --- |
| Tests métier et sauvegardes | 14 suites exécutées, code de sortie 0 ; les 12 suites antérieures restent dans le lanceur. |
| Syntaxe TypeScript | 89 fichiers app/src analysés, 0 erreur. |
| Types complets | tsc --noEmit, code 0. |
| Lint Expo app/src | expo lint -- --fix=false, code 0. |
| Lint ciblé renforcé | app/src + deux nouveaux tests + lanceur, --max-warnings 0 : code 0. |
| Export web | Export local réussi : entry-b367eea1eeb37fd1a6ab203bdf4a351d.js. |
| Export iOS | Export Hermes réussi : entry-7bfe28d5d8fac38955271a603688c79d.hbc. |
| Export Android | Export Hermes réussi : entry-b18c7fee655a1b68a32e302bcbf89462.hbc. |

Les journaux et codes de sortie sont dans controles/. Une première commande lint avec un séparateur incorrect a été rejetée ; la commande corrigée ci-dessus a ensuite réussi. Aucun masquage de règle. Le lint élargi historique « eslint . », qui annonçait 23 erreurs et 21 avertissements dans la Phase 2A, n’a pas été relancé ici : il ne faut pas interpréter le lint app/src comme la correction de cet ancien périmètre. Le workflow conserve les trois contrôles et ajoute seulement les déclencheurs de cette branche et des PR vers la Phase 2A.

Tests ajoutés : toutes les combinaisons Cup 4–32 équipes/poules/qualifiés, meilleurs suivants ON/OFF, égalités, exemptions, ordre du tableau, mini-classement nouveau et ancien, unique qualifié, prolongations/tirs au but/Golden goal, additionnel, durées par tour, sons Survie, lancement automatique/différé et reprise après erreur d’écriture. Compositions : noms/doublons/limites, tirage déterministe équilibré, déplacements, données anciennes conservées, JSON invalide/lecture impossible, échec d’écriture, erreurs persistantes, reprises et écritures concurrentes.

Essais interactifs réellement effectués : création, doublon, répartition par nombre, déplacement laissant une équipe vide, palette, annulation puis rechargement sans perte, validation et reprise après rechargement, édition/suppression abandonnées sans modifier la composition validée, import Cup/Survie de quatre équipes et réimport après modification. Les essais de lancement des moteurs sont automatisés ; aucun nouveau match complet n’est revendiqué testé par interaction sur téléphone.

## Recette sur iPhone et Android — reste à faire

1. Sur un appareil de test, ouvrir hors ligne une ancienne sauvegarde Cup/Survie ; vérifier ses règles, équipes et scores. Ne pas supprimer les données de l’application.
2. Faire les équipes : ajouter/éditer/retirer des noms, tester doublon, nombre de joueurs et d’équipes, tirage, déplacement vers une équipe vide puis correction ; vérifier clavier et défilement en portrait/paysage.
3. Enregistrer une composition, fermer complètement puis rouvrir hors ligne ; reprendre joueurs, noms et couleurs. Préparer une autre composition, annuler son remplacement, fermer/rouvrir et vérifier l’ancienne.
4. Importer dans Classique/Maracana avec un nombre compatible puis Cup/Survie ; renommer dans le formulaire et réimporter ; la composition enregistrée doit être intacte.
5. Cup : essayer poules, aller-retour, meilleurs suivants ON/OFF, égalité parfaite, petite finale et durées par tour. Survie : nombre non puissance de deux, exemptions et petite finale.
6. Essayer tirs au but, prolongation, Golden goal, temps et buts combinés. Vérifier sons Survie ON/OFF et réglage global Cup.
7. Délai avant match suivant : pause/reprise, annulation, départ immédiat, verrouillage et arrière-plan ; fermer et reprendre hors ligne, sans match ou score en double.
8. Vérifier zones sûres en paysage, boutons de confirmation accessibles, grand texte, VoiceOver/TalkBack, bouton Retour Android et interruptions audio.

Aucun appareil physique testé, aucun APK/IPA distribué, aucun build EAS payant ni publication. Les exports et captures web ne valident pas le comportement natif. Arrêt après Phase 2B pour votre validation.

## Fichiers applicatifs et workflow modifiés

- .github/workflows/roundr-checks.yml
- frontend/app/config/[mode].tsx
- frontend/app/standings.tsx
- frontend/app/team-builder.tsx
- frontend/scripts/run-domain-tests.cjs
- frontend/scripts/test-team-composition.ts
- frontend/scripts/test-tournament-phase2b.ts
- frontend/src/components/lovable/configuration.tsx
- frontend/src/components/lovable/history-summary.tsx
- frontend/src/components/lovable/phase2b-ui.tsx
- frontend/src/components/maracana-launch.tsx
- frontend/src/domain/bracket.ts
- frontend/src/domain/cup.ts
- frontend/src/domain/session.ts
- frontend/src/domain/standings.ts
- frontend/src/domain/summary.ts
- frontend/src/domain/team-maker.ts
- frontend/src/domain/types.ts
- frontend/src/domain/validate.ts
- frontend/src/features/lovable-team-maker.tsx
- frontend/src/features/tournament-config-state.ts
- frontend/src/features/tournament-configuration.tsx
- frontend/src/store/competition-history.ts
- frontend/src/store/preferences.ts
- frontend/src/store/session-store.ts
- frontend/src/store/storage-validation.ts

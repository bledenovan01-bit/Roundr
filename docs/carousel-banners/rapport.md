# Bannières du carrousel et non-régression

Base vérifiée : PR #16, branche `codex/roundr-ios-team-input-focus`, commit `5f0c96d5259d5a6530b7d589cd7777d1491e9527`. Branche corrective distincte : `codex/roundr-carousel-banners`. La version de référence n’est pas modifiée.

## Diagnostic reproduit avant correction

À 390 × 740, les alertes sont déjà présentes sur les vues Prochain match, Tournoi et Musique. Il n’existe pas de condition de déclenchement liée à la page sélectionnée.

Le défaut de visibilité est reproduit à 390 × 600, en avançant l’horloge vers une minute restante : sur Maracana, Cup et Survie, la bannière est à y=543,5, hauteur 36, alors que la zone défilante s’arrête vers y=512. Elle est montée, opaque, mais écrêtée puis recouverte par les commandes. Même le Chrono classique peut être partiellement coupé sur ce format. Un test qui vérifie seulement la présence DOM ne détecte pas ce problème.

Le nouveau test de géométrie échoue sur la référence. Les captures avant correction montrent ce défaut. Cette reproduction établit une cause liée à la hauteur disponible et au défilement ; elle ne démontre pas une restriction systématique aux seules vues chrono sur tous les appareils.

## Correctifs réalisés

- L’unique bannière active du match est rendue dans une zone commune au-dessus des commandes, hors du `ScrollView` et des pages du carrousel. La zone prend sa place dans le layout lorsqu’une alerte apparaît : elle ne recouvre pas les cartes et ne bloque pas les interactions.
- L’ancien espace réservé est conservé dans le contenu pour préserver le rendu sans alerte. Le composant Lovable, les textes, couleurs, animation, priorités, durée de 4 500 ms et conditions de déclenchement ne sont pas changés. En paysage à deux colonnes, la largeur de la colonne d’origine est conservée.
- Le décompte du Chrono libre utilise la même disposition commune. Les autres variantes ne reçoivent aucun nouvel événement.
- Les vrais clics automatisés ont révélé que la vue Tournoi pouvait recouvrir ses points de navigation : ceux-ci sont replacés au-dessus de ce contenu par le seul `zIndex`, sans modifier leurs dimensions ou positions.
- Le parcours pause/reprise a révélé une erreur Expo `The wake lock with tag roundr-free has not activated yet`. Le nettoyage libérait un verrou jamais demandé lorsque l’option de maintien d’écran était désactivée. Le hook commun possède désormais chaque demande : aucune libération sans acquisition, libération unique après acquisition tardive et tags distincts pour éviter une course entre deux effets. Les conditions d’activation restent `running && keepAwake`. Une indisponibilité d’acquisition conserve le comportement précédent ; une erreur de libération inattendue reste signalée dans la console.

Aucun changement du moteur chrono, des règles, scores, rotations, classements, départages, sauvegardes, fichiers sonores ou conditions audio. Aucune dépendance applicative, version Expo ou configuration EAS modifiée.

## Tests et automatisation

Les scripts existants sont complétés, sans nouvelle suite métier parallèle :

| Couverture | Contrôles |
| --- | --- |
| 25 suites existantes via `npm test` | Chronos, cinq modes, scores, rotations, groupes/classements, départages, stockage, alertes, sons, SVG et viewport mobile |
| `test-free-live-phase4b.ts` enrichi | Verrou désactivé, acquisition tardive/refusée, nettoyage unique, effets concurrents ; expiration des alertes à 4 500 ms et absence de rejeu déjà couvertes |
| Banc navigateur existant, mode `functional` | 36 combinaisons vue/orientation : classique, circulaire, prochain match, tournoi, musique et les trois vues du décompte libre ; 60 et 30 secondes sans attente réelle |
| Même banc, cinq parcours de commandes | Démarrage, score, pause, temps stable en pause, expiration de la bannière pendant la pause, rechargement sans réinjecter le scénario initial, reprise et fin |
| Banc de rendu existant | 78 écrans/états : configurations, matchs, résultats, tournois, archives, départage, les trois variantes libres et écrans communs ; erreurs de page/console et attributs SVG contrôlés |
| Banc mobile existant | Dix cas des cinq modes : clavier simulé, noms d’équipes, défilement, portrait/paysage, sauvegarde et rechargement |

L’horloge Playwright pilote Date, timers et animation frames. Les tests contrôlent les instants avant/après échéance, la visibilité réelle (rectangle dans le viewport, hors de tout ancêtre qui écrête, au-dessus des boutons), l’opacité et le caractère non bloquant. Ils changent de vue pendant la même alerte et vérifient sa conservation et l’absence de sélection automatique. Une rotation réelle du viewport est également exécutée pendant l’alerte sur la première vue de chaque mode.

Référence : [horloge Playwright](https://playwright.dev/docs/clock). Les cas utilisent des contextes isolés et des sauvegardes de test ; aucun stockage utilisateur n’est modifié. Aucun clic forcé, filtre de console ou masquage d’erreur ajouté.

### Exécution automatique après chaque correction

Le workflow existant `Roundr checks` couvre les branches `codex/**` et leurs PR. Il conserve les contrôles métier, TypeScript, ESLint et exports, puis ajoute un job navigateur :

1. Installation depuis le lockfile inchangé.
2. Playwright 1.62.1 dans un répertoire d’outils CI isolé, avec Chrome du runner ; aucune dépendance ajoutée à l’application.
3. Démarrage local d’Expo en développement, génération des fixtures et exécution des trois bancs existants.
4. Échec sur exception, erreur console, propriété SVG invalide ou assertion fonctionnelle.
5. Conservation des rapports, captures et logs dans l’artefact `roundr-web-regression`, même en échec. Les anciennes exécutions d’une même branche sont annulées quand une nouvelle version arrive.

Les vérifications matérielles ne sont pas remplacées par cette CI. Aucune compilation EAS, aucun déploiement ou fusion n’est déclenché.

### Rejouer localement

Après installation depuis le lockfile, lancer Expo depuis `frontend` : `npx expo start --web --host localhost --port 8098`. Depuis la racine du dépôt, utiliser Playwright comme outil externe :

```powershell
$env:PLAYWRIGHT_MODULE = 'CHEMIN_ABSOLU_VERS_PLAYWRIGHT'
node docs/svg-web-audit/reproduction/fixtures.cjs CHEMIN_FIXTURES.json
node docs/svg-web-audit/reproduction/browser.cjs http://localhost:8098 CHEMIN_FIXTURES.json RESULTATS_RENDU after
node docs/svg-web-audit/reproduction/browser.cjs http://localhost:8098 CHEMIN_FIXTURES.json RESULTATS_FONCTIONNELS functional
node docs/ios-team-focus/reproduction/focus-regression.cjs http://localhost:8098 RESULTATS_MOBILES
```

Le mode fonctionnel peut être ciblé avec `ROUNDR_CASE_FILTER` (expression régulière), utile pour rejouer uniquement un cas en échec. Sans cette variable, toute la matrice est exécutée.

## Résultats et preuves

Résultats locaux finaux : TypeScript, ESLint (zéro avertissement), `expo lint`, les 25 suites, le contrôle syntaxique, l’export local web/Android/iOS et `git diff --check` réussis. Les 36 scénarios d’alertes et les cinq parcours de commandes passent ; le banc de rendu compte 78 cas réussis et le banc de configurations mobiles dix cas réussis. Les neuf captures sans alerte sont identiques au pixel près à la référence. Les rapports des exécutions CI sont disponibles depuis la nouvelle PR, avec leurs artefacts ; ne pas confondre une exécution en cours avec un succès.

Preuves visuelles : [Prochain match avant](evidence/before-maracana-next.png), [Prochain match après](evidence/after-maracana-next.png), [Musique](evidence/after-classic-music.png), [Tournoi](evidence/after-cup-tournament.png), [Circulaire Survie](evidence/after-survie-ring.png), [Circulaire libre](evidence/after-free-circular.png), [Musique en paysage](evidence/after-landscape-music.png).

Les résultats finaux et les journaux exécutés sont consignés dans `evidence/`. Les captures sans alerte sont comparées à la référence. Les échecs de développement du banc ne sont pas présentés comme des validations : premier échec attendu sur la référence, interception des points Tournoi ensuite corrigée, séparation de l’échéance et du fondu dans l’horloge, puis erreur de verrou Expo corrigée. Le banc final n’utilise aucun contournement de ces erreurs.

Deux avertissements React Native préexistants restent visibles : `pointerEvents` sur certains composants RN et repli JS de `useNativeDriver`. Ils ne sont pas masqués ; les tests refusent les erreurs console.

## Recette iPhone minimale

La recette déjà validée sur les autres fonctionnalités n’est pas à refaire entièrement. Depuis une copie propre (ou après sauvegarde de vos modifications personnelles) : `git fetch origin`, puis `git switch --track origin/codex/roundr-carousel-banners`. Si la branche existe déjà, utiliser `git switch codex/roundr-carousel-banners` puis `git pull --ff-only`. Dans `frontend`, lancer `npx expo start --web --host lan` et ouvrir l’adresse IP locale du PC avec le port indiqué, sur le même Wi-Fi.

1. Sur une vue Musique, Prochain match ou Tournoi, vérifier une échéance : bannière entièrement lisible, puis changer de vue et toucher Pause pendant son affichage.
2. Refaire uniquement ce contrôle en vrai paysage puis retour portrait, avec le décompte libre si souhaité.
3. Pour le correctif Expo annexe : activer le maintien d’écran, démarrer puis mettre en pause, et vérifier le comportement réel de veille/permission sur l’iPhone.

Aucun appareil physique ou simulateur natif n’a été utilisé. Chrome de bureau avec émulation n’est pas Chrome iOS/WebKit. Les permissions système, la veille effective, le matériel audio, le clavier réel et les interruptions iOS restent des validations appareil ; aucune validation native iOS/Android n’est déclarée. La connexion du lecteur musical au téléphone n’est pas ajoutée par cette intervention.

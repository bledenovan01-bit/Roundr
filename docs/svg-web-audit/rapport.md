# Audit SVG web de Roundr

Audit réalisé sur la branche de la PR #16, à partir du commit utilisateur `569b60954445af0819607de608a480764ed9f3c2`. Cette PR reste en brouillon vers `codex/roundr-liaison-compte-expo`. Aucun changement de `main`, fusion ou build EAS.

## Inventaire et diagnostic

Recherche globale dans `frontend/app` et `frontend/src`, avec inventaire syntaxique des imports `react-native-svg`, de leurs alias et des balises SVG : 137 emplacements JSX (racines et primitives), répartis dans 12 fichiers utilisant effectivement des SVG. Le test final parcourt 115 fichiers source. Les 17 ressources SVG de `frontend/assets/figma` sont des documents XML/images, pas des composants JSX : leurs noms d’attributs avec tirets sont normaux et restent inchangés.

Les composants couverts par l’inventaire sont : `AnalogChrono`, `ChronoRing`, `LovableBackground`, `Mark`, les maillots et flèches de `ConfigTeams`, `FreeClock`, le maillot des résumés historiques, `LovableIcon`, `MatchIcon`, le chrono circulaire de match, `PhaseIcon`, `FreeIcon` et l’icône de passage d’intervalle de `LovableFreeLive`.

| Emplacement | Constat | Correction |
| --- | --- | --- |
| `components/lovable/history-summary.tsx` — `Jersey` | `accessible={false}` sur un SVG, utilisé notamment pour le champion archivé | Attribut natif conservé sur iOS/Android ; `aria-hidden` sur web |
| `components/lovable/phase2b-ui.tsx` — `PhaseIcon` | Même propriété native sur les icônes plus, fermeture et mélange | Même séparation par plateforme |
| `features/lovable-free-config.tsx` — `FreeIcon` | Même propriété sur les icônes du Chrono libre | Même séparation par plateforme |
| `features/lovable-free-live.tsx` — SVG « skip » des commandes | Même propriété lorsque les intervalles sont en cours | Même séparation par plateforme |
| `components/lovable/free-clock.tsx` — groupe circulaire, cercle de progression analogique et aiguille des secondes | Trois usages de `origin` : `react-native-svg` 15.15.4 génère `transform-origin`, nom de propriété invalide pour React DOM | Rotation SVG standard centrée sur web ; `rotation` et `origin` d’origine conservés sur natif |
| `components/lovable/background.tsx` — SVG du fond | Dépréciation `props.pointerEvents` dans RN Web | `style.pointerEvents` sur web ; propriété native `pointerEvents="none"` conservée |

`components/svg-compat.ts` contient les deux adaptations ciblées : `decorativeSvgAccessibility` et `svgRotation`. Les chemins, couleurs, épaisseurs, coordonnées, centres et angles ne sont pas modifiés.

Les propriétés `accessibilityElementsHidden` et `importantForAccessibility` trouvées dans les carrousels et l’introduction appartiennent à des `View`/`Animated.View`, pas à des SVG. Elles ne fuient pas dans les SVG DOM inspectés : aucun retrait de ces propriétés nécessaires au natif.

Le cadran analogique utilise `accessibilityRole="image"` et son libellé dynamique. RN Web les convertit correctement en `role="img"` et `aria-label="Cadran : …"` dans les captures DOM ; ils restent inchangés. Les corrections de `Mark`, `ConfigTeams.Jersey`, `MatchIcon` et de l’anneau de match déjà présentes dans `569b609` sont conservées.

Sources techniques vérifiées dans les dépendances installées : `react-native-svg/src/web/utils/prepare.ts`, `parseTransform.ts`, `WebShape.ts`, ainsi que `react-native-web` `createDOMProps` et les propriétés filtrées de `View`. Références : [dépôt officiel react-native-svg](https://github.com/software-mansion/react-native-svg), [accessibilité React Native](https://reactnative.dev/docs/accessibility).

## Vérifications navigateur

Chrome installé, serveur **Expo de développement**, avertissements activés. Les contextes sont isolés avec des sauvegardes de test valides générées via les fonctions du domaine ; aucune sauvegarde utilisateur n’est lue ou modifiée. L’horloge de test est figée pour des comparaisons reproductibles. Aucun remplacement de `console.error`, filtre LogBox ou autre masquage ajouté.

Un premier passage de 73 cas sur `569b609` a relevé les deux erreurs React DOM `accessible` et `transform-origin`. Une première navigation a dépassé les 30 secondes pendant la compilation initiale Metro ; le délai du banc a été adapté et le passage complet a ensuite réussi à collecter les diagnostics.

Après correction : **85 cas de développement**, zéro exception de page, zéro message `console.error`, zéro propriété native indésirable dans les SVG rendus.

| Périmètre | États effectivement parcourus |
| --- | --- |
| Match classique | Configuration avec personnalisation/palette, prêt, en cours, pause, mi-temps, résultat ; configuration paysage |
| Maracana | Configuration avec personnalisation/palette, prêt, en cours, pause, résultat/rotation ; configuration paysage |
| Cup | Configuration/palette, hub avec classements et tableau, match prêt/en cours/en pause, résultat, résumé interrompu et terminé, consultation des deux archives ; configuration paysage |
| Survie | Même couverture, plus départage ; configuration paysage |
| Chrono libre | Configurations chronomètre/décompte/intervalles ; états prêt/en cours/pause, fin pour décompte et intervalles, attente d’intervalle manuel ; affichages numérique/analogique/circulaire ; trois cas paysage |
| Écrans communs | Accueil, historique vide, équipes, composition, réglages, accueil Chrono libre et Mes chronos |

Les 73 cas initiaux sont complétés par cinq cas palmarès/départage et sept cas paysage. Ce parcours ne prétend pas tester chaque combinaison possible de règles métier : l’inventaire syntaxique couvre aussi les composants SVG non montés dans ces scénarios.

Le banc de la correction clavier précédente est également rejoué sur l’export corrigé : **10/10 cas**, cinq modes × portrait/paysage, avec défilement, réduction documentaire/visuelle et effective du viewport, saisie des deux noms, personnalisation off/on, rotation clavier simulé ouvert, lancement et rechargement. La logique d’orientation et les conditions de focus ne sont pas modifiées par cet audit.

### Avertissements restant visibles

Deux avertissements RN préexistants subsistent sur certains écrans : `Animated: useNativeDriver … falling back to JS` et `props.pointerEvents is deprecated` sur d’autres composants RN, dont des `View`. Le dernier n’est plus déclenché par le SVG du fond (configuration Classique/Maracana sans avertissement). Ils sont consignés intégralement, sans masquage ; leur traitement général dépasserait cet audit SVG. Aucun avertissement de propriété SVG React DOM ne subsiste dans les cas exécutés.

### Comparaison visuelle

Neuf paires de captures de développement : six sont entièrement identiques au pixel près. Les trois autres (Chrono libre) diffèrent uniquement dans la zone basse de la bannière d’erreur Expo présente avant correction et absente ensuite : 15 980 pixels chacun, tous sous y=760. La région applicative comparée au-dessus de la bannière est identique, y compris le cadran et son aiguille. Les captures intégrales sont conservées ; aucune bannière n’a été masquée pour produire ces preuves. Les formes SVG et styles du design restent inchangés.

## Vérifications automatiques

| Commande | Résultat |
| --- | --- |
| `tsc --noEmit` | Premier passage : erreur d’inférence du composant générique `G` avec le retour union de l’adaptateur. Retour explicitement typé avec les propriétés de `GProps`, puis relance réussie |
| ESLint `app src scripts/test-form-window-dimensions.ts scripts/test-svg-web.ts --max-warnings 0` | Réussi, y compris après l’ajustement de typage |
| Commande existante `expo lint` | Réussie |
| `node scripts/run-domain-tests.cjs` | Réussi : nouveau test SVG, test viewport, test audio et 22 suites existantes |
| `node scripts/check-syntax.cjs` | Réussi |
| `expo export --platform all` | Réussi, exports locaux web/Android/iOS, avec dossier temporaire Hermes dans le workspace. Aucune compilation native/EAS |
| `git diff --check` | Réussi |

Le nouveau test `scripts/test-svg-web.ts` est intégré à la commande de tests existante. Il analyse les balises SVG et leurs alias, y compris leurs primitives, et refuse les propriétés natives problématiques, `origin` non adapté, les noms JSX incorrects avec tirets et les spreads SVG non audités. Son propre détecteur est testé sur des contre-exemples. Il vérifie aussi les contrats web/iOS/Android de l’adaptateur : `accessible=false` natif conservé, ARIA web, rotations et pivots natifs inchangés.

Les journaux du premier TypeScript en échec et des relances sont conservés séparément. La correction finale du type est effacée à la compilation et ne change pas le JavaScript validé par le navigateur ni les tests métier.

## Rejouer et limites

Dans `frontend`, installer depuis le lockfile si nécessaire puis lancer `npx expo start --web --host localhost --port 8098`. Depuis la racine du dépôt, avec Playwright comme outil externe :

```powershell
node docs/svg-web-audit/reproduction/fixtures.cjs CHEMIN_VERS_FIXTURES.json
$env:PLAYWRIGHT_MODULE = 'CHEMIN_ABSOLU_VERS_PLAYWRIGHT'
node docs/svg-web-audit/reproduction/browser.cjs http://localhost:8098 CHEMIN_VERS_FIXTURES.json CHEMIN_VERS_RESULTATS after
```

`SVG_VIEWPORT='{"width":844,"height":390}'` permet une exécution paysage. Le script ne masque aucun message et échoue sur les exceptions, les erreurs console ou les attributs SVG natifs indésirables.

Preuves : inventaire avant correction, rapport compact des 85 cas, messages avant/après, journaux des commandes, captures et résultats du banc clavier dans `evidence/`. Les DOM complets locaux ayant servi à l’analyse restent dans `outputs/svg-audit` du workspace ; les données répétitives ne sont pas dupliquées dans Git.

Aucun test physique avec VoiceOver, TalkBack, Safari/iPhone ou Android n’a été effectué pour cet audit. L’accessibilité native est préservée par les branches de plateforme et vérifiée au niveau des propriétés, sans prétendre à une recette physique. Aucune dépendance, configuration Expo, règle métier, sauvegarde, minuterie, score ou ressource/condition audio modifiée.

# Focus des noms d’équipes sur le web mobile

> Historique de la première correction. Après test réel sur iPhone, le calcul d’orientation a été complété : lire [le diagnostic et les résultats actuels](complement-iphone.md). Les preuves ci-dessous décrivent le premier passage, dont la simulation de clavier était insuffisante.

## Base et périmètre

Base vérifiée : `codex/roundr-liaison-compte-expo`, commit `685907504a40a93d3dd8d8628fe9eef14baf5edf`.
Branche corrective : `codex/roundr-ios-team-input-focus`. PR en brouillon vers cette base ; aucune fusion, aucun build EAS.

## Diagnostic établi

Dans React Native Web 0.21.2 installé, `ScrollView._handleScroll` appelle `dismissKeyboard()` pour **tout** défilement lorsque `keyboardDismissMode="on-drag"`. Cela inclut un défilement automatique lors du focus. Sur l’export de la base, le test navigateur donne le focus au premier nom puis fait réellement défiler le conteneur de 24 px : l’input perd le focus. La trace passe par `_handleScroll`, `blurTextInput`, puis `HTMLElement.blur`. Le même élément DOM reste connecté : ce n’est pas un remontage de `ConfigTeams`.

Autre problème reproductible : RN Web calcule `Dimensions` à partir de `visualViewport`. En simulant uniquement une baisse de sa hauteur de 844 à 300, sans rotation du viewport de mise en page (390 × 844), les cartes Classique et Maracana passent de 350 à 169 px : le formulaire est considéré à tort en paysage.

L’inspection de `ConfigTeams`, `ToggleCard`, `useLovableConfigCards`, `LovableConfigFrame`, `features/lovable-config.tsx` et `app/config/[mode].tsx` confirme des clés stables et des champs contrôlés. `KeyboardAvoidingView` web ne réalise pas l’ajustement natif. Aucun changement de clé, remontage forcé, délai de focus ou autofocus n’est nécessaire.

Sources : [ScrollView RN Web 0.21.2](https://github.com/necolas/react-native-web/blob/0.21.2/packages/react-native-web/src/exports/ScrollView/index.js), ainsi que les sources `Dimensions` et `KeyboardAvoidingView` de cette version installée. Traces reproductibles dans `evidence/baseline-diagnosis.json`.

**Limite :** ces deux mécanismes sont démontrés dans Chrome avec émulation tactile. L’enchaînement exact du clavier logiciel de Chrome iOS reste à confirmer sur un véritable iPhone. Aucun iPhone physique, simulateur iOS ou appareil Android n’a été utilisé.

## Correctif

- `configuration.tsx` : conserver le clavier pendant les défilements web (`none`) ; garder `on-drag` sur Android/iOS natifs. Utiliser les dimensions du viewport de mise en page pour les colonnes et boutons du formulaire.
- `phase2b-ui.tsx` : même correction dans le conteneur partagé par Cup, Survie et Chrono libre. Le défaut de perte de focus a aussi été reproduit avant correction sur Cup et Survie ; les cinq modes sont vérifiés après correction. Maracana utilise déjà le conteneur de Classique.
- `use-form-window-dimensions.ts` : réutiliser la souscription RN aux changements de dimensions, mais lire `document.documentElement.clientWidth/clientHeight` sur le web. Une vraie rotation reste prise en compte ; SSR et natif gardent exactement les dimensions RN.
- `test-form-window-dimensions.ts` et `run-domain-tests.cjs` : couverture ciblée clavier, zoom, rotation, SSR et branches natives, intégrée à la commande de tests existante.

Aucune déclaration de style, règle métier, sauvegarde, ressource sonore, correction SVG, dépendance ou configuration Expo n’est modifiée. Les callbacks de saisie et de lancement sont inchangés.

## Vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| TypeScript `tsc --noEmit` | Réussi |
| ESLint `app src scripts/test-form-window-dimensions.ts --max-warnings 0` | Réussi |
| Commande existante `expo lint` | Réussi |
| `node scripts/run-domain-tests.cjs` | Réussi : nouveau test, test audio existant et 22 suites existantes |
| `node scripts/check-syntax.cjs` | Réussi |
| `expo export --platform all` | Réussi pour web, Android et iOS ; export seulement, sans compilation native/EAS |
| Chrome tactile, cinq modes × 390 × 844 et 844 × 390 | 10/10 scénarios réussis |
| Comparaison avant/après sans clavier | 10/10 paires : géométrie et fichiers PNG identiques |

Chaque scénario navigateur vérifie : focus par toucher, maintien après défilement réel, même nœud et même largeur après réduction simulée du visualViewport, effacement/remplacement/saisie caractère par caractère des deux noms, passage d’un champ à l’autre, désactivation/réactivation de la personnalisation, vraie rotation du viewport, lancement et noms dans le stockage réel, puis rechargement. Aucune erreur JavaScript de page relevée.

Historique des essais du banc navigateur : une première assertion de défilement du Chrono libre a échoué parce que deux équipes ne rendent pas son formulaire défilable en portrait ; le scénario utilise désormais huit équipes. Un essai du raccourci de sélection `ControlOrMeta+A` n’a pas effacé un champ en émulation mobile paysage ; l’effacement utilise désormais `fill('')`, suivi de saisie caractère par caractère et d’assertions de focus. Ces échecs du banc ont été corrigés avant le passage complet final, sans modification supplémentaire du code applicatif.

Les journaux, résultats JSON et captures sont dans `evidence/`. Les captures de réduction du viewport **ne représentent pas un clavier iOS réel**. Les captures au repos comparent la base à ce correctif ; la maquette Lovable n’a pas été réimportée ni modifiée.

## Rejouer la non-régression navigateur

Depuis `frontend`, exporter avec `npx expo export --platform web --output-dir ../.web-focus-test`, puis depuis la racine du dépôt :

```powershell
$env:PLAYWRIGHT_MODULE = 'CHEMIN_ABSOLU_VERS_PLAYWRIGHT'
node docs/ios-team-focus/reproduction/focus-regression.cjs .web-focus-test .focus-results
```

Playwright est un outil de QA externe : aucune dépendance ajoutée à l’application. Chrome installé est utilisé par défaut (`PLAYWRIGHT_CHANNEL` permet de changer de canal). Le serveur de test ne se lie qu’à `127.0.0.1` et utilise des contextes/stockages jetables.

La validation physique est détaillée dans [test-iphone.md](test-iphone.md).

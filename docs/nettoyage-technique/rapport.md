# Nettoyage technique avant le premier build natif

Base : `4580aef` (PR #23). Branche : `codex/roundr-technical-cleanup`.
Aucun build EAS, aucune soumission Apple. Aucun changement fonctionnel ou visuel.

## Méthode

Pour chaque dépendance directe, quatre vérifications :
1. Imports dans `app`, `src`, `modules`, `scripts`, `metro.config.js`.
2. Présence dans les plugins de `app.json`.
3. Besoin déclaré (dépendance ou pair) par chacun des paquets installés.
4. Chargement par le code d'Expo, d'Expo Router, de Metro ou de `babel-preset-expo`.

Un paquet n'est retiré que si les quatre sont négatifs, ou si son seul usage est lui-même un code mort démontré.

## Dépendances supprimées

| Paquet | Justification |
| --- | --- |
| `expo-secure-store` et son plugin | Importé uniquement par `src/utils/storage`, que rien n'importe. **Source du texte Face ID, désormais absent** |
| `expo-sharing` et son plugin | Aucun import, aucun besoin indirect. Roundr n'a pas de fonction de partage |
| `expo-web-browser` et son plugin | Aucun import, aucun besoin indirect. Le lien GitHub utilise `Linking` |
| `expo-blur` | Aucun import, aucun besoin indirect |
| `react-native-view-shot` | Aucun import, aucun besoin indirect |
| `date-fns`, `dayjs` | Aucun import, aucun besoin indirect |
| `react-native-dotenv` | Plugin Babel jamais configuré : aucun `babel.config.js`, aucun import |
| `@tanstack/react-query` | Seul un `QueryClientProvider` existait ; aucune requête dans l'application |

`yarn.lock` : uniquement des retraits, plus le regroupement d'un sélecteur existant.

## Dépendances conservées malgré l'absence d'import direct

| Paquet | Justification |
| --- | --- |
| `expo-linking`, `expo-constants` | Pairs obligatoires d'`expo-router` |
| `expo-asset` | Dépendance d'Expo et pair d'`expo-audio`, plugin configuré |
| `expo-symbols` | Bibliothèque optionnelle chargée par `expo-router` |
| `expo-system-ui` | Natif : applique `userInterfaceStyle` et la couleur de fond racine |
| `react-native-webview` | Référencé par le module DOM d'Expo. Non utilisé par Roundr, mais conservé par prudence, à réévaluer |
| `@expo/dom-webview`, `@expo/log-box`, `@expo/metro-runtime` | Dépendances d'Expo |
| `react-native-screens`, `react-native-reanimated`, `react-native-worklets` | Requis par Expo Router ou entre eux |
| `@react-native-vector-icons/common` | Dépendance des icônes Material |
| `react-dom`, `react-native-web` | Export web et régression web de la CI |
| `@babel/core`, `@babel/runtime`, `@react-native/metro-config` | Outils de compilation requis |

## Héritage Emergent supprimé

| Élément | Justification |
| --- | --- |
| `.emergent/` | Tâches internes d'Emergent, avec une adresse interne dans un dépôt public |
| `.gitconfig` | Auteur Git d'Emergent |
| `backend/`, `tests/` | Serveur Python modèle inutilisé par l'application, et son test vide |
| `test_result.md`, `test_reports/` | Rapports de l'agent de test Emergent, référencés seulement dans l'historique de `memory/PRD.md` |
| `design_guidelines.json` | Ancienne charte (orange), remplacée par Lovable |
| `frontend/scripts/cmd-guard*`, `install-guard.sh`, `sync-shims.sh`, script `preinstall` | Garde d'installation propre à l'environnement Emergent (`/opt/install-guard`) |
| `frontend/scripts/reset-project.js` et son script | Modèle Expo qui déplacerait les écrans de Roundr |
| `frontend/constants/testIds/` | Identifiants d'un agent de test, aucun import |
| `frontend/src/utils/storage/`, `frontend/src/query-client.ts` | Code mort |
| `react-logo*`, `partial-react-logo`, `app-image`, `pitch-night` | Images sans référence |
| `frontend/README.md` | Modèle générique ; le `README.md` racine est réécrit |

L'historique Git conserve ces fichiers : il n'a pas été réécrit.

## Conservé volontairement

- `memory/` et `plan/` : cahier des charges et plan du projet.
- `docs/` : historique des recettes, y compris ses mentions d'Emergent et de fichiers retirés.
- `.gitignore` : ses entrées héritées sont sans effet sur l'application et protègent contre des ajouts accidentels.

## Vérifications

| Contrôle | Résultat |
| --- | --- |
| `npm test`, types, lint, syntaxe | Réussis |
| `yarn install --frozen-lockfile` | À jour |
| Expo Doctor, `expo install --check` | 20/20, à jour |
| Export Android, iOS, web | Réussi, aucune mention d'Emergent |
| Ressources exportées, comparées à `9bcbfb7` | **Identiques** : iOS 56 fichiers, Android 60, dont les 7 sons, polices et images. Les noms sont des empreintes de contenu |
| Code JavaScript iOS exporté | 5 183 164 → 5 047 363 octets |
| Autolinking iOS | Modules `roundr-music` et `roundr-spotify-remote` présents, 5 modules natifs retirés |
| Profils EAS `preview`, `production`, `testflight-spotify` | Résolus, Spotify activé uniquement sur le dernier |
| Permissions iOS | Musique uniquement ; Face ID absent |
| Identifiant, schéma, chiffrement | Inchangés par rapport à la PR #23 |
| Compilation iOS | Assurée par la CI, avec et sans Spotify |

Le seul fichier d'interface modifié est `app/_layout.tsx`, pour retirer le fournisseur React Query sans requête. Chronomètres, tournois, sons, sauvegardes et écrans n'ont pas changé ; les suites automatiques les couvrent.

**Non résolu :** les permissions Android de stockage externe subsistent après le retrait d'`expo-sharing`. Elles n'en proviennent donc pas et n'ont pas d'incidence sur iOS. Android est hors V0.

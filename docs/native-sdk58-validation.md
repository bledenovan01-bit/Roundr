# Vérifications de reprise — 3 novembre 2026

Base vérifiée : PR #19, `96334be9f844091ee474ef1d37cf2341e636e5c1`. Les têtes des PR #16/#17/#18 sont présentes dans son ascendance. Les quatre PR sont ouvertes et en brouillon. `main` constatée à `94489163f0bb0792af090abba860d3dc50c28427` ; aucune modification ni fusion demandée ou effectuée sur main.

## Correction nécessaire depuis la dernière CI

La CI du commit de base est réussie : [Roundr checks n°57](https://github.com/bledenovan01-bit/Roundr/actions/runs/40588835172). Ses résultats du 27 octobre ne remplacent pas les nouveaux contrôles locaux ci-dessous.

L'installation initiale Yarn 1.22.22 figée a réussi sous Node 22.23.3. Tests, syntaxe, types, lint et introspection Expo passent sur la base. En revanche, Expo Doctor actuel retourne 19/20 et `expo install --check` échoue : 14 correctifs SDK 58 sont désormais recommandés. Aucune exclusion de contrôle ajoutée.

Correction appliquée avec `expo install --fix`, puis alignement de la résolution `react-native-screens` sur `~4.30.1`, du pair `@expo/log-box` sur `~58.0.15` et de `@react-native/metro-config` sur `0.88.1`. Expo ajoute son plugin `expo-asset`. Le lockfile Yarn est régénéré ; une nouvelle installation figée réussit. Expo installé : 58.0.22 ; React Native : 0.88.1 ; Router : 58.0.29 ; React reste 19.3.0.

Les avertissements temporaires de pairs LogBox apparus pendant `--fix` sont corrigés par cet alignement. Le dernier install figé n'en émet pas. Aucun module majeur supplémentaire, règle métier ou changement de style n'est introduit.

## Contrôles locaux après correction

| Contrôle réellement exécuté | Résultat |
| --- | --- |
| Yarn 1.22.22 `install --frozen-lockfile` | Code 0, lockfile à jour |
| `npm run test:syntax` (script existant) | Code 0 |
| `npm test` (runner existant, 25 suites) | Code 0, notamment persistance/migrations, chronos, scores, rotations, alertes, SVG, clavier et audio |
| TypeScript `--noEmit` | Code 0 |
| `expo lint` | Code 0, sans avertissement de lint |
| `expo install --check`, en ligne | Code 0, dépendances à jour |
| Expo Doctor 1.21.5, en ligne | Code 0, 20/20 |
| Expo config public / introspect | Code 0 sur les deux ; identifiants et champs iOS/Android introspectés identiques à la base |
| `expo export --platform all --max-workers 2` | Code 0, bundle web et bytecode Hermes Android/iOS |
| Sept WAV sources et export | SHA-256 conformes au manifeste et aux empreintes approuvées |
| EAS whoami / project:info | Compte propriétaire `denoevans`, projet `@denoevans/roundr`, UUID conforme |
| EAS config Android / iOS preview | Code 0 sur les deux, APK / IPA physique Release interne, images SDK 58 |
| EAS build:list, lecture seule | Un ancien APK SDK 57 terminé ; aucun nouveau build lancé |
| `git diff --check` | Code 0 |

Le premier export local sans progression visible a été interrompu (non validé). La relance finale à deux workers avec accès local adapté a réussi. Les avertissements Node de coexistence `NO_COLOR`/`FORCE_COLOR` restent visibles ; ils ne sont pas des erreurs d'export et n'ont pas été masqués.

Le code `frontend/app` et `frontend/src`, les sept WAV et leur manifeste sont inchangés par rapport à la tête de PR #19. L'identité sonore et le routage restent ceux de #18 : B1 V2 2,40 s, fin P2, double Hint avec 160 ms, E1 sans événement. Aucun nouveau test navigateur ni comparaison visuelle locale n'est déclaré ici pour les correctifs ; le workflow existant les exécute sur la branche après enregistrement. La CI de base, ses 78 rendus, 41 cas fonctionnels, dix configurations et 36 aperçus restent des résultats historiques distincts.

## Limites avant build et publication

- Aucun APK/IPA SDK 58 signé, build EAS, envoi store ou test physique n'a été exécuté. Les exports ne prouvent pas la compilation native ni le comportement réel.
- Compte Expo et projet accessibles, mais forfait/quota restant/facturation non vérifiés. Aucun coût n'est engagé.
- Android conserve `com.bledenovan.roundr.recette`, déjà utilisé par l'APK antérieur (versionCode 1). La clé doit être conservée et sa compatibilité vérifiée avant mise à jour ; pas de désinstallation ou nouvelle clé par défaut.
- iOS conserve `com.emergent.demoprevue.vnvemd`. Disponibilité dans l'équipe Apple, adhésion, droits, certificat de distribution et profil ad hoc/UDID non vérifiés. Ne pas en déduire une disponibilité de publication.
- Version 1.0.0 et autoIncrement=false conservés. Préparer explicitement les numéros nécessaires au parcours retenu ; aucun profil store n'est ajouté.
- Le guide historique SDK 57 reste archivé dans le dépôt avec un avertissement et un lien vers le [guide actuel](native-sdk58.md).

L'assistant peut effectuer les contrôles, préparer les corrections, gérer les commandes et accompagner l'installation. Les seules interventions requises sont l'accord de build/budget, les décisions d'identité/compte Apple, les authentifications du propriétaire et les manipulations/écoutes sur vrais appareils. Voir [le guide opérationnel](native-sdk58.md).

# Migration Roundr vers Expo SDK 58

Base : PR A identité sonore définitive, codex/roundr-sound-identity-final, commit 0980518659c9a031e56b05b2e67e1233807d5aca. Branche : codex/roundr-expo-sdk58. PR empilée ; #16, #17 et main restent inchangées.

## Versions et installation

Expo 58.0.20, React Native 0.88.0, React/React DOM 19.3.0, Expo Router 58.0.27, expo-audio 58.0.10, react-native-svg 15.16.0, expo-keep-awake 58.0.3. AsyncStorage reste 2.2.0. Les autres modules sont alignés sur le bundledNativeModules.json de la version officielle Expo 58.0.20, puis vérifiés avec expo install --fix (Dependencies are up to date). Le lockfile Yarn est mis à jour et une installation frozen-lockfile a réussi. Node local 24.22.1 ; la CI utilise Node 22, compatible avec le minimum Expo 22.13.

Méthode : [skill officiel expo-upgrade](https://github.com/expo/skills/blob/main/plugins/expo/skills/expo-upgrade/SKILL.md), [migration 57 vers 58](https://expo.dev/blog/how-to-upgrade-to-sdk-58), [release notes SDK58](https://expo.dev/changelog/sdk-58). L’application utilise CNG : aucun dossier android/ios versionné, aucun prebuild nécessaire pour ces exports et aucun build natif lancé. Pas d’activation du compilateur React, de changement d’Hermes ou de remplacement du stockage sans nécessité.

## Adaptations nécessaires

- API TypeScript stricte RN : le wrapper Alert expose seulement ses deux méthodes avec Pick, sans prétendre être un constructeur ; la référence de carrousel utilise ScrollViewInstance ; le helper de styles remplace l’ancien namespace StyleSheet.NamedStyles par son équivalent mappé à partir des types publics ViewStyle/TextStyle/ImageStyle. Aucun changement de code métier ou de styles calculés. Pas d’opt-out vers les anciens types RN.
- Les pairs requis sont déclarés directement : @expo/log-box, @expo/dom-webview, @babel/core, @babel/runtime et @react-native/metro-config pour Router/Worklets et leurs dépendances. Aucun ajout de fonctionnalité LogBox, de webview ou de lecteur musical.
- La résolution forcée react-native-screens est alignée sur 4.30.0. Les anciennes résolutions forcées de postcss, plugin-kit et js-yaml incompatibles avec les nouvelles plages sont retirées. ESLint reste dans sa majeure 9, mis à jour de 9.25.0 à 9.39.5 ; config Expo 58 et Doctor 1.21.5. Yarn signale que la majeure ESLint 9 n’est plus maintenue ; elle reste compatible avec l’outillage Expo/TypeScript installé. Ce statut n’est pas masqué.
- SDK58 active par défaut les routes web asynchrones : asyncRoutes.web=false conserve le chargement monolithique SDK57. web.output reste explicitement single ; aucun passage au rendu serveur. Le Stack sans en-tête et le SafeAreaProvider applicatif restent conservés. Les correctifs SVG, focus et orientation ne sont pas modifiés.
- EAS preview utilise maintenant les images sdk-58 Android et iOS. distribution=internal, developmentClient=false et android.buildType=apk restent inchangés : profil APK autonome, sans Expo Go ni serveur de développement. Aucun appel EAS ni changement des comptes, projectId, identifiants d’application ou signature.

## Conservation de l’application

Les sept fichiers sonores, le manifeste et le routage sont identiques à la PR A : B1 reste la V2 exacte, E1 reste sans déclenchement. Aucune modification de src/domain, src/store, préférences, migrations, règles, chronos, scores ou réglages audio. Les clés et schémas de sauvegarde sont préservés.

Le lecteur musical interne reste le panneau « Contrôle musical indisponible » validé auparavant ; la migration ne crée aucune connexion au lecteur du téléphone. Les bruitages gardent mixWithOthers et l’absence de lecture d’arrière-plan. Les limites de volume programmatique et d’autoplay sur navigateur iPhone restent des contrôles appareil ; elles ne sont pas présentées comme corrigées par le SDK.

## Vérifications

Sur l’installation finale propre : TypeScript --noEmit, syntaxe des 116 fichiers, ESLint du périmètre Expo sans avertissement, les 25 suites métier/audio/stockage, Expo Doctor 20/20 et exports locaux web/Android/iOS réussis. Les sept WAV dans l’export ont chacun l’empreinte approuvée. Résumé et intégrité dans checks.json et export-audio-integrity.json.

Les bancs existants sont rejoués contre l’export web final : 78 rendus, 41 scénarios d’alertes/commandes à horloge contrôlée, dix configurations mobiles et 36 aperçus audio. Le workflow reprend aussi ces matrices contre le serveur de développement et ajoute Expo Doctor. Les résultats finaux sont consignés dans la description de la PR, les artefacts CI et les rapports de tests ; une exécution en cours n’est pas présentée comme réussie. La comparaison visuelle reprend les neuf captures représentatives de la branche sonore SDK57.

Commandes : npm run typecheck ; npm run lint ; npm run test:syntax ; npm test ; npx expo-doctor ; npx expo export --platform all. Bancs navigateur et paramètres : docs/carousel-banners/rapport.md ; mode audio du banc docs/svg-web-audit/reproduction/browser.cjs. Les outils de navigateur sont isolés, hors dépendances applicatives.

## Échecs initiaux, corrigés ou exclus du bilan final

Le premier TypeScript SDK58 a relevé les changements d’API ci-dessus : corrigés, puis vérification relancée sans erreur. Une tentative d’installation d’outillage avec Metro encore actif a échoué sur le verrou Windows de lightningcss, laissant un arbre incomplet ; l’export suivant ne trouvait plus AppQuery et le premier banc de rendu a relevé un HTTP500. Cette installation a été mise de côté, une nouvelle installation propre a été effectuée dans un dossier isolé, le lockfile figé a été contrôlé, puis les vérifications ont été rejouées. Ces essais et le banc fonctionnel interrompu ne constituent pas des validations finales. Aucun message console n’a été masqué.

## Vérifications natives avant publication

Les exports produisent des bundles JS/Hermes, pas des APK/IPA compilés ni des tests physiques. Vérifier Android et iPhone réels : sons/volume/Bluetooth, musique externe et interruptions, pause/reprise/veille, vrai clavier et rotation/safe areas. SDK58 apporte le cycle de vie UIScene iOS et R8 par défaut en release Android : ces aspects doivent être vérifiés sur la future compilation. Le projet iOS conserve son identifiant existant ; sa signature et son identité de publication restent à confirmer avant distribution. Aucun build EAS, aucune dépense de build ni fusion effectuée.

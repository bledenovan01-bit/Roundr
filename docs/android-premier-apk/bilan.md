# Finalisation des prérequis Android — SDK 57

Base exacte : `739fc950d274ef3a20ce057a4a2dd870ee4f8ecb` de la PR #14.
Branche dédiée : `codex/roundr-android-prerequisites-57`.
Le guide à exécuter personnellement est [ici](guide-compte-expo.md).

## Changements appliqués

| Élément | Avant | Après |
|---|---|---|
| expo | 57.0.30 | 57.0.31 |
| expo-router | 57.0.28 | 57.0.29 |
| expo-sharing déclaré | ~57.0.19, verrou 57.0.23 | 57.0.24 exact |
| android.package | com.emergent.demoprevue.vnvemd | com.bledenovan.roundr.recette |

Le verrou Yarn a été régénéré à partir du verrou existant, puis contrôlé.
Il ajuste les trois paquets et leurs dépendances nécessaires, notamment les
outils/config-plugins Expo, modules-core/JSI, Router Server, Expo UI et xcode.
La dépendance xcode 4 est requise par le nouveau config-plugins ; il ne s'agit
pas d'une préparation ou d'un build iOS. Les sélecteurs de quelques entrées du
verrou sont regroupés sans changement de version. Aucune mise à jour générale,
aucun changement de React/React Native et aucun passage en SDK 58.

Les notes officielles d'[Expo 57.0.31](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/CHANGELOG.md)
et de [Sharing 57.0.24](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-sharing/CHANGELOG.md)
n'annoncent pas de changement visible. [Router 57.0.29](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-router/CHANGELOG.md)
corrige des comportements de navigation et de typage ; les contrôles ont été
relancés avec cette version réelle, et non les anciennes dépendances locales.

Les seuls fichiers applicatifs modifiés sont `frontend/package.json`,
`frontend/yarn.lock` et `frontend/app.json`. Le dernier ne change que le package
Android (plus sa fin de ligne finale). Le nom, les icônes, le slug, le scheme,
l'identifiant iOS et tout le code de Roundr restent conservés. Les fichiers WAV,
leurs correspondances et les mécanismes de sauvegarde ne sont pas modifiés.

Le nouveau package utilise un stockage Android indépendant. Il ne reprend pas
automatiquement les données de l'ancienne app ni du navigateur ; ne pas
désinstaller l'ancienne application pour installer celle de recette.

## Vérifications

| Contrôle exécuté | Résultat final |
|---|---|
| TypeScript | Réussi |
| ESLint app/src et test audio, --max-warnings 0 | Réussi, aucun avertissement |
| 22 suites existantes + contrôle audio | Réussi |
| Analyse syntaxique | Réussie |
| Vérification des dépendances Expo | Réussie |
| Expo Doctor 1.21.5 | 21/21, sortie 0 |
| Export JavaScript/ressources Android, iOS et web | Réussi |
| Écrans accueil/configurations des cinq modes, portrait/paysage | 12 chargements réussis, aucune erreur JavaScript |

Les contrôles ne détectent aucune régression dans leur périmètre. Les 215
fichiers frontend de la base sont comparés : 212 sont conservés, et seuls les
trois fichiers autorisés diffèrent. Les sept WAV sont vérifiés par empreinte
dans chacun des deux exports natifs.

Les journaux complets et codes de sortie sont dans `verification/results.json`
et les fichiers voisins. Les commandes couvrent TypeScript, ESLint app/src et
le test audio sans avertissement autorisé, analyse syntaxique, toutes les suites
existantes plus le test audio, `expo install --check`, Expo Doctor 1.21.5 et
l'export JavaScript/ressources des trois plateformes. L'export ne compile pas
d'APK et ne lance aucun job EAS.

Avant correction, le diagnostic de préparation était 20/21. Après correction,
**Expo Doctor 1.21.5 donne 21/21, code de sortie 0** et la vérification des
versions réussit. Aucun avertissement Doctor n'a été masqué ou exclu.

L'installation isolée a d'abord été interrompue après un blocage réseau. Une
reprise avec le cache local et le registre npm public a réussi. Yarn émet des
avertissements sur les résolutions/peers hérités ; ils ne sont pas présentés
comme des erreurs ESLint ni comme un Doctor en échec. Une réinstallation
`--frozen-lockfile` a également réussi dans le checkout de travail pour éviter
de laisser les anciennes dépendances installées. Aucun échec de test n'a été
observé pendant cette intervention ; les résultats finaux restent la référence.

`scope-proof.json` compare la copie de validation au checkout et les fichiers
protégés au commit de base, avec normalisation CRLF pour les textes. Il vérifie
que les sept WAV inchangés sont représentés dans les exports Android et iOS.
Les deux sifflets identiques restent dédupliqués par Metro.

## Profil preview et compte

`frontend/eas.json` reste identique au commit de base. Sa résolution Android
avec le schéma EAS 25.2.0 confirme :

- distribution interne ; `developmentClient: false` ; `buildType: apk` ;
- image `sdk-57` ; ressources `medium` ; environnement `preview` ;
- signature distante par défaut ; aucun keystore créé ou récupéré ;
- `requireCommit: true` et `autoIncrement: false` inchangés.

Ce profil vise un APK autonome avec ressources embarquées, sans Expo Go ni
serveur Metro. [Référence officielle APK](https://docs.expo.dev/build-reference/apk/).

`owner` et `extra.eas.projectId` restent absents : aucune identité fictive ni
liaison au compte de l'agent. Le propriétaire renseigne son nom public après sa
connexion personnelle ; `eas init` créera/liera son propre projet et écrira
l'UUID réel. Le guide détaille cette procédure, la vérification du quota, le
commit local de liaison et la commande de build à lancer plus tard.

## Limites et arrêt

Aucune authentification, lecture de session personnelle, génération de clé,
demande de build, dépense ou fusion n'a été réalisée. Aucun changement sur main.
Les contrôles locaux détectent des régressions automatisables ; ils ne prouvent
pas l'absence de tout problème natif. L'APK réel, la signature, l'installation,
le rendu, les interruptions et les sons sur téléphone restent à valider après
le build que vous choisirez de lancer vous-même.

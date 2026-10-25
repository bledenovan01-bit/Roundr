# Roundr — connecter votre compte Expo et lancer vous-même le premier APK

La branche `codex/roundr-android-prerequisites-57` part exactement de
`739fc950d274ef3a20ce057a4a2dd870ee4f8ecb` (PR #14). Elle prépare les trois
correctifs SDK 57 et le package Android `com.bledenovan.roundr.recette`.
Les sons et le code fonctionnel de Roundr sont conservés.

**Aucune connexion, liaison de projet, signature ou demande de build n'a été
effectuée pour vous.** Vous réalisez les étapes suivantes sur votre PC. Ne
copiez pas toutes les commandes à la fois : vérifiez chaque résultat.

## 1. Préparer le PC et récupérer la bonne branche

Installer Git pour Windows et Node.js 22 à jour (au moins 22.13.x). Ouvrir
PowerShell et vérifier `git --version`, `node --version` et `npm.cmd --version`.
Android Studio et Expo Go ne sont pas nécessaires pour ce parcours EAS cloud.

Pour éviter les anciennes dépendances de votre autre copie, utiliser un nouveau
dossier. S'il existe déjà, choisir un autre nom, sans l'effacer :

```powershell
cd "$HOME\Documents"
git clone --branch codex/roundr-android-prerequisites-57 --single-branch https://github.com/bledenovan01-bit/Roundr.git Roundr-Android-Prerequis
cd Roundr-Android-Prerequis
git branch --show-current
git log -3 --oneline
git switch -c codex/roundr-liaison-compte-expo
cd frontend
npx.cmd --yes yarn@1.22.22 install --frozen-lockfile
```

Le nom de branche lu avant la création de votre branche locale doit être
`codex/roundr-android-prerequisites-57`. Cette nouvelle branche locale servira
uniquement à enregistrer votre liaison de compte. Ne travaillez pas sur main.

L'installation doit réussir sans modifier yarn.lock. Ne pas lancer de migration
SDK, `expo install --fix` ou installation npm du frontend. Les avertissements
Yarn ne valent pas validation des contrôles ; si une commande échoue, garder
le message et arrêter pour comprendre.

## 2. Créer ou identifier votre compte Expo

1. Ouvrir [expo.dev](https://expo.dev/) dans votre navigateur.
2. Si vous n'avez pas de compte, choisir la création de compte et suivre les
   instructions du site. Confirmer votre adresse email si demandé.
3. Vous connecter vous-même. Ne communiquer aucun mot de passe ou code de
   connexion dans le chat ni dans ce document.
4. Dans votre profil, repérer votre **nom public de compte**. Ce nom, et non votre
   adresse email ou un mot de passe, sera la valeur `owner` du projet.
5. Pour cette première recette, utiliser votre compte personnel, ou une
   organisation dont vous avez explicitement les droits de création/build.

Ne souscrire aucun abonnement ni achat simplement pour suivre ce guide. Le
quota et les conditions du compte seront vérifiés avant le build.

## 3. Authentifier personnellement le terminal

Depuis `frontend` :

```powershell
npx.cmd --yes eas-cli@25.2.0 login
npx.cmd --yes eas-cli@25.2.0 whoami
```

Accomplir l'authentification uniquement dans le navigateur ou l'interface
officielle du CLI. `whoami` doit afficher votre compte public. S'il affiche un
autre compte, ne pas continuer ; vous pouvez utiliser le CLI `logout`, puis
vous reconnecter personnellement au bon compte.

Ne pas utiliser une commande contenant un mot de passe, exporter un jeton dans
le chat, enregistrer l'écran de connexion ou lire/copier un fichier de session.
Aucune de ces opérations n'est nécessaire au guide.

## 4. Définir le propriétaire public et créer votre projet EAS

Le package Android est **déjà préparé** : ne pas le modifier.
Les champs `owner` et `extra.eas.projectId` sont laissés absents afin de ne pas
inventer votre compte ni lier le dépôt au compte de quelqu'un d'autre.

Ouvrir `frontend/app.json`. Dans l'objet `expo`, ajouter uniquement votre
propriétaire public réel, par exemple :

```json
"owner": "VOTRE_NOM_PUBLIC_EXPO",
```

Remplacer cette valeur d'exemple par votre nom public. Garder les autres champs
et les virgules JSON valides. Le `slug` actuel reste `frontend` : le projet
s'affichera donc sous la forme **@votre-compte/frontend**. Ce nom générique ne
le relie pas à Emergent ; l'identité EAS dépend du propriétaire et du projectId.
Aucun renommage de slug ou de scheme n'est requis pour ce premier APK.

Lancer ensuite :

```powershell
npx.cmd --yes eas-cli@25.2.0 init
npx.cmd --yes eas-cli@25.2.0 project:info
```

Dans les questions d'`init`, vérifier le propriétaire et choisir la création
d'un **nouveau projet sous votre compte**. Si un projet `frontend` existe déjà,
ne pas le réutiliser sans vérifier son identité ; annuler en cas de doute pour
choisir un nouveau slug de recette distinct, puis recommencer.
Ne pas utiliser `--force` ni un UUID provenant d'Emergent.

Le CLI écrit l'UUID réel dans `extra.eas.projectId`. Ne pas inventer cet UUID.
Vérifier avec `project:info` puis dans le tableau de bord Expo que le projet
appartient bien à votre compte. Créer/lier le projet ne lance pas de build.

Ne pas lancer `eas build:configure` pour remplacer le profil existant. Ne pas
utiliser `eas update:configure`, EAS Submit ou une publication Play Store.

## 5. Vérifier et enregistrer la liaison

```powershell
npx.cmd expo config --type public
git diff -- app.json eas.json package.json yarn.lock
```

Vérifier ces éléments :

- `owner` est votre compte et `extra.eas.projectId` est le nouveau projet.
- `android.package` vaut `com.bledenovan.roundr.recette`.
- `expo` reste dans SDK 57 ; `eas.json` et les sons n'ont pas changé.
- Le diff de cette étape ne contient que votre liaison de compte. Si le CLI a
  fait autre chose, examiner le changement avant de continuer.

Enregistrer le fichier :

```powershell
git add app.json
git commit -m "chore: link Roundr Android preview to my Expo account"
git status --short
git rev-parse HEAD
```

`git status --short` doit être vide. Si Git demande votre nom et votre email
d'auteur, terminer sa configuration personnelle puis recommencer le commit.
Ce ne sont pas vos identifiants Expo. Noter le commit obtenu pour la recette.
La configuration impose `requireCommit: true`. Aucun push sur main ni fusion
de PR n'est nécessaire pour construire depuis votre branche locale propre.

## 6. Derniers contrôles et autorisation personnelle du build

```powershell
npx.cmd expo install --check
npx.cmd --yes expo-doctor@1.21.5 --verbose
npx.cmd --yes yarn@1.22.22 typecheck
npx.cmd --yes yarn@1.22.22 lint
npx.cmd --yes yarn@1.22.22 test
```

Les contrôles doivent réussir. Les recommandations distantes peuvent évoluer :
si un nouveau problème apparaît, ne pas lancer de correction globale ni passer
à SDK 58 pour faire disparaître l'avertissement.

Dans votre tableau de bord Expo, ouvrir les informations d'utilisation et de
facturation du compte propriétaire. Vérifier le quota disponible et les
éventuelles conditions de paiement. La présente préparation n'a vérifié ni
acheté de quota. Ne pas accepter un paiement inattendu.

Avant le build, valider personnellement :

- [ ] C'est mon compte, le bon projet et le package de recette indépendant.
- [ ] Les contrôles passent et le commit de liaison est enregistré.
- [ ] J'accepte la consommation de quota et tout coût éventuel affiché.
- [ ] J'autorise un nouveau keystore Android géré par EAS pour ce package.

Ne pas réutiliser ou remplacer une signature Emergent. Pour les futures mises
à jour de cette même app de recette, conserver le package et la clé générée.
Ne mettre aucun keystore ou mot de passe de signature dans Git ou dans le chat.

## 7. Lancer vous-même le premier APK, uniquement après ces validations

Toujours depuis `frontend`, la commande est :

```powershell
npx.cmd --yes eas-cli@25.2.0 build --platform android --profile preview
```

**C'est cette commande qui demande le build et peut consommer du quota. Elle
n'a pas été exécutée pendant la préparation.** Vérifier le compte/package dans
le récapitulatif. À la question de signature, choisir le nouveau keystore géré
par EAS seulement si vous venez de le valider.

Attendre le statut réussi sur le lien de build fourni. Télécharger le fichier
`.apk`, pas un `.aab`. En cas d'erreur, conserver le lien et les messages utiles
sans secrets ; ne pas relancer en boucle ni changer de SDK.

## 8. Installer et commencer la recette

1. Ouvrir le lien d'installation EAS personnel sur le téléphone Android.
2. Télécharger l'APK puis l'ouvrir depuis Téléchargements.
3. Si Android le demande, autoriser temporairement l'installation depuis ce
   navigateur/gestionnaire de fichiers. Ne pas désactiver globalement la sécurité.
4. Installer puis ouvrir Roundr. Révoquer ensuite cette autorisation temporaire
   si vous l'avez accordée.
5. Garder l'ancienne application : le nouveau package a ses propres sauvegardes.
   Les données Emergent ou navigateur ne sont pas migrées automatiquement.
6. Après téléchargement, éteindre le PC et tester l'app en mode avion : elle
   doit fonctionner sans Expo Go, sans serveur Metro et sans Emergent.

Utiliser la checklist Android fournie lors de la préparation précédente. Le
réglage `developmentClient: false`, la distribution interne et le type APK
restent ceux du profil `preview`. Les résultats natifs seront établis par ce
premier build et vos tests, pas par les seuls exports locaux.

Références officielles : [premier build](https://docs.expo.dev/build/setup/),
[CLI EAS et liaison](https://docs.expo.dev/eas/cli/),
[APK](https://docs.expo.dev/build-reference/apk/),
[signature gérée](https://docs.expo.dev/app-signing/managed-credentials/).

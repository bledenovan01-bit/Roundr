# Roundr — préparer et installer les versions de test natives

Préparation du 18 octobre 2026. Base exacte : `62e8c13214746562a26369bda260d1e8d5adce4e`.
Branche : `codex/roundr-native-preview`, issue de la branche de la PR #5, sans fusion dans `main`.

## Diagnostic et décisions avant de construire

La base utilise Expo SDK 57 (`expo` 57.0.19), React Native 0.86.3, React 19.2.3 et Expo Router 57.0.18. Cette préparation aligne 16 dépendances Expo sur les correctifs recommandés du même SDK, dont Expo 57.0.30 et Router 57.0.28 ; React et React Native restent identiques. Les modules natifs comprennent notamment AsyncStorage, l'audio, les vibrations, le partage, Reanimated et SecureStore. Les dossiers natifs `ios/` et `android/` ne sont pas présents : c'est un projet Expo avec génération native par prebuild. EAS peut effectuer cette étape sur ses machines Linux et macOS. Une compilation iOS dans le cloud peut être demandée depuis Windows ; elle nécessite toutefois la signature Apple appropriée. [Infrastructure EAS](https://docs.expo.dev/build-reference/infrastructure/).

La configuration préparée dans `frontend/eas.json` demande un build de prévisualisation autonome en mode Release, distribué en interne : APK Android et IPA iOS pour appareils physiques. Le JavaScript et les ressources sont embarqués ; aucun serveur Metro n'est nécessaire pour utiliser cette version. Il ne s'agit pas d'un build Expo Go. [Versions internes autonomes](https://docs.expo.dev/tutorial/eas/internal-distribution-builds/).

### Héritage Emergent à traiter

| Élément constaté | Conséquence et action avant le premier build |
| --- | --- |
| Identifiants Android et iOS : `com.emergent.demoprevue.vnvemd` | Identité de démonstration. Confirmer la propriété et l'accès à la signature ; sinon choisir ensemble une identité de test disponible. Aucun identifiant de remplacement n'a été inventé. |
| Slug et schéma de liens : `frontend` | Noms génériques. Choisir des valeurs liées au compte propriétaire ; vérifier les liens avant changement. Ce ne sont pas des mots de passe. |
| Aucun `owner` ni `extra.eas.projectId` dans `app.json` | Aucun projet EAS n'est explicitement lié dans le dépôt. Vérifier le projet du compte utilisé avec Emergent avant d'en créer un autre. |
| Gestionnaire déclaré : Yarn 1.22.22, sans lockfile dans la base | Ajout de `frontend/yarn.lock`, installation figée et nouveaux contrôles. La première résolution révélait des modules natifs en double ; les correctifs Expo et une résolution unique de `react-native-screens` 4.26.2 les traitent sans mettre à niveau ce dernier. |
| Hook `preinstall` et scripts `/opt/...` hérités | Le hook appelle désormais explicitement Node pour fonctionner aussi sous Windows. Les règles existantes sont conservées ; les chemins `/opt` sont ceux de l'ancien environnement, avec des règles intégrées de secours. Aucun shim système n'a été installé. |
| Fichier `.gitconfig` suivi, auteur Emergent ; README de démarrage générique | Métadonnées de l'ancien outil, pas une obligation pour EAS. Ne pas lancer le script `reset-project` du README : il réorganiserait les écrans. |
| Permissions natives générées | Audio : microphone Android/iOS et service audio Android ; SecureStore : description Face ID ; partage : stockage Android limité aux anciennes versions. Leur présence ne prouve pas qu'une autorisation est demandée à l'ouverture. Prévoir une revue avant diffusion plus large ; cette préparation ne change pas les fonctions audio/partage. |

Les sources de l'application examinées ne nécessitent pas de serveur Emergent ni de variable d'API pour les chronos et sauvegardes. Les liens « signaler un problème » et « retour » ouvrent GitHub et nécessitent Internet. Aucune connexion ni aucun secret n'a été lu ou ajouté pour cette préparation.

### Protéger les sauvegardes déjà présentes

Les clés de stockage et leur code restent ceux du commit de base. Cela ne constitue pas un mécanisme de transfert entre applications :

- Une application avec un nouvel identifiant possède ses propres données. Elle ne récupère pas automatiquement celles d'Expo Go, du site Lovable, d'une autre app ou d'un autre téléphone.
- Pour mettre à jour une installation Android existante, il faut conserver le package et une signature compatible, et vérifier le numéro de version déjà installé. Une nouvelle clé avec le même package peut empêcher la mise à jour.
- Sur iOS, il faut vérifier l'identité, l'équipe Apple et le profil de signature compatibles avec l'installation précédente.
- Ne pas désinstaller l'ancienne application ni effacer ses données pour contourner une erreur d'installation. Ne pas remplacer sa clé de signature. Si la continuité ne peut pas être établie, garder l'ancienne installation et tester sur un autre appareil ou avec une identité distincte, sans promettre le transfert de ses données.

Sources : [signature Android](https://docs.expo.dev/app-signing/app-credentials/), [variantes d'application](https://docs.expo.dev/build-reference/variants/).

## Comptes, signature et coûts

Le propriétaire indique disposer d'un compte Expo utilisé avec Emergent et ne pas avoir d'abonnement Apple Developer payant. Roundr a été utilisé uniquement dans Expo Go ou le navigateur : aucune installation native à mettre à jour n'a été signalée. Les données de ces environnements doivent être conservées ; la nouvelle application native démarrera avec son propre stockage. L'accès réel au projet et son quota n'ont pas été consultés.

| Parcours | Prérequis | Frais et limites à vérifier |
| --- | --- | --- |
| Android, recommandé en premier | Compte Expo contrôlé, projet EAS lié, identifiant validé, clé de signature conservée | Pas de compte Google Play nécessaire pour l'APK. Expo annonce jusqu'à 15 builds Android et 15 iOS par mois en offre Free, avec file d'attente moins prioritaire. Vérifier le quota du compte ; un compte payant peut facturer l'usage. |
| iPhone, IPA ad hoc via EAS | Même préparation Expo, abonnement Apple Developer actif, droits sur l'identifiant, certificat de distribution et profil contenant l'UDID de chaque iPhone | Apple annonce 99 USD/an, montant local à vérifier. Le quota Expo est distinct de l'abonnement Apple. Le profil n'autorise que les appareils enregistrés et a une date d'expiration. |
| iPhone sans abonnement payant | Mac compatible, Xcode et compte Apple personnel, compilation/signature locale | Parcours distinct, non préparé par `eas.json`. Les profils gratuits expirent après 7 jours ; il faut reconstruire/réinstaller. Expo Go peut aider à explorer l'interface mais ne valide pas l'IPA autonome. |

Sources vérifiées : [tarifs Expo](https://expo.dev/pricing), [compte Apple et limites gratuites](https://developer.apple.com/help/account/basics/about-your-developer-account), [adhésion Apple](https://developer.apple.com/programs/enroll/), [signature ad hoc](https://docs.expo.dev/build/internal-distribution/).

**Décisions nécessaires :** confirmer qui contrôle le compte/projet Expo, puis valider les nouveaux identifiants et la signature de l'application de test. Ne pas reprendre l'identifiant Emergent sans vérifier qu'il est disponible sous le compte propriétaire. Pour iOS, choisir entre l'abonnement Apple, le parcours Mac limité ou le report de ce test. Aucune souscription, connexion, création de projet, génération de certificat ou compilation distante n'a été effectuée.

## Guide pas à pas après ces décisions

Les commandes ci-dessous sont des instructions pour une étape ultérieure. Les commandes EAS ne doivent être exécutées qu'après validation des identités, des données à conserver et du budget. S'arrêter si un outil propose un abonnement, un achat ou une signature de remplacement inattendue.

### 1. Ouvrir la bonne version sur l'ordinateur

Prévoir un téléphone Android 7 ou plus récent, ou un iPhone sous iOS 16.4 ou plus récent, selon les minima annoncés pour Expo SDK 57. Pour le parcours iOS local alternatif, Expo indique Xcode 26.4 ou plus récent : vérifier aussi la compatibilité du Mac. Les dépendances de l'app restent à confirmer par l'installation réelle sur les modèles visés. [Compatibilité du SDK 57](https://docs.expo.dev/versions/latest/).

Installer Git et Node LTS (minimum annoncé pour ce SDK : 22.13.x ; les contrôles locaux utilisent Node 24.19.0 et GitHub utilise Node 22). Ouvrir PowerShell dans le dépôt local Roundr. Ne pas utiliser un autre dossier contenant une ancienne copie.

```powershell
git status --short
git switch codex/roundr-native-preview
git merge-base --is-ancestor 62e8c13214746562a26369bda260d1e8d5adce4e HEAD
cd frontend
```

Si la première commande affiche des modifications personnelles ou si la vérification d'ancêtre échoue, faire vérifier le dossier avant de continuer. Ne pas réinitialiser les fichiers. L'application Expo est dans `frontend`, pas à la racine du dépôt.

### 2. Installer et vérifier sans lancer de build

```powershell
npx --yes yarn@1.22.22 install --frozen-lockfile
npx expo install --check
npx expo-doctor
npm test
npm run test:syntax
npm run typecheck
npx eslint app src --no-cache
npx expo export --platform all
```

Le lockfile fourni doit être présent avant l'installation figée. Les 16 écarts correctifs repérés dans la base ont été traités dans cette branche : si de nouveaux écarts sont signalés plus tard, les faire examiner avant `expo install --fix` et relancer les contrôles. Ne pas supprimer les avertissements avec une exclusion. Les exports produisent des paquets JavaScript, pas des fichiers APK/IPA signés.

### 3. Relier le projet au bon compte Expo

Dans le navigateur, ouvrir son propre compte sur [expo.dev](https://expo.dev), vérifier le projet utilisé avec Emergent, les droits d'accès et la rubrique de facturation/consommation. Le nom visible « Roundr » ne suffit pas à identifier le bon projet.

Après validation, depuis `frontend` :

```powershell
npx --yes eas-cli@25.2.0 login
npx --yes eas-cli@25.2.0 whoami
npx --yes eas-cli@25.2.0 init
```

Saisir les mots de passe et codes de sécurité uniquement dans les écrans officiels. `init` doit relier le projet EAS validé, ou créer un projet sous le compte confirmé si aucun n'existe. Ne pas choisir un projet Emergent inaccessible par défaut. Faire revoir les modifications de `app.json` : compte propriétaire, nom de projet, ID EAS réellement attribué et identifiants natifs validés. Conserver le profil `preview` fourni, puis enregistrer ces changements sur cette branche. `requireCommit` exige un état Git propre avant compilation.

Le profil utilise l'environnement EAS `preview` : vérifier aussi les variables déjà configurées dans le projet distant. Aucun secret d'exécution n'est nécessaire aux chronos. Ne pas copier des identifiants de connexion dans `app.json`, `eas.json`, GitHub ou un message.

### 4. Construire puis installer sur Android

Vérifier le quota gratuit ou obtenir un accord sur le coût avant cette commande. Pour une app existante, faire sélectionner sa clé conservée ; ne pas accepter une nouvelle clé sans vérifier les conséquences sur les données.

```powershell
npx --yes eas-cli@25.2.0 build --platform android --profile preview
```

Attendre la réussite du build. Sur le téléphone Android, ouvrir le lien d'installation donné par Expo, télécharger l'APK puis accepter l'installation depuis ce navigateur si Android le demande. Lancer Roundr avec son icône. Si Android signale une signature incompatible ou une version trop ancienne, arrêter et conserver l'application existante.

Internet est nécessaire au téléchargement, puis l'application doit pouvoir démarrer en mode avion. Aucun serveur de développement ne doit tourner sur l'ordinateur. Aucun envoi sur Google Play n'est demandé.

### 5. Construire puis installer sur iPhone, si l'abonnement est choisi

Ne pas exécuter cette étape avec le seul compte Apple gratuit. Une fois l'adhésion active et les identifiants validés :

```powershell
npx --yes eas-cli@25.2.0 device:create
```

Choisir l'enregistrement par lien, ouvrir le lien sur l'iPhone dans Safari et suivre les instructions pour enregistrer l'appareil. Répéter pour chaque iPhone à tester. L'UDID identifie l'appareil : ne pas le publier dans GitHub.

Après accord sur le quota/coût :

```powershell
npx --yes eas-cli@25.2.0 build --platform ios --profile preview
```

Dans les écrans officiels, sélectionner l'équipe Apple confirmée et les appareils enregistrés. Faire vérifier la signature proposée avant de créer/remplacer un certificat. Après réussite, ouvrir le lien Expo dans Safari sur un iPhone inclus dans le profil et installer l'application. Une IPA de simulateur ne fonctionnerait pas sur l'iPhone ; le profil fourni demande bien un appareil physique.

Sous iOS 16 et suivants, activer le mode développeur si nécessaire dans Réglages → Confidentialité et sécurité → Mode développeur, redémarrer et confirmer. Si l'option manque, suivre le guide Expo après avoir installé le build. [Mode développeur iOS](https://docs.expo.dev/guides/ios-developer-mode/).

Un nouvel iPhone ajouté après la construction doit être inclus dans un nouveau profil : prévoir une nouvelle compilation ou une nouvelle signature du build existant, avec revue préalable du coût. Aucun passage par TestFlight ni publication App Store n'est prévu ici.

### 6. Limiter le partage et identifier le build

Les liens internes Expo peuvent être accessibles à toute personne qui les possède. Dans les réglages du projet, désactiver « Unauthenticated access to internal builds » pour demander une connexion Expo autorisée, puis inviter les testeurs appropriés. Ne pas partager de certificats ni de clé Android.

Noter pour chaque installation : lien/ID du build EAS, commit, identifiant natif, version, date, modèle du téléphone et version Android/iOS. Vérifier que le build contient bien la branche issue de `62e8c13`. Aucune automatisation de build, de soumission ou de mise à jour à distance n'est ajoutée.

### 7. Recette sur les deux téléphones

1. **Démarrage hors ligne :** lancer une fois, fermer l'application, couper Wi-Fi et réseau mobile, relancer avec l'icône. Les écrans, polices et sons embarqués doivent être disponibles.
2. **Reprise :** lancer un chrono, laisser passer du temps, fermer complètement puis rouvrir hors ligne. Vérifier la progression fondée sur les horodatages. Essayer aussi une séance en pause et un compte à rebours arrivant à son terme pendant la fermeture.
3. **Tours :** enregistrer plusieurs tours dans le chronomètre, mettre en pause, fermer et reprendre. Comparer la liste et les valeurs. Tester séparément les scores dans une séance compatible avec des équipes.
4. **Scores :** saisir des scores, fermer/rouvrir, vérifier les deux équipes et les valeurs. Vérifier également les rotations et le fonctionnement d'un match.
5. **Remplacement annulé :** depuis une séance non terminée avec progression, tours ou scores, demander un nouveau chronomètre, compte à rebours, intervalles puis préréglage. Annuler chaque fois. La séance, ses valeurs et sa sauvegarde après relance doivent rester identiques.
6. **Remplacement confirmé :** confirmer un remplacement, fermer et relancer. La nouvelle séance doit être retrouvée. Si une erreur de sauvegarde apparaît, la relever ; ne pas considérer le remplacement comme validé sur la seule fermeture de la fenêtre.
7. **Anciens Custom :** uniquement sur une installation de test contenant réellement des presets anciens, mettre à jour avec une identité/signature compatibles sans désinstaller. Vérifier les anciens Custom, les chronos migrés et l'absence de doublons après deux relances. Si une récupération est proposée pour un ancien marqueur ambigu, refuser d'abord et vérifier qu'aucun chrono n'est recréé silencieusement, puis tester la récupération explicite. Sans données anciennes disponibles, noter ce test « non exécuté » ; ne pas effacer les données du téléphone pour fabriquer ce cas.
8. **Vie réelle :** écran verrouillé, retour après plusieurs minutes, rotation, volume, mode silencieux, partage et retour après interruption. Relever le comportement sonore en arrière-plan sans supposer que le système laisse l'app tourner. Les annonces internes existantes ne constituent pas une garantie de notifications système en arrière-plan.

Les échecs d'écriture et les données invalides sont couverts par les tests automatisés de stockage ; cette recette ne prétend pas provoquer de façon fiable ces pannes sur un téléphone. Une reprise sur stockage déjà invalidé exige un appareil/données de test dédiés. Voir aussi [la recette de fiabilité des sauvegardes](storage-reliability.md).

## Résultats de cette préparation

Les contrôles ont été exécutés sur une copie isolée des sources et de l'installation Yarn verrouillée, sous Windows et Node 24.19.0. Les dossiers natifs générés dans cette copie ne sont pas ajoutés au dépôt.

| Contrôle exécuté | Résultat |
| --- | --- |
| Installation Yarn 1.22.22 `--frozen-lockfile --offline`, scripts actifs | Réussie, code 0 |
| `expo install --check`, références en ligne | Réussi, code 0 : versions à jour pour ce SDK |
| Expo Doctor 1.19.8, références en ligne | 20/20 contrôles, code 0 ; doublons natifs éliminés |
| `eas.json` lu et profils Android/iOS résolus par `@expo/eas-json` 25.2.0 | Réussi, code 0 ; distribution interne, APK et iOS Release physique |
| Configuration Expo `--type introspect` | Réussie, code 0, plugins Android et iOS évalués en mémoire |
| 8 scripts de tests métier, dont 24 scénarios de fiabilité des sauvegardes | Réussis, code 0 |
| Vérification syntaxique | 69 fichiers TypeScript, 0 erreur, code 0 |
| TypeScript `tsc --noEmit` | Réussi, code 0 |
| ESLint `app src --no-cache` | Réussi, code 0, sans erreur ni avertissement sur ce périmètre |
| Export `expo export --platform all --clear` | Réussi, code 0 : web et bytecode Hermes Android/iOS générés |
| `expo prebuild --no-install --platform all`, copie isolée | Réussi pour Android, code 0. Sur Windows, la CLI a généré uniquement Android ; aucun projet iOS ni compilation Xcode n'a été validé |
| YAML du workflow et ajout du déclenchement sur cette branche | Analyse locale réussie ; jobs existants conservés, installations applicatives figées sur Yarn |
| Sources `frontend/app`, `frontend/src` et `frontend/app.json` comparées au commit de base | Identiques ; règles métier, écrans, clés de sauvegarde et identifiants préservés |
| APK/IPA signés, installation et tests sur appareils | Non exécutés |

Le premier essai d'export dans cette session a échoué car Hermes ne pouvait pas écrire dans le répertoire temporaire du bac à sable Windows. Le nouvel essai a utilisé un répertoire temporaire autorisé sous `work/` et a réussi avec génération Hermes ; aucun moteur n'a été désactivé pour contourner cet échec.

Yarn émet encore des avertissements de résolutions héritées (notamment PostCSS, UUID, plugin-kit et js-yaml) et de dépendances homologues. Ils ne sont pas masqués. Les contrôles ci-dessus passent avec cette installation ; ces avertissements restent une dette technique à revoir. Les 16 mises à jour correctives et le verrouillage changent l'ensemble des dépendances résolues : la recette sur appareils reste nécessaire même si les sources métier sont identiques.

Le workflow GitHub conserve ses tests, son contrôle des types, son lint et ses exports. Il n'appelle ni EAS Build ni EAS Submit. Le résultat des exécutions GitHub éventuelles est à consulter séparément ; les résultats locaux ci-dessus ne sont pas une affirmation de réussite CI.

**Pour continuer :** valider le compte/projet Expo et l'identité de l'application de test, vérifier le quota/coût, puis demander d'abord l'APK Android. Pour l'IPA ad hoc, obtenir en plus un abonnement Apple actif et enregistrer les iPhones. Aucune construction distante n'a été lancée et aucune publication sur les stores n'est configurée.

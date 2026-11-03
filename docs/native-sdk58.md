# Roundr — préparation des tests natifs SDK 58

État du 3 novembre 2026. Reprise de la PR #19, branche `codex/roundr-expo-sdk58`, commit de référence `96334be9f844091ee474ef1d37cf2341e636e5c1`. Les têtes des PR #16 (`5f0c96d`), #17 (`7473ddc`) et #18 (`0980518`) sont ses ancêtres. Aucune fusion nécessaire pour tester cet ensemble sur cette branche.

Ce guide remplace les instructions opérationnelles SDK 57 de `native-preview.md`, conservées comme historique. Aucun build EAS ni publication n'est autorisé par ce document.

## Identité et configuration conservées

| Élément | Valeur vérifiée |
| --- | --- |
| Compte Expo connecté | `denoevans`, rôle propriétaire |
| Projet distant | `@denoevans/roundr` |
| projectId local et distant | `fb2a6c2e-7e12-41ef-bdb6-9c3ebca1a23a` |
| Android | `com.bledenovan.roundr.recette` |
| iOS | `com.emergent.demoprevue.vnvemd` |
| Version applicative | `1.0.0` |
| Schéma de liens | `frontend`, historique conservé |
| Profil EAS | `preview`, interne, autonome, sans development client |
| Android preview | APK, image `sdk-58`, ressource `medium` |
| iOS preview | appareil physique, Release, image `sdk-58`, ressource `medium` |
| Versions / signature | source locale, auto-incrémentation désactivée, signature distante par défaut |

La lecture du projet distant et du profil Android a réussi, sans liaison ni création de projet. Aucune variable Plain text/Sensitive n'est configurée dans l'environnement EAS preview selon la résolution du profil ; aucune valeur secrète n'a été demandée. Les images `sdk-58` existent pour les deux plateformes dans la [documentation Expo](https://docs.expo.dev/build-reference/infrastructure/).

## Android : préserver l'installation existante

L'historique EAS consulté contient un APK interne terminé le 25 octobre 2026 : `e59d7bbd-3bc4-4d72-91dd-ddfa32c62ed1`, SDK 57, commit `4418a7a3eb978ca0f2ad8d20ce341ed66c2067b8`, package `com.bledenovan.roundr.recette`, version `1.0.0`, versionCode `1`. Ce n'est pas un build de la PR #19. Aucun nouveau build n'a été lancé.

Avant la prochaine compilation, vérifier la clé distante existante et la conserver. Ne pas créer une clé de remplacement pour contourner une erreur. Vérifier si l'APK est installé et s'il faut augmenter explicitement versionCode au-delà de 1 pour le parcours de mise à jour choisi ; ne pas désinstaller l'app pour contourner un échec. L'identifiant `recette` convient au projet de test existant mais ne constitue pas une décision d'identité de publication.

Un APK interne peut être installé sans compte Google Play. Un futur déploiement Play Store nécessitera sa propre préparation (identité définitive, AAB, versionCode croissant, signature et compte Play). Aucun profil production/submit n'a été ajouté.

## iPhone : prérequis réels

L'identifiant Emergent est conservé ; sa disponibilité dans l'équipe Apple du propriétaire n'est pas établie. Le contrôle d'accès Expo ne prouve pas l'accès Apple. Aucun build iOS n'apparaît dans la liste distante consultée ; l'état du compte Apple, des certificats et des profils n'a pas été vérifié.

Le parcours EAS interne sur iPhone exige une adhésion Apple Developer active, une équipe avec les droits nécessaires, un certificat de distribution et un profil ad hoc incluant chaque UDID. Seuls les appareils inclus peuvent installer l'IPA. L'ajout d'un appareil nécessite une nouvelle signature ou compilation adaptée. Voir [distribution interne Expo](https://docs.expo.dev/build/internal-distribution/) et [signature Apple](https://docs.expo.dev/app-signing/app-credentials/).

Sans adhésion payante, le parcours local avec compte personnel utilise un Mac/Xcode et des profils gratuits limités dans le temps ; il ne remplace pas l'IPA EAS ad hoc ni TestFlight. Voir les [limites du compte Apple](https://developer.apple.com/help/account/basics/about-your-developer-account). Windows permet de demander une compilation cloud après accord mais ne permet pas ici de compiler/valider Xcode localement.

## Vérifications sans build

Depuis `frontend`, utiliser Node 22 récent et Yarn 1.22.22. Le lockfile doit rester figé à l'installation :

```powershell
npx --yes yarn@1.22.22 install --frozen-lockfile
npm run test:syntax
npm test
npm run typecheck
npm run lint
npx expo install --check
npx expo-doctor
npx expo config --type introspect
npx expo export --platform all --max-workers 2
```

L'introspection évalue les plugins sans générer de dossiers natifs. Un export JS/Hermes ne compile pas d'APK/IPA. Le microphone et l'audio en arrière-plan sont désactivés dans la configuration expo-audio ; les permissions finales de tous les modules devront aussi être vérifiées dans les artefacts natifs.

## Séquence réservée à un accord explicite de build

Ces commandes sont préparées pour l'assistant ; l'utilisateur n'a pas à exécuter PowerShell. Elles ne doivent pas être lancées au titre de cette préparation.

1. Revalider la tête distante, le diff, le commit exact à construire et un état Git propre (`requireCommit=true`). Enregistrer les corrections nécessaires sur cette seule branche avant compilation. Ne pas utiliser `main` ni une réinitialisation forcée.
2. Vérifier dans le compte Expo le forfait, le quota restant et tout risque de facturation. La tarification publique ne prouve pas le quota du compte. Aucun engagement payant sans accord explicite.
3. Android : vérifier la clé existante, l'installation à préserver et la version, puis, uniquement après accord pour ce build :

```powershell
npx --yes eas-cli@25.2.0 build --platform android --profile preview
```

4. iOS : confirmer équipe, identité, adhésion, certificat et iPhones. Après autorisation de cet enregistrement, accompagner l'utilisateur via `eas device:create` ; il doit ouvrir le lien sur son iPhone. Puis, uniquement après accord pour le build :

```powershell
npx --yes eas-cli@25.2.0 build --platform ios --profile preview
```

5. Fournir le lien d'installation et accompagner la recette. Ne pas lancer `eas submit`, créer un abonnement ou renouveler/révoquer un certificat automatiquement.

## Recette physique à exécuter après installation

- Tester les cinq modes : noms d'équipes, vrai clavier, rotations portrait/paysage, safe areas, carrousel, scores, pause/reprise et fin.
- Vérifier une bannière depuis une vue autre que le chrono, sa visibilité, un changement de vue et la pause pendant l'alerte.
- Écouter début, but (B1 V2 2,40 s), alerte temporelle C1, transition Hint, fin de match P2, fin de chrono double Hint à 160 ms. E1 reste une ressource réservée sans événement.
- Vérifier les choix de sons personnalisés/off, le volume, musique externe, mode silencieux, Bluetooth et interruption par appel.
- Vérifier maintien d'écran activé/désactivé, mise en veille, retour de l'arrière-plan et fermeture/relance sans perdre les séances ni réinitialiser le temps.
- Vérifier les anciennes sauvegardes réellement présentes sur une mise à jour compatible, les presets et les cinq modes ; aucun transfert automatique depuis navigateur ou Expo Go n'est promis.
- Tester la release Android (R8), le cycle de vie iOS UIScene et le bouton/gestes de retour. Noter chaque résultat réel, appareil et version système.

Les contrôles automatiques et les tests navigateur ne valident pas ces comportements matériels. Aucun test physique n'est déclaré dans cette préparation.

## Seules interventions humaines indispensables

- Autoriser explicitement le lancement de chaque build et tout budget éventuel, une fois coût/quota vérifiés.
- Choisir l'identité définitive avant publication ; valider tout changement d'identifiant. L'identité Android existante et sa signature sont à préserver pour la recette.
- Pour iOS, décider du parcours Apple et effectuer les authentifications/2FA, adhésion éventuelle et enregistrement sur l'iPhone qui nécessitent le propriétaire.
- Installer et manipuler les vrais téléphones pour l'écoute et la recette. La préparation et les commandes peuvent être effectuées par l'assistant.

Tarifs à revalider avant engagement : [Expo](https://expo.dev/pricing), [Apple Developer](https://developer.apple.com/programs/enroll/). Aucun quota personnel ni statut d'adhésion n'est déduit de ces pages publiques.

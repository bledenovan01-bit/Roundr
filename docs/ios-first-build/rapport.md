# Préparation du premier build iOS

Base : `3df7df4` (PR #22). Branche : `codex/roundr-ios-first-build`.
Aucun build, aucune soumission, aucun enregistrement Apple. Aucun changement du design, des règles, des sons ni des sauvegardes.

## Ce qui change

| Élément | Avant | Après |
| --- | --- | --- |
| Icône | Logo Emergent, 512 px | Icône A « Épurée », 1024 px, sans transparence |
| Écran de démarrage | Visuel Emergent | Logo « Roundr. » transparent, centré sur `#020909` (`expo-splash-screen`) |
| Icône adaptative Android et favicon | Logo Emergent | Monogramme Roundr |
| Identifiant iOS | `com.emergent.demoprevue.vnvemd` | `com.bledenovan.roundr`, dans la configuration uniquement |
| Appareils | iPhone et iPad | iPhone uniquement |
| Schéma d'URL | `frontend` | `roundr` |
| Chiffrement | Non déclaré | `usesNonExemptEncryption: false` |
| Numéro de build | Local | Géré par EAS (`appVersionSource: remote`) |

L'identifiant Android `com.bledenovan.roundr.recette` ne change pas.

## Profils EAS

| Profil | Distribution | Spotify | Usage |
| --- | --- | --- | --- |
| `testflight-spotify` | `store` | **Activé** | TestFlight interne, test de Spotify |
| `production` | `store` | Désactivé | Future distribution publique |
| `preview` | `internal` | Désactivé | Distribution interne EAS, avec UDID enregistrés |

- `store` produit un build à envoyer sur App Store Connect, pour TestFlight ou l'App Store. `internal` produit un build installable par lien sur des iPhone enregistrés.
- Le Client ID Spotify n'est pas dans le dépôt : il se règle dans l'environnement EAS `preview`, variable `ROUNDR_SPOTIFY_CLIENT_ID`. Sans elle, le profil `testflight-spotify` échoue explicitement.
- **Attention :** `testflight-spotify` et `production` arrivent dans la même fiche App Store Connect. Un build `testflight-spotify` ne doit jamais être proposé à des testeurs externes ou à la revue.

## Vérifications

| Point | Résultat |
| --- | --- |
| Résolution des trois profils par EAS CLI 25.2.0 | OK, lecture seule |
| Xcode | L'image `sdk-58` utilise **Xcode 27.1 RC** sur macOS Tahoe 26.6.2 : au-dessus du minimum Apple (Xcode 26). L'acceptation d'une version « RC » par App Store Connect n'est pas documentée, à constater au premier envoi |
| Lancement sur iOS 27 | Expo exige le cycle de vie par scènes pour Xcode 27 : le modèle iOS du SDK 58 l'utilise (`SceneDelegate`), contrôlé en CI |
| Permissions iOS | Musique (texte français). Face ID (texte par défaut, voir ci-dessous). Ni micro, ni localisation, ni caméra |
| Chiffrement | Roundr n'utilise que le chiffrement du système. Apple n'exige pas de document dans ce cas. La documentation consultée ne confirme pas mot pour mot la valeur `false` pour le HTTPS : **déclaration à confirmer par le propriétaire** |
| Références Emergent dans l'application | Aucune dans la configuration ni le code exporté ; icônes remplacées. La CI vérifie le projet iOS généré |
| Références Emergent dans le dépôt | Restent : PR de nettoyage |

### Face ID

`NSFaceIDUsageDescription` est ajouté par le plugin `expo-secure-store`, sans option documentée pour le retirer. `src/utils/storage` est le seul import de ce module et personne ne l'utilise. Sans effet sur un test TestFlight, à retirer dans la PR de nettoyage, avant la soumission publique.

### Changement de schéma

- Le code applicatif ne contient aucun lien `frontend://` et les liens internes passent par les routes, sans schéma.
- Le retour Spotify se construit à partir du schéma : `roundr://spotify-login-callback`. **C'est cette adresse qu'il faudra déclarer dans le tableau de bord Spotify.**
- `app/+native-intent.ts` intercepte ce retour quel que soit le schéma, et il n'ouvre aucun écran.
- Sous le cycle de vie par scènes, le lien arrive via `ExpoAppSceneDelegate`, puis `RCTLinkingManager`, puis `Linking` : lu dans le code d'Expo et de React Native, non exécuté sur un appareil.
- Aucune installation antérieure n'utilise ce schéma sur iPhone, et les données d'Expo Go ne sont pas concernées.

## Contrôles

- `scripts/test-ios-first-build.ts`, ajouté à `npm test` : identité, profils, retour Spotify, images, permissions.
- La CI de compilation vérifie aussi le projet iOS généré : identifiant, iPhone seul, schéma, chiffrement, absence de micro et d'Emergent, icônes sans transparence, version de Xcode affichée.
- La CI compile sur un runner macOS dont la version de Xcode peut différer de l'image EAS.

## Reste à valider

Sur un vrai build : rendu de l'icône et de l'écran de démarrage (Expo Go et le web ne les montrent pas), retour d'authentification Spotify, permissions à l'écran, et la liste de `docs/controle-musical/rapport.md`.

# Procédure de build et de soumission

Rien de ce qui suit n'a été exécuté. Les builds EAS consomment le quota du
compte Expo ; les comptes développeur Apple et Google sont payants. Les commandes
se lancent depuis `frontend/`, sur la branche `main` à jour.

## Avant de commencer

1. Adhésion Apple Developer active et compte Google Play créé.
2. Politique de confidentialité et page d'assistance en ligne.
3. Identifiants confirmés : `com.bledenovan.roundr` sur iOS et Android. Ils ne
   sont plus modifiables après la première publication.
4. `eas.json` exige EAS CLI 25.2.0 ; `requireCommit` impose un dépôt sans
   modification en attente.
5. Coordonnées de publication dans `frontend/src/publication.ts` : elles sont
   renseignées (politique sur GitHub Pages, assistance à
   roundrsupport@gmail.com). Si l'une était vidée, son lien disparaîtrait de
   Paramètres et **un build `production` s'arrêterait dès le départ**. Les
   profils de test ne sont pas bloqués.
6. Nom légal de l'éditeur présent dans la politique en ligne (fait :
   Dénovan Blé EI).

Vérifier avant de lancer un build de production :

```bash
npm run check:publication -- --strict
```

Connexion au compte Expo :

```bash
npx eas-cli@25.2.0 login
```

## iOS

### 1. Build TestFlight

```bash
npx eas-cli@25.2.0 build --platform ios --profile production
```

Au premier lancement, EAS demande de se connecter au compte Apple et propose de
créer le certificat de distribution et le profil : accepter. Le profil
`production` n'embarque pas Spotify.

### 2. Envoi sur App Store Connect

```bash
npx eas-cli@25.2.0 submit --platform ios --profile production --latest
```

Le build arrive dans TestFlight. Il n'est proposé au public qu'après une
soumission à la revue, faite à la main dans App Store Connect.

### 3. Recette sur iPhone (TestFlight)

- Icône et écran de démarrage.
- Carte Musique : demande d'autorisation, lecture, pause, précédent, suivant,
  refus de l'autorisation.
- Les cinq modes, les sons, l'écran allumé, la reprise de session après
  fermeture de l'application.
- Mise à jour par un second build : les données sont conservées.

## Android

### 1. Build de test interne (APK installable)

```bash
npx eas-cli@25.2.0 build --platform android --profile preview
```

EAS propose de créer la clé de signature : accepter et la laisser gérée par EAS.
L'APK s'installe par lien sur un téléphone Android. À faire en premier : aucun
build Android n'a encore été installé sur un appareil.

### 2. Build de production (AAB pour Google Play)

```bash
npx eas-cli@25.2.0 build --platform android --profile production
```

### 3. Envoi sur Google Play

Le tout premier envoi d'une application se fait à la main dans la Play Console
(création de la fiche et import de l'AAB). Les suivants peuvent passer par :

```bash
npx eas-cli@25.2.0 submit --platform android --profile production --latest
```

Cette commande demande une clé de compte de service Google, à créer dans la Play
Console. Le profil envoie sur la piste **interne**, en **brouillon** : rien
n'atteint le public sans action manuelle.

### 4. Recette sur Android

- Installation, icône adaptative, écran de démarrage.
- Bouton retour du système pendant un match et dans les réglages.
- Sons et vibrations, écran allumé.
- Affichage bord à bord : barre d'état et barre de navigation.
- Carte Musique : elle n'apparaît pas sur Android (fonction réservée à
  l'iPhone). Vérifier que les carrousels du match et du Chrono libre n'ont pas
  de vue ni de point en trop.

## Points de vigilance

- **Spotify** : ne jamais proposer au public un build `testflight-spotify`.
- **Xcode** : l'image EAS `sdk-58` utilise une version « RC » de Xcode ;
  l'acceptation par App Store Connect se constatera au premier envoi.
- **Sécurité réseau iOS** : vérifier dans le premier build que
  `NSAllowsArbitraryLoads` vaut bien `false`. L'outil d'inspection local affiche
  `true`, le modèle Expo `false` : seul le projet généré fait foi.
- **Google Play, nouveaux comptes personnels** : un test fermé avec plusieurs
  testeurs pendant deux semaines est exigé avant la production. Chiffres exacts à
  lire dans la Play Console.
- **Numéros de build** : gérés par EAS (`appVersionSource: remote`), incrémentés
  automatiquement sur `production`.

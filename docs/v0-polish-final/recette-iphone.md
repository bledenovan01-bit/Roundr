# Recette iPhone — dernier polish V0

Branche à tester : `claude/roundr-v0-final-polish` (PR #25). Expo SDK 58, même
méthode que la recette du 8 novembre : **Expo Go**, serveur Expo en mode
production, via tunnel. Aucune configuration native n'a été modifiée.

## Prérequis

- iPhone avec **Expo Go compatible SDK 58** (mettre à jour depuis l'App Store).
- Sur le PC : Node 22 (présent), dépendances déjà installées dans `frontend/`.
- Le tunnel (`@expo/ngrok`) est déjà installé sur le PC.
- Aucun compte Apple Developer, aucun build, aucun EAS n'est nécessaire.

## Lancer Roundr sur l'iPhone

Dans un terminal, depuis le dossier du dépôt :

```bash
git switch claude/roundr-v0-final-polish
```

```bash
git pull
```

```bash
cd frontend
```

```bash
npx expo start --no-dev --minify --tunnel --clear
```

Puis :

1. attendre l'affichage du QR code dans le terminal ;
2. le scanner avec l'appareil photo de l'iPhone, ouvrir dans Expo Go ;
3. laisser le terminal ouvert pendant toute la recette ;
4. `Ctrl + C` pour arrêter le serveur à la fin.

`--no-dev --minify` fait tourner l'application comme en production (pas de
menu développeur, vraies performances). `--clear` évite de servir une ancienne
version en cache.

Si Expo Go affiche une ancienne version : fermer complètement Expo Go, relancer
la commande, rescanner.

## Ce qu'Expo Go ne permet pas de tester

| Élément | Pourquoi | Ce qu'il faut |
| --- | --- | --- |
| Carte Musique (Apple Music, Spotify) | Modules natifs propres à Roundr, absents d'Expo Go. La carte affiche « Contrôle musical indisponible » : c'est le comportement attendu | Build signé (TestFlight) |
| Icône et écran de démarrage | Expo Go affiche les siens | Build signé |
| Comportement de l'application autonome (installation, mise à jour, données propres) | Expo Go n'est pas l'application finale | Build signé |

Un build signé (profils EAS `testflight-spotify` ou `production`, déjà prêts dans
`frontend/eas.json`) exige une **adhésion Apple Developer payante**. Un
« development build » a la même exigence : il n'apporte rien de plus ici.

## Checklist de recette (10 minutes)

Accueil et textes

- [ ] Titre « On joue comment ? » et descriptions sur une ligne, rien de coupé.
- [ ] Ton des textes (tutoiement) conforme à l'attendu.

Match classique, portrait

- [ ] La carte du chrono remplit l'espace, sans toucher les commandes ni la
      barre d'accueil de l'iPhone.
- [ ] Démarrer, Pause, Reprendre, Fin : retour visuel net à l'appui, aucun retard.
- [ ] Vues numérique et circulaire lisibles ; glissement au doigt et par les points.
- [ ] Les centièmes défilent sans saccade avec les grands chiffres.
- [ ] Passage en paysage puis retour en portrait : mise en page correcte, chrono
      inchangé.

Maracana (ou Cup, Survie)

- [ ] Lien de classement et bannières d'annonce visibles sous le chrono.
- [ ] Fin de match, rotation, match suivant : comme avant.

Chrono libre

- [ ] Chronomètre : trois cadrans, puis plusieurs « Tour » (la carte rétrécit,
      la liste apparaît).
- [ ] Mettre le cadran « Circulaire », quitter Expo Go, revenir : la session
      reprend directement sur ce cadran, à la bonne heure.
- [ ] Compte à rebours : signal de fin (son et vibration) inchangé.

Général

- [ ] Sons du match inchangés (début, 1 minute, fin).
- [ ] Retour à l'accueil depuis un match : l'animation va dans le sens du retour.
- [ ] Reprise d'une session depuis l'accueil.

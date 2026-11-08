# Contrôle musical intégré

Base : `d8a0d1f` (PR #21, améliorations UX validées sur iPhone). Branche : `codex/roundr-music-control`.
Aucun changement des chronomètres, des sessions, des bruitages, des sauvegardes ni des identifiants.
**Spotify est expérimental et ne doit pas être présenté comme publiable** avant une réponse officielle de Spotify.

Cette évolution modifie le périmètre initial du cahier des charges (`memory/cahier.md`), qui excluait les intégrations Spotify et Apple Music de la V0 : décision du propriétaire du 8 novembre 2026.

## Architecture

```
Carte Musique Lovable (src/components/lovable/music-card.tsx)
        │  modèle unique : titre, artiste, pochette, état réel, commandes permises
        ▼
Contrôleur commun (src/music/music-controller.ts, music-card-model.ts)
        ├── Apple Music   modules/roundr-music            MPMusicPlayerController.systemMusicPlayer
        └── Spotify       modules/roundr-spotify-remote   SDK App Remote 5.0.1, expérimental
```

- **Une seule carte.** Elle reprend la maquette Lovable (pochette, titre, artiste, indicateur de lecture, précédent / lecture-pause / suivant). Elle ne contient aucun code propre à un service.
- **Aucune simulation.** Après chaque commande, l'état est relu dans le lecteur. Un bouton n'est actif que si la source déclare la commande. Spotify fournit `canSkipNext` et `canSkipPrevious`.
- **Choix de la source.** Celle qui joue ; si les deux jouent, la dernière écoutée. Une pause garde la carte sur sa source. Si une autre application joue, la carte n'affiche pas un ancien morceau en pause.
- **Autorisations.** Demandées uniquement au toucher de « Connecter ». Avant cela, le lecteur système n'est pas interrogé.
- **Sobriété.** Le suivi ne tourne que lorsque la vue Musique est à l'écran.
- **Bruitages.** Les modules ne touchent jamais à la session audio.

## États de la carte

| Situation | Affichage |
| --- | --- |
| Expo Go, web, Android | « Contrôle musical indisponible », aucun bouton |
| Lecture de l'état en cours | « Recherche de la musique… » |
| Source connectée avec un morceau | Lecteur |
| Accès non demandé | « Connectez votre musique » + Connecter |
| Accès à Musique refusé | Message + « Ouvrir les Réglages » |
| Accès à Musique restreint | Message seul |
| Connexion en cours | « Connexion à … » |
| Connexion perdue | Message + « Reconnecter » |
| Autre application en lecture | Message renvoyant au Centre de contrôle, sans commande |
| Rien en lecture | « Aucune musique en cours » |
| Commande échouée | « La commande n'a pas abouti. », état relu |

iOS indique seulement qu'une autre application émet du son, jamais laquelle. Il n'envoie pas d'événement pour cela : la carte relit cette information toutes les 4 secondes lorsqu'elle est visible.

## Spotify : périmètre expérimental

Désactivé par défaut. Sans les variables ci-dessous, le SDK n'est pas lié, aucune configuration Spotify n'est ajoutée et le module répond qu'il est désactivé.

| Variable de build | Rôle |
| --- | --- |
| `ROUNDR_SPOTIFY_EXPERIMENT=1` | Active le prototype et télécharge le SDK 5.0.1, contrôlé par empreinte SHA-256 |
| `ROUNDR_SPOTIFY_CLIENT_ID` | Client ID de l'application créée dans le tableau de bord Spotify |

- Le jeton reste en mémoire : un nouveau lancement redemande l'autorisation.
- L'adresse de retour utilise le schéma existant : `frontend://spotify-login-callback`, à déclarer dans le tableau de bord Spotify. `app/+native-intent.ts` empêche ce retour d'ouvrir un écran ou de quitter un match.
- Comportements écrits dans la documentation Spotify, à mesurer en recette :
  - la connexion bascule vers l'app Spotify ;
  - elle peut reprendre la dernière lecture ;
  - reprendre après une longue pause peut demander une nouvelle bascule.
- **Restrictions d'App Remote non établies.** L'application de la limite de 5 utilisateurs, la distribution publique et les commandes des comptes Free attendent la réponse officielle de Spotify.

## Tests automatisés

- `scripts/test-music-control.ts`, ajouté à `npm test`, couvre :
  - carte identique pour les deux sources ;
  - choix de la source ;
  - tous les états ci-dessus ;
  - commandes refusées, échouées ou doublées ;
  - réponses tardives ignorées ;
  - source qui ne répond plus ;
  - retour depuis une autre application ;
  - arrêt du suivi quand la carte est masquée ;
  - absence de session audio et d'API privée ;
  - Spotify inactif sans drapeau ;
  - identifiants inchangés.
- Workflow `roundr-ios-compile.yml` : compile les modules Swift pour le simulateur iOS, avec et sans Spotify, sans signature ni compte Apple ni EAS.
- Contrôle visuel web avec un lecteur simulé temporaire, non committé : portrait 390 × 844 et paysage 844 × 390, comparés aux captures Lovable. Pochette, commande indisponible grisée, passage en pause.
- Sans module natif, comme dans Expo Go : message d'indisponibilité, aucun plantage, aucun bouton.

## Validations natives restantes

Rien n'a pu être exécuté sur un iPhone : un module natif exige un build signé, donc l'adhésion Apple Developer.

**Apple Music**
1. Autorisation accordée, refusée, puis réactivée dans les Réglages.
2. Lecture, pause, précédent, suivant sur un morceau de la bibliothèque et un morceau Apple Music en streaming.
3. Titre, artiste et pochette selon le type de morceau ; synchronisation depuis le Centre de contrôle.
4. Compte sans abonnement Apple Music.

**Spotify (build expérimental)**
1. Connexion, retour dans Roundr sans quitter le match, compte Premium.
2. Commandes et `canSkip` avec un compte Free.
3. Pause longue à la mi-temps, app Spotify suspendue, reconnexion.
4. Compte non autorisé (6ᵉ utilisateur), pour tester la limite du mode développement.

**Communs**
1. Passage d'une source à l'autre, troisième application en lecture.
2. Bruitages Roundr par-dessus la musique, appel entrant, Bluetooth, verrouillage.
3. Sortie puis retour dans Roundr pendant un match ; chrono et sauvegardes inchangés.

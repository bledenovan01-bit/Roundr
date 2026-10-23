# Arbitrages produit — musique native et 30/30

Étude documentaire du 23 octobre 2026. Aucune implémentation native musicale, permission, connexion de compte ou dépendance ajoutée. Aucun lecteur simulé.

## Musique déjà diffusée sur le téléphone

| Plateforme | API publique examinée | Faisabilité et contraintes |
|---|---|---|
| iOS | MPRemoteCommandCenter / MPRemoteCommand | Reçoit les commandes destinées au lecteur de l’application ; ce n’est pas une API pour envoyer lecture/pause à n’importe quelle application. Apple décrit l’inscription de gestionnaires lorsque l’app devient le lecteur Now Playing. [Documentation Apple](https://developer.apple.com/documentation/mediaplayer/handling-external-player-events-notifications) |
| iOS | MPMusicPlayerController.systemMusicPlayer | Contrôle l’application Musique et reprend son état. Ce périmètre ne couvre pas Spotify, YouTube ou une autre app arbitraire. L’accès à la bibliothèque requiert une permission et une description d’usage ; il ne correspond pas à un contrôle universel sans intégration. [Lecteur système](https://developer.apple.com/documentation/mediaplayer/mpmusicplayercontroller/systemmusicplayer), [Bibliothèque et permission](https://developer.apple.com/documentation/mediaplayer) |
| iOS, API Now Playing récente | MediaSession / RemoteMediaSession | Publie les sessions de son propre lecteur ou des médias sur des appareils externes. La documentation des sessions distantes ne décrit pas un droit de contrôler les autres apps locales. Ce nouvel ensemble d’API ne fournit donc pas, dans les sources examinées, la solution demandée. [Now Playing](https://developer.apple.com/documentation/NowPlaying), [RemoteMediaSession](https://developer.apple.com/documentation/nowplaying/remotemediasession) |
| Android | MediaSessionManager.getActiveSessions + MediaController.TransportControls | Contrôle des lecteurs qui publient une session et acceptent les commandes. L’accès aux sessions tierces demande MEDIA_CONTENT_CONTROL ou un NotificationListenerService activé par l’utilisateur ; ne pas supposer qu’une app ordinaire peut obtenir la permission privilégiée. Aucun compte Spotify/Apple requis pour ce mécanisme, mais accès spécial aux notifications, module natif et build dédié nécessaires. [Sessions Android](https://developer.android.com/reference/android/media/session/MediaSessionManager), [Commandes](https://developer.android.com/reference/android/media/session/MediaController.TransportControls), [Service](https://developer.android.com/reference/android/service/notification/NotificationListenerService) |

**Conclusion d’ingénierie, déduite des sources :** ne pas promettre un lecteur universel identique iOS/Android. Sous iOS, conserver les commandes système du téléphone ; une intégration Musique limitée serait un autre choix produit. Sous Android, un prototype séparé est envisageable après accord explicite sur l’accès aux notifications, avec refus/révocation et absence de lecteur gérés proprement. Expo Go n’est pas une preuve de cette intégration : il faudrait un module natif et des essais signés. Aucun droit supplémentaire n’est demandé dans Phase 5A.

Un éventuel prototype Android devra tester plusieurs lecteurs réels, plusieurs sessions simultanées, lecteurs en pause/absents, permissions refusées/révoquées, écran verrouillé et gestion des annonces Roundr sans interrompre la musique. Ne jamais collecter le contenu des notifications sans nécessité ; limiter le service à la fonction choisie. Ne pas utiliser d’API privée ni simuler des touches globales pour contourner iOS.

L’audio Roundr actuel utilise `expo-audio` et `mixWithOthers`. Cette coexistence est une configuration de lecture de nos signaux, pas un contrôle de la musique tierce. Elle reste à écouter sur appareil.

## Programme rapide 30/30

**État préservé :** huit périodes de 30 secondes, aucun repos intercalé, total 240 secondes = quatre minutes. Les configurations existantes et sauvegardes ne sont pas réécrites. La Phase 4A possède déjà un oracle sur les programmes Lovable, réexécuté dans les tests actuels.

**Recommandation avant publication, sans modification dans cette PR :** clarifier le nom et créer une nouvelle version explicitement nommée « 8 × (30 s effort + 30 s repos) » si l’intention produit est une alternance. Avec le dernier repos inclus, ce programme dure huit minutes. Sans repos final, il dure sept minutes trente : ce choix doit être validé et affiché sans ambiguïté. Conserver les anciens programmes à quatre minutes et leurs noms/durées enregistrés, puis proposer éventuellement une conversion explicite, jamais automatique.

Alternative minimale : garder le programme actuel mais le renommer pour les nouvelles sélections « 8 × 30 s en continu ». L’intitulé 30/30 suggère aujourd’hui une alternance absente. Aucun de ces choix n’est appliqué en Phase 5A.

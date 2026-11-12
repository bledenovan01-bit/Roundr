# Textes et déclarations pour l'App Store et Google Play

Propositions à relire. Rien n'est soumis. Les longueurs maximales sont celles
relevées dans `docs/ios-first-build/fiche-app-store.md` (9 novembre 2026) pour
Apple ; celles de Google Play sont à confirmer dans la Play Console au moment de
la saisie.

## Textes communs

**Nom** : Roundr

**Sous-titre (Apple, 30 caractères max)** : Chronos et tournois de foot

**Description courte (Google Play)** : Chronos, rotations et tournois pour tes
matchs de foot entre amis.

**Description**

> Moins d'organisation, plus de jeu.
>
> Roundr s'occupe du chrono, des rotations et des classements pendant que tu
> joues. Pensé pour le foot entre amis : five, city stade, tournoi du dimanche.
>
> MATCH CLASSIQUE
> Deux équipes, un chrono, une ou deux mi-temps. Score, temps additionnel,
> objectif de buts.
>
> MARACANA
> De 3 à 8 équipes qui tournent à chaque match. Roundr gère la rotation, la file
> d'attente et le classement.
>
> CUP
> Des poules, puis les phases finales jusqu'au titre.
>
> SURVIE
> Élimination directe : le gagnant avance, le perdant sort.
>
> CHRONO LIBRE
> Chronomètre avec tours, compte à rebours ou intervalles. Enregistre tes
> chronos pour les retrouver.
>
> FAIRE LES ÉQUIPES
> Ajoute les joueurs, Roundr tire les équipes au sort.
>
> ET AUSSI
> • Sons de match : coup d'envoi, dernière minute, coup de sifflet final
> • Écran toujours allumé pendant le match
> • Portrait ou paysage
> • Reprise d'une session interrompue
> • Historique de tes compétitions
>
> Aucun compte, aucune publicité, aucune connexion nécessaire : tout reste sur
> ton téléphone.

La carte Musique (iPhone) n'est pas mentionnée : elle n'a jamais été testée sur
un build signé. À ajouter une fois validée.

**Mots-clés (Apple)** : football, foot, match, tournoi, chrono, chronomètre,
five, arbitre, équipes, score

**Catégorie** : Sports

**Prix** : Gratuit

**Langue principale** : Français

## Confidentialité

| Question | Réponse | Justification |
| --- | --- | --- |
| Apple — collecte de données | Aucune donnée collectée | Aucun appel réseau, aucun compte, aucune mesure d'audience dans le code. Les données restent sur l'appareil |
| Apple — suivi | Non | Aucun outil de suivi, aucune publicité |
| Google — l'app collecte-t-elle ou partage-t-elle des données ? | Non | Idem |
| Google — données chiffrées en transit | Sans objet | Rien n'est transmis |
| Google — suppression des données | Désinstallation, ou suppression dans l'app | Voir la politique de confidentialité |
| Chiffrement (Apple) | Aucun chiffrement propre | Déjà déclaré dans la configuration ; à confirmer par l'éditeur |

Ces réponses valent pour le profil `production` (Spotify désactivé). Un build
avec Spotify activé change la réponse et ne doit pas être proposé au public.

## Permissions à expliquer

| Plateforme | Permission | Explication |
| --- | --- | --- |
| iOS | Accès à Musique | Afficher et commander le morceau en cours pendant un match |
| Android | Vibration | Vibrations aux événements du match |
| Android | Réglages audio | Lecture des sons du match |
| Android | Internet | Imposée par le socle technique ; l'application n'envoie rien |

## Classification par âge

Aucun contenu sensible : ni violence, ni jeux d'argent, ni achats, ni contenu
généré par d'autres utilisateurs, ni accès web libre. Réponse « non » attendue à
toutes les questions des deux questionnaires.

## Captures d'écran à produire

À faire sur de vrais appareils ou simulateurs, après le premier build.

| Écran | Message |
| --- | --- |
| Accueil | Les modes de jeu |
| Match classique en cours | Le chrono et le score |
| Maracana, fin de match | La rotation automatique |
| Cup, tableau | Poules et phases finales |
| Chrono libre | Chronomètre, compte à rebours, intervalles |

Formats Apple relevés : 1179 × 2556 ou 1206 × 2622, sans transparence. Formats
Google Play : à confirmer dans la Play Console.

## Informations à fournir par l'éditeur

- Nom légal affiché comme vendeur.
- Adresse e-mail d'assistance : **roundrsupport@gmail.com**.
- URL de la politique de confidentialité :
  <https://bledenovan01-bit.github.io/Roundr/confidentialite/>.
- URL d'assistance : <https://bledenovan01-bit.github.io/Roundr/assistance/>.
- URL marketing (facultative) : <https://bledenovan01-bit.github.io/Roundr/>.
- Coordonnées pour la revue Apple (nom, téléphone, e-mail).
- Statut de commerçant UE : s'il est déclaré, adresse, téléphone et e-mail sont
  affichés publiquement sur la fiche dans l'UE.
- Mention de copyright (année et titulaire).

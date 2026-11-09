# Éléments nécessaires à la publication sur l'App Store

Rien n'est soumis. Relevé sur les pages Apple le 9 novembre 2026. Le statut « obligatoire » de plusieurs champs n'a pas pu être lu dans les tableaux d'Apple : App Store Connect fera foi.

## À décider ou fournir par le propriétaire

| Élément | Détail | Proposition |
| --- | --- | --- |
| Adhésion Apple Developer | 99 USD/an. Compte individuel : le nom légal s'affiche comme vendeur | — |
| Statut de commerçant UE (DSA) | Pour un particulier déclaré commerçant : adresse ou boîte postale, téléphone et e-mail **affichés publiquement** sur la fiche dans l'UE | À trancher avant toute diffusion dans l'UE |
| Identifiant iOS | `com.bledenovan.roundr`, non modifiable après le premier envoi | Accord final à donner |
| URL de politique de confidentialité | Obligatoire, publique | Page simple hébergée (GitHub Pages par exemple) |
| URL d'assistance | Doit permettre de vous contacter facilement | Même site, avec une adresse e-mail dédiée |
| Coordonnées pour la revue | Nom, téléphone, e-mail | — |

## Fiche

| Champ | Contrainte | Proposition |
| --- | --- | --- |
| Nom | 2 à 30 caractères | Roundr |
| Sous-titre | 30 caractères maximum | Chronos et tournois de foot |
| Description | Texte libre | À rédiger |
| Mots-clés | À renseigner | football, match, tournoi, chrono, arbitre… |
| Catégorie | La plus adaptée | Sports |
| Copyright | Année et titulaire | À renseigner |
| SKU | Non modifiable après création | `roundr-ios` |
| Langue principale | Modifiable | Français |
| Classification par âge | Questionnaire obligatoire | À remplir |
| Prix et disponibilité | Choix des pays | Gratuit |
| URL marketing | Facultative d'après ce qui a été lu | — |
| Captures iPhone | 1 à 10, sans transparence : 1179 × 2556 ou 1206 × 2622. Un jeu 1284 × 2778 ou 1242 × 2688 selon les cas | Accueil, match, Cup, Chrono libre, Musique |
| Icône | Fournie par le build | Faite |
| Droits sur le contenu | Roundr n'inclut pas de contenu tiers | À déclarer |

## Confidentialité

- **Réponse pressentie : « Aucune donnée collectée ».** Roundr n'a ni compte, ni serveur, ni analyse d'audience ; les données restent sur le téléphone, et Apple précise que ce traitement local n'est pas une collecte.
- Valable pour le profil `production`. **À réévaluer si Spotify devient public.**
- **Lien de confidentialité dans l'application :** les règles d'Apple demandent un lien dans la fiche **et dans l'app**. Roundr n'en a pas aujourd'hui : **à ajouter avant la soumission publique** (pas pour TestFlight interne).
- Aucun compte Roundr : ni compte de démonstration ni suppression de compte à prévoir.

## Conformité

- **Chiffrement :** déclaré sans chiffrement soumis à documentation. Confirmation à donner par le propriétaire.
- **Texte Face ID :** à retirer avant la soumission (PR de nettoyage).
- **Spotify :** rester sur le profil `production`, sans Spotify, tant que Spotify n'a pas répondu.
- **Lien « Signaler un problème » :** ouvre GitHub et demande un compte. Le contact de l'URL d'assistance doit rester simple.

## TestFlight

| | Interne | Externe |
| --- | --- | --- |
| Testeurs | Jusqu'à 100, membres d'App Store Connect | Jusqu'à 10 000 |
| Revue Apple | Non mentionnée | Oui, pour le premier build |
| Informations | Limitées | Description du test (obligatoire), e-mail de retour, contact |
| Durée d'un build | 90 jours | 90 jours |

Sources : pages App Store Connect (informations de l'app, captures, confidentialité, TestFlight, DSA, chiffrement) et règles de la revue.

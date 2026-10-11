# Reprise de la demande V0 — 11 octobre 2026

Référence : demande complète en 20 sections et captures fournies par Dénovan.
Ce suivi ne signifie pas que toute la demande est terminée.

## Séries réalisées dans cette reprise

### Lot 1 : corrections ciblées de présentation

- Chrono circulaire : encombrement maximal réduit de 230 à 190 points.
- Chiffres : même police et taille nominale de 38 points que le score ; adaptation aux valeurs longues et petits écrans.
- Démarrer : long CTA horizontal centré, icône à côté du texte. Cette consigne remplace le placement précédent en bas à droite.
- Accueil : icônes carrées de 40 points, coins de 10 points.
- Configurations : CTA propres aux quatre modes, sans supprimer de réglages.
- Retour : fond sombre contrasté et arrondi dans les configurations, écrans partagés et match. Titres des écrans partagés centrés.

### Lot 2 : carrousel

- Vue classique/circulaire enregistrée dans les préférences et réglable dans Paramètres.
- Retour à cette vue après une annonce temporaire et adaptation à la largeur disponible.
- Rencontre suivante supplémentaire affichée en Cup/Survie seulement si les deux équipes sont résolues ; aucune prédiction de vainqueur ou rotation Maracana future.
- Halo de l’anneau contenu dans le SVG, pour éviter les bords coupés.
- Référence obsolète aux chronos enregistrés retirée des paramètres.

### Lot 3 : sécurité des sons — partiel

- Couper les sons arrête les lecteurs appartenant à Roundr.
- Une coupure pendant un chargement ne laisse pas démarrer l’effet en retard.
- Préécoute explicite disponible dans les paramètres même si les sons automatiques sont coupés.
- Mode de coexistence audio conservé : mixWithOthers. À vérifier avec Spotify sur téléphone.
- Les fichiers audio synthétiques existants ne sont PAS remplacés par des enregistrements naturels.
- Le contrôleur Spotify n’est PAS implémenté. Il faut un Client ID Spotify, une URI de retour, une autorisation utilisateur et un build compatible avec l’intégration retenue. Aucun faux lecteur ajouté.

## Vérifications et limites

- Tests du moteur, des règles des cinq modes, des annonces, du stockage et nouvelles régressions exécutés.
- Nouveaux tests : préférence du chrono persistante, rencontres suivantes résolues uniquement, coupure audio pendant la lecture ou le chargement.
- TypeScript et analyse de syntaxe vérifiés ; ESLint ciblé sur les composants modifiés.
- Exports iOS/Android/Web : compilation, pas exécution sur appareil.
- Aucun navigateur de test installé dans cet environnement ; validation visuelle portrait/paysage et gestuelle tactile encore à réaliser.
- Publication sur branche de développement. Pas de déploiement Emergent et pas de nouvelle fusion dans main dans cette reprise.

## Travail restant pour la demande complète

Mise à jour suivante : le lecteur musical est reporté au dernier lot, à la demande de Dénovan.

### Lot 4 : configurations et contrôles — reprise supplémentaire

- Personnalisation des équipes directement sous l’interrupteur, dans la même carte : plus de deuxième clic pour afficher les noms et couleurs.
- Icônes de sections pour les quatre configurations, durée et fin de match, personnalisation et sons.
- Maracana : durée et règles de fin dans deux cartes distinctes ; conditions au temps et aux buts toujours indépendantes.
- Typographie des titres de sections et choix plus compacte, sans diminuer les cibles tactiles.
- CTA désactivés sur fond sombre/gris avec texte atténué ; les CTA valides restent verts.
- Protection des zones système pendant le défilement des configurations et écrans partagés.
- Transitions : séparation entre la véritable rencontre suivante et l’information de rotation ; verrouillage retiré lorsque le match se termine.
- Anneau compact : largeur des légendes bornée et légende secondaire réduite sur les écrans étroits.
- Ajout d’une suite de tests des composants des cinq configurations (contrôles conservés, équipes immédiatement visibles, CTA gris). Ces tests ne remplacent pas une recette visuelle/native.

1. Valider visuellement les tailles et les configurations sur téléphone ; poursuivre la fidélité aux maquettes (densité, icônes, hiérarchie des cartes, écran d’introduction).
2. Vérifier le carrousel par gestes, les annonces, le verrouillage et la conservation de la vue après rotation sur appareil.
3. Choisir/intégrer des sons naturels avec droits de redistribution documentés ; écouter et ajuster chaque événement.
4. Configurer et développer le contrôle Spotify réel, puis tester l’autorisation et la reprise en arrière-plan.
5. Terminer les paramètres et informations légales avec contenu validé, sans inventer de politique juridique.
6. Réaliser la recette complète demandée : tous les modes, saisies, scores/corrections, pauses, fins/transitions, classement/tableau, reprise après fermeture, couleurs, équipeur, musique et petits écrans portrait/paysage.
7. Faire valider les écarts restants et le rendu avant fusion/déploiement.

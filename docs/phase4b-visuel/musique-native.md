# Contrôle de la musique du téléphone — étude distincte

L’objectif produit reste de commander la musique déjà diffusée sur le téléphone, sans connexion Spotify ou Apple Music et sans lecteur simulé.

La page Musique de Lovable est une simulation. Cette Phase 4B ne la reprend pas : aucun bouton lecture/pause ou changement de piste ne prétend commander une autre application.

Avant d’implémenter ce lot, mener une étude séparée sur iOS et Android :

1. Vérifier, dans les documentations officielles courantes, les API publiques réellement accessibles pour lire l’état et commander les médias d’une autre application. Distinguer le contrôle du propre lecteur de Roundr du contrôle d’un lecteur externe.
2. Recenser les autorisations éventuelles et leurs conséquences pour l’utilisateur. Ne demander ni identifiants de service musical ni accès supplémentaire avant cette analyse.
3. Prototyper lecture/pause et piste suivante/précédente sur appareils physiques, avec plusieurs applications musicales déjà en lecture. Vérifier aussi l’absence de lecteur actif et les capacités indisponibles.
4. Tester la coexistence avec les sons du chrono, appels, Bluetooth, casque, verrouillage et arrière-plan. Préserver la préférence de sons du chrono et le volume choisi.
5. Décider le parcours et les différences acceptables entre plateformes à partir des résultats. Si une action n’est pas disponible, l’indiquer clairement et ne pas la simuler.

Ce document fixe le travail de faisabilité restant ; il ne prétend pas que les mêmes capacités sont disponibles sur les deux systèmes. Aucune intégration musicale native n’est déclarée opérationnelle dans cette PR.

# Recette de gel V0 — audit UX de la PR #32

Base auditée : `bfa870b`. Les retouches locales de la maquette ont été préservées dans `e6f4a5d`. Le tableau regroupe le retour dans les sous-vues et le dépilage de l’accueil (les lignes 13 et 26 du rapport initial) pour couvrir ses 26 lignes en 25 points.

| Nº | Constat | Statut et correction | Vérification |
| ---: | --- | --- | --- |
| 1 | Abandon | Glissement déjà présent. Confirmation sur la corbeille, bouton dans la carte de reprise et action d’arrêt avant le départ ou à la mi-temps. | Chrome : glissement seul laisse le match actif, abandon avant départ, confirmation puis rechargement sans reprise. |
| 2 | Verrouillage | Boutons Verrouiller et Déverrouiller explicites, cadenas utilisable en un toucher. | Chrome : match et Chrono libre, commandes bloquées puis réactivées. |
| 3 | Écran et sifflet | Écran maintenu allumé pendant un chrono actif par défaut. Choix déjà enregistrés respectés. Avertissement si veille autorisée. | Tests de préférence et de maintien d’écran. Son et verrouillage manuel à essayer sur iPhone. Aucune alerte en arrière-plan ajoutée. |
| 4 | Arrêt Maracana/Cup/Survie | Arrêter la session propose de garder les résultats joués ou d’abandonner. L’arrêt ne valide pas le match en cours. | Chrome : arrêt d’un Maracana au second match, un seul match terminé enregistré. Tests métier des résumés. |
| 5 | Équipes tirées | La feuille de validation ouvre directement la configuration avec les équipes enregistrées, selon les modes compatibles. | Chrome : nom personnalisé saisi au tirage et retrouvé au lancement du Match classique. |
| 6 | Remise à zéro | Recommencer séparé de Reprendre. La confirmation annonce le reset du score et du temps, ou du temps seul pour une phase à score conservé. Annulation 5 s. | Chrome : but, reset, annulation restaure le but, nouveau reset remet à 0. Tests de confirmation métier. |
| 7 | Corriger le score en Chrono libre | Boutons −1/+1 explicites. −1 désactivé à zéro. | Chrome : ajout puis retrait et vérification du score sauvegardé. |
| 8 | Vue du chrono | Bouton plein écran visible sur les vues numérique et circulaire, marqueur ⇄ sur le libellé de temps basculable. | Chrome : ouverture et fermeture du chrono géant par ses boutons. |
| 9 | Retour pendant le chrono | La carte de reprise indique que le chrono continue. | Code et parcours retour/abandon dans Chrome. |
| 10 | Réglages avant départ | Configuration classique et Maracana préremplie avant le premier match. Durée lisible en minutes dans Paramètres. | Chrome : changement à 10 min, prêt à jouer sans alerte de remplacement. |
| 11 | Ordre de la reprise | Cartes de reprise placées avant le choix des modes. | Chrome : retour au menu avec session active. |
| 12 | Périmètre de l’historique | Entrée et titre « Tournois joués », pour Cup et Survie. | Chrome : consultation d’une Cup archivée. |
| 13 | Retours internes et pile d’accueil | Retour de sous-vue pris en charge dans Chrono libre, Tournois joués, tirage et match de tournoi. Retour accueil via dépilage. | Chrome : navigation écran et retour à la liste. Bouton système Android et geste iOS à tester. |
| 14 | Liste des joueurs | Confirmation avant de vider. | Inspection du parcours et de la confirmation. |
| 15 | Plein soleil | Thème automatique, suggestion du clair en journée, commandes rehaussées à 13 px et états désactivés plus visibles. | Chrome : option automatique enregistrée et parcours sombre/clair. Lisibilité dehors à essayer sur iPhone. |
| 16 | Intro | Phrase concrète sur chrono avec sifflet, score et rotation. | Chrome : passage par l’intro. |
| 17 | Commande Écran | États « Écran allumé » et « Veille autorisée », pictogrammes de cadenas, commande visible avant le départ du match. | Tests du libellé et contrôle Chrome de l’écran prêt. |
| 18 | Retour Android du résultat | Interception pour archiver et revenir à l’accueil comme le bouton de l’écran. | Tests métier de persistance. Bouton système à vérifier sur Android. |
| 19 | Quitter la configuration | « Abandonner ces réglages ? ». | Inspection du garde de navigation. |
| 20 | Annuler la suppression | Annulation 5 s dans Tournois joués et Mes chronos. | Chrome : restauration des deux entrées ; tournoi encore visible après rechargement. |
| 21 | Cibles tactiles | Interrupteurs, pas +/−, réordonnancement, maillots et pastilles de couleur agrandis à 44. | Code et suite des mises en page étroites. À confirmer au doigt. |
| 22 | Vocabulaire | « Session » pour l’ensemble, « Fin » pour la commande, « But en or » traduit et expliqué, règle de rotation décrite. | Code et tests Chrono libre, tournoi et Maracana. Préparer et démarrer restent deux actions distinctes. |
| 23 | Erreurs de sauvegarde | Message court et commande de réessai à l’accueil ; l’écran de panne explique que la dernière sauvegarde peut être reprise. | Tests de stockage, erreur et nouvel essai. |
| 24 | Sons et volume | Entrée explicite sur la page principale des Paramètres. | Chrome : accès aux réglages avancés depuis cette entrée. |
| 25 | Routes anciennes | Redirections de /teams et /config/custom ; anciens rendus de match ou résumé gardés pour les sauvegardes compatibles. | Inspection des routes et tests de conservation de l’ancien format. |

## Vérifications automatisées

Syntaxe TypeScript, typage, lint et suites métier. Chrome : 9 parcours ciblés, 5 parcours de maquette fusionnée, 21 cas V0 et 16 cas recette 2. La suite ciblée est ajoutée à la CI.

## Recette sur téléphone

Ouvrir le projet Expo Go depuis le même Wi-Fi que le PC, avec [le lien Metro local](exp://192.168.1.147:8083) pendant que le serveur est actif. Pour les essais sonores, monter le volume multimédia, désactiver le mode silencieux et vérifier dans Paramètres → Sons et volume que le son de fin est actif.

1. **Au premier plan.** Dans Match classique, choisir une durée personnalisée d’une minute et une période. Vérifier « Écran allumé » puis démarrer et laisser l’iPhone posé, Roundr à l’écran. Attendu : l’écran reste allumé malgré le délai de veille, et le son de fin se joue à l’échéance. Refaire avec un compte à rebours d’une minute.
2. **Verrouillage manuel.** Relancer une minute et appuyer sur le bouton latéral avant la fin. Attendre au-delà de l’échéance puis déverrouiller et rouvrir Roundr. Attendu pour ce périmètre V0 : aucune sonnerie garantie sous écran verrouillé. La durée est recalculée et la phase arrivée à échéance au retour. Le son peut alors être joué en retard. L’option Écran allumé empêche la veille automatique seulement.
3. **Terrain.** Avant le départ, toucher Arrêter la session → Abandonner. Après retour au menu, quitter et rouvrir Expo Go. La carte de reprise a disparu. Relancer, marquer un but, verrouiller/déverrouiller d’un toucher, puis Recommencer → Remettre à zéro. Le message annonce la remise à zéro et Annuler restaure le score pendant cinq secondes. En paysage, le chrono et les commandes restent utilisables.
4. **Navigation iOS.** Ouvrir un détail de Tournois joués, un chrono via le choix du type, et un résultat de tirage. Faire le geste depuis le bord gauche : retour d’un niveau. Pour le thème système, sélectionner « Comme le téléphone », changer l’apparence iOS puis revenir : la palette suit.
5. **Android.** Le retour système sur un résultat classique doit archiver puis afficher l’accueil. Depuis un match actif, quitter via la flèche : un seul accueil, puis le retour système quitte l’app. Le bouton système revient d’un niveau dans les sous-vues.

L’icône installée et le splash appartiennent à la recette d’un build autonome.

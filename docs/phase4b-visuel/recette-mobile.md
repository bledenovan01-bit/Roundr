# Recette physique — iPhone et Android

Effectuer les essais sur une version contenant le commit final de la PR, avec les mêmes paramètres sur les deux téléphones. Les exports web/iOS/Android automatisés ne remplacent pas cette recette. Ne pas utiliser les enveloppes QA qui injectent des séances synthétiques.

| Essai | Résultat attendu |
|---|---|
| Chronomètre sans équipes | Démarrer, enregistrer au moins trois tours, Pause/Reprendre. Meilleur et plus lent tour lisibles ; durée de chaque tour et total corrects. |
| Longue séance | Plus d’une heure : heures, minutes, secondes et centièmes lisibles dans les trois vues, portrait/paysage. |
| Carrousel | Onglets, points et gestes horizontaux dans les deux sens. Rester plus de huit secondes : aucune bascule automatique. Un balayage ne change pas écoulé/restant. |
| Gestes verticaux | Défilement des tours/équipes sans ajout de score ni commande temporelle involontaire. |
| Équipes et scores | Tester 2, 3 et 8 équipes, noms longs et couleurs. +1 par appui, retrait par appui long, jamais de score négatif ; aucun ajout pendant un glissement. Scores cachés lorsqu’ils sont désactivés. |
| Réinitialiser puis Annuler | Temps, tours et chaque score identiques, y compris après fermeture/réouverture. |
| Réinitialiser puis confirmer | Chrono prêt et arrêté, tours effacés, scores conservés. Même vue et mêmes réglages. |
| Recommencer puis Annuler/confirmer | Annuler conserve tout. Confirmer remet aussi tous les scores à zéro ; séance prête et arrêtée. |
| Terminer puis Annuler/confirmer | Annuler conserve la séance ; confirmer ferme uniquement la séance active après écriture réussie. Mes chronos reste disponible. |
| Compte à rebours | Vérifier restant/écoulé, pause, zéro, fin et relance. Tester une durée avec annonces d’une minute et de trente secondes. Bannière non bloquante disparaissant en environ 4,5 s, même en pause. |
| Intervalles variables | Exemple : 30/45/60 s, repos 10 s, deux séries, repos de série 15 s. Chaque durée doit être respectée ; tableau courant/suivant cohérent. |
| Intervalles manuels | À zéro : attente, aucun départ de la suite. « Lancer : … » démarre uniquement la période indiquée. Tester Passer et la dernière période. |
| Intervalles automatiques | Enchaînement correct, y compris si plusieurs étapes se sont écoulées pendant une interruption. Ne pas rejouer une rafale d’anciens signaux. |
| 30/30 | Vérifier le comportement conservé : huit travaux de 30 s, 4 minutes sans repos intercalé pour le programme rapide concerné. Ne pas le modifier dans cette recette. |
| Reprise hors ligne | Arrêter le réseau, lancer, ajouter tours/scores, fermer complètement et rouvrir. Comparer à une horloge externe ; vue choisie et toutes les données doivent être restaurées. |
| Interruption | Accueil/paramètres, verrouillage du téléphone, appel, notification système, application en arrière-plan. Au retour : temps cohérent et transitions rattrapées. Ne pas supposer qu’une alerte sonore est garantie pendant la suspension. |
| Sons et vibrations | Tester chaque préférence activée/désactivée, fin de durée, transition, volume, mode silencieux, casque/Bluetooth et musique d’une autre application. Noter les limites de chaque système. |
| Verrouillage Roundr | Appui long sur Paramètres, essayer scores, commandes, balayage et retour système ; aucune action involontaire. Déverrouiller par appui long/accessibilité. |
| Écran éveillé | Tester l’option existante activée puis désactivée, pendant marche et pause, sortie d’écran et fin de séance. Contrôler que Roundr libère correctement sa demande. |
| Zones sûres et accessibilité | Encoches, barre système Android, grande police, VoiceOver/TalkBack, rotation et boutons de confirmation entièrement accessibles. |
| Anciennes données | Reprendre une sauvegarde et un preset antérieurs aux Phases 4A/4B ; mêmes durées et scores. Ne pas remplacer une sauvegarde refusée sans comprendre l’erreur et la récupération proposée. |

Noter pour chaque essai : appareil, version système, commit, résultat et écart observé. Les états invalides ou les pannes de stockage doivent être injectés uniquement sur une installation de test dont les données sont sauvegardées.

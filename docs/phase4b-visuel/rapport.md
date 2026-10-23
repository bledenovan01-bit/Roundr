# Roundr — Phase 4B, écrans d’exécution du Chrono libre

Base Expo exacte : `1c9e30b22c52caf8b620b83fd00966d1d50102da`. Branche : `codex/roundr-lovable-phase-4b`. Cible de la PR en brouillon : `codex/roundr-lovable-phase-4a`. Référence Lovable : tag `v0-lovable-final`, commit `1c59720dc5b180d5b1bacfaf935902b4053895fa`, composant `FreeLive`.

## Rendu livré

La [galerie](index.html) compare 23 états dans les deux orientations : **46 paires**, à 390 × 844 et 844 × 390. Lovable est à gauche, Expo à droite. Les 92 captures originales restent non redimensionnées ; les paires ajoutent seulement leur légende. Les dimensions et empreintes figurent dans `manifest.json`. Les captures sont web, pas des captures d’appareils natifs.

| Parcours et état | Éléments comparés |
|---|---|
| Chronomètre prêt | En-tête, sous-titre, numérique, centièmes, statut et Démarrer |
| Chronomètre en cours | Numérique, commandes Fin/Tour/Pause |
| Chronomètre analogique | Cadran, graduations, aiguille, compteur secondaire, temps et libellé |
| Chronomètre circulaire en pause | Point mobile, anneau, temps, Reprendre |
| Tours et deux équipes | Scores, maillots, totaux cumulés, durées de tours, meilleur et plus lent |
| Huit équipes | Disposition compacte et commandes de score |
| Trois équipes sans scores | Noms et maillots sans commandes ni valeurs de score |
| Longue durée | Format `1:02:03.45` et place du suffixe |
| Compte à rebours prêt/en cours/en pause/terminé | Les trois vues, progression, arrivée à zéro, relance et sortie |
| Temps écoulé | Bascule réelle depuis le compteur prêt ; affichage à zéro |
| Annonce de temps | Bannière réellement déclenchée au seuil d’une minute |
| Intervalles prêts/en cours/repos | Période, série, travail/repos, périodes restantes, prochaine durée |
| Attente manuelle | Temps figé à zéro et commande explicite de lancement de la suite |
| Programme terminé | Statut, récapitulatif et relance du même programme |
| Réinitialiser/Recommencer/Terminer | Fenêtres ouvertes par les véritables commandes, dans les deux orientations |

Le chronomètre simple ne possède pas d’écran « terminé » conservé dans Lovable : Terminer efface la séance après confirmation. Aucun faux écran supplémentaire n’a été créé.

## Interactions raccordées

- Ordre Numérique → Analogique → Circulaire. Onglets, indicateurs et balayage manuel ; aucun retour automatique au chrono et aucun carrousel Échauffement.
- Vue sélectionnée et mode écoulé/restant conservés dans la séance, y compris après un rechargement. La configuration enregistrée dans Mes chronos demeure séparée de cette préférence de séance.
- Protection des gestes : une translation ne compte pas comme un appui sur le cadran ou un bouton de score. Un défaut où le balayage activait aussi la bascule écoulé/restant a été reproduit dans le navigateur, corrigé, puis retesté.
- Chronomètre : démarrage, pause, reprise, tours, totaux cumulés et distinction des meilleurs/moins bons tours comme dans Lovable (après trois tours).
- Compte à rebours : progression et arrivée à zéro calculées par horodatages ; relance de la même durée ; annonces d’une minute et de trente secondes lorsque prévues par la durée et le signal.
- Intervalles : durées individuelles Phase 4A, travail/repos, séries, passage automatique ou manuel, Passer. En manuel, atteindre la fin d’une période laisse la suivante à l’arrêt ; « Lancer : … » la démarre explicitement.
- Équipes : deux à huit, noms/couleurs, scores facultatifs, +1 par appui et retrait par appui long. Les scores ne descendent pas sous zéro. Ils sont indisponibles avant le premier démarrage.
- Les animations de changement de page, de score et de transition respectent la réduction des animations. Les captures comparatives sont stabilisées avec les animations réduites ; elles ne prouvent pas les animations sur téléphone.

## Commandes destructives et sauvegardes

| Action confirmée | Temps et tours | Scores | Réglages, équipes, Mes chronos |
|---|---|---|---|
| Réinitialiser | Remis à zéro ; séance prête, arrêtée | Conservés | Conservés |
| Recommencer la séance | Remis à zéro ; séance prête, arrêtée | Remis à zéro | Conservés |
| Relancer après la fin | Remis à zéro ; redémarrage explicite | Conservés | Conservés |
| Terminer | Séance active fermée après réussite de l’écriture | Séance fermée | Configurations enregistrées conservées |
| Annuler | Aucun changement | Aucun changement | Aucun changement |

Ces opérations utilisent le remplacement durable existant : la séance précédente reste disponible tant que sa protection et l’écriture du nouvel état n’ont pas réussi. Une erreur maintient la fenêtre et le message de sauvegarde ; aucune navigation ni fermeture ne présente un échec comme une réussite. Une relance générique du stockage n’applique pas silencieusement une commande abandonnée.

Le modèle ajoute uniquement des métadonnées facultatives `ui` : vue, écoulé/restant, démarrage déjà effectué et nom éventuel du chrono enregistré. Elles sont validées à la restauration. Leur absence conserve l’interprétation des anciennes sauvegardes ; aucune migration forcée ni réécriture d’un ancien preset n’est ajoutée. Une métadonnée invalide provoque le refus explicite de restauration et la conservation de la valeur brute, comme les autres états invalides.

Les calculs d’horodatages et le moteur autonome existant sont réutilisés. Les moteurs de Match classique, Maracana, Cup et Survie restent inchangés. Les écrans de configuration Phase 4A gardent leur rendu ; seuls leurs appels de préparation transmettent désormais le nom du chrono enregistré à l’écran d’exécution.

Le programme rapide **30/30 reste à 4 minutes sans repos intercalé** pour le programme Lovable concerné. L’arbitrage avant publication reste ouvert ; aucune modification de cette règle ni des anciens programmes dans ce lot.

## Essais web réellement effectués

Les annexes dans `interactions/` documentent les essais suivants sur l’export Expo et des données synthétiques isolées :

- Réinitialiser, Recommencer et Terminer, puis Annuler : texte complet de la séance identique après chaque annulation. Rechargement direct de `/chrono-libre/run`, sans réensemencement : mêmes temps, vue, tours et scores.
- Réinitialisation confirmée : temps/tours à zéro, scores conservés. Recommencement confirmé : scores également à zéro, état prêt, même vue après rechargement.
- Fin confirmée : sortie vers la route d’accueil après enregistrement de la fermeture. L’origine de test neuve peut ensuite afficher l’introduction déjà existante.
- Vue circulaire maintenue pendant plus d’une minute d’écoulement ; pause ensuite. Aucun déplacement automatique.
- Bascule écoulé/restant conservée après rechargement. Balayage réel vers Analogique, puis contrôle que cette bascule n’a pas changé involontairement.
- Appui réel de 650 ms sur +1 : retrait d’un but. Glissement sur ce bouton : aucun but ajouté. Appui long sur Paramètres : verrouillage, commandes désactivées, puis déverrouillage sans navigation intempestive.
- Intervalles manuels : attente → lancement du repos → Passer → attente → lancement de la période de 45 secondes. Pas de départ de la suivante sans cette action.
- Annonce visible en horloge réelle, pause du chrono, puis annonce disparue après une attente de 4,7 secondes. L’outil navigateur limitant les attentes longues, le test automatique vérifie en plus la frontière exacte de 4 500 ms.
- Panne d’écriture injectée uniquement dans l’enveloppe QA : réinitialisation refusée, fenêtre et erreur maintenues, aucune confirmation de succès. Après annulation et rechargement sans injection, les tours, le temps et les scores précédents restent présents.

Le test automatisé d’annulation reste nécessaire pour vérifier les octets enregistrés ; une comparaison de texte dans le navigateur ne permet pas à elle seule de prouver cette propriété.

## Contrôles automatisés

| Contrôle | Résultat local |
|---|---|
| Tests métier et sauvegardes | 21 suites réussies, dont les 20 suites existantes |
| Nouveaux scénarios | Commandes, scores 2–8, tours, vues restaurées, heures/centièmes, gestes, annonces, interruptions, durées individuelles et transitions manuelles/automatiques |
| Syntaxe | 109 fichiers TypeScript ; zéro erreur |
| TypeScript | Réussi, code de sortie 0 |
| ESLint app/src et nouveau test, zéro avertissement autorisé | Réussi, code de sortie 0 |
| Exports Android, iOS et web | Réussis |

Les anciens tests de migration, données invalides, pannes d’écriture, ordonnancement des écritures et archivage restent exécutés. Le nouvel oracle Lovable des intervalles de la Phase 4A reste inclus. Aucun contrôle ni règle ESLint n’est désactivé. Les journaux sont dans `controles/` ; la PR précise séparément le résultat GitHub du commit final.

## Écarts et adaptations explicites

1. **Musique :** Lovable ajoute une quatrième page simulée après le démarrage. Expo conserve trois pages réelles et trois indicateurs ; aucune fausse commande de lecture n’est montrée. Voir l’[étude native à poursuivre](musique-native.md).
2. **Fiabilité :** confirmations et sortie attendent l’écriture durable ; erreurs et récupération restent visibles. Cette protection est maintenue même si Lovable ferme immédiatement ses fenêtres.
3. **Native :** zones sûres, texte accessible, cibles d’appui étendues, gestes filtrés, verrouillage par appui long, désactivation du retour gestuel pendant le verrouillage. Les libellés longs restent tronqués dans l’en-tête comme Lovable ; l’état complet reste lisible sous le cadran.
4. **Signaux :** sons Expo et retour haptique natif réutilisent les préférences existantes. Le timbre et les vibrations ne sont pas une imitation du Web Audio/navigator.vibrate de Lovable et doivent être écoutés/ressentis sur appareil.
5. **Écran éveillé :** `expo-keep-awake` est déjà installé. Le Chrono libre utilise désormais l’option existante « garder l’écran éveillé » pendant un chrono en marche, avec libération au nettoyage. Son réglage par défaut n’est pas changé. Cela ne garantit aucun fonctionnement indéfini en arrière-plan.
6. **Rendu :** quelques différences de rastérisation SVG, de métriques de police et de bordure demeurent entre DOM et React Native Web. Les captures les exposent ; aucune équivalence pixel par pixel ou validation native n’est annoncée.

Le suivi global des horodatages rattrape les transitions lorsque l’application redevient active, même après un détour par l’accueil ou les paramètres. Il ne constitue **pas** un service d’alarme garanti lorsque le système suspend l’application. Aucun build signé ni essai physique n’a été réalisé.

La [recette iPhone/Android](recette-mobile.md) reste obligatoire. Arrêt après cette Phase 4B, en attente de validation utilisateur.

# Roundr — Phase 3A : proposition pour validation visuelle

Les écrans de match Classique et Maracana reprennent la composition Lovable figée. Cette livraison s’arrête à la Phase 3A, en attente de votre validation des captures.

## Références et périmètre

- Lovable : tag v0-lovable-final, commit 1c59720dc5b180d5b1bacfaf935902b4053895fa.
- Base native exacte : db2256cfae484f139cfcced4053b8c3a5dc4a3ce, branche codex/roundr-lovable-phase-2b.
- Branche proposée : codex/roundr-lovable-phase-3a ; nouvelle PR en brouillon vers la Phase 2B. Aucune fusion, aucune écriture sur main, aucun build EAS ou payant.
- Accueil, introduction, historique, configurations, Cup, Survie et Chrono libre conservent leurs écrans. Le nouveau rendu est réservé aux sessions Classique et Maracana. Les moteurs temporels et sportifs ne sont pas modifiés.
- Le composant commun PhaseFrame reçoit seulement une propriété hideBack facultative, utilisée pour le résultat Classique ; sa valeur par défaut conserve les autres écrans.

## Vérification préalable Phase 2B

Les sources et les sept paires de captures de preflight/ confirment : la coche de « Au temps » existe en Maracana des deux côtés ; Cup et Survie n’en affichent pas dans Lovable, et Expo respecte ce choix. Les quatre paires Golden goal utilisent une palette fermée et la personnalisation désactivée, avec les mêmes paramètres. Le champ de durée reste volontairement masqué dans Expo, conformément à votre décision. Aucun changement de configuration ni des anciennes PR n’a été nécessaire.

## Écrans et interactions

| Parcours | Couverture |
| --- | --- |
| Classique | Équipes et maillots, score actif/inactif, +1 et annulation par appui long, correction native, prêt/en cours/pause, restant/écoulé, mi-temps, période suivante, additionnel et résultat. |
| Chronomètres | Numérique et circulaire, centièmes à 42 % du chiffre principal, progression dans le sens Lovable, dimensions et marges portrait/paysage. |
| Carrousel | Ordre numérique → circulaire → prochain match en Maracana → Musique après le départ ; choix manuel conservé après rotation. Aucun retour après huit secondes et aucune page Échauffement. |
| Maracana | Prochaines affiches certaines ou « Vainqueur », rotation classique/gagnant reste, nul avec une ou deux sorties, classement, prolongation à trois équipes. |
| Lancement suivant | Manuel : la rencontre est préparée et attend Démarrer. Automatique : démarrage selon le choix enregistré. Différé : délai horodaté, pause/reprise, annulation et départ immédiat. |
| Bannières | Préparation à quatre minutes, préparation à une minute, annonces à une minute et trente secondes, priorité, fenêtre de reprise et disparition après 4,5 s. Elles n’interceptent aucun toucher et ne déplacent pas le carrousel. |

## Sauvegardes et détails de résultat

Les nouvelles séances Classique enregistrent un détail facultatif des temps réellement joués et des buts. Ces observations utilisent l’horloge existante ; elles ne changent aucun calcul de temps, score, rotation ou classement. Une correction ajoutée après la fin porte « Correction », sans faux horodatage.

Les anciennes sauvegardes restent valides sans ce champ. L’écran indique alors que le détail n’était pas enregistré. Les données de détail invalides sont refusées par la validation existante ; la valeur brute est préservée. Les échecs d’écriture restent visibles et réessayables, et le stockage conserve sa dernière valeur durable.

Comme dans Lovable, le résultat Classique reste consultable dans la séance terminée avant le retour à l’accueil ou le rejeu. Il peut donc être retrouvé après rechargement ; l’archivage utilise ensuite le mécanisme fiable existant. Les tests couvrent les métadonnées, la clôture à zéro, les corrections, les redémarrages et les sauvegardes historiques sans détail.

## Preuves et mesures

- 30 états de match, chacun en 390 × 844 et 844 × 390 : 60 paires, 120 captures. Les sept paires préalables sont séparées.
- Composants Lovable importés inchangés dans une copie isolée du commit figé ; composants Expo identiques aux fichiers livrés, avec états produits par leurs moteurs publics.
- Horodatages figés pour comparer exactement les centièmes. Les animations de comparaison sont stabilisées : chemin réel de réduction des animations dans Expo, neutralisation des seules transitions CSS dans l’adaptateur Lovable. Ces captures ne valident pas les animations ordinaires ; les essais d’interaction dans l’export normal sont consignés séparément.
- Adaptateurs et catalogue dans reproduction/. Aucune route QA ni horloge figée dans les exports de production.
- Toutes les dimensions des images ont été contrôlées. Les dix planches contact ont été examinées ; consulter les images individuelles à 100 % pour les détails.
- Écarts maximaux mesurés des boîtes communes : en-tête 0.000 px ; tableau de score 1.250 px ; carrousel 2.500 px ; pied de commandes 0.000 px. Ces relevés ne prouvent pas une identité pixel par pixel. Les arrondis de mesure natifs et le rendu des polices peuvent varier légèrement.

## Adaptations natives et écarts résiduels à valider

1. La page Musique Lovable est une démonstration. Expo affiche explicitement « Contrôle musical indisponible », sans commandes simulées. L’ordre des pages est conservé.
2. Les confirmations natives Fin, Relancer, Rejouer et Terminer la session restent présentes pour protéger les données. Lovable exécute plusieurs de ces actions directement.
3. La correction de score, le grand chrono et le verrouillage sont conservés : toucher le score pour corriger ; appui long sur le chrono pour agrandir ; appui long sur Paramètres pour verrouiller/déverrouiller. Les retours système sont bloqués pendant le verrouillage. Les commandes normales Paramètres restent accessibles par un toucher.
4. Ajouter une équipe garde un formulaire natif de nom et la validation des doublons, au lieu d’un ajout générique immédiat. Le plafond de huit et les règles de rotation restent ceux déjà validés ; les identifiants d’équipes importées ne sont pas réutilisés.
5. Le classement garde les règles natives déjà validées. Dans certaines égalités, son ordre peut différer de Lovable, qui ne compare que points et différence de buts. Aucune règle sportive n’est supprimée dans ce lot.
6. En paysage, des libellés de rotation peuvent être tronqués dans Expo au lieu de déborder comme dans le CSS Lovable ; le texte complet reste accessible. Le halo du vainqueur et de très petits arrondis typographiques peuvent varier selon le rendu natif. Les zones sûres et les tailles tactiles sont adaptées ; le paysage défile pour accéder à toutes les actions.
7. Les réglages et mécanismes natifs de sons, vibrations et notifications restent inchangés. Les nouveaux seuils concernent les bannières visuelles Lovable ; la restitution sonore et l’annonce vocale restent à contrôler sur téléphone.

## Contrôles réellement exécutés

| Contrôle | Résultat local |
| --- | --- |
| Métier et sauvegardes | 15 suites exécutées, succès ; nouvelle suite Phase 3A incluse. |
| Syntaxe TypeScript | 95 fichiers analysés, 0 erreur. |
| Types | tsc --noEmit, succès. |
| ESLint application | npm run lint avec corrections désactivées, succès après ajout du yarnpkg déjà installé au PATH local. |
| ESLint renforcé | app/, src/ et nouveau test, --max-warnings 0, succès. |
| Android | Export local Hermes réussi ; ce n’est pas un APK installé. |
| iOS | Export local Hermes réussi ; ce n’est pas une application signée sur iPhone. |
| Web | Export de production réussi et ouvert dans le navigateur. |

Les journaux sont dans controles/. Les empreintes des fichiers et des trois bundles sont dans mesures.json. Le workflow ajoute uniquement la nouvelle branche de push et la cible de PR Phase 2B ; aucun job ou règle n’est désactivé. Le lint élargi historique eslint . n’a pas été relancé ni présenté comme corrigé.

Dans le navigateur de production, restauration de la pause (14:12.11, score 1–0) puis correction +1/−1 contrôlées. Un premier essai a également conservé le cadran plus de huit secondes et restauré le temps après rechargement. La confirmation web de relance a ensuite bloqué le contrôle du navigateur intégré ; son annulation n’est pas présentée comme validée par cet essai. Les transitions et les fonctions de relance sont couvertes séparément par les tests métier. Voir interactions-production.json pour les assertions effectuées dans l’export normal.

## Recette iPhone et Android — encore nécessaire

1. Créer un Classique, démarrer, ajouter deux buts, annuler un but par appui long, mettre en pause, fermer puis rouvrir hors ligne. Vérifier score, temps, reprise et résultat.
2. Choisir le cadran circulaire, tourner le téléphone, attendre plus de huit secondes ; la vue doit rester choisie. Toucher le chrono pour restant/écoulé et tester le grand affichage par appui long.
3. Verrouiller par appui long sur Paramètres ; tenter score, carrousel, commandes et retour Android/geste iOS. Déverrouiller puis ouvrir Paramètres et revenir au match.
4. Vérifier mi-temps et départ explicite de la seconde période ; additionnel, pause/reprise et fin. Relancer puis Annuler : aucun changement. Relancer puis confirmer : score/temps remis à zéro, nouveau départ attendu.
5. En Maracana, tester trois puis cinq équipes, gagnant reste et les deux règles de nul. Vérifier entrées/sorties, classement et corrections avant la rencontre suivante.
6. Manuel : Lancer le prochain match prépare le chrono, Démarrer le lance. Automatique : vérifier le départ prévu. Différé : pause, reprise, annulation, départ immédiat, fermeture pendant le délai et retour hors ligne.
7. Vérifier bannières sans blocage des gestes, disparition après 4,5 s, sons/vibrations, notifications, veille, interruption et retour en arrière-plan. Contrôler les actions en bas des fenêtres en paysage avec l’encoche et la barre système.
8. Tester VoiceOver/TalkBack, grande taille de texte et Réduire les animations. Vérifier aussi une ancienne sauvegarde sans détail des buts.

Aucun appareil physique n’a été utilisé pour cette livraison. Ces essais et votre validation visuelle restent nécessaires avant la suite. Aucune Phase suivante ne commence et aucune PR n’est fusionnée.


## Complément de finalisation

Voir [la finalisation de la PR #9](finalisation/rapport.md) et [les six nouvelles paires de rotations](finalisation/index.html) : libellés paysage corrigés, contrôle du portrait, nouvelle suite de confirmations, résultats actualisés et limites des boîtes réelles. Les résultats ci-dessus décrivent le checkpoint initial ; le complément fait foi pour ces retouches.

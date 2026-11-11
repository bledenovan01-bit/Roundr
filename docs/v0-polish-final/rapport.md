# Roundr V0 — dernier polish UX/UI et éditorial

Branche `claude/roundr-v0-final-polish`, basée sur `codex/roundr-technical-cleanup`
(sommet de la pile de PR ouvertes, n° 24). Aucune règle métier, aucun calcul de
chrono, aucune sauvegarde ni aucun son n'est modifié.

## 1. Ce qui change

### Textes (améliorations 1, 2 et 6)

- Titre de l'accueil et descriptions des modes réécrits.
- Introductions des écrans de réglages réécrites.
- Tutoiement partout où Roundr s'adresse à l'utilisateur. L'application mélangeait
  « tu » et « vous » d'un écran à l'autre. Les annonces destinées aux équipes
  (« préparez-vous », « échauffez-vous ») restent au pluriel : elles parlent à
  plusieurs joueurs.
- « Roundr · maquette interactive V0 » (À propos) remplacé : ce libellé de
  maquette ne convenait pas à une application publiée.

### Mise en page des chronos (améliorations 3 et 4)

Cause du vide : la carte du chrono avait une hauteur fixe (232 pt en match,
220 pt en chrono libre) quel que soit l'écran. Sur un grand téléphone, tout le
reste de la hauteur restait vide sous la carte.

Correction, en portrait uniquement :

- la carte du chrono prend la hauteur que l'écran laisse libre, jusqu'à une
  limite (+160 pt en match, +220 pt en chrono libre) ;
- les chiffres et les cadrans (numérique, circulaire, analogique) grandissent
  avec la carte, sans jamais dépasser sa largeur ;
- au-delà de la limite, la carte est centrée dans la zone disponible ;
- les vues « Prochain match », « Tournoi » et « Musique » gardent leur hauteur
  de référence, centrées dans la carte.

Les tailles Lovable restent le minimum. Elles sont conservées à l'identique :

- en paysage et en affichage deux colonnes ;
- sur les petits écrans, où il n'y a pas de hauteur libre ;
- quand le contenu remplit déjà l'écran (équipes, tours, intervalles, tournoi) ;
- quand la taille de texte du téléphone est agrandie (au-delà de ×1,15).

La logique est isolée dans `frontend/src/features/chrono-layout.ts` (calcul pur,
sans accès au chrono, à la session ni au stockage).

### Interactions (amélioration 5)

- Les boutons du bas des écrans de chrono (Fin, Relancer, Pause/Reprendre, Tour…),
  les boutons d'en-tête et le lien « Voir le classement » n'avaient aucun retour
  visuel à l'appui. Ils réagissent maintenant comme le reste de l'application
  (légère réduction et atténuation, immédiates).
- Le point actif du carrousel s'étire en 180 ms au lieu de sauter. Respecte le
  réglage « Réduire les animations ».
- Le retour à l'accueil depuis une session s'anime comme un retour, plus comme
  l'ouverture d'une nouvelle page.

Aucune nouvelle dépendance. Le carrousel reste manuel : aucune minuterie ne
change de vue.

## 2. Textes avant / après

### Accueil

| Élément | Avant | Après |
| --- | --- | --- |
| Titre | Quel format aujourd'hui ? | On joue comment ? |
| Match classique | Un match, une ou deux mi-temps. | Deux équipes, un chrono, et ça joue. |
| Maracana | 3 à 8 équipes qui tournent sur le terrain. | 3 à 8 équipes, et ça tourne. |
| Cup | Poules puis phases finales. | Les poules d'abord, le titre au bout. |
| Survie | Élimination directe jusqu'au vainqueur. | Tu gagnes, tu restes. Sinon, dehors. |
| Chrono libre | Chronomètre, compte à rebours et intervalles personnalisés. | Chronomètre, compte à rebours ou intervalles : à toi de régler. |
| Faire les équipes | Tirage au sort à partir des joueurs présents | Ajoute les joueurs, on tire au sort. |

Le titre proposé, « On joue comment aujourd'hui ? », passe sur deux lignes à la
taille du titre et pousse « Paramètres » hors de l'écran sur un iPhone standard.
La version courte tient sur une ligne. Le slogan « Moins d'organisation, plus de
jeu. » est conservé.

### Introduction et réglages des modes

| Écran | Avant | Après |
| --- | --- | --- |
| Introduction | … Roundr gère le match pour que vous profitiez du terrain. | … Roundr gère le match, toi tu profites du terrain. |
| Match classique | Un match simple entre deux équipes, avec ou sans mi-temps. | Deux équipes, un terrain, un chrono. Règle la durée et les mi-temps, puis coup d'envoi. |
| Maracana | Les équipes tournent à chaque match. Les deux équipes en attente entrent, celles qui sortent repassent en fin de file. | Les équipes tournent à chaque match. Roundr gère la rotation, la file d'attente et le classement. |
| Cup | Des poules pour tout le monde, puis les meilleurs se qualifient pour les phases finales. | Des poules pour tout le monde, puis les meilleurs filent en phases finales. Jusqu'au titre. |
| Survie | (inchangé) | Élimination directe : le gagnant avance, le perdant sort. Jusqu'au dernier debout. |

L'ancienne description du Maracana était fausse avec la règle « Le gagnant
reste » : elle ne décrivait que la rotation classique.

### Chrono libre

| Élément | Avant | Après |
| --- | --- | --- |
| Introduction | Choisissez votre chrono. Les équipes sont facultatives. | Choisis ton chrono. Avec ou sans équipes. |
| Chronomètre | Départ à 00:00, tours, sans durée limite. | Part de zéro, sans limite, avec tours. |
| Compte à rebours | Durée personnalisée, fin automatique à zéro. | Tu fixes la durée, il s'arrête tout seul à zéro. |
| Intervalles | Périodes, repos et répétitions enchaînés. | Jeu, repos, séries : tout s'enchaîne. |
| Aide chronomètre | … continue jusqu'à votre arrêt. … | … continue jusqu'à ce que tu l'arrêtes. … |
| Mes chronos (vide) | Réglez un chrono puis touchez « Enregistrer dans Mes chronos »… | Règle un chrono puis touche « Enregistrer dans Mes chronos »… |
| Durée nulle | Choisissez une durée supérieure à zéro. | Choisis une durée supérieure à zéro. |
| Enregistrement | … Les temps et tours de vos sessions ne les modifient pas. | … de tes sessions … |
| Nom manquant | Donnez un nom à ce chrono. | Donne un nom à ce chrono. |
| Fin de session | … Vos chronos enregistrés ne changent pas. | … Tes chronos enregistrés ne changent pas. |
| Erreur d'enregistrement | … Réessayez cette action. | … Réessaie. |

### Autres écrans

| Écran | Avant | Après |
| --- | --- | --- |
| Import d'équipes (3 écrans) | … votre dernière composition en compte N. | … ta dernière composition en compte N. |
| Import d'équipes (3 écrans) | Composition importée : vous pouvez encore la modifier ci-dessous. | Composition importée : tu peux encore la modifier ci-dessous. |
| Faire les équipes | Ajoutez au moins N joueurs… | Ajoute au moins N joueurs… |
| Faire les équipes | … Modifiez ou retirez les doublons avant le tirage. | … Modifie ou retire les doublons avant le tirage. |
| Faire les équipes | Choisissez l'équipe où déplacer X. / Touchez un joueur… | Choisis l'équipe où déplacer X. / Touche un joueur… |
| Faire les équipes | … activez « Personnaliser les équipes » puis touchez « Importer mes équipes ». Vous pourrez encore… | … active … puis touche … Tu pourras encore… |
| Tournoi | désignez / Saisissez la séance / Terminez la rencontre / Sélectionnez | désigne / Saisis la séance / Termine la rencontre / Sélectionne |
| Historique (vide) | Terminez ou interrompez une Cup ou une Survie : son palmarès apparaîtra ici automatiquement. | Joue une Cup ou une Survie : son palmarès s'affichera ici, même si tu l'arrêtes en route. |
| Paramètres, À propos | Roundr · maquette interactive V0 | Roundr V0 · Moins d'organisation, plus de jeu. |
| Paramètres | Impossible d'ouvrir l'assistance. Réessayez. | … Réessaie. |
| Musique | Connectez votre musique / Autorisez Roundr… / Reconnectez… / Lancez… / Utilisez le Centre de contrôle. | Connecte ta musique / Autorise Roundr… / Reconnecte… / Lance… / Utilise le Centre de contrôle. |
| Équipes enregistrées | … Réessayez. (2 messages) | … Réessaie. |

Non modifiés volontairement : libellés des commandes (Fin, Relancer, Pause,
Reprendre, Tour), confirmations de fin et de relance, messages de sauvegarde,
annonces aux équipes. Ils sont courts, précis et déjà validés.

## 3. Écrans concernés

- Accueil, introduction.
- Réglages : Match classique, Maracana, Cup, Survie, Chrono libre (choix du
  type, réglages, Mes chronos).
- Match en cours (Classique, Maracana, Cup, Survie) : carte du chrono, commandes.
- Chrono libre en cours (chronomètre, compte à rebours, intervalles).
- Faire les équipes, Historique, Paramètres, carte Musique.

Captures avant/après dans `captures/` (navigateur, 390 × 844) :

| Écran | Avant | Après |
| --- | --- | --- |
| Accueil | `accueil-avant.jpg` | `accueil-apres.jpg` |
| Match classique | `match-classique-avant.jpg` | `match-classique-apres.jpg` |
| Chrono libre avec tours | `chrono-libre-avant.jpg` | `chrono-libre-apres.jpg` |
| Chrono libre, cadran analogique | — | `chrono-libre-analogique-apres.jpg` |
| Match classique, paysage (inchangé) | — | `match-classique-paysage-apres.jpg` |

## 4. Vérifications

| Contrôle | Résultat |
| --- | --- |
| `npm run typecheck` | Aucune erreur |
| `npm test` (30 suites, dont la nouvelle `test-chrono-layout.ts`) | Tout passe |
| `npm run test:syntax` | 128 fichiers, 0 erreur |
| ESLint sur les fichiers modifiés | Aucune erreur, aucun avertissement |
| ESLint sur tout le projet | 4 erreurs, toutes déjà présentes avant (scripts `.cjs` non modifiés) |
| Rendu navigateur 390 × 844, 320 × 568 et 844 × 390 | Conforme, aucune erreur console |

Vérifié dans le navigateur : accueil, choix du chrono libre, chronomètre (trois
cadrans, démarrage, deux tours), match classique (vues numérique et circulaire),
paysage, petit écran. Le chrono a continué de tourner sans écart pendant les
rechargements.

Non exécuté sur ce poste :

- `expo lint` (yarn absent) : ESLint a été lancé directement ;
- `expo-doctor`, export des bundles et tests navigateur Playwright : ils
  tournent dans la CI de la PR.

Un seul test existant a été adapté : `test-music-control.ts` attendait l'ancien
texte « Connectez votre musique ».

## 5. Limites

- Aucun test sur iPhone ou Android physique. Tout le rendu a été vérifié dans
  un navigateur, sans zones de sécurité réelles.
- Chronomètre avec tours : la carte du chrono rétrécit à chaque nouveau tour
  jusqu'à retrouver sa taille de référence, pour que la liste reste visible sans
  défiler. Le changement de taille n'est pas animé.
- Les maquettes Lovable ne couvrent pas ces tailles agrandies : c'est un écart
  volontaire par rapport à la référence, limité au portrait.
- Observation hors périmètre, déjà présente avant ce chantier : dans le
  navigateur, après un rechargement complet de la page sur un chrono libre réglé
  sur « Circulaire » ou « Analogique », l'onglet est bien sélectionné mais le
  cadran numérique reste affiché jusqu'au prochain changement de vue. Non vérifié
  sur appareil.

## 6. À valider sur iPhone

1. Accueil : le titre et chaque description tiennent sur une ligne (iPhone
   standard) ; rien n'est coupé sur iPhone SE.
2. Match classique en portrait : la carte du chrono remplit l'espace, sans
   toucher les commandes ni la zone de l'indicateur d'accueil.
3. Maracana, Cup, Survie : le lien de classement et les bannières d'annonce
   restent visibles sous le chrono.
4. Chrono libre : les trois cadrans, puis ajout de plusieurs tours (la carte
   rétrécit, la liste apparaît).
5. Rotation portrait ↔ paysage en cours de match : retour immédiat aux tailles
   de référence en paysage.
6. Taille de texte agrandie dans les réglages iOS : la mise en page de référence
   est conservée.
7. Appui sur Pause, Fin, Relancer : le retour visuel est net, sans retard.
8. Changement de vue du carrousel au doigt et par les points.
9. Retour à l'accueil depuis un match : sens de l'animation.
10. Chiffres du chrono pendant le défilement des centièmes : pas de saccade
    avec la taille agrandie.
11. Ton des nouveaux textes, en particulier le tutoiement et la description de
    la Survie.

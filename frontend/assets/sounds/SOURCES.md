# Roundr — identité sonore officielle

Fichiers originaux fournis dans Téléchargements par le propriétaire du projet.
Identifiants, noms, auteurs, métadonnées et licences vérifiés sur les pages
Freesound le 25 octobre 2026. Ces cinq pages affichent **CC0 1.0** :
<https://creativecommons.org/publicdomain/zero/1.0/>.
Les SHA-256 des originaux et des dérivés figurent dans `official-manifest.json`.

| Référence | Source et auteur | Fichier livré | Traitement |
|---|---|---|---|
| A2 | [metal whistle.wav — strongbot, 568995](https://freesound.org/people/strongbot/sounds/568995/) | whistle.wav, final.wav | Même prise, 0,65–1,45 s, fondus de bord de 10 ms ; 0,8 s |
| B1 | [Millerntor Stadium Goal Reaction 01 — itmightgetloud / Philipp Feit, 829455](https://freesound.org/people/itmightgetloud/sounds/829455/) | alert.wav | 0,35–4,35 s du fichier retenu, fondus de 150 ms ; 4 s |
| C1 | [Digital Interface Alert 20 — JW_Audio, 815943](https://freesound.org/people/JW_Audio/sounds/815943/) | gong.wav | Fichier complet, conversion PCM16 / 44,1 kHz ; 0,552 s |
| D1-A | [hint.wav — dland, 320181](https://freesound.org/people/dland/sounds/320181/) | prep.wav | Données PCM inchangées, une lecture ; 0,265 s |
| D2 | Même Hint de dland | free-final.wav | Hint exact + silence de 80 ms + Hint exact ; 0,610 s |
| E1 | [Menu Selection Click — NenadSimic, 171697](https://freesound.org/people/NenadSimic/sounds/171697/) | confirmation.wav | Fichier complet, conversion PCM16 ; 0,228 s |

Les extraits courts ont été expressément choisis par le propriétaire pendant
cette intervention. Aucun son extérieur à cette sélection, aucune synthèse,
aucun changement de hauteur ou de vitesse. Tous les WAV livrés sont PCM16,
stéréo, 44,1 kHz. Reconstruction : Python 3.12,
`python scripts/prepare-official-audio.py <dossier-des-originaux>`.

## Correspondances et conservation des préférences

La base `4650ae5` avait cinq ressources synthétiques : `whistle` pour le départ,
`final` pour la fin du match et du Chrono libre, `alert` pour le but, `prep`
pour la préparation, `gong` pour les minutes et les fins de période / transitions
du Chrono libre. Les réglages enregistrés utilisent ces cinq clés ; elles restent
inchangées, ainsi que le volume, les interrupteurs et le mode mixWithOthers.

| Événement existant | Préférence / appel conservé | Ressource officielle |
|---|---|---|
| Début de match | startSound (défaut whistle) | A2 |
| But | goalSound (défaut alert) | B1 |
| Minute / 30 secondes restantes | minuteSound (défaut gong) | C1 |
| Fin de période | periodSound (défaut gong) | D1-A via contexte periodEnd |
| Fin de match | endSound (défaut final) | A2 |
| Échauffement / préparation | warmupSound (défaut prep) | D1-A |
| Transition du Chrono libre | appel gong existant | D1-A via contexte freeTransition |
| Fin du Chrono libre | appel final existant | D2 via contexte freeEnd, un seul play() |

Les choix alternatifs par événement restent enregistrés et utilisables. Le
contexte distingue uniquement les usages partagés de `gong` et `final`. La
sélection/priorité des événements, leurs conditions, le nombre d'appels et les
garde-fous de silence restent identiques. `next` n'avait pas de son propre et
n'en reçoit aucun. La musique n'est pas modifiée.

**E1 : ressource embarquée et vérifiée, volontairement sans événement.** La base
ne contient aucun événement sonore de confirmation. En créer un contredirait
l'instruction de ne pas ajouter de déclenchement. Son activation nécessiterait
une demande séparée définissant les confirmations concernées.

L'ancien générateur `generate-sport-sounds.cjs` décrit la bibliothèque synthétique
historique ; ne pas le relancer pour reconstruire les sons officiels.

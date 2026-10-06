# Sons Roundr — proposition stade

Les cinq WAV mono sont synthétisés pour Roundr, sans échantillons externes. Ils sont embarqués et joués au volume défini dans les paramètres, en coexistence avec la musique.

| Fichier | Son | Durée | Déclenchement par défaut |
| --- | --- | --- | --- |
| whistle.wav | Sifflet d’arbitre | 0,65 s | Début / reprise d’un chrono remis à zéro |
| final.wav | Trois coups de sifflet | 1,9 s | Fin du match |
| alert.wav | Fanfare courte de célébration | 1,65 s | But marqué |
| prep.wav | Gong de préparation | 1,2 s | Première préparation et rappels |
| gong.wav | Gong de transition | 1,8 s | Fin de période, départage, alertes chronométrées |

Les paramètres permettent d’écouter tous les sons et de choisir les variantes de début, fin et but. `SOUND_CATALOG` dans `src/audio/sounds.ts` centralise leur liste. Les quatre premiers noms existaient avant ce changement ; leurs fichiers ont été remplacés. Le gong de transition est nouveau.

Pour remplacer un effet, garder son nom de fichier WAV, puis mettre à jour sa description et sa durée dans le catalogue. `node scripts/generate-sport-sounds.cjs` recrée cette proposition et écrase les cinq fichiers : ne pas l’exécuter après avoir installé des enregistrements personnalisés.

Les cartes du chrono se consultent en glissant ou via les trois boutons sous le chrono. Leur affichage automatique intervient au délai de préparation du moteur, puis à une minute de la fin : prochain match 8 s, échauffement 8 s, retour au chrono. En pause ou sans limite de temps, elles restent disponibles manuellement. Le délai de préparation dépend de la durée du prochain match. Les animations respectent le réglage système de réduction des mouvements.

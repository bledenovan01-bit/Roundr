# Roundr — sources de l’identité sonore définitive

Validation définitive demandée par le propriétaire le 27 octobre 2026. Sources Freesound déjà vérifiées CC0 1.0 ; les fichiers finaux sont exclusivement les variantes des deux packs validés, sans nouveau traitement.

| Référence | Source / auteur | Livraison |
|---|---|---|
| A2 | [Metal Whistle — strongbot, 568995](https://freesound.org/people/strongbot/sounds/568995/) | whistle.wav équilibré ; final.wav P2, deux courts puis un long naturel |
| B1 | [Millerntor Stadium Goal Reaction — itmightgetloud / Philipp Feit, 829455](https://freesound.org/people/itmightgetloud/sounds/829455/) | alert.wav V2 exacte, 1,25–3,65 s du WAV de référence de 4 s, soit 1,60–4,00 s du Freesound original |
| C1 | [Digital Interface Alert 20 — JW_Audio, 815943](https://freesound.org/people/JW_Audio/sounds/815943/) | gong.wav équilibré |
| D1-A / D2 | [Hint — dland, 320181](https://freesound.org/people/dland/sounds/320181/) | prep.wav équilibré ; free-final.wav = deux copies PCM identiques séparées par 160 ms |
| E1 | [Menu Selection Click — NenadSimic, 171697](https://freesound.org/people/NenadSimic/sounds/171697/) | confirmation.wav équilibré, sans événement |

[Licence CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Les cinq originaux fournis par le propriétaire sont identifiés par leur empreinte dans official-manifest.json. Ce manifeste conserve également les ZIP validés, leurs empreintes, les membres exacts et celles des sept WAV. Les traitements antérieurs à la validation et les mesures figurent dans les packs d’écoute.

Les six fichiers hors but viennent de Roundr_Pack_Ecoute_2026-10-27_PR17.zip. B1 vient de Roundr_B1_Explosion_Comparatif_2026-10-27.zip, membre B1_V2_1.25-3.65s_2s40.wav : ni V1, ni V3, ni l’ancienne version courte. Aucun extrait n’est recréé depuis les originaux. prepare-official-audio.py recopie seulement les membres approuvés après vérification.

## Correspondances et préférences conservées

| Événement existant | Préférence / appel | Ressource par défaut |
|---|---|---|
| Début de match | startSound / whistle | A2 équilibré |
| But | goalSound / alert | B1 V2 |
| 1 minute / 30 secondes restantes | minuteSound / gong | C1 équilibré |
| Fin de période | periodSound / gong, contexte periodEnd | D1-A équilibré |
| Fin de match | endSound / final | P2, trois coups |
| Préparation / échauffement | warmupSound / prep | D1-A équilibré |
| Transition libre | gong, contexte freeTransition | D1-A équilibré |
| Fin libre | final, contexte freeEnd | D2 équilibré, 160 ms |

Choix personnalisés et off conservés. L’aperçu de fin de période passe le même contexte periodEnd que l’événement réel. Aucun changement des conditions, priorités, nombre d’appels, volume ou coexistence mixWithOthers. next n’a pas de son propre ; la musique n’est pas modifiée.

E1 reste embarqué sans événement connecté : aucun son de confirmation ajouté.

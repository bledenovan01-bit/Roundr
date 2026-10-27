# Roundr — identité sonore définitive

Les sept WAV sont copiés octet pour octet depuis les packs d’écoute validés du 27 octobre 2026 : aucun nouveau traitement. Format PCM stéréo, 44,1 kHz, 16 bits.

| Fichier | Version définitive | Durée |
|---|---|---:|
| whistle.wav | A2 équilibré | 0,800 s |
| final.wav | P2, deux coups courts et un long | 1,737937 s |
| alert.wav | B1 V2, 1,25–3,65 s du WAV précédent | 2,400 s |
| gong.wav | C1 équilibré | 0,551723 s |
| prep.wav | D1-A équilibré | 0,265193 s |
| free-final.wav | D2 équilibré, deux motifs, 160 ms de silence | 0,690385 s |
| confirmation.wav | E1 équilibré, sans événement connecté | 0,227687 s |

B1 vient exactement de Roundr_B1_Explosion_Comparatif_2026-10-27.zip : B1_V2_1.25-3.65s_2s40.wav. Les six autres viennent de Roundr_Pack_Ecoute_2026-10-27_PR17.zip. Membres exacts, SHA-256 des ZIP et des WAV dans official-manifest.json ; provenance et correspondances dans SOURCES.md.

Les préférences et clés enregistrées, volume, interrupteurs, choix alternatifs et off restent inchangés. Les aperçus utilisent désormais le contexte réel : fin de période avec le choix gong joue Hint ; une autre sélection reste prioritaire. Aucun déclenchement de match, transition ou Chrono libre n’est modifié. E1 reste réservé sans événement.

Vérifier sans écriture : python scripts/prepare-official-audio.py <dossier-des-deux-ZIP> --check. Sans --check, le script vérifie tous les fichiers avant de recopier les octets approuvés ; aucune synthèse, découpe ou conversion. Ne pas lancer l’ancien generate-sport-sounds.cjs sur ces ressources.

npm test contrôle les sept empreintes indépendantes du manifeste, la V2 exacte, les durées, le double Hint exact à 160 ms, les personnalisations et les appels des aperçus.

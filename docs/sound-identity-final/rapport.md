# Identité sonore définitive

Branche codex/roundr-sound-identity-final, basée sur la PR #17 au commit 7473ddcc684c2c36553d318fedd553e8098114d0. Aucun changement de cette référence.

## Livraison exacte

Sept copies binaires des variantes validées : A2 équilibré, fin P2 (deux courts/un long), **B1 V2 1,25–3,65 s / 2,40 s**, C1 équilibré, D1-A équilibré, D2 avec 160 ms et E1 équilibré. Le manifeste conserve sources, auteurs, empreintes des ZIP et membres exacts. Le test épingle les sept empreintes indépendamment du manifeste. Aucun fichier n’a été recréé ou retraité. Le script historique de préparation est remplacé par une installation des octets des ZIP, contrôlés avant écriture ; son mode --check est en lecture seule.

## Aperçus corrigés

L’aperçu de fin de période utilisait gong sans contexte et jouait C1, alors que le match résout ce choix vers Hint. Le bouton utilise maintenant le même contexte periodEnd. Les cinq choix alternatifs restent prioritaires, off désactive toujours le bouton, et les clés/valeurs enregistrées sont inchangées. Les durées du catalogue correspondent aux WAV. Aucun changement du dispatch des événements, règles, chronos, scores, volume, musique ou conditions de lecture. E1 reste embarqué sans événement.

## Vérifications exécutées

- TypeScript --noEmit, syntaxe (116 fichiers), ESLint app/src --max-warnings 0 et expo lint : réussis, zéro avertissement sur le périmètre applicatif.
- 25 suites métier/stockage/audio : réussies, y compris sauvegardes, reprise, cinq modes, SVG, clavier et maintien d’écran.
- Expo Doctor : 20/20 ; Expo 57.0.31 et React Native 0.86.3 conservés dans cette PR.
- Exports locaux web, Android et iOS : réussis ; sept WAV exportés dont les empreintes correspondent toutes aux fichiers approuvés.
- Navigateur Edge/Chromium : 78 écrans/états, 41 scénarios d’alertes et commandes à horloge contrôlée, dix configurations mobiles et 36 cas d’aperçu : réussis.
- Les aperçus utilisent les vrais boutons et le vrai lecteur : les WAV réellement téléchargés sont comparés par SHA-256, avec contrôle du contexte, volume, off, choix alternatifs et absence de mutation des préférences. Le mode audio du banc existant est ajouté au workflow existant.

Détails synthétiques dans checks.json, export-audio-integrity.json et audio-previews.json. Les artefacts détaillés des bancs sont conservés par le workflow GitHub Actions. Les avertissements RN préexistants pointerEvents et repli Animated restent visibles ; aucune erreur console/page détectée.

## Incidents d’exécution et limites

Le premier ESLint lancé sur tout le répertoire a relevé 23 erreurs/22 avertissements dans les scripts historiques et fichiers générés, hors du périmètre src/app configuré par Expo. Aucun nettoyage sans rapport n’est inclus. Le premier expo lint n’avait pas pu exécuter Yarn ; après installation de Yarn comme outil isolé hors du dépôt, le vrai contrôle Expo et le contrôle strict app/src ont été rejoués avec succès. Les premiers essais navigateur n’atteignaient pas le serveur à cause du bac à sable et de l’adresse IPv6 localhost ; les bancs complets ont ensuite été exécutés avec succès sur le serveur accessible. Ces échecs d’environnement ne sont pas comptés comme des validations.

Les aperçus sont des lectures logicielles de navigateur, pas une validation acoustique ou native. Aucun test physique iPhone/Android. L’intégration correspond aux choix artistiques définitifs déjà approuvés ; aucune nouvelle validation sonore demandée. Aucun build EAS ni fusion.

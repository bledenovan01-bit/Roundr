# Roundr — Phase 2A : configurations Match classique et Maracana

Les deux configurations reprennent le gabarit, les textes, les réglages et les valeurs initiales de Lovable. Les choix Maracana de lancement du prochain match et de rotation sont effectivement raccordés au moteur natif. Cette livraison s’arrête à la Phase 2A ; elle attend la validation visuelle et les essais sur téléphone.

## Sources et périmètre

- Lovable : bledenovan01-bit/roundr-mockup, tag v0-lovable-final, commit 1c59720dc5b180d5b1bacfaf935902b4053895fa. Sources laissées inchangées.
- Expo : branche codex/roundr-lovable-phase-2a, créée exactement depuis 4dd401d4ff315cc2825d5dff72bffcc34bbe00c0 sur codex/roundr-lovable-phase-1.
- Nouvelle PR en brouillon vers codex/roundr-lovable-phase-1. Le SHA livré figure dans la PR et le reçu de livraison. Aucune fusion, aucune modification de main ou des PR #5/#6.
- Aucun changement de dépendances, d’identifiants d’application, de règles Cup/Survie, de Faire les équipes, de Chrono libre, d’introduction, d’accueil ou d’historique. Les composants de configuration ajoutés ne sont utilisés que pour ces deux modes.
- Le moteur bas niveau du chronomètre demeure inchangé. Les horodatages existants pilotent aussi le délai Maracana. Seuls les raccordements nécessaires à ces options sont ajoutés au moteur de séance.

## Résultat fonctionnel

**Match classique.** La nouvelle configuration commence à 30 minutes et deux mi-temps, pause 5 minutes ; additionnel désactivé, score activé, personnalisation désactivée. Préréglages 10/30/45/90 minutes, durée personnalisée, une période ou deux mi-temps, pause, additionnel, score, noms, maillots et sons suivent la référence. Pour une nouvelle séance avec additionnel activé, chaque mi-temps comporte sa phase additionnelle ; la pause n’entre pas dans le temps joué.

**Maracana.** Valeurs initiales : 8 minutes, cinq équipes, noms et couleurs Lovable, fin au temps, lancement manuel, rotation classique. La fin aux buts et sa combinaison avec le temps sont effectives. Au moins un critère reste actif. Le nombre de buts sélectionné est conservé quand on désactive puis réactive ce critère.

La rotation classique et Le gagnant reste suivent la file Lovable. Les règles de nul — une équipe sort ou les deux sortent — sont visibles quand elles s’appliquent. Le lancement manuel, automatique et après délai sont raccordés. Le délai peut être mis en pause, repris, annulé ou interrompu par Démarrer immédiatement. Une correction du dernier score annule le lancement devenu obsolète. Les états sont sauvegardés et rechargés sans double résultat ou double départ.

La composition enregistrée de Faire les équipes reste importable. Les équipes masquées par une diminution de nombre conservent leurs modifications ; une importation réordonnée ne duplique pas leurs identifiants. Les noms vides ou dupliqués bloquent le lancement. Aucun nouveau stockage de composition n’est introduit.

## Protection des séances existantes

Les nouvelles configurations portent des marqueurs optionnels : additionalEachPeriod pour le classique, queuePolicy=lovable pour Maracana et soundControl=session pour leurs sons. Les anciennes sauvegardes qui ne les possèdent pas gardent leurs règles natives et leur politique sonore antérieure. Elles ne sont pas converties silencieusement. Une relance à partir d’un résumé garde les réglages et équipes enregistrés, tout en créant une nouvelle configuration compatible avec cette interface ; le résumé d’origine reste intact.

Le chargement valide le délai, sa cible et son horloge. Un état illisible ou incohérent reste refusé et préservé par les protections existantes. Une reprise automatique récupérée est enregistrée avant de considérer l’opération aboutie ; les erreurs d’écriture restent visibles et les anciennes données durables sont conservées pour la reprise. Les confirmations natives de sortie avec modifications et de remplacement d’une séance sont conservées.

## Galerie : mêmes contenus et mêmes dimensions

Ouvrir index.html. Les 36 JPG proviennent des applications réellement rendues dans le navigateur, sans retouche. Les deux vues utilisent alternativement la même fenêtre en 390 × 844 et 844 × 390. Les paramètres et positions de défilement sont alignés ; mesures.json contient les relevés DOM et le nom du bundle Expo exporté.

| État | Portrait 390 × 844 | Paysage 844 × 390 |
|---|---|---|
| Match classique · valeurs initiales | classic-defaut-*-portrait.jpg | classic-defaut-*-paysage.jpg |
| Match classique · durée personnalisée | classic-duree-*-portrait.jpg | classic-duree-*-paysage.jpg |
| Match classique · options et équipes | classic-options-*-portrait.jpg | classic-options-*-paysage.jpg |
| Match classique · une période | classic-periode-*-portrait.jpg | classic-periode-*-paysage.jpg |
| Maracana · valeurs initiales | maracana-defaut-*-portrait.jpg | maracana-defaut-*-paysage.jpg |
| Maracana · lancement avec délai | maracana-delai-*-portrait.jpg | maracana-delai-*-paysage.jpg |
| Maracana · gagnant reste et match nul | maracana-rotation-*-portrait.jpg | maracana-rotation-*-paysage.jpg |
| Maracana · édition des équipes | maracana-equipes-*-portrait.jpg | maracana-equipes-*-paysage.jpg |
| Maracana · palette de couleurs | maracana-palette-*-portrait.jpg | maracana-palette-*-paysage.jpg |

Les boîtes des cartes diffèrent au maximum de 0,094 pixel dans les relevés, avec mêmes paramètres sélectionnés sur les 18 paires. Ce chiffre décrit les positions et dimensions relevées, pas une identité de tous les pixels. Exemple : largeur des cartes 350 px en portrait, 396 px en paysage ; CTA 350 × 56 px en portrait et 420 × 48 px en paysage. Le haut et le pied restent fixes, le contenu défile comme dans la référence. Le contenu Maracana par défaut atteint 1210 px sur Lovable et 1211 px sur Expo : arrondi de mise en page de 1 px.

Les typographies Manrope, graisses, interlignes, marges, rayons, bordures, icônes SVG de la référence, maillots, états sélectionnés et palette ont été repris. La palette OKLCH a été convertie en couleurs sRGB à 8 bits pour React Native ; des arrondis et différences d’anticrénelage subsistent entre les moteurs. Aucun résultat de similitude pixel à pixel n’est affirmé.

## Interactions réellement vérifiées dans Expo Web

- Démarrage Maracana à cinq équipes avec objectif d’un but, délai 30 secondes et Le gagnant reste.
- Premier but : résultat 1–0, nouvelle affiche Les Renards / Panthères et délai visible.
- Pause du délai, rechargement, conservation du délai en pause, des noms et du résultat ; reprise puis annulation, encore conservée après rechargement.
- Lancement manuel suivant, puis Démarrer immédiatement pour l’affiche suivante. Aucun départ doublé observé.
- Désactivation/réactivation du critère de buts : valeur choisie conservée.
- Nom classique dupliqué : message explicite et CTA désactivé ; nom restauré : CTA à nouveau actif.

interactions.json conserve les constats de l’interface. Le profil navigateur contient une séance de test, pas des données de production. Aucun accès caché au stockage n’a servi à fabriquer ces captures.

## Contrôles exécutés localement

| Contrôle | Résultat réellement obtenu | Preuve |
|---|---|---|
| Tests métier et sauvegardes | Réussite, 12 suites ; les 10 suites antérieures sont conservées, dont 24 scénarios de fiabilité et 16 d’historique | tests-metier.log |
| Nouvelles régressions | Valeurs initiales, additionnel, rotations, lancement manuel/auto/délai, reprise, écriture en échec, annulation, états invalides et sons | tests-metier.log |
| Syntaxe TypeScript | 84 fichiers, 0 erreur | syntaxe.log |
| TypeScript : tsc --noEmit | Réussite, code 0 | controles.json |
| ESLint application : npm run lint / expo lint | Réussite, code 0, aucune règle désactivée | eslint-application.log |
| ESLint application et nouveaux tests/scripts modifiés | Réussite, code 0, 0 erreur/avertissement | controles.json |
| Expo export --platform all | Réussite : Android, iOS et web | export-multiplateforme.log |
| Captures | 18 paires réelles, paramètres alignés | index.html et mesures.json |
| Appareils physiques | Non exécuté | Recette ci-dessous |

Exécution Windows dans une copie de validation des sources courantes, avec les dépendances exactes du yarn.lock : Expo 57.0.30 et TypeScript 6.0.3. La dernière exportation correspond au bundle entry-270ae3b00621e951aafdee8d82c4fb7a.js. Les contrôles GitHub sont raccordés à la nouvelle branche et aux PR vers Phase 1 par deux ajouts minimaux au workflow ; tous les jobs restent actifs. Le reçu de livraison distingue leurs résultats de ces résultats locaux.

Le lint étendu historique eslint . avait signalé 23 erreurs et 21 avertissements dans des scripts hérités lors de Phase 1 (voir ../phase1-retouches/Rapport_Retouches_Phase1.md). Il n’a pas été réexécuté ni annoncé comme réussi dans cette phase. Le contrôle applicatif réellement utilisé par GitHub et le lint des nouveaux tests sont passés ; aucune règle n’a été masquée.

## Limites et adaptations natives

- Les petits sélecteurs disposent de marges tactiles additionnelles et les boutons principaux mesurent au moins 44 px, tout en conservant les dimensions visuelles Lovable. Les zones sûres et le clavier sont traités nativement.
- Les champs numériques utilisent le clavier numérique iOS/Android ; les flèches de champ HTML de Lovable ne sont pas reproduites sur téléphone.
- Le bouton conditionnel d’import de composition et ses textes sont raccordés et inspectés dans les sources, mais n’ont pas été rendus visuellement dans cette galerie faute de composition enregistrée dans ce profil. La fusion et conservation des équipes importées sont testées automatiquement.
- Les captures ne couvrent pas toutes les combinaisons possibles de réglages, les grands caractères système, les encoches ou le clavier natif. Le rendu sur appareil et les notifications/sons en arrière-plan ne sont pas validés par le navigateur ou les exports.
- Le panneau de contrôle du délai ajouté à l’écran de match rend les options utilisables. Le reste du design des écrans de match sera traité dans un lot ultérieur, après validation ; il n’a pas été reconstruit ici.
- Aucun APK/IPA ni build EAS n’a été produit. Aucun compte ou service payant n’a été sollicité.

## Recette courte sur iPhone et Android

1. Utiliser une installation de test du commit livré, sans désinstaller une application contenant des sauvegardes. Vérifier d’abord qu’une ancienne séance se reprend avec son temps, ses scores, ses équipes et sa rotation antérieure.
2. Ouvrir Match classique : 30 min, deux mi-temps, pause 5 min. Comparer portrait et paysage ; modifier durée, pause, score et noms ; essayer un nom dupliqué puis le corriger. Vérifier clavier, défilement et accès au CTA.
3. Activer l’additionnel, jouer deux périodes courtes de test : additionnel après chacune, pause hors temps joué. Fermer/reprendre pendant une période et pendant la pause ; comparer les scores et le temps.
4. Ouvrir Maracana à cinq équipes, Le gagnant reste, objectif 1 but, délai 30 s. Marquer : vérifier la bonne prochaine affiche. Mettre le délai en pause, fermer l’app, couper le réseau puis rouvrir : pause et score doivent rester. Reprendre, annuler, fermer/rouvrir : aucun lancement automatique.
5. Tester un délai qui expire pendant la fermeture, puis deux réouvertures : un seul prochain match, au même horodatage. Tester aussi automatique, manuel et Démarrer immédiatement.
6. Tester nul à trois équipes puis à quatre/cinq équipes avec chacune des règles visibles, et la rotation classique. Vérifier que les équipes suivent la file attendue.
7. Enregistrer une composition dans Faire les équipes, l’importer dans chaque configuration puis diminuer/augmenter le nombre d’équipes : noms et couleurs doivent rester. Vérifier les sons ON/OFF et l’annonce de fin.
8. Annuler une sortie avec modifications et un remplacement de séance : la séance précédente doit rester. Vérifier les sauvegardes hors ligne, les zones sûres, la rotation écran et la taille des textes sur les deux téléphones.

Critères avant fusion : validation visuelle de cette galerie par le propriétaire, résultats GitHub du SHA livré, recette sur appareils réels et contrôle visuel de la variante d’import. La Phase 2B n’est pas commencée.

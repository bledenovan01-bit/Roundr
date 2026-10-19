# Roundr — Phase 1, résultat soumis à validation visuelle

La Phase 1 reproduit l’introduction et l’accueil Lovable et ajoute l’historique complet Cup/Survie explicitement demandé. La validation visuelle de l’utilisateur reste nécessaire avant toute autre phase.

- Référence Lovable : tag v0-lovable-final, commit 1c59720dc5b180d5b1bacfaf935902b4053895fa.
- Base Expo conservée : 8fc43c1fa7a42187c476372de842ff2d5881425d.
- Branche : codex/roundr-lovable-phase-1 ; cible de PR : codex/roundr-native-preview.
- Main et les PR existantes n’ont pas été fusionnés ou modifiés. Aucun build payant ni publication sur un store.
- [Galerie comparative](index.html) : 17 couples de captures brutes, portrait/paysage. Rendu navigateur de React Native Web, jamais présenté comme une validation sur téléphone.

## Tableau de comparaison

| Écran / élément | Travail effectué et preuve | Limite de validation |
|---|---|---|
| Introduction | Terrain SVG, logo, slogan exact, description, bouton Commencer, positions portrait/paysage. Deux couples de captures. | Zones sûres, texte agrandi et polices sur téléphone à vérifier. |
| Accueil | Cinq modes avec textes exacts, icônes SVG de la référence, logo/sous-titre, Faire les équipes, liens Historique et Paramètres. Deux couples + mesures DOM. | Autres écrans de configuration conservés dans leur état natif. |
| Reprise de séance | Emplacement avant le titre, état et temps projetés depuis les moteurs existants, deux séances natives indépendantes préservées si nécessaire. Deux couples de captures d’un chrono prêt à 00:00. | Chevauchement paysage volontaire, demandé explicitement. Les états running/paused et scores sont testés automatiquement ; ils ne sont pas tous capturés. |
| Fondations | Manrope 400/600/800 générées depuis la police existante, palette OKLCH convertie en sRGB, rayons, marges, boutons et icônes reproduits dans les composants de cette phase. | Les écrans hors périmètre ne basculent pas sur de nouveaux styles globaux. Pas de certification pixel parfaite sur iOS/Android. |
| Historique vide et liste | Accès fonctionnel, tri récent d’abord, état vide, cartes Cup/Survie, date, nombre d’équipes, champion ou interruption. Deux couples de chaque état. | Mention « dans ce navigateur » retirée sur le natif ; archives locales sans synchronisation. |
| Renommer / supprimer | Feuilles Lovable, annulation, nom par défaut ; fermeture uniquement après écriture réussie. Deux couples de chaque feuille. | L’annulation et le renommage après rechargement sont vérifiés dans le navigateur ; suppression effective couverte par tests de stockage, pas effectuée sur des données utilisateur. |
| Palmarès historique | Champion, podium, statistiques, tableau final, poules, rencontres et équipes ; consultation sans action sur le match actif. Deux couples de haut de fiche et un couple de bas de fiche. | Même finale et mêmes noms/score, temps réellement joués différents : Lovable 00:24 / Expo 00:06 ; couleurs des équipes natives conservées. Pas de comparaison pixel identique de ces valeurs. |
| Cup avec poules, interruptions, exemptions et 3e place | Stockage et données de Cup/Survie couverts par tests ; vues de détail prévues dans les sources. | Toutes ces variantes n’ont pas été vérifiées visuellement dans cette phase. Ne pas confondre lecture du code et validation du rendu. |

## Mesures précises disponibles

Sur les rendus navigateur mesurés, sans zone sûre :

| Élément | Lovable | Expo | Écart constaté |
|---|---|---|---|
| CTA Commencer en portrait | x20, y770, 350×58 | x20, y770, 350×58 | Aucun sur cette boîte. |
| Titre introduction en portrait | y584,677 ; 33,15 px ; interligne 37,128 | y584,656 ; mêmes taille/interligne | Environ −0,021 px sur Y. |
| Carte Match classique portrait | x20, y147,396, 350×76 | Identique | Aucun sur cette boîte. |
| Carte Maracana portrait | x20, y235,396, 350×76 | Identique | Aucun sur cette boîte. |
| Deux premières cartes paysage | x20 / x428, y121,396, 396×76 | Identiques | Aucun sur ces boîtes. |
| Carte Chrono libre | hauteur 88,031 | hauteur 88,052 | +0,021 px (arrondi des lignes). |
| Lien Historique portrait / paysage | y703,458 / y389,396 | y703,500 / y389,448 | +0,042 / +0,052 px. |

Ces mesures portent sur ces éléments précis, pas sur une comparaison exhaustive de tous les pixels. Les JSON conservent les mesures et les fichiers JPG les rendus réellement observés. Les captures de reprise paysage montrent le chevauchement demandé.

## Protection des données de l’historique

Une archive atomique par compétition contient la séance complète et son résumé, sans modifier les règles de calcul. Les archives utilisent un schéma natif distinct du stockage Lovable incompatible. Les Cup/Survie terminées ou interrompues déjà disponibles dans la séance ou le dernier résumé sont récupérées au démarrage. Un historique qui n’a jamais été sauvegardé ne peut pas être reconstitué.

Les écritures sont sérialisées. Un échec d’archivage conserve la séance sur disque, garde une erreur visible et bloque le lancement d’une nouvelle séance jusqu’à sauvegarde réussie. Un renommage ou une suppression ratés ne sont pas appliqués en mémoire et ne s’exécutent pas silencieusement lors d’une reprise. Une suppression réussie laisse un marqueur pour empêcher une réimportation depuis l’ancien résumé.

Les données invalides restent à leur clé d’origine ; une copie brute est tentée et sa réussite n’est annoncée que si l’écriture réussit. Un index illisible n’est pas présenté comme un historique vide valide. Les tours, scores, chronos libres, anciens presets et sauvegardes existantes gardent leurs parcours de protection.

## Contrôles réellement exécutés

| Contrôle | Résultat |
|---|---|
| Tests métier : 10 suites | Réussite ; incluent 24 scénarios de fiabilité des sauvegardes existants et 16 scénarios supplémentaires pour l’historique. |
| Vérification syntaxique | 80 fichiers TypeScript analysés, 0 erreur. |
| TypeScript, SDK Expo 57.0.30 | Réussite, tsc --noEmit. |
| ESLint application (npm run lint / expo lint) | Réussite, aucune règle désactivée. |
| ESLint ciblé app/src + nouveaux tests et lanceur | Réussite, 0 erreur / 0 avertissement sur ce périmètre. |
| ESLint élargi à tout le dossier | Échec conservé visible : 23 erreurs et 21 avertissements dans les scripts/outils hérités, hors périmètre standard d’expo lint ; les fichiers portant les erreurs n’ont pas été modifiés. |
| Expo export Android, iOS et web | Réussite locale ; les premiers refus d’accès Windows ont été résolus par un export dans work/ avec droits de copie adaptés. Aucun EAS Build lancé. |
| GitHub Actions sur le code 34a54ed | Réussite : https://github.com/bledenovan01-bit/Roundr/actions/runs/39168867690. Vérifier aussi les contrôles du dernier commit de la PR. |
| Interactions navigateur | Introduction, ouverture des cinq modes, retours, Faire les équipes, paramètres, reprise du chrono prêt sans lancement ; historique automatique, renommage annulé, suppression annulée P/L, renommage conservé après rechargement, nom par défaut rétabli. Voir navigation.json. |
| Téléphones physiques | Non exécuté. Aucun résultat automatisé ci-dessus n’est une validation sur appareil. |

Scénarios ajoutés : historique vide ; récupération Cup/Survie existantes sans doublon ; instantanés indépendants ; fin automatique Survie ; interruption ; Cup complète avec poules/qualifications/finale/podium ; mise à jour préservant le nom ; écriture échouée puis reprise ; redémarrage après échec ; renommage différé jusqu’au disque ; renommage/suppression ratés sans exécution différée ; marqueur de suppression ; index ou archive illisibles ; JSON/structure invalides conservés ; copie brute échouée signalée honnêtement ; chargements simultanés et écritures rapprochées.

## Courte recette sur iPhone et Android

1. Ouvrir la version de cette branche dans un environnement de test compatible. Vérifier introduction et accueil en portrait puis paysage, notamment la carte de reprise et les marges autour des zones système.
2. Lancer un chrono libre, ajouter des tours et un score, mettre en pause, fermer réellement l’application, couper le réseau, rouvrir : même séance, mêmes tours et scores, temps cohérent. Vérifier Reprendre.
3. Avec d’anciens presets Custom/sauvegardes de test, démarrer puis redémarrer : originaux conservés, pas de doublon. Si une récupération est proposée, vérifier chaque choix explicite.
4. Terminer une petite Survie ; ouvrir Historique : une seule fiche et bon palmarès. Interrompre une Cup avec quelques résultats ; vérifier ses poules et résultats après fermeture/réouverture hors ligne.
5. Renommer une fiche, redémarrer, vérifier le nom. Ouvrir Supprimer puis Annuler : fiche et résultats inchangés. Tester une suppression confirmée uniquement sur une compétition de test jetable, puis redémarrer : aucune réapparition.
6. Sur un chrono non terminé avec progression/tours/scores, choisir une nouvelle séance ; Annuler : état précédent conservé exactement et encore disponible après fermeture/réouverture.
7. Vérifier clavier de renommage, boutons tactiles, retour Android et annonces d’accessibilité avec grande taille de texte. Ne pas utiliser une désinstallation comme test de reprise : elle peut effacer le stockage local.

La Phase 1 s’arrête à cette livraison. La suite des écrans attend la validation visuelle de l’utilisateur.

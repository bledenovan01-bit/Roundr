# Retouches finales Phase 4A — PR #11

Référence inchangée : Lovable `v0-lovable-final` / `1c59720`. Base des retouches : `d914b2d5b940320efcb381c963c35c8d1461390d`. Même branche et même PR, sans fusion.

## Écart démontré et correction ciblée

La grille paysage Lovable répartit également la hauteur libre entre ses rangées. Expo plaçait les rangées à leur hauteur minimale avec un écart fixe de 12 px. Le hub et le bouton d'enregistrement du Chronomètre remontaient donc trop haut.

Le composant commun propose désormais cette répartition uniquement sur demande. Seuls le hub Chrono libre et la configuration Chronomètre l'activent. Le portrait, les configurations Compte à rebours/Intervalles, les autres modes et les fenêtres conservent leur disposition. Aucun moteur, modèle de sauvegarde ou mécanisme de migration n'est modifié.

| Mesure web, origine en haut de la fenêtre | Lovable | Expo corrigé |
|---|---:|---:|
| Hub 844 × 390, première rangée de cartes | 160,65625 px | 160,65625 px |
| Hub 844 × 390, deuxième rangée de cartes | 273,328125 px | 273,328125 px |
| Écart entre cartes des deux rangées (hauteur 76 px) | 36,671875 px | 36,671875 px |
| Chronomètre 844 × 390, haut du bouton Enregistrer | 215,25 px | 215,25 px |
| Chronomètre 844 × 320, haut du bouton Enregistrer | 180,25 px | 180,25 px |
| Hauteur du bouton Enregistrer en paysage | 50 px | 50 px |

L'espace s'adapte à la hauteur réellement disponible plutôt qu'à une coordonnée fixe. Les zones sûres restent soustraites de la largeur utile et incluses dans les marges. Si le contenu déborde, il reste défilable. Les tailles et zones d'appui des commandes ne changent pas. La grille conserve son repli sur une colonne lorsque la largeur ou la taille de police l'exige.

## Focus de la fenêtre de modification

Après ouverture par les véritables boutons Modifier puis Mettre à jour, le champ « Nom du chrono » reçoit naturellement le focus dans les deux rendus web. L'élément actif porte ce libellé ; son contour calculé est de 2 px dans les deux cas. La nouvelle paire `saved-update-L` montre les deux champs focalisés.

Aucune manipulation de focus, délai, clic dans le champ ou modification du clavier n'a été ajouté pour la capture. L'option autoFocus existait déjà dans les deux sources et reste inchangée. La différence de la première galerie n'est plus reproduite avec ce parcours normal ; elle ne justifie pas une modification native. Le moment d'ouverture du clavier et l'évitement du clavier restent à contrôler sur iPhone et Android.

## 30/30 — arbitrage requis avant publication

Le programme rapide concerné reste exactement celui de Lovable : une période de 30 secondes répétée huit fois, soit **4 minutes, sans repos intercalé**. Le paramètre de repos entre périodes est de 30 secondes mais il n'existe qu'une période par série ; le repos entre séries est nul. Il ne s'agit donc pas d'une alternance effective de 30 secondes d'effort / 30 secondes de repos.

**À arbitrer avant publication : conserver ce comportement ou faire évoluer le programme et son libellé.** Cette PR ne change aucune règle. Les anciens programmes Expo conservent leur comportement et leur durée historiques.

## Captures et contrôles

[Galerie ciblée](index.html) : cinq paires réelles, sans redimensionnement des originaux : hub et Chronomètre en 390 × 844 et 844 × 390, plus fenêtre de modification en paysage. La hauteur 320 px a fait l'objet d'une mesure DOM supplémentaire, sans galerie additionnelle. Les cinq paires enregistrées ont été inspectées visuellement. Le portrait conserve la disposition précédente.

| Contrôle exécuté sur les retouches | Résultat |
|---|---|
| Tests métier et sauvegardes | 20 suites réussies |
| TypeScript | Réussi, code 0 |
| ESLint app/src, zéro avertissement autorisé | Réussi, code 0 |
| Export Android | Réussi |
| Export iOS | Réussi |
| Export web | Réussi |

Journaux locaux dans `controles/`. Les tests précédents de migration, remplacement et restauration restent inclus dans les suites exécutées. Aucune règle ESLint désactivée. Les exports ne sont pas des builds signés ni une validation physique.

Restent sur téléphone : paysage avec encoches/zones sûres, grande police, clavier de modification et fermeture/réouverture de la fenêtre. Aucun essai physique réalisé dans cette mission. Phase 4B non commencée.

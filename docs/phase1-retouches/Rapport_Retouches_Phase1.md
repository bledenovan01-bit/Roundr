# Roundr — Retouches finales Phase 1

Les trois écarts demandés sont corrigés. Le reste des écrans validés est conservé. PR #6 existante, branche codex/roundr-lovable-phase-1, cible codex/roundr-native-preview ; aucune fusion ni Phase 2.

## Références et périmètre

- Lovable figé : v0-lovable-final, 1c59720dc5b180d5b1bacfaf935902b4053895fa.
- Base Expo de la Phase 1 : 8fc43c1fa7a42187c476372de842ff2d5881425d.
- État avant ces retouches : c47716ebba4657aeef343ff2d631e67d238341df.
- Seulement trois fichiers applicatifs : frontend/src/components/lovable/intro.tsx, frontend/src/components/lovable/history-ui.tsx et frontend/app/history.tsx.
- Aucun changement des moteurs, des règles, des données, du stockage, du contenu des résultats ou des opérations de l’historique. Aucun changement de dépendance ou de workflow. Aucun build EAS ni publication.

## Comparaison mesurée à 844 × 390

| Élément | Expo avant | Lovable | Expo corrigé |
|---|---|---|---|
| Rond central, diamètre | 212,29 px | 84,92 px | 84,92 px |
| Renommer, largeur × hauteur | 420 × 50 px | 168,78 × 50 px | 168,78 × 50 px |
| Renommer, x / y | 212 / 278 px | 337,60 / 282 px | 337,60 / 282 px |
| Fenêtre de suppression, y | 82,17 px (centrée) | 164,33 px (en bas) | 164,33 px (en bas) |
| Fenêtre de suppression, largeur × hauteur | 520 × 225,67 px | 520 × 225,67 px | 520 × 225,67 px |
| Supprimer, x / y / largeur / hauteur | — | 182 / 264 / 480 / 56 px | 182 / 264 / 480 / 56 px |
| Annuler, x / y / largeur / hauteur | — | 182 / 328 / 480 / 44 px | 182 / 328 / 480 / 44 px |

Le rond applique la règle paysage Lovable de 12 % (src/styles.css:393), prioritaire sur sa règle générale de 30 %. Son centrage est conservé. Les coordonnées Expo du logo (y = 171,35), du slogan (y = 221,35) et du CTA (x = 212, y = 332, 420 × 48) sont strictement inchangées.

Le groupe d’actions retrouve sa largeur de contenu et l’espacement Lovable de 4 px (src/styles.css:407). Les boutons du détail seuls utilisent cette largeur en paysage ; les autres actions conservent leur comportement.

La fenêtre de suppression est ancrée en bas, comme la feuille Lovable. En paysage, les marges gauche/droite prennent les zones sûres natives en compte ; la hauteur maximale réserve la zone supérieure. Le défilement existant et le bas protégé sont conservés. La fenêtre de renommage n’a pas été repositionnée. À 568 × 320, le panneau commence à y = 94,33 ; Annuler finit à y = 302 : les actions restent visibles avec les insets nuls du navigateur. Les insets réels doivent être vérifiés sur téléphone.

## Portrait à 390 × 844

Les conditions de style préservent le portrait validé. Captures après retouches disponibles pour les trois écrans. Avant/après, mêmes mesures pour le rond (97,875 px), le logo (y = 523,958), le slogan (y = 584,656), Commencer (x = 20, y = 770, 350 × 58) et Renommer (x = 20, y = 726, 350 × 50). La fenêtre de suppression portrait reste en bas ; ses branches de style n’ont pas été modifiées. Il ne s’agit pas d’une affirmation d’égalité pixel à pixel entre moteurs de rendu.

## Preuves et interactions

Ouvrir index.html pour les six paires comparatives : trois écrans en paysage, puis les mêmes en portrait. Les fichiers JPG sont les captures réelles aux dimensions indiquées, sans réécriture des pixels. mesures.json conserve les boîtes rendues. Les comparaisons avant paysage sont disponibles dans les sections dépliables.

Le scénario d’historique a été créé par les interfaces réelles : Survie à deux équipes, Équipe 1 gagnante 1–0, durée affichée 00:00, même nom et même date dans les deux applications. Les couleurs d’équipes natives enregistrées sont conservées ; le texte de stockage propre au navigateur Lovable reste différent derrière la fenêtre.

Dans Expo, ouvrir la suppression et Annuler en portrait/paysage, puis recharger conserve l’unique compétition et son champion. Le nouveau bouton Renommer ouvre toujours le formulaire ; Annuler revient au détail sans changer le nom ou le résultat. Aucune suppression confirmée n’a été nécessaire pour ces retouches de présentation.

## Contrôles réellement exécutés sur ces retouches

| Contrôle | Résultat |
|---|---|
| Tests métier et sauvegardes : node scripts/run-domain-tests.cjs | Réussite, 10 suites, dont 24 scénarios de fiabilité et 16 scénarios d’historique. Journal tests-metier.log. |
| Syntaxe : node scripts/check-syntax.cjs | Réussite, 80 fichiers TypeScript, 0 erreur. |
| Types : tsc --noEmit | Réussite, code de sortie 0. |
| ESLint ciblé sur les trois fichiers applicatifs modifiés | Réussite, 0 erreur et 0 avertissement. |
| ESLint application : npm run lint / expo lint | Réussite, code de sortie 0 ; aucune règle désactivée. |
| Expo export --platform all | Réussite : bundles Android, iOS et web produits. Journal export-multiplateforme.log. |
| Captures et interactions navigateur | Vérifiées à 844 × 390 et 390 × 844 ; accessibilité des actions aussi à 568 × 320. |
| Appareils physiques | Non exécuté. Les exports et captures navigateur ne valident pas le rendu natif réel. |

Les commandes utilisent les sources courantes et les dépendances du verrou, Expo 57.0.30, dans le miroir de validation isolé. Les refus initiaux de copie Windows lors des exports ont été résolus dans work/ avec les droits de copie nécessaires ; le résultat indiqué est l’export final réussi.

Le contrôle élargi eslint . de la première livraison signalait 23 erreurs et 21 avertissements dans des scripts/outils hérités. Il n’a pas été relancé pour ces trois retouches ; ce constat antérieur reste visible dans docs/phase1-visuel/Rapport_Phase1.md. Aucun contrôle ni règle n’a été désactivé.

Pour GitHub Actions, vérifier le dernier SHA de la PR #6 ; les liens des exécutions finales sont consignés dans sa description et le reçu de livraison. Aucun résultat de l’ancien commit n’est présenté comme celui de ces retouches.

## Vérification finale sur iPhone et Android

1. Afficher l’introduction en portrait puis paysage : petit rond central ; logo, slogan et Commencer toujours à leur emplacement validé.
2. Ouvrir le détail d’une compétition de test, tourner en paysage : Renommer reste centré et limité au contenu ; l’ouvrir, fermer le clavier et Annuler.
3. Ouvrir Supprimer en paysage, vérifier l’ancrage inférieur, les marges près de l’encoche et les deux boutons, puis Annuler. Tourner aussi avec la fenêtre ouverte.
4. Repasser en portrait et activer une grande taille de texte : aucun bouton inaccessible ; le défilement permet d’atteindre les actions.
5. Fermer puis rouvrir hors ligne : même compétition, nom, résultats et séances conservés. Ne pas désinstaller pour effectuer cette vérification.

Arrêt à la Phase 1 ; aucune autre correction d’écran n’est engagée dans cette livraison.

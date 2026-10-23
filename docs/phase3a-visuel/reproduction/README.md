# Reproduction des captures

Ces adaptateurs sont des outils de comparaison, pas des routes de l’application livrée.

Le script prépare deux copies isolées dans work/phase3-reference-render et work/phase3-native-render, à partir de work/lovable-visual-audit (référence exacte) et work/Roundr (branche proposée). Il suppose les dépendances déjà présentes dans work/preview-install/node_modules et celles de la référence. Il ne télécharge ni ne publie rien.

Pour ce poste de travail, placer les trois fichiers prepare-phase3a-fixtures.cjs, phase3-reference-qa.tsx et phase3-native-qa.tsx dans work/ du dossier de travail avant d’exécuter le script. Les chemins peuvent être adaptés à une autre copie locale. La référence est copiée, puis seule cette copie reçoit l’adaptateur.

La référence se rend avec Vite et son fichier vite.qa.config.ts. La copie native s’exporte avec expo export --platform web ; elle ajoute seulement app/phase3qa.tsx. Les deux catalogues exposent les mêmes scénarios. Sélectionner la même vue, la même bascule restant/écoulé, le classement si nécessaire et « Franchir le seuil de test » pour les bannières, puis régler le navigateur à 390×844 ou 844×390.

Date.now est figé dans ces adaptateurs uniquement ; les états sont construits avec les fonctions publiques des moteurs. La copie native utilise son chemin d’accessibilité de réduction des animations, nécessaire car l’horloge des animations JavaScript serait également figée. La référence neutralise seulement ses animations/transitions dans le conteneur de test.

Les captures brutes proviennent du navigateur intégré, sans modification de leur contenu. Les planches contact ne font qu’assembler et redimensionner ces images. Les empreintes des sources et des bundles de production sont dans ../mesures.json. Aucun adaptateur, catalogue de test ou horodatage figé n’est inclus dans ces bundles.

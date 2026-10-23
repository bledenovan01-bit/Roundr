# Reproduction des comparaisons

Les fichiers QA sont des enveloppes de test isolées, jamais des routes livrées en production. Ils manipulent uniquement les données synthétiques des origines localhost dédiées. Ne pas les utiliser sur une installation contenant des sauvegardes personnelles.

1. Extraire Lovable au commit `1c59720dc5b180d5b1bacfaf935902b4053895fa` dans une copie de travail. Installer ses dépendances. Copier `lovable-qa.tsx` comme `qa.tsx` à la racine de cette copie, utiliser le fichier Vite fourni et une page HTML chargeant `/qa.tsx`.
2. Extraire la branche Phase 4A dans une seconde copie. Installer les dépendances de `frontend`. Copier `expo-qa.tsx` dans `frontend/app/phase4aqa.tsx`. Exporter cette copie pour le web, puis servir l'export avec `node static-server.cjs <dossier-export> 8151`. Servir Vite sur 8150 avec `vite.qa.config.ts`.
3. Ouvrir Lovable `/` et Expo `/phase4aqa`. Les enveloppes fixent la date et réduisent les animations. Sans paramètres : aucun chrono enregistré. `?seed=saved&composition=1` : deux chronos et une composition de trois équipes.
4. Naviguer par les vrais contrôles. Capturer chaque état à 390 × 844 et 844 × 390. Pour les états « bottom », aller en fin de défilement sur les deux applications. Fermer/ouvrir les palettes et sélectionner exactement les mêmes valeurs. Utiliser une seule surface navigateur afin de garantir les dimensions réellement appliquées.
5. Vérifier les fichiers enregistrés eux-mêmes : certains appels de capture du navigateur de test ont rendu une image blanche ou vide malgré un aperçu correct. Ces captures ont été écartées puis refaites. Ne jamais réparer une capture en la redimensionnant ou en la complétant artificiellement.

Les fichiers `raw/*.txt` décrivent l'arbre d'accessibilité des états. `manifest.json` contient les dimensions et empreintes des 76 originaux retenus. Le script de galerie fourni est celui employé dans le workspace ; ses chemins d'entrée/sortie sont relatifs à ce workspace et sont à adapter pour une autre installation. Il ne modifie pas les originaux.

Les tests fonctionnels ne dépendent pas des enveloppes QA : dans `frontend`, exécuter `node scripts/run-domain-tests.cjs`, `node scripts/check-syntax.cjs`, `npx tsc --noEmit` et `npm run lint -- --fix=false`. L'oracle des intervalles utilise le contenu Git figé inclus dans les fixtures et vérifie son empreinte avant exécution.

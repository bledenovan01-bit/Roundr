# Reproduire les comparaisons Phase 3B

Ces fichiers sont des adaptateurs de test, exclus de `frontend/app` et des exports de production. Ils rendent les composants réels, sans redessiner les écrans.

1. Vérifier les commits : Roundr depuis `d2e1b88`, référence figée `1c59720`. Copier la référence en `work/lovable-visual-audit` et Roundr en `work/Roundr`, sous un dossier de travail séparé. Adapter les chemins au besoin.
2. Installer les dépendances habituelles. Le script suppose celles de la référence dans sa copie et celles d’Expo dans `work/preview-install/node_modules`. Une copie de validation des sources et son chargeur de tests sont attendus dans `work/phase1-validation/frontend`.
3. Placer les trois fichiers `prepare-phase3b-qa.cjs`, `phase3b-reference-qa.tsx`, `phase3b-native-qa.tsx` dans `work/`, puis lancer `node work/prepare-phase3b-qa.cjs` depuis la racine de travail. Le script vérifie les confrontations des deux moteurs et prépare 32 états appariés.
4. Dans `work/phase3b-reference-render`, lancer Vite avec `--config vite.qa.config.ts` (port 8130). La référence d’origine reste intacte.
5. Dans `work/phase3b-native-render`, lancer `expo export --platform web --output-dir ../../phase3b-qa-web`. Servir cet export depuis la racine par `node work/serve-phase3b.cjs phase3b-qa-web 8132`.
6. Ouvrir `http://127.0.0.1:8130/?scenario=ID` et `http://127.0.0.1:8132/phase3bqa?scenario=ID`. Les ID/paramètres sont dans `manifest.json`. Cliquer les mêmes onglets, vues ou fenêtres indiqués. La bascule écoulé s’actionne par son vrai bouton.
7. Capturer les deux applications à 390×844 et 844×390. Vérifier les dimensions de chaque fichier, le chargement des polices, l’état sélectionné et le début de défilement. La galerie ajoute ensuite seulement une bordure/titre autour des deux captures, sans modifier leur contenu.
8. Pour `cup-single-qualifier`, partir de `cup-decision`, sélectionner Les Renards puis Confirmer dans les deux applications.

Les horloges sont figées dans ces copies de test ; la copie Expo demande le chemin réel d’accessibilité « animations réduites », et la copie Lovable neutralise ses animations de comparaison. Cela ne valide pas les animations ou les interruptions sur appareil. Pour vérifier une restauration réelle, charger ensuite la route de production `/live` ou `/history` : recharger la route QA réinjecterait son état de test.

L’oracle pur figé utilisé par les tests métier est stocké séparément dans `frontend/scripts/fixtures/` avec son empreinte SHA-256. Il n’entre jamais dans le bundle applicatif.

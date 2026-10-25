# Reproduction locale des preuves

Les scripts et fixtures servent uniquement à la QA locale ; ne pas copier ces
routes dans `frontend/app` de production. Ils utilisent les composants réels,
l'horloge figée et l'option de réduction des animations.

Prérequis : dépendances du frontend installées avec le verrou existant, Node,
Playwright et Edge installé. Les scripts ont été exécutés sur Windows avec les
dépendances de l'espace de travail Codex. Le chemin du module Playwright peut
être défini par `ROUNDR_PLAYWRIGHT_MODULE`.

Dans PowerShell, définir `ROUNDR_QA_WORK` au chemin absolu du dossier `work`
contenant le checkout `Roundr` et les exports de QA. Les scripts enregistrent les
preuves dans son dossier frère `outputs/mobile-chrono`. Sur cette machine :

```powershell
$env:ROUNDR_QA_WORK = 'C:\Users\denoe\Documents\ChatGPT\Roundr - Codex\work'
node prepare-qa.cjs 4650ae5a70739ad633a5bc47d5957d0f186b14c3 before
node capture-mobile-chrono.cjs before 8183
node prepare-qa.cjs HEAD after
node capture-mobile-chrono.cjs after 8185
node check-mobile-rotation.cjs
node check-browser-audio.cjs
node validate-mobile-chrono.cjs
```

Exécuter avant et après séquentiellement : `prepare-qa` reconstruit la même copie
isolée à partir du commit choisi. Les ports doivent être libres. Les scripts
arrêtent leur serveur local à la fin. La validation complète attend le checkout
dans `ROUNDR_QA_WORK/Roundr` ; elle exporte les trois plateformes, sans build EAS.

La galerie contient 75 captures originales avant et 75 après : numérique et
circulaire sur les cinq modes et cinq formats, analogique libre et géant des
quatre modes de match. Les valeurs temporelles et scores sont déterministes.
Les JSON conservent les mesures DOM, erreurs et résultats de rotation/lecture.

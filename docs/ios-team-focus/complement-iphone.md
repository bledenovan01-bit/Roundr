# Complément du 26 octobre 2026 après recette iPhone

## Résultat physique fourni par l’utilisateur

Sur Chrome iOS, le clavier s’ouvre désormais, le champ reçoit le focus et la saisie fonctionne. La capture transmise montre toutefois le formulaire Classique en deux colonnes alors que le téléphone reste en portrait. La correction du focus est conservée.

## Diagnostic complémentaire

La première version de `useFormWindowDimensions` changeait la source des dimensions mais conservait `landscape = width > height`. Elle supposait que `document.documentElement.clientHeight` ne diminuerait pas avec le clavier. Cette hauteur n’est pas une source fiable pour identifier la rotation du téléphone.

Le précédent test ne réduisait que `visualViewport.height` et laissait le document à 390 × 844 : il ne couvrait pas la réduction de `clientHeight` ni la réduction effective de la fenêtre. Sur l’export de la PR #16 au commit `da481e7`, le nouveau test réduit aussi `clientHeight` et `innerHeight` à 260, avec une orientation écran explicitement portrait : l’assertion échoue, largeur 169 px au lieu de 350. Le défaut du calcul est ainsi reproduit. Les valeurs exactes des API sur l’iPhone de l’utilisateur n’ont pas été instrumentées : la capture ne permet pas de les déduire.

`KeyboardAvoidingView` reste inchangé (sur le web, il ne réalise pas l’ajustement clavier natif). Les `ScrollView` conservent `keyboardDismissMode="none"` sur web et `on-drag` sur natif. La perte de focus et les remontages ne sont pas réintroduits.

## Correction finale

`useFormWindowDimensions` expose désormais un booléen `landscape` distinct des dimensions disponibles :

- Sur les navigateurs mobiles à pointeur principal tactile, `screen.orientation.type` détermine portrait/paysage. Les anciens iOS peuvent utiliser `window.orientation` (0/180 pour portrait, ±90 pour paysage). La présence de cette API historique permet aussi d’identifier ce cas mobile.
- Une souscription React `useSyncExternalStore` suit les événements de rotation moderne et historique, ainsi que le redimensionnement. Les écouteurs sont retirés au démontage.
- Sur ordinateur, la disposition continue de suivre les dimensions de la fenêtre, indépendamment de l’orientation du moniteur.
- Sur Android/iOS natifs et en rendu serveur, la disposition reste calculée à partir des dimensions RN. Sur un navigateur ne fournissant aucune API d’orientation mobile, le calcul par dimensions reste le repli ; ce cas ancien n’est pas une garantie contre le clavier.
- `clientWidth/clientHeight` servent encore à dimensionner le formulaire, mais leur rapport ne décide plus des colonnes sur les mobiles disposant des API ci-dessus. Aucune hauteur n’est figée, aucun blocage permanent du portrait n’est ajouté.

Les consommateurs `ConfigAction`, `LovableConfigFrame`, `useLovableConfigCards`, `PhaseAction` et `PhaseFrame` utilisent ce même booléen. Cela couvre Classique, Maracana, Cup, Survie et Chrono libre, avec leurs seuils et styles existants.

Référence de l’API utilisée : [Screen Orientation, W3C](https://www.w3.org/TR/screen-orientation/). Aucun verrouillage d’orientation, permission de capteur ou changement de dépendance n’est nécessaire.

Dans `configuration.tsx`, `Mark` utilise maintenant exactement `aria-hidden={true}` à la place de `accessible={false} aria-hidden`, comme demandé. Aucun autre SVG n’est modifié dans ce complément.

## Vérifications exécutées sur le complément

| Vérification | Résultat |
| --- | --- |
| TypeScript `tsc --noEmit` | Réussi |
| ESLint `app src scripts/test-form-window-dimensions.ts --max-warnings 0` | Réussi |
| `expo lint` | Réussi |
| `node scripts/run-domain-tests.cjs` | Réussi : test ciblé enrichi, test audio et 22 suites existantes |
| `node scripts/check-syntax.cjs` | Réussi |
| Export web | Réussi |
| Export web/Android/iOS | Premier essai bloqué par une permission d’écriture du répertoire temporaire Hermes ; relance avec TEMP/TMP dans le workspace réussie, sans changement de code/configuration |
| Chrome tactile, cinq modes × portrait/paysage, hauteur effective réduite et rotation clavier ouvert | 10/10 scénarios réussis |
| Comparaison clavier fermé avec `da481e7` | 10/10 paires PNG et géométries identiques, cinq modes × portrait/paysage |

Le test unitaire couvre la réduction **simultanée** des hauteurs visuelle et documentaire, le zoom, les orientations primaire/secondaire, la vraie rotation clavier ouvert, les angles historiques iOS, les fenêtres de bureau, le repli sans API, SSR, natif et le nettoyage des écouteurs.

Le banc Chrome tactile couvre les cinq modes en 390 × 844 et 844 × 390 : orientation écran explicite et stable pendant la réduction des hauteurs, puis réduction effective de la fenêtre à 260 px de haut. Il vérifie les colonnes, le focus et l’identité DOM, la saisie des deux noms clavier simulé ouvert, off/on, la rotation simulée clavier toujours ouvert, le lancement et la conservation des noms après rechargement. Résultats et captures : `evidence-followup/after/`.

Le test enrichi a d’abord échoué sur l’ancien export (169 ≠ 350), puis passé sur le complément. Le premier lancement du navigateur avait été empêché par l’isolation réseau locale ; le test a été relancé avec accès au serveur local. Les logs du premier export Hermes en échec et de sa relance sont conservés.

Les preuves initiales restent dans `evidence/` ; les nouvelles sont dans `evidence-followup/`. Les captures de QA ne représentent pas un vrai clavier iOS. Aucun appareil iPhone/Android ni simulateur iOS n’a été utilisé pour le complément. Le retour utilisateur valide l’ouverture du clavier de la première version, **pas encore cette nouvelle correction des colonnes**.

## Reprise du test iPhone

Sur la copie déjà placée sur `codex/roundr-ios-team-input-focus` : `git pull --ff-only`, puis relancer `npx expo start --web --host lan` depuis `frontend`. Recharger l’adresse locale dans un nouvel onglet Chrome iOS. Le guide [test-iphone.md](test-iphone.md) reste applicable.

Priorité : clavier ouvert en portrait, une seule colonne et champs de pleine largeur ; saisie/passage entre les deux champs et défilement utilisables. Tourner ensuite réellement le téléphone clavier ouvert, vérifier le vrai paysage et revenir au portrait. Fermer le clavier pour comparer le rendu validé, puis vérifier le lancement et les noms sauvegardés dans les cinq modes.

Aucune fusion, modification de `main`, compilation EAS, dépense, modification métier/audio, configuration Expo ou dépendance.

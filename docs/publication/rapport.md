# Préparation de la publication — audit et corrections de configuration

Base : `main` à `a5f5a79` (tag `v0-consolidation`). Branche :
`claude/roundr-publication-config`. Aucun build, aucune inscription, aucune
soumission. Aucun changement de fonctionnalité, de design, de règle métier, de
son ni de sauvegarde.

## Ce que cette PR change

| Élément | Avant | Après |
| --- | --- | --- |
| Identifiant Android | `com.bledenovan.roundr.recette` | `com.bledenovan.roundr` |
| Permissions Android | Lecture et écriture du stockage, superposition d'écran | Retirées (`blockedPermissions`) |
| Profil EAS `production` | iOS uniquement | Ajout d'Android : app bundle, image `sdk-58` |
| `submit.production` | iOS uniquement | Ajout d'Android : piste interne, brouillon |
| Texte de la permission Musique (iOS) | « pendant vos matchs » | « pendant tes matchs » |
| Tests | Attendaient l'ancien identifiant | Mis à jour, avec des contrôles sur les nouvelles valeurs |

**Identifiant Android** : une application de recette déjà installée avec
l'ancien identifiant ne sera pas remplacée ; la nouvelle s'installe à côté, avec
ses propres données. Aucune n'a été installée d'après les rapports précédents.
L'identifiant devient définitif à la première publication sur Google Play.

**Permissions retirées** : héritées du modèle Expo, jamais utilisées par Roundr.
La superposition d'écran ne sert qu'aux outils de développement.

## Audit

### Configuration

- Expo 58.0.23, React Native 0.88.1, `expo-doctor` 20/20, bundle iOS de
  production généré.
- Projet EAS relié, numéros de build gérés par EAS.
- État du compte EAS non vérifié : EAS CLI n'est pas installée sur le poste.

### Ressources

| Ressource | État |
| --- | --- |
| Icône iOS | 1024 × 1024, sans transparence |
| Icône adaptative Android | 1024 × 1024, fond `#020909` |
| Écran de démarrage | Logo transparent sur `#020909` |
| Sons | 7 fichiers, sources sous licence CC0 documentées dans `frontend/assets/sounds/SOURCES.md` |

Le rendu de l'icône et de l'écran de démarrage n'a jamais été vu sur un
appareil.

### Permissions après correction

- **iOS** : accès à Musique uniquement.
- **Android** : Internet (socle technique), vibration, réglages audio.

### Données

Le code ne contient aucun appel réseau, aucun outil de mesure d'audience, aucun
compte et aucune publicité. Toutes les données (sessions, équipes, joueurs,
chronos, réglages, historique) sont stockées sur le téléphone. Le seul lien
sortant est « Signaler un problème », qui ouvre une page GitHub dans le
navigateur.

## Arbitrages appliqués (12 novembre 2026)

Les quatre points ci-dessous ont été tranchés par l'éditeur et appliqués dans
la branche `claude/roundr-publication-app` :

| Point | Décision | Réalisation |
| --- | --- | --- |
| Lien de confidentialité | L'ajouter dans Paramètres | Bouton « Politique de confidentialité » dans À propos |
| Carte Musique sur Android | La masquer | Absente des deux carrousels sur Android ; inchangée sur iPhone |
| Libellé de version | « Roundr · Version 1.0.0 » | À propos et Assistance |
| Assistance | E-mail à une adresse dédiée | Bouton « Contacter l'assistance », à la place des deux liens GitHub |

L'adresse d'assistance et l'adresse de la politique ne sont pas encore connues.
Elles se renseignent dans `frontend/src/publication.ts`. Tant qu'elles sont
vides, les deux boutons ne s'affichent pas, et un build `production` est refusé
automatiquement.

## Coordonnées et pages publiques (12 novembre 2026)

| Élément | Valeur |
| --- | --- |
| Adresse d'assistance | roundrsupport@gmail.com |
| Politique de confidentialité | <https://bledenovan01-bit.github.io/Roundr/confidentialite/> |
| Page d'assistance | <https://bledenovan01-bit.github.io/Roundr/assistance/> |
| Mentions légales | <https://bledenovan01-bit.github.io/Roundr/mentions-legales/> |
| Éditeur | Dénovan Blé EI, entrepreneur individuel (micro-entreprise) |

Les pages sont statiques, sans script ni outil de mesure. Leur hébergement est
décrit dans « Hébergement des pages publiques ».

Les boutons « Politique de confidentialité » et « Contacter l'assistance »
sont désormais affichés dans Paramètres.

## Mentions légales

La politique en ligne identifie l'éditeur (Dénovan Blé EI), donne un contact,
décrit les droits des personnes et la voie de réclamation (CNIL), et nomme
l'hébergeur de la page.

Par choix de l'éditeur, seuls le nom et l'e-mail sont publiés. **Point à faire
confirmer** : pour un site édité à titre professionnel, la loi française (LCEN,
article 6) prévoit en principe aussi une adresse, un numéro de téléphone et le
numéro d'immatriculation (SIREN). Ces mentions ne figurent pas sur les pages.
Les stores, eux, n'exigent que l'adresse de la politique et un contact. À
vérifier auprès d'un professionnel ou de la documentation officielle avant le
lancement ; les ajouter ne demande qu'une mise à jour des pages.

Une page **Mentions légales** distincte de la politique est en ligne. Elle
reprend les informations déjà publiées (éditeur, directeur de la publication,
contact, hébergeur). **À compléter avant la soumission aux stores** avec les
coordonnées légales de l'entreprise individuelle : adresse, téléphone et numéro
d'immatriculation.

**Conservation des messages d'assistance** : utilisés uniquement pour traiter la
demande, conservés jusqu'à sa clôture, puis supprimés au plus tard un an après
le dernier échange. Cette durée d'un an est une proposition : elle engage sur la
gestion de la boîte roundrsupport@gmail.com (suppression effective des anciens
messages) et peut être modifiée.

## Hébergement des pages publiques (migré le 12 novembre 2026)

Les pages sont servies par un dépôt public distinct,
`bledenovan01-bit/bledenovan01-bit.github.io`, dans son dossier `Roundr/`. Les
adresses sont inchangées (`https://bledenovan01-bit.github.io/Roundr/…`).

Le dépôt de l'application ne sert plus aucune page : GitHub Pages y est
désactivé. **Il peut donc devenir privé sans casser les liens** inscrits dans
l'application et dans les fiches. Il est toujours public à ce jour.

| Vérification après bascule | Résultat |
| --- | --- |
| Contenu des 4 pages et de la feuille de style | Identique octet pour octet à l'état précédent |
| Liens internes (16) et externes (2) | Tous répondent |
| HTTPS | Forcé, redirection depuis http |
| Interruption observée pendant la bascule | Aucune |

**Mettre à jour une page**

1. Modifier le fichier dans `docs/publication/site/` (copie de référence, couverte par les tests).
2. Recopier le contenu de `site/` dans le dossier `Roundr/` du dépôt des pages, puis pousser sur sa branche `main`.
3. Vérifier la page en ligne.

**À ne pas faire** : renommer le dossier `Roundr/` (la casse compte), renommer
le dépôt des pages ou le compte GitHub, rendre le dépôt des pages privé.

**Retour arrière** : l'ancienne publication est conservée dans la branche
`pages-archive` du dépôt de l'application (état du 12 novembre, avant
migration). Recréer une branche `gh-pages` à partir d'elle réactive l'ancien
hébergement. Elle ne contient pas les modifications faites après la migration.

**Remarque** : rendre le dépôt de l'application privé a un autre effet. La CI
GitHub n'est gratuite sans limite que pour les dépôts publics ; en privé, elle
consomme un quota de minutes, et la compilation iOS sur macOS en consomme
beaucoup.

## Application de la règle de conservation des messages d'assistance

Règle publiée : suppression au plus tard un an après le dernier échange. Elle
ne s'applique pas toute seule : la boîte roundrsupport@gmail.com ne supprime
rien automatiquement.

- Une fois par trimestre, rechercher dans Gmail `older_than:1y` et supprimer
  les conversations d'assistance trouvées, puis vider la corbeille.
- Ne pas recopier le contenu des messages ailleurs (tableur, notes), sauf sous
  forme anonyme.
- Répondre à une demande d'accès ou de suppression dans le mois.

## Coordonnées légales à fournir

La page Mentions légales contient un bloc prêt à compléter, masqué tant qu'il
est incomplet : adresse, téléphone, SIREN, SIRET (facultatif) et mention de TVA
applicable. À renseigner avant la soumission aux stores.

## Constat initial (avant arbitrages)

Décisions de l'éditeur, car elles touchent à l'application elle-même :

1. **Lien de confidentialité dans l'app** : Apple en demande un. Il faut
   l'ajouter dans Paramètres.
2. **Carte Musique sur Android** : elle affiche « Le contrôle est prévu dans
   l'application Roundr installée sur iPhone ».
3. **Libellé « Roundr V0 »** dans À propos, alors que la version publiée est
   1.0.0.
4. **« Signaler un problème »** : renvoie vers GitHub et exige un compte.

À fournir par l'éditeur : comptes développeur, adresse d'assistance,
hébergement des pages, statut de commerçant UE, captures d'écran.

## Documents

- `politique-confidentialite.md` : projet de politique, à héberger.
- `fiches-stores.md` : textes des fiches et réponses aux formulaires.
- `procedure-builds.md` : commandes de build et de soumission, recettes.

## Vérifications

| Contrôle | Résultat |
| --- | --- |
| Configuration native générée | Identifiant `com.bledenovan.roundr`, trois permissions marquées « à retirer » |
| `npm test` (30 suites) | Tout passe |
| `npm run typecheck` | Aucune erreur |
| `expo-doctor` | 19/20 : 13 paquets Expo ont reçu un correctif mineur depuis la consolidation (voir ci-dessous) |
| Build Android ou iOS réel | Non exécuté |

Le retrait effectif des permissions et la valeur de `NSAllowsArbitraryLoads` ne
pourront être constatés que dans un build réel.

## Correctifs Expo disponibles

`expo-doctor` passait à 20/20 lors de la consolidation. Expo a publié depuis des
correctifs pour 13 paquets du SDK 58 (`expo-router`, `expo-audio`,
`expo-splash-screen`, `expo-keep-awake`…), et le contrôle signale désormais
qu’ils ne sont pas à jour. Ce n’est pas lié à cette PR : `main` est dans le même
cas, et l’étape `expo-doctor` de la CI échouera sur toute PR tant que ce n’est
pas traité.

Ces mises à jour ne sont pas faites ici : elles modifient les dépendances
natives validées et demandent une nouvelle recette. À décider avant le premier
build de production : soit les appliquer dans une PR dédiée, soit figer les
versions actuelles.

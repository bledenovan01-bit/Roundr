# Roundr — Migration native de la V0 Lovable vers l'app Expo

Transformer l'application mobile Roundr (React Native / Expo) pour qu'elle reproduise fidèlement le design, l'ergonomie et les fonctionnalités validées dans la V0 Lovable.
Expo reste le socle technique natif ; Lovable et Figma servent de référence visuelle et fonctionnelle.

## Pour qui
Organisateurs de matchs et de tournois de football amateur qui veulent lancer, chronométrer et gérer des rencontres (matchs classiques, Maracana, Cup, Survie, Chrono libre) depuis leur téléphone, sans friction, y compris hors connexion.

## Fonctionnalités et expérience (vision complète de la migration)
Les cinq modes et leurs fonctions, à terme :
- **Match classique** : chronomètre fiable, périodes, temps additionnel, score.
- **Maracana** : 3 à 8 équipes, rotations configurables (« rotation classique » et « le gagnant reste »), règles de match nul, objectif de buts, classement, lancement du match suivant manuel / automatique / différé.
- **Cup** : poules, qualifications (y compris cas hors puissance de deux), repêchages, départages, tableau à élimination, finale et petite finale, palmarès, correction des résultats.
- **Survie** : élimination directe, tirages, exemptions, demi-finales, finale, champion.
- **Chrono libre** : chronomètre croissant avec tours, compte à rebours, intervalles (type 30/30, Tabata), trois affichages (numérique, circulaire, analogique), équipes optionnelles, espace « Mes chronos ».
- **Transverse** : écran d'intro, accueil avec carte de reprise réelle, « Faire les équipes », historique des compétitions, paramètres (sons, vibrations, écran allumé, préférences), notifications internes ponctuelles, sauvegarde/reprise de session fiable.

Règles sportives : pour Maracana, Cup et Survie, le comportement **Lovable est prioritaire** quand il diffère d'Expo. Les protections techniques Expo (sauvegarde ordonnée, reprise, sons/vibrations natifs) sont conservées.

## Parcours utilisateur
1. Première ouverture → écran d'intro (wordmark « Roundr. », slogan, CTA « Commencer »). Réaffichable depuis les paramètres, mais pas imposé à chaque lancement.
2. Accueil : identité Roundr, carte de session en cours (si existante, avec vraies données), puis les entrées Match classique, Maracana, Cup, Survie, Chrono libre, Faire les équipes, Historique, Paramètres.
3. Choix d'un mode → écran de configuration dédié → lancement de la session.
4. Pendant la session : chronomètre, transitions entre matchs/rotations, notifications sous le bloc chrono, possibilité de quitter puis reprendre la session sans perte.
5. Fin de compétition → archivage dans l'historique, consultable (classements, matchs, tableau, palmarès).

## Ressenti UI/UX
- Thème sombre Roundr avec accents verts, couleurs spécifiques par mode.
- Cartes aux coins arrondis, séparateurs discrets, boutons et icônes harmonisés.
- Typographies et espacements repris de Lovable/Figma.
- Chronomètres lisibles (format `MM:SS.cc` avec centièmes quand prévu), vues numérique / circulaire / analogique.
- Notifications discrètes (vert = échauffement, orange = alerte de temps), ~4,5 s, sans bloquer les interactions.
- Comportements natifs iOS et Android (boutons retour, feuilles modales, zones sûres, clavier).

## Phases de mise en œuvre

### Phase 1 — MVP construit maintenant : Design system + navigation + intro + accueil + squelette des configs
Périmètre livré et testé dans cette intervention :
- **Design system natif réutilisable** : palette (fond sombre, accents verts, couleurs des modes), typographies, composants (cartes, boutons, sélecteurs, séparateurs, icônes, états actif/inactif) — sans dépendances web de Lovable.
- **Navigation harmonisée** : structure Expo Router, boutons retour, accès paramètres, transitions cohérentes iOS/Android. Ouvrir les paramètres ne termine jamais une session.
- **Écran d'intro** fidèle à Lovable, avec mémorisation (pas réaffiché inutilement) et action « Revoir l'introduction » dans les paramètres.
- **Accueil** reproduisant l'organisation Lovable, avec **carte de reprise affichant les vraies données** de session (mode, équipes, score, chrono, état) — aucune donnée simulée.
- **Squelette des écrans de configuration des 5 modes** : mise en page, cartes, sélecteurs, couleurs et champs fidèles à Lovable. Les nouvelles options métier ne sont affichées que lorsqu'elles seront réellement fonctionnelles (phases suivantes).

### Phase 2 — Enchaînée ensuite dans la limite du budget
- Chronomètres enrichis (centièmes, vues numérique/circulaire, temps restant/écoulé, carrousel) et notifications ponctuelles internes.
- Chrono libre complet (croissant, compte à rebours, intervalles, « Mes chronos », migration des anciens presets).

### Phase 3 — Enchaînée ensuite dans la limite du budget
- Maracana (rotations Lovable, règles de nul, lancement manuel/auto/différé avec sécurités), puis Cup, Survie, corrections de résultats et historique des compétitions.
- Finitions paramètres/services natifs (sons, vibrations, écran allumé), sauvegarde/reprise étendue et versionnée.

Après approbation, les phases 2 et 3 sont enchaînées sans arrêt intermédiaire **jusqu'à épuisement du budget**, sauf si une décision irréversible sur une donnée ou une règle non arbitrée impose une validation ponctuelle. Le lecteur musical universel (Spotify/Apple Music) reste hors périmètre : documenté comme limite, non simulé.

## Hypothèses
- **Import du code existant** : la base de développement sera le dépôt `bledenovan01-bit/Roundr` importé via la fonction GitHub d'Emergent. Tant que ce code n'est pas présent dans l'espace de travail, le travail démarrera sur ce qui est disponible ; la fidélité à l'existant dépend de cet import.
- **Référence design** : le code du dépôt Lovable `roundr-mockup` (tag `v0-lovable-final`) fait foi pour le design et l'UX, complété par les captures Figma fournies. Les tokens exacts (couleurs, tailles) seront extraits du code Lovable.
- **Règles sportives** : Lovable prioritaire pour Maracana, Cup, Survie en cas de conflit ; les autres conflits non arbitrés seront signalés sans modification silencieuse.
- **Données** : les formats localStorage (Lovable) et AsyncStorage (Expo) ne sont pas considérés compatibles ; toute évolution du modèle sera versionnée avec migration, sans écrasement des données existantes.
- **Git** : développement sur une branche dédiée `feature/lovable-v0-native-migration` ; pas de fusion automatique dans `main`, pas de force-push, dépôt Lovable non modifié. Les actions Git côté dépôt se font via la fonction « Save to GitHub ».
- **Tests** : vérification par tests automatiques et contrôles techniques (TypeScript, moteurs métier, navigation). Aucun scénario ne sera déclaré validé sur iPhone/Android physique s'il n'a été vérifié que par tests automatiques ; une recette sur appareil reste à la charge de l'utilisateur.
- **Hors ligne** : les fonctions principales de la V0 doivent rester utilisables sans connexion Internet.

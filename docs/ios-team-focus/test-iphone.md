# Tester le correctif sur votre iPhone

Complément après votre premier test : la correction du clavier a été confirmée par votre retour ; la correction des colonnes doit être retestée. Voir [le diagnostic complémentaire](complement-iphone.md). Si vous avez déjà cette branche, récupérer la mise à jour avec `git pull --ff-only` avant de relancer Expo.

Cette vérification ne nécessite aucun APK, compte Expo, build EAS ou achat. La PR ne met pas automatiquement à jour le site que vous utilisez actuellement.

## 1. Récupérer la branche sur le PC

Dans un terminal ouvert à la racine de votre copie Roundr, avec vos modifications personnelles déjà sauvegardées :

```powershell
git fetch origin
git switch --track origin/codex/roundr-ios-team-input-focus
cd frontend
npx --yes yarn@1.22.22 install --frozen-lockfile
npx expo start --web --host lan
```

Si la branche existe déjà localement, utiliser `git switch codex/roundr-ios-team-input-focus` à la place de la commande `--track`. Ne pas basculer sur `main` et ne pas fusionner la PR.

## 2. Ouvrir sur l’iPhone

1. Connecter le PC et l’iPhone au même Wi-Fi de confiance.
2. Sur le PC, relever l’adresse IPv4 du Wi-Fi avec `ipconfig`.
3. Dans Chrome sur l’iPhone, ouvrir `http://ADRESSE_IP_DU_PC:8081` en remplaçant l’adresse et en utilisant le port indiqué par Expo si celui-ci diffère. `localhost` sur l’iPhone désigne l’iPhone, pas le PC.
4. Si Windows demande une autorisation réseau, autoriser Node uniquement sur votre réseau privé de confiance. Ne pas désactiver globalement le pare-feu.
5. Ouvrir un nouvel onglet sur cette adresse pour éviter de tester l’ancienne prévisualisation. Laisser le terminal Expo ouvert.

Autre possibilité : utiliser votre hébergement web habituel pour prévisualiser **cette branche**, après export web. L’URL publiée doit correspondre au correctif ; aucun changement d’Emergent n’est nécessaire.

## 3. Recette physique à effectuer

- [ ] Ouvrir Match classique, activer « Personnaliser les équipes » et toucher le premier nom. Le vrai clavier iOS apparaît et reste ouvert.
- [ ] Effacer le nom, saisir « Équipe Alpha », corriger quelques caractères et coller un nom. Respecter la limite existante de 18 caractères.
- [ ] Toucher le second champ, saisir « FC Rivière », revenir au premier : noms conservés, focus stable.
- [ ] Faire défiler le formulaire clavier ouvert : pouvoir continuer la saisie, sans saut vers deux colonnes en portrait. Vérifier l’accès au second champ et au bouton de lancement.
- [ ] Fermer puis rouvrir le clavier. Désactiver puis réactiver la personnalisation : noms conservés.
- [ ] Tourner réellement le téléphone en paysage puis en portrait ; vérifier la disposition et poursuivre la saisie.
- [ ] Lancer le match : les deux noms sont appliqués. Recharger puis reprendre le match sauvegardé : mêmes noms.
- [ ] Refaire la saisie des noms dans Maracana, Cup et Survie ; dans Chrono libre, activer « Avec équipes ».
- [ ] Vérifier visuellement que couleurs, espacements, boutons et SVG restent conformes au rendu validé.

Faire idéalement ces essais sur Chrome iOS et Safari. Android web et applications natives Android/iOS restent des vérifications physiques complémentaires ; les exports et tests automatiques ne les remplacent pas.

En cas d’échec, noter modèle d’iPhone, version iOS, version Chrome, orientation, champ concerné et étapes exactes. Une courte capture vidéo du toucher jusqu’à l’échec permettra de distinguer focus, clavier et défilement.

**Statut à la livraison : tests navigateur automatisés réussis ; test physique sur iPhone non effectué. Aucun build payant lancé, aucune fusion réalisée.**

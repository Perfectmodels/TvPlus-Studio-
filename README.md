# TV+ Studio — générateur d'affiches TV+ Afrique

Application web d'édition graphique connectée à GitHub et déployée automatiquement sur Vercel.

## Modèles

- **Pastille** (1:1) : catégorie, titre, mots-clés jaunes en cliquant sur les mots et réglages de taille.
- **Alerte info** (1:1) : bandeau rouge et titre blanc.
- **Décryptage** (16:9) : photo à gauche, découpe diagonale, catégorie et textes sur panneau bleu nuit.
- **Verbatim** (1:1) : grande citation dans une **colonne alignée à gauche**, photo assombrie et portrait visible à droite, nom/fonction et filet rouge.

## Outil distinct de recadrage photo

Le bouton **Recadrer une image** ouvre un espace dédié au format paysage **1200 × 600 px (2:1)** sans affecter l'affiche en cours.

- Import JPG, PNG ou WEBP (30 Mo maximum).
- Reprendre facultativement la photo actuellement importée dans l'affiche.
- Cadrage automatique proportionnel, sans étirement.
- Déplacement au doigt, à la souris, aux touches fléchées ou aux boutons de précision.
- Zoom de 100 à 300 % et recentrage.
- Télécharger en PNG de **1200 × 600 px exacts**.
- Option facultative **Utiliser l'image recadrée dans l'affiche** : action explicite, sans altérer l'image originale.

Les images et les textes restent dans le navigateur. Aucune image n'est envoyée à un serveur lors du recadrage.

## Fonctionnalités générales

Polices **Barlow**, **Barlow Semi Condensed** et **Barlow Condensed**, graisses 700/800/900 ; ajustement automatique des titres pour ne pas empiéter sur le pied de page ; export PNG en résolutions carrées ou 16:9 ; repositionnement des photographies et remplacement du logo.

## Déploiement

Site statique contenu dans `index.html`, sans étape de compilation. Vercel est connecté à la branche GitHub `main` et déploie les modifications automatiquement.

Pour ouvrir le site localement, ouvrir `index.html` dans un navigateur récent. Les polices Barlow sont chargées depuis Google Fonts lorsque l'accès Internet est disponible.

## Limites

Pas encore de comptes utilisateurs, d'archives partagées ou de liaison directe avec le CMS TV+.

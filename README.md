# TV+ Studio

Générateur d'affiches TV+ Afrique — version 2, édition rapide.

## Fonctions principales

- **Pastille** : saisir le titre une fois, puis cliquer directement sur les mots pour activer ou désactiver le surlignage jaune. Aucune étape « valider » supplémentaire.
- **Alerte info** : bandeau rouge et titre blanc.
- **Taille globale** : curseur de 55 % à 160 % ; ajustement automatique dans la zone disponible.
- **Taille de certains mots ou expressions** : sélectionner « Régler la taille », cliquer sur plusieurs mots (ou sélectionner une expression directement dans le titre), puis choisir un pourcentage. La taille peut varier d'un mot à l'autre.
- **Anti-chevauchement** : mise en page qui mesure la largeur et la hauteur de chaque ligne, ajuste le titre et limite son dessin à la zone réservée au-dessus du pied de page.
- **Barlow** : Barlow, Barlow Semi Condensed, Barlow Condensed ; Bold / ExtraBold / Black.
- **Image et logo** : import local, zoom, déplacement de la photographie par glisser, assombrissement, remplacement du logo.
- **Export PNG** : 1080 × 1080, 1200 × 1200 ou 2048 × 2048.
- **Interface compacte** : aperçus et commandes côte à côte sur ordinateur ; aperçu réduit sur mobile ; réglages secondaires repliés.

## Déploiement Vercel

Le site est statique. Vercel sert directement `index.html`. La branche GitHub `main` est associée aux déploiements de production.

## Localement

Ouvrir `index.html` dans un navigateur récent. Une connexion Internet permet le chargement de Barlow depuis Google Fonts ; une police de secours fonctionne hors connexion.

## Confidentialité et limites

Les photos, le texte et les exports restent dans le navigateur. Il n'existe pas encore de sauvegarde collaborative, de comptes utilisateurs ou de liaison directe au CMS. Le logo inclus provient du modèle fourni : remplacer par le PNG officiel pour des exports définitifs. Pour un titre exceptionnellement long, le texte se réduit fortement : l'interface avertit lorsque cela affecte sa lisibilité.

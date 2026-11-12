# TV+ Studio — générateur d'affiches TV+ Afrique

Éditeur web responsive pour la communication éditoriale de TV+ Afrique. Site statique sans backend.

## Modèles disponibles

- **Pastille** (carré) : catégorie, titre, mots-clés jaunes sélectionnés directement par clic.
- **Alerte info** (carré) : bandeau rouge et titre blanc.
- **Décryptage** (16:9) : photo en diagonale à gauche, panneau bleu nuit avec titre, catégorie et angle d'analyse à droite.
- **Verbatim** (carré) : citation alignée dans une colonne à gauche sur un portrait assombri, avec auteur, fonction, filet rouge et logo.

## Nouvelle interface harmonisée (V5)

- **Barre de navigation permanente** : quatre formats visibles d'emblée, avec un outil indépendant de recadrage 1200 × 600.
- **Sur ordinateur** : éditeur à gauche dans un panneau à défilement limité, aperçu en direct et bouton d'export visibles à droite. La page principale tient dans la hauteur de l'écran sur un poste standard.
- **Sur mobile** : choix des quatre formats dans une seule ligne, passage rapide entre vues « Éditeur » et « Aperçu », barre fixe de téléchargement.
- **Réglages** : titre, catégorie, photographie et taille globale accessibles directement ; choix des mots et réglages de police, cadrage et logo regroupés dans des panneaux repliables.
- **Export** : choix de la résolution placé à côté de l'action PNG sur ordinateur ; une action PNG reste visible en bas sur mobile.
- **Recadrage** : espace séparé, zoom, position, flèches, export PNG exact 1200 × 600 et réemploi facultatif dans l'affiche.

## Typographie, photos et sécurité

Polices Barlow / Barlow Semi Condensed / Barlow Condensed, graisses Bold / ExtraBold / Black. Le titre s'adapte à la place disponible et préserve le pied de page. Les photos sont chargées dans le navigateur, sans transfert serveur ; les modèles d'exemple ont vocation à être remplacés par les photos originales et le logo TV+ officiel.

## Développement et publication

La plateforme est une application statique autonome dans `index.html` sans compilation. La branche `main` de ce dépôt GitHub est connectée au projet Vercel `tvplus-studio`, qui déploie automatiquement les modifications.

En local, ouvrir `index.html` dans un navigateur moderne. La police Barlow se charge depuis Google Fonts avec une connexion Internet.

## Limitations

Aucune connexion aux réseaux sociaux, aucun compte utilisateur, aucune sauvegarde partagée et aucune liaison CMS pour le moment.

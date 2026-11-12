# TV+ Studio — générateur d'affiches TV+ Afrique

Quatre modèles éditoriaux dans une interface web statique, responsive et directement utilisable.

## Modèles

- **Pastille** (1:1) : catégorie, titre avec mots cliquables surlignés en jaune, typographie Barlow et pied de page TV+.
- **Alerte info** (1:1) : bandeau rouge et titre clair.
- **Décryptage** (16:9) : photo à gauche, découpe diagonale, panneau bleu nuit à droite, catégorie jaune, titre, question d'analyse et appel à lire l'article. Une photo de démonstration provient du modèle de référence fourni.
- **Verbatim** (1:1) : photo de l'intervenant, voile foncé, citation, nom, fonction, filet rouge et logo TV+. Pour éviter les textes déjà incrustés, importez la photo originale du portrait.

## Édition

Saisissez un titre une fois ; les mots de la Pastille sont cliquables pour activer/retirer le jaune. Le mode « Régler la taille » ajuste certains mots des titres et citations ; le curseur de taille générale et l'ajustement automatique protègent les marges. Les réglages de modèle se conservent pendant la session lorsque vous changez de modèle.

L'image peut être importée au format JPG, PNG ou WEBP, et cadrée/zoomée dans l'aperçu. Le logo TV+ peut être remplacé par son fichier officiel transparent. La famille **Barlow** est disponible en Regular, Semi Condensed et Condensed avec plusieurs graisses.

## Export et déploiement

- Export PNG pour les modèles carrés : 1080, 1200 ou 2048 px.
- Export PNG pour Décryptage : 1600×900, 1920×1080 ou 2560×1440.
- Site statique à fichier unique `index.html`, sans backend ni commande de build.
- La branche `main` de ce dépôt est connectée à Vercel et déploie automatiquement le site.

## Limites

Les images et textes ne sont pas envoyés vers un backend ; aucun compte ni sauvegarde collaborative n'est encore configuré. L'export est généré dans le navigateur. Google Fonts nécessite Internet pour charger Barlow ; une police de remplacement est disponible hors ligne.

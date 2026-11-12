# TV+ Studio — générateur d'affiches TV+ Afrique

Interface web responsive pour l'équipe éditoriale TV+ Afrique. Site statique sur Vercel, branché sur GitHub.

## Affiches

- **Pastille** (1:1) : catégorie, titre et mots-clés jaunes cliquables, tailles réglables.
- **Alerte info** (1:1) : bandeau rouge et titre.
- **Décryptage** (16:9) : photo découpée en diagonale à gauche, analyse à droite.
- **Verbatim** (1:1) : citation alignée à gauche, portrait assombri, auteur, fonction et filet rouge.

Le texte est ajusté automatiquement pour ne pas recouvrir le pied de page. Les polices Barlow, Barlow Semi Condensed et Barlow Condensed sont prises en charge. Export PNG disponible.

## Recadrage photo

Outil autonome avec import de photographie, déplacement, zoom, précision au clavier et export **JPG 1200 × 600** (qualité 94 %, sans déformation). Le résultat peut être réutilisé dans une affiche.

## Amélioration photo — v6

Un nouvel outil indépendant **Amélioration photo** permet :

- Importer un fichier JPG / PNG / WEBP, ou reprendre la photo actuelle d'une affiche.
- Comparer l'original et le résultat avec un curseur visuel avant/après.
- Correction automatique de luminosité, contraste, saturation, réduction de bruit *sensible aux contours* et accentuation de netteté. Ces corrections s'exécutent **entièrement dans le navigateur**, sans modèle distant.
- Ajuster manuellement les cinq paramètres, puis recalculer le rendu.
- Télécharger le PNG amélioré, l'utiliser dans l'affiche ou l'envoyer au recadrage 1200 × 600.
- Super-résolution **IA ×2 / ×4** expérimentale basée sur **Real-ESRGAN general x4v3** : exécution ONNX Runtime Web (WASM) sur l'appareil, par blocs. Ce mode est prévu pour les **petites images** ; la limite dépend de l'appareil (par exemple 1024 px pour le grand côté sur ordinateur, 640 px sur mobile). Le mode ×2 réduit le rendu natif ×4 du modèle à ×2.

### Dépendances et confidentialité

Aucune clé API ni service de traitement d'images n'est nécessaire. Les pixels des photos restent dans le navigateur. **Le mode IA nécessite toutefois le téléchargement initial** de fichiers statiques tiers :

- ONNX Runtime Web 1.22.0 (jsDelivr), `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/`.
- Modèle Real-ESRGAN general x4v3 distribué par NovareOrbis sous licence BSD-3-Clause, version v3, `https://cdn.jsdelivr.net/gh/NovareOrbis/nova-ai-models@v3/realesr-general-x4v3.onnx`.

Le modèle est mis en cache localement quand le navigateur le permet. Si le réseau, le navigateur ou l'appareil ne permet pas l'IA, l'amélioration standard reste utilisable. Le mode IA n'est **pas garanti sur tous les appareils**. L'IA peut créer des détails artificiels ; un média d'information doit toujours comparer le résultat à l'original.

Le mode rapide n'exige aucune de ces dépendances additionnelles. Par souci de performance, il peut réduire les photographies très volumineuses ; les dimensions de sortie sont affichées avant téléchargement.

## Déploiement

Le site est un fichier `index.html` sans étape de build. Toute modification de `main` déclenche un déploiement Vercel.

## Limites

Il n'y a pas encore de comptes utilisateurs, bibliothèque partagée ni intégration au CMS ou aux réseaux sociaux. Les photographies importées ne sont pas enregistrées côté serveur.

## Rédaction, brouillons et contrôle qualité (nouveauté)

Le bouton **Rédaction & brouillons** est situé dans l'en-tête, sans réduire la surface de travail des quatre modèles. Il ouvre une fenêtre avec trois onglets :

1. **Légende Facebook** : modèle de légende déterministe sans IA, calculé depuis la catégorie et le titre de l'affiche. Introduction facultative, CTA, hashtags et URL sont modifiables. Le lien raccourci Rebrandly peut être collé manuellement ; **aucune clé API n'est demandée**. Il ne s'agit pas encore de la charte définitive TV+ Afrique, en attente du modèle fourni par la rédaction.
2. **Brouillons** : sauvegarde automatique via **IndexedDB natif** (aucun service ni serveur). Sauvegarde par format, rappel après rechargement du même navigateur, reprise et suppression. Les images importées sont stockées comme Blobs dans la mesure des quotas disponibles ; les images très grandes peuvent être redimensionnées pour la copie locale. Les brouillons ne sont pas synchronisés entre appareils et peuvent disparaître si le navigateur efface les données locales.
3. **Qualité & formats** : contrôle du titre, de la photographie d'exemple, de la présence d'une signature Verbatim et des contraintes de dimension/texte. Export léger **WebP** ou **JPEG**, avec qualité choisie, sans supprimer le bouton PNG original. Le contrôle signale les risques mais ne remplace pas la validation éditoriale.

Ces fonctionnalités fonctionnent dans le navigateur et ne publient pas automatiquement sur Facebook. **Le traitement d'images local et les modèles d'affiche préexistants restent inchangés.**

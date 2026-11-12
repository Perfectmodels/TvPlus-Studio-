# TV+ Studio — générateur d'affiches TV+ Afrique

Interface web responsive pour l'équipe éditoriale TV+ Afrique. Site statique sur Vercel, branché sur GitHub.

## Affiches

- **Pastille** (1:1) : catégorie, titre et mots-clés jaunes cliquables, tailles réglables. **Interligne** personnalisable de 0,85× à 1,65× et **espacement des lettres** de -3 à +10 px, pris en compte dans l'ajustement automatique du titre pour protéger le pied de page. Réglages disponibles dans « Interligne et espacement des lettres » sous la taille générale, conservés dans les brouillons locaux et dans l'export PNG.
- **Alerte info** (1:1) : bandeau rouge et titre.
- **Décryptage** (16:9) : photo découpée en diagonale à gauche, analyse à droite.
- **Verbatim** (1:1) : citation alignée à gauche, portrait assombri, auteur, fonction et filet rouge.

Le texte est ajusté automatiquement pour ne pas recouvrir le pied de page. Les polices Barlow, Barlow Semi Condensed et Barlow Condensed sont prises en charge. Export PNG disponible.

### Pastilles « À lire » : titre court, légende complète et marque

- **Titre court de l’affiche** : champ dédié limité à **75 caractères**, avec recommandation de **70 caractères / 12 mots maximum**, signalement visuel des titres trop longs et composition plafonnée à **3 lignes**. Les textes restent modifiables ; rien n'est tronqué silencieusement.
- **Titre complet de l’article** : champ facultatif dépliable sous le titre court. Lorsqu'il est renseigné, le générateur de légendes Facebook « À lire » utilise le **titre complet** et les suggestions de hashtags sont calculées depuis celui-ci. Le titre court reste réservé à l'affiche.
- **Pied de page** : tracés vectoriels officiels **Instagram, Facebook et X** de Simple Icons (CC0) intégrés directement dans le Canvas, harmonisés en **48 px** avec espacement constant. Aucune image distante à charger, donc l'export PNG reste autonome. Les marques restent soumises aux règles de leurs titulaires.
- **Logo TV+** : conservation du fichier blanc transparent **TV+ avec la silhouette de l’Afrique**, extrait du visuel de référence fourni, sans redessin ou substitution.
- Les deux titres sont conservés dans les brouillons par modèle et dans la sauvegarde locale IndexedDB.


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

## Légendes Facebook TV+ — quatre formats officiels

Le panneau **Rédaction & brouillons → Légende Facebook** reproduit les structures transmises par TV+ Afrique :
- 📺 **À lire** : titre en gras Unicode, ligne « L’article complet », lien court, WhatsApp et hashtags ;
- 🚨 **Alerte info** : en-tête d'alerte, titre en gras Unicode, WhatsApp et hashtags ;
- 📺 **Reportage** : en-tête reportage, titre, WhatsApp et hashtags ;
- 📺 **En 60 secondes** : en-tête du format, titre, WhatsApp et hashtags.

Le titre est repris depuis l’affiche, puis transformé en caractères gras Unicode (compatible copier-coller dans Facebook sans IA). Les accents non couverts par Unicode mathématique restent dans leurs caractères usuels. La ligne WhatsApp utilise `https://l.tvplusafrique.com/xw7b`. Les hashtags de base (`#TVPlusAfrique` et celui du format) sont ajoutés automatiquement et des hashtags complémentaires peuvent être saisis. Le texte de prévisualisation reste entièrement modifiable.

### Raccourcissement Rebrandly (serveur uniquement)

Dans **Rédaction & brouillons → Légende Facebook → Raccourcir un lien**, il suffit de coller une URL complète d'article TV+ Afrique puis de cliquer sur **Créer le lien court**. Rebrandly génère automatiquement le nom court sous `l.tvplusafrique.com`. Aucun code d'accès, nom personnalisé ni Workspace ID n'est demandé à l'utilisateur.

**Configuration nécessaire dans Vercel :** ajoutez uniquement `REBRANDLY_API_KEY` comme variable d'environnement **sensitive** en **Production**, puis redéployez l'application. Utilisez de préférence une clé API nouvellement générée, puisque l'ancienne a été communiquée dans une conversation.

L'API Rebrandly est appelée uniquement côté serveur via `POST /api/shorten`. Sa clé n'est jamais exposée par le navigateur ou stockée dans GitHub. Le serveur accepte uniquement les destinations HTTPS de `tvplusafrique.com`, vérifie l'origine de la requête, limite le nombre d'opérations par adresse IP et force la sortie sur le domaine court TV+.

**Sécurité à connaître :** sans code d'accès ni authentification, le point d'accès est public. La vérification d'origine et la limitation en mémoire réduisent les abus courants mais ne constituent pas une authentification fiable et la limitation en mémoire n'est pas partagée entre toutes les instances Vercel. Pour un usage réel avec la clé API active, restreignez l'accès à la rédaction via une authentification du site ou un mécanisme anti-abus persistant (Vercel Firewall / limitation de débit). Ne considérez pas cette API comme protégée tant que cette couche n'est pas en place.

Le serveur interroge `GET /v1/domains` et `POST /v1/links`. Le domaine `l.tvplusafrique.com` doit être disponible dans le compte lié à la clé Rebrandly.

### Hashtags automatiques (sans IA)

Le panneau **Légende Facebook** propose désormais un bouton **Générer les hashtags**. À l'ouverture, le module extrait automatiquement les noms propres, acronymes (CESEC, INFASS), lieux, compétitions, thématiques et expressions courantes du **titre de l'affiche**, puis propose des hashtags (par exemple `#JacquesSima`, `#CESEC`, `#NationalFoot1`, `#Dakar2026`). Les suggestions sont calculées par règles JavaScript, sans service externe ni intelligence artificielle.

- Les propositions les plus pertinentes sont activées par défaut ; cliquer sur une pastille permet de l'activer ou désactiver.
- Le champ **Ajouter des hashtags personnalisés** conserve la possibilité d'écrire des hashtags libres.
- `#TVPlusAfrique` et le hashtag propre au format (`#AlerteInfo`, `#Reportage` ou `#60Secondes`) sont insérés automatiquement.
- Les doublons sont éliminés, y compris entre hashtags générés et saisis manuellement.
- La légende et ses hashtags restent modifiables avant copie.

Les règles de détection de noms propres ne remplacent pas la vérification humaine ; la rédaction doit vérifier les suggestions avant publication.

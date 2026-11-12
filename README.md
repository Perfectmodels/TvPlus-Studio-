# TV+ Studio — générateur d'affiches TV+ Afrique

Interface web responsive pour l'équipe éditoriale TV+ Afrique. Site statique sur Vercel, branché sur GitHub.

## Catégories officielles TV+ Afrique

Les modèles **Pastille** et **Décryptage** utilisent désormais un sélecteur natif de catégories, à la place du champ de saisie libre. Les **11 rubriques d'actualité** ont été relevées sur [tvplusafrique.com](https://www.tvplusafrique.com/) le 12 novembre 2026 :

- Culture
- Économie
- Éducation
- Environnement
- International
- Justice
- Fait divers
- Politique
- Santé
- Société
- Sport

Cette liste est une photographie vérifiée du site officiel (sans requête externe au chargement de TV+ Studio). Le choix met à jour immédiatement la Pastille ou le Décryptage et reste enregistré dans les brouillons locaux. Les variantes orthographiques d'anciens brouillons (`Economie`, `Sante`, `Faits divers`) sont normalisées ; une valeur ancienne qui n'existe plus reste visible comme « Ancienne catégorie » afin de ne pas perdre la donnée. Le modèle Décryptage d'exemple utilise **Société** comme rubrique et conserve « Décryptage » comme nom de format, pas comme rubrique.

## Parcours de publication unifié — mobile et ordinateur

TV+ Studio dispose d'un chemin de production continu : **Affiche → Photo (améliorer / recadrer / importer) → Légende Facebook → Vérifier & exporter**. Les fonctionnalités existantes restent les mêmes, avec des accès plus proches du lieu de travail.

- **Sur ordinateur** : barre d'étapes sous les sélecteurs de modèles, visible pendant la création. Boutons dédiés **Affiche**, **Améliorer photo**, **Recadrer**, **Légende Facebook**, **Vérifier / Exporter** et **Brouillons**. Les outils de rédaction s'affichent **à la place de l'aperçu, à côté de l'éditeur d'affiche**, sans bloquer le reste du site.
- **Sur téléphone** : navigation fixe en bas à **5 actions** : **Affiche**, **Photo**, **Légende**, **Aperçu**, **Exporter**. **Photo** ouvre un menu regroupant **Améliorer**, **Recadrer** et **Importer**. Le bandeau mobile Éditeur/Aperçu d'origine est masqué pour éviter la double navigation, mais ses fonctions internes restent utilisables.
- **Rédaction intégrée** : onglets **Légende Facebook**, **Brouillons** et **Qualité & formats** au sein de l'espace de travail. Le contrôle qualité ouvre toujours l'export optimisé WebP/JPEG ; l'export PNG classique reste accessible depuis l'aperçu de l'affiche.
- Les dialogues photo (recadrage et amélioration) conservent leur interface dédiée lorsqu'ils sont ouverts. Les images, les titres et les brouillons ne sont pas effacés au changement d'étape.
- Les actions utilisent les boutons et les gestionnaires existants plutôt que de reproduire les traitements : aucune deuxième logique de génération d'affiche ni faux boutons.

Implémentation : `studio-workflow.js` s'exécute après `studio-editorial-tools.js`. En mode rédaction intégré, le panneau de rédaction est intégré au `main.workspace` et ouvert avec un dialogue **non modal**, pour garder la navigation disponible.

## Affiches

- **Pastille** (1:1) : catégorie, titre et mots-clés jaunes cliquables, tailles réglables. **Largeur des caractères** ajustable de **85 à 115 %**, neutre à **100 %** (l'ancien étirement horizontal forcé à 78 % est supprimé) ; interligne réglable de 0,85× à 1,65× et espacement des lettres de −3 à +10 px. Ces contrôles sont regroupés sous « Proportions et espacements du titre », conservés dans les brouillons locaux, et pris en compte dans l'export PNG et l'ajustement automatique au pied de page.
- **Alerte info** (1:1) : bandeau rouge et titre.
- **Décryptage** (16:9) : photo découpée en diagonale à gauche, analyse à droite.
- **Verbatim** (1:1) : citation alignée à gauche, portrait assombri, auteur, fonction et filet rouge.

Le texte est ajusté automatiquement pour ne pas recouvrir le pied de page. Les polices Barlow, Barlow Semi Condensed et Barlow Condensed sont prises en charge. Export PNG disponible.

### Titre d’affiche et titre de légende Facebook : deux usages distincts

- **Titre de l’affiche Pastille** : champ libre. Il s'affiche dans l'image et dispose de l'ajustement typographique automatique pour protéger le pied de page. La précédente limite de 75 caractères et le plafond de 3 lignes ont été **retirés** de l'affiche.
- **Titre de la légende Facebook « À lire »** : un champ **indépendant** dans **Rédaction & brouillons → Légende Facebook**. Le titre de l'affiche sert de point de départ. L'équipe peut ensuite le raccourcir ou le reformuler, sans toucher au visuel ou au titre complet de l'article.
- Le titre Facebook est recommandé à **75 caractères et 12 mots maximum**. Un compteur et une alerte expliquent quand le raccourcir ; la copie de la légende « À lire » demande de respecter ces limites.
- **Génération depuis l’article** : sous **Légende Facebook → À lire → Analyser le contenu de l’article**, on colle le texte d’un article puis on lance **Analyser et générer des titres**. Le moteur français `french-headline-engine.js` propose jusqu'à **trois variantes** courtes (75 caractères, 12 mots), les justifie par un passage de l'article ou le titre original, et ajoute le titre choisi à la légende.
- **Méthode et licence** : algorithme extractif local fondé sur la fréquence des termes, les noms/indicateurs factuels, le recoupement du titre et l'importance des phrases ; il utilise la liste francophone open source `stopwords-fr` (MIT, © Gene Diaz 2016, licence complète dans `third_party/stopwords-fr.LICENSE`). **Pas d'IA, pas de clé API, pas d'envoi du texte vers un serveur**. Cette approche ne produit pas toujours une reformulation élégante ; les propositions abrégées sont signalées et nécessitent une validation rédactionnelle.
- Le contenu collé est conservé localement dans les paramètres de rédaction du navigateur. Il ne peut pas être analysé si son lien avec le titre de l'affiche précédente paraît incohérent, afin d'éviter de mélanger deux articles. Aucun lien d'article distant n'est automatiquement extrait : **coller le texte** dans le champ.
- Le générateur de hashtags continue de se baser sur le titre source de l'affiche, plutôt que de perdre des mots-clés supprimés lors de la condensation Facebook.
- **Pied de page** : tracés vectoriels **Instagram, Facebook et X** de Simple Icons (CC0), intégrés directement dans le Canvas et harmonisés en 48 px.
- **Logo TV+** : fichier blanc transparent avec la silhouette de l’Afrique conservé depuis le modèle de référence.
- Les titres d'affiche restent enregistrés dans les brouillons IndexedDB. Le titre court de Facebook est conservé en local et réinitialisé lorsque le titre source change.

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

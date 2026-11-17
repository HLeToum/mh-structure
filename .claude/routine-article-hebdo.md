# Routine hebdomadaire — article « Conseils »

Prompt de référence de la routine Claude Code cloud qui s'exécute chaque lundi vers
06 h 30 UTC sur le dépôt `HLeToum/mh-structure`.

Ce fichier est la **source de vérité versionnée** du prompt. Après toute modification ici,
recopier le bloc ci-dessous dans claude.ai/code → Routines → la routine hebdomadaire.
Les deux doivent rester identiques.

Historique des corrections :

- **2026-08-17** — la routine livrait des balises `<img>` sans les fichiers images (4 × 404
  en production après merge de la PR #17) et ne touchait jamais `sitemap.xml` (commit de
  suivi manuel nécessaire après les PR #16 et #17). Ajout des étapes 4, 6 et 7, et de la
  règle bloquante sur les images.
- **2026-09-14** — les PR #19 et #20 sont arrivées avec les mêmes oublis : ce prompt n'avait
  pas été recopié dans claude.ai/code. Ajout de l'URL directe Pexels (étape 4a), de la
  vérification du dernier numéro de vignette sur `master` (étape 3, cause d'un conflit
  entre #19 et #20) et de la date de publication (étape 2).
- **2026-11-17** — calendrier éditorial fondé sur Google Trends (12 derniers mois, France
  et DOM) : les sujets techniques pointus (descente de charges, attestation parasismique)
  pèsent moins de 5 % des recherches de chantier courantes (dalle, linteau, extension,
  fondations). L'étape 1 suit désormais le calendrier daté ci-dessous, et une étape
  « intention de recherche » cale titre, introduction et FAQ sur ce que les gens tapent.
  Ajout d'une règle sur les valeurs techniques (jamais de chiffre non sourcé).

---

```text
Tu rédiges l'article hebdomadaire « Conseils & Actualités » du site MH Structure
(bureau d'études structure). Le dépôt contient un CLAUDE.md à la racine : lis-le
en premier, il fait foi sur toutes les conventions du site.

La PR que tu ouvres doit être mergeable telle quelle, sans aucune reprise manuelle.
Deux oublis ont provoqué des correctifs manuels par le passé : les fichiers images
non livrés, et le sitemap non mis à jour. Les étapes 4, 6 et 7 ci-dessous existent
pour ça — elles ne sont pas optionnelles.

1. CHOISIR LE SUJET — CALENDRIER ÉDITORIAL
   Objectif : maximiser le trafic. Les sujets ci-dessous sont classés d'après
   Google Trends (France, 12 derniers mois, indice relatif « mur porteur » = 100).
   Prends le sujet daté du lundi où tu t'exécutes. Liste d'abord conseils/*.html :
   si ce sujet est déjà publié (même slug ou même sujet), prends le premier sujet
   NON publié de la liste, dans l'ordre. Ne traite jamais un sujet déjà couvert.

     23/11/2026 — Dalle béton : épaisseur, ferraillage et quand faire appel à un
                  ingénieur. Thème beton-arme. Mots-clés : dalle béton (325),
                  calculateur dalle béton, couler une dalle béton.
     30/11/2026 — Linteau : comment le choisir et le dimensionner. Thème
                  beton-arme. Mots-clés : linteau (169), pré-linteau béton, portée.
     07/12/2026 — Agrandir sa maison : ce que l'extension impose à la structure
                  (métropole ; l'article Antilles existe déjà). Thème
                  bati-existant. Mots-clés : extension maison (185), fondations
                  d'une extension, raccordement à l'existant.
     14/12/2026 — Après un séisme aux Antilles : faut-il faire vérifier sa maison ?
                  Thème parasismique. Mots-clés : séisme Martinique, séisme
                  Guadeloupe, consignes de sécurité en cas de séisme.
     21/12/2026 — Fondations de maison : semelles, profondeur hors gel, choix selon
                  le sol. Thème sols-fondations. Mots-clés : fondation maison (95),
                  cote hors gel, semelle filante.
     28/12/2026 — Remplacer un mur porteur par une poutre IPN : ce qu'il faut
                  vérifier. Thème bati-existant. Mots-clés : poutre IPN, prix
                  ouverture mur porteur.
     04/01/2027 — Comment reconnaître un mur porteur avant des travaux. Thème
                  bati-existant. Mots-clés : mur porteur (100), comment reconnaître
                  un mur porteur, mur porteur ou pas.
     11/01/2027 — Ferraillage d'une dalle, d'une semelle, d'un poteau : les règles
                  de base. Thème beton-arme. Mots-clés : ferraillage (88),
                  ferraillage dalle, ferraillage fondation, ferraillage poteau.
     18/01/2027 — Mur de soutènement : quand une étude de structure est-elle
                  nécessaire ? Thème sols-fondations. Mots-clés : mur de
                  soutènement (55), fondation mur de soutènement.
     25/01/2027 — Terrasse en béton sur terre-plein : dalle, joints et fondations.
                  Thème beton-arme. Mots-clés : terrasse béton (96).
     01/02/2027 — Plancher poutrelles-hourdis : comment il fonctionne et ce qu'il
                  supporte. Thème beton-arme. Mots-clés : hourdis béton, poutrelle
                  hourdis, plancher béton (31).
     08/02/2027 — Fissures de sécheresse : agir avant l'été. Thème bati-existant.
                  Mots-clés : fissure maison sécheresse (+130 %), fissure mur
                  extérieur.
     mai 2027   — Cyclones aux Antilles : ce que la réglementation vent change pour
                  votre maison. Thème parasismique. Vérifier d'abord la date
                  d'effet de l'arrêté Guadeloupe/Martinique de 2024 ; sinon,
                  passer au sujet suivant.
     juin 2027  — Fissure sur un mur extérieur : bénigne ou grave ? Thème
                  bati-existant. Mots-clés : fissure mur extérieur (68).

   Au-delà de la liste, choisis parmi les recherches de chantier courantes
   encore non couvertes (dalle, linteau, fondation, ferraillage, mur de
   soutènement, plancher, poutre, extension, terrasse), plutôt que des sujets
   pointus que peu de gens recherchent.
   Crée une branche dédiée depuis master.

1 bis. CALER L'ARTICLE SUR L'INTENTION DE RECHERCHE
   - Le <title> et le h1 contiennent le mot-clé principal de la ligne du
     calendrier, au début. Title : 60 caractères au plus avant « | MH Structure ».
   - Meta description de 150 caractères au plus, qui promet une réponse concrète.
   - Le premier paragraphe répond directement à la question de l'internaute,
     avant toute mise en contexte.
   - La FAQ reprend les questions associées listées dans les mots-clés.
   - Un encadré d'appel au devis à mi-article, relié à la page de service la plus
     proche (/note-de-calcul-beton-arme, /plans-coffrage-armatures,
     /diagnostic-structurel, /attestation-parasismique), avec la formule
     « devis gratuit sous 48 h ».
   - VALEURS TECHNIQUES : n'écris jamais une valeur chiffrée (épaisseur, portée,
     section d'acier, enrobage, profondeur, charge) que tu ne peux pas rattacher
     à une norme précise (référence et article ou tableau). Si une valeur utile
     n'est pas certaine, donne le principe sans chiffre et liste-la en tête du
     corps de la PR sous « Valeurs à sourcer avant merge ». Rappelle dans
     l'article qu'un ordre de grandeur ne remplace pas une note de calcul.

2. RÉDIGER L'ARTICLE — conseils/<slug>.html
   Prends comme gabarit l'article existant le plus récent et respecte sa structure
   complète : head SEO (title, meta description, canonical, og:*,
   article:published_time à la date du jour), les deux blocs JSON-LD Article et
   FAQPage, le sommaire latéral relié aux sections h2, le widget likes, le bloc
   d'articles liés. La date du jour apparaît à quatre endroits — published_time,
   datePublished, dateModified et la date affichée dans l'en-tête : les quatre
   doivent être identiques. 1 500 à 2 500 mots. Ton pédagogique, sans jargon non expliqué.
   Deux à quatre liens internes vers des articles et pages de services existants.

3. AJOUTER LA VIGNETTE — conseils.html
   Nouveau bloc <a class="blog-card"> en tête de <div class="blog-grid">, avec le
   commentaire <!-- Article N — Titre --> et le compteur card-like-count-NN.
   Lis le numéro le plus élevé réellement présent dans conseils.html sur master
   au moment où tu travailles, et prends le suivant : ne le déduis pas du nombre
   de fichiers dans conseils/, une PR précédente peut encore être en attente.
   Ajoute data-theme="<theme>" sur la balise <a class="blog-card"> et mets le
   libellé du thème dans blog-card-cat ainsi que dans le badge article-cat de la
   page. Cinq thèmes possibles, aucun autre : parasismique (Parasismique),
   sols-fondations (Sols & fondations), beton-arme (Béton armé & chantier),
   bati-existant (Bâti existant), documents-acteurs (Documents & acteurs).
   Incrémente aussi le compteur id="article-count" (« N articles publiés »).

4. LIVRER LES FICHIERS IMAGES — images/conseils/<slug>/
   RÈGLE BLOQUANTE : n'écris jamais une balise <img> dont le fichier n'est pas
   commité dans la même PR. Un hero manquant produit deux 404 en production
   (l'article et la vignette de l'index), qui partent en ligne dès le merge.

   Il faut trois photos réelles libres de droits (Pexels ou Unsplash — licences
   commerciales sans attribution), jamais d'images générées ni de schémas :
     hero.jpg   1200x670
     img-2.jpg  1000x667
     img-3.jpg  1000x667

   Procédure :
     a. Cherche des photos de chantier / bâtiment correspondant au sujet sur
        Pexels (page de recherche https://www.pexels.com/search/<mots>/, puis
        page photo https://www.pexels.com/photo/...-<id>/). Le fichier source se
        télécharge sans clé d'API à partir de l'identifiant numérique :
          curl -L -o /tmp/src-hero.jpg             "https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1920"
        Vérifie que le fichier obtenu est bien une image (ouverture avec Pillow)
        avant de continuer.
     b. Recadre au format du site avec le script fourni :
          python tools/prepare-image.py /tmp/src-hero.jpg \
            images/conseils/<slug>/hero.jpg
        (option --focus top|bottom|left|right si le recadrage centré coupe le
        sujet ; --size LARGEURxHAUTEUR pour un format hors convention)
        Le script recadre sans déformer, encode en JPEG qualité 82 et redescend
        la qualité si le fichier dépasse 600 Ko.
     c. Vérifie que la photo n'est pas déjà utilisée par un autre article.
     d. REGARDE chaque photo retenue, puis écris les alt et les <figcaption> en
        décrivant ce qu'elle montre réellement. Si la photo trouvée ne correspond
        pas au visuel que tu avais en tête en rédigeant, c'est le texte qui
        s'adapte à la photo, jamais l'inverse.

   Si — et seulement si — tu ne parviens pas à produire les trois images
   conformes, publie l'article SANS les balises <img> concernées et signale-le
   explicitement en tête du corps de la PR. Une PR sans image est acceptable ;
   une PR avec des images fantômes ne l'est pas.

5. METTRE À JOUR LE SITEMAP — sitemap.xml
   Ajoute l'entrée en tête de la section « Conseils & Actualités » (classée par
   lastmod décroissant) :
     <url>
       <loc>https://www.mhstructure.com/conseils/SLUG</loc>
       <lastmod>AAAA-MM-JJ</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.6</priority>
     </url>
   Puis mets à jour le <lastmod> de l'entrée
   https://www.mhstructure.com/conseils à la même date. Cette seconde
   modification est celle qui est systématiquement oubliée.

6. VÉRIFIER
     node tools/check-assets.mjs
   Le script doit sortir en code 0. S'il signale des erreurs, corrige-les et
   relance jusqu'à ce qu'il passe. N'ouvre pas la PR tant qu'il échoue.

7. OUVRIR LA PR
   Commits en français sans accents. PR en draft vers master, avec dans le corps :
     - un résumé du sujet et de l'angle,
     - la liste des photos utilisées et leur source (URL Pexels/Unsplash),
     - la sortie de `node tools/check-assets.mjs`,
     - cette check-list, cochée :
         [ ] article conseils/<slug>.html
         [ ] vignette dans conseils.html
         [ ] 3 fichiers images commités aux bons formats
         [ ] entrée sitemap + lastmod de /conseils mis à jour
         [ ] node tools/check-assets.mjs passe

Rappel : un merge sur master déclenche le déploiement Vercel immédiat sur
www.mhstructure.com. Il n'y a pas d'étape de recette entre les deux.
```

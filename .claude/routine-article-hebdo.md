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
- **2026-11-03** — les PR #25 à #27 et #33 sont encore arrivées sans images ni sitemap :
  la session cloud de la routine n'a pas accès au web, le téléchargement Pexels de
  l'étape 4a échouait systématiquement. Les photos sont désormais déclarées dans
  `sources.json` et téléchargées par le workflow GitHub `article-images` (étape 4) ;
  `check-assets` tourne aussi en CI sur chaque PR. Ajout de la mise à jour des compteurs
  de la barre de filtres (étape 3), oubliée sur toutes les PR récentes.

---

```text
Tu rédiges l'article hebdomadaire « Conseils & Actualités » du site MH Structure
(bureau d'études structure). Le dépôt contient un CLAUDE.md à la racine : lis-le
en premier, il fait foi sur toutes les conventions du site.

La PR que tu ouvres doit être mergeable telle quelle, sans aucune reprise manuelle.
Deux oublis ont provoqué des correctifs manuels par le passé : les fichiers images
non livrés, et le sitemap non mis à jour. Les étapes 4, 6 et 7 ci-dessous existent
pour ça — elles ne sont pas optionnelles.

1. CHOISIR LE SUJET
   Liste d'abord conseils/*.html pour voir les articles déjà publiés et ne pas
   traiter un sujet déjà couvert. Choisis un sujet utile à un maître d'ouvrage ou
   à un particulier qui fait construire ou rénover : pathologie, pièce du dossier
   technique, obligation réglementaire, point de vigilance de chantier.
   Crée une branche dédiée depuis master.

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
   Incrémente aussi le compteur id="article-count" (« N articles publiés ») et,
   dans la barre de filtres, les compteurs blog-filter-count de « Tous » et du
   thème de l'article.

4. LIVRER LES IMAGES — images/conseils/<slug>/sources.json
   RÈGLE BLOQUANTE : aucune balise <img> ne doit pointer vers un fichier absent
   au moment du merge. Un hero manquant produit deux 404 en production
   (l'article et la vignette de l'index), qui partent en ligne dès le merge.

   Ta session n'a PAS accès au web : Pexels, Wikimedia, etc. sont bloqués, ne
   tente pas de télécharger les photos toi-même. Tu les DÉCLARES dans
   sources.json ; le workflow GitHub « article-images » les télécharge, les
   recadre aux formats du site et les commite sur ta branche dès que tu pousses.

   Il faut trois photos réelles, jamais d'images générées ni de schémas :
     hero.jpg   1200x670
     img-2.jpg  1000x667
     img-3.jpg  1000x667

   Procédure :
     a. Trouve les photos avec la recherche web, sur :
        - Pexels : page https://www.pexels.com/photo/...-<id>/
          → URL source https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg
        - Wikimedia Commons, domaine public ou CC0 de préférence : page
          https://commons.wikimedia.org/wiki/File:<Nom>
          → URL source https://commons.wikimedia.org/wiki/Special:FilePath/<Nom encodé>
        Une photo Commons en CC BY ou CC BY-SA n'est acceptée qu'avec un crédit
        dans la <figcaption> (« Photo : Auteur / Wikimedia Commons, licence
        CC BY-SA 4.0 », lien vers la licence) ; jamais pour le hero.
     b. Écris images/conseils/<slug>/sources.json :
          {
            "hero.jpg":  {"url": "...", "page": "...", "licence": "...", "auteur": "...", "focus": "top"},
            "img-2.jpg": {"url": "...", "page": "...", "licence": "...", "auteur": "..."},
            "img-3.jpg": {"url": "...", "page": "...", "licence": "...", "auteur": "..."}
          }
        "focus" est facultatif (top, bottom, left ou right si le recadrage centré
        coupe le sujet). Vérifie qu'aucune photo n'est déjà utilisée par un autre
        article (compare avec les autres images/conseils/*/sources.json).
     c. Commite et pousse la branche, puis attends le commit du workflow
        (« images: photos de l article ») en surveillant
          git ls-remote origin refs/heads/<ta-branche>
        jusqu'à ce que la tête change (1 à 2 minutes en général, 10 au maximum),
        puis git pull.
     d. REGARDE chaque photo reçue, puis écris les alt et les <figcaption> en
        décrivant ce qu'elle montre réellement. Si la photo ne correspond pas au
        visuel que tu avais en tête en rédigeant, c'est le texte qui s'adapte à
        la photo, jamais l'inverse. Si une photo ne convient pas : supprime le
        fichier, change son entrée dans sources.json et repousse.

   Si le workflow échoue (téléchargement impossible), corrige sources.json et
   repousse. Si tu n'obtiens toujours pas trois images conformes, retire les
   balises <img> concernées et signale-le explicitement en tête du corps de la
   PR. Une PR sans image est acceptable ; une PR avec des images fantômes ne
   l'est pas.

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

6. VÉRIFIER (après le git pull du commit d'images de l'étape 4c)
     node tools/check-assets.mjs
   Le script doit sortir en code 0. S'il signale des erreurs, corrige-les et
   relance jusqu'à ce qu'il passe. N'ouvre pas la PR tant qu'il échoue.

7. OUVRIR LA PR
   Commits en français sans accents. PR en draft vers master, avec dans le corps :
     - un résumé du sujet et de l'angle,
     - la liste des photos utilisées, leur source et leur licence (reprise de sources.json),
     - la sortie de `node tools/check-assets.mjs`,
     - cette check-list, cochée :
         [ ] article conseils/<slug>.html
         [ ] vignette dans conseils.html
         [ ] sources.json + 3 images commitées par le workflow article-images
         [ ] alt et légendes écrits d'après les photos reçues
         [ ] compteurs article-count et barre de filtres à jour
         [ ] entrée sitemap + lastmod de /conseils mis à jour
         [ ] node tools/check-assets.mjs passe

Rappel : un merge sur master déclenche le déploiement Vercel immédiat sur
www.mhstructure.com. Il n'y a pas d'étape de recette entre les deux.
```

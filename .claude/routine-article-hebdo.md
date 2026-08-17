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
   d'articles liés. 1 500 à 2 500 mots. Ton pédagogique, sans jargon non expliqué.
   Deux à quatre liens internes vers des articles et pages de services existants.

3. AJOUTER LA VIGNETTE — conseils.html
   Nouveau bloc <a class="blog-card"> en tête de <div class="blog-grid">, avec le
   commentaire <!-- Article N — Titre --> et le compteur card-like-count-NN
   incrémenté par rapport à l'article précédent.

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
     a. Cherche des photos de chantier / bâtiment correspondant au sujet, puis
        télécharge le fichier source en pleine résolution :
          curl -L -o /tmp/src-hero.jpg "<url directe de la photo>"
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

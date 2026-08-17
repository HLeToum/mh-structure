# MH Structure — site vitrine

Site statique (HTML/CSS/JS, aucun build). Un push sur `master` déclenche le déploiement
Vercel sur `www.mhstructure.com`. Il n'y a donc **aucun filet entre le merge et la
production** : ce qui casse dans la PR casse en ligne.

`vercel.json` active `cleanUrls` : l'URL publique d'un fichier `conseils/mon-slug.html`
est `https://www.mhstructure.com/conseils/mon-slug`, sans extension ni slash final.

---

## Vérification obligatoire avant tout merge

```bash
node tools/check-assets.mjs
```

Le script sort en code 1 s'il reste une erreur. **Ne jamais merger une PR dont le script
sort en erreur.** Il contrôle les 404 d'images, les entrées de sitemap, les vignettes de
l'index, et les conventions de dimensions/poids sur les images nouvellement ajoutées.
`--all` étend l'audit à tout l'historique du site (images orphelines comprises).

---

## Publier un article « Conseils »

Un article n'est complet que lorsque **les cinq** éléments suivants sont livrés dans la
même PR. Les deux derniers sont ceux qui ont été oubliés sur les PR #16 et #17.

### 1. La page de l'article — `conseils/<slug>.html`

Partir d'un article existant récent comme gabarit (`conseils/rapport-geotechnique-etude-de-sol.html`).
Structure attendue dans le `<head>` : `<title>` suffixé ` | MH Structure`, `meta description`,
`link canonical` vers l'URL sans extension, balises `og:*`, `article:published_time` (date du
jour au format `AAAA-MM-JJ`), et deux blocs `application/ld+json` — un `Article` et un `FAQPage`.

Le corps contient un hero, des sections `<h2 id="s1">`, `s2`… reliées au sommaire latéral,
deux `<figure class="article-img">`, le widget likes, et un bloc d'articles liés.

### 2. La vignette dans `conseils.html`

Insérer le nouveau bloc `<a class="blog-card">` **en tête** de `<div class="blog-grid">`,
avec le commentaire `<!-- Article N — Titre -->` et un compteur `card-like-count-NN`
incrémenté par rapport à l'article précédent (`12` → `13`). La vignette pointe vers
`images/conseils/<slug>/hero.jpg` (chemin relatif à la racine, sans `../`).

### 3. Les fichiers images — `images/conseils/<slug>/`

**Écrire une balise `<img>` sans livrer le fichier correspondant produit une 404 en
production.** Une balise hero oubliée en produit deux : l'article et la vignette de l'index.

| Fichier | Dimensions | Rôle |
|---|---|---|
| `hero.jpg` | 1200 × 670 | bandeau de l'article + vignette de l'index |
| `img-2.jpg` | 1000 × 667 | illustration de section |
| `img-3.jpg` | 1000 × 667 | illustration de section |

- JPEG qualité ~82, poids entre 60 et 600 Ko.
- **Photos réelles libres de droits** (Pexels, Unsplash), recadrées aux formats ci-dessus.
  Pas d'images générées, pas de schémas : c'est la convention de tous les articles existants.
- Le recadrage se fait avec le script fourni, qui applique le format, la qualité et le
  plafond de poids sans déformer la photo :

  ```bash
  python tools/prepare-image.py photo-source.jpg images/conseils/<slug>/hero.jpg
  ```

  `--focus top|bottom|left|right` si le recadrage centré coupe le sujet ;
  `--size LARGEURxHAUTEUR` pour un format hors convention. Nécessite Pillow.
- Vérifier que la photo n'est pas déjà utilisée par un autre article (cf. commit `ca433eb`).
- Les `alt` et les `<figcaption>` décrivent **ce que montre réellement la photo retenue**,
  pas le visuel idéal imaginé en rédigeant. Si la photo trouvée diffère de l'intention,
  c'est le texte qui s'adapte à la photo — jamais l'inverse.

### 4. Le sitemap — `sitemap.xml`

Ajouter l'entrée **en tête de la section « Conseils & Actualités »**, qui est classée par
`lastmod` décroissant :

```xml
  <url>
    <loc>https://www.mhstructure.com/conseils/SLUG</loc>
    <lastmod>AAAA-MM-JJ</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
```

Puis **mettre à jour le `<lastmod>` de l'entrée `https://www.mhstructure.com/conseils`** à
la même date. Cette entrée-là est systématiquement oubliée.

### 5. Le maillage interne

Deux à quatre liens vers des articles et pages de services existants dans le corps du texte,
et le bloc « articles liés » en fin de page renseigné.

---

## Ton et contenu

- Public : maîtres d'ouvrage et particuliers, pas des ingénieurs. Expliquer les termes
  techniques à la première occurrence.
- Ne jamais promettre de prestation gratuite : la formule retenue est « devis gratuit sous
  48 h » (cf. commit `5cfde28`).
- MH Structure est un bureau d'études **structure**, à distinguer explicitement des métiers
  voisins (géotechnicien, bureau de contrôle) quand le sujet s'y prête.
- Citer les normes précisément (Eurocode 2, Eurocode 8, NF P 94-500, loi ELAN) sans inventer
  d'article ni de chiffre réglementaire.

## Routine hebdomadaire

Une routine Claude Code cloud ouvre chaque lundi vers 06 h 30 UTC une PR draft contenant
un nouvel article. Son prompt est versionné dans
[`.claude/routine-article-hebdo.md`](.claude/routine-article-hebdo.md) — toute évolution se
fait dans ce fichier, puis se recopie dans claude.ai/code → Routines.

## Conventions Git

- Une branche par article, PR en draft vers `master`.
- Messages de commit en français, sans accents (l'historique existant est en ASCII).
- Ne pousser sur `master` que ce qui passe `node tools/check-assets.mjs`.

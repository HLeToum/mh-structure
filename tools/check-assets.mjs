#!/usr/bin/env node
/**
 * Verification avant merge — site MH Structure.
 *
 *   node tools/check-assets.mjs          # controle du merge (silencieux si tout va bien)
 *   node tools/check-assets.mjs --all    # audit complet du site (y compris l'historique)
 *
 * Controle, sans dependance externe :
 *   1. Toute image locale referencee dans un .html / .css existe sur le disque
 *      (c'est ce controle qui attrape les 404 de la PR hebdomadaire).
 *   2. Chaque article conseils/<slug>.html a ses images, sa vignette dans
 *      conseils.html et son entree dans sitemap.xml.
 *   3. Le sitemap reste coherent : pas d'entree orpheline, section conseils en
 *      ordre antichronologique, <lastmod> de /conseils aligne sur le dernier article.
 *   4. Les images d'article nouvellement ajoutees respectent les conventions
 *      de dimensions et de poids. En mode par defaut, « nouvellement ajoutees »
 *      signifie : absentes de la branche master (via git). Les images deja en
 *      ligne ne sont auditees qu'avec --all.
 *
 * Sortie : code 1 s'il reste au moins une ERREUR (le merge doit etre bloque),
 *          code 0 sinon.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT_ALL = process.argv.includes('--all');

// Conventions du site pour les photos d'article
const POIDS_MIN_KO = 60;
const POIDS_MAX_KO = 600;
const FORMATS = {
  'hero.jpg': { w: 1200, h: 670 },
  'img-2.jpg': { w: 1000, h: 667 },
  'img-3.jpg': { w: 1000, h: 667 },
};

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const rel = (p) => relative(ROOT, p).split(sep).join('/');

// ---------------------------------------------------------------- utilitaires

function walk(dir, filter, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['.git', '.claude', 'node_modules', 'tools'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, out);
    else if (filter(entry.name)) out.push(full);
  }
  return out;
}

/** Fichiers absents de master — les nouveautes apportees par la PR en cours. */
function newSinceMaster() {
  for (const base of ['origin/master', 'master']) {
    try {
      const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=A', `${base}...HEAD`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return new Set(out.split('\n').filter(Boolean).map((p) => resolve(ROOT, p)));
    } catch {
      /* base absente, on essaie la suivante */
    }
  }
  return null; // pas de git exploitable
}

/** Dimensions d'un JPEG ou PNG, lues dans les octets du fichier. */
function imageSize(file) {
  const d = readFileSync(file);
  if (d.length > 24 && d.readUInt32BE(0) === 0x89504e47) {
    return { w: d.readUInt32BE(16), h: d.readUInt32BE(20) };
  }
  if (d.length < 4 || d[0] !== 0xff || d[1] !== 0xd8) return null;
  let i = 2;
  while (i < d.length - 9) {
    if (d[i] !== 0xff) { i++; continue; }
    const marker = d[i + 1];
    // SOF0..SOF15, hors marqueurs qui ne portent pas de dimensions
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: d.readUInt16BE(i + 5), w: d.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    if (marker === 0xff) { i++; continue; }
    i += 2 + d.readUInt16BE(i + 2);
  }
  return null;
}

/** Toutes les references de fichiers locaux d'une page. */
function extractRefs(content) {
  const refs = [];
  const push = (raw, attr) => {
    const url = String(raw).trim();
    if (!url || /^(https?:|data:|mailto:|tel:|#|\/\/)/i.test(url)) return;
    refs.push({ url: url.split(/[?#]/)[0], attr });
  };

  for (const m of content.matchAll(/<img\b[^>]*?\ssrc\s*=\s*["']([^"']+)["']/gi)) push(m[1], 'img src');
  for (const m of content.matchAll(/<source\b[^>]*?\ss(?:rc|rcset)\s*=\s*["']([^"']+)["']/gi))
    for (const cand of m[1].split(',')) push(cand.trim().split(/\s+/)[0], 'source');
  for (const m of content.matchAll(/<img\b[^>]*?\ssrcset\s*=\s*["']([^"']+)["']/gi))
    for (const cand of m[1].split(',')) push(cand.trim().split(/\s+/)[0], 'srcset');
  for (const m of content.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) push(m[1], 'css url()');
  for (const m of content.matchAll(
    /<meta\b[^>]*?(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["'][^>]*?content\s*=\s*["']([^"']+)["']/gi
  ))
    push(m[1], 'meta og:image');
  for (const m of content.matchAll(
    /<link\b[^>]*?rel\s*=\s*["'][^"']*icon[^"']*["'][^>]*?href\s*=\s*["']([^"']+)["']/gi
  ))
    push(m[1], 'link icon');

  return refs;
}

// ------------------------------------------------- 1. images referencees / 404

const htmlFiles = walk(ROOT, (n) => n.endsWith('.html')).sort();
const cssFiles = walk(ROOT, (n) => n.endsWith('.css')).sort();
const referenced = new Set();

for (const file of [...htmlFiles, ...cssFiles]) {
  const content = readFileSync(file, 'utf8');
  for (const { url, attr } of extractRefs(content)) {
    const target = url.startsWith('/') ? join(ROOT, url.slice(1)) : resolve(dirname(file), url);
    if (existsSync(target)) referenced.add(resolve(target));
    else err(`404 — ${rel(file)} : ${attr} "${url}" ne correspond a aucun fichier (attendu : ${rel(target)})`);
  }
}

// ---------------------------------- 2. conventions sur les photos d'article

const nouveaux = AUDIT_ALL ? null : newSinceMaster();
if (!AUDIT_ALL && nouveaux === null) {
  warn('git indisponible : les conventions de dimensions et de poids n\'ont pas pu etre verifiees (relancer avec --all pour auditer tout le site)');
}

const conseilsImgRoot = join(ROOT, 'images', 'conseils');
if (existsSync(conseilsImgRoot)) {
  for (const f of walk(conseilsImgRoot, (n) => /\.(jpe?g|png)$/i.test(n))) {
    const abs = resolve(f);
    if (!AUDIT_ALL && !(nouveaux && nouveaux.has(abs))) continue;

    const ko = Math.round(statSync(f).size / 1024);
    if (ko > POIDS_MAX_KO) warn(`poids — ${rel(f)} fait ${ko} Ko (cible ${POIDS_MIN_KO} a ${POIDS_MAX_KO} Ko)`);
    else if (ko < POIDS_MIN_KO) warn(`poids — ${rel(f)} fait ${ko} Ko : qualite JPEG probablement trop basse (cible ${POIDS_MIN_KO} a ${POIDS_MAX_KO} Ko)`);

    const attendu = FORMATS[f.split(sep).pop().toLowerCase()];
    const reel = imageSize(f);
    if (attendu && reel && (reel.w !== attendu.w || reel.h !== attendu.h)) {
      warn(`format — ${rel(f)} fait ${reel.w}x${reel.h}, la convention du site est ${attendu.w}x${attendu.h}`);
    }
  }
}

// ------------------------------------ 3. articles conseils : images / index / sitemap

const CONSEILS_DIR = join(ROOT, 'conseils');
const slugs = existsSync(CONSEILS_DIR)
  ? readdirSync(CONSEILS_DIR).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')).sort()
  : [];

const indexPath = join(ROOT, 'conseils.html');
const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
const sitemapPath = join(ROOT, 'sitemap.xml');
const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';

const entries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => ({
  loc: m[1].trim(),
  lastmod: m[2].trim(),
}));
const bySlug = new Map(
  entries
    .filter((e) => e.loc.includes('/conseils/'))
    .map((e) => [e.loc.split('/conseils/')[1].replace(/\/$/, ''), e])
);

for (const slug of slugs) {
  const dir = join(ROOT, 'images', 'conseils', slug);
  const livrees = existsSync(dir) ? readdirSync(dir).filter((n) => /\.(jpe?g|png|webp)$/i.test(n)) : [];
  if (livrees.length === 0) {
    err(`images — conseils/${slug}.html : aucune image livree dans images/conseils/${slug}/`);
  }

  if (indexHtml && !indexHtml.includes(`/conseils/${slug}"`)) {
    err(`index — aucune vignette pour "${slug}" dans conseils.html`);
  }

  if (!bySlug.has(slug)) {
    err(`sitemap — entree manquante pour https://www.mhstructure.com/conseils/${slug}`);
  }
}

for (const slug of bySlug.keys()) {
  if (!slugs.includes(slug)) err(`sitemap — entree orpheline : /conseils/${slug} n'existe pas dans conseils/`);
}

// ---------------------------------------------- 4. coherence du sitemap

const conseilsEntries = entries.filter((e) => /\/conseils\//.test(e.loc));
for (let i = 1; i < conseilsEntries.length; i++) {
  if (conseilsEntries[i].lastmod > conseilsEntries[i - 1].lastmod) {
    warn(
      `sitemap — ordre non antichronologique : ${conseilsEntries[i].loc} (${conseilsEntries[i].lastmod}) ` +
        `est place apres ${conseilsEntries[i - 1].loc} (${conseilsEntries[i - 1].lastmod})`
    );
  }
}

const indexEntry = entries.find((e) => e.loc.replace(/\/$/, '').endsWith('/conseils'));
const plusRecent = conseilsEntries.reduce((a, e) => (e.lastmod > a ? e.lastmod : a), '');
if (indexEntry && plusRecent && indexEntry.lastmod < plusRecent) {
  err(
    `sitemap — <lastmod> de /conseils vaut ${indexEntry.lastmod} alors que le dernier article date du ${plusRecent}`
  );
}

// ------------------------------------------- 5. images orphelines (audit seul)

if (AUDIT_ALL) {
  const imagesRoot = join(ROOT, 'images');
  if (existsSync(imagesRoot)) {
    for (const f of walk(imagesRoot, (n) => /\.(jpe?g|png|webp|avif|svg)$/i.test(n))) {
      if (!referenced.has(resolve(f))) warn(`orpheline — ${rel(f)} n'est reference par aucune page`);
    }
  }
}

// ------------------------------------------------------------------- rapport

const pluriel = (n, s, p) => `${n} ${n > 1 ? p : s}`;

if (warnings.length) {
  console.log(`\n  AVERTISSEMENTS (${warnings.length}) — n'empechent pas le merge\n`);
  for (const w of warnings) console.log(`  ~ ${w}`);
}
if (errors.length) {
  console.log(`\n  ERREURS (${errors.length}) — a corriger avant merge\n`);
  for (const e of errors) console.log(`  x ${e}`);
}

console.log(
  `\n  ${htmlFiles.length} pages HTML, ${slugs.length} articles conseils analyses — ` +
    `${pluriel(errors.length, 'erreur', 'erreurs')}, ${pluriel(warnings.length, 'avertissement', 'avertissements')}.` +
    (errors.length ? '' : ' Merge possible.') +
    '\n'
);

process.exit(errors.length ? 1 : 0);

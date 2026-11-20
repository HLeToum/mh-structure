#!/usr/bin/env python3
"""Telecharge et recadre les photos declarees dans images/conseils/<slug>/sources.json.

Utilise par le workflow .github/workflows/article-images.yml : les runners GitHub
ont acces au web, contrairement aux sessions cloud de la routine hebdomadaire.
Lancement local possible :

    python tools/fetch-article-images.py [slug ...]

Format de sources.json (seul "url" est obligatoire) :

    {
      "hero.jpg":  {"url": "https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg",
                    "focus": "top", "licence": "Pexels", "auteur": "...", "page": "..."},
      "img-2.jpg": {"url": "https://commons.wikimedia.org/wiki/Special:FilePath/<Fichier>.jpg",
                    "licence": "Domaine public", "page": "..."},
      "img-3.jpg": {...}
    }

Une image deja presente n'est pas retelechargee : pour en changer, supprimer le
fichier puis modifier sources.json.
"""

import json
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path

HOTES = {"images.pexels.com", "images.unsplash.com", "commons.wikimedia.org", "upload.wikimedia.org"}
FICHIERS = {"hero.jpg", "img-2.jpg", "img-3.jpg"}
FOCUS = {"top", "bottom", "left", "right"}
UA = "MHStructureSiteBot/1.0 (https://www.mhstructure.com)"


def url_source(url):
    """Verifie l'hote et demande une taille de source suffisante pour le recadrage."""
    p = urllib.parse.urlsplit(url)
    if p.scheme != "https" or p.hostname not in HOTES:
        sys.exit(f"hote non autorise : {url} (autorises : {', '.join(sorted(HOTES))})")
    if p.hostname == "images.pexels.com" and not p.query:
        url += "?auto=compress&cs=tinysrgb&w=1920"
    if p.hostname == "commons.wikimedia.org" and "Special:FilePath" in p.path and not p.query:
        url += "?width=1920"
    return url


def telecharger(url, dest):
    for essai in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as reponse:
                dest.write_bytes(reponse.read())
            return
        except Exception as exc:  # reseau capricieux : on retente
            print(f"  essai {essai + 1} echoue : {exc}")
            time.sleep(2 ** essai)
    sys.exit(f"echec du telechargement : {url}")


def main():
    racine = Path("images/conseils")
    slugs = sys.argv[1:] or [p.parent.name for p in sorted(racine.glob("*/sources.json"))]
    tmp = Path(tempfile.mkdtemp(prefix="article-images-"))
    for slug in slugs:
        sources = json.loads((racine / slug / "sources.json").read_text(encoding="utf-8"))
        for nom, info in sources.items():
            if nom not in FICHIERS:
                sys.exit(f"{slug} : nom de fichier inattendu {nom!r} (attendus : {', '.join(sorted(FICHIERS))})")
            cible = racine / slug / nom
            if cible.exists():
                continue
            url = url_source(info["url"])
            print(f"{slug}/{nom} <- {url}")
            source = tmp / f"{slug}-{nom}"
            telecharger(url, source)
            commande = [sys.executable, "tools/prepare-image.py", str(source), str(cible)]
            if info.get("focus") in FOCUS:
                commande += ["--focus", info["focus"]]
            subprocess.run(commande, check=True)


if __name__ == "__main__":
    main()

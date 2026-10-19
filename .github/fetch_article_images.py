#!/usr/bin/env python3
"""Telecharge et recadre les photos des 3 articles conseils (usage unique).

Lance par .github/workflows/fetch-article-images.yml, puis supprime avec lui.
"""

import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "MHStructureSiteBot/1.0 (https://www.mhstructure.com; etudes@mhstructure.com)"


def pexels(photo_id):
    return f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&w=1600"


def commons(name):
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(name) + "?width=1700"


JOBS = [
    ("fondations-profondes-micropieux/hero.jpg", pexels(7910062)),
    ("fondations-profondes-micropieux/img-2.jpg", commons("Baustelle-Hölzla-Rebar-6228085.jpg")),
    ("fondations-profondes-micropieux/img-3.jpg", commons("Chantier de construction du complexe associatif multifonctions à Antony 31.jpg")),
    ("etude-structure-obligatoire-quand/hero.jpg", pexels(34573691)),
    ("etude-structure-obligatoire-quand/img-2.jpg", pexels(3862377)),
    ("etude-structure-obligatoire-quand/img-3.jpg", commons("SI-MODULAR Tragwerk Deutschland 2019.jpg")),
    ("beton-milieu-marin-tropical/hero.jpg", commons("DSCF0718 Empty sandy beach in front of a row of seaside buildings and an orange steel structure under a cloudy sky.jpg")),
    ("beton-milieu-marin-tropical/img-2.jpg", commons("Fractured reinforced concrete column.JPG")),
    ("beton-milieu-marin-tropical/img-3.jpg", commons("Reinforced Column Base for Fence Foundation.jpg")),
]


def download(url, dest):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as resp:
                dest.write_bytes(resp.read())
            return
        except Exception as exc:  # reseau capricieux : on retente
            print(f"  tentative {attempt + 1} echouee : {exc}")
            time.sleep(2 ** attempt)
    sys.exit(f"echec du telechargement : {url}")


src_dir = Path("/tmp/sources")
src_dir.mkdir(exist_ok=True)
for i, (cible, url) in enumerate(JOBS):
    source = src_dir / f"{i}.jpg"
    print(f"{cible} <- {url}")
    download(url, source)
    destination = Path("images/conseils") / cible
    destination.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([sys.executable, "tools/prepare-image.py", str(source), str(destination)], check=True)

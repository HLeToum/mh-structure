#!/usr/bin/env python3
"""Usage unique : telecharge et recadre les photos de l'article chainages (domaine public, Wikimedia Commons)."""
import subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path
UA = "MHStructureSiteBot/1.0 (https://www.mhstructure.com)"
def commons(name):
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(name) + "?width=1700"
JOBS = [
    ("hero.jpg", commons("Bond beam work at Gabriela Mistral School construction site 150622-F-LP903-386.jpg")),
    ("img-2.jpg", commons("Bond beam work at Gabriela Mistral School construction site 150622-F-LP903-727.jpg")),
    ("img-3.jpg", commons("Defense.gov News Photo 071114-N-7367K-005.jpg")),
]
out = Path("images/conseils/chainages-maconnerie-maison"); out.mkdir(parents=True, exist_ok=True)
for nom, url in JOBS:
    src = Path("/tmp") / nom
    for t in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                src.write_bytes(r.read()); break
        except Exception as e:
            print("retry", e); time.sleep(2 ** t)
    else:
        sys.exit("echec " + url)
    subprocess.run([sys.executable, "tools/prepare-image.py", str(src), str(out / nom)], check=True)

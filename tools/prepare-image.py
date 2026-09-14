#!/usr/bin/env python3
"""Recadre une photo aux formats d'illustration du site MH Structure.

    python tools/prepare-image.py source.jpg images/conseils/<slug>/hero.jpg
    python tools/prepare-image.py source.jpg images/conseils/<slug>/img-2.jpg --focus top

Le format cible est deduit du nom du fichier de destination :
    hero.jpg   -> 1200x670
    img-2.jpg  -> 1000x667
    img-3.jpg  -> 1000x667
(sinon, le passer explicitement avec --size LARGEURxHAUTEUR)

La photo est recadree au bon ratio — sans deformation — puis redimensionnee aux
dimensions exactes et enregistree en JPEG progressif qualite 82. Si le fichier
depasse 600 Ko, la qualite est abaissee par paliers jusqu'a rentrer dans la cible.

Necessite Pillow :  pip install Pillow
"""

import argparse
import io
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow est requis : pip install Pillow")

FORMATS = {"hero.jpg": (1200, 670), "img-2.jpg": (1000, 667), "img-3.jpg": (1000, 667)}
QUALITE = 82
QUALITE_MIN = 60
POIDS_MAX = 600 * 1024
POIDS_MIN = 60 * 1024


def crop_ratio(im, ratio_cible, focus):
    """Recadre l'image au ratio demande en conservant la zone d'interet."""
    largeur, hauteur = im.size
    ratio = largeur / hauteur

    if abs(ratio - ratio_cible) < 1e-3:
        return im

    if ratio > ratio_cible:  # trop large : on rogne sur les cotes
        neuve = round(hauteur * ratio_cible)
        offsets = {"left": 0, "right": largeur - neuve}
        gauche = offsets.get(focus, (largeur - neuve) // 2)
        return im.crop((gauche, 0, gauche + neuve, hauteur))

    # trop haute : on rogne en hauteur
    neuve = round(largeur / ratio_cible)
    offsets = {"top": 0, "bottom": hauteur - neuve}
    haut = offsets.get(focus, (hauteur - neuve) // 2)
    return im.crop((0, haut, largeur, haut + neuve))


def encode(im, qualite):
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=qualite, optimize=True, progressive=True)
    return buf.getvalue()


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("source", type=Path, help="photo d'origine (telechargee depuis Pexels/Unsplash)")
    p.add_argument("destination", type=Path, help="ex. images/conseils/mon-slug/hero.jpg")
    p.add_argument("--size", help="format force, ex. 1200x670")
    p.add_argument(
        "--focus",
        default="center",
        choices=["center", "top", "bottom", "left", "right"],
        help="zone conservee lors du recadrage (defaut : center)",
    )
    args = p.parse_args()

    if not args.source.is_file():
        sys.exit(f"source introuvable : {args.source}")

    if args.size:
        try:
            largeur, hauteur = (int(v) for v in args.size.lower().split("x"))
        except ValueError:
            sys.exit(f"--size attendu au format LARGEURxHAUTEUR, recu : {args.size}")
    else:
        cible = FORMATS.get(args.destination.name.lower())
        if not cible:
            sys.exit(
                f"nom de destination non reconnu ({args.destination.name}) : "
                f"utiliser hero.jpg / img-2.jpg / img-3.jpg, ou passer --size"
            )
        largeur, hauteur = cible

    with Image.open(args.source) as im:
        im = ImageOps.exif_transpose(im)
        if im.width < largeur or im.height < hauteur:
            print(
                f"  ! la source fait {im.width}x{im.height}, plus petite que la cible "
                f"{largeur}x{hauteur} : chercher une photo de meilleure resolution",
                file=sys.stderr,
            )
        im = crop_ratio(im.convert("RGB"), largeur / hauteur, args.focus)
        im = im.resize((largeur, hauteur), Image.LANCZOS)

        qualite = QUALITE
        data = encode(im, qualite)
        while len(data) > POIDS_MAX and qualite > QUALITE_MIN:
            qualite -= 4
            data = encode(im, qualite)

    args.destination.parent.mkdir(parents=True, exist_ok=True)
    args.destination.write_bytes(data)

    ko = len(data) // 1024
    print(f"  {args.destination}  {largeur}x{hauteur}  {ko} Ko  qualite {qualite}")
    if len(data) < POIDS_MIN:
        print(f"  ! {ko} Ko seulement : la photo est peut-etre trop lisse ou trop petite", file=sys.stderr)
    if len(data) > POIDS_MAX:
        print(f"  ! {ko} Ko malgre la compression maximale autorisee", file=sys.stderr)


if __name__ == "__main__":
    main()

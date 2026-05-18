"""Fallback resizer for the 4 webp files sharp couldn't open."""
import os
import shutil
from PIL import Image

DIR = r"D:\Claude\Personal website\Repository\Assets\SY-Webinar"
BACKUP = os.path.join(DIR, "_originals")
MAX = 2000
FILES = [
    "dYY79hSsShwgosqCKV4LK3AiZU4.webp",
    "LwCHhuMN2oeJBsihFLal2kCxv7w.webp",
    "T06NRAp0sSH5PetaZjfrBn3JPfg.webp",
    "XSa0pCBBnEnUXI0j5mdIh5kycM.webp",
]

os.makedirs(BACKUP, exist_ok=True)

for name in FILES:
    src = os.path.join(DIR, name)
    if not os.path.exists(src):
        print(f"? {name} — missing")
        continue
    img = Image.open(src)
    w, h = img.size
    longest = max(w, h)
    print(f"  {name} {w}x{h}", end="")
    if longest <= MAX:
        print(" — already small, skipped")
        continue

    backup = os.path.join(BACKUP, name)
    if not os.path.exists(backup):
        shutil.copy2(src, backup)

    if w >= h:
        new_w = MAX
        new_h = round(h * (MAX / w))
    else:
        new_h = MAX
        new_w = round(w * (MAX / h))
    img = img.convert("RGBA") if img.mode == "P" else img
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    # Drop ICC profile so re-encoders downstream don't trip on it again.
    resized.save(src, "WEBP", quality=90, method=6)
    print(f" -> {new_w}x{new_h}")

print("Done.")

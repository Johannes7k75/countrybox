"""Visual review aid: for a fixed sample of flags, show the top-N neighbours of several packs side by side.
Usage: uv run contact_sheet.py OUT.png id1,id2,... pack1.json pack2.json ...
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
out, ids, packs = sys.argv[1], sys.argv[2].split(","), [json.loads(Path(p).read_text()) for p in sys.argv[3:]]
catalog = json.loads((ROOT / "packages/catalog/generated/countries.json").read_text())
renders = ROOT / "data/similarity/renders" / catalog["version"]
N, T, PAD, LABEL = 6, 72, 6, 14   # neighbours per method, thumb size
cell = lambda i: Image.open(renders / f"{i}.png").convert("RGB").resize((T, T))
row_h = T + LABEL + PAD
cols = 1 + len(packs) * (N + 1)
W, H = cols * (T + PAD) + PAD, len(ids) * row_h + 24 + PAD
sheet = Image.new("RGB", (W, H), "#e9e6dd"); d = ImageDraw.Draw(sheet)
for k, p in enumerate(packs):
    d.text((PAD + (1 + k * (N + 1) + 1) * (T + PAD), 6), p["method"], fill="#18243a")
for r, i in enumerate(ids):
    y = 24 + r * row_h
    sheet.paste(cell(i), (PAD, y)); d.text((PAD, y + T + 1), i.upper(), fill="#b13a2d")
    for k, p in enumerate(packs):
        for j, n in enumerate(p["neighbors"][i][:N]):
            x = PAD + (1 + k * (N + 1) + 1 + j) * (T + PAD)
            sheet.paste(cell(n), (x, y)); d.text((x, y + T + 1), f"{j+1} {n}", fill="#3c475a")
sheet.save(out); print(out, sheet.size)

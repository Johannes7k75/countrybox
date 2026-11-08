"""Offline flag embeddings → NeighborPack JSON. Usage (from tools/similarity):
  uv run embed.py dinov2   # facebook/dinov2-small, CLS token
  uv run embed.py clip     # OpenCLIP ViT-B-32 / laion2b_s34b_b79k image tower
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np, torch
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / "packages/catalog/generated/countries.json").read_text())
render_dir = ROOT / "data/similarity/renders" / catalog["version"]
manifest = json.loads((render_dir / "manifest.json").read_text())
ids = [c["id"] for c in catalog["countries"]]
flag_key = {c["id"]: c["flagKey"] for c in catalog["countries"]}
K = 24
MIRROR_PENALTY = 1.08   # same idea as lab-grid-v1: mirrored tricolours are real confusions

which = sys.argv[1] if len(sys.argv) > 1 else "dinov2"
torch.manual_seed(0)

if which == "dinov2":
    from transformers import AutoImageProcessor, AutoModel
    name = "facebook/dinov2-small"
    proc, model = AutoImageProcessor.from_pretrained(name), AutoModel.from_pretrained(name).eval()
    # Keep the whole flag: no centre crop (our renders are already square and padded).
    proc.do_center_crop = False
    proc.size = {"height": 224, "width": 224}
    def embed(imgs):
        with torch.no_grad():
            out = model(**proc(images=imgs, return_tensors="pt"))
        return out.last_hidden_state[:, 0]          # CLS token
    method = "dinov2-vits14-v1"
elif which == "clip":
    import open_clip
    name, pretrained = "ViT-B-32", "laion2b_s34b_b79k"
    model, _, preprocess = open_clip.create_model_and_transforms(name, pretrained=pretrained)
    model.eval()
    def embed(imgs):
        with torch.no_grad():
            return model.encode_image(torch.stack([preprocess(i) for i in imgs]))
    method = "openclip-vitb32-laion2b-v1"
else:
    sys.exit("usage: embed.py dinov2|clip")

def load(i):
    f = render_dir / manifest["files"][i]["file"]
    assert hashlib.sha256(f.read_bytes()).hexdigest() == manifest["files"][i]["sha256"], f"hash mismatch {i}"
    return Image.open(f).convert("RGB")

def normed(t):
    v = t.cpu().numpy().astype(np.float64)
    assert np.isfinite(v).all(), "non-finite embedding"
    return v / np.linalg.norm(v, axis=1, keepdims=True)

imgs = [load(i) for i in ids]
E  = normed(embed(imgs))
Eh = normed(embed([ImageOps.mirror(i) for i in imgs]))  # horizontal mirror
Ev = normed(embed([ImageOps.flip(i) for i in imgs]))    # vertical mirror

# cosine distance, minimised over mirrors of the candidate
D = np.minimum.reduce([1 - E @ E.T, (1 - E @ Eh.T) * MIRROR_PENALTY, (1 - E @ Ev.T) * MIRROR_PENALTY])

neighbors, distances = {}, {}
for a, ia in enumerate(ids):
    order = [b for b in np.argsort(D[a], kind="stable") if b != a and flag_key[ids[b]] != flag_key[ia]][:K]
    neighbors[ia] = [ids[b] for b in order]
    distances[ia] = [round(float(D[a, b]), 4) for b in order]

body = {"method": method, "catalogVersion": catalog["version"], "k": K, "neighbors": neighbors, "distances": distances}
version = hashlib.sha256(json.dumps(body, separators=(",", ":")).encode()).hexdigest()[:16]
pack = {"schemaVersion": 1, "version": version, **body}
out = ROOT / f"data/similarity/flag-neighbors.{method}.json"
out.write_text(json.dumps(pack))
print(f"wrote {out} ({version}); model={name}, dims={E.shape[1]}")

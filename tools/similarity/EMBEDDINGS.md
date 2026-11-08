# Step 4 — image embeddings for look-alike flags

This guide is for replacing (or beating) the colour/layout baseline `lab-grid-v1` with neighbours computed from a pretrained image model. Everything runs **offline at build time**. The app never runs a model; it only reads a small `flag-neighbors.json`.

> **Status (2026-11-07): done.** DINOv2 and OpenCLIP were run and evaluated. Production now uses **`fused-labgrid-openclip-v3`**: the lab-grid baseline fused with OpenCLIP by reciprocal rank fusion plus k-reciprocal re-ranking. See [Results and decision](#results-and-decision-2026-11-07). The script below is the one that was run (`tools/similarity/embed.py`).

## Results and decision (2026-11-07)

Environment: a uv project (`tools/similarity/pyproject.toml` + `uv.lock`): Python 3.12, torch 2.15.0+cpu (from the PyTorch CPU index, about 1 GB env), transformers 5.22.2, open-clip-torch 4.2.1. Rerunning under the uv environment reproduced the OpenCLIP pack bit-for-bit (same content hash).

| Method                                                         | Look-alike recall@8 (25 pairs) | Gates    | Notes                                                                                                                |
| -------------------------------------------------------------- | ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `lab-grid-v1` (colour/layout baseline)                         | 0.84                           | pass     | Precise on stripe colours; blind to shapes (misses Germany/Belgium, Norway/Iceland, Switzerland/Denmark)             |
| `dinov2-vits14-v1`                                             | 0.48                           | **fail** | General visual features miss most flag confusions — rejected                                                         |
| `openclip-vitb32-laion2b-v1`                                   | 0.92                           | **fail** | Excellent on shapes/symbols (crosses, chevrons, discs); semantic leakage (India → UK, Brazil → Latin American flags) |
| `fused-labgrid-openclip-v1` (RRF)                              | 0.96                           | fail     | India → UK still rank 5                                                                                              |
| `fused-labgrid-openclip-v2` (RRF, missing = rank 48)           | 0.96                           | fail     | Same leak                                                                                                            |
| **`fused-labgrid-openclip-v3`** (v2 + k-reciprocal re-ranking) | **0.96**                       | **pass** | Only miss: Cameroon/Guinea (rank 14, not required)                                                                   |

Process, including the caveats:

1. The original 16 fixtures were written before any embedding ran. After the first runs, 9 look-alike and 5 distinct **held-out** pairs were added (tagged `heldout-2026-11-07` in `fixtures.json`). Four of them had been seen in review sheets; they are tagged as such.
2. The fusion variants v2/v3 were designed after seeing the held-out failures, so the held-out set is no longer independent. The final choice was therefore confirmed by a **fresh visual review of 16 flags not reviewed before** (`contact_sheet.py`). v3 was better or equal on all 16: Cuba→Puerto Rico, Thailand→Costa Rica, Philippines/Chile→Czechia, Lithuania→Bulgaria, Finland→Sweden/Iceland/Greece, Spain→Andorra/Colombia. It drops odd baseline picks such as Pakistan→Brazil.
3. Reports for every method are committed in `data/similarity/report-*.json`. The review sheets (`data/similarity/review/`) are gitignored and can be recreated with `contact_sheet.py`.

**How production builds it (no Python needed):** `pnpm catalog` / `make similarity` computes `lab-grid-v1`. If `data/similarity/flag-neighbors.openclip-vitb32-laion2b-v1.json` (committed) matches the current `catalogVersion`, it is fused into `fused-labgrid-openclip-v3`. Otherwise the build publishes `lab-grid-v1` and prints a warning. **When the catalog changes** (flags, entities), run `make embeddings` (= `export-png`, then `uv run embed.py clip`) and commit the new OpenCLIP pack.

Licence note: OpenCLIP code is MIT. The `laion2b_s34b_b79k` ViT-B-32 weights were used only offline to compute neighbour rankings; no model weights or embeddings ship with the app. Review the checkpoint's terms before any redistribution of the vectors themselves.

## How it plugs in

```
flag SVGs ──export-png──▶ 224×224 PNGs ──embed.py──▶ flag-neighbors.<method>.json ──evaluate──▶ report
                                                                       │
                                     (if it beats the baseline) copy to packages/catalog/generated/
                                                                 and apps/web/public/catalog/
```

The contract is the `NeighborPack` type in `packages/catalog/src/index.ts`:

```jsonc
{
  "schemaVersion": 1,
  "version": "<16-hex content hash>",          // sessions record this
  "method": "dinov2-vits14-v1",                 // a new name per model/preprocessing (never reuse)
  "catalogVersion": "<catalog version>",        // must equal packages/catalog/generated/countries.json → version
  "k": 24,
  "neighbors": { "fr": ["nl", "ru", ...], ... }, // most similar first; no self; no same-flagKey ids
  "distances": { "fr": [0.08, 0.11, ...], ... }  // ascending, same order as neighbors
}
```

The domain package (`visual-v1` in `packages/domain/src/distractors.ts`) uses only `neighbors`. It samples from ranks 1–8 first, then 9–20, preferring countries inside the learner's scope. Correctness is still enforced by `buildFromTiers`, so a bad pack can make questions easier or odd but **never ambiguous**.

## 0. Prerequisites

- The repo is set up (`make setup`), so `packages/catalog/generated/countries.json` and the flags exist.
- [uv](https://docs.astral.sh/uv/). It installs Python 3.12 by itself if needed. A CPU is enough: about 250 images take seconds to a minute.
- Disk: about 100 MB for DINOv2-S, about 600 MB for OpenCLIP ViT-B/32.

## 1. Export the renders the app actually shows

```sh
pnpm --filter @countrybox/similarity-tool export-png
# → data/similarity/renders/<catalogVersion>/<id>.png  (224×224, white, aspect-preserved)
# → data/similarity/renders/<catalogVersion>/manifest.json  (sha256 + flagKey per file)
```

The renders are gitignored and reproducible from the catalog. Don't embed raw SVGs or downloaded flag images. The model must see the same artwork learners see.

## 2. Python environment (uv)

`tools/similarity` is a [uv](https://docs.astral.sh/uv/) project. Dependencies are pinned in `pyproject.toml` and locked in `uv.lock` (both committed). PyTorch comes from the CPU-only index, so no CUDA wheels are downloaded.

```sh
cd tools/similarity
uv sync          # creates .venv (gitignored) exactly from uv.lock; ~1 GB
```

You don't need to activate anything; use `uv run …`. To upgrade a dependency, change the pin in `pyproject.toml`, run `uv lock`, then re-run the embedding and the evaluation. A new model version counts as a new method (see the rules below).

**Licences (check before publishing):**

- DINOv2 core models: code and weights are Apache-2.0. Check the exact checkpoint (`facebook/dinov2-small`), not the whole repository.
- OpenCLIP: the code is MIT. Each pretrained checkpoint has its own terms (e.g. LAION-2B weights). Record the checkpoint name.

## 3. Compute embeddings and neighbours

The script is `tools/similarity/embed.py`:

```python
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
```

Run it for both candidates (what was done on 2026-11-07):

```sh
cd tools/similarity
uv run embed.py dinov2
uv run embed.py clip
```

## 4. Evaluate against the baseline

```sh
cd ../..   # repo root
pnpm --filter @countrybox/similarity-tool evaluate data/similarity/flag-neighbors.dinov2-vits14-v1.json
pnpm --filter @countrybox/similarity-tool evaluate data/similarity/flag-neighbors.openclip-vitb32-laion2b-v1.json
```

Each run prints recall@8 on the look-alike pairs, the rank of every fixture next to the baseline's, and the distinct-pair checks. It writes `data/similarity/report-<method>.json` and fails on structural problems (wrong catalog version, self links, identical-flag links, missing ids) or on failed required fixtures.

**Baseline to beat (lab-grid-v1, 2026-11-07):** recall@8 = 0.938. All 9 required pairs pass; Norway/Iceland (crosses with swapped colours) is missed; Nepal/USA sits at rank 12.

Before deciding:

1. Look at the hardest cases yourself. For 20 random flags, compare the top 8 of both methods. Image models may group by _meaning_ (e.g. all crescents, all crosses) rather than look; that's not always the confusion learners make.
2. Extend `data/similarity/fixtures.json` with any new pairs you're confident about (both look-alike and distinct). Don't edit fixtures just to make a method pass.
3. Prefer the simpler method unless the embedding is clearly better on fixtures **and** on your manual review.

## 5. Publish the chosen pack

If an embedding wins:

```sh
cp data/similarity/flag-neighbors.dinov2-vits14-v1.json packages/catalog/generated/flag-neighbors.json
cp data/similarity/flag-neighbors.dinov2-vits14-v1.json apps/web/public/catalog/flag-neighbors.json
pnpm --filter @countrybox/similarity-tool test     # pack sanity + fixtures
pnpm --filter @countrybox/domain test              # hard-mode questions stay unambiguous
```

Then make it reproducible rather than a manual copy:

- Commit `embed.py`, `pyproject.toml`, `uv.lock` and the generated pack under `data/similarity/` (the source of truth for that method).
- Change `tools/similarity/src/build.ts` to copy that committed pack (if its `catalogVersion` matches) instead of computing `lab-grid-v1`, or to fall back to `lab-grid-v1` when the catalog has changed and the embedding pack is stale.
- Record the decision, model, and checkpoint license alongside the evaluation report.

Rules that keep this safe:

- **A new model, checkpoint or preprocessing step means a new `method` name.** Never compare distances across methods.
- **Catalog changes invalidate the pack.** The web app ignores a pack whose `catalogVersion` doesn't match, and falls back to `region-v1`.
- Sessions store `neighborPackVersion`, so old results stay explainable after a pack change.

## 6. Later (only when needed)

- **pgvector:** store vectors in the existing PostgreSQL only if the server must query similarity at runtime (e.g. per-user confusion features). For about 250 flags, exhaustive search in this offline job is simpler and exact.
- **Personal confusion strategy:** rank distractors by a learner's own past first-answer mistakes. Keep it user-scoped and separate from the global visual pack.
- **Learner evaluation:** before claiming "harder" or "better learning", compare error rates between standard and look-alike sessions on opt-in data.

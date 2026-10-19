# /tools/ icons

The tool icons are rendered by [lmcad](https://github.com/lmctl-ai/lmcad)
from lmscript `_dsl_` scripts: one script per icon, compiled with the
published lmscript compiler against the schema `lmcad --schema --json`
prints, then run by the lmcad host. Shapes, not text, carry each tool's
identity; booleans and loops build them.

| Script | Shape | Output |
| --- | --- | --- |
| `lmscript.lms` | `{ ≡ }`: two braces and three code lines | `tools/lmscript/img/` |
| `lmcad.lms` | cube with a cylindrical hole, ball on top | `tools/lmcad/img/` |
| `lmhtml.lms` | `</>` from rotated boxes | `tools/lmhtml/img/` |
| `cpp-dsl-sdk.lms` | two meshing gears | `tools/cpp-dsl-sdk/img/` |
| `tools.lms` | 2x2 blocks in the tool colours (site icon) | `tools/img/` |

Each tool gets `logo.png` (256x256) and `icon.png` (64x64); the site icon
is `tools/img/tools.png` (256x256) and `tools/img/icon.png` (64x64). Every
file must stay under 20 KB.

## Regenerate

```sh
LMCAD=/path/to/lmcad scripts/tools/icons/render.sh            # write the PNGs
LMCAD=/path/to/lmcad scripts/tools/icons/render.sh --check    # verify committed PNGs
LMCAD=/path/to/lmcad scripts/tools/icons/render.sh --preview /tmp/icons  # also 32 px renders
```

`render.sh` compiles with `npx --package=@lmctl-ai/lmctl@0.2.348 -- lmscript`
(override with `LMSCRIPT=...` or `LMSCRIPT_VERSION=...`). Output is
deterministic: the same lmcad binary renders byte-identical PNGs, and
`--check` renders into a temporary directory and compares. A different lmcad
version may change pixels; then re-render and commit. The filleted shapes need
an lmcad that includes the box-fillet tessellation fix (lmcad commit
"cad: drop zero-normal sliver triangles after canonicalization" or later).

## Add an icon for a new tool

1. Copy the closest script to `scripts/tools/icons/<tool>.lms` (`<tool>` is
   the directory name under `tools/`).
2. Keep the block between `# --- shared icon look` and
   `# --- end shared icon look ---` byte-identical: background, lights,
   supersampling and camera direction make the family coherent.
   `render.sh` refuses a script whose block differs.
3. Build one distinct, simple silhouette in a new accent colour; use
   `dist`/`aim_y` to frame it. Avoid text.
4. Run `render.sh --preview DIR` and look at the 256, 64 and 32 px renders:
   the shape must be recognizable at 32 px on the dark tile.
5. Run `render.sh` and commit the script with its two PNGs.

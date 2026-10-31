#!/usr/bin/env bash
# Render the /tools/ icons with lmcad from the lmscript _lmcode_ scripts here.
#
#   scripts/tools/icons/render.sh            render and write the PNGs into tools/
#   scripts/tools/icons/render.sh --check    render to a temp dir; fail unless the
#                                            committed PNGs are byte-identical
#   scripts/tools/icons/render.sh --preview DIR   also keep the 32 and 16 px renders in DIR
#
# Env: LMCAD (lmcad binary, default `lmcad` on PATH), LMSCRIPT (compiler
# command; default: the published compiler via npx, pinned below).
# Outputs: tools/<tool>/img/logo.png (256x256) and icon.png (64x64); the site
# icon is tools/img/tools.png (256x256) and tools/img/icon.png (64x64).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
LMCAD="${LMCAD:-}"
LMSCRIPT_VERSION="${LMSCRIPT_VERSION:-0.2.420}"
MAX_BYTES=20480
MODE="write"
PREVIEW=""
case "${1:-}" in
  --check) MODE=check ;;
  --preview) PREVIEW="${2:?--preview needs a directory}" ;;
  "") ;;
  *) echo "usage: $0 [--check | --preview DIR]" >&2; exit 2 ;;
esac

lmscript_cmd() {
  if [[ -n "${LMSCRIPT:-}" ]]; then $LMSCRIPT "$@"
  else npx --yes --package="@lmctl-ai/lmctl@${LMSCRIPT_VERSION}" -- lmscript "$@"
  fi
}

# Every script must carry the same shared look block.
shared() { sed -n '/^# --- shared icon look/,/^# --- end shared icon look ---/p' "$1"; }
reference="$(shared "$HERE/tools.lms")"
[[ -n "$reference" ]] || { echo "tools.lms has no shared look block" >&2; exit 1; }
for script in "$HERE"/*.lms; do
  [[ "$(shared "$script")" == "$reference" ]] || { echo "shared look block differs in $(basename "$script")" >&2; exit 1; }
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
if [[ -z $LMCAD ]]; then
  lmscript_cmd "$ROOT/scripts/tools/lmcad-path.lms" "$WORK/lmcad-path.txt"
  LMCAD=$(cat "$WORK/lmcad-path.txt")
fi
[[ -x $LMCAD ]] || { echo "lmcad is not executable: $LMCAD" >&2; exit 1; }
PATH="$(dirname "$LMCAD"):$PATH"
export PATH

status=0
for script in "$HERE"/*.lms; do
  name="$(basename "$script" .lms)"
  out="$WORK/out/$name"
  mkdir -p "$out"
  cp "$script" "$WORK/$name.lms"
  if ! log="$(cd "$WORK" && lmscript_cmd "$name.lms" "out/$name" "$name.dslb" 2>&1)"; then
    echo "$name: compile failed:" >&2; echo "$log" >&2; exit 1
  fi
  if ! log="$(cd "$WORK" && "$LMCAD" --lmcode "$name.dslb" 2>&1)"; then
    echo "$name: lmcad failed: $log" >&2; exit 1
  fi
  if [[ "$name" == tools ]]; then
    dest="$ROOT/tools/img"; logo="tools.png"
  elif [[ "$name" == site ]]; then
    dest="$ROOT/homepage/assets"; logo="logo.png"
  else
    dest="$ROOT/tools/$name/img"; logo="logo.png"
  fi
  for pair in "logo.png:$logo" "icon.png:icon.png"; do
    src="$out/${pair%%:*}"; target="$dest/${pair#*:}"
    size="$(wc -c < "$src")"
    if (( size > MAX_BYTES )); then echo "$name: ${pair#*:} is $size bytes (limit $MAX_BYTES)" >&2; status=1; fi
    if [[ "$MODE" == check ]]; then
      if ! cmp -s "$src" "$target"; then echo "$name: ${target#"$ROOT"/} differs from a fresh render" >&2; status=1; fi
    else
      mkdir -p "$dest"
      cp "$src" "$target"
      chmod 644 "$target"
      echo "wrote ${target#"$ROOT"/} ($size bytes)"
    fi
  done
  if [[ -n "$PREVIEW" ]]; then
    mkdir -p "$PREVIEW"
    for f in logo icon icon-32 icon-16; do cp "$out/$f.png" "$PREVIEW/$name-$f.png"; done
  fi
done
if [[ "$MODE" == check ]]; then
  if (( status == 0 )); then echo "icons: all PNGs match a fresh render"; fi
fi
exit "$status"

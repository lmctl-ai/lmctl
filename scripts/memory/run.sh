#!/usr/bin/env bash
# Durable-memory notes as content-only HTML: check, index and web view.
# Self-contained: copy this folder (and an lmhtml.lock) into any repository.
#
#   scripts/memory/run.sh check DIR            check DIR against the profile
#   scripts/memory/run.sh index DIR [--check]  (re)generate DIR/index.html's note list
#   scripts/memory/run.sh web DIR OUT [--css PATH]
#                                              decorated copy of DIR in OUT for display
#
# The profile and the commands are described in durable-memory/memory-format.html.
# Env: LMHTML (host binary), LMSCRIPT_BIN (compiler), LMHTML_LOCK (pin file).
# Run from the repository root; OUT must lie inside the current directory.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
usage() { echo 'usage: run.sh check DIR | index DIR [--check] | web DIR OUT [--css PATH]' >&2; exit 2; }
mode=${1:-}; (($# >= 2)) || usage; shift
dir=${1%/}; shift
[[ -d $dir ]] || { echo "not a directory: $dir" >&2; exit 2; }
index_check=0 out="" css="/tools/style.css"
case "$mode" in
  check) (($# == 0)) || usage ;;
  index) if (($#)); then [[ $1 == --check && $# == 1 ]] || usage; index_check=1; fi ;;
  web)
    (($# >= 1)) || usage; out=${1%/}; shift
    if (($#)); then [[ $1 == --css && $# == 2 ]] || usage; css=$2; fi
    dir_abs=$(cd "$dir" && pwd -P)
    [[ $out == /* ]] || out="$(pwd -P)/$out"
    out_abs=$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$out")
    case "$out_abs/" in "$dir_abs/"*) echo 'OUT must not be inside DIR (the sources are never written)' >&2; exit 2;; esac
    case "$out_abs/" in "$(pwd -P)/"*) ;; *) echo 'OUT must be inside the current directory' >&2; exit 2;; esac
    mkdir -p "$out_abs"; out="${out_abs#"$(pwd -P)/"}"
    ;;
  *) usage ;;
esac

sha256_file() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi; }
if [[ -n "${LMHTML:-}" ]]; then
  host=$LMHTML
else
  lock=${LMHTML_LOCK:-}
  for candidate in "$HERE/lmhtml.lock" "$HERE/../tools/lmhtml.lock"; do
    [[ -n $lock || ! -f $candidate ]] || lock=$candidate
  done
  [[ -n $lock && -f $lock ]] || { echo 'no lmhtml.lock: copy one next to run.sh or set LMHTML/LMHTML_LOCK' >&2; exit 2; }
  case "$(uname -s)" in Linux) os=linux;; Darwin) os=macos;; MINGW*|MSYS*|CYGWIN*) os=windows;; *) echo 'unsupported OS; set LMHTML' >&2; exit 2;; esac
  case "$(uname -m)" in aarch64|arm64) arch=arm64;; x86_64|amd64) arch=x64;; *) echo 'unsupported architecture; set LMHTML' >&2; exit 2;; esac
  asset="lmhtml-$os-$arch"; [[ $os != windows ]] || asset+=.exe
  version='' expected=''
  while read -r key value _; do
    [[ $key != version ]] || version=$value
    [[ $key != "$asset" ]] || expected=$value
  done < "$lock"
  [[ $version == v* && $expected =~ ^[0-9a-f]{64}$ ]] || { echo "no pinned checksum for $asset in $lock" >&2; exit 2; }
  cache="${XDG_CACHE_HOME:-${HOME:?}/.cache}/lmctl-tools/$version"
  mkdir -p "$cache"
  host="$cache/$asset"
  actual=''; [[ ! -f $host ]] || actual=$(sha256_file "$host")
  if [[ ${actual%% *} != "$expected" ]]; then
    download=$(mktemp "$cache/.download.XXXXXX")
    curl --fail --location --retry 3 --proto '=https' --tlsv1.2 \
      "https://github.com/lmctl-ai/lmhtml/releases/download/$version/$asset" -o "$download"
    actual=$(sha256_file "$download")
    [[ ${actual%% *} == "$expected" ]] || { rm -f "$download"; echo "SHA256 mismatch: $asset" >&2; exit 2; }
    chmod +x "$download"; mv "$download" "$host"
  fi
fi
[[ -x $host ]] || { echo "lmhtml is not executable: $host" >&2; exit 2; }
compiler=${LMSCRIPT_BIN:-$(command -v lmscript || true)}
[[ -n $compiler ]] || { echo 'Install the published compiler: npm i -g @lmctl-ai/lmctl' >&2; exit 2; }
version_text=$("$compiler" --version); version=${version_text##* }
IFS=. read -r major minor patch <<< "$version"
[[ $major =~ ^[0-9]+$ && $minor =~ ^[0-9]+$ && $patch =~ ^[0-9]+$ ]] || { echo "unrecognized compiler version: $version_text" >&2; exit 2; }
((major > 0 || minor > 2 || (minor == 2 && patch >= 347))) || { echo 'lmscript >= 0.2.347 required' >&2; exit 2; }

work=$(mktemp -d "${TMPDIR:-/tmp}/lmctl-memory.XXXXXX")
trap 'rm -rf "$work"' EXIT
"$host" --schema --json > "$work/lmhtml.dsl.json"
cp "$HERE/$mode.lms" "$work/$mode.lms"
case "$mode" in
  check) args=("$dir") ;;
  index) args=("$dir" "$index_check") ;;
  web)
    args=("$dir" "$out" "$css")
    # Non-HTML files (images) are copied as they are; the DSL writes the HTML.
    (cd "$dir" && find . -type f ! -name '*.html' ! -name '.*' \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.gif' -o -name '*.svg' -o -name '*.webp' \) -print) |
      while IFS= read -r asset_path; do mkdir -p "$out/$(dirname "$asset_path")"; cp -p "$dir/$asset_path" "$out/$asset_path"; done
    ;;
esac
# The compiler runs the lmscript part (file listing, emoji scan) and writes the bytecode.
"$compiler" "$work/$mode.lms" "$work/program.dslb" "$work/report.txt" "${args[@]}"
status=0
"$host" --dsl "$work/program.dslb" > "$work/result.json" || status=$?
[[ ! -f $work/report.txt ]] || cat "$work/report.txt"
if ((status)); then cat "$work/result.json" >&2; else echo "$mode: OK"; fi
exit "$status"

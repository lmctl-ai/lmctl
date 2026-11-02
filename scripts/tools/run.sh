#!/usr/bin/env bash
# Run each tools script (run_lmcode inside it) with the lmhtml host first on PATH.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"
command_name=${1:-check}
if (($#)); then shift; fi
case "$command_name" in check|contract|decorate|links|skills|host-path|homepage-videos) ;; *) echo 'usage: run.sh check [file] | decorate [--check] | links [site-root] | homepage-videos' >&2; exit 2;; esac
compiler=${LMSCRIPT_BIN:-$(command -v lmscript || true)}
[[ -n $compiler ]] || { echo 'Install @lmctl-ai/lmctl@staging (lmscript 0.2.454 or newer) and put lmscript on PATH.' >&2; exit 2; }
compiler="$(cd "$(dirname "$compiler")" && pwd)/$(basename "$compiler")"
version_text=$("$compiler" --version)
version=${version_text##* }
IFS=. read -r major minor patch <<< "$version"
[[ $major =~ ^[0-9]+$ && $minor =~ ^[0-9]+$ && $patch =~ ^[0-9]+$ ]] || { echo "unrecognized compiler version: $version_text" >&2; exit 2; }
((major > 0 || minor > 2 || (minor == 2 && patch >= 454))) || { echo 'lmscript >= 0.2.454 required for run_lmcode.' >&2; exit 2; }
# The release named in lmhtml.lock, downloaded once into a cache and checked
# against the sha256 pinned there (never an unverified binary).
pinned_lmhtml() {
  local lock="$HERE/lmhtml.lock" version os arch asset want cache url got
  version=$(sed -n 's/^version=//p' "$lock")
  case "$(uname -s)" in Linux) os=linux;; Darwin) os=macos;; MINGW*|MSYS*|CYGWIN*) os=windows;; *) echo "no lmhtml release for $(uname -s)" >&2; return 2;; esac
  case "$(uname -m)" in x86_64|amd64) arch=x64;; aarch64|arm64) arch=arm64;; *) echo "no lmhtml release for $(uname -m)" >&2; return 2;; esac
  asset="lmhtml-$os-$arch"; [[ $os != windows ]] || asset="$asset.exe"
  want=$(sed -n "s/^sha256\.$asset=//p" "$lock")
  [[ -n $want ]] || { echo "lmhtml.lock pins no $asset" >&2; return 2; }
  cache="${XDG_CACHE_HOME:-$HOME/.cache}/lmctl-site/lmhtml/$version"
  if [[ ! -x $cache/$asset ]] || [[ $(sha256 "$cache/$asset") != "$want" ]]; then
    mkdir -p "$cache"
    url="https://github.com/lmctl-ai/lmhtml/releases/download/$version/$asset"
    curl -fsSL --retry 3 -o "$cache/$asset.part" "$url" || { echo "download failed: $url" >&2; return 2; }
    got=$(sha256 "$cache/$asset.part")
    [[ $got == "$want" ]] || { rm -f "$cache/$asset.part"; echo "$asset sha256 $got does not match lmhtml.lock" >&2; return 2; }
    chmod +x "$cache/$asset.part"; mv "$cache/$asset.part" "$cache/$asset"
  fi
  printf '%s\n' "$cache/$asset"
}
sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -c1-64; }
work=$(mktemp -d "${TMPDIR:-/tmp}/lmctl-tools.XXXXXX")
trap 'rm -rf "$work"' EXIT
if [[ -n "${LMHTML:-}" ]]; then
  host=$LMHTML
  PATH="$(dirname "$host"):$PATH"
  export PATH
elif command -v lmhtml >/dev/null 2>&1; then
  host=$(command -v lmhtml)
else
  host=$(pinned_lmhtml)
fi
[[ -x $host ]] || { echo "lmhtml is not executable: $host" >&2; exit 2; }
host="$(cd "$(dirname "$host")" && pwd)/$(basename "$host")"
PATH="$(dirname "$host"):$PATH"
export PATH
if [[ $command_name == host-path ]]; then printf '%s\n' "$host"; exit 0; fi
# Each host invocation has a bounded Doc arena. Process tool pages separately,
# then derive the shared catalog; no tool loses any contract or lint checks.
if [[ -z ${TOOLS_SCOPE:-} && ( $command_name == decorate || $command_name == check ) && ( $# == 0 || ${1:-} == --check || -d ${1:-} ) ]]; then
  if [[ $command_name == check ]]; then python3 "$HERE/check-book-media.py"; fi
  shopt -s nullglob globstar
  batch_status=0
  if [[ $command_name == decorate ]]; then
    # Preserve the source-safety gate: no page is rewritten until every tool's
    # authored markup has passed, with a separate bounded arena for each tool.
    for directory in tools/*/; do
      task_scope=${directory%/}; task_scope=${task_scope##*/}
      [[ $task_scope != img ]] || continue
      if ! TOOLS_SCOPE=$task_scope TOOLS_MARKUP_ONLY=1 LMHTML=$host "$HERE/run.sh" decorate "$@"; then batch_status=1; fi
    done
    ((batch_status == 0)) || exit 1
  fi
  for directory in tools/*/; do
    task_scope=${directory%/}; task_scope=${task_scope##*/}
    [[ $task_scope != img ]] || continue
    if ! TOOLS_SCOPE=$task_scope LMHTML=$host "$HERE/run.sh" "$command_name" "$@"; then batch_status=1; fi
  done
  if ! TOOLS_SCOPE=catalog LMHTML=$host "$HERE/run.sh" "$command_name" "$@"; then batch_status=1; fi
  ((batch_status == 0)) || exit 1
  if [[ $command_name == check ]]; then
    "$host" lint --config "$HERE/plain.conf" tools
    for page in tools/**/*.html; do
      if ! "$host" clean --check "$page" > /dev/null 2>"$work/clean.txt"; then cat "$work/clean.txt" >&2; exit 1; fi
    done
  fi
  echo "$command_name: OK (per-tool batches)"
  exit 0
fi
if [[ $command_name == check && ( $# == 0 || -d ${1:-} ) ]]; then
  if [[ -z ${TOOLS_SCOPE:-} ]]; then python3 "$HERE/check-book-media.py"; fi
  if ! "$HERE/run.sh" decorate --check; then
    "$host" lint --stats --config "$HERE/plain.conf" tools || true
    exit 1
  fi
fi
if [[ $command_name == contract && -z ${TOOLS_SCOPE:-} ]]; then python3 "$HERE/check-book-media.py"; fi
script_name=$command_name
[[ $command_name != check && $command_name != contract ]] || script_name=check
cp "$HERE/$script_name.lms" "$work/$script_name.lms"
cp "$HERE/roles.lms" "$work/roles.lms"
cp "$HERE/lmctl-subcommands.lms" "$work/lmctl-subcommands.lms"
argument=${1:-}
if [[ $command_name == check && -n $argument && -d $argument ]]; then
  # check.lms accepts one HTML fixture or an empty argument for the full tools tree.
  # A tool directory is therefore an alias for the full catalog check.
  argument=""
fi
if [[ $command_name == decorate ]]; then
  [[ -z $argument || $argument == --check ]] || { echo 'decorate accepts only --check' >&2; exit 2; }
fi
if [[ $command_name == links ]]; then
  # Keep the host's document paths relative to its site root, even when the
  # caller supplies an absolute build directory.
  cd "${argument:-.}"
  argument=.
fi
(($# <= 1)) || { echo 'too many arguments' >&2; exit 2; }
# The script runs its program with run_lmcode on the host first on PATH; a host
# failure comes back as data and the script's require() reports the envelope.
status=0
"$compiler" "$work/$script_name.lms" "$work/report.txt" "$argument" "${TOOLS_SCOPE:-}" "${TOOLS_MARKUP_ONLY:-}" > "$work/result.json" || status=$?
[[ ! -f $work/report.txt ]] || cat "$work/report.txt"
if ((status)); then cat "$work/result.json" >&2; fi
case "$command_name" in
    check|contract) if [[ -z ${TOOLS_SCOPE:-} ]]; then "$host" lint --config "$HERE/plain.conf" "${argument:-tools}" || status=$?; fi ;;
    skills) if [[ $argument == --check || -z $argument ]]; then "$host" lint --config "$HERE/plain.conf" skills || status=$?; else "$host" lint --config "$HERE/plain.conf" "$argument" || status=$?; fi ;;
esac
if ((status == 0)) && [[ -z ${TOOLS_SCOPE:-} ]]; then
  shopt -s globstar nullglob
  pages=()
  case "$command_name" in
    check|contract) if [[ -n $argument ]]; then pages=("$argument"); else pages=(tools/**/*.html); fi ;;
    skills) if [[ -n $argument && $argument != --check ]]; then pages=("$argument"); else pages=(skills/*.html); fi ;;
  esac
  for page in "${pages[@]}"; do "$host" clean --check "$page" >/dev/null 2>"$work/clean.txt" || { cat "$work/clean.txt" >&2; status=1; }; done
fi
if ((status == 0)); then echo "$command_name: OK"; fi
exit "$status"

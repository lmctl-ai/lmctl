#!/usr/bin/env bash
# Compile published lmscript DSL against the schema of the exact host being run.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"
command_name=${1:-check}
if (($#)); then shift; fi
case "$command_name" in check|sync-nav|links|host-path) ;; *) echo 'usage: run.sh check [file] | sync-nav [--dry-run] | links [site-root]' >&2; exit 2;; esac
sha256_file() {
  if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi
}
if [[ -n "${LMHTML:-}" ]]; then
  host=$LMHTML
else
  case "$(uname -s)" in Linux) os=linux;; Darwin) os=macos;; MINGW*|MSYS*|CYGWIN*) os=windows;; *) echo 'unsupported OS; set LMHTML' >&2; exit 2;; esac
  case "$(uname -m)" in aarch64|arm64) arch=arm64;; x86_64|amd64) arch=x64;; *) echo 'unsupported architecture; set LMHTML' >&2; exit 2;; esac
  asset="lmhtml-$os-$arch"
  [[ $os != windows ]] || asset+=.exe
  version= expected=
  while read -r key value extra; do
    [[ $key != version ]] || version=$value
    [[ $key != "$asset" ]] || expected=$value
  done < "$HERE/lmhtml.lock"
  [[ $version == v* && $expected =~ ^[0-9a-f]{64}$ ]] || { echo "no pinned checksum for $asset" >&2; exit 2; }
  cache="${XDG_CACHE_HOME:-${HOME:?}/.cache}/lmctl-tools/$version"
  mkdir -p "$cache"
  host="$cache/$asset"
  actual=
  [[ ! -f $host ]] || actual=$(sha256_file "$host")
  if [[ ${actual%% *} != "$expected" ]]; then
    download=$(mktemp "$cache/.download.XXXXXX")
    trap 'rm -f "$download"' EXIT
    curl --fail --location --retry 3 --proto '=https' --tlsv1.2 \
      "https://github.com/lmctl-ai/lmhtml/releases/download/$version/$asset" -o "$download"
    actual=$(sha256_file "$download")
    [[ ${actual%% *} == "$expected" ]] || { echo "SHA256 mismatch: $asset" >&2; exit 2; }
    chmod +x "$download"
    mv "$download" "$host"
    trap - EXIT
  fi
fi
[[ -x $host ]] || { echo "lmhtml is not executable: $host" >&2; exit 2; }
host="$(cd "$(dirname "$host")" && pwd)/$(basename "$host")"
if [[ $command_name == host-path ]]; then printf '%s\n' "$host"; exit 0; fi
compiler=${LMSCRIPT_BIN:-$(command -v lmscript || true)}
[[ -n $compiler ]] || { echo 'Install the published compiler: npm i -g @lmctl-ai/lmctl@0.2.347' >&2; exit 2; }
compiler="$(cd "$(dirname "$compiler")" && pwd)/$(basename "$compiler")"
version_text=$("$compiler" --version)
version=${version_text##* }
IFS=. read -r major minor patch <<< "$version"
[[ $major =~ ^[0-9]+$ && $minor =~ ^[0-9]+$ && $patch =~ ^[0-9]+$ ]] || { echo "unrecognized compiler version: $version_text" >&2; exit 2; }
((major > 0 || minor > 2 || (minor == 2 && patch >= 347))) || { echo 'lmscript >= 0.2.347 required' >&2; exit 2; }
work=$(mktemp -d "${TMPDIR:-/tmp}/lmctl-tools.XXXXXX")
trap 'rm -rf "$work"' EXIT
"$host" --schema --json > "$work/lmhtml.dsl.json"
cp "$HERE/$command_name.lms" "$work/$command_name.lms"
host_args=()
argument=${1:-}
if [[ $command_name == sync-nav ]]; then
  [[ -z $argument || $argument == --dry-run ]] || { echo 'sync-nav accepts only --dry-run' >&2; exit 2; }
  [[ -z $argument ]] || host_args+=(--dry-run)
  argument=
fi
if [[ $command_name == links ]]; then
  # Keep the host's document paths relative to its site root, even when the
  # caller supplies an absolute build directory.
  cd "${argument:-.}"
  argument=.
fi
(($# <= 1)) || { echo 'too many arguments' >&2; exit 2; }
"$compiler" "$work/$command_name.lms" "$work/program.dslb" "$work/report.txt" "$argument"
status=0
"$host" ${host_args:+"${host_args[@]}"} --dsl "$work/program.dslb" > "$work/result.json" || status=$?
[[ ! -f $work/report.txt ]] || cat "$work/report.txt"
if ((status)); then cat "$work/result.json" >&2; else echo "$command_name: OK"; fi
exit "$status"

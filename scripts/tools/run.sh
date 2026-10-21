#!/usr/bin/env bash
# Compile and run against the exact published host used by each cli=install block.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"
command_name=${1:-check}
if (($#)); then shift; fi
case "$command_name" in check|contract|decorate|links|skills|host-path|homepage-videos) ;; *) echo 'usage: run.sh check [file] | decorate [--check] | links [site-root] | homepage-videos' >&2; exit 2;; esac
compiler=${LMSCRIPT_BIN:-$(command -v lmscript || true)}
[[ -n $compiler ]] || { echo 'Install @lmctl-ai/lmctl@0.2.369 or newer and put lmscript on PATH.' >&2; exit 2; }
compiler="$(cd "$(dirname "$compiler")" && pwd)/$(basename "$compiler")"
version_text=$("$compiler" --version)
version=${version_text##* }
IFS=. read -r major minor patch <<< "$version"
[[ $major =~ ^[0-9]+$ && $minor =~ ^[0-9]+$ && $patch =~ ^[0-9]+$ ]] || { echo "unrecognized compiler version: $version_text" >&2; exit 2; }
((major > 0 || minor > 2 || (minor == 2 && patch >= 369))) || { echo 'lmscript >= 0.2.369 required for cli=install.' >&2; exit 2; }
work=$(mktemp -d "${TMPDIR:-/tmp}/lmctl-tools.XXXXXX")
trap 'rm -rf "$work"' EXIT
if [[ -n "${LMHTML:-}" ]]; then
  host=$LMHTML
  PATH="$(dirname "$host"):$PATH"
  export PATH
elif command -v lmhtml >/dev/null 2>&1; then
  host=$(command -v lmhtml)
else
  "$compiler" "$HERE/lmhtml-path.lms" "$work/host-path.txt"
  host=$(cat "$work/host-path.txt")
fi
[[ -x $host ]] || { echo "lmhtml is not executable: $host" >&2; exit 2; }
host="$(cd "$(dirname "$host")" && pwd)/$(basename "$host")"
PATH="$(dirname "$host"):$PATH"
export PATH
if [[ $command_name == host-path ]]; then printf '%s\n' "$host"; exit 0; fi
if [[ $command_name == check && $# == 0 ]]; then
  if ! "$HERE/run.sh" decorate --check; then
    "$host" lint --stats --config "$HERE/plain.conf" tools || true
    exit 1
  fi
fi
script_name=$command_name
[[ $command_name != check && $command_name != contract ]] || script_name=check
cp "$HERE/$script_name.lms" "$work/$script_name.lms"
cp "$HERE/roles.lms" "$work/roles.lms"
cp "$HERE/lmctl-subcommands.lms" "$work/lmctl-subcommands.lms"
host_args=()
argument=${1:-}
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
"$compiler" "$work/$script_name.lms" "$work/program.dslb" "$work/report.txt" "$argument"
status=0
"$host" ${host_args:+"${host_args[@]}"} --dsl "$work/program.dslb" > "$work/result.json" || status=$?
[[ ! -f $work/report.txt ]] || cat "$work/report.txt"
if ((status)); then cat "$work/result.json" >&2; fi
case "$command_name" in
    check|contract) "$host" lint --config "$HERE/plain.conf" "${argument:-tools}" || status=$? ;;
    skills) if [[ $argument == --check || -z $argument ]]; then "$host" lint --config "$HERE/plain.conf" skills || status=$?; else "$host" lint --config "$HERE/plain.conf" "$argument" || status=$?; fi ;;
esac
if ((status == 0)); then
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

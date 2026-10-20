#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPT_DIR="$ROOT/scripts/homepage/video"
PUBLISHED_DIR="$ROOT/homepage/assets/videos"
ENGINE=lmcad
MODE=render
ONLY_LEVEL=
PUBLISH=0
AUDIO_DIR=
FRAME_COUNT=240
FRAME_RATE=24
LMCAD_WIDTH=480
LMCAD_HEIGHT=270
BLENDER_WIDTH=960
BLENDER_HEIGHT=540
BLENDER_SAMPLES=16
while (($#)); do
  case "$1" in
    --engine) shift; (($#)) || { echo '--engine requires lmcad or lmblender' >&2; exit 2; }; ENGINE=$1; [[ $ENGINE == lmcad || $ENGINE == lmblender ]] || { echo '--engine requires lmcad or lmblender' >&2; exit 2; } ;;
    --check) MODE=check ;;
    --only) shift; (($#)) || { echo '--only requires a level number 1-4' >&2; exit 2; }; [[ $1 =~ ^[1-4]$ ]] || { echo '--only requires a level number 1-4' >&2; exit 2; }; ONLY_LEVEL=$1 ;;
    --publish) PUBLISH=1 ;;
    --audio) shift; (($#)) || { echo '--audio requires a directory' >&2; exit 2; }; AUDIO_DIR=$1 ;;
    *) echo 'usage: render.sh [--engine lmcad|lmblender] [--check] [--only 1-4] [--publish] [--audio DIR]' >&2; exit 2 ;;
  esac
  shift
done
LMCAD_BIN="${LMCAD_BIN:-$(command -v lmcad || true)}"
LMBLENDER_BIN="${LMBLENDER_BIN:-$(command -v lmblender || true)}"
LMSCRIPT_BIN="${LMSCRIPT_BIN:-$(command -v lmscript || true)}"
[[ -x $LMSCRIPT_BIN ]] || { echo 'Install lmscript >= 0.2.347 and put it on PATH.' >&2; exit 2; }
command -v ffmpeg >/dev/null || { echo 'ffmpeg is required to encode homepage video.' >&2; exit 2; }
command -v ffprobe >/dev/null || { echo 'ffprobe is required to verify encoded homepage video.' >&2; exit 2; }
sha256_file() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi; }
file_size() { if stat -c '%s' "$1" >/dev/null 2>&1; then stat -c '%s' "$1"; else stat -f '%z' "$1"; fi; }
if [[ $ENGINE == lmcad ]]; then
  [[ -x $LMCAD_BIN ]] || { echo 'Set LMCAD_BIN to the lmcad v0.1.1 release binary.' >&2; exit 2; }
  case "$(uname -s):$(uname -m)" in
    Linux:aarch64|Linux:arm64) asset=linux-arm64 ;;
    Linux:x86_64|Linux:amd64) asset=linux-x64 ;;
    Darwin:arm64|Darwin:aarch64) asset=macos-arm64 ;;
    Darwin:x86_64) asset=macos-x64 ;;
    *) echo 'No v0.1.1 binary checksum is recorded for this platform.' >&2; exit 2 ;;
  esac
  expected=$(awk -v key="$asset" '$1 == key { print $2 }' "$SCRIPT_DIR/lmcad-v0.1.1.sha256")
  actual=$(sha256_file "$LMCAD_BIN"); actual=${actual%% *}
  [[ -n $expected && $actual == "$expected" ]] || { echo "LMCAD_BIN must match the v0.1.1 $asset release checksum." >&2; exit 2; }
  OUTPUT_DIR=$PUBLISHED_DIR
  SOURCE_DIR=$SCRIPT_DIR
  HASH_FILE=$SCRIPT_DIR/frames.sha256
  WIDTH=$LMCAD_WIDTH; HEIGHT=$LMCAD_HEIGHT
else
  [[ -x $LMBLENDER_BIN ]] || { echo "Install local lmblender v0.2.1 or set LMBLENDER_BIN (not available in CI)." >&2; exit 2; }
  OUTPUT_DIR="${LMBLENDER_OUTPUT_DIR:-$ROOT/build/homepage-video/lmblender}"
  [[ $PUBLISH == 0 ]] || OUTPUT_DIR=$PUBLISHED_DIR
  SOURCE_DIR=$SCRIPT_DIR/lmblender
  HASH_FILE=$SCRIPT_DIR/lmblender/frames.sha256
  WIDTH=$BLENDER_WIDTH; HEIGHT=$BLENDER_HEIGHT
  mkdir -p "$SCRIPT_DIR/lmblender"
fi
mkdir -p "$OUTPUT_DIR"
work=$(mktemp -d "${TMPDIR:-/tmp}/lmctl-homepage-video.XXXXXX")
trap 'rm -rf -- "$work"' EXIT
manifest_expected=
if [[ $ENGINE == lmblender ]]; then
  version_output=$("$LMBLENDER_BIN" --version | tr '\n' ';' | sed 's/;$//')
  binary_hash=$(sha256_file "$LMBLENDER_BIN"); binary_hash=${binary_hash%% *}
  manifest_expected="$work/manifest.json"
  printf '{\n  "engine": "lmblender",\n  "version": "%s",\n  "binary_sha256": "%s",\n  "samples": %s,\n  "resolution": "%sx%s",\n  "frames": %s,\n  "fps": %s\n}\n' "$version_output" "$binary_hash" "$BLENDER_SAMPLES" "$WIDTH" "$HEIGHT" "$FRAME_COUNT" "$FRAME_RATE" > "$manifest_expected"
  if [[ $MODE == check ]]; then
    cmp "$manifest_expected" "$SCRIPT_DIR/lmblender/manifest.json"
  fi
fi
if [[ $ENGINE == lmcad ]]; then
  "$LMCAD_BIN" --schema --json > "$work/active-schema.json"
else
  "$LMBLENDER_BIN" --schema > "$work/active-schema.json"
  "$LMSCRIPT_BIN" --dsl-signatures "$SOURCE_DIR/schema/lmblender.dsl.json" > "$work/compiler-signatures.txt"
  "$LMBLENDER_BIN" --dsl-signatures > "$work/host-signatures.txt"
  diff -u "$work/compiler-signatures.txt" "$work/host-signatures.txt"
fi
actual_hashes="$work/frames.sha256"
: > "$actual_hashes"
for n in 1 2 3 4; do
  [[ -z $ONLY_LEVEL || $ONLY_LEVEL == "$n" ]] || continue
  name="level-$n"
  mkdir -p "$work/frames/$name"
  if [[ $ENGINE == lmcad ]]; then
    cp "$SOURCE_DIR/$name.lms" "$work/$name.lms"
    (cd "$work" && "$LMSCRIPT_BIN" "$name.lms" "$name.dslb")
    (cd "$work" && "$LMCAD_BIN" --dsl "$name.dslb")
  else
    (cd "$work" && "$LMSCRIPT_BIN" "$SOURCE_DIR/$name.lms" "$name.dslb")
    (cd "$work" && "$LMBLENDER_BIN" --dsl "$name.dslb")
  fi
  rendered_count=$(find "$work/frames/$name" -maxdepth 1 -type f -name 'frame-*.png' | wc -l | tr -d ' ')
  [[ $rendered_count == "$FRAME_COUNT" ]] || { echo "$name rendered $rendered_count frames; expected $FRAME_COUNT" >&2; exit 1; }
  if command -v sha256sum >/dev/null; then
    (cd "$work/frames" && sha256sum "$name"/frame-*.png) >> "$actual_hashes"
  else
    (cd "$work/frames" && shasum -a 256 "$name"/frame-*.png) >> "$actual_hashes"
  fi
  poster_frame=216
  case "$name" in level-1) poster_frame=190 ;; level-2) poster_frame=120 ;; level-3) poster_frame=220 ;; level-4) poster_frame=220 ;; esac
  poster="$OUTPUT_DIR/$name-poster.png"
  mp4="$OUTPUT_DIR/$name.mp4"
  webm="$OUTPUT_DIR/$name.webm"
  if [[ $MODE == render ]]; then
    cp "$work/frames/$name/frame-$poster_frame.png" "$poster"
    track=
    [[ -z $AUDIO_DIR || ! -f $AUDIO_DIR/$name.wav ]] || track="$AUDIO_DIR/$name.wav"
    if [[ -n $track ]]; then
      ffmpeg -hide_banner -loglevel error -y -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" -i "$track" -shortest -c:v libx264 -preset slow -crf 29 -pix_fmt yuv420p -r "$FRAME_RATE" -g 48 -keyint_min 48 -sc_threshold 0 -threads 1 -c:a aac -b:a 96k -movflags +faststart "$mp4"
      ffmpeg -hide_banner -loglevel error -y -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" -i "$track" -shortest -c:v libvpx-vp9 -deadline good -cpu-used 4 -crf 34 -b:v 0 -pix_fmt yuv420p -r "$FRAME_RATE" -g 48 -row-mt 0 -threads 1 -c:a libopus -b:a 64k "$webm"
    else
      ffmpeg -hide_banner -loglevel error -y -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" -an -c:v libx264 -preset slow -crf 29 -pix_fmt yuv420p -r "$FRAME_RATE" -g 48 -keyint_min 48 -sc_threshold 0 -threads 1 -movflags +faststart "$mp4"
      ffmpeg -hide_banner -loglevel error -y -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" -an -c:v libvpx-vp9 -deadline good -cpu-used 4 -crf 34 -b:v 0 -pix_fmt yuv420p -r "$FRAME_RATE" -g 48 -row-mt 0 -threads 1 "$webm"
    fi
  else
    cmp "$work/frames/$name/frame-$poster_frame.png" "$poster"
    (( $(file_size "$poster") <= 60000 )) || { echo "poster exceeds 60 KB: $poster" >&2; exit 1; }
  fi
  for video in "$mp4" "$webm"; do
    [[ -f $video ]] || { echo "missing encoded video: $video" >&2; exit 1; }
    bytes=$(file_size "$video")
    ((bytes <= 1572864)) || { echo "video exceeds 1.5 MiB: $video ($bytes bytes)" >&2; exit 1; }
  done
  mp4_info=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -show_entries format=duration -of default=noprint_wrappers=1 "$mp4")
  webm_info=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -show_entries format=duration -of default=noprint_wrappers=1 "$webm")
  for check in "codec_name=h264" "width=$WIDTH" "height=$HEIGHT" "duration=10.000000"; do [[ $mp4_info == *"$check"* ]] || { echo "MP4 check failed ($check): $mp4" >&2; exit 1; }; done
  for check in "codec_name=vp9" "width=$WIDTH" "height=$HEIGHT" "duration=10.000000"; do [[ $webm_info == *"$check"* ]] || { echo "WebM check failed ($check): $webm" >&2; exit 1; }; done
  echo "$name ($ENGINE): $FRAME_COUNT frames at ${WIDTH}x${HEIGHT}, $FRAME_RATE fps"
done
if [[ $MODE == check ]]; then
  expected_hashes="$HASH_FILE"
  if [[ -n $ONLY_LEVEL ]]; then
    expected_hashes="$work/expected.sha256"
    grep "level-$ONLY_LEVEL/" "$HASH_FILE" > "$expected_hashes"
  fi
  diff -u "$expected_hashes" "$actual_hashes"
  echo 'frame hashes: match (local renderer check; encoder output hashes are intentionally not used)'
else
  if [[ -z $ONLY_LEVEL ]]; then cp "$actual_hashes" "$HASH_FILE";
  else
    combined_hashes="$work/combined.sha256"
    : > "$combined_hashes"
    for n in 1 2 3 4; do
      source_hashes="$HASH_FILE"
      [[ $ONLY_LEVEL != "$n" ]] || source_hashes=$actual_hashes
      grep "level-$n/" "$source_hashes" >> "$combined_hashes"
    done
    cp "$combined_hashes" "$HASH_FILE"
  fi
  if [[ $ENGINE == lmblender ]]; then
    cp "$manifest_expected" "$SCRIPT_DIR/lmblender/manifest.json"
  fi
  echo "frame hashes: updated at $HASH_FILE"
fi

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPT_DIR="$ROOT/scripts/homepage/video"
PUBLISHED_DIR="$ROOT/homepage/assets/videos"
ENGINE=lmblender MODE=render ONLY_LEVEL= PUBLISH=0 AUDIO_DIR=
FRAME_COUNT=240 FRAME_RATE=24
LMCAD_WIDTH=480 LMCAD_HEIGHT=270 BLENDER_WIDTH=1280 BLENDER_HEIGHT=720 BLENDER_SAMPLES=64
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
LMBLENDER_BIN="${LMBLENDER_BIN:-$(command -v lmblender || echo /home/ubuntu/lmblender-release/current/bin/lmblender)}"
LMDRAW_BIN="${LMDRAW_BIN:-$(command -v lmdraw || echo /home/ubuntu/lmdraw-release/current/bin/lmdraw)}"
LMSCRIPT_BIN="${LMSCRIPT_BIN:-$(command -v lmscript || true)}"
[[ -x $LMSCRIPT_BIN ]] || { echo 'Install lmscript >= 0.2.347 and put it on PATH.' >&2; exit 2; }
for tool in ffmpeg ffprobe; do command -v "$tool" >/dev/null || { echo "$tool is required." >&2; exit 2; }; done
sha256_file() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi; }
file_size() { if stat -c '%s' "$1" >/dev/null 2>&1; then stat -c '%s' "$1"; else stat -f '%z' "$1"; fi; }
if [[ $ENGINE == lmcad ]]; then
  [[ -x $LMCAD_BIN ]] || { echo 'Set LMCAD_BIN to the lmcad v0.1.1 release binary.' >&2; exit 2; }
  case "$(uname -s):$(uname -m)" in Linux:aarch64|Linux:arm64) asset=linux-arm64 ;; Linux:x86_64|Linux:amd64) asset=linux-x64 ;; Darwin:arm64|Darwin:aarch64) asset=macos-arm64 ;; Darwin:x86_64) asset=macos-x64 ;; *) echo 'No v0.1.1 binary checksum is recorded for this platform.' >&2; exit 2 ;; esac
  expected=$(awk -v key="$asset" '$1 == key { print $2 }' "$SCRIPT_DIR/lmcad-v0.1.1.sha256")
  actual=$(sha256_file "$LMCAD_BIN"); actual=${actual%% *}
  [[ -n $expected && $actual == "$expected" ]] || { echo "LMCAD_BIN must match the v0.1.1 $asset release checksum." >&2; exit 2; }
  OUTPUT_DIR=$PUBLISHED_DIR; SOURCE_DIR=$SCRIPT_DIR; HASH_FILE=$SCRIPT_DIR/frames.sha256; WIDTH=$LMCAD_WIDTH; HEIGHT=$LMCAD_HEIGHT
else
  [[ -x $LMBLENDER_BIN ]] || { echo 'Install lmblender 0.3.1 and set LMBLENDER_BIN.' >&2; exit 2; }
  [[ -x $LMDRAW_BIN ]] || { echo 'Install lmdraw 0.1.0 and set LMDRAW_BIN.' >&2; exit 2; }
  OUTPUT_DIR="${LMBLENDER_OUTPUT_DIR:-$ROOT/build/homepage-video/lmblender}"; [[ $PUBLISH == 0 ]] || OUTPUT_DIR=$PUBLISHED_DIR
  SOURCE_DIR=$SCRIPT_DIR/lmblender; HASH_FILE=$SCRIPT_DIR/lmblender/frames.sha256; WIDTH=$BLENDER_WIDTH; HEIGHT=$BLENDER_HEIGHT
fi
mkdir -p "$OUTPUT_DIR"
work=$(mktemp -d "${TMPDIR:-/tmp}/lmctl-homepage-video.XXXXXX")
trap 'rm -rf -- "$work"' EXIT
if [[ $ENGINE == lmblender ]]; then
  # The cache key excludes overlays, so title/layout edits do not rerender Cycles.
  cache_root="${LMBLENDER_FRAME_CACHE:-$ROOT/build/homepage-video/lmblender-cycles}"
  mkdir -p "$cache_root"
  blender_version=$("$LMBLENDER_BIN" --version | tr '\n' ';' | sed 's/;$//')
  blender_hash=$(sha256_file "$LMBLENDER_BIN"); blender_hash=${blender_hash%% *}
  draw_version=0.1.0
  draw_hash=$(sha256_file "$LMDRAW_BIN"); draw_hash=${draw_hash%% *}
  compiler_version=$("$LMSCRIPT_BIN" --version 2>&1 | head -1)
  printf '{\n  "lmblender": "%s",\n  "lmblender_binary_sha256": "%s",\n  "preset": "diagram-dark-16x9-final",\n  "samples": %s,\n  "resolution": "%sx%s",\n  "frames": %s,\n  "fps": %s,\n  "background": "lmdraw navy gradient",\n  "lmdraw": "%s",\n  "lmdraw_binary_sha256": "%s",\n  "lmscript": "%s"\n}\n' "$blender_version" "$blender_hash" "$BLENDER_SAMPLES" "$WIDTH" "$HEIGHT" "$FRAME_COUNT" "$FRAME_RATE" "$draw_version" "$draw_hash" "$compiler_version" > "$work/manifest.json"
  if [[ $MODE == check ]]; then cmp "$work/manifest.json" "$SCRIPT_DIR/lmblender/manifest.json"; fi
  "$LMDRAW_BIN" --schema --json > "$work/lmdraw-schema.json"
  cmp "$work/lmdraw-schema.json" "$SCRIPT_DIR/overlay/schema/lmdraw.dsl.json"
  "$LMSCRIPT_BIN" --dsl-signatures "$SCRIPT_DIR/overlay/schema/lmdraw.dsl.json" > "$work/compiler-signatures"
  "$LMDRAW_BIN" --dsl-signatures > "$work/host-signatures"
  diff -u "$work/compiler-signatures" "$work/host-signatures"
  mkdir -p "$work/backdrop/build/rendered"
  (cd "$work/backdrop" && "$LMSCRIPT_BIN" "$SCRIPT_DIR/overlay/background.lms" background.dslb)
  (cd "$work/backdrop" && nice -n 10 "$LMDRAW_BIN" --dsl background.dslb)
  backdrop="$work/backdrop/build/rendered/backdrop.png"
  [[ -s $backdrop ]] || { echo 'lmdraw did not render the navy background.' >&2; exit 1; }
fi
actual_hashes="$work/frames.sha256"; : > "$actual_hashes"
for n in 1 2 3 4; do
  [[ -z $ONLY_LEVEL || $ONLY_LEVEL == "$n" ]] || continue
  name="level-$n"; mkdir -p "$work/frames/$name"
  if [[ $ENGINE == lmcad ]]; then
    cp "$SOURCE_DIR/$name.lms" "$work/$name.lms"
    (cd "$work" && "$LMSCRIPT_BIN" "$name.lms" "$name.dslb")
    (cd "$work" && "$LMCAD_BIN" --dsl "$name.dslb")
  else
    cycle_dir="$cache_root/$name"; key_file="$cycle_dir/cache-key.txt"
    key_material=$(cat "$SOURCE_DIR/$name.lms" "$SOURCE_DIR/schema/lmblender.dsl.json"; printf '%s|%s|%s|%s|%s|%s' "$blender_hash" "$FRAME_COUNT" "$FRAME_RATE" "$WIDTH" "$HEIGHT" "$BLENDER_SAMPLES")
    cache_key=$(printf '%s' "$key_material" | if command -v sha256sum >/dev/null; then sha256sum | cut -d' ' -f1; else shasum -a 256 | cut -d' ' -f1; fi)
    cached_count=0; [[ -d $cycle_dir ]] && cached_count=$(find "$cycle_dir" -maxdepth 1 -type f -name 'frame-*.png' | wc -l | tr -d ' ')
    if [[ $MODE == render && -f $key_file && $(cat "$key_file") == "$cache_key" && $cached_count == "$FRAME_COUNT" ]]; then
      echo "$name: reusing Cycles frame cache $cache_key"
    else
      mkdir -p "$work/cycles/frames/$name"
      (cd "$work/cycles" && "$LMSCRIPT_BIN" "$SOURCE_DIR/$name.lms" "$name.dslb" final)
      (cd "$work/cycles" && nice -n 10 "$LMBLENDER_BIN" --dsl "$name.dslb")
      count=$(find "$work/cycles/frames/$name" -maxdepth 1 -type f -name 'frame-*.png' | wc -l | tr -d ' ')
      [[ $count == "$FRAME_COUNT" ]] || { echo "$name rendered $count Cycles frames; expected $FRAME_COUNT" >&2; exit 1; }
      rm -rf "$cycle_dir"; mkdir -p "$cycle_dir"
      cp "$work/cycles/frames/$name"/frame-*.png "$cycle_dir/"
      printf '%s\n' "$cache_key" > "$key_file"
      echo "$name: cached Cycles frames $cache_key"
    fi
    cp "$cycle_dir"/frame-*.png "$work/frames/$name/"
    ov="$work/overlay/$name"; mkdir -p "$ov/build/rendered"
    (cd "$ov" && "$LMSCRIPT_BIN" "$SCRIPT_DIR/overlay/$name.lms" "$name.dslb")
    (cd "$ov" && nice -n 10 "$LMDRAW_BIN" --dsl "$name.dslb")
    ov_count=$(find "$ov/build/rendered" -maxdepth 1 -type f -name 'overlay-*.png' | wc -l | tr -d ' ')
    [[ $ov_count == "$FRAME_COUNT" ]] || { echo "$name rendered $ov_count overlays; expected $FRAME_COUNT" >&2; exit 1; }
    # Replace the Cycles black world with a branded navy gradient, then composite labels.
    mkdir -p "$work/composite/$name"
    ffmpeg -hide_banner -loglevel error -y -loop 1 -framerate "$FRAME_RATE" -i "$backdrop" \
      -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" \
      -framerate "$FRAME_RATE" -start_number 0 -i "$ov/build/rendered/overlay-%d.png" \
      -filter_complex '[1:v]colorkey=0x000000:0.06:0.12[fg];[0:v][fg]overlay=0:0:format=auto[scene];[scene][2:v]overlay=0:0:format=auto,format=rgb24[out]' \
      -map '[out]' -frames:v "$FRAME_COUNT" -start_number 0 "$work/composite/$name/frame-%d.png"
    mv "$work/composite/$name"/frame-*.png "$work/frames/$name/"
  fi
  rendered_count=$(find "$work/frames/$name" -maxdepth 1 -type f -name 'frame-*.png' | wc -l | tr -d ' ')
  [[ $rendered_count == "$FRAME_COUNT" ]] || { echo "$name rendered $rendered_count frames; expected $FRAME_COUNT" >&2; exit 1; }
  if command -v sha256sum >/dev/null; then (cd "$work/frames" && sha256sum "$name"/frame-*.png) >> "$actual_hashes"; else (cd "$work/frames" && shasum -a 256 "$name"/frame-*.png) >> "$actual_hashes"; fi
  poster_frame=216; case "$name" in level-1) poster_frame=190 ;; level-2) poster_frame=120 ;; level-3) poster_frame=220 ;; level-4) poster_frame=220 ;; esac
  poster="$OUTPUT_DIR/$name-poster.png"; mp4="$OUTPUT_DIR/$name.mp4"; webm="$OUTPUT_DIR/$name.webm"
  if [[ $MODE == render ]]; then
    cp "$work/frames/$name/frame-$poster_frame.png" "$poster"
    track=; [[ -z $AUDIO_DIR || ! -f $AUDIO_DIR/$name.wav ]] || track="$AUDIO_DIR/$name.wav"
    if [[ -n $track ]]; then
      ffmpeg -hide_banner -loglevel error -y -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" -i "$track" -shortest -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r "$FRAME_RATE" -g 48 -keyint_min 48 -sc_threshold 0 -threads 1 -c:a aac -b:a 96k -movflags +faststart "$mp4"
      ffmpeg -hide_banner -loglevel error -y -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" -i "$track" -shortest -c:v libvpx-vp9 -deadline good -cpu-used 2 -crf 24 -b:v 0 -pix_fmt yuv420p -r "$FRAME_RATE" -g 48 -row-mt 0 -threads 1 -c:a libopus -b:a 64k "$webm"
    else
      ffmpeg -hide_banner -loglevel error -y -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" -an -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r "$FRAME_RATE" -g 48 -keyint_min 48 -sc_threshold 0 -threads 1 -movflags +faststart "$mp4"
      ffmpeg -hide_banner -loglevel error -y -framerate "$FRAME_RATE" -start_number 0 -i "$work/frames/$name/frame-%d.png" -an -c:v libvpx-vp9 -deadline good -cpu-used 2 -crf 24 -b:v 0 -pix_fmt yuv420p -r "$FRAME_RATE" -g 48 -row-mt 0 -threads 1 "$webm"
    fi
  else
    cmp "$work/frames/$name/frame-$poster_frame.png" "$poster"
    (( $(file_size "$poster") <= 300000 )) || { echo "poster exceeds 300 KB: $poster" >&2; exit 1; }
  fi
  for video in "$mp4" "$webm"; do [[ -f $video ]] || { echo "missing encoded video: $video" >&2; exit 1; }; bytes=$(file_size "$video"); ((bytes <= 10485760)) || { echo "video exceeds 10 MB: $video ($bytes bytes)" >&2; exit 1; }; done
  mp4_info=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -show_entries format=duration -of default=noprint_wrappers=1 "$mp4")
  webm_info=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -show_entries format=duration -of default=noprint_wrappers=1 "$webm")
  for check in "codec_name=h264" "width=$WIDTH" "height=$HEIGHT" "duration=10.000000"; do [[ $mp4_info == *"$check"* ]] || { echo "MP4 check failed ($check): $mp4" >&2; exit 1; }; done
  for check in "codec_name=vp9" "width=$WIDTH" "height=$HEIGHT" "duration=10.000000"; do [[ $webm_info == *"$check"* ]] || { echo "WebM check failed ($check): $webm" >&2; exit 1; }; done
  echo "$name ($ENGINE): $FRAME_COUNT frames at ${WIDTH}x${HEIGHT}, $FRAME_RATE fps"
done
if [[ $MODE == check ]]; then
  expected_hashes=$HASH_FILE
  if [[ -n $ONLY_LEVEL ]]; then expected_hashes="$work/expected.sha256"; grep "level-$ONLY_LEVEL/" "$HASH_FILE" > "$expected_hashes"; fi
  diff -u "$expected_hashes" "$actual_hashes"
  echo 'frame hashes: match (local renderer check; encoder output hashes are intentionally not used)'
else
  if [[ -z $ONLY_LEVEL ]]; then cp "$actual_hashes" "$HASH_FILE"; else
    combined="$work/combined.sha256"; : > "$combined"
    for n in 1 2 3 4; do source_hashes=$HASH_FILE; [[ $ONLY_LEVEL != "$n" ]] || source_hashes=$actual_hashes; grep "level-$n/" "$source_hashes" >> "$combined"; done
    cp "$combined" "$HASH_FILE"
  fi
  if [[ $ENGINE == lmblender ]]; then cp "$work/manifest.json" "$SCRIPT_DIR/lmblender/manifest.json"; fi
  echo "frame hashes: updated at $HASH_FILE"
fi

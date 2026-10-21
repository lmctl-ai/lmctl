#!/usr/bin/env bash

select_frame_hashes() {
  local source=$1 level=$2 expected=$3 output=$4 count
  [[ -f $source ]] || { echo "frame hash file is missing: $source" >&2; return 1; }
  awk -v prefix="level-$level/" 'index($2, prefix) == 1 { print }' "$source" > "$output"
  count=$(wc -l < "$output" | tr -d ' ')
  [[ $count == "$expected" ]] || {
    echo "frame hash file has $count entries for level-$level; expected $expected" >&2
    return 1
  }
}

merge_frame_hashes() {
  local baseline=$1 actual=$2 level=$3 expected=$4 output=$5 n count
  [[ -f $baseline ]] || { echo "baseline frame hash file is missing: $baseline" >&2; return 1; }
  [[ -f $actual ]] || { echo "rendered frame hash file is missing: $actual" >&2; return 1; }
  select_frame_hashes "$actual" "$level" "$expected" "$output.actual-level"
  : > "$output"
  for n in 1 2 3 4; do
    if [[ $n == "$level" ]]; then
      cat "$output.actual-level" >> "$output"
    else
      select_frame_hashes "$baseline" "$n" "$expected" "$output.level-$n"
      cat "$output.level-$n" >> "$output"
      rm -f "$output.level-$n"
    fi
  done
  rm -f "$output.actual-level"
  count=$(wc -l < "$output" | tr -d ' ')
  [[ $count == $((expected * 4)) ]] || {
    echo "merged frame hash file has $count entries; expected $((expected * 4))" >&2
    return 1
  }
}

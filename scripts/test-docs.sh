#!/usr/bin/env bash
set -euo pipefail

echo "Running doc tests..."
ERR=0

if grep -q -r -n "lmctl mail " skills/; then
  echo "FAIL: 'lmctl mail' found in skills/"
  grep -r -n "lmctl mail " skills/ || true
  ERR=1
fi

if grep -q -r -n "mailbox_queue_enabled" skills/; then
  echo "FAIL: 'mailbox_queue_enabled' found in skills/"
  grep -r -n "mailbox_queue_enabled" skills/ || true
  ERR=1
fi

if grep -q -r -n -E "lmctl (health|hire|refresh|restore) " skills/; then
  echo "FAIL: Invalid lmctl commands found in skills/"
  grep -r -n -E "lmctl (health|hire|refresh|restore) " skills/ || true
  ERR=1
fi

if grep -q -r -n -i "there is no queued row to inspect" skills/; then
  echo "FAIL: 'there is no queued row to inspect' mention found in skills/ (Item 3 violation)"
  grep -r -n -i "there is no queued row to inspect" skills/ || true
  ERR=1
fi

# These pages describe current lmctl coordination, not the separate lmmail service.
# lmctl-admin-skill.md is deliberately NOT here. lmctl-admin is a SIBLING PROJECT whose
# job is diagnosing LEGACY mailbox rows left by the removed queue -- "still-queued",
# "legacy-orphan", "undelivered legacy mailbox rows". It has to name those things to
# describe what it scans. The pattern below is right; its scope was wrong.
coordination_pages=(
  skills/background-wakeup.md
  skills/lmctl-meta-lead-skill.md
  skills/lmctl-recover-skill.md
  skills/lmctl-team-lead-basic-skill.md
  skills/team-lead-workflow.md
)
if grep -nEi '\b(queue[[:alnum:]_-]*|mailbox[[:alnum:]_-]*|lanes?)\b' "${coordination_pages[@]}"; then
  echo "FAIL: Legacy delivery model found in current lmctl coordination skills"
  ERR=1
fi

for page in "${coordination_pages[@]}"; do
  if tr '\n' ' ' < "$page" | grep -qiE '(fresh provider session|member|agent) (will reread|re-reads|automatically reads) durable memory'; then
    echo "FAIL: Automatic durable-memory onboarding claimed in $page"
    ERR=1
  fi
done

for page in skills/lmctl-meta-lead-skill.md skills/lmctl-team-lead-basic-skill.md skills/team-lead-workflow.md skills/lmctl-lead-skill.md; do
  if ! grep -qE 'lmctl prompt ("[^"]+\.lmctl"|[^"[:space:]]+\.lmctl|"<[^>]+>"|<[^>]+>) ([[:alnum:]_][[:alnum:]_-]*|<alias>) ' "$page" ||
     ! grep -qi 'blocks' "$page" ||
     ! grep -q 'is busy; wait and retry' "$page" ||
     ! grep -qi 'nothing was sent' "$page" ||
     ! grep -qi 'nothing is held' "$page"; then
    echo "FAIL: Incomplete inline delegation mechanics in $page"
    ERR=1
  fi
done

if [[ $ERR -ne 0 ]]; then
  exit 1
fi

echo "PASS"

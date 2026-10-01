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

if [[ $ERR -ne 0 ]]; then
  exit 1
fi

echo "PASS"

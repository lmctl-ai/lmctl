#!/usr/bin/env bash
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
SITE_ORIGIN="${SITE_ORIGIN:-https://lmctl.com}"

if [[ -z "${S3_BUCKET}" ]]; then
  echo "S3_BUCKET resolved empty. Set S3_BUCKET or restore the production default." >&2
  exit 1
fi

if [[ -z "${CF_DISTRIBUTION_ID}" ]]; then
  echo "CF_DISTRIBUTION_ID resolved empty. Set CF_DISTRIBUTION_ID or restore the production default." >&2
  exit 1
fi

if [[ ! -d build ]]; then
  echo "build/ does not exist. Run npm run build before deploying." >&2
  exit 1
fi

SOURCE_REVISION="$(git rev-parse HEAD 2>/dev/null || printf 'unknown')"
printf '{"sourceRevision":"%s"}\n' "${SOURCE_REVISION}" > build/sourceRevision.json

bash scripts/deploy-homepage.sh

DEST="s3://${S3_BUCKET}/lmctl/"

aws s3 sync build/ "${DEST}" \
  --delete \
  --exclude 'assets/*' \
  --cache-control 'no-cache, max-age=0, must-revalidate'

aws s3 sync build/assets/ "${DEST}assets/" \
  --delete \
  --cache-control 'public, max-age=31536000, immutable'

aws s3 cp build/sitemap.xml "${DEST}sitemap.xml" \
  --cache-control 'no-cache, max-age=0, must-revalidate'

LMCTL_INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths '/lmctl/*' \
    --query 'Invalidation.Id' \
    --output text
)"
aws cloudfront wait invalidation-completed \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --id "${LMCTL_INVALIDATION_ID}"

live_revision="$(curl -fsS "${SITE_ORIGIN}/lmctl/sourceRevision.json")"
if ! grep -q "\"sourceRevision\":\"${SOURCE_REVISION}\"" <<<"${live_revision}"; then
  echo "lmctl docs smoke failed sourceRevision for ${SITE_ORIGIN}/lmctl/sourceRevision.json" >&2
  echo "expected ${SOURCE_REVISION}, got ${live_revision}" >&2
  exit 1
fi

for spec in \
  '/lmctl/|Teamfile-driven AI-agent coordination' \
  '/lmctl/docs/skills|Skills' \
  '/lmctl/docs/tutorials/install-first-run|Baby steps' \
  '/lmctl/docs/manuals/verifying-delegated-work|Verifying delegated work'
do
  path="${spec%%|*}"
  marker="${spec#*|}"
  headers="$(curl -fsSI "${SITE_ORIGIN}${path}")"
  if ! grep -qi '^content-type: text/html' <<<"${headers}"; then
    echo "lmctl docs smoke failed content-type for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
  body="$(curl -fsS "${SITE_ORIGIN}${path}")"
  if ! grep -q "${marker}" <<<"${body}"; then
    echo "lmctl docs smoke failed marker for ${SITE_ORIGIN}${path}: ${marker}" >&2
    exit 1
  fi
done

# HTML-only skills and hand-written text/plain migration notices; no docs build needed.
bash scripts/deploy-skills.sh
bash scripts/tools/verify-live.sh skills

# --- helloexample: publish per-provider connectivity-check teamfiles to lmctl.com/helloexample/
# (source of truth = this repo's helloexample/). Mirrors the skills/ pattern above exactly.
# No --delete: never wipe files published out-of-band; this only adds/updates repo-tracked ones.
aws s3 sync helloexample/ "s3://${S3_BUCKET}/helloexample/" \
  --exclude '.*' \
  --content-type 'text/plain; charset=utf-8' \
  --exclude 'index.html' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
for key in 'helloexample/index.html' 'helloexample/'; do
  aws s3api put-object \
    --bucket "${S3_BUCKET}" \
    --key "${key}" \
    --body helloexample/index.html \
    --content-type 'text/html; charset=utf-8' \
    --cache-control 'no-cache, max-age=0, must-revalidate' > /dev/null
done
aws s3api put-object \
  --bucket "${S3_BUCKET}" \
  --key 'helloexample' \
  --body helloexample/index.html \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate' > /dev/null
HELLOEXAMPLE_INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths '/helloexample' '/helloexample/' '/helloexample/*' \
    --query 'Invalidation.Id' \
    --output text
)"
aws cloudfront wait invalidation-completed \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --id "${HELLOEXAMPLE_INVALIDATION_ID}"

for path in '/helloexample' '/helloexample/' '/helloexample/index.html'; do
  headers="$(curl -fsSI "${SITE_ORIGIN}${path}")"
  if ! grep -qi '^content-type: text/html' <<<"${headers}"; then
    echo "helloexample smoke failed content-type for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
  body="$(curl -fsS "${SITE_ORIGIN}${path}")"
  if ! grep -q '<title>lmctl hello examples</title>' <<<"${body}"; then
    echo "helloexample smoke failed for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
done

# --- templates: publish the ${Provider1..3}/${Model1..3}-slotted team-composition library to
# lmctl.com/templates/ (source of truth = this repo's templates/). Mirrors the skills/ pattern above.
# No --delete: never wipe files published out-of-band; this only adds/updates repo-tracked ones.
aws s3 sync templates/ "s3://${S3_BUCKET}/templates/" \
  --exclude '.*' \
  --content-type 'text/plain; charset=utf-8' \
  --exclude 'index.html' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
for key in 'templates/index.html' 'templates/' 'templates'; do
  aws s3api put-object \
    --bucket "${S3_BUCKET}" \
    --key "${key}" \
    --body templates/index.html \
    --content-type 'text/html; charset=utf-8' \
    --cache-control 'no-cache, max-age=0, must-revalidate' > /dev/null
done
TEMPLATES_INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths '/templates' '/templates/' '/templates/*' \
    --query 'Invalidation.Id' \
    --output text
)"
aws cloudfront wait invalidation-completed \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --id "${TEMPLATES_INVALIDATION_ID}"

for path in '/templates' '/templates/' '/templates/index.html'; do
  headers="$(curl -fsSI "${SITE_ORIGIN}${path}")"
  if ! grep -qi '^content-type: text/html' <<<"${headers}"; then
    echo "templates smoke failed content-type for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
  body="$(curl -fsS "${SITE_ORIGIN}${path}")"
  if ! grep -q '<title>lmctl templates</title>' <<<"${body}"; then
    echo "templates smoke failed for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
done

# --- lmscript/commands: publish the curated per-command lmscript library to
# lmctl.com/lmscript/commands/ (source of truth = this repo's lmscript/commands/). Mirrors the
# templates/ pattern above. No --delete: never wipe files published out-of-band.
# Exception: plan.lms and lint.lms are retired (plan -> plan.txt, a document, not a script;
# lint needs no script at all -- lmctl lint <file> is already the whole operation). These are
# OUR OWN prior publishes being genuinely removed, not out-of-band content, so they're deleted
# explicitly rather than left to linger just because sync itself never deletes.
aws s3 rm "s3://${S3_BUCKET}/lmscript/commands/plan.lms" 2>/dev/null || true
aws s3 rm "s3://${S3_BUCKET}/lmscript/commands/lint.lms" 2>/dev/null || true
aws s3 sync lmscript/commands/ "s3://${S3_BUCKET}/lmscript/commands/" \
  --exclude '.*' \
  --content-type 'text/plain; charset=utf-8' \
  --exclude 'index.html' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
for key in 'lmscript/commands/index.html' 'lmscript/commands/' 'lmscript/commands'; do
  aws s3api put-object \
    --bucket "${S3_BUCKET}" \
    --key "${key}" \
    --body lmscript/commands/index.html \
    --content-type 'text/html; charset=utf-8' \
    --cache-control 'no-cache, max-age=0, must-revalidate' > /dev/null
done
LMSCRIPT_COMMANDS_INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths '/lmscript/commands' '/lmscript/commands/' '/lmscript/commands/*' \
    --query 'Invalidation.Id' \
    --output text
)"
aws cloudfront wait invalidation-completed \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --id "${LMSCRIPT_COMMANDS_INVALIDATION_ID}"

for path in '/lmscript/commands' '/lmscript/commands/' '/lmscript/commands/index.html'; do
  headers="$(curl -fsSI "${SITE_ORIGIN}${path}")"
  if ! grep -qi '^content-type: text/html' <<<"${headers}"; then
    echo "lmscript/commands smoke failed content-type for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
  body="$(curl -fsS "${SITE_ORIGIN}${path}")"
  if ! grep -q '<title>lmscript commands</title>' <<<"${body}"; then
    echo "lmscript/commands smoke failed for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
done

# plan.lms and lint.lms are retired -- confirm the deletion actually took, not just that the
# sync step didn't error. A stale copy left live would silently outlive its own removal here.
for path in '/lmscript/commands/plan.lms' '/lmscript/commands/lint.lms'; do
  status="$(curl -s -o /dev/null -w '%{http_code}' "${SITE_ORIGIN}${path}")"
  if [[ "${status}" != "404" ]]; then
    echo "retired file still live at ${SITE_ORIGIN}${path} (status ${status})" >&2
    exit 1
  fi
done

for spec in \
  '/lmprobe/|text/html|lmprobe Manual' \
  '/examples/opencode.json|application/json|"provider"' \
  '/helloexample/claude.lmctl|text/plain|_MEMBER_ alias=Lead provider=claude' \
  '/helloexample/codex.lmctl|text/plain|_MEMBER_ alias=Lead provider=codex' \
  '/helloexample/agy.lmctl|text/plain|_MEMBER_ alias=Lead provider=agy' \
  '/helloexample/kimi.lmctl|text/plain|_MEMBER_ alias=Lead provider=kimi' \
  '/templates/solo.lmctl|text/plain|provider=${Provider1}' \
  '/templates/trio.lmctl|text/plain|provider=${Provider3}' \
  '/lmscript/commands/plan.txt|text/plain|plan.txt -- teamfile shapes to read and adapt' \
  '/lmscript/commands/seed.lms|text/plain|lmctl script seed.lms' \
  '/lmscript/commands/prompt.lms|text/plain|lmctl script prompt.lms'
do
  path="${spec%%|*}"
  rest="${spec#*|}"
  content_type="${rest%%|*}"
  marker="${rest#*|}"
  headers="$(curl -fsSI "${SITE_ORIGIN}${path}")"
  if ! grep -qi "^content-type: ${content_type}" <<<"${headers}"; then
    echo "public link smoke failed content-type for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
  body="$(curl -fsS "${SITE_ORIGIN}${path}")"
  if ! grep -Fq "${marker}" <<<"${body}"; then
    echo "public link smoke failed marker for ${SITE_ORIGIN}${path}: ${marker}" >&2
    exit 1
  fi
done

# The website owns quickrun samples; every full site deployment includes them.
S3_BUCKET="$S3_BUCKET" CF_DISTRIBUTION_ID="$CF_DISTRIBUTION_ID" SITE_ORIGIN="$SITE_ORIGIN" \
  bash scripts/deploy-quickrun.sh

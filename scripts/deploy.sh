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

aws s3 cp homepage/index.html "s3://${S3_BUCKET}/index.html" \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp homepage/404.html "s3://${S3_BUCKET}/404.html" \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp homepage/robots.txt "s3://${S3_BUCKET}/robots.txt" \
  --content-type 'text/plain; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp homepage/sitemap.xml "s3://${S3_BUCKET}/sitemap.xml" \
  --content-type 'application/xml; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 sync homepage/assets/ "s3://${S3_BUCKET}/assets/" \
  --cache-control 'public, max-age=31536000, immutable'
aws cloudfront create-invalidation \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --paths '/' '/index.html' '/404.html' '/robots.txt' '/sitemap.xml' '/assets/*'

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
  '/lmctl/docs/skills|You were just seeded' \
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

# --- skills: publish the raw skill pages to lmctl.com/skills/ (source of truth = this repo's skills/).
# No --delete: never wipe skills published out-of-band; this only adds/updates repo-tracked ones.
aws s3 sync skills/ "s3://${S3_BUCKET}/skills/" \
  --exclude '.*' \
  --content-type 'text/markdown; charset=utf-8' \
  --exclude 'index.html' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp skills/index.html "s3://${S3_BUCKET}/skills/index.html" \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
# Operator-facing short aliases, kept in the deploy script so the raw URLs stay usable
# without duplicating source content.
#   /skills/lmctl-prompt.md  -> the one capability page, for any agent regardless of alias
#   /skills/lmctl-lead.md    -> kept alive because teamfiles in the wild reference it;
#                               it now serves the "Moved" pointer, not a role page
aws s3 cp skills/lmctl-prompt-skill.md "s3://${S3_BUCKET}/skills/lmctl-prompt.md" \
  --content-type 'text/markdown; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp skills/lmctl-lead-skill.md "s3://${S3_BUCKET}/skills/lmctl-lead.md" \
  --content-type 'text/markdown; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3api put-object \
  --bucket "${S3_BUCKET}" \
  --key 'skills/' \
  --body skills/index.html \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3api put-object \
  --bucket "${S3_BUCKET}" \
  --key 'skills' \
  --body skills/index.html \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
SKILLS_INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths '/skills' '/skills/' '/skills/*' \
    --query 'Invalidation.Id' \
    --output text
)"
aws cloudfront wait invalidation-completed \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --id "${SKILLS_INVALIDATION_ID}"

for path in '/skills' '/skills/' '/skills/index.html'; do
  headers="$(curl -fsSI "${SITE_ORIGIN}${path}")"
  if ! grep -qi '^content-type: text/html' <<<"${headers}"; then
    echo "skills smoke failed content-type for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
  body="$(curl -fsS "${SITE_ORIGIN}${path}")"
  if ! grep -q '<title>lmctl skills</title>' <<<"${body}"; then
    echo "skills smoke failed for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
done

headers="$(curl -fsSI "${SITE_ORIGIN}/skills/lmctl-lead.md")"
if ! grep -qi '^content-type: text/markdown' <<<"${headers}"; then
  echo "skills smoke failed content-type for ${SITE_ORIGIN}/skills/lmctl-lead.md" >&2
  exit 1
fi
body="$(curl -fsS "${SITE_ORIGIN}/skills/lmctl-lead.md")"
if ! grep -q '# lmctl Lead skill' <<<"${body}"; then
  echo "skills smoke failed marker for ${SITE_ORIGIN}/skills/lmctl-lead.md" >&2
  exit 1
fi

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
  '/skills/claudecode-lead-skill.md|text/markdown|# Claude Code lmctl Lead skill' \
  '/skills/opencode-lead-skill.md|text/markdown|# opencode lmctl Lead skill' \
  '/skills/lmctl-admin-skill.md|text/markdown|# lmctl-admin skill' \
  '/skills/lmprobe-skill.md|text/markdown|# lmprobe skill' \
  '/skills/lmmail-skill.md|text/markdown|# lmmail — simple asynchronous mail for LLM agents' \
  '/skills/lmfeedback-skill.md|text/markdown|# lmfeedback — embeddable website feedback, delivered as lmmail mail' \
  '/skills/lmnote-skill.md|text/markdown|# lmnote skill' \
  '/skills/lmsheet-skill.md|text/markdown|# lmsheet skill' \
  '/skills/lmtext-skill.md|text/markdown|# lmtext — speech → text for LLM agents' \
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

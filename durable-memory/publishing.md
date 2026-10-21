# Publishing lmctl.com

Static homepage, tools and skills changes publish automatically from main after the path-filtered workflow checks them, uploads changed objects, invalidates their exact URLs and verifies the live site.

## Automatic static publishing

1. Commit a change and push it to main. The .github/workflows/deploy-static.yml workflow runs for changes under homepage/, tools/, skills/, skills-moved/, deployment scripts, the tools scripts, or the workflow itself. A manual workflow dispatch selects all three areas.
2. The workflow checks tools, skills and durable memory, then runs their self-tests. A failing check stops publication.
3. The changed-area selector chooses homepage, tools and/or skills from the push range. Changes under scripts/ select all three.
4. For each selected area, the publisher compares its manifest with S3 and uploads only missing or changed objects. It deletes only obsolete keys recorded in that area's previous manifest.
5. Uploaded/deleted paths and stale live CDN copies are invalidated even if S3 is already current. The workflow polls only mismatches for about five minutes and re-invalidates remaining paths once, then runs full link verification.

There is no manual approval gate in this workflow: make the change, commit it, and push to main. A successful run means the checks and publication verification completed.

## Published areas and ownership

The production defaults are S3 bucket lmctl-website-prod and CloudFront distribution E1GKUWTM93U7IV. S3_BUCKET and CF_DISTRIBUTION_ID can override those values for a deliberate alternate target.

| URL and S3 key scope | Source and publisher | Publication model |
| --- | --- | --- |
| Homepage root and assets/ | homepage/; scripts/deploy-homepage.sh | Static workflow on changed paths; manual script available |
| /tools/ and tools/ | tools/; scripts/deploy-tools.sh | Static workflow on changed paths; manual script available |
| /skills/ and skills/ | skills/ and skills-moved/; scripts/deploy-skills.sh | Static workflow on changed paths; manual script available |
| /lmctl/ | Docusaurus build/; scripts/deploy.sh | Separate full deployment; not an area published by deploy-static.yml |
| /lmprobe/ | lmprobe site bundle; scripts/deploy-lmprobe.sh | Standalone deployment script |
| /examples/ and /workflows/ | Mirrored catalogs; scripts/deploy-examples.sh and scripts/deploy-workflows.sh | Standalone mirror scripts |
| /quickrun/ | quickrun/; scripts/deploy-quickrun.sh | Standalone script builds, uploads and verifies its catalog |
| /helloexample/, /templates/, and /lmscript/commands/ | Repository sources; scripts/deploy.sh | Included in the separate full deployment |

The static-area publisher sets MIME and cache headers, writes a deterministic ownership manifest, preserves untracked S3 objects and invalidates only changed or deleted paths. HTML is revalidated without caching; CSS and images use a one-day cache. The Docusaurus deployment gives hashed assets long-lived immutable caching and revalidates HTML and the sitemap.

## AWS identity and permissions

GitHub Actions uses OIDC to assume the lmctl-website-deploy role; the checkout does not persist credentials. On the EC2 operator box, select its instance-role-backed profile with AWS_PROFILE=lmctl-website-deploy. Neither path uses static AWS access keys.

The role needs permission to list and read managed S3 keys and manifests, put changed objects and manifests, delete only manifest-owned obsolete keys, and create invalidations for the configured CloudFront distribution.

## Run a static-area deployment by hand

First preview the changes with DRY_RUN=1; this compares the current inventory and prints exact object keys without uploading, deleting or invalidating.

```
export AWS_PROFILE=lmctl-website-deploy
DRY_RUN=1 bash scripts/deploy-tools.sh
bash scripts/deploy-tools.sh
```

Use scripts/deploy-skills.sh or scripts/deploy-homepage.sh for their respective areas. The first performs its skills check, and the tools publisher runs its tools check. The Docusaurus scripts/deploy.sh is a separate full deployment and does not implement the static-area DRY_RUN=1 preview; build it with npm run build and follow DEPLOY.md.

## Verify the published site

The workflow runs scripts/tools/verify-live.sh --repair-cdn after publishing. It compares every managed object and index alias against the repository byte-for-byte, checks SHA-256 inventories plus content type and cache headers, then uses the release-installed lmhtml parser and checker to crawl managed HTML, follow internal links and images, and validate anchors. Referenced pages outside the owned areas are checked but are not recursively crawled.

Run the same verifier against production or any HTTP(S) origin without AWS credentials. It defaults to tools, skills and homepage; optional area names narrow the check.

```
bash scripts/tools/verify-live.sh
SITE_ORIGIN=https://preview.example bash scripts/tools/verify-live.sh tools skills
SITE_ORIGIN=https://preview.example bash scripts/tools/verify-live.sh homepage
```

Visual review is useful sampling of rendered pages, not a substitute for this automated live check.

## CloudFront clean URLs

infra/lmctl-www-redirect.js contains the viewer-request function for clean paths, including /tools/\*. The static workflow uploads site objects only; it does not publish or associate that function. An administrator must deploy the updated function separately for extensionless tool URLs. The explicit S3 index aliases work without that function update. Run node tests/infra/lmctl-www-redirect.test.mjs to check the function source before that administrative step.

## Troubleshooting

- AccessDenied: confirm the active identity with aws sts get-caller-identity, then check the OIDC trust or EC2 instance profile, the selected AWS profile, S3 permissions for the exact owned prefix, and CloudFront invalidation permissions. Do not add static keys to work around a role-policy error.
- Old content remains live: confirm that the changed path selected the intended area, the configured bucket/distribution are correct, and the run completed its invalidation wait. Check the exact URL, including clean-path rewrites, then rerun live verification with that origin.
- Content type or cache headers differ: the verifier reports the expected and actual headers. The inventory maps file extensions to MIME and cache metadata; a mismatch makes the object eligible for upload again. Check the source extension and the deployed object's response headers.
- Live byte comparison fails: inspect the reported object key and its area's manifest. The verifier detects missing, extra or changed managed objects; it does not enumerate or delete untracked S3 objects.

## Durable-memory checks and optional web view

The workflow runs the Markdown index, link and no-emoji checks before publication. Author .md chapters and regenerate durable-memory/index.md with npm run build:memory-index. npm run build:memory-web builds a separate templated preview under build/memory-web; neither the Markdown sources nor that preview are a static deployment area. See [memory-format.md](<memory-format.md>).

The homepage inventory also owns levels/ pages and their exact levels and levels/ index aliases. Read-only verify-live.sh needs no credentials; --repair-cdn can invalidate mismatched live paths and therefore requires the deploy role.

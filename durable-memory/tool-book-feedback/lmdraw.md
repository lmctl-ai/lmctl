# lmdraw README dogfood feedback — 2026-10-21

Merged into the skill on 2026-10-22.

## Findings

- A four-column README gallery overflowed the 390-pixel GitHub mobile viewport by 100 pixels and reduced thumbnails to about 87 pixels wide. Proposal: recommend two columns for three-to-six examples; the two-column gallery now fits the content width and keeps thumbnails around 128 to 141 pixels wide.
- A long direct autorun URL and a one-line CMake command required horizontal scrolling on mobile. Proposal: use the curated short autorun alias when one exists and split long shell commands with a continuation; the three-line quick start now uses lmdraw_solo and its exact script URLs are linked nearby.
- The architecture image rendered dark-only on light GitHub pages. Proposal: generate matching light/dark architecture variants with lmdraw and use picture selection for both hero and diagram.
- The title-card caption called its solid-color composition a gradient; the pipeline feedback label was off-center, its subtitle wrapped, the tree leaves were too narrow and some branch endpoints did not match their nodes, and the chart grid extended beyond its data. Proposal: compare every README caption with the source, inspect each selected preview at its final size, and use source coordinates for branch endpoints. The lmdraw examples and previews were corrected.
- The first QA report later described old tree leaf coordinates that do not match the pushed source at 24341a0. Proposal: verify a finding against the exact commit and source before applying it; the committed source has centered 380/480/580 engine leaves and matching branch endpoints.
- The second QA report found a literal separator row between two gallery groups. A blank line now separates them into two tables in commit bc05246; the table width is unchanged. Per the two-round limit, this final one-line Markdown correction was not sent for a third browser pass.
- A fresh lmctl clone could not install lmhtml because the GitHub API returned HTTP 403 rate limit. Using the existing cached lmhtml binary allowed the skills, memory and tools checks to pass. Proposal: mention a release-installed cache override in the recipe for transient GitHub API limits.

## Evidence

- lmdraw README and artwork pushed to lmctl-ai/lmdraw through commits 51b094c, 24341a0 and bc05246, each preceded by pull --rebase.
- The lmdraw test suite passed all 26 checks after regenerating README artwork and the selected example previews. All eight README images are under 400 KB.
- The lmscript-dev QA member reviewed desktop and mobile at both light and dark themes, confirmed all 8 images and 25 URLs loaded, and confirmed the two-column layout and both picture variants on commit 24341a0. Follow-up separator cleanup is one blank line and preserves the measured table width.

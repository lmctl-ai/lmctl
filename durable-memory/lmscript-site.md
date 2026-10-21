# lmscript tutorials and reference

The public lmscript tutorial site is authored in lmscript-site/ and deployed to the /lmscript/ URL prefix. The directory contains the index, topic pages, guide and runnable examples under examples/. Pages link to the tool overview and the workflow authoring skill.

The static publisher has a separate lmscript area and ownership manifest. It uploads only objects represented by that manifest and removes only objects from an earlier copy of that manifest. The current /lmscript/commands objects are outside the manifest and stay unchanged. lmscript-site/ is included in deploy-static path filters; scripts/deploy-lmscript.sh runs the checks and publishes this area by itself.

Run npm run check:lmscript-site to lint the HTML with the published lmhtml host, statically check every example with lmscript, and execute each example in an isolated temporary working directory with expected output. The team example's provider effects require an explicit --live argument and are not run by the check.

The index gives the reading order. Each tutorial page contains the full example source, real command output, a downloadable .lms file and a try-it instruction. guide.html covers CLI modes, PROPS, ARGV, Directory, NonInteractive, lmctl integration functions, errors and exit codes.

New tutorial pages should keep commands and outputs in preformatted blocks, use the plain HTML profile, and add an example to the checker before linking it from the index. The autorun lesson uses the published role comment and @role placeholders; the command is marked as available in the next lmctl release until that version is published.

# lmbio skill

Use `lmbio` when an agent needs deterministic local computational-biology results with machine-readable JSON.

Current stable surface:

- Exact rational HMM Viterbi decoding.
- Exact Fitch small parsimony for rooted binary trees.
- Exact Mendelian cross and Hardy-Weinberg genetics.
- Exact motif/PWM count, frequency, consensus, and candidate scoring.
- Exact Needleman-Wunsch and Smith-Waterman alignment matrices and tracebacks.
- Exact suffix array, BWT, inverse BWT, and FM-index backward-search intervals.
- Cache-first iCite and UniProt data pulls for lmmol review substrate work.
- Local sequence, protein, and BED-like interval utilities.
- Cache-first PubMed and ClinicalTrials.gov summary pulls.

## General rules

- Use `--json` for agent calls.
- Treat every rational as an exact reduced string: `"num/den"` or an integer string like `"1"`.
- Do not parse human output when `--json` is available.
- On failure, `lmbio` exits non-zero and emits a JSON error object when `--json` is set.

## Exact HMM Viterbi

Command shape:

```bash
lmbio hmm viterbi \
  --states I,N \
  --symbols G,A \
  --start I=1/2,N=1/2 \
  --trans I,I=3/4 I,N=1/4 N,I=1/4 N,N=3/4 \
  --emit I,G=3/4 I,A=1/4 N,G=1/4 N,A=3/4 \
  --obs GGA \
  --json
```

The JSON includes:

- `inputs`: normalized states, symbols, observation, start, transition, and emission probabilities.
- `trellis`: exact Viterbi trellis rows in observation order.
- `backpointers`: traceback choices for each row after the first.
- `path`: selected Viterbi path.
- `prob`: exact probability of the best single path.
- `forward_total`: exact sum over all possible state paths.
- `tie_break`: deterministic tie-break rule.
- `brute_force`: exhaustive oracle path/probability/path count.

For the canonical egtry fixture, `prob` is `"81/2048"` and `forward_total` is `"15/128"`.

## Fitch Small Parsimony

Command shape:

```bash
lmbio parsimony fitch \
  --tree '(("A","C"),("A","G"))' \
  --json
```

Tree input is a nested tuple/array shape:

- leaf = non-empty string state
- internal = exactly two child nodes
- non-binary internal nodes fail closed

The JSON includes:

- `inputs.tree`: normalized nested-array tree.
- `inputs.alphabet`: sorted observed leaf-state alphabet.
- `score`: Fitch parsimony score.
- `nodes`: postorder node records with `id`, `leaf`, `state`, `children`, `set`, and `union`.
- `assignment`: array indexed by node id.
- `induced_mutations`: mutation count induced by the deterministic assignment.
- `brute_force`: exhaustive internal-node labeling oracle.

For the canonical egtry fixture, `score` is `2`, `assignment` is `["A","C","A","A","G","A","A"]`, and `brute_force.labelings_enumerated` is `27`.

## Golden Fixture Replay

Use this to verify byte-stable outputs against committed fixtures:

```bash
lmbio golden check golden/hmm_viterbi/gga.json --json
lmbio golden check golden/align_nw/acgt_agt.json --json
lmbio golden check golden/align_nw/empty_a_ag.json --json
lmbio golden check golden/align_sw/tacgt_acg.json --json
lmbio golden check golden/parsimony_fitch/basic_binary.json --json
lmbio golden check golden/genetics_hardy_weinberg/counts_9_12_4.json --json
lmbio golden check golden/genetics_cross/dihybrid_aabb.json --json
lmbio golden check golden/genetics_cross/monohybrid_aa.json --json
lmbio golden check golden/motif_pwm/default.json --json
lmbio golden check golden/motif_pwm/pseudocount_1.json --json
lmbio golden check golden/search_index/gattaca.json --json
lmbio golden check golden/search_backward/gattaca_a.json --json
lmbio golden check --all --json
```

A passing check returns `pass:true` and `first_diff_byte:null`. A mismatch exits non-zero.

## Genetics

Hardy-Weinberg from observed genotype counts:

```bash
lmbio genetics hardy-weinberg --counts AA=9,Aa=12,aa=4 --json
```

The JSON includes exact `p`, `q`, genotype frequencies, smallest integer ratio, and `sum:"1"`.

Dihybrid cross:

```bash
lmbio genetics cross --p1 AaBb --p2 AaBb --json
```

The JSON includes sorted genotype probabilities, phenotype ratios in dominance-product order, smallest integer ratio, and `sum:"1"`.

Phenotype labels use the egtry shorthand convention for every gene: dominant is `<Upper>_` such as `A_`; recessive is doubled lowercase such as `aa`.

## Motif PWM

Count/frequency matrix and candidate scores:

```bash
lmbio motif pwm \
  --instances ACGT,ACGA,ACGT,AGGT \
  --score ACGT \
  --score ACGA \
  --score TCGT \
  --json
```

Use `--pseudocount` for exact rational pseudocounts:

```bash
lmbio motif pwm \
  --instances ACGT,ACGA,ACGT,AGGT \
  --pseudocount 1/2 \
  --score TCGT \
  --json
```

The JSON includes raw count matrix, exact frequency matrix, column sums, consensus with alphabet-order tie-break, exact candidate scores, and the brute-force best candidate.

## Alignment DP

Needleman-Wunsch global alignment:

```bash
lmbio align nw \
  --a ACGT \
  --b AGT \
  --match 1 \
  --mismatch -1 \
  --gap -2 \
  --json
```

Smith-Waterman local alignment:

```bash
lmbio align sw \
  --a TACGT \
  --b ACG \
  --match 1 \
  --mismatch -1 \
  --gap -2 \
  --json
```

The JSON includes the full integer `score_matrix`, optimal `score`, aligned strings, origin-first traceback `path`, and frozen tie-break text. Traceback priority is diagonal, then up, then left; local alignment starts from the first maximum cell in row-major order.

## Contract Helpers

Check the active stable schema:

```bash
lmbio --schema-version
```

Compare a fixture's command output against an externally generated expected-output file:

```bash
lmbio golden check golden/align_nw/acgt_agt.json --against /tmp/spine-output.json --json
```

This mode exits 0 on byte equality and exits 1 on mismatch.

## Search Indexing

Build exact suffix-array/BWT index facts:

```bash
lmbio search index --text GATTACA --json
```

Run FM-index-style exact backward search:

```bash
lmbio search backward --text GATTACA --pattern A --json
```

The JSON includes half-open `[lo,hi)` interval, count, ascending text-position occurrences, and the sentinel/order rules. Empty or over-long patterns are value cases that return the empty interval, not errors.

## iCite

Fetch review citation metrics in batches:

```bash
lmbio icite \
  --pmids 10196379,10323242,10484981,10486320,10549356 \
  --since 2015 \
  --json
```

The JSON is keyed by PMID under `papers`. Each item includes raw iCite metrics such as `citations`, `citations_per_year`, `rcr`, `year`, and `is_clinical`. Bad PMIDs become per-item `error` objects. Use `--refresh` to bypass cache and `--cache-dir` to pin the cache location.
The root object includes `resolved`, `errors`, `included`, and `filtered_out` counts. `--since <year>` marks resolved papers with `included:true/false` without dropping any requested PMID from the response.

## UniProt

Fetch review protein substrate fields in batches:

```bash
lmbio uniprot \
  --accessions P38398,P00533,P01308,P42345,P04637 \
  --json
```

The JSON is keyed by accession under `proteins`. Each item includes name, genes, organism taxon, function text, Pfam, InterPro, GO, EC, disease xrefs, disease free text, keywords, subcellular location, sequence length, protein existence, and cited PMIDs. GO terms are `{"id","name","aspect"}` objects with clean labels. Disease xrefs are disease-involvement references only, not gene/locus OMIM records. Bad accessions become per-item `error` objects. Use `--refresh` to bypass cache and `--cache-dir` to pin the cache location. The root object includes `resolved` and `errors` counts.

## Sequence Utilities

Use these for small teaching examples, FASTA snippets, and LLM-visible sequence summaries:

```bash
lmbio seq stats --seq ACGTNN --json
lmbio seq revcomp --seq ACGTRYSWKMBDHVN --json
lmbio seq translate --seq ATGGGATAA --json
lmbio seq orfs --seq CCCATGAAATAA --json
```

All sequence commands also accept `--fasta <path>` or `--fasta -` for stdin. `seq stats` emits exact reduced fractions for GC and N content. `seq translate` uses the standard genetic code and returns `*` for stops. `seq orfs` reports zero-based half-open nucleotide coordinates.

Sample data lives under `examples/`, and a live FASTA can be downloaded with:

```bash
curl -L 'https://rest.uniprot.org/uniprotkb/P04637.fasta' -o /tmp/P04637.fasta
lmbio seq stats --fasta /tmp/P04637.fasta --json
```

## Protein Stats

Summarize small protein sequences:

```bash
lmbio protein stats --seq ACDEKRFWY --json
lmbio protein stats --fasta examples/sample_protein.fa --json
```

The JSON includes length, amino-acid composition, molecular-weight estimate, acidic/basic/charged/aromatic/hydrophobic counts. The mass is a lightweight average-residue estimate, not a proteomics-grade exact mass calculator.

## Interval Arithmetic

Merge or intersect BED-like half-open intervals:

```bash
lmbio interval merge --input examples/intervals_a.bed --json
lmbio interval intersect --a examples/intervals_a.bed --b examples/intervals_b.bed --json
```

Input is tab-delimited `chrom start end [name]`. These commands are intentionally simple and memory-light; they are for small/medium feature sets and teaching/review substrate checks, not a full BEDTools replacement.

## PubMed

Fetch PubMed ESummary metadata in batches:

```bash
lmbio pubmed \
  --pmids 10549356,31452104,99999999 \
  --links \
  --max-links 5 \
  --cache-dir /tmp/lmbio-example-cache \
  --refresh \
  --json
```

The JSON is keyed by PMID under `papers` and includes title, source, journal, pubdate, year, authors, pubtypes, DOI, fetched date, provenance, `resolved`, and `errors`. Bad PMIDs become per-item `error` objects. `--links` adds bounded `references` and `cited_by` arrays using NCBI ELink; use `--max-links` to keep citation graphs small.

Raw sample download:

```bash
curl -L 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=10549356,31452104&retmode=json' -o /tmp/pubmed-esummary.json
```

## ClinicalTrials.gov

Fetch ClinicalTrials.gov v2 study summaries by NCT ID:

```bash
lmbio clinicaltrials \
  --ncts NCT04280705,NCT00000000 \
  --cache-dir /tmp/lmbio-example-cache \
  --refresh \
  --json
```

The JSON is keyed by NCT ID under `studies` and includes title, status, dates, conditions, keywords, sponsor, study type, phases, enrollment, interventions, summary, fetched date, provenance, `resolved`, and `errors`. Bad NCT IDs become per-item `error` objects.

Raw sample download:

```bash
curl -L 'https://clinicaltrials.gov/api/v2/studies/NCT04280705' -o /tmp/NCT04280705.json
```

# lmfin — a lightweight local finance CLI for LLM agents

**What this is.** `lmfin` is a single, fast, local command-line binary that pulls **free public
financial data** from the internet and runs **quantitative analysis on the user's own machine**.
It is built for you, an LLM agent: you run a subcommand, add `--json`, and parse a **stable JSON
contract**. No API key, no account, no SDK — just a binary on `PATH` and a shell.

Use it to answer real finance questions with real numbers: "how volatile is AAPL vs the S&P 500?",
"price this option", "what's this bond's duration?", "build a risk-parity portfolio", "are these
two stocks cointegrated?". The **LLM is the brain; lmfin is the deterministic hands.**

> Informational only — **not investment advice.** lmfin reports public facts and standard
> computations; it makes no recommendations.

---

## Install (local dogfood — build from source)

lmfin is currently distributed for **local internal dogfooding only**. There is **no public package
to install** right now — do not `npm install` or `npx` it. Use a locally built binary.

Build it from the lmfin source with a normal Rust toolchain:

```sh
cargo build --release        # produces ./target/release/lmfin
# optional: put it on PATH
cargo install --path .        # installs `lmfin` into ~/.cargo/bin
```

Or just run the operator-provided binary if it is already on your `PATH`. Confirm it works:

```sh
lmfin --version
lmfin --help
```

No API key or account is needed — all data sources are keyless. (A public install channel may come
later; until then, treat lmfin as a local tool you build/run on this machine.)

---

## How to use it

`lmfin` is a local binary. If it is on `PATH`, just run it. Every subcommand accepts `--json` for a
machine-readable object (parse this); without `--json` you get a human table.

```sh
lmfin --help                       # list all commands
lmfin returns AAPL --window 1y --json
```

Pattern for you as an agent: **build the command, run it, parse the `--json` output, explain it.**
Numbers in JSON are decimals (e.g. `0.1569` = 15.69%), not pre-formatted percentages.

Data is fetched fresh and cached locally (1-day TTL) under the OS cache dir. Sources are all
keyless: **Yahoo Finance** (prices), **SEC EDGAR** (company fundamentals), **FRED** (macro).

---

## Market analytics

```sh
# Return & risk; add --vs BENCH for beta/correlation/alpha
lmfin returns AAPL --window 6mo --vs SPY --json
#  -> cumulative_return, annualized_return, annualized_vol, sharpe, log_sharpe,
#     max_drawdown, risk_free_rate, vs:{beta, correlation, alpha_annualized, ...}

# Full performance tear-sheet (empyrical/QuantStats conventions)
lmfin perf AAPL --window 2y --vs SPY --json
#  -> sharpe, sortino, calmar, omega, VaR/CVaR (95/99), capture ratios,
#     ulcer/UPI, kelly, win_rate, drawdown details, monthly/yearly tables

# 40+ technical indicators + interpretive signals
lmfin ta AAPL --window 1y --json
#  -> trend (SMA/EMA/HMA/DEMA/TEMA/KAMA), momentum (RSI/MACD/Stoch/CCI/Williams%R/
#     TSI/Aroon), ADX/PSAR, Bollinger/Keltner/ATR, OBV/MFI/CMF, Ichimoku, signals

# Experimental / descriptive analytics
lmfin regime SPY --window 5y --json      # BOCPD change-points + volatility states
lmfin factors AAPL MSFT NVDA GOOGL --window 2y --json   # PCA statistical factors (PC1 = market)
lmfin pairs KO PEP --window 5y --json    # cointegration (ADF/Engle-Granger) + hedge ratio + z-score
lmfin vol AAPL --window 5y --json        # GARCH(1,1) volatility fit + forecast + EWMA baseline

# Portfolio construction (long-only)
lmfin portfolio SPY TLT GLD --window 5y --method all --json
#  -> methods: equal, invvar, riskparity (ERC), hrp, minvar, maxsharpe (+ Ledoit-Wolf --shrinkage)

# Efficient frontier
lmfin frontier AAPL MSFT NVDA GOOGL --window 2y --json       # numeric N-asset frontier
lmfin frontier two --ret-a 0.10 --vol-a 0.20 --ret-b 0.06 --vol-b 0.10 --corr 0 --rf 0.04 --json
```

## Fundamentals & macro

```sh
lmfin fundamentals AAPL --years 5 --json   # SEC EDGAR: revenue, margins, ROE/ROA, FCF, leverage, growth
lmfin macro cpi --json                     # FRED series (aliases: cpi, unrate, fedfunds, dgs10, gdp, vix, ...)
lmfin macro --list                         # the built-in FRED catalog
```

## Classical-finance calculators (exact arithmetic)

These are pure calculators (validated against textbook pinned numbers), useful for teaching,
checking, and pricing. Give explicit inputs.

```sh
# Options: Black-Scholes price + Greeks + implied vol; binomial CRR European/American; payoff
lmfin option --spot 100 --strike 100 --rate 0.05 --vol 0.20 --time 1 --type call --json
lmfin option --spot 100 --strike 100 --rate 0.05 --vol 0.20 --time 1 --type put \
      --method binomial --exercise american --json
lmfin option --spot 100 --strike 100 --rate 0.05 --time 1 --type call --price 10.4506  # solve implied vol

# Time value of money: 5-var solve, NPV, IRR, perpetuity/Gordon, rate conversion
lmfin tvm --rate 0.10 --nper 5 --pmt -100 --pv 0 --json      # solve fv
lmfin tvm npv --rate 0.10 --cashflows -1000,500,500,500 --json
lmfin tvm irr --cashflows -1000,500,500,500 --json

# Bonds: price/YTM, current yield, Macaulay & modified duration, convexity, accrued/dirty
lmfin bond --face 1000 --coupon 0.10 --freq 2 --maturity 3 --yield 0.05 --json
lmfin bond --face 1000 --coupon 0.10 --maturity 3 --price 940.47 --json    # solve YTM

# DCF valuation with terminal value; Forwards/futures cost-of-carry
lmfin dcf --rate 0.10 --cashflows 100,110,121 --terminal-growth 0.03 --json
lmfin forward --spot 100 --rate 0.05 --time 1 --income-fv 3 --json   # income at maturity
```

---

## Reading the output

- Every `--json` object has a **stable key contract** — safe to parse programmatically.
- Rates/returns are **decimals** (multiply by 100 for percent).
- `null` means "not enough data" (e.g. SMA-200 on a short window) — not an error.
- Market-analytics commands (`regime`, `factors`, `portfolio`, `pairs`, `vol`) are **experimental
  and descriptive**; the calculators (`option`, `tvm`, `bond`, `dcf`, `forward`, `frontier`) are
  **exact arithmetic** validated against textbook numbers.
- Prefer the `sharpe` field (simple-return / empyrical convention); `returns` also exposes
  `log_sharpe`.

## Tips for agents
- Run `lmfin <command> --help` to see exact flags before composing a command.
- Chain commands for a fuller picture: `fundamentals` + `perf` + `ta` for a single-name brief;
  `factors` + `portfolio` + `frontier` for a basket.
- If a data fetch fails (network/ticker), the command errors with context — surface it and retry or
  adjust the ticker.
- Always attach the "not investment advice" caveat when presenting results to a person.

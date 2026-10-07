# Aozumi Beta — Complete Test & Review Package

This repository is the full artifact of an end-to-end beta test of **[Aozumi](https://aozumi.dev)**
(repository → detection → plan review → deploy → operate), conducted 2026-10-06/07 as part of
the Aozumi closed beta ("most effective feedback & bug reports" program).

It contains **three deliverables + one working app**:

| # | Deliverable | What it is | Findings |
|---|---|---|---|
| 1 | [`SECURITY_REPORT.md`](SECURITY_REPORT.md) | Passive security & product review of aozumi.dev + the AoZumi-Labs GitHub org (curl / dig / openssl / public data only — no active exploitation) | **12 verified** (A1–B3) |
| 2 | [`FOLD_KIT_REVIEW.md`](FOLD_KIT_REVIEW.md) | Full source review of [`@shiplet-labs/fold@0.1.2`](https://github.com/AoZumi-Labs/fold-kit) — all 33 repo files read, every claim executed locally or pinned to an exact source line | **15 verified** (F1–F15) |
| 3 | [`FEEDBACK_EMAIL.md`](FEEDBACK_EMAIL.md) | The ready-to-send summary email (a feedback@ address is the only channel the beta exposes) | — |
| 4 | The **Aozumi Test Bench** (this app) | A deliberately realistic Node/Express app built to exercise Aozumi's detection → deploy → secrets → link-sharing flow, and reusable as a regression target after any platform change | — |

**Total: 27 verified findings.** Two additional candidate findings were investigated and
**invalidated during verification** (documented in the fold-kit Appendix) — we consider the
verification discipline as important as the findings themselves.

---

## The five headline catches

1. **The published security contact is dead.** `security@shiplet.dev` has no MX record (all
   mail bounces), the domain serves a `*.netlify.app` certificate and a 404. There is
   currently *no working channel* to report a vulnerability to Aozumi.
   → `dig +short MX shiplet.dev` (empty)
2. **The rebrand leaks the internal codename everywhere.** Production docs at
   aozumi.dev/docs say "Shiplet" 19× (Privacy) and 17× (Terms); the npm package, LICENSE
   stub, CODEOWNERS (`@Shiplet-Lab/core` — a 404 org), and spec URLs all still carry the
   abandoned brand.
3. **fold-kit's README quick-start has never worked.** `npx @shiplet-labs/fold --json` →
   `npm error could not determine executable to run` (exit 1). The package declares two
   bins and no `fold` bin — every new user's first command fails.
4. **Their own published fixture fails their own checker.** The team's
   `shiplet-beta-fixtures/static-site` exits 1 ("Not ready") under `shiplet-check.mjs` —
   the readiness tool has no detection path for plain static sites.
5. **Internal go-to-market copy ships into users' repos.** The generated `FOLD_REPORT.md`
   ends with: *"Paste this into Slack → bottom-up champion → org buy-in (boundary
   spanner)."*

All 27 findings, with one-line reproductions and suggested fixes:
[`SECURITY_REPORT.md`](SECURITY_REPORT.md) · [`FOLD_KIT_REVIEW.md`](FOLD_KIT_REVIEW.md)

---

## The Aozumi Test Bench

A deliberately "normal" app — standard structure, standard framework, one optional secret —
so Aozumi's inspector has realistic signals to detect:

| Signal in this repo | What Aozumi should detect |
|---|---|
| `package.json` with `express` dependency | Node.js project, dependency install step |
| `"start": "node server.js"` | Launch command |
| `PORT` env var usage | Port binding configuration |
| `APP_NAME` env var | Custom env var that should reach the runtime |
| `HF_TOKEN` (optional secret) | Secret handling through env config, never committed |
| `/healthz` endpoint | Health check wiring |
| `public/` static assets | Static file serving |

### Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

### What it does

- **Submit feedback/bug reports** (title, severity, details) via the form
- **List / delete reports** from an in-memory store (resets on restart — fine for testing)
- **`POST /api/summarize/:id`** — optional AI summary of a report via the HuggingFace
  Inference API. Works only when `HF_TOKEN` is set in the deployment environment;
  otherwise it returns a graceful "not configured" message. This exists specifically to
  verify that secrets configured through the platform actually reach the app.

### Environment variables (see `.env.example`; never commit a real `.env`)

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no | Listen port (default 3000) |
| `APP_NAME` | no | Shown in the UI header (default "Aozumi Test Bench") |
| `HF_TOKEN` | no | Enables AI summaries via HuggingFace Inference API |
| `HF_MODEL` | no | Summarization model (default `facebook/bart-large-cnn`) |

### API

| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Health probe → `{ ok: true }` |
| GET | `/api/config` | Shows which env vars actually reached the runtime |
| GET | `/api/notes` | List reports |
| POST | `/api/notes` | Create report (`title` required, `severity`: low/medium/high) |
| DELETE | `/api/notes/:id` | Delete report |
| POST | `/api/summarize/:id` | Optional HF-powered summary of a report |

---

## Aozumi beta test checklist

Things worth checking while deploying this through Aozumi:

1. Does detection correctly identify Node + Express + start script?
2. Does the deployment plan clearly show port/env/health-check assumptions?
3. Do `APP_NAME` and `HF_TOKEN` configured in the platform reach the app
   (check `GET /api/config` on the deployed link)?
4. Does the protected link open for someone *without* GitHub/cloud access?
5. Are logs and release history attributable to this specific app?

## Why the reports only contain verified claims

Two candidate fold-kit findings ("syntax error in mcp-server.mjs", "workflow triggers on a
branch named `ain]`") turned out to be **terminal display artifacts** that swallowed literal
`[m` byte sequences. `node --check` and `od -c` proved both files intact, and both claims
were dropped before reporting — they are documented as invalidated in the
[`FOLD_KIT_REVIEW.md` appendix](FOLD_KIT_REVIEW.md#appendix--candidate-findings-invalidated-during-verification).
Every finding that *did* survive is backed by a local execution with exit codes or an exact
source-line citation.

## Methodology & scope

- **Passive only.** aozumi.dev had no published vulnerability-disclosure policy at test
  time, so no active exploitation was attempted or performed. Website findings use curl /
  dig / openssl against publicly served responses; product findings come from public
  GitHub source and running the team's own open-source CLI against the team's own public
  fixtures.
- **Fairness.** Both reports include a "what they get right" section — plan-review-before-
  build is a genuinely good trust model, and fold-kit's spec-first + SLSA/CodeQL/Scorecard
  setup is real open-source maturity.

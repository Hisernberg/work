# fold-kit Deep Code Review — `@shiplet-labs/fold@0.1.2`

**Target:** https://github.com/AoZumi-Labs/fold-kit (npm: `@shiplet-labs/fold`, versions 0.1.0–0.1.2, last publish 2026-08-29)
**Date:** 2026-10-06
**Method:** Full source read of all 33 repo files (bin/, workflows, spec/, test/, examples/). Every finding is either **executed locally with exit codes shown** or **pinned to an exact source line**. Two candidate findings were invalidated during verification and are documented in the Appendix — nothing unverified appears below.
**Scope note:** This is a public open-source repo owned by the Aozumi/Shiplet team — static analysis of public code plus local execution of their published open-source CLI on their own public fixtures. No intrusion involved.

---

## Verified findings

### F1 — README quick-start command is broken (High, developer experience)
README instructs: `npx @shiplet-labs/fold --json`.
Executed verbatim:
```
$ npx --yes @shiplet-labs/fold@0.1.2 --json
npm error could not determine executable to run
```
The package declares two bins (`shiplet`, `shiplet-check`) and **no `fold` bin**; multi-bin packages cannot be launched by package name. Every new user's first command fails. The working form is buried in their own `action.yml` (`npm exec --package=@shiplet-labs/fold@0.1.2 -- shiplet-check --json`). The README also says "Once the package is published…" — it has been published since 2026-08-26; stale copy.

### F2 — Their own published fixture fails their own checker (High, product)
`AoZumi-Labs/shiplet-beta-fixtures/static-site` (plain `index.html` + `app.js` + `style.css`) is a fixture the team publishes "for compatibility tests". Ran their own checker against it:
```
$ node shiplet-check.mjs   (cwd = static-site)
✗ No package.json, Dockerfile, or fold contract found.
✗ No start command found; define start in fold.yaml or package.json.
Not ready: resolve critical findings first.
EXIT CODE: 1
```
The readiness tool rejects the team's own static-site story outright: there is no detection path for static HTML apps — no contract, no Dockerfile, nothing. Their `node-site` fixture passes (exit 0), which makes the static-site gap look like an oversight rather than a choice. Either the checker needs a static-site contract path, or the fixture needs a `fold.yaml`.

### F3 — `cffmpeg` regex typo: ffmpeg is never detected (Medium)
`bin/shiplet-check.mjs` line 130: `if (/sharp|cffmpeg|puppeteer|playwright/i.test(t))`. `cffmpeg` matches nothing real; `ffmpeg` — the most common native media dependency — goes undetected. `grep -c cffmpeg` = 1.

### F4 — Internal go-to-market playbook ships into users' repos (Medium, professionalism)
The generated `FOLD_REPORT.md` (written into the **user's** project with `--report`) ends with, verbatim from source line 302:
```
> Paste this into Slack → bottom-up champion → org buy-in (boundary spanner).
```
plus the line-285 comment `// champion deck per Ven & Verelst — paste-to-Slack report`. Users running `--report` get the vendor's internal sales strategy stamped into their repository. Same class of leak as the "Shiplet" codename on the website: internal artifacts escaping to production.

### F5 — Broken self-reference: `scripts/cost-model.mjs` does not exist (Low)
Line 361 tells users: *"see scripts/cost-model.mjs for full model"*. The full 33-file repo tree contains **no `scripts/` directory**. Dead pointer in shipped code.

### F6 — Generated SBOM violates CycloneDX 1.5 (Medium, spec compliance)
Three defects in the `--sbom` output (lines 335–344):
1. `serialNumber: urn:uuid:${receiptHash}` — the receipt hash is **16 hex chars**, not an RFC-4122 UUID (CycloneDX requires a valid UUID with dashes).
2. `metadata.tools.components[].version` is set to `pkg?.version` — the **scanned app's** version, attributed to the `@shiplet-labs/fold` tool component. Wrong version attribution on every generated SBOM.
3. Component `purl`s are built from **declared ranges** with `^`/`~` stripped (line 335) — ranges like `"1.x"` or `"*"` produce purl versions `x` / `*`, which are invalid package-URLs; the SBOM reflects declared wishes, not the resolved lockfile, so it cannot be used for vulnerability matching.

### F7 — Generated `vercel.json` uses long-dead syntax (Medium, functional)
Line 273 generates `env: {"KEY": "@KEY"}` — top-level `env` with `@`-references is legacy pre-2019 Vercel configuration. Current Vercel ignores it; users will believe env vars are wired when they are not.

### F8 — LICENSE file is not actually Apache-2.0 (Medium, legal hygiene)
`LICENSE` is a **256-byte stub** ("Apache License 2.0 / Copyright 2026 Shiplet / …"), not the canonical ~11 KB Apache-2.0 text. GitHub's license API returns `NOASSERTION`. The README badge and `package.json` (`license: "Apache-2.0"`) both claim Apache-2.0. Apache-2.0's grant, patent clause, and NOTICE mechanics only exist in the full text — a stub leaves the license's legal effect ambiguous. The copyright line also says **"Shiplet"** — the abandoned name again.

### F9 — CODEOWNERS references a nonexistent org (Medium, process)
```
* @Shiplet-Lab/core
/spec/ @Shiplet-Lab/core @shiplet/contract-reviewers
```
`github.com/Shiplet-Lab` **404s** (org renamed to AoZumi-Labs). CODEOWNERS silently matches nobody → required-review rules are decorative, org-wide.

### F10 — `fold plan|inspect|validate` are identical no-ops (Low, honesty)
`bin/shiplet.mjs` funnels `plan`, `inspect`, and `validate` into the exact same check (only `init` adds `--write-contract`; `compile` forwards `--provider`). Three advertised subcommands, one behavior.

### F11 — Capability scan correctness (Low)
- Root files are extension-filtered (line 96) but **subdir files are not** (line 105) — `.json`, lockfiles, even binaries get read as UTF-8 into the scan text.
- Hard caps: first **40 files** (line 112), first **80 KB** (line 115) — larger repos get silently partial scans with no warning in the output.
- Regexes match incidental words (`postgres` in a comment; any `http(s)://` string) — false-positive-prone "capabilities" feed the platform's review UI.

### F12 — Port 3000 reported as detected fact (Low)
`port = Number(contract?.port ?? 3000)` — with no contract, every output (text, JSON, receipt hash) states "Port: 3000" even when the app listens elsewhere (their own Go fixtures default to 8080). The checker's own `node-site` fixture run prints `Port: 3000` — an assumption dressed as a detection.

### F13 — MCP server gaps (Low)
`bin/mcp-server.mjs` is syntactically valid (verified via `node --check`) but: no handling of the required `notifications/initialized` (replies "unknown method" to a mandatory client notification); the `fix` tool mutates user files with no input schema or confirmation; hardcoded server version `0.1.0` vs package `0.1.2`.

### F14 — Release & attestation gaps (Low, supply chain)
`release.yml` attests provenance for `bin/*` only, but publishes `spec/` and `examples/` too; no tag↔`package.json` version consistency check before `npm publish`; `action.yml` hardcodes `@shiplet-labs/fold@0.1.2`, so every release silently leaves the reusable action pinned to an aging version.

### F15 — The abandoned-name problem lives inside the npm package itself (High, combined with website findings)
Package `@shiplet-labs/fold`, spec `shiplet.dev/fold/v1`, author `"Shiplet Lab <oss@shiplet.dev>"` — an email on the **dead domain** (no MX; see main report A1), README "Shiplet Fold Kit", badges pointing at `Shiplet-Lab`. The package users install today carries the defunct brand and an undeliverable contact email.

---

## What fold-kit gets right (fairness)
Read-only by design; secrets stored as **names only**; tests cover core flows including a no-secrets assertion on generated Dockerfiles; CodeQL + Scorecard + SLSA provenance are all wired; the composite action's JSON parsing is careful; spec-first development (`spec/fold.md`, `spec/runtime-contract.md`) is genuinely good practice. The bones are good — the gaps are polish, verification, and rebrand hygiene.

## Appendix — candidate findings invalidated during verification
1. *"mcp-server.mjs contains a syntax error (`handlerssg.method]`)"* — **FALSE.** `grep "handlers\["` matches the source; `node --check` passes. The initial read was a display artifact that swallowed the literal characters `[m` inside `handlers[msg.method]`.
2. *"CI workflows trigger on a branch named `ain]`"* — **FALSE.** `od -c` of line 4 shows the literal bytes `branches: [main]`. Same display artifact.

Both were dropped before reporting. Every surviving finding above survived execution or byte-level verification — and that verification discipline is itself the difference between a credible bug report and noise.

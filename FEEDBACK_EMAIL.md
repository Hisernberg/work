# Feedback Email — Final Version, Ready to Send

**To:** aadityasinha0308@gmail.com
**Subject:** Aozumi beta — 27 verified findings (website, product & fold-kit) incl. a dead security contact & a broken quick-start (repro one-liners inside)

---

Hi Aaditya,

You asked for the ugly feedback, so here it is. I approached the beta like a review
engagement: **27 verified findings across your website/product (12) and fold-kit (15)**,
every one with a one-line reproduction, every one either executed locally with exit codes
or pinned to an exact source line. Two candidate findings I investigated turned out to be
my own terminal artifacts and were dropped — they're documented as invalidated in the
appendix, because knowing what *not* to report matters as much as what you report.

Full reports (details, impact, suggested fixes):
- https://github.com/Hisernberg/work/blob/main/SECURITY_REPORT.md (12 findings)
- https://github.com/Hisernberg/work/blob/main/FOLD_KIT_REVIEW.md (15 findings)

## The five headline catches

**1. Your published security contact is dead.** `fold-kit`'s SECURITY.md tells researchers
to email `security@shiplet.dev` — but `shiplet.dev` has **no MX record** (mail bounces),
serves a `*.netlify.app` TLS cert, and 404s. Right now there is literally **no working
channel** to report a vulnerability to Aozumi, on a product whose beta is actively asking
for bug reports.

```bash
dig +short MX shiplet.dev        # empty
curl -sSk https://shiplet.dev/   # 404
```

**2. The rebrand leaks the internal codename everywhere.** Production docs (aozumi.dev/docs,
/docs/mcp) say "Shiplet" throughout — 19× in Privacy, 17× in Terms. It doesn't stop at the
website: the npm package is `@shiplet-labs/fold`, the LICENSE stub says "Shiplet", the spec
URL is `shiplet.dev/fold/v1`, and CODEOWNERS points at `@Shiplet-Lab/core` — an org that
**404s since the rename**, so required code review silently matches nobody.

**3. fold-kit's README quick-start has never worked.** The first command every new user
runs fails:

```
$ npx --yes @shiplet-labs/fold@0.1.2 --json
npm error could not determine executable to run      (exit 1)
```

The package declares two bins (`shiplet`, `shiplet-check`) and **no `fold` bin** —
multi-bin packages can't be launched by package name. The working form is buried in your
own `action.yml`.

**4. Your own published fixture fails your own checker.** I ran `shiplet-check.mjs` inside
your `shiplet-beta-fixtures/static-site`:

```
✗ No package.json, Dockerfile, or fold contract found.
✗ No start command found.
Not ready: resolve critical findings first.          (exit 1)
```

The readiness tool has **no detection path for plain static sites** — while your `node-site`
fixture passes (exit 0). Either the checker needs a static-site contract path or the fixture
needs a `fold.yaml`.

**5. Internal go-to-market copy ships into users' repos.** The generated `FOLD_REPORT.md`
(written into *your users'* projects with `--report`) ends with, verbatim from source:

```
> Paste this into Slack → bottom-up champion → org buy-in (boundary spanner).
```

Plus the adjacent source comment `// champion deck per Ven & Verelst — paste-to-Slack
report`. Same class of leak as finding #2: internal artifacts escaping into production.

## Other verified findings (severity-ordered)

**Website / product** (full list in SECURITY_REPORT.md):

| Sev | Finding | Repro |
|---|---|---|
| Med | `http://aozumi.dev` serves 200 in plaintext — no HTTPS redirect | `curl -sI http://aozumi.dev/` |
| Med | No HSTS / CSP / X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy | `curl -sDI https://aozumi.dev/` |
| Low | No security.txt; no security contact in Privacy/Terms | `curl -s https://aozumi.dev/.well-known/security.txt` |
| Low | No SPF/DMARC on aozumi.dev — @aozumi.dev spoofing unmitigated | `dig TXT aozumi.dev` |
| Low | MCP agent keys "act as your user" with full workspace permissions — consider scoped keys + TTL + audit attribution | (public docs) |
| Low | GitHub-OAuth-only sign-in; no fallback = total lockout risk | (public docs) |
| Info | Images via wsrv.nl, analytics via PostHog — add subprocessor disclosure | (page source) |
| Info | Public Go fixtures use no server timeouts & root containers — users copy them | repo review |

**fold-kit** (full list in FOLD_KIT_REVIEW.md — every one executed or line-pinned):

| Sev | Finding | Where |
|---|---|---|
| Med | `cffmpeg` regex typo — ffmpeg, the most common native media dep, is never detected | `bin/shiplet-check.mjs:130` |
| Med | Generated SBOM violates CycloneDX 1.5: serial is 16-hex (not UUID), tool version = scanned app's version, purls built from declared ranges (`"1.x"` → version `x`) | `shiplet-check.mjs:335–344` |
| Med | Generated `vercel.json` uses pre-2019 dead syntax (`env: {"KEY": "@KEY"}`) — env vars silently not wired | `shiplet-check.mjs:273` |
| Med | LICENSE is a 256-byte stub, not Apache-2.0 text (GitHub: NOASSERTION) — patent grant & NOTICE mechanics absent | `LICENSE` |
| Low | Report tells users "see scripts/cost-model.mjs" — no `scripts/` dir exists in the repo | `shiplet-check.mjs:361` |
| Low | `fold plan / inspect / validate` are the same no-op behind three names | `bin/shiplet.mjs` |
| Low | Port 3000 reported as a detected fact with no contract (receipt hash includes the assumption) | `shiplet-check.mjs` |
| Low | MCP server: no `notifications/initialized` handling; `fix` tool mutates files with no schema/confirmation; version says 0.1.0 vs 0.1.2 | `bin/mcp-server.mjs` |
| Low | Capability scan reads binary/lockfile subdirs as text, caps at 40 files / 80 KB silently, matches incidental words | `shiplet-check.mjs:96–115` |
| Low | Release attests provenance for `bin/*` but publishes `spec/`+`examples/`; action pins `@0.1.2` forever | `release.yml`, `action.yml` |
| High* | The whole installed package carries the dead brand + undeliverable contact (`oss@shiplet.dev` — no MX) | `package.json` |

*combined with website findings; the package users install today still points at the dead domain.

## What genuinely impressed me (keep this)

- **Plan-review-before-build** is the right trust model — nobody else does this.
- `/console` auth gating, valid TLS, and **zero secrets in your client JS** (I scanned the
  shipped bundles — clean).
- Env values write-only/encrypted is the correct instinct.
- fold-kit is read-only by design, stores secret *names* not values, has a no-secrets test
  on generated Dockerfiles, and wires CodeQL + Scorecard + SLSA provenance. Spec-first
  development (`spec/fold.md`, `spec/runtime-contract.md`) is genuinely good practice. The
  bones are good — the gaps are polish, verification, and rebrand hygiene.

## The reusable part

My repo (https://github.com/Hisernberg/work) doubles as an **Aozumi regression target**: a
deliberately standard Node/Express app exercising detection, port binding, custom env var
(`APP_NAME` shows in the UI), optional secret (`HF_TOKEN` gates a HuggingFace summary
endpoint), `/healthz`, static assets. After any platform change, deploy it and hit
`GET /api/config` — one call tells you whether env handling still works. Use it freely.

Most fixes are sub-30-minute jobs: Cloudflare "Always Use HTTPS" + HSTS toggles, one
security.txt, one DNS TXT record, a docs find-and-replace, a `bin` entry in package.json,
one regex character (`cffmpeg` → `ffmpeg`). I'm happy to re-verify after fixes — and I'd
love to be considered for the OpenAI credits reward.

Best,
[FILL: your name]
[FILL: your email / handle]

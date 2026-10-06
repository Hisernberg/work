# Aozumi Security & Product Review — Passive Reconnaissance Report

**Target:** https://aozumi.dev (+ public GitHub org AoZumi-Labs, domain shiplet.dev)
**Date:** 2026-10-06
**Method:** Passive, non-intrusive reconnaissance only — public HTTP responses, public DNS, public TLS certificates, public GitHub repositories, and the vendor's own published documentation. No scanning, fuzzing, injection, authentication bypass, or any active testing was performed against aozumi.dev infrastructure. Every finding below is reproducible with a single `curl`/`dig` command.
**Why passive-only:** Aozumi's beta post invites product bug reports, but no published vulnerability-disclosure policy or security.txt exists for aozumi.dev, so active security testing is out of scope without written authorization.

---

## Severity summary

| # | Severity | Finding |
|---|----------|---------|
| A1 | **High (process)** | Published security contact `security@shiplet.dev` is undeliverable (no MX; TLS hostname mismatch; site 404) |
| A2 | Medium | `http://aozumi.dev` serves content over plaintext — no redirect to HTTPS |
| A3 | Medium | Zero hardening headers: no HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| A4 | Low / Process | No `security.txt` (RFC 9116) and no security contact in Privacy/Terms |
| A5 | Low | No SPF/DMARC on `aozumi.dev` (no TXT records at all) — `@aozumi.dev` spoofing unmitigated |
| A6 | Low (design) | MCP agent keys "act as your user" with workspace-wide permissions — recommend scoping/TTL |
| A7 | Info | Third-party exposure: PostHog analytics (us.i.posthog.com), images proxied via wsrv.nl |
| A8 | Info | Public Go fixtures harden poorly (no server timeouts, root container) — users copy them |
| A9 | Low | GitHub OAuth is the only sign-in; no fallback path |
| B1 | **High (UX/brand)** | Production docs call the product "Shiplet" — internal codename leaked to prod |
| B2 | Medium | Abandoned rebrand trail: org renamed Shiplet-Lab→AoZumi-Labs; profile links to nonexistent org; shiplet.dev left dangling |
| B3 | Low | No sitemap.xml (SPA fallback); robots.txt is boilerplate content-signals file |

---

## A — Security & infrastructure

### A1 — Published security contact is unreachable (High)
`AoZumi-Labs/fold-kit` `SECURITY.md` instructs: *"Email security@shiplet.dev"*.
But the `shiplet.dev` domain is dead:
- **No MX record** → mail to `security@shiplet.dev` cannot be delivered.
- **TLS certificate mismatch** → serves `*.netlify.app` (Netlify), browsers refuse the connection.
- **Site returns 404** (Netlify "Not Found - Request ID: …").

Repro:
```bash
dig +short MX shiplet.dev            # empty
echo | openssl s_client -connect shiplet.dev:443 -servername shiplet.dev 2>/dev/null | openssl x509 -noout -subject   # CN=*.netlify.app
curl -sSk https://shiplet.dev/       # 404 Not Found
```
Impact: a researcher who follows the vendor's own instructions cannot report a vulnerability through the published channel — the worst possible state for a product that is actively soliciting bug reports.

### A2 — No HTTP→HTTPS redirect (Medium)
`http://aozumi.dev/` responds `HTTP/1.1 200 OK` over plaintext instead of redirecting.
Repro: `curl -sI http://aozumi.dev/ | head -3`
Impact: any user landing on an `http://` link (e.g., from old posts) transmits/receives content unencrypted; combined with A3 (no HSTS), nothing upgrades the connection. Fix: enable Cloudflare "Always Use HTTPS" + HSTS.

### A3 — Missing security response headers (Medium)
The HTTPS response carries **none** of: Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
Repro: `curl -sDI https://aozumi.dev/`
Impact: no transport upgrade guarantee (HSTS), no script-injection blast-radius control (CSP) — notable for an app whose whole job is handling OAuth tokens and secrets. Suggested baseline:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: (start report-only; app bundles are static /assets/*, so nonce- or hash-based CSP is feasible)
```

### A4 — No security.txt / no published disclosure policy (Low, process)
`/.well-known/security.txt` and `/security.txt` both return the SPA HTML fallback; Privacy Policy and Terms contain no security contact. Contrast: the open-source `fold-kit` repo *does* have a `SECURITY.md` — the practice exists internally, it just never reached the product domain. Publish an RFC 9116 `security.txt` on aozumi.dev pointing at a **deliverable** address.

### A5 — No SPF/DMARC on aozumi.dev (Low)
`dig TXT aozumi.dev` → empty; `dig MX aozumi.dev` → empty. Anyone can send mail claiming `@aozumi.dev` with no DMARC rejection. Publish at minimum a null SPF (`v=spf1 -all`) + DMARC reject on the apex, and confirm SPF/DKIM/DMARC on whatever domain actually sends transactional mail (invites, verification).

### A6 — MCP agent key design (Low, design-level; from public docs only)
Docs state the agent key *"acts as your user and uses workspace permissions"* and supports `Authorization: Bearer` or `X-API-Key` at `/mcp`. A single leaked agent key therefore equals full account compromise. Suggestions: least-privilege key scopes (e.g., inspect-only, no-deploy), optional TTL/expiry, per-key audit attribution visible in the console, and one-click revoke (docs mention revoke — surface it loudly).

### A7 — Third-party exposure (Info)
Landing page loads PostHog from `us.i.posthog.com` and proxies images through `wsrv.nl` (Weserv). Both are legitimate services, but image URLs (potentially user content) transit a third-party proxy — worth a subprocessor disclosure in the privacy policy.

### A8 — Public fixtures model weak patterns (Info)
`AoZumi-Labs/aozumi-go-basic` uses `http.ListenAndServe` without `ReadHeaderTimeout` (slowloris-prone pattern), and the Cloud Run Dockerfile runs the container as root. Since these repos exist specifically for users to copy, add timeouts + `USER nonroot` — cheap credibility win for a security-conscious deployment product.

### A9 — Single auth provider (Low)
Sign-in is GitHub OAuth only ("Continue with GitHub"). No email/magic-link fallback: a GitHub outage or OAuth-app misconfiguration locks every user out simultaneously, and users without GitHub accounts cannot use the product at all. Fine for a closed beta; plan a fallback before general rollout.

---

## B — Branding & product bugs

### B1 — Internal codename "Shiplet" leaked across production docs (High, UX)
- `aozumi.dev/docs` page title: **"Getting started — Shiplet"**; body: *"SHIPLET DOCS … Shiplet gives a working app a private home"*.
- `aozumi.dev/docs/mcp` title: **"MCP and agent setup — Shiplet"**; body repeatedly says Shiplet (endpoint, key flow, tool sequence).
- Meanwhile every marketing surface says **Aozumi**.
A new user reading the docs reasonably wonders whether they are on the wrong product's site. This is simultaneously a branding bug and an internal-codename leak.

### B2 — Abandoned rebrand trail (Medium)
The GitHub org was renamed **Shiplet-Lab → AoZumi-Labs** (repo URLs still 301 via the rename). The org profile README still says *"Shiplet Lab builds open tools…"* and links to `github.com/Shiplet-Lab/...` — the bare org URL now **404s**. `shiplet.dev` was left pointing at a dead Netlify site (see A1). The rebrand was started and never finished; each dangling artifact erodes trust.

### B3 — SEO/robots housekeeping (Low)
`/sitemap.xml` returns the SPA HTML fallback (no sitemap). `robots.txt` is the Cloudflare-managed "content signals" boilerplate with no actual crawl directives. Low impact, trivially fixed.

---

## Positives worth saying out loud

1. **Plan-review-before-build** is a genuinely differentiated trust model — keep it as the default.
2. **`/console` correctly gates** to `/signin?return_to=/console` (307) — no accidental exposure observed.
3. **Client bundles are clean** — no API keys, tokens, or secrets in the shipped JavaScript (verified by scan).
4. **Env values are write-only** (stored encrypted, never re-displayed) per docs — correct instinct.
5. **fold-kit is legitimately open**: ARCHITECTURE.md, GOVERNANCE.md, SECURITY.md, CONTRIBUTING.md — rare maturity for a beta-stage company.

## What needs an account to test (checklist for the team / for a follow-up report)

1. OAuth scope minimality shown on the "Continue with GitHub" consent screen
2. GitHub App installation granularity (all-repos vs selected)
3. Protected share-link model: expiry, revocation, rate limiting (with permission)
4. Log retention window and per-app log isolation
5. MCP key rotation UX and audit attribution
6. Sleep/wake behavior and billing transparency

---

*Reproduced entirely with passive techniques (curl/openssl/dig + public GitHub data). Happy to re-test after fixes and to sign a mutual disclosure agreement for deeper, authorized testing.*

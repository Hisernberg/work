# Feedback Email — Final Version, Ready to Send

**To:** aadityasinha0308@gmail.com
**Bcc (suggestion):** — (none; but after they fix security@shiplet.dev, archive this thread there too)
**Subject:** Aozumi beta — 12 verified findings incl. a dead security contact & the leaked "Shiplet" codename (repro one-liners inside)

---

Hi Aaditya,

You asked for the ugly feedback, so here it is — I approached this like a security
review, but everything below was found with **purely passive techniques** (curl,
dig, openssl, public GitHub data). Every finding has a one-line reproduction. The
full report with details and fixes lives at:
https://github.com/Hisernberg/work/blob/main/SECURITY_REPORT.md

## The two headline catches

**1. Your published security contact is dead.** `fold-kit`'s SECURITY.md tells
researchers to email `security@shiplet.dev` — but `shiplet.dev` has **no MX
record** (mail bounces), serves a `*.netlify.app` TLS cert that fails hostname
validation, and 404s. Right now there is literally **no working channel** to
report a vulnerability to Aozumi, on a product whose beta is actively asking for
bug reports.

Repro:
```bash
dig +short MX shiplet.dev        # empty
curl -sSk https://shiplet.dev/   # 404
```

**2. The internal codename "Shiplet" is all over production.** Your own docs
(aozumi.dev/docs, /docs/mcp) are titled "Getting started — Shiplet" / "MCP and
agent setup — Shiplet" and say "Shiplet" throughout, while the brand says
Aozumi. The GitHub org was renamed Shiplet-Lab → AoZumi-Labs but the profile
README still links to github.com/Shiplet-Lab (404). The rebrand was started and
never finished — and it leaks the internal name into prod.

## Other findings (severity-ordered, all reproducible)

| Sev | Finding | Repro |
|---|---|---|
| Med | `http://aozumi.dev` serves 200 in plaintext — no HTTPS redirect | `curl -sI http://aozumi.dev/` |
| Med | No HSTS / CSP / X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy | `curl -sDI https://aozumi.dev/` |
| Low | No security.txt anywhere; no security contact in Privacy/Terms | `curl -s https://aozumi.dev/.well-known/security.txt` |
| Low | No SPF/DMARC on aozumi.dev — @aozumi.dev spoofing unmitigated | `dig TXT aozumi.dev` |
| Low | MCP agent keys "act as your user" with full workspace permissions — consider scoped keys + TTL + audit attribution | (public docs) |
| Low | GitHub-OAuth-only sign-in; no fallback = total lockout risk | (public docs) |
| Info | Images proxied via wsrv.nl, analytics via PostHog — add subprocessor disclosure | (page source) |
| Info | Your public Go fixtures use no server timeouts & root containers — users copy them | repo review |

Full details, impact, and suggested fixes: **SECURITY_REPORT.md** in
https://github.com/Hisernberg/work

## What genuinely impressed me (keep this)

- **Plan-review-before-build** is the right trust model — nobody else does this.
- `/console` auth gating, valid TLS, and **zero secrets in your client JS**
  (I scanned the shipped bundles — clean).
- Env values being write-only/encrypted is the correct instinct.
- `fold-kit` with ARCHITECTURE/GOVERNANCE/SECURITY docs is real open-source
  maturity — extend that same practice to aozumi.dev (a `security.txt` alone
  would have prevented finding #1).

## The reusable part

My test bench repo (https://github.com/Hisernberg/work) is a deliberate Aozumi
regression target: Node/Express detection, port binding, custom env var
(`APP_NAME` shows in the UI), optional secret (`HF_TOKEN` gates an AI-summary
endpoint via HuggingFace), `/healthz`, static assets. After any platform change,
deploy it and hit `GET /api/config` — one call tells you whether env handling
still works. Use it freely.

Happy to re-verify after fixes — most of these are sub-30-minute fixes (Cloudflare
"Always Use HTTPS" + HSTS toggle, one security.txt, one DNS TXT, a docs
find-and-replace). I'd love to be considered for the OpenAI credits reward.

Best,
[FILL: your name]
[FILL: your email / handle]

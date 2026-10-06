# Feedback Email — Ready to Send

**To:** aadityasinha0308@gmail.com
**Subject:** Aozumi beta feedback — structured bug reports from a full deploy test (+ reusable test bench repo)

---

Hi Aaditya,

I took Aozumi for a full spin this week as part of the closed beta — I built a
purpose-made test repo (https://github.com/Hisernberg/work) designed to exercise
every part of your detection → plan → build → release → operate path, deployed it,
and pushed one protected link to someone who has neither my GitHub nor my cloud
account. You said you wanted the ugly feedback, so below it is, organized by
severity and with reproduction steps. I'd love to be considered for the OpenAI
credit reward if this is useful.

## What I tested

- Repo: https://github.com/Hisernberg/work (Node/Express app, 1 dependency,
  `/healthz` endpoint, static assets, 3 env vars including one optional secret)
- The journey end to end: repository connect, detection report, plan review,
  first build, release, logs, env config, protected link sharing.

## What worked well (keep this)

1. **Plan-before-build is the right default.** Reviewing what Aozumi detected
   (start command, port, env expectations) before anything ran is exactly the
   trust-building step every other platform skips. The "Review first. Deploy
   when ready" framing is genuinely differentiating.
2. **Release history tied to the app.** Having releases, logs, and config in one
   place per app (not scattered across provider tabs) matched how I actually
   debug.
3. **Protected link for non-technical recipients.** My tester opened the link
   with zero accounts, zero setup — this is the core promise and it held.

## Bugs & friction found (ordered by how much they hurt)

[FILL these with your real findings from the deploy — the structure below is what
makes a report win: what you did / what you expected / what happened / how bad.]

1. **[HIGH] — <title>**
   Steps: …
   Expected: …
   Actual: …
   Suggestion: …

2. **[MEDIUM] — <title>**
   Steps / Expected / Actual: …

3. **[LOW] — <title>**
   …

## Confusing steps (places I almost closed the tab)

- The **Workspace vs. Agent-assisted** choice appears before I understand what
  either does. As a new user I didn't know which path to pick; consider defaulting
  everyone into one guided path and letting power users opt into the other.
- **[FILL: any other step where you hesitated — name the exact screen/button.]**

## Things I expected to exist but didn't

- **[FILL] e.g.:** preview deployments per branch / rollback button on a release /
  a way to edit env vars without redeploying / build log download / webhook on
  deploy failure — whichever you actually missed.
- **Env var propagation proof:** my app exposes `GET /api/config` which reports
  which env vars actually reached the runtime. Deploying it through Aozumi gives
  you (and me) a one-glance check of your env handling — worth keeping as a
  regression test for your platform.

## Small landing-page notes

- "Sleep can reduce compute time where supported. Storage, traffic, and provider
  charges still apply." — accurate, but the *billing* consequence of sleep for a
  free-beta user is unclear; one sentence would remove the anxiety.
- The Field Notes blog is good product writing; consider linking the deployment
  guide directly from the first-run workspace screen.

## Suggestions (beyond fixes)

1. A **"what changed in detection" diff** when I reconnect a repo — so I know if
   the plan changed because of my commit.
2. **Shareable read-only build logs** for bug reports like this one.

## The test bench

The repo (https://github.com/Hisernberg/work) is free to keep — it's a deliberate
Aozumi regression target: Node+Express detection, port binding, custom env var
(`APP_NAME` shows up in the UI header), optional secret (`HF_TOKEN` gates an AI
summary endpoint), health check, static assets. If your team deploys it after any
platform change, `GET /api/config` tells you in one call whether env handling
still works.

Happy to jump on a call or reproduce anything on request.

Best,
[FILL: your name]
[FILL: your email / Discord / handle]

# Aozumi Test Bench — Feedback Tracker

A deliberately small Node.js (Express) app used to test **[Aozumi](https://aozumi.dev)**'s
beta flow end to end: connect a repository → review the detected deployment plan →
deploy → share one protected link.

It is intentionally "normal" on purpose — standard structure, standard framework,
one external secret — so Aozumi's inspector has realistic things to detect:

| Signal in this repo | What Aozumi should detect |
|---|---|
| `package.json` with `express` dependency | Node.js project, dependency install step |
| `"start": "node server.js"` | Launch command |
| `PORT` env var usage | Port binding configuration |
| `APP_NAME` env var | Custom env var that should reach the runtime |
| `HF_TOKEN` (optional secret) | Secret handling through env config, never committed |
| `/healthz` endpoint | Health check wiring |
| `public/` static assets | Static file serving |

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

## What it does

- **Submit feedback/bug reports** (title, severity, details) via the form
- **List / delete reports** from the in-memory store (resets on restart — fine for testing)
- **`POST /api/summarize/:id`** — optional AI summary of a report via the HuggingFace
  Inference API. Works only when `HF_TOKEN` is set in the deployment environment;
  otherwise it returns a graceful "not configured" message. This exists to verify
  that secrets configured through the platform actually reach the app.

## Environment variables

See `.env.example`. Set them in your hosting environment (or via Aozumi's
configuration step) — never commit a real `.env`.

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no | Listen port (default 3000) |
| `APP_NAME` | no | Shown in the UI header (default "Aozumi Test Bench") |
| `HF_TOKEN` | no | Enables AI summaries via HuggingFace Inference API |
| `HF_MODEL` | no | Summarization model (default `facebook/bart-large-cnn`) |

## API

| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Health probe → `{ ok: true }` |
| GET | `/api/config` | Shows which env vars actually reached the runtime |
| GET | `/api/notes` | List reports |
| POST | `/api/notes` | Create report (`title` required, `severity`: low/medium/high) |
| DELETE | `/api/notes/:id` | Delete report |
| POST | `/api/summarize/:id` | Optional HF-powered summary of a report |

## Aozumi beta test checklist

Things worth checking while deploying this through Aozumi (see `FEEDBACK_EMAIL.md`):

1. Does detection correctly identify Node + Express + start script?
2. Does the deployment plan clearly show port/env/health-check assumptions?
3. Do `APP_NAME` and `HF_TOKEN` configured in the platform reach the app
   (check `GET /api/config` on the deployed link)?
4. Does the protected link open for someone *without* GitHub/cloud access?
5. Are logs and release history attributable to this specific app?

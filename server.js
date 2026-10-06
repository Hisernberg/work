/**
 * Aozumi Test Bench — minimal feedback tracker
 * Purpose: exercise Aozumi's detection/plan/deploy path with a realistic,
 * small Node app. Everything is deliberately standard:
 *   - Express with a start script in package.json
 *   - Env vars read from process.env (PORT, APP_NAME, HF_TOKEN)
 *   - A /healthz endpoint for health checks
 *   - Static assets in /public
 * No secrets are committed: see .env.example.
 */
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || "Aozumi Test Bench";
const HF_TOKEN = process.env.HF_TOKEN || "";
const HF_MODEL = process.env.HF_MODEL || "facebook/bart-large-cnn";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/** In-memory store (resets on restart — fine for a test bench). */
let notes = [];
let nextId = 1;

/** Health check for deployment platform probes. */
app.get("/healthz", (req, res) => {
  res.json({ ok: true, app: APP_NAME, uptimeSec: Math.round(process.uptime()) });
});

/** Returns env-driven config so you can verify env vars survived deployment. */
app.get("/api/config", (req, res) => {
  res.json({
    appName: APP_NAME,
    hfConfigured: Boolean(HF_TOKEN),
    model: HF_MODEL,
    nodeVersion: process.version,
  });
});

app.get("/api/notes", (req, res) => {
  res.json({ count: notes.length, notes });
});

app.post("/api/notes", (req, res) => {
  const { title, body, severity } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  const note = {
    id: nextId++,
    title: String(title).trim().slice(0, 200),
    body: String(body || "").slice(0, 2000),
    severity: ["low", "medium", "high"].includes(severity) ? severity : "medium",
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  res.status(201).json(note);
});

app.delete("/api/notes/:id", (req, res) => {
  const id = Number(req.params.id);
  const before = notes.length;
  notes = notes.filter((n) => n.id !== id);
  if (notes.length === before) {
    return res.status(404).json({ error: "note not found" });
  }
  res.json({ ok: true, deleted: id });
});

/**
 * Optional AI assist: summarizes a note via HuggingFace Inference API.
 * Skips gracefully when HF_TOKEN is not configured — this endpoint exists
 * so the app has a real reason to carry a secret through deployment,
 * which is exactly what Aozumi's env-var handling should get right.
 */
app.post("/api/summarize/:id", async (req, res) => {
  const note = notes.find((n) => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: "note not found" });
  if (!HF_TOKEN) {
    return res.status(200).json({
      summarized: false,
      message: "HF_TOKEN not set — set it in your deployment environment to enable.",
    });
  }
  try {
    const r = await fetch(
      `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Title: ${note.title}\n\n${note.body || note.title}`,
          parameters: { max_length: 60, min_length: 10 },
        }),
      }
    );
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ summarized: false, upstream: r.status, detail: text.slice(0, 300) });
    }
    const data = await r.json();
    const summary = Array.isArray(data) && data[0]?.summary_text ? data[0].summary_text : null;
    res.json({ summarized: Boolean(summary), summary });
  } catch (err) {
    res.status(502).json({ summarized: false, error: String(err).slice(0, 300) });
  }
});

app.listen(PORT, () => {
  console.log(`[${APP_NAME}] listening on port ${PORT} (node ${process.version})`);
});

// src/app.js

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Statischer Ordner
app.use(express.static(path.join(__dirname, "../public"))); // wichtig

// API Endpoint
app.get("/api/status", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

export default app;

// server.js
import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

// Statische Dateien
app.use(express.static(path.join(process.cwd(), "public")));

// Beispiel-API
app.get("/api/status", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));

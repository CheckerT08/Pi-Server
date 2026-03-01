import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VOCAB_PATH = path.join(__dirname, "data", "vocab.json");

export let vocab = {};

export function saveVocab(data) {
  fs.mkdirSync(path.dirname(VOCAB_PATH), { recursive: true });

  // atomarer Write (Crash-sicherer)
  const tempPath = VOCAB_PATH + ".tmp";
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, VOCAB_PATH);
}

export function loadVocab() {
  if (!fs.existsSync(VOCAB_PATH)) return {};

  try {
    const raw = fs.readFileSync(VOCAB_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    // Sicherheitscheck: muss Object sein
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      console.warn("Ungültige vocab.json - wird zurückgesetzt.");
      return {};
    }

    return parsed;
  } catch (err) {
    console.error("Fehler beim Laden der vocab.json:", err);
    return {};
  }
}

vocab = loadVocab();
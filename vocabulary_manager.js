import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const VOCAB_PATH = path.join(__dirname, "data", "vocab.json")

export let vocab = {};

export function saveVocab(vocab) {
  fs.mkdirSync(path.dirname(VOCAB_PATH), { recursive: true})
  fs.writeFileSync(VOCAB_PATH, JSON.stringify(vocab, null, 2), 'utf-8')
}

export function loadVocab() {
  if (!fs.existsSync(VOCAB_PATH)) return {}
  return JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'))
}

vocab = loadVocab();


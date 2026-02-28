//#region Imports, Express, __dirname
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import si from 'systeminformation';
import 'dotenv/config';
import { PORT } from './config/env.js';
import { homework, Task, saveHomework } from './homework_manager.js';
import { vocab, saveVocab } from './vocabulary_manager.js'

const app = express();

// __dirname für ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//#endregion

//#region Express-config
// statische Dateien (HTML + JS + CSS)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//#endregion

let stats = { cpu: '...', ram: '...', temp: '...', diskText: '...' };

//#region Web-Pages
app.get('/', (req, res) => {
  res.render('index', {
  });
});

app.get('/google', (req, res) => {
  res.render('google', {

  });
})

app.get('/stats', (req, res) => {
  res.render('stats', {
    cpu: stats.cpu,
    ram: stats.ram,
    temp: stats.temp,
    disk: stats.diskText,
  });
});

app.get('/homework', (req, res) => {
  res.render('homework', {
    tasks: homework
  });
});

app.get('/vocab', (req, res) => {
  res.render('vocab', {

  });
});

app.get('/vocab/add', (req, res) => {
  res.render('vocab/add', {
    vocab: vocab
  });
});

app.get('/vocab/learn', (req, res) => {
  res.render('vocab/learn', {

  });
});

//#endregion

//#region APIs

// --- HOMEWORK ---
app.post("/api/homework", (req, res) => {
  const { name, description, dueDate, subject } = req.body;
  try {
    const task = new Task({
      name: name || "Neue Aufgabe",
      description: description || "",
      dueDate: dueDate || new Date(),
      subject: subject || "",
      done: false
    });
    homework.push(task);
    saveHomework(homework);
    res.status(201).json(task); // Wichtig für das Frontend!
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/homework/:id", (req, res) => {
  const index = homework.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Nicht gefunden" });
  homework.splice(index, 1);
  saveHomework(homework);
  res.json({ success: true });
});

// --- VOCAB ---
app.post('/api/vocab', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Input leer" });

  const lines = text.split(".");
  const addedEntries = {};

  try {
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const parts = trimmed.split(",");
      if (parts.length !== 2) throw new Error("Format: Deutsch,Andere.");
      
      const [de, other] = parts.map(s => s.trim());
      if (de && other && !vocab[de]) {
        vocab[de] = other;
        addedEntries[de] = other;
      }
    });

    saveVocab(vocab);
    // Gibt alle erfolgreich hinzugefügten Paare zurück
    res.status(201).json({ added: addedEntries }); 
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/vocab/:id', (req, res) => {
  const id = decodeURIComponent(req.params.id).trim();
  if (!vocab[id]) return res.status(404).json({ error: "Nicht gefunden" });
  
  delete vocab[id];
  saveVocab(vocab);
  res.json({ success: true });
});

//#endregion

async function updateStats() {
  try {
    const mem = await si.mem();
    const load = await si.currentLoad();
    const tempData = await si.cpuTemperature();
    const disk = await si.fsSize();

    // Wir weisen das Ergebnis der globalen Variable 'stats' zu
    stats = {
      cpu: load.currentLoad.toFixed(2) + ' %',
      ram: (mem.used / 1024 / 1024 / 1024).toFixed(2) + ' GB / ' + (mem.total / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      temp: (tempData.main || 'N/A') + ' °C',
      diskText: (disk[0].used / 1024 / 1024 / 1024).toFixed(2) + ' GB / ' + (disk[0].size / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    };
  } catch (e) {
    console.error("Fehler beim Abrufen der Stats:", e);
  }
}

// Server starten
app.listen(PORT, async () => {
  console.log(`Server läuft auf Port ${PORT}`);

  // Einmal sofort beim Start ausführen
  await updateStats();
  setInterval(updateStats, 60000);
});

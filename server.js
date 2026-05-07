//#region Imports, Express, __dirname
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import si from 'systeminformation';
import 'dotenv/config';
import { PORT, MUSIC_BOX_IP } from './config/env.js';
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
  let {randomKey, other} = getRandomVocab();

  res.render('vocab/learn', {
    word: randomKey,
    solution: other
  });
});
//#endregion

//#region MUSIC_BOX_CONTROL
const boxRequest = async (path, res) => {
  try {
    const response = await fetch(`http://${MUSIC_BOX_IP}/YamahaExtendedControl/v1/main/${path}`);
    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(response.status).json({ error: 'Box antwortet mit Fehler' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Box nicht erreichbar' });
  }
};

app.get('/api/box/power/:state', (req, res) => {
  boxRequest(`setPower?power=${req.params.state}`, res);
});

app.get('/api/box/volume/:change', (req, res) => {
  const linkVar = req.params.change === 'up' ? 'up&step=2' : 'down&step=2';
  boxRequest(`setVolume?volume=${linkVar}`, res);
});

app.get('/api/box/input/:value', (req, res) => {
  const linkVar = req.params.value;
  boxRequest(`setInput?input=${linkVar}`, res);
});
//#endregion

//#region APIs

app.get('/api/code-start', (req, res) => {
  runCommand('systemctl --user start code-server', res);
  res.status(200);
});

app.get('/api/code-stop', (req, res) => {
  runCommand('systemctl --user stop code-server', res);
  res.status(200);
});

//#region Homework
app.get("/api/homework", (req, res) => {
  res.json(homework);
});

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
    console.log(`Neue task erstellt: ${task.name}`)
    homework.push(task);
    saveHomework(homework);
    res.status(201).json(task); // Wichtig für das Frontend!
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/homework/:id", (req, res) => {
  const { id } = req.params;
  const task = homework.find(t => t.id === id);
  console.log(`Bearbeite ${task.name}`)

  if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

  const { name, description, dueDate, subject } = req.body;
  if (name) task.name = name;
  if (description) task.description = description;
  if (dueDate) task.dueDate = new Date(dueDate);
  if (subject) task.subject = subject;

  saveHomework(homework);
  res.json(task);
});

app.post("/api/homework/:id/complete", (req, res) => {
  const { id } = req.params;
  const task = homework.find(t => t.id === id);
  console.log(`Erledige ${task.name}`)
  if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

  task.complete();
  saveHomework(homework);
  res.json(task);
});

app.delete("/api/homework/:id", (req, res) => {
  const index = homework.findIndex(t => t.id === req.params.id);
  console.log(`Index: ${index}`)
  if (index === -1) return res.status(404).json({ error: "Nicht gefunden" });
  homework.splice(index, 1);
  saveHomework(homework);
  res.json({ success: true });
});
//#endregion

//#region Vocab
app.post('/api/vocab', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Input leer" });

  const lines = text.split(".");
  const addedEntries = [];

  try {
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const parts = trimmed.split(",");
      if (parts.length !== 2) throw new Error("Format: Deutsch,Andere.");
      
      const [de, other] = parts.map(s => s.trim());

      if (!de || !other) return;

      if (!vocab[de]) {
        vocab[de] = {
          other,
          points: 0,
          addedDate: new Date().toISOString()
        };
        addedEntries.push({
          name: de,
          other: vocab[de].other,
          points: vocab[de].points,
          addedDate: vocab[de].addedDate
        });      
      }
    });

    saveVocab(vocab);
    res.status(201).json({ added: addedEntries }); 
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/vocab', (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'No body provided' });
  }

  const { german, correct } = req.body;

  if (!german) {
    return res.status(400).json({ error: 'Missing german field' });
  }

  if (!vocab[german]) {
    return res.status(404).json({ error: 'Word not found' });
  }

  if (correct) {
    vocab[german].points++;
  } else {
    vocab[german].points = 222222;
  }

  saveVocab(vocab);
  res.status(200).json({ success: true });
});

app.delete('/api/vocab/:id', (req, res) => {
  const id = decodeURIComponent(req.params.id).trim();
  if (!vocab[id]) return res.status(404).json({ error: "Nicht gefunden" });
  
  delete vocab[id];
  saveVocab(vocab);
  res.json({ success: true });
});

//#endregion

//#region Hilfsfunktionen

// Hilfsfunktion zur Ausführung der Befehle
const runCommand = (cmd, res) => {
    // 'shell: true' ist wichtig, damit Aliase/Shell-Logik theoretisch greifen
    // Oft ist es sicherer, den direkten Pfad zum Skript zu nutzen
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Fehler: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
        if (stderr) {
            console.warn(`Stderr: ${stderr}`);
        }
        res.json({ output: stdout || 'Befehl erfolgreich ausgeführt' });
    });
};

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

function getRandomVocab() {
  const keys = Object.keys(vocab);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const { other } = vocab[randomKey];
  return { randomKey, other }
}

//#endregion

// Server starten
app.listen(PORT, async () => {
  console.log(`Server läuft auf Port ${PORT}`);

  // Einmal sofort beim Start ausführen
  await updateStats();
  setInterval(updateStats, 60000);
});

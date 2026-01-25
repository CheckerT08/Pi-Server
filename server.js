//#region Imports, Express, __dirname
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import si from 'systeminformation';
import 'dotenv/config';
import { PORT } from './config/env.js';
import { homework, Task, saveHomework } from './homework_manager.js';

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
  // Hier nutzen wir jetzt das globale 'stats' Objekt, 
  // das alle 5 Sekunden aktualisiert wird.
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
//#endregion

//#region APIs
// GET alle Aufgaben
app.get("/api/homework", (req, res) => {
  res.json(homework);
});

// POST neue Aufgabe
app.post("/api/homework", (req, res) => {
  const { name, description, dueDate, subject } = req.body;
  try {
    const task = new Task({
      name: name,
      description: description,
      dueDate: dueDate,
      subject: subject,
      createdAt: new Date(),
      done: false
    });
    homework.push(task);
    saveHomework(homework);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT Aufgabe bearbeiten
app.put("/api/homework/:id", (req, res) => {
  const { id } = req.params;
  const task = homework.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

  const { name, description, dueDate, subject } = req.body;
  if (name) task.name = name;
  if (description) task.description = description;
  if (dueDate) task.dueDate = new Date(dueDate);
  if (subject) task.subject = subject;

  saveHomework(homework);
  res.json(task);
});

// POST Aufgabe erledigen
app.post("/api/homework/:id/complete", (req, res) => {
  const { id } = req.params;
  const task = homework.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

  task.complete();
  saveHomework(homework);
  res.json(task);
});

// DELETE Aufgabe
app.delete("/api/homework/:id", (req, res) => {
  const { id } = req.params;
  const index = homework.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Task nicht gefunden" });

  const deleted = homework.splice(index, 1);
  saveHomework(homework);
  res.json(deleted[0]);
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
  setInterval(updateStats, 5000);
});

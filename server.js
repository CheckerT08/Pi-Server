//#region Imports, Express, __dirname
import express, { response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import si from 'systeminformation';
import 'dotenv/config';
import fs from 'fs';
import { PORT, MUSIC_BOX_IP, MISTRAL_API_KEY, LATITUDE, LONGITUDE } from './config/env.js';
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

function getAIInstructions() {
  try {
    const filePath = path.join(__dirname, 'ai_instructions.txt');
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (err) {
    console.error("Konnte instructions.txt nicht laden, nutze Standard-Prompt.");
    console.error(err.message);
    return "Du bist ein hilfreicher Assistent.";
  }
}

const commands = {
  getSystemStatus: async () => {
    return `Temperatur ${stats.temp.replace('.', ',')}, Arbeitsspeicher ${stats.ram.replace('/', ' von ')}`;
  },

  reboot: async () => {
    runCommand('sudo reboot now');
    return 'Starte jetzt neu';
  },

  fullShutdown: async () => {
    runCommand('ssh -o ConnectTimeout=5 laptop "/home/torbinho/.shutdown"');
    commands.boxOff();
    return 'Alles aus. Bis bald';
  },

  boxOn: async () => {
    boxRequest('main/setPower?power=on');
    setTimeout(() => boxRequest(`main/setInput?input=bluetooth`), 5000);
    return 'Box eingeschaltet';
  },

  boxOff: async () => {
    boxRequest(`main/setPower?power=standby`);
    return 'Box ausgeschaltet';
  },

  boxLauter: async (addVolume) => {
    const change = parseInt(addVolume) || 3;

    const currentVolume = await boxRequest(`main/getStatus`).volume;
    await boxRequest(`main/setVolume?volume=${currentVolume + change}`);
    return 'Box lauter gemacht';
  },

  boxLeiser: async (addVolume) => {
    const change = parseInt(addVolume) || 3;

    const currentVolume = await boxRequest(`main/getStatus`).volume;
    await boxRequest(`main/setVolume?volume=${currentVolume - change}`);
    return 'Box leiser gemacht';
  },

  boxSetVolume: async (volume) => {
    if (volume && volume != 0) {
      await boxRequest(`main/setVolume?volume=${volume}`);
      return `Lautstärke auf ${volume} geändert`;
    } else {
      return 'Keine Lautstärke genannt. Nichts verändert.';
    }
  },

  boxSkipSong: async () => {
    await boxRequest(`netusb/setPlayback?playback=next`);
    return 'Song übersprungen';
  },

  boxPrevSong: async () => {
    await boxRequest(`netusb/setPlayback?playback=previous`);
    return 'Song zurück';
  },

  boxPause: async () => {
    await boxRequest(`netusb/setPlayback?playback=pause`);
    return 'Musik Pausiert';
  },

  boxPlay: async () => {
    await boxRequest(`netusb/setPlayback?playback=play`);
    return 'Spiele weiter';
  },

  boxGetSongData: async () => {
    const res = await boxRequest(`netusb/getPlayInfo`);
    if (!res) return 'Nichts gefunden';

    const artist = res.artist;
    const title = res.track;
    if (!artist || !title) return 'Nichts gefunden!'

    return `Gerade spielt ${title} von ${artist}`;
  },

  getWeather: async (hoursFromNow) => {
    const offset = parseInt(hoursFromNow) || 0;

    const weatherMaster = {
        0:  "einem wolkenlosen Himmel",
        1:  "fast keinen Wolken",
        2:  "leichter Bewölkung",
        3:  "bedecktem Himmel",
        45: "etwas Nebel",
        48: "viel Nebel",
        51: "leichtem Nieselregen",
        53: "Nieselregen",
        55: "starkem Nieselregen",
        61: "leichtem Regen",
        63: "Regen",
        65: "starkem Regen",
        66: "Schneeregen",
        67: "starkem Schneeregen",
        71: "leichtem Schneefall",
        73: "Schneefall",
        75: "starkem Schneefall",
        95: "einem Gewitter"
    };

    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&hourly=temperature_2m,weathercode&forecast_days=2`);
        const data = await response.json();

        const now = new Date();
        const currentHour = now.getHours();
        const targetHour = currentHour + offset;

        if (targetHour >= data.hourly.temperature_2m.length) {
            return "Das ist zu weit in der Zukunft";
        }

        const temp = data.hourly.temperature_2m[targetHour];
        const code = data.hourly.weathercode[targetHour];

        const condition = weatherMaster[code] || "unbekannten Wetterbedingungen";
        
        if (offset === 0) {
            return `Es sind aktuell ${temp} Grad bei ${condition}.`;
        } else {
            return `In ${offset} Stunden wird es hier etwa ${temp} Grad warm sein bei ${condition}.`;
        }
    } catch (err) {
        return "Die Wetterstation antwortet gerade nicht.";
    }
  },

  askAI: async (question) => {
    const ai_instructions = getAIInstructions();

    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistral-medium-latest",
          messages: [
            { role: "system", content: ai_instructions },
            { role: "user", content: question }
          ]
        })
      });

      const data = await res.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        return "Die Zentrale ist gerade am streiken";
      }

    } catch (e) {
      return "Die Zentrale ist gerade nicht erreichbar";
    }
  },
}  
const mappings = [
  // --- System & Status ---
  { keywords: ['status'], action: 'getSystemStatus' },
  { keywords: ['wie', 'geht'], action: 'getSystemStatus' },
  { keywords: ['temperatur'], action: 'getSystemStatus' },
  
  { keywords: ['starte', 'neu'], action: 'reboot' },
  { keywords: ['reboot'], action: 'reboot' },
  
  { keywords: ['feierabend'], action: 'fullShutdown' },
  { keywords: ['alles', 'aus'], action: 'fullShutdown' },
  { keywords: ['schlafenszeit'], action: 'fullShutdown' },

  // --- Box Power & Input ---
  { keywords: ['box', 'an'], action: 'boxOn' },
  { keywords: ['musik', 'an'], action: 'boxOn' },
  { keywords: ['lautsprecher', 'an'], action: 'boxOn' },
  
  { keywords: ['box', 'aus'], action: 'boxOff' },
  { keywords: ['musik', 'aus'], action: 'boxOff' },
  { keywords: ['lautsprecher', 'aus'], action: 'boxOff' },

  // --- Lautstärke ---
  { keywords: ['box', 'lauter'], action: 'boxLauter', param: /(\d+)/ },
  { keywords: ['musik', 'lauter'], action: 'boxLauter', param: /(\d+)/ },
  
  { keywords: ['box', 'leiser'], action: 'boxLeiser', param: /(\d+)/ },
  { keywords: ['musik', 'leiser'], action: 'boxLeiser', param: /(\d+)/ },
  
  { keywords: ['lautstärke'], action: 'boxSetVolume', param: /(\d+)/ },
  { keywords: ['setze', 'vol'], action: 'boxSetVolume', param: /(\d+)/ },

  // --- Playback Steuerung ---
  { keywords: ['pause'], action: 'boxPause' },
  { keywords: ['stopp'], action: 'boxPause' },
  { keywords: ['anhalt'], action: 'boxPause' },
  
  { keywords: ['play'], action: 'boxPlay' },
  { keywords: ['spiel', 'weiter'], action: 'boxPlay' },

  { keywords: ['nächster'], action: 'boxSkipSong' },
  { keywords: ['skip'], action: 'boxSkipSong' },
  { keywords: ['weiter'], action: 'boxSkipSong' },
  
  { keywords: ['zurück'], action: 'boxPrevSong' },
  { keywords: ['vorheriger'], action: 'boxPrevSong' },

  // --- Informationen ---
  { keywords: ['welcher', 'song'], action: 'boxGetSongData' },
  { keywords: ['wie', 'song'], action: 'boxGetSongData' },
  { keywords: ['was', 'spielt'], action: 'boxGetSongData' },
  { keywords: ['interpret'], action: 'boxGetSongData' },
  
  { keywords: ['wetter'], action: 'getWeather', param: /(\d+)/ },
  { keywords: ['wie', 'warm'], action: 'getWeather', param: /(\d+)/ },
  { keywords: ['regen'], action: 'getWeather', param: /(\d+)/ },

  { keywords: ['mistral'], action: 'askAi', param: /(?<=mistral\s).*/i},
]

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

//#region SMART_HOME
const boxRequest = async (path) => {
  try {
    const response = await fetch(`http://${MUSIC_BOX_IP}/YamahaExtendedControl/v1/${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    return await response.json(); 
  } catch (err) {
    console.error("Jarvis Music-Modul Fehler:", err.message);
    return { response_code: -1, error: err.message };
  }
};

app.get('/api/box/power/:state', (req, res) => {
  boxRequest(`main/setPower?power=${req.params.state}`);
  res.status(200).json('OK');
});

app.get('/api/box/volume/:change', (req, res) => {
  const linkVar = req.params.change === 'up' ? 'up&step=2' : 'down&step=2';
  boxRequest(`main/setVolume?volume=${linkVar}`);
  res.status(200).json('OK');
});

app.get('/api/box/input/:value', (req, res) => {
  const linkVar = req.params.value;
  boxRequest(`main/setInput?input=${linkVar}`);
  res.status(200).json('OK');
});

app.post('/api/jarvis/', async (req, res) => {
  if (!req.body) {
    res.status(400).json('Body ist leer');
    return;
  }

  let { body } = req.body;
  body = body.split(',')[0]

  if (Array.isArray(body)) {
    res.status(400).json('Das Ergebnis kam als array an');
    return;
  }  

  let input = body.replace(/[.,!?]/gi, '');
  
  const result = await handleSpeech(input);

  console.log(`Result: ${result}, input: ${input}`)
  
  res.status(200).json(result)
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
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Fehler: ${error.message}`);
            return;
        }
        if (stderr) {
            console.warn(`Stderr: ${stderr}`);
        }
        return stdout;
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

async function handleSpeech(input) {
  const text = input.toLowerCase();

  const match = mappings.find(m => m.keywords.every(kw => text.includes(kw)));

  if (match) {
    let param = null;

    if (match.param) {
      const result = text.match(match.param); // filter for params with regex from match param field
      if (result) param = result[0];
    }
    let res = 'Okay'
    res = await commands[match.action](param);
    return res || 'Okay';
  }
  
  console.log('AI fallback');
  return await commands.askAI(input);
}

//#endregion

// Server starten
app.listen(PORT, async () => {
  console.log(`Server läuft auf Port ${PORT}`);

  // Einmal sofort beim Start ausführen
  await updateStats();
  setInterval(updateStats, 60000);
});

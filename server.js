//#region Imports, Express, __dirname
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import si from 'systeminformation';
import 'dotenv/config';
import { PORT } from './config/env.js';

const app = express();

// __dirname für ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//#endregion

//#region Express-config
// statische Dateien (HTML + JS + CSS)
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//#endregion

//#region Web-Pages
app.get('/', (req, res) => {

  res.render('index', {

  });
});

app.get('/stats', async (req, res) => {
  const cpu = await si.currentLoad();
  const mem = await si.mem();
  const ram = (mem.used / 1024 / 1024 / 1024).toFixed(2) + ' GB / ' + (mem.total / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  const tempData = await si.cpuTemperature();
  const disk = await si.fsSize();
  const diskText = (disk[0].used / 1024 / 1024 / 1024).toFixed(2) + ' GB / ' + (disk[0].size / 1024 / 1024 / 1024).toFixed(2) + ' GB';

  res.render('stats', {
    cpu: cpu.currentLoad.toFixed(2), // <- das ist jetzt die Zahl
    ram: ram,
    temp: tempData.main || 'N/A',
    disk: diskText,
  });
});

app.get('/homework', (req, res) => {

  res.render('homework', {

  });
});
//#endregion

//#region APIs
//#endregion

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

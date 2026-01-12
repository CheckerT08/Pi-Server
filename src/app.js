// src/app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import si from 'systeminformation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// statische Dateien (HTML + JS + CSS)
app.use(express.static(path.join(__dirname, '../public')));

// API-Route für Stats
app.get('/api/raspi-stats', async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const tempData = await si.cpuTemperature();
    const disk = await si.fsSize();

    res.json({
      cpuLoad: cpu.currentLoad.toFixed(1),
      ramUsed: ((mem.used / 1024 / 1024 / 1024).toFixed(2)) + ' GB',
      ramTotal: ((mem.total / 1024 / 1024 / 1024).toFixed(2)) + ' GB',
      temperature: tempData.main || 'N/A',
      diskUsed: ((disk[0].used / 1024 / 1024 / 1024).toFixed(2)) + ' GB',
      diskTotal: ((disk[0].size / 1024 / 1024 / 1024).toFixed(2)) + ' GB'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;

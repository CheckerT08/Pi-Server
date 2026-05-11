import si from 'systeminformation';

export let stats = { cpu: '...', ram: '...', temp: '...', diskText: '...' };

async function updateStats() {
  try {
    const mem = await si.mem();
    const load = await si.currentLoad();
    const tempData = await si.cpuTemperature();
    const disk = await si.fsSize();

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

await updateStats();
setInterval(updateStats, 60000);
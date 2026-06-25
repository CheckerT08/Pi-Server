import { exec } from 'child_process';
import si from 'systeminformation';
import { promisify } from 'util';

export let stats = { cpu: '...', ram: '...', temp: '...', diskText: '...' };
const execPromise = promisify(exec);

// old exec with callbacks, new with async await
export async function runCommand(cmd) {
    try {
        console.log(`Running command ${cmd}...`);

        const { stdout, stderr } = await execPromise(cmd);
        
        if (stderr) {
            console.warn(`Stderr: ${stderr}`);
        }
        
        console.log(stdout);
        
        return stdout;
    } catch (error) {
        console.error(`Command "${cmd}" failed: ${error.message}`);
    }
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));



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


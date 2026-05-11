import fs from 'fs';
import path from 'path';
import { LATITUDE, LONGITUDE, MISTRAL_API_KEY } from './config/env.js';
import { boxRequest, runCommand } from './helper_funcs.js';
import { stats } from './stats.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export const commands = {
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
    fetch('https://ntfy.sh/BluetoothOn_2147483647', {
      method: 'POST'
    });
    return 'Box eingeschaltet';
  },

  boxOff: async () => {
    boxRequest(`main/setPower?power=standby`);
    fetch('https://ntfy.sh/BluetoothOff_2147483647', {
      method: 'POST'
    });
    return 'Box ausgeschaltet';
  },

  boxLauter: async (addVolume) => {
    const change = parseInt(addVolume) || 3;
    const request = await boxRequest(`main/getStatus`);
    const volume = request.volume;
    await boxRequest(`main/setVolume?volume=${volume + change}`);
    return 'Box lauter gemacht';
  },

  boxLeiser: async (addVolume) => {
    const change = parseInt(addVolume) || 3;
    const request = await boxRequest(`main/getStatus`);
    const volume = request.volume;
    await boxRequest(`main/setVolume?volume=${volume - change}`);
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

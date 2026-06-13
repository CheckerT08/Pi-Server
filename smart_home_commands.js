import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCATION, MISTRAL_API_KEY, NTFY_BLUETOOTH_OFF, NTFY_BLUETOOTH_ON, NTFY_DLNA, NTFY_DLNAEND, NTFY_TIMER } from './config/env.js';
import { boxRequest, runCommand } from './helper_funcs.js';
import { stats } from './stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAIInstructions() {
  try {
    const filePath = path.join(__dirname, 'data', 'ai_instructions.txt');
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (err) {
    console.error("Konnte instructions.txt nicht laden, nutze Standard-Prompt.");
    console.error(err.message);
    return "Du bist ein hilfreicher Assistent.";
  }
}

let locationToCoordinateCache = {};

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
    fetch(`https://ntfy.sh/${NTFY_BLUETOOTH_ON}`, {
      method: 'POST'
    });
    return 'Box eingeschaltet';
  },

  boxOff: async () => {
    boxRequest(`main/setPower?power=standby`);
    fetch(`https://ntfy.sh/${NTFY_BLUETOOTH_OFF}`, {
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
      if (volume > 35) volume = 35;
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

  dlna: async (name) => {
    fetch(`https://ntfy.sh/${NTFY_DLNA}`, {
      method: 'POST',
      headers: {
        "Content-Type": "text/plain"
      },
      body: name
    });
    return 'Fernseher wurde gestartet';
  },

  dlnaend: async () => {
    fetch(`https://ntfy.sh/${NTFY_DLNAEND}`, {
      method: 'POST'
    });
    return 'Fernseher Server wurde gestoppt';
  },

  getWeather: async (hoursFromNow, locationInput) => {
    console.log(`weather: ${hoursFromNow}, ${locationInput}`)
    const offset = Math.max(0, parseInt(hoursFromNow) || 0);
    const location = (locationInput || LOCATION).trim();

    const weatherMaster = {
      0: "einem wolkenlosen Himmel",
      1: "fast keinen Wolken",
      2: "leichter Bewölkung",
      3: "bedecktem Himmel",
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
      let latitude;
      let longitude;
      let realName;

      if (locationToCoordinateCache[location]) {
        console.log(`cache ${location}`)
        const cached = locationToCoordinateCache[location];
        latitude = cached.latitude;
        longitude = cached.longitude;
        realName = cached.realName;
      } else {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de&format=json`);
        const geoData = await geoRes.json();
        console.log(`api ${location}`)
        if (!geoData.results || geoData.results.length === 0) {
          return `Ich konnte den Ort ${location} leider nicht finden.`;
        }

        latitude = geoData.results[0].latitude;
        longitude = geoData.results[0].longitude;
        realName = geoData.results[0].name;

        locationToCoordinateCache[location] = {
          latitude,
          longitude,
          realName
        };
      }
      console.log(locationToCoordinateCache)
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&forecast_days=2&timezone=auto`);
      const weatherData = await weatherRes.json();

      const now = new Date();
      const hourIndex = now.getHours() + offset;

      if (hourIndex >= weatherData.hourly.temperature_2m.length) {
        return "Das liegt zu weit in der Zukunft.";
      }

      const temp = Math.round(weatherData.hourly.temperature_2m[hourIndex]);
      const code = weatherData.hourly.weathercode[hourIndex];
      const condition = weatherMaster[code] || "unbekannten Wetterbedingungen";

      if (offset === 0) {
        return `In ${realName} ist es aktuell ${temp} Grad bei ${condition}.`;
      } else {
        const zeitText = offset === 1 ? "einer Stunde" : `${offset} Stunden`;
        return `In ${zeitText} werden es in ${realName} etwa ${temp} Grad sein bei ${condition}.`;
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

  setTimer: async (seconds, minutes, targetTimeString) => {
    let time = 0;

    if (targetTimeString) {
      const now = new Date();

      const nowMins = (now.getHours() * 60) + now.getMinutes();

      const [targetHour, targetMin] = targetTimeString.split(':').map(Number);
      let diffMins = (targetHour * 60) + targetMin;

      if (diffMins < nowMins) diffMins += 24 * 60;
      diffMins -= nowMins;

      time = diffMins * 60;
    } else {
      const min = parseInt(minutes) || 0;
      const sec = parseInt(seconds) || 0;

      time = min * 60 + sec;
    }

    if (!time || time == 0) return 'Keine Zeitangabe genannt';

    try {
      await fetch(`https://ntfy.sh/${NTFY_TIMER}`, {
        method: 'POST',
        body: String(time),
      });

      return `Timer ${time} Sekunden wurde im Hintergrund gestartet`;
    } catch (error) {
      console.error('Fehler beim ntfy-Fetch:', error);
      return 'Timer konnte nicht an ntfy gesendet werden';
    }
  }
}  

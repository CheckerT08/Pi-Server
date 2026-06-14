import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCATION, MISTRAL_API_KEY, NTFY_BLUETOOTH_OFF, NTFY_BLUETOOTH_ON, NTFY_DLNA, NTFY_DLNAEND, NTFY_TIMER } from './config/env.js';
import { boxRequest, runCommand } from './helper_funcs.js';
import { stats } from './stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for geocoding coordinates to reduce API calls
const locationToCoordinateCache = {};

function getAIInstructions() {
  try {
    const filePath = path.join(__dirname, 'data', 'ai_instructions.txt');
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (err) {
    console.error("Failed to load instructions.txt, using default prompt: ", err.message);
    return "Du bist ein hilfreicher Assistent.";
  }
}

export const commands = {
  getSystemStatus: async () => {
    console.log("Fetching system status...");
    // Replace . / for text-to-speech output
    const formattedTemp = stats.temp.replace('.', ',');
    const formattedRam = stats.ram.replace('/', ' von ');
    return `Temperatur ${formattedTemp}, Arbeitsspeicher ${formattedRam}`;
  },

  reboot: async () => {
    console.log("Triggering system reboot...");
    await runCommand('sudo reboot now');
    return 'Starte jetzt neu';
  },

  fullShutdown: async () => {
    console.log("Triggering full shutdown sequence...");
    try {
      await runCommand('ssh -o ConnectTimeout=5 laptop "/home/torbinho/.shutdown"');
    } catch (err) {
      console.error("Laptop shutdown command failed: ", err.message);
    }
    await commands.boxOff();
    return 'Alles aus. Bis bald';
  },

  boxOn: async () => {
    console.log("Turning audio box ON...");
    try {
      await boxRequest('main/setPower?power=on');
      
      // Switch input to bluetooth after 5 seconds init time
      setTimeout(async () => {
        try {
          console.log("Switching box input to bluetooth...");
          await boxRequest(`main/setInput?input=bluetooth`);
        } catch (err) {
          console.error("Failed to switch box input to bluetooth:", err.message);
        }
      }, 5000);

      await fetch(`https://ntfy.sh/${NTFY_BLUETOOTH_ON}`, { method: 'POST' });
      return 'Box eingeschaltet';
    } catch (err) {
      console.error("Failed to turn on the box:", err.message);
      return 'Box konnte nicht eingeschaltet werden';
    }
  },

  boxOff: async () => {
    console.log("Turning audio box OFF (Standby)...");
    try {
      await boxRequest(`main/setPower?power=standby`);
      await fetch(`https://ntfy.sh/${NTFY_BLUETOOTH_OFF}`, { method: 'POST' });
      return 'Box ausgeschaltet';
    } catch (err) {
      console.error("Failed to turn off the box:", err.message);
      return 'Box konnte nicht ausgeschaltet werden';
    }
  },

  boxLauter: async (addVolume) => {
    const change = parseInt(addVolume) || 3;
    console.log(`Increasing box volume by ${change}...`);
    try {
      const status = await boxRequest(`main/getStatus`);
      const currentVolume = status?.volume || 20;
      await boxRequest(`main/setVolume?volume=${currentVolume + change}`);
      return 'Box lauter gemacht';
    } catch (err) {
      console.error("boxLauter failed:", err.message);
      return 'Lautstärke konnte nicht geändert werden';
    }
  },

  boxLeiser: async (addVolume) => {
    const change = parseInt(addVolume) || 3;
    console.log(`Decreasing box volume by ${change}...`);
    try {
      const status = await boxRequest(`main/getStatus`);
      const currentVolume = status?.volume || 20;
      await boxRequest(`main/setVolume?volume=${currentVolume - change}`);
      return 'Box leiser gemacht';
    } catch (err) {
      console.error("boxLeiser failed:", err.message);
      return 'Lautstärke konnte nicht geändert werden';
    }
  },

  boxSetVolume: async (volume) => {
    const targetVolume = parseInt(volume);
    if (!targetVolume || targetVolume === 0) {
      return 'Keine Lautstärke genannt. Nichts verändert.';
    }

    console.log(`Setting box volume to ${targetVolume}...`);
    try {
      // Safety cap
      const safeVolume = targetVolume > 35 ? 35 : targetVolume;
      await boxRequest(`main/setVolume?volume=${safeVolume}`);
      return `Lautstärke auf ${safeVolume} geändert`;
    } catch (err) {
      console.error("boxSetVolume failed:", err.message);
      return 'Lautstärke konnte nicht gesetzt werden';
    }
  },

  boxSkipSong: async () => {
    console.log("Skipping song...");
    try { 
      await boxRequest(`netusb/setPlayback?playback=next`); 
      return 'Song übersprungen'; 
    } catch (err) { 
      console.error("boxSkipSong failed:", err.message);
      return 'Aktion fehlgeschlagen'; 
    }
  },

  boxPrevSong: async () => {
    console.log("Going back to previous song...");
    try { 
      await boxRequest(`netusb/setPlayback?playback=previous`); 
      return 'Song zurück'; 
    } catch (err) { 
      console.error("boxPrevSong failed:", err.message);
      return 'Aktion fehlgeschlagen'; 
    }
  },

  boxPause: async () => {
    console.log("Pausing music playback...");
    try { 
      await boxRequest(`netusb/setPlayback?playback=pause`); 
      return 'Musik pausiert'; 
    } catch (err) { 
      console.error("boxPause failed:", err.message);
      return 'Aktion fehlgeschlagen'; 
    }
  },

  boxPlay: async () => {
    console.log("Resuming music playback...");
    try { 
      await boxRequest(`netusb/setPlayback?playback=play`); 
      return 'Spiele weiter'; 
    } catch (err) { 
      console.error("boxPlay failed:", err.message);
      return 'Aktion fehlgeschlagen'; 
    }
  },

  boxGetSongData: async () => {
    console.log("Fetching current song info...");
    try {
      const res = await boxRequest(`netusb/getPlayInfo`);
      if (!res || !res.artist || !res.track) return 'Es spielt gerade nichts';
      return `Gerade spielt ${res.track} von ${res.artist}`;
    } catch (err) {
      console.error("Failed to fetch song data:", err.message);
      return 'Songdaten konnten nicht abgerufen werden';
    }
  },

  dlna: async (name) => {
    console.log(`Starting TV DLNA server for content: ${name}...`);
    try {
      await fetch(`https://ntfy.sh/${NTFY_DLNA}`, {
        method: 'POST',
        headers: { "Content-Type": "text/plain" },
        body: name
      });
      return 'Fernseher wurde gestartet';
    } catch (err) {
      console.error("DLNA start notification failed:", err.message);
      return 'Fernseher-Notification fehlgeschlagen';
    }
  },

  dlnaend: async () => {
    console.log("Stopping TV DLNA server...");
    try {
      await fetch(`https://ntfy.sh/${NTFY_DLNAEND}`, { method: 'POST' });
      return 'Fernseher Server wurde gestoppt';
    } catch (err) {
      console.error("DLNA stop notification failed:", err.message);
      return 'Fernseher-Ende-Notification fehlgeschlagen';
    }
  },

  getWeather: async (hoursFromNow, locationInput) => {
    const offset = Math.max(0, parseInt(hoursFromNow) || 0);
    const location = (locationInput || LOCATION).trim();
    console.log(`Fetching weather for location: "${location}" with offset +${offset}h`);

    const weatherMaster = {
      0: "einem wolkenlosen Himmel", 1: "fast keinen Wolken", 2: "leichter Bewölkung",
      3: "bedecktem Himmel", 45: "etwas Nebel", 48: "viel Nebel",
      51: "leichtem Nieselregen", 53: "Nieselregen", 55: "starkem Nieselregen",
      61: "leichtem Regen", 63: "Regen", 65: "starkem Regen",
      66: "Schneeregen", 67: "starkem Schneeregen", 71: "leichtem Schneefall",
      73: "Schneefall", 75: "starkem Schneefall", 95: "einem Gewitter"
    };

    try {
      let latitude, longitude, realName;

      // Check cache first to save geocoding API limits
      if (locationToCoordinateCache[location]) {
        console.log(`Using cached coordinates for ${location}`);
        ({ latitude, longitude, realName } = locationToCoordinateCache[location]);
      } else {
        console.log(`Calling Geocoding API for ${location}...`);
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de&format=json`);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
          console.warn(`Location not found: ${location}`);
          return `Ich konnte den Ort ${location} leider nicht finden.`;
        }

        ({ latitude, longitude, name: realName } = geoData.results[0]);
        locationToCoordinateCache[location] = { latitude, longitude, realName };
      }

      // Fetch forecast data
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&forecast_days=2&timezone=auto`);
      const weatherData = await weatherRes.json();

      const now = new Date();
      const hourIndex = now.getHours() + offset;

      // Prevent array index out of bounds if offset is too large
      if (!weatherData.hourly || !weatherData.hourly.temperature_2m || hourIndex >= weatherData.hourly.temperature_2m.length) {
        return "Das liegt zu weit in der Zukunft oder die Wetterdaten sind unvollständig.";
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
      console.error("Weather API request failed:", err.message);
      return "Die Wetterstation antwortet gerade nicht.";
    }
  },

  askAI: async (question) => {
    console.log(`Forwarding query to Mistral AI: "${question}"`);
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
      return data.choices?.[0]?.message?.content || "Die Zentrale streikt gerade.";
    } catch (err) {
      console.error("Mistral AI API call failed:", err.message);
      return "Die Zentrale ist gerade nicht erreichbar";
    }
  },

  setTimer: async (seconds, minutes, targetTimeString) => {
    let time = 0;

    if (targetTimeString) {
      // Calculate countdown time from a absolute timestamp
      const now = new Date();
      const nowMins = (now.getHours() * 60) + now.getMinutes();

      const [targetHour, targetMin] = targetTimeString.split(':').map(Number);
      let diffMins = (targetHour * 60) + targetMin;

      if (diffMins < nowMins) diffMins += 24 * 60; // Handle next day
      diffMins -= nowMins;
      time = diffMins * 60;
    } else {
      // Calculate countdown time from relative duration inputs
      const min = parseInt(minutes) || 0;
      const sec = parseInt(seconds) || 0;
      time = min * 60 + sec;
    }

    if (!time || time <= 0) return 'Keine gültige Zeitangabe genannt';

    console.log(`Starting background timer for ${time} seconds via ntfy...`);
    try {
      await fetch(`https://ntfy.sh/${NTFY_TIMER}`, {
        method: 'POST',
        body: String(time),
      });
      return `Timer für ${time} Sekunden wurde gestartet`;
    } catch (err) {
      console.error('Failed to send timer to ntfy:', err.message);
      return 'Timer konnte nicht gestartet werden';
    }
  }
};

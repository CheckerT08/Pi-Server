import { NTFY_BLUETOOTH_OFF, NTFY_BLUETOOTH_ON } from "../config/env.js";
import { MUSIC_BOX_IP } from "../config/env.js";

async function boxRequest(path) {
  try {
    const response = await fetch(`http://${MUSIC_BOX_IP}/YamahaExtendedControl/v1/${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    return await response.json(); 
  } catch (err) {
    console.error("Box Request error: ", err.message);
    // handled from method caller
    throw new Error(err.message);
  }
};


export const boxCommands = {
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
}
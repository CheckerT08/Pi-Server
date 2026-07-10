import { KÜCHE_BOX_IP, MUSIC_BOX_IP, NTFY_BLUETOOTH_OFF, NTFY_BLUETOOTH_ON, WOHNZIMMER_BOX_IP } from "../config/env.js";
import { sleep } from "../helper_funcs.js";

async function boxRequest(path, ip) {
  if (!ip) return;

  try {
    const response = await fetch(`http://${ip}/YamahaExtendedControl/v1/${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return await response.json();
  } catch (err) {
    console.error("Box Request error: ", err.message);
    // handled from method caller
    throw new Error(err.message);
  }
};

async function waitForDeviceResponding(ip, maxAttempts) {
  if (!ip) return false;

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;

    try {
      const result = await boxRequest('main/getStatus', ip);
      if (result && result.power) {
        return true;
      }
    } catch (err) {
      console.log('Error while waiting for device to turn on:', err.message, 'at Atempt', attempts);
    }

    await sleep(500);
  }

  console.log('Device not responded. Terminating.')
  return false;
}

let currentDevice = '';
const deviceNameToIp = {
  'box': MUSIC_BOX_IP,
  'küche': KÜCHE_BOX_IP,
  'wohnzimmer': WOHNZIMMER_BOX_IP,
}
const currentIp = () => { return deviceNameToIp[currentDevice] || ''; };

async function toggleDevice(connected, device = currentDevice) {
  const isPassive = !(device in deviceNameToIp);

  let powerState = connected ? 'on' : 'standby';
  try {
    if (!isPassive && device !== '') {
      await boxRequest(`main/setPower?power=${powerState}`, deviceNameToIp[device]);
      if (connected && await waitForDeviceResponding(deviceNameToIp[device], 20)) { // if connected false skip waiting
        try {
          console.log('Switching input to bluetooth...');
          await boxRequest('main/setInput?input=bluetooth', deviceNameToIp[device]);
        } catch (err) {
          console.error('Failed to switch box input to bluetooth:', err.message);
        }		
      }

    } else if (device === '') {
      console.log(`Target Device was empty. Cancelling!`);
      return;
    }

    if (device !== 'handy') {
      const targetURL = 'https://ntfy.sh/' + (connected ? NTFY_BLUETOOTH_ON : NTFY_BLUETOOTH_OFF);
      await fetch(targetURL, { method: 'POST', body: (connected ? device : '') });
    }

    currentDevice = device;
  } catch (err) {
    console.log(`Failed to toggle device "${device}": `, err.message);
  }
}
async function switchToDevice(device) {
  await toggleDevice(false);
  await sleep(3000);
  await toggleDevice(true, device);
}

export const boxCommands = {
  switchAudioDevice: async (device) => {
    await switchToDevice(device);
    return `Zu Gerät ${device} gewechselt`;
  },

  boxLauter: async (addVolume) => {
    const change = parseInt(addVolume) || 3;
    console.log(`Increasing box volume by ${change}...`);
    try {
      const status = await boxRequest(`main/getStatus`, currentIp());
      const currentVolume = status?.volume || 20;
      await boxRequest(`main/setVolume?volume=${currentVolume + change}`, currentIp());
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
      const status = await boxRequest(`main/getStatus`, currentIp());
      const currentVolume = status?.volume || 20;
      await boxRequest(`main/setVolume?volume=${currentVolume - change}`, currentIp());
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
      await boxRequest(`main/setVolume?volume=${safeVolume}`, currentIp());
      return `Lautstärke auf ${safeVolume} geändert`;
    } catch (err) {
      console.error("boxSetVolume failed:", err.message);
      return 'Lautstärke konnte nicht gesetzt werden';
    }
  },

  boxSkipSong: async () => {
    console.log("Skipping song...");
    try {
      await boxRequest(`netusb/setPlayback?playback=next`, currentIp());
      return 'Song übersprungen';
    } catch (err) {
      console.error("boxSkipSong failed:", err.message);
      return 'Aktion fehlgeschlagen';
    }
  },

  boxPrevSong: async () => {
    console.log("Going back to previous song...");
    try {
      await boxRequest(`netusb/setPlayback?playback=previous`, currentIp());
      return 'Song zurück';
    } catch (err) {
      console.error("boxPrevSong failed:", err.message);
      return 'Aktion fehlgeschlagen';
    }
  },

  boxPause: async () => {
    console.log("Pausing music playback...");
    try {
      await boxRequest(`netusb/setPlayback?playback=pause`, currentIp());
      return 'Musik pausiert';
    } catch (err) {
      console.error("boxPause failed:", err.message);
      return 'Aktion fehlgeschlagen';
    }
  },

  boxPlay: async () => {
    console.log("Resuming music playback...");
    try {
      await boxRequest(`netusb/setPlayback?playback=play`, currentIp());
      return 'Spiele weiter';
    } catch (err) {
      console.error("boxPlay failed:", err.message);
      return 'Aktion fehlgeschlagen';
    }
  },

  boxGetSongData: async () => {
    console.log("Fetching current song info...");
    try {
      const res = await boxRequest(`netusb/getPlayInfo`, currentIp());
      if (!res || !res.artist || !res.track) return 'Es spielt gerade nichts';
      return `Gerade spielt ${res.track} von ${res.artist}`;
    } catch (err) {
      console.error("Failed to fetch song data:", err.message);
      return 'Songdaten konnten nicht abgerufen werden';
    }
  },
}
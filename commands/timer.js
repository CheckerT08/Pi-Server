import { NTFY_TIMER } from "../config/env.js";

export const timerCommands = {
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

    if (!time || time <= 0) return 'Keine gültige Zeitangabe genannt';

    console.log(`Starting background timer for ${time / 60} minutes via ntfy...`);
    try {
      await fetch(`https://ntfy.sh/${NTFY_TIMER}`, {
        method: 'POST',
        body: String(time),
      });
      return `Timer für ${Math.floor(time / 60)} Minuten wurde gestartet`;
    } catch (err) {
      console.error('Failed to send timer to ntfy:', err.message);
      return 'Timer konnte nicht gestartet werden';
    }
  },
}
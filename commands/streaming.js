import { NTFY_DLNA, NTFY_DLNAEND } from "../config/env.js";

export const streamingCommands = {
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
}
import { runCommand } from "../helper_funcs.js";
import { commands } from "../smart_home_commands.js";
import { stats } from "../stats.js";

export const systemCommands = {
  getSystemStatus: async () => {
    console.log("Fetching system status...");
    // Replace . / for text-to-speech output
    const formattedTemp = stats.temp.replace('.', ',');
    const formattedRam = stats.ram.replace('/', ' von ');
    return `Temperatur ${formattedTemp}, Arbeitsspeicher ${formattedRam}`;
  },

  reboot: async () => {
    console.log("Triggering system reboot...");
    await runCommand('sleep 5 && sudo reboot now');
    return 'Starte sofort neu';
  },

  fullShutdown: async () => {
    console.log("Triggering full shutdown sequence...");
    try {
      await runCommand('ssh -o ConnectTimeout=5 laptop "/home/torbinho/.shutdown &"');
    } catch (err) {
      console.error("Laptop shutdown command failed: ", err.message);
    }
    await commands.boxOff();
    return 'Alles aus. Bis bald';
  },
}
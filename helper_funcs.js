import { exec } from 'child_process';
import { MUSIC_BOX_IP } from './config/env.js';
import { commands } from './smart_home_commands.js';
import { mappings } from './smart_home_mappings.js';
import { promisify } from 'util';

export const boxRequest = async (path) => {
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

// old exec with callbacks, new with async await
const execPromise = promisify(exec);
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

export async function handleSpeech(input) {
    const text = input.toLowerCase().trim();

    const match = mappings.find(m => m.keywords.every(kw => text.includes(kw)));

    if (!match) {
        console.log(`AI-Fallback: "${input}"`);
        return await commands.askAI(input);
    }

    const extractedArgs = [];
    if (Array.isArray(match.params)) {
        for (const regex of match.params) {
            const result = text.match(regex);
            extractedArgs.push(result ? (result[1] || result[0]) : null);
        }
    }

    const commandFunc = commands[match.action];
    if (typeof commandFunc !== 'function') {
        console.error(`Action "${match.action}" not found`);
        return 'Keine Aktion zugewiesen!';
    }

    try {
        const response = await commandFunc(...extractedArgs);
        return response || 'Okay';
    } catch (cmdError) {
        console.error(`Failed to run ${match.action}: `, cmdError);
        return `Fehler beim Ausführen von Befehl ${match.action}`;
    }
}
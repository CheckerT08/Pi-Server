import { exec } from 'child_process';
import { MUSIC_BOX_IP } from './config/env.js';
import { commands } from './smart_home_commands.js';
import { mappings } from './smart_home_mappings.js';

export const boxRequest = async (path) => {
  try {
    const response = await fetch(`http://${MUSIC_BOX_IP}/YamahaExtendedControl/v1/${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    return await response.json(); 
  } catch (err) {
    console.error("Jarvis Music-Modul Fehler:", err.message);
    return { response_code: -1, error: err.message };
  }
};

export const runCommand = (cmd, res) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Fehler: ${error.message}`);
            return;
        }
        if (stderr) {
            console.warn(`Stderr: ${stderr}`);
        }
        return stdout;
    });
};

export async function handleSpeech(input) {
  const text = input.toLowerCase();

  const match = mappings.find(m => m.keywords.every(kw => text.includes(kw)));

  if (match) {
    let extractedArgs = [];

    if (match.params && Array.isArray(match.params)) {
      match.params.forEach((p) => {
        const result = text.match(p);
        extractedArgs.push(result ? result[1] || result[0] : null);
      });
    }
    let res = 'Okay'

    if (typeof commands[match.action] === 'function') {
      res = await commands[match.action](...extractedArgs);
    } else {
      console.error(`Action ${match.action} not found!`);
      res = 'Keine Aktion zugewiesen!';
    }
    return res || 'Okay';
  }
  
  console.log('AI fallback');
  return await commands.askAI(input);
}

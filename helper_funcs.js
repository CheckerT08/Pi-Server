import { exec } from 'child_process';
import { MUSIC_BOX_IP } from './config/env.js';
import { commands } from './smart_home_commands.js';
import { mappings } from './smart_home_mappings.js';
import { vocab } from './vocabulary_manager.js';

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
    let param = null;

    if (match.param) {
      const result = text.match(match.param); // filter for params with regex from match param field
      if (result) param = result[0];
    }
    let res = 'Okay'
    res = await commands[match.action](param);
    return res || 'Okay';
  }
  
  console.log('AI fallback');
  return await commands.askAI(input);
}

export function getRandomVocab() {
  const keys = Object.keys(vocab);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const { other } = vocab[randomKey];
  return { randomKey, other }
}
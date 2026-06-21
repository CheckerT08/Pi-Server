import fs from 'fs';
import path from "path";
import { MISTRAL_API_KEY } from '../config/env.js';

function getAIInstructions() {
  try {
    const filePath = path.join(__dirname, 'data', 'ai_instructions.txt');
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (err) {
    console.error("Failed to load instructions.txt, using default prompt: ", err.message);
    return "Du bist ein hilfreicher Assistent.";
  }
}

export const aiCommands = {
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
}
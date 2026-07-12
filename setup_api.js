import express from 'express';
import { NTFY_GET_CLIPBOARD, NTFY_SET_CLIPBOARD } from './config/env.js';
import { runCommand } from './helper_funcs.js';
import { homework, saveHomework, Task } from './homework_manager.js';
import { commands } from './smart_home_commands.js';
import { mappings } from './smart_home_mappings.js';

export function setupCodeServerApi(app) {
  app.get('/api/code-start', (req, res) => {
    runCommand('systemctl --user start code-server');
    console.log('Starting Code Server');
    res.status(200).json('Code gestartet');
  });

  app.get('/api/code-stop', (req, res) => {
    runCommand('systemctl --user stop code-server');
    console.log('Stopping Code Server');
    res.status(200).json('Code gestoppt');
  });
}

export function setupHomeworkApi(app) {
  app.get('/api/homework', (req, res) => {
    res.status(200).json(homework || []);
  });

  app.post('/api/homework', (req, res) => {
    const { name, description, dueDate, subject } = req.body;

    try {
      const task = new Task({
        name: name || "Neue Aufgabe",
        description: description || "",
        dueDate: dueDate || new Date(),
        subject: subject || "",
        done: false
      });
      console.log(`Created new task: ${task.name}`)
      homework.push(task);
      saveHomework(homework);
      res.status(201).json(task);
    } catch (err) {
      console.log(`Failed to create new task: ${err.message}`)
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/homework/:id', (req, res) => {
    const { id } = req.params;
    const task = homework.find(t => t.id === id);
    console.log(`Updating ${task.name}`)

    if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

    const { name, description, dueDate, subject } = req.body;
    if (name) task.name = name;
    if (description) task.description = description;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (subject) task.subject = subject;

    saveHomework(homework);
    res.status(200).json(task);
  });

  app.post('/api/homework/:id/complete', (req, res) => {
    const { id } = req.params;
    const task = homework.find(t => t.id === id);
    console.log(`Completing ${task.name}`)
    if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

    task.complete();
    saveHomework(homework);
    res.status(200).json(task);
  });

  app.delete('/api/homework/:id', (req, res) => {
    const index = homework.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Nicht gefunden" });

    console.log(`Deleting task ${index}`)
    homework.splice(index, 1);
    saveHomework(homework);
    res.json({ success: true });
  });
}

let clipboard = '';
let clipboardSentFromPhone = false;
export function setupClipboardApi(app) {
  // laptop to phone
  app.post('/api/clipboard', express.text({ type: '*/*' }), async (req, res) => {
    try {
      if (!req.body) return res.sendStatus(400);

      await fetch(`https://ntfy.sh/${NTFY_SET_CLIPBOARD}`, {
        method: 'POST',
        body: req.body,
      });

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

  // phone to laptop
  app.get('/api/clipboard', async (req, res) => {
    clipboardSentFromPhone = false
    try {
      await fetch(`https://ntfy.sh/${NTFY_GET_CLIPBOARD}`, { method: 'POST' });
    } catch (err) {
      console.error("ntfy failed:", err);
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;

      if (clipboardSentFromPhone) {
        clearInterval(interval);
        return res.send(clipboard);
      }

      if (attempts > 50) {
        clearInterval(interval);
        return res.status(408).send("Timeout: phone not reached.");
      }
    }, 100);
  });

  // called from phone 
  app.post('/api/clipboard/phone', express.text({ type: '*/*' }), (req, res) => {
    if (req.body) {
      clipboard = req.body.text;
      clipboardSentFromPhone = true;
      console.log("Clipboard received from phone:", clipboard);
      return res.sendStatus(200);
    }
    res.sendStatus(400);
  });
}

async function handleSpeech(input) {
  const text = input.toLowerCase().trim();

  const match = mappings.find(m => m.keywords.every(kw => text.includes(kw)));

  if (!match) {
    console.log(`AI-Fallback: "${input}"`);
    return await commands.askAI(input);
  }

  const extractedArgs = [];
  if (Array.isArray(match.params)) {
    for (const regex of match.params) {
      const matchResult = text.match(regex);

      if (matchResult) {
        let value = matchResult[1] || matchResult[0];
        value = value.trim();
        extractedArgs.push(value);
      } else {
        extractedArgs.push(null);
      }
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

export function setupJarvisApi(app) {
  app.post('/api/jarvis/', express.text({type: ['text/plain', 'application/x-www-form-urlencoded']}), async (req, res) => {
    try {
      const rawInput = typeof req.body === 'object' ? req.body?.body : req.body;
      if (!rawInput) return res.status(200).json('Du hast nichts gesagt, oder?');

      const cleanInput = rawInput.replace(/[.!?,]/gi, '');

      // filter(Boolean) => remove empty/falsy slots; Boolean as function callback
      const segments = cleanInput.split(/\s+und\s+/i).filter(Boolean);

      const results = [];
      for (const segment of segments) {
        const answer = await handleSpeech(segment.trim());
        results.push(answer);
      }

      const finalResult = results.join(' und ');

      console.log(`Input: "${cleanInput}" => Result: "${finalResult}"`);
      return res.status(200).json(finalResult);

    } catch (error) {
      console.error('Fehler in /api/jarvis/:', error);
      return res.status(500).json('Da ist intern etwas schiefgelaufen.');
    }
  });
}

import { runCommand } from './helper_funcs.js';
import { homework, saveHomework, Task } from './homework_manager.js';
import { vocab } from './vocabulary_manager.js';
import { saveVocab } from './vocabulary_manager.js';

export function setupMiscApi(app) {
  app.get('/api/code-start', (req, res) => {
    runCommand('systemctl --user start code-server', res);
    res.status(200);
  });

  app.get('/api/code-stop', (req, res) => {
    runCommand('systemctl --user stop code-server', res);
    res.status(200);
  });

  app.get("/api/homework", (req, res) => {
    res.json(homework);
  });

  app.post("/api/homework", (req, res) => {
    const { name, description, dueDate, subject } = req.body;
    try {
      const task = new Task({
        name: name || "Neue Aufgabe",
        description: description || "",
        dueDate: dueDate || new Date(),
        subject: subject || "",
        done: false
      });
      console.log(`Neue task erstellt: ${task.name}`)
      homework.push(task);
      saveHomework(homework);
      res.status(201).json(task); // Wichtig für das Frontend!
    } catch (err) {
      console.log(err)
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/homework/:id", (req, res) => {
    const { id } = req.params;
    const task = homework.find(t => t.id === id);
    console.log(`Bearbeite ${task.name}`)

    if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

    const { name, description, dueDate, subject } = req.body;
    if (name) task.name = name;
    if (description) task.description = description;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (subject) task.subject = subject;

    saveHomework(homework);
    res.json(task);
  });

  app.post("/api/homework/:id/complete", (req, res) => {
    const { id } = req.params;
    const task = homework.find(t => t.id === id);
    console.log(`Erledige ${task.name}`)
    if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

    task.complete();
    saveHomework(homework);
    res.json(task);
  });

  app.delete("/api/homework/:id", (req, res) => {
    const index = homework.findIndex(t => t.id === req.params.id);
    console.log(`Index: ${index}`)
    if (index === -1) return res.status(404).json({ error: "Nicht gefunden" });
    homework.splice(index, 1);
    saveHomework(homework);
    res.json({ success: true });
  });
  //#endregion

  //#region Vocab
  app.post('/api/vocab', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Input leer" });

    const lines = text.split(".");
    const addedEntries = [];

    try {
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const parts = trimmed.split(",");
        if (parts.length !== 2) throw new Error("Format: Deutsch,Andere.");
        
        const [de, other] = parts.map(s => s.trim());

        if (!de || !other) return;

        if (!vocab[de]) {
          vocab[de] = {
            other,
            points: 0,
            addedDate: new Date().toISOString()
          };
          addedEntries.push({
            name: de,
            other: vocab[de].other,
            points: vocab[de].points,
            addedDate: vocab[de].addedDate
          });      
        }
      });

      saveVocab(vocab);
      res.status(201).json({ added: addedEntries }); 
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/vocab', (req, res) => {
    if (!req.body) {
      return res.status(400).json({ error: 'No body provided' });
    }

    const { german, correct } = req.body;

    if (!german) {
      return res.status(400).json({ error: 'Missing german field' });
    }

    if (!vocab[german]) {
      return res.status(404).json({ error: 'Word not found' });
    }

    if (correct) {
      vocab[german].points++;
    } else {
      vocab[german].points = 222222;
    }

    saveVocab(vocab);
    res.status(200).json({ success: true });
  });

  app.delete('/api/vocab/:id', (req, res) => {
    const id = decodeURIComponent(req.params.id).trim();
    if (!vocab[id]) return res.status(404).json({ error: "Nicht gefunden" });
    
    delete vocab[id];
    saveVocab(vocab);
    res.json({ success: true });
  });


}


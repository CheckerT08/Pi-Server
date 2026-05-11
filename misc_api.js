import { runCommand } from './helper_funcs.js';
import { homework, saveHomework, Task } from './homework_manager.js';

export function setupMiscApi(app) {
  app.get('/api/code-start', (req, res) => {
    runCommand('systemctl --user start code-server', res);
    console.log('Starte Code Server');
    res.status(200).json('Code gestartet');
  });

  app.get('/api/code-stop', (req, res) => {
    runCommand('systemctl --user stop code-server', res);
    console.log('Stoppe Code Server');
    res.status(200).json('Code gestoppt');
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
      res.status(201).json(task);
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
}

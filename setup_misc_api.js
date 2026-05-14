import { runCommand } from './helper_funcs.js';
import { homework, saveHomework, Task } from './homework_manager.js';
let clipboard = '';
let clipboardSentFromPhone = false;
let notifications = [];

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

  app.get('/api/homework', (req, res) => {
    res.json(homework);
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
      console.log(`Neue task erstellt: ${task.name}`)
      homework.push(task);
      saveHomework(homework);
      res.status(201).json(task);
    } catch (err) {
      console.log(err)
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/homework/:id', (req, res) => {
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

  app.post('/api/homework/:id/complete', (req, res) => {
    const { id } = req.params;
    const task = homework.find(t => t.id === id);
    console.log(`Erledige ${task.name}`)
    if (!task) return res.status(404).json({ error: "Task nicht gefunden" });

    task.complete();
    saveHomework(homework);
    res.json(task);
  });

  app.delete('api/homework/:id', (req, res) => {
    const index = homework.findIndex(t => t.id === req.params.id);
    console.log(`Index: ${index}`)
    if (index === -1) return res.status(404).json({ error: "Nicht gefunden" });
    homework.splice(index, 1);
    saveHomework(homework);
    res.json({ success: true });
  });

  app.get('/api/clipboard', async (req, res) => {
    clipboardSentFromPhone = false
    try {
        await fetch('https://ntfy.sh/ClipboardGetFromPhone_2147483647', { method: 'POST' });
    } catch (err) {
        console.error("ntfy Fehler:", err);
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
            return res.status(408).send("Timeout: Handy hat nicht geliefert.");
        }
    }, 100);
  });

  app.post('/api/clipboard', (req, res) => {
    clipboard = req.body.text;
    clipboardSentFromPhone = true;
    res.sendStatus(200);
  });

  app.get('/api/notification', (req, res) => {
        const now = new Date().getTime(); 
        const threeHours = 3 * 60 * 60 * 1000;

        const notificationsToSend = notifications.filter((element) => {
            const time = new Date(element.time).getTime(); 
            const diff = now - time;
            
            return diff < threeHours;
        });

        res.status(200).json(notificationsToSend);
        notifications = [];
  });

  app.post('/api/notification', (req, res) => {
    notifications.push({
      title: req.body.title,
      message: req.body.message,
      time: new Date(),
    });

    res.status(201).send();
  });
}

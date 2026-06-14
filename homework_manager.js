import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOMEWORK_PATH = path.join(__dirname, "data", "homework.json");

export let homework = []

export class Task {
  /**
   * @param {Object} [options]
   * @param {string} [options.id]
   * @param {string} [options.name]
   * @param {string} [options.description]
   * @param {Date|string} [options.dueDate]
   * @param {string} [options.subject]
   * @param {Date|string} [options.createdAt]
   * @param {boolean} [options.done]
   * @param {Date|string} [options.completedAt]
   */
  constructor({ id, name, description, dueDate, subject, createdAt, done, completedAt } = {}) {
    if (!name) throw new Error("Task braucht einen Namen!");

    // Wenn eine ID mitgegeben wird (beim Laden), nutze diese, sonst generiere eine neue
    this.id = id ?? crypto.randomUUID(); 
    this.name = name;
    this.description = description ?? "";
    this.dueDate = dueDate ? new Date(dueDate) : new Date();
    this.subject = subject ?? "General";
    this.completedAt = completedAt ? new Date(completedAt) : null;  
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.done = done ?? false;
  }

  complete() {
    this.done = true
    this.completedAt = new Date()
  }

  isOverdue() {
    return !this.done && this.dueDate < new Date()
  }
}

export function saveHomework(tasks) {
  fs.mkdirSync(path.dirname(HOMEWORK_PATH), { recursive: true })
  fs.writeFileSync(HOMEWORK_PATH, JSON.stringify(tasks, null, 2), 'utf-8')
}

export function loadHomework() {
  if (!fs.existsSync(HOMEWORK_PATH)) return []
  return JSON.parse(fs.readFileSync(HOMEWORK_PATH, 'utf-8'))
    .map(t => new Task(t))
}
homework = loadHomework()

// Clear once per day
setInterval(filterHomework, 24 * 60 * 60 * 1000);

function filterHomework() {
  const originalLength = homework.length;
  const updatedHomework = homework.filter(task => !task.done);
  if (updatedHomework.length < originalLength) {
    homework = updatedHomework; 
    saveHomework(homework);
    console.log(`Cleanup: ${originalLength - updatedHomework.length} old tasks removed.`);
  }
}

filterHomework();


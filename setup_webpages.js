import { homework } from "./homework_manager.js";
import { stats } from "./helper_funcs.js";

export function setupWebpages(app) {
  app.get('/', (req, res) => {
    res.render('index', {
    });
  });
  
  app.get('/stats', (req, res) => {
    res.render('stats', {
      cpu: stats.cpu,
      ram: stats.ram,
      temp: stats.temp,
      disk: stats.diskText,
    });
  });
  
  app.get('/homework', (req, res) => {
    res.render('homework', {
      tasks: homework
    });
  });
}

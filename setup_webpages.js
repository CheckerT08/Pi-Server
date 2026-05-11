import { stats } from "./stats.js";
import { getRandomVocab } from "./helper_funcs.js";
import { homework } from "./homework_manager.js";
import { vocab } from './vocabulary_manager.js';

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
  
  app.get('/vocab', (req, res) => {
    res.render('vocab', {
  
    });
  });
  
  app.get('/vocab/add', (req, res) => {
    res.render('vocab/add', {
      vocab: vocab
    });
  });
  
  app.get('/vocab/learn', (req, res) => {
    let {randomKey, other} = getRandomVocab();
  
    res.render('vocab/learn', {
      word: randomKey,
      solution: other
    });
  });
}

import { boxRequest, handleSpeech } from "./helper_funcs.js";

export function setupSmartHomeApi(app) {
  app.get('/api/box/power/:state', (req, res) => {
    boxRequest(`main/setPower?power=${req.params.state}`);
    res.status(200).json('OK');
  });
  
  app.get('/api/box/volume/:change', (req, res) => {
    const linkVar = req.params.change === 'up' ? 'up&step=2' : 'down&step=2';
    boxRequest(`main/setVolume?volume=${linkVar}`);
    res.status(200).json('OK');
  });
  
  app.get('/api/box/input/:value', (req, res) => {
    const linkVar = req.params.value;
    boxRequest(`main/setInput?input=${linkVar}`);
    res.status(200).json('OK');
  });
  
  app.post('/api/jarvis/', async (req, res) => {
    if (!req.body) return res.status(400).json('Body ist leer');
    let { body } = req.body;
    if (!body) return res.status(200).json('Du hast nichts gesagt, oder?');
    body = body.split(',')[0];
  
    let input = body.replace(/[.,!?]/gi, '');
    const result = await handleSpeech(input);

    console.log(`Result: ${result}, input: ${input}`);
    res.status(200).json(result);
  });
}

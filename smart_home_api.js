import { boxRequest, handleSpeech } from "./helper_funcs.js";

export function setupSmartHomeApi(app) {
  app.get('/api/box/power/:state', async (req, res) => {
    try {
      await boxRequest(`main/setPower?power=${req.params.state}`);
    } catch (err) {
      console.error(`Failed to set box power state: ${err.message}`);
      return res.status(400).json({error: err.message});
    }
    res.status(200).json('OK');
  });

  app.get('/api/box/volume/:change', async (req, res) => {
    const linkVar = req.params.change === 'up' ? 'up&step=2' : 'down&step=2';

    try {
      await boxRequest(`main/setVolume?volume=${linkVar}`);
    } catch (err) {
      console.error(`Failed to set box volume: ${err.message}`);
      return res.status(400).json({error: err.message});
    }
    res.status(200).json('OK');
  });

  app.get('/api/box/input/:value', async (req, res) => {
    const linkVar = req.params.value;

    try {
      await boxRequest(`main/setInput?input=${linkVar}`);
    } catch (err) {
      console.error(`Failed to set input: ${err.message}`);
      return res.status(400).json({error: err.message});
    }
    res.status(200).json('OK');
  });

  app.post('/api/jarvis/', async (req, res) => {
    try {
      const { body } = req.body;
      if (!body) return res.status(200).json('Du hast nichts gesagt, oder?');

      const cleanInput = body.replace(/[.!?,]/gi, '');

      // filter(Boolean) => remove empty/falsy slots; Boolean as function callback
      const segments = cleanInput.split(/\s+und\s+/i).filter(Boolean);

      const results = [];
      for (const segment of segments) {
        const answer = await handleSpeech(segment.trim());
        results.push(answer);
      }

      const finalResult = results.join(' und ');

      console.log(`Input: "${body}" => Result: "${finalResult}"`);
      return res.status(200).json(finalResult);

    } catch (error) {
      console.error('Fehler in /api/jarvis/:', error);
      return res.status(500).json('Da ist intern etwas schiefgelaufen.');
    }
  });
}

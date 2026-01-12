// server.js
import app from './src/app.js';
import { PORT } from './config/env.js';
import 'dotenv/config';

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

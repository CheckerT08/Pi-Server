import 'dotenv/config';
import express from 'express';
import path from 'path';
import { PORT } from './config/env.js';
import { setupMiscApi } from './misc_api.js';
import { setupWebpages } from './setup_webpages.js';
import { setupSmartHomeApi } from './smart_home_api.js';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

setupWebpages(app);

setupSmartHomeApi(app);

setupMiscApi(app);

// Server starten
app.listen(PORT, async () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

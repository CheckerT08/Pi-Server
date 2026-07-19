import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT } from './config/env.js';
import { setupClipboardApi, setupHomeworkApi, setupJarvisApi } from './setup_api.js';
import { setupWebpages } from './setup_webpages.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

setupWebpages(app);

setupClipboardApi(app);
setupHomeworkApi(app);
setupJarvisApi(app);

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

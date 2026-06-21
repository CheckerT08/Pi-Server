import { aiCommands } from './commands/ai.js';
import { boxCommands } from './commands/box.js';
import { streamingCommands } from './commands/streaming.js';
import { systemCommands } from './commands/system.js';
import { timerCommands } from './commands/timer.js';
import { weatherCommands } from './commands/weather.js';

export const commands = {
  ...aiCommands,
  ...boxCommands,
  ...streamingCommands,
  ...systemCommands,
  ...timerCommands,
  ...weatherCommands,
};

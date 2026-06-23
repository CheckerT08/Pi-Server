import { exec } from 'child_process';
import { promisify } from 'util';

// old exec with callbacks, new with async await
const execPromise = promisify(exec);
export async function runCommand(cmd) {
    try {
        console.log(`Running command ${cmd}...`);

        const { stdout, stderr } = await execPromise(cmd);
        
        if (stderr) {
            console.warn(`Stderr: ${stderr}`);
        }

        console.log(stdout);
        
        return stdout;
    } catch (error) {
        console.error(`Command "${cmd}" failed: ${error.message}`);
    }
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

import { MongoBinary } from 'mongodb-memory-server';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

// Run a real MongoDB process with persistent storage, not a temporary test DB.
const dbPath = fileURLToPath(new URL('../.mongo-data/', import.meta.url));
await mkdir(dbPath, { recursive: true });
const binary = await MongoBinary.getPath();
console.log('Starting local development MongoDB at 127.0.0.1:27017. Keep this terminal open.');
const child = spawn(binary, ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', '27017'], { stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child.kill(signal); });

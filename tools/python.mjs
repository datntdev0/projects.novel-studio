import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const venv = `${root}python/.venv`;
const venvPython = `${venv}/Scripts/python.exe`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) fail(`Cannot run ${command}: ${result.error.message}`);
  return result.status ?? 1;
}

function setup() {
  if (!existsSync(venvPython)) {
    const check = spawnSync('py', ['-3.11', '--version'], { stdio: 'ignore' });
    if (check.error || check.status !== 0) fail('Python 3.11 not found: "py -3.11" is required. Install Python 3.11 for Windows.');
    const status = run('py', ['-3.11', '-m', 'venv', venv]);
    if (status !== 0) process.exit(status);
  }
  process.exit(run(venvPython, ['-m', 'pip', 'install', '-r', `${root}python/requirements.txt`]));
}

const args = process.argv.slice(2);
if (args[0] === 'setup') setup();
if (!existsSync(venvPython)) fail('Python venv not found. Run "node tools/python.mjs setup" first.');
process.exit(run(venvPython, args));

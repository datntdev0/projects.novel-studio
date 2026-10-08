import { app } from 'electron';
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import type { BackendEndpoint } from './backend-client';

export interface BackendCommand {
  command: string;
  args: string[];
  cwd: string;
}

export function resolveBackendCommand(): BackendCommand | null {
  if (app.isPackaged) return null;
  const cwd = path.join(app.getAppPath(), '..', '..', 'python');
  return { command: path.join(cwd, '.venv', 'Scripts', 'python.exe'), args: ['-m', 'app'], cwd };
}

export function spawnBackend(cmd: BackendCommand, env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(cmd.command, cmd.args, { cwd: cmd.cwd, env, stdio: 'ignore', windowsHide: true });
}

export function backendEnv(endpoint: BackendEndpoint, logDir: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NS_BACKEND_PORT: String(endpoint.port),
    NS_BACKEND_TOKEN: endpoint.token,
    NS_PARENT_PID: String(process.pid),
    NS_LOG_DIR: logDir,
    PYTHONUNBUFFERED: '1',
    PYTHONDONTWRITEBYTECODE: '1',
  };
  if (app.isPackaged) {
    for (const key of Object.keys(env)) if (key.startsWith('NS_TEST_')) delete env[key];
  }
  return env;
}

export function killProcessTree(pid: number): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, (error, stdout, stderr) => {
      const notFound = /not found|no running instance/i.test(`${stdout}${stderr}`);
      if (error && !notFound) reject(error);
      else resolve();
    });
  });
}

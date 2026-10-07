import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? '');
const port = Number(process.argv[3]);

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.map': 'application/json; charset=utf-8',
};

const fileOf = (urlPath: string): string | null => {
  const relative = urlPath === '/' ? '/index.html' : urlPath;
  const file = join(root, normalize(relative));
  if (!file.startsWith(root + sep)) return null;
  try {
    return statSync(file).isFile() ? file : null;
  } catch {
    return null;
  }
};

const pathOf = (url: string | undefined): string | null => {
  try {
    return decodeURIComponent(new URL(url ?? '/', 'http://127.0.0.1').pathname);
  } catch {
    return null;
  }
};

createServer((request, response) => {
  const path = pathOf(request.url);
  if (path === null) {
    response.writeHead(400).end();
    return;
  }
  const file = fileOf(path);
  if (!file) {
    response.writeHead(404).end();
    return;
  }
  const stream = createReadStream(file);
  stream.on('error', () => {
    if (response.headersSent) response.destroy();
    else response.writeHead(500).end();
  });
  stream.on('open', () => {
    response.writeHead(200, { 'content-type': contentTypes[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    stream.pipe(response);
  });
}).listen(port, '127.0.0.1');

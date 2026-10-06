import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const defaultMockup = '.claude/mockups/styles.css';
const selectors = { root: ':root', dark: ':root[data-theme="dark"]', light: ':root[data-theme="light"]' };
const themes = ['dark', 'light'];
const maxDepth = 10;

const normalize = (value) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s*,\s*/g, ',')
    .replace(/'/g, '"')
    .replace(/(?<![\d.])\.(\d)/g, '0.$1')
    .toLowerCase();

const readText = (file, base) => readFileSync(resolve(base, file), 'utf8');

const parseTokens = (body) => {
  const tokens = {};
  for (const declaration of body.split(';')) {
    const colon = declaration.indexOf(':');
    const name = declaration.slice(0, colon).trim();
    if (colon > 0 && name.startsWith('--')) tokens[name] = normalize(declaration.slice(colon + 1));
  }
  return tokens;
};

const parseMockup = (text) => {
  const bodies = {};
  for (const [, selector, body] of text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    bodies[normalize(selector)] ??= body;
  }
  const tables = {};
  for (const [key, selector] of Object.entries(selectors)) {
    tables[key] = parseTokens(bodies[normalize(selector)] ?? '');
    if (Object.keys(tables[key]).length === 0) throw new Error(`no tokens found in ${selector}`);
  }
  return tables;
};

const resolveVars = (value, table, seen = [], depth = 0) =>
  value.replace(/var\((--[\w-]+)\)/g, (reference, name) => {
    if (!(name in table) || seen.includes(name) || depth >= maxDepth) return reference;
    return resolveVars(table[name], table, [...seen, name], depth + 1);
  });

const expectedFor = (mockup, theme) => {
  const merged = { ...mockup.root, ...mockup[theme] };
  return Object.fromEntries(Object.entries(merged).map(([name, value]) => [name, resolveVars(value, merged, [name])]));
};

const compare = (mockup, actual) => {
  const findings = [];
  for (const theme of themes) {
    const app = actual[theme] ?? {};
    for (const [name, expected] of Object.entries(expectedFor(mockup, theme))) {
      if (typeof app[name] !== 'string' || app[name].trim() === '') {
        findings.push(`${theme} · ${name} · missing`);
        continue;
      }
      const value = normalize(app[name]);
      if (value !== expected) findings.push(`${theme} · ${name} · differs (app ${value} · mockup ${expected})`);
    }
  }
  return findings;
};

const run = (args) => {
  const printMode = args[0] === '--print';
  const mockupArg = args[1];
  const mockupFile = mockupArg ?? defaultMockup;
  let file = mockupFile;
  try {
    const mockup = parseMockup(readText(mockupFile, mockupArg ? process.cwd() : root));
    if (printMode) {
      console.log(JSON.stringify(mockup, null, 2));
      return [];
    }
    file = args[0];
    return compare(mockup, JSON.parse(readText(file, process.cwd())));
  } catch (error) {
    return [`${file} · · ${error.message}`];
  }
};

const args = process.argv.slice(2);
const usage = ['usage · · check-tokens.mjs --print [mockup.css] | <actual.json> [mockup.css]'];
const findings = args.length > 0 ? run(args) : usage;
if (findings.length > 0) {
  console.log(findings.join('\n'));
  process.exit(1);
}

import { readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const defaultFiles = ['shared/src/core/i18n/en.json', 'shared/src/core/i18n/vi.json'];
const files = process.argv.length > 2 ? process.argv.slice(2, 4) : defaultFiles;
const findings = [];

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isPlural = (value) => isObject(value) && typeof value.other === 'string';

const flatten = (file, node, prefix, keys) => {
  for (const [name, value] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (isObject(value) && !isPlural(value)) {
      flatten(file, value, key, keys);
      continue;
    }
    keys.add(key);
    if (typeof value !== 'string' && !isPlural(value)) findings.push(`${file} · ${key} · not a string`);
  }
};

const load = (file) => {
  try {
    const tree = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
    if (!isObject(tree)) throw new Error('not an object');
    const keys = new Set();
    flatten(file, tree, '', keys);
    return keys;
  } catch (error) {
    findings.push(`${file} · · ${error.message}`);
    return null;
  }
};

const reportMissing = (from, to, file, other) => {
  for (const key of from) {
    if (!to.has(key)) findings.push(`${file} · ${key} · missing (present in ${basename(other)})`);
  }
};

const [enFile, viFile] = files;
const enKeys = load(enFile);
const viKeys = load(viFile);
if (enKeys && viKeys) {
  reportMissing(enKeys, viKeys, viFile, enFile);
  reportMissing(viKeys, enKeys, enFile, viFile);
}

if (findings.length > 0) {
  console.log(findings.join('\n'));
  process.exit(1);
}

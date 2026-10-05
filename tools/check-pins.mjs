import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pnpmVersion = 'pnpm@11.10.0';
const exactVersion = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const manifestOnlySpec = /^(workspace:\*|catalog:.*)$/;
const pythonPin = /^[A-Za-z0-9][A-Za-z0-9._-]*==\d+(\.\d+)*((a|b|rc)\d+)?(\.(post|dev)\d+)*$/;
const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const violations = [];

const read = (file) => readFileSync(join(root, file), 'utf8');

const checkEntries = (file, entries, allowed = /$^/) => {
  for (const [name, spec] of Object.entries(entries ?? {})) {
    if (typeof spec !== 'string' || (!exactVersion.test(spec) && !allowed.test(spec))) {
      violations.push(`${file} · ${name} · ${spec} · not an exact version`);
    }
  }
};

const checkManifest = (file) => {
  const manifest = JSON.parse(read(file));
  for (const field of dependencyFields) checkEntries(file, manifest[field], manifestOnlySpec);
  checkEntries(file, manifest.pnpm?.overrides, manifestOnlySpec);
  return manifest;
};

const workspace = parse(read('pnpm-workspace.yaml'));
const rootManifest = checkManifest('package.json');
for (const dir of workspace.packages ?? []) checkManifest(`${dir}/package.json`);

checkEntries('pnpm-workspace.yaml', workspace.overrides);
checkEntries('pnpm-workspace.yaml', workspace.catalog);
for (const catalog of Object.values(workspace.catalogs ?? {})) checkEntries('pnpm-workspace.yaml', catalog);

const requirementLines = read('python/requirements.txt')
  .split(/\r?\n/)
  .map((text) => text.trim())
  .filter((text) => text && !text.startsWith('#'));
for (const line of requirementLines) {
  if (!pythonPin.test(line)) violations.push(`python/requirements.txt · ${line} · not an exact pin`);
}

if (rootManifest.packageManager !== pnpmVersion) {
  violations.push(`package.json · packageManager · ${rootManifest.packageManager} · must be ${pnpmVersion}`);
}

try {
  execFileSync('git', ['ls-files', '--error-unmatch', 'pnpm-lock.yaml'], { cwd: root, stdio: 'ignore' });
} catch {
  violations.push('pnpm-lock.yaml · pnpm-lock.yaml · untracked · lockfile must be tracked by git');
}

if (violations.length > 0) {
  console.log(violations.join('\n'));
  process.exit(1);
}

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { format, getFileInfo, resolveConfig } from 'prettier';

const listFiles = () =>
  execSync('git ls-files -z --cached --others --exclude-standard', { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .filter((file) => existsSync(file));

const isChecked = async (file) => {
  const info = await getFileInfo(file, { ignorePath: ['.prettierignore', '.gitignore'], withNodeModules: false });
  return !info.ignored && info.inferredParser !== null;
};

const firstDifferingLine = (actual, expected) => {
  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');
  const index = actualLines.findIndex((line, i) => line !== expectedLines[i]);
  return index === -1 ? actualLines.length : index + 1;
};

const checkFile = async (file) => {
  const text = readFileSync(file, 'utf8');
  try {
    const config = await resolveConfig(file);
    const formatted = await format(text, { ...config, filepath: file });
    return formatted === text ? null : `${file}:${firstDifferingLine(text, formatted)} prettier`;
  } catch (error) {
    const message = String(error.message).split('\n')[0];
    return `${file}:${error.loc?.start?.line ?? 1} prettier ${message}`;
  }
};

const failures = [];
for (const file of listFiles()) {
  if (!(await isChecked(file))) continue;
  const failure = await checkFile(file);
  if (failure) failures.push(failure);
}

if (failures.length > 0) {
  console.log(failures.join('\n'));
  process.exit(1);
}

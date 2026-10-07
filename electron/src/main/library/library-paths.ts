import fs from 'node:fs';
import path from 'node:path';
import { nsError, toLibraryPath } from '@shared/core';

const nearestExisting = (target: string): string => {
  let current = target;
  while (!fs.existsSync(current)) current = path.dirname(current);
  return current;
};

const isInside = (root: string, target: string): boolean => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

export function resolveInLibrary(root: string, input: unknown): string {
  const relative = toLibraryPath(input);
  if (relative === null) throw nsError('LIBRARY_PATH_OUTSIDE', 'Path is outside the library');
  const resolved = path.join(root, ...relative.split('/'));
  const realRoot = fs.realpathSync.native(root);
  if (!isInside(realRoot, fs.realpathSync.native(nearestExisting(resolved))))
    throw nsError('LIBRARY_PATH_OUTSIDE', 'Path is outside the library');
  return resolved;
}

export function readLibraryArg(argv: string[]): string | null {
  const index = argv.findIndex((arg) => arg === '--library' || arg.startsWith('--library='));
  const arg = argv[index];
  if (arg === undefined) return null;
  const value = arg === '--library' ? argv[index + 1] : arg.slice('--library='.length);
  return value || null;
}

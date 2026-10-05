import { fileURLToPath } from 'node:url';

const fromRoot = (path: string): string => fileURLToPath(new URL(path, new URL('../../', import.meta.url)));

export const repoRoot = fromRoot('.');
export const angularDir = fromRoot('angular');
export const electronDir = fromRoot('electron');
export const appDir = fromRoot('dist/app');
export const specsDir = fromRoot('verify/specs');
export const flowsDir = fromRoot('.claude/flows');

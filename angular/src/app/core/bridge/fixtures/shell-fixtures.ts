import { DEFAULT_SHELL_FIXTURE, SHELL_FIXTURES, SHELL_MOCKUP_SETS, nsError, type IpcContract, type ShellFixture, type ShellMockupSet } from '@shared/core';

export type FixtureMode = 'normal' | 'slow' | 'fail' | 'flood';

export const AREA_CHANNELS: readonly (keyof IpcContract)[] = [
  'library:listNovels',
  'data:libraryStats',
  'services:detect',
  'settings:assignments',
  'job:list',
];
export const SLOW_MS = 2000;
export const FLOOD_MS = 100;
export const FAIL_ERROR = nsError('INTERNAL', 'Fixture failure', 'SQLITE_BUSY: database is locked (fixture=fail)');

const isShellFixture = (value: string | null): value is ShellFixture => SHELL_FIXTURES.some((fixture) => fixture === value);

const readFixtureParam = (search: string): string | null => new URLSearchParams(search).get('fixture');

const CLI_PROBLEMS_SET: ShellMockupSet = {
  ...SHELL_MOCKUP_SETS.none,
  clis: [
    { name: 'claude', state: 'missing', version: null, problemCode: null },
    { name: 'codex', state: 'warning', version: '0.160.0', problemCode: 'CLI_OUTDATED' },
  ],
};

export const readFixture = (search: string): ShellMockupSet => {
  const value = readFixtureParam(search);
  if (value === 'flood') return SHELL_MOCKUP_SETS.busy;
  if (value === 'cli-problems') return CLI_PROBLEMS_SET;
  return SHELL_MOCKUP_SETS[isShellFixture(value) ? value : DEFAULT_SHELL_FIXTURE];
};

export const readFixtureMode = (search: string): FixtureMode => {
  const value = readFixtureParam(search);
  return value === 'slow' || value === 'fail' || value === 'flood' ? value : 'normal';
};

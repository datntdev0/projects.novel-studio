import { DEFAULT_SHELL_FIXTURE, SHELL_FIXTURES, SHELL_MOCKUP_SETS, type ShellFixture, type ShellMockupSet } from '@shared/core';

const isShellFixture = (value: string | null): value is ShellFixture => SHELL_FIXTURES.some((fixture) => fixture === value);

export const readFixture = (search: string): ShellMockupSet => {
  const value = new URLSearchParams(search).get('fixture');
  return SHELL_MOCKUP_SETS[isShellFixture(value) ? value : DEFAULT_SHELL_FIXTURE];
};

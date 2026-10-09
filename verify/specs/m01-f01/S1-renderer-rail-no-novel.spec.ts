import { expect, test } from '@playwright/test';
import { railEntryIds, railGroupIds } from '../../support/rail.ts';
import { gotoShell } from '../../support/shell.ts';

const NO_NOVEL_ENTRIES = ['assets', 'home', 'inbox', 'library', 'pronunciation', 'publishing', 'settings', 'sound', 'tasks', 'voicelab'];
const NO_NOVEL_GROUPS = ['distribution', 'library', 'media', 'system'];

test('S1 the rail without a novel shows the ten library, media, distribution and system entries (AC-1)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await expect.poll(async () => (await railEntryIds(page)).sort()).toEqual(NO_NOVEL_ENTRIES);
  expect((await railGroupIds(page)).sort()).toEqual(NO_NOVEL_GROUPS);
  for (const group of NO_NOVEL_GROUPS) await expect(page.getByTestId(`rail-group-${group}`)).toBeVisible();
  await expect(page.getByTestId('rail-group-workspace')).toHaveCount(0);
  await expect(page.getByTestId('rail-group-production')).toHaveCount(0);
  await expect(page.getByTestId('rail-reader')).toHaveCount(0);
  await expect(page.getByTestId('rail-home')).toHaveAttribute('aria-current', 'page');
});

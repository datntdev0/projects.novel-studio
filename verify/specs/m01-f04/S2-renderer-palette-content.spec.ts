import { expect, test } from '@playwright/test';
import { gotoProbe, openPalette, paletteRowIds, registerProbeCommand } from '../../support/palette.ts';
import { openFirstNovel, REGISTRY_IDS } from '../../support/shell.ts';

const NOVEL_MODULES = ['reader', 'storyworld', 'translation', 'storychat'];
const GLOBAL_COMMANDS = ['appearance.toggle-theme', 'appearance.toggle-language', 'overlay.shortcuts'];

test('S2 without a novel workspace modules are hidden and other modules show ids and keys (AC-31)', async ({ page }) => {
  await gotoProbe(page);
  await openPalette(page);
  await expect(page.getByTestId('palette-group-module-workspace')).toHaveCount(0);
  for (const id of ['home', 'library', 'voicelab', 'inbox', 'tasks', 'settings'])
    await expect(page.getByTestId(`palette-module-${id}`)).toBeVisible();
  for (const id of NOVEL_MODULES) await expect(page.getByTestId(`palette-module-${id}`)).toHaveCount(0);
  await expect(page.getByTestId('palette-module-home')).toContainText('M01 · M06');
  await expect(page.getByTestId('palette-module-home')).toContainText('Ctrl');
  await expect(page.getByTestId('palette-module-settings')).toContainText('M02 · M06 · M21 · M22');
});

test('S2 the commands group lists global commands and no navigation or palette command (AC-31)', async ({ page }) => {
  await gotoProbe(page);
  await openPalette(page);
  await expect(page.getByTestId('palette-group-commands')).toBeVisible();
  for (const id of GLOBAL_COMMANDS) await expect(page.getByTestId(`palette-cmd-${id}`)).toBeVisible();
  await expect(page.getByTestId('palette-cmd-overlay.palette')).toHaveCount(0);
  const ids = await paletteRowIds(page);
  expect(ids.filter((id) => id.startsWith('palette-cmd-nav.'))).toEqual([]);
});

test('S2 with a novel open all modules are listed in rail group order (AC-31)', async ({ page }) => {
  await gotoProbe(page);
  await openFirstNovel(page);
  await openPalette(page);
  await expect(page.getByTestId('palette-group-module-workspace')).toBeVisible();
  const modules = (await paletteRowIds(page)).filter((id) => id.startsWith('palette-module-') && id !== 'palette-module-probe');
  expect(modules).toEqual(REGISTRY_IDS.map((id) => `palette-module-${id}`));
});

test('S2 a module command registered later appears in the commands group (AC-31)', async ({ page }) => {
  await gotoProbe(page);
  await expect(page.getByTestId('probe-module-runs')).toBeAttached();
  await registerProbeCommand(page);
  await openPalette(page);
  await expect(page.getByTestId('palette-cmd-probe.module-action')).toBeVisible();
});

test('S2 the novels group lists novels and a novel row opens it (AC-31)', async ({ page }) => {
  await gotoProbe(page);
  await expect(page.getByTestId('probe-open-novel')).toHaveText('none');
  await openPalette(page);
  const novelRows = (await paletteRowIds(page)).filter((id) => id.startsWith('palette-novel-'));
  expect(novelRows.length).toBeGreaterThan(0);
  await expect(page.getByTestId('palette-group-novels')).toBeVisible();
  await page.getByTestId(novelRows[0] ?? '').click();
  await expect(page.getByTestId('palette')).toBeHidden();
  await expect(page.getByTestId('probe-open-novel')).not.toHaveText('none');
});

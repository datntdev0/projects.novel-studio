import { expect, test, type Page } from '../../support/test.ts';
import { gotoShell } from '../../support/shell.ts';
import { collectWarnings } from '../../support/shortcuts.ts';
import { expectLook, markWindow, toggleTheme, windowKept } from '../../support/appearance.ts';

const REGIONS = ['topbar-lang', 'topbar-theme', 'topbar', 'rail', 'panel-left', 'workspace', 'panel-right', 'panel-bottom', 'statusbar'];

const regionBoxes = async (page: Page): Promise<Record<string, unknown>> => {
  const entries = await Promise.all(REGIONS.map(async (id) => [id, await page.getByTestId(id).boundingBox()] as const));
  return Object.fromEntries(entries);
};

test('S3 the theme flips in place by button and key and the layout does not move (AC-23)', async ({ page }) => {
  const warnings = collectWarnings(page);
  await gotoShell(page);
  await expectLook(page, 'en', 'dark');
  const boxes = await regionBoxes(page);
  await markWindow(page);

  await page.getByTestId('topbar-theme').click();
  await expectLook(page, 'en', 'light');
  expect(await regionBoxes(page)).toEqual(boxes);

  await page.getByTestId('topbar-theme').click();
  await expectLook(page, 'en', 'dark');

  await toggleTheme(page);
  await expectLook(page, 'en', 'light');
  expect(await regionBoxes(page)).toEqual(boxes);

  await toggleTheme(page);
  await expectLook(page, 'en', 'dark');
  expect(await regionBoxes(page)).toEqual(boxes);
  expect(await windowKept(page)).toBe(true);
  expect(warnings.has('Ctrl+Shift+L')).toBe(false);
  expect(warnings.has('appearance.toggle-theme')).toBe(false);
});

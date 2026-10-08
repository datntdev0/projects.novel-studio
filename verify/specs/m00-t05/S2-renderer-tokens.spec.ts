import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect, saveEvidence } from '../../support/test.ts';
import { gotoFoundation } from '../../support/shell.ts';
import { computedVars, expectHtml, printTokens, runCheckTokens, withTempFolder } from '../../support/theme.ts';

test('S2 renderer tokens equal the mockup in both themes and only semantic variables change (AC-14, AC-15)', async ({ page }) => {
  const tables = await printTokens();
  const names = [...new Set([...Object.keys(tables.root), ...Object.keys(tables.dark), ...Object.keys(tables.light)])];

  await gotoFoundation(page);
  await expectHtml(page, 'en', 'dark');
  const dark = await computedVars(page, names);
  await saveEvidence(page, 'dark');

  await page.getByTestId('root-set-theme-light').click();
  await expectHtml(page, 'en', 'light');
  const light = await computedVars(page, names);
  await saveEvidence(page, 'light');

  await withTempFolder(async (folder) => {
    const file = join(folder, 'actual.json');
    await writeFile(file, JSON.stringify({ dark, light }));
    expect(await runCheckTokens([file])).toEqual({ code: 0, stdout: '' });
  });

  const themeNames = new Set([...Object.keys(tables.dark), ...Object.keys(tables.light)]);
  const differing = names.filter((name) => dark[name] !== light[name]);
  expect(differing.length).toBeGreaterThan(0);
  expect(differing.filter((name) => !themeNames.has(name))).toEqual([]);
  expect(Object.keys(tables.root).filter((name) => dark[name] !== light[name])).toEqual([]);
});

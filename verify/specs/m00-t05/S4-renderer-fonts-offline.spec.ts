import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect, saveEvidence, type Page } from '../../support/test.ts';
import { guardRequests } from '../../support/request-guard.ts';
import { devServerUrl } from '../../support/dev-server.ts';
import { appDir } from '../../support/paths.ts';
import { LOOK_TEXTS } from '../../support/theme.ts';

type FontGlobals = {
  document: { fonts: { ready: Promise<unknown>; check(font: string): boolean; load(font: string): Promise<{ status: string }[]> } };
  performance: { getEntriesByType(type: string): { name: string }[] };
};

const readFonts = (page: Page): Promise<{ inter: boolean; serifStatuses: string[]; woff2: string[] }> =>
  page.evaluate(async () => {
    const { document, performance } = globalThis as unknown as FontGlobals;
    await document.fonts.ready;
    const faces = await document.fonts.load('18px "Source Serif 4"');
    return {
      inter: document.fonts.check('13px Inter'),
      serifStatuses: faces.map((face) => face.status),
      woff2: performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => new URL(name).pathname.endsWith('.woff2')),
    };
  });

const countFiles = async (folder: string, pattern: RegExp): Promise<number> =>
  (await readdir(join(appDir, 'renderer', folder))).filter((name) => pattern.test(name)).length;

test('S4 renderer loads the bundled fonts with every outside request blocked (AC-14)', async ({ page }) => {
  const blocked = guardRequests(page);
  await page.goto('/');
  await expect(page.getByTestId('root-sample-serif')).toHaveText(LOOK_TEXTS.en['root-sample-serif']);
  const fonts = await readFonts(page);
  expect(fonts.inter).toBe(true);
  expect(fonts.serifStatuses.length).toBeGreaterThan(0);
  expect(fonts.serifStatuses).toContain('loaded');
  expect(fonts.woff2.length).toBeGreaterThan(0);
  const origin = new URL(devServerUrl).origin;
  expect(fonts.woff2.every((url) => new URL(url).origin === origin)).toBe(true);
  expect(blocked).toEqual([]);
  await page.getByTestId('root-set-language-vi').click();
  await expect(page.getByTestId('root-sample-serif')).toHaveText(LOOK_TEXTS.vi['root-sample-serif']);
  expect(blocked).toEqual([]);
  await saveEvidence(page, 'vi');
  expect(await countFiles('media', /\.woff2$/)).toBe(4);
  expect(await countFiles('licenses', /^OFL-.*\.txt$/)).toBe(2);
});

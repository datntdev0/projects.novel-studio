import { expect, test, type Page } from '@playwright/test';
import { NOVEL_A, openNovelFromPalette, railEntryIds, railGroupIds, railWidth } from '../../support/rail.ts';
import { gotoShell, REGISTRY_IDS } from '../../support/shell.ts';

const ALL_GROUPS = ['distribution', 'library', 'media', 'production', 'system', 'workspace'];

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(page: Page, testId: string): Promise<Box> {
  const box = await page.getByTestId(testId).boundingBox();
  expect(box).not.toBeNull();
  return box as Box;
}

const right = (box: Box): number => box.x + box.width;
const bottom = (box: Box): number => box.y + box.height;

async function expectRailFits(page: Page): Promise<void> {
  const rail = await boxOf(page, 'rail');
  for (const id of REGISTRY_IDS) {
    const box = await boxOf(page, `rail-${id}`);
    expect([box.x >= rail.x, box.y >= rail.y, right(box) <= right(rail), bottom(box) <= bottom(rail)]).toEqual([true, true, true, true]);
  }
  const sizes = await page
    .getByTestId('rail-scroll')
    .evaluate((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
  expect(sizes.scrollHeight).toBeLessThanOrEqual(sizes.clientHeight);
}

test('S2 with a novel open the rail shows all 17 entries in six groups without scrolling (AC-2)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await gotoShell(page, { fixture: 'busy' });
  await openNovelFromPalette(page, NOVEL_A);
  await expect.poll(async () => (await railEntryIds(page)).sort()).toEqual([...REGISTRY_IDS].sort());
  expect((await railGroupIds(page)).sort()).toEqual(ALL_GROUPS);
  for (const id of REGISTRY_IDS) await expect(page.getByTestId(`rail-${id}`)).toBeVisible();
  await expectRailFits(page);
  await page.getByTestId('topbar-brand').click();
  await expect.poll(() => railWidth(page)).toBe(200);
  for (const id of REGISTRY_IDS) await expect(page.getByTestId(`rail-${id}`)).toBeVisible();
  await expectRailFits(page);
});

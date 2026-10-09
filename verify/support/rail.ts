import { expect, type Page } from '@playwright/test';
import { openPalette } from './palette.ts';

export const NOVEL_A = '凡人修仙传';
export const NOVEL_B = 'The Wandering Inn';
export const NOVEL_C = 'Tiên Nghịch';

const EXCLUDED_ENTRY = /^rail-(probe|badge-.*|group-.*|scroll)$/;

async function railTestIds(page: Page, prefix: string): Promise<string[]> {
  const items = page.getByTestId('rail').locator(`[data-testid^="${prefix}"]`);
  return items.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-testid') ?? ''));
}

export async function railEntryIds(page: Page): Promise<string[]> {
  const ids = await railTestIds(page, 'rail-');
  return ids.filter((id) => !EXCLUDED_ENTRY.test(id)).map((id) => id.slice('rail-'.length));
}

export async function railGroupIds(page: Page): Promise<string[]> {
  const ids = await railTestIds(page, 'rail-group-');
  return ids.map((id) => id.slice('rail-group-'.length));
}

export async function pickNovel(page: Page, title: string): Promise<void> {
  await page.getByTestId('palette-input').fill(title);
  await page.getByTestId('palette').locator('[data-testid^="palette-novel-"]').first().click();
  await expect(page.getByTestId('palette')).toBeHidden();
}

export async function openNovelFromPalette(page: Page, title: string): Promise<void> {
  await openPalette(page);
  await pickNovel(page, title);
}

export async function railWidth(page: Page): Promise<number> {
  const box = await page.getByTestId('rail').boundingBox();
  expect(box).not.toBeNull();
  return Math.round(box?.width ?? 0);
}

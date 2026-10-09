import { expect, test, type Page } from '../../support/test.ts';
import { TOAST_TIMEOUT_MS, gotoProbe } from '../../support/appearance.ts';

const RENDER_MS = 100;

const show = async (page: Page, tone: string): Promise<void> => {
  await page.getByTestId(`probe-toast-${tone}`).click();
  await page.clock.runFor(RENDER_MS);
};

const top = async (page: Page, id: number): Promise<number> => (await page.getByTestId(`toast-${id}`).boundingBox())?.y ?? Number.NaN;

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await gotoProbe(page);
  await page.clock.pauseAt(new Date(Date.now() + 60_000));
});

test('S6 info, success and warning toasts close after 5 s (AC-26)', async ({ page }) => {
  for (const tone of ['info', 'success', 'warning']) await show(page, tone);
  for (const id of [1, 2, 3]) await expect(page.getByTestId(`toast-${id}`)).toBeVisible();
  await page.clock.runFor(TOAST_TIMEOUT_MS - 1000 - 3 * RENDER_MS);
  for (const id of [1, 2, 3]) await expect(page.getByTestId(`toast-${id}`)).toBeVisible();
  await page.clock.runFor(1000 + 3 * RENDER_MS);
  for (const id of [1, 2, 3]) await expect(page.getByTestId(`toast-${id}`)).toHaveCount(0);
});

test('S6 error toast stays until it is closed (AC-26)', async ({ page }) => {
  await show(page, 'error');
  await expect(page.getByTestId('toast-1')).toBeVisible();
  await page.clock.runFor(TOAST_TIMEOUT_MS * 3);
  await expect(page.getByTestId('toast-1')).toBeVisible();
  await page.getByTestId('toast-1-close').click();
  await page.clock.runFor(RENDER_MS);
  await expect(page.getByTestId('toast-1')).toHaveCount(0);
});

test('S6 a 4th toast pushes the oldest out and the newest is on top (AC-26)', async ({ page }) => {
  for (let count = 0; count < 3; count++) await show(page, 'error');
  for (const id of [1, 2, 3]) await expect(page.getByTestId(`toast-${id}`)).toBeVisible();
  expect(await top(page, 3)).toBeLessThan(await top(page, 2));
  expect(await top(page, 2)).toBeLessThan(await top(page, 1));

  await show(page, 'error');
  await expect(page.getByTestId('toast-4')).toBeVisible();
  await expect(page.getByTestId('toast-1')).toHaveCount(0);
  await expect(page.getByTestId('toast-2')).toBeVisible();
  await expect(page.getByTestId('toast-3')).toBeVisible();
  expect(await top(page, 4)).toBeLessThan(await top(page, 3));
});

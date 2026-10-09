import { expect, test, type Page } from '../../support/test.ts';
import { appearanceText, toggleTheme } from '../../support/appearance.ts';
import { railWidth } from '../../support/rail.ts';
import { gotoShell } from '../../support/shell.ts';
import { SETTINGS_KEY } from '../../support/theme.ts';

type StorageGlobals = { localStorage: { getItem(key: string): string | null } };

const COLLAPSED_WIDTH = 48;
const EXPANDED_WIDTH = 200;

const visibleText = (page: Page, testId: string): Promise<string> =>
  page.getByTestId(testId).evaluate((element) => (element as unknown as { innerText: string }).innerText);

const expectRail = async (page: Page, expanded: boolean): Promise<void> => {
  const homeLabel = appearanceText('en', 'module.home.label');
  const groupTitle = appearanceText('en', 'rail.group.library');
  await expect(page.getByTestId('topbar-brand')).toHaveAttribute('aria-pressed', String(expanded));
  await expect.poll(() => railWidth(page)).toBe(expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH);
  if (expanded) {
    await expect.poll(() => visibleText(page, 'rail-home')).toContain(homeLabel);
    await expect.poll(() => visibleText(page, 'rail-group-library')).toContain(groupTitle);
  } else {
    await expect.poll(() => visibleText(page, 'rail-home')).not.toContain(homeLabel);
    await expect.poll(() => visibleText(page, 'rail-group-library')).not.toContain(groupTitle);
  }
};

test('S10 the brand toggles the rail width and the choice is remembered across reload (AC-10)', async ({ page }) => {
  await gotoShell(page);
  await expectRail(page, false);

  await page.getByTestId('topbar-brand').click();
  await expectRail(page, true);

  await page.reload();
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expectRail(page, true);
  const stored = await page.evaluate((key) => (globalThis as unknown as StorageGlobals).localStorage.getItem(key), SETTINGS_KEY);
  expect(JSON.parse(stored ?? '')).toMatchObject({ railExpanded: true });

  await page.getByTestId('topbar-brand').click();
  await expectRail(page, false);

  await expect(page.getByTestId('topbar-brand-mark-dark')).toBeVisible();
  await expect(page.getByTestId('topbar-brand-mark-light')).toBeHidden();
  await toggleTheme(page);
  await expect(page.getByTestId('topbar-brand-mark-light')).toBeVisible();
  await expect(page.getByTestId('topbar-brand-mark-dark')).toBeHidden();
});

import { expect, test, type Page } from '@playwright/test';
import { appearanceText, toggleLanguage } from '../../support/appearance.ts';
import { openPalette } from '../../support/palette.ts';
import { gotoShell, REGISTRY_IDS } from '../../support/shell.ts';

type BarStyle = { width: string; color: string; primary: string };
type StyleGlobals = {
  getComputedStyle: (element: unknown, pseudo?: string) => { width: string; backgroundColor: string };
  document: { body: { append(node: unknown): void }; createElement(tag: string): { style: { background: string }; remove(): void } };
};

async function expectActive(page: Page, id: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`#/${id}$`));
  for (const entry of REGISTRY_IDS) {
    const locator = page.getByTestId(`rail-${entry}`);
    if (entry === id) await expect(locator).toHaveAttribute('aria-current', 'page');
    else if ((await locator.count()) > 0) await expect(locator).not.toHaveAttribute('aria-current', 'page');
  }
  await expect(page.getByTestId('topbar-crumb-module')).toHaveText(appearanceText('en', `module.${id}.label`));
}

function barStyle(page: Page, id: string): Promise<BarStyle> {
  return page.getByTestId(`rail-${id}`).evaluate((element) => {
    const g = globalThis as unknown as StyleGlobals;
    const bar = g.getComputedStyle(element, '::before');
    const probe = g.document.createElement('div');
    probe.style.background = 'var(--color-primary)';
    g.document.body.append(probe);
    const primary = g.getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { width: bar.width, color: bar.backgroundColor, primary };
  });
}

test('S3 clicking a rail entry navigates and marks only that entry active (AC-3)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await page.getByTestId('rail-voicelab').click();
  await expectActive(page, 'voicelab');
  await page.getByTestId('rail-library').click();
  await expectActive(page, 'library');
});

test('S3 the active entry has a 2 px bar in the primary colour (AC-3)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await page.getByTestId('rail-voicelab').click();
  await expectActive(page, 'voicelab');
  const style = await barStyle(page, 'voicelab');
  expect(style.width).toBe('2px');
  expect(style.color).toBe(style.primary);
});

test('S3 palette and Ctrl+2 navigation mark the entry active too (AC-3)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await openPalette(page);
  await page.getByTestId('palette-input').fill(appearanceText('en', 'module.voicelab.label'));
  await page.getByTestId('palette-module-voicelab').click();
  await expectActive(page, 'voicelab');
  await page.keyboard.press('Control+2');
  await expectActive(page, 'library');
});

test('S3 the crumb is translated and the Home tooltip carries its shortcut (AC-3)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await expect(page.getByTestId('rail-home')).toHaveAttribute('title', `${appearanceText('en', 'module.home.label')} · Ctrl+1`);
  await page.getByTestId('rail-voicelab').click();
  await expect(page.getByTestId('topbar-crumb-module')).toHaveText(appearanceText('en', 'module.voicelab.label'));
  await toggleLanguage(page);
  await expect(page.getByTestId('topbar-crumb-module')).toHaveText(appearanceText('vi', 'module.voicelab.label'));
});

import { test, expect } from '../../support/test.ts';
import { gotoShell, openFirstNovel, REGISTRY_IDS } from '../../support/shell.ts';
import type { Page } from '@playwright/test';

const setHash = (page: Page, route: string) => page.evaluate(`location.hash = '#/${route}'`);

test('S2 registry holds 17 entries and each route opens its module host (AC-58)', async ({ page }) => {
  expect(REGISTRY_IDS).toHaveLength(17);
  await gotoShell(page, { fixture: 'busy', probe: true, hash: 'probe' });
  await openFirstNovel(page);
  for (const id of REGISTRY_IDS) {
    await setHash(page, id);
    await expect(page.getByTestId(`module-host-${id}`)).toBeAttached();
    if (id === 'home') {
      await setHash(page, 'probe');
      await expect(page.getByTestId('probe-open-novel')).toHaveText('none');
      await openFirstNovel(page);
    }
  }
  await setHash(page, 'unknown-module');
  await expect(page.getByTestId('module-host-home')).toBeAttached();
  await expect.poll(() => page.evaluate('location.hash')).toBe('#/home');
});

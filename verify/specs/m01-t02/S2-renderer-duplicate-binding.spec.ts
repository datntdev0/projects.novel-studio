import { expect, test } from '@playwright/test';
import { gotoShell } from '../../support/shell.ts';
import { collectWarnings } from '../../support/shortcuts.ts';

test('S2 a duplicate module binding is refused and logged, the first keeps working (AC-63)', async ({ page }) => {
  const warnings = collectWarnings(page);
  await gotoShell(page, { probe: true, hash: 'probe' });
  await page.keyboard.press('Control+Shift+P');
  await expect(page.getByTestId('probe-last-command')).toHaveText('probe.ping');
  await expect.poll(() => warnings.has('Ctrl+Shift+P', 'scope probe', 'probe.ping-again', 'probe.ping')).toBe(true);
});

test('S2 a duplicate global binding is refused and logged, Ctrl+1 still opens Home (AC-63)', async ({ page }) => {
  const warnings = collectWarnings(page);
  await gotoShell(page, { probe: true, hash: 'probe' });
  await page.keyboard.press('Control+1');
  await expect(page.getByTestId('module-host-home')).toBeAttached();
  await expect.poll(() => warnings.has('Ctrl+1', 'scope global', 'probe.home-again', 'nav.home')).toBe(true);
});

import { expect, test, type Page } from '../../support/test.ts';
import { gotoShell } from '../../support/shell.ts';

const STARTS = ['home', 'settings'];

const OPENERS: Record<string, (page: Page) => Promise<void>> = {
  'statusbar-job click': (page) => page.getByTestId('statusbar-job').click(),
  'Ctrl+Shift+T': (page) => page.keyboard.press('Control+Shift+T'),
};

for (const start of STARTS) {
  for (const [name, open] of Object.entries(OPENERS)) {
    test(`S5 ${name} opens the Task Center from ${start} (AC-44)`, async ({ page }) => {
      await gotoShell(page, { fixture: 'busy', hash: start });
      await open(page);
      await expect(page).toHaveURL(/#\/tasks$/);
      await expect(page.getByTestId('rail-tasks')).toHaveAttribute('aria-current', 'page');
      await expect(page.getByTestId('palette')).not.toBeVisible();
      await expect(page.getByTestId('shortcuts')).not.toBeVisible();
    });
  }
}

test('S5 the job item tooltip carries the Task Center shortcut (AC-44)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await expect(page.getByTestId('statusbar-job')).toHaveAttribute('title', /Ctrl\+Shift\+T/);
});

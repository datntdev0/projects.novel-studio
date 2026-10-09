import { expect, test } from '@playwright/test';
import { appearanceText, type Language } from '../../support/appearance.ts';
import { gotoProbe } from '../../support/palette.ts';
import { openFirstNovel } from '../../support/shell.ts';

const GUARDED = [
  { chord: 'Control+3', moduleId: 'reader' },
  { chord: 'Control+4', moduleId: 'storyworld' },
  { chord: 'Control+5', moduleId: 'translation' },
];

test('S5 novel chords show the open-a-novel-first toast in EN then VI and stay on the probe (AC-34)', async ({ page }) => {
  await gotoProbe(page);
  let toastId = 0;
  const pressAll = async (language: Language): Promise<void> => {
    for (const { chord } of GUARDED) {
      await page.keyboard.press(chord);
      const toast = page.getByTestId(`toast-${++toastId}`);
      await expect(toast).toHaveClass(/info/);
      await expect(toast).toContainText(appearanceText(language, 'shell.openNovelFirst'));
      await expect(page).toHaveURL(/#\/probe$/);
    }
  };
  await pressAll('en');
  await page.keyboard.press('Control+Shift+U');
  await expect(page.getByTestId('probe-open-first-novel')).toBeVisible();
  await pressAll('vi');
});

for (const { chord, moduleId } of GUARDED) {
  test(`S5 ${chord} navigates without a toast once a novel is open (AC-34)`, async ({ page }) => {
    await gotoProbe(page);
    await openFirstNovel(page);
    await page.keyboard.press(chord);
    await expect(page).toHaveURL(new RegExp(`#/${moduleId}$`));
    await expect(page.getByTestId(`module-host-${moduleId}`)).toBeAttached();
    await expect(page.getByTestId('toasts')).not.toContainText(appearanceText('en', 'shell.openNovelFirst'));
  });
}

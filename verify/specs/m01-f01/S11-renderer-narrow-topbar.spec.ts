import { expect, test, type Page } from '../../support/test.ts';
import { appearanceText, toggleLanguage, type Language } from '../../support/appearance.ts';
import { NOVEL_B, openNovelFromPalette } from '../../support/rail.ts';
import { REGISTRY_IDS, gotoShell } from '../../support/shell.ts';

type Metrics = { scrollWidth: number; clientWidth: number };
type MeasureGlobals = { document: { documentElement: Metrics } };

const crumbMetrics = (page: Page): Promise<Metrics> =>
  page.getByTestId('topbar-crumb-module').evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));

const pageMetrics = (page: Page): Promise<Metrics> =>
  page.evaluate(() => {
    const { scrollWidth, clientWidth } = (globalThis as unknown as MeasureGlobals).document.documentElement;
    return { scrollWidth, clientWidth };
  });

const HOME_LAST_IDS = [...REGISTRY_IDS.filter((id) => id !== 'home'), 'home'];

const expectLabelsFit = async (page: Page, language: Language): Promise<void> => {
  await openNovelFromPalette(page, NOVEL_B);
  for (const id of HOME_LAST_IDS) {
    await page.evaluate(`location.hash = '#/${id}'`);
    await expect(page).toHaveURL(new RegExp(`#/${id}$`));
    await expect(page.getByTestId('topbar-crumb-module')).toHaveText(appearanceText(language, `module.${id}.label`));
    const crumb = await crumbMetrics(page);
    expect(crumb.scrollWidth).toBeLessThanOrEqual(crumb.clientWidth);
    const document = await pageMetrics(page);
    expect(document.scrollWidth).toBeLessThanOrEqual(document.clientWidth);
    await expect(page.getByTestId('topbar-novel-count')).toBeHidden();
  }
};

test('S11 the top bar keeps every module label whole at 1280 px and shows the chapter count at 1600 px (AC-11)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await gotoShell(page);
  await expectLabelsFit(page, 'en');
  await toggleLanguage(page);
  await expect(page.getByTestId('topbar-lang')).toHaveText('VI');
  await expectLabelsFit(page, 'vi');

  await openNovelFromPalette(page, NOVEL_B);
  await page.setViewportSize({ width: 1600, height: 900 });
  await expect(page.getByTestId('topbar-novel-count')).toBeVisible();
});
